// Stock de vehículos: lo que ve la web (solo publicados) y el ABM del panel.
const fs = require("fs/promises");
const path = require("path");
const { Op } = require("sequelize");
const db = require("../model/database/models");

// Cuántas unidades se ven en la vista previa antes de tocar "Ver todo"
const VISTA_PREVIA = 6;
// Máximo de fotos por vehículo
const MAX_FOTOS = 10;
// Carpeta de las fotos que se suben desde el panel (las del stock inicial están en /img/vehiculos)
const CARPETA_SUBIDAS = "/img/subidas/";
const PUBLIC = path.join(__dirname, "../../public");

const conImagenes = { model: db.VehiculoImagen, as: "imagenes", attributes: ["id", "ruta", "orden"] };
const ordenImagenes = [{ model: db.VehiculoImagen, as: "imagenes" }, "orden", "ASC"];

// Pasa el modelo a un objeto simple con la foto principal a mano
function plano(v) {
  const o = v.get({ plain: true });
  o.imagenes = (o.imagenes || []).sort((a, b) => a.orden - b.orden || a.id - b.id);
  o.imagen = o.imagenes[0]?.ruta || "/img/sin-foto.svg";
  return o;
}

// Borra del disco las fotos subidas desde el panel (nunca las del stock inicial)
async function borrarArchivos(rutas) {
  for (const ruta of rutas) {
    if (!String(ruta).startsWith(CARPETA_SUBIDAS)) continue;
    await fs.unlink(path.join(PUBLIC, ruta)).catch(() => {});
  }
}

// Datos del formulario → columnas de la tabla
function columnas(datos) {
  return {
    marca: datos.marca.trim(),
    modelo: datos.modelo.trim(),
    anio: Number(datos.anio),
    segmento: datos.segmento.trim(),
    condicion: datos.condicion,
    km: datos.condicion === "0km" ? 0 : Number(datos.km) || 0,
    transmision: datos.transmision,
    combustible: datos.combustible,
    precio: Number(datos.precio),
    descripcion: (datos.descripcion || "").trim() || null,
    destacado: Boolean(datos.destacado),
    publicado: Boolean(datos.publicado),
  };
}

// Ordena las fotos: la elegida como principal queda primera.
// principal = "e-<id>" (foto que ya estaba) o "n-<índice>" (foto nueva del formulario)
async function guardarFotos(vehiculo, { archivos = [], quitar = [], principal = "" }, transaccion) {
  const quitarIds = [].concat(quitar).map(Number).filter(Boolean);
  const actuales = await db.VehiculoImagen.findAll({ where: { vehiculoId: vehiculo.id }, order: [["orden", "ASC"], ["id", "ASC"]], transaction: transaccion });

  const borradas = actuales.filter((img) => quitarIds.includes(img.id));
  if (borradas.length) await db.VehiculoImagen.destroy({ where: { id: borradas.map((i) => i.id) }, transaction: transaccion });

  const nuevas = [];
  for (const archivo of archivos) {
    nuevas.push(await db.VehiculoImagen.create({ vehiculoId: vehiculo.id, ruta: CARPETA_SUBIDAS + archivo.filename, orden: 999 }, { transaction: transaccion }));
  }

  const quedan = [...actuales.filter((img) => !quitarIds.includes(img.id)), ...nuevas];
  let elegida = null;
  if (/^e-\d+$/.test(principal)) elegida = quedan.find((img) => img.id === Number(principal.slice(2)));
  if (/^n-\d+$/.test(principal)) elegida = nuevas[Number(principal.slice(2))];
  const ordenadas = elegida ? [elegida, ...quedan.filter((img) => img !== elegida)] : quedan;

  for (const [i, img] of ordenadas.entries()) {
    if (img.orden !== i) await img.update({ orden: i }, { transaction: transaccion });
  }
  return borradas.map((img) => img.ruta);
}

