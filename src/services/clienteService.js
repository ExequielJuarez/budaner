// Clientes: fotos de las entregas que se muestran al final del inicio
const db = require("../model/database/models");
const { borrarArchivos } = require("./vehiculoService");

const limpiar = (t, max) => String(t || "").trim().slice(0, max);

module.exports = {
  publicados: () => db.Cliente.findAll({ where: { publicado: true }, order: [["creado_en", "DESC"], ["id", "DESC"]], raw: true }),

  listar: () => db.Cliente.findAll({ order: [["creado_en", "DESC"], ["id", "DESC"]], raw: true }),

  async contar() {
    const [total, publicados] = await Promise.all([db.Cliente.count(), db.Cliente.count({ where: { publicado: true } })]);
    return { total, publicados };
  },

  crear: ({ nombre, vehiculo }, foto) =>
    db.Cliente.create({ nombre: limpiar(nombre, 80), vehiculo: limpiar(vehiculo, 80) || null, foto, publicado: true }),

  // Cambia nombre y vehículo; si viene una foto nueva, reemplaza la anterior
  async actualizar(id, { nombre, vehiculo }, foto = null) {
    const cliente = await db.Cliente.findByPk(id);
    if (!cliente) return false;
    const anterior = cliente.foto;
    await cliente.update({ nombre: limpiar(nombre, 80), vehiculo: limpiar(vehiculo, 80) || null, ...(foto ? { foto } : {}) });
    if (foto && anterior !== foto) await borrarArchivos([anterior]);
    return true;
  },

  async alternar(id) {
    const cliente = await db.Cliente.findByPk(id);
    if (!cliente) return null;
    await cliente.update({ publicado: !cliente.publicado });
    return cliente.publicado;
  },

  async eliminar(id) {
    const cliente = await db.Cliente.findByPk(id);
    if (!cliente) return null;
    await cliente.destroy();
    await borrarArchivos([cliente.foto]);
    return cliente.nombre;
  },
};