module.exports = {
  VISTA_PREVIA,
  MAX_FOTOS,
  OPCIONES: db.Vehiculo.OPCIONES,
  borrarArchivos,

  // ── Web pública ─────────────────────────────────────────
  // Publicados, primero los destacados (igual que "Orden: destacados")
  async publicados() {
    const lista = await db.Vehiculo.findAll({
      where: { publicado: true },
      include: [conImagenes],
      order: [["destacado", "DESC"], ["id", "ASC"], ordenImagenes],
    });
    return lista.map(plano);
  },

  // Listas para armar los filtros (solo lo que hay publicado)
  opciones(lista) {
    const marcas = [...new Set(lista.map((v) => v.marca))].sort();
    const anios = lista.map((v) => v.anio);
    const desde = anios.length ? Math.min(...anios) : new Date().getFullYear();
    const hasta = anios.length ? Math.max(...anios) : desde;
    return {
      marcas,
      anios: Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i),
      ordenes: [
        { valor: "destacados", texto: "Orden: destacados" },
        { valor: "nuevos", texto: "Orden: más nuevos primero" },
        { valor: "precio-asc", texto: "Orden: menor precio" },
        { valor: "precio-desc", texto: "Orden: mayor precio" },
      ],
    };
  },

  // ── Panel ───────────────────────────────────────────────
  // Listado con búsqueda y filtro: todos | publicados | ocultos | destacados
  async listar({ q = "", estado = "todos" } = {}) {
    const where = {};
    const texto = String(q).trim().slice(0, 60);
    if (texto) {
      where[Op.or] = [
        { marca: { [Op.like]: `%${texto}%` } },
        { modelo: { [Op.like]: `%${texto}%` } },
        { segmento: { [Op.like]: `%${texto}%` } },
      ];
    }
    if (estado === "publicados") where.publicado = true;
    if (estado === "ocultos") where.publicado = false;
    if (estado === "destacados") where.destacado = true;
    const lista = await db.Vehiculo.findAll({ where, include: [conImagenes], order: [["id", "DESC"], ordenImagenes] });
    return lista.map(plano);
  },

  async contar() {
    const [total, publicados, destacados] = await Promise.all([
      db.Vehiculo.count(),
      db.Vehiculo.count({ where: { publicado: true } }),
      db.Vehiculo.count({ where: { publicado: true, destacado: true } }),
    ]);
    return { total, publicados, ocultos: total - publicados, destacados };
  },

  async porId(id) {
    const v = await db.Vehiculo.findByPk(id, { include: [conImagenes], order: [ordenImagenes] });
    return v ? plano(v) : null;
  },

  async crear(datos, fotos) {
    const vehiculo = await db.sequelize.transaction(async (t) => {
      const v = await db.Vehiculo.create(columnas(datos), { transaction: t });
      await guardarFotos(v, fotos, t);
      return v;
    });
    return vehiculo.id;
  },

  async actualizar(id, datos, fotos) {
    const vehiculo = await db.Vehiculo.findByPk(id);
    if (!vehiculo) return false;
    const borradas = await db.sequelize.transaction(async (t) => {
      await vehiculo.update(columnas(datos), { transaction: t });
      return guardarFotos(vehiculo, fotos, t);
    });
    await borrarArchivos(borradas);
    return true;
  },

  async eliminar(id) {
    const vehiculo = await db.Vehiculo.findByPk(id, { include: [conImagenes] });
    if (!vehiculo) return null;
    const rutas = vehiculo.imagenes.map((i) => i.ruta);
    const nombre = `${vehiculo.marca} ${vehiculo.modelo}`;
    await vehiculo.destroy();
    await borrarArchivos(rutas);
    return nombre;
  },

  // Prende/apaga "destacado" o "publicado" desde el listado
  async alternar(id, campo) {
    if (!["destacado", "publicado"].includes(campo)) return null;
    const vehiculo = await db.Vehiculo.findByPk(id);
    if (!vehiculo) return null;
    await vehiculo.update({ [campo]: !vehiculo[campo] });
    return vehiculo[campo];
  },

  // Cuántas fotos quedarían después de guardar (para validar)
  async cantidadFotos(id, quitar = []) {
    if (!id) return 0;
    const quitarIds = [].concat(quitar).map(Number);
    const fotos = await db.VehiculoImagen.findAll({ where: { vehiculoId: id }, attributes: ["id"] });
    return fotos.filter((f) => !quitarIds.includes(f.id)).length;
  },
};
