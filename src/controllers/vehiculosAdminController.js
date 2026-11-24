// ABM de vehículos del panel (/admin/vehiculos)
const { validationResult } = require("express-validator");
const vehiculoService = require("../services/vehiculoService");

const SEGMENTOS = ["Sedán", "Hatchback", "SUV", "Pick-up", "Coupé / Sport", "Utilitario / Familiar", "Moto"];
const FILTROS = ["todos", "publicados", "ocultos", "destacados"];

// Formulario (alta o edición) con los datos y errores que correspondan
function formulario(res, { vehiculo = null, datos, errores = {}, status = 200 }) {
  res.status(status).render("admin/vehiculo-form", {
    titulo: vehiculo ? `Editar ${vehiculo.marca} ${vehiculo.modelo}` : "Nuevo vehículo",
    estilo: ["admin", "admin-vehiculo-form"],
    script: "admin-vehiculo-form",
    seccion: "vehiculos",
    vehiculo,
    datos,
    errores,
    opciones: { ...vehiculoService.OPCIONES, SEGMENTOS },
    MAX_FOTOS: vehiculoService.MAX_FOTOS,
  });
}

// Revisa los datos y las fotos; si algo falla devuelve los errores y borra lo subido
async function revisar(req, idExistente = null) {
  const errores = validationResult(req).mapped();
  if (req.errorImagen) errores.fotos = { msg: req.errorImagen };
  const total = (await vehiculoService.cantidadFotos(idExistente, req.body.quitarImagenes)) + req.files.length;
  if (!errores.fotos && total === 0) errores.fotos = { msg: "Subí al menos una foto" };
  if (!errores.fotos && total > vehiculoService.MAX_FOTOS) errores.fotos = { msg: `Máximo ${vehiculoService.MAX_FOTOS} fotos por vehículo` };
  if (Object.keys(errores).length) await vehiculoService.borrarArchivos(req.files.map((f) => "/img/subidas/" + f.filename));
  return errores;
}

const fotosDelForm = (req) => ({ archivos: req.files, quitar: req.body.quitarImagenes, principal: req.body.principal || "" });

module.exports = {
  async listado(req, res) {
    const estado = FILTROS.includes(req.query.estado) ? req.query.estado : "todos";
    const q = String(req.query.q || "").slice(0, 60);
    const [vehiculos, cuenta] = await Promise.all([vehiculoService.listar({ q, estado }), vehiculoService.contar()]);
    res.render("admin/vehiculos", {
      titulo: "Vehículos",
      estilo: "admin",
      script: "admin-vehiculos",
      seccion: "vehiculos",
      vehiculos,
      cuenta,
      filtro: { q, estado },
    });
  },

  nuevo(req, res) {
    formulario(res, { datos: { condicion: "Usado Seleccionado", transmision: "Automática", combustible: "Nafta", publicado: true } });
  },

  async crear(req, res) {
    const errores = await revisar(req);
    if (Object.keys(errores).length) return formulario(res, { datos: req.body, errores, status: 422 });
    await vehiculoService.crear(req.body, fotosDelForm(req));
    req.session.flash = `${req.body.marca} ${req.body.modelo} se agregó al stock ✓`;
    res.redirect("/admin/vehiculos");
  },

  async editar(req, res, next) {
    const vehiculo = await vehiculoService.porId(req.params.id);
    if (!vehiculo) return next();
    formulario(res, { vehiculo, datos: vehiculo });
  },

  async actualizar(req, res, next) {
    const vehiculo = await vehiculoService.porId(req.params.id);
    if (!vehiculo) return next();
    const errores = await revisar(req, vehiculo.id);
    if (Object.keys(errores).length) return formulario(res, { vehiculo, datos: req.body, errores, status: 422 });
    await vehiculoService.actualizar(vehiculo.id, req.body, fotosDelForm(req));
    req.session.flash = "Cambios guardados ✓";
    res.redirect("/admin/vehiculos");
  },

  async eliminar(req, res) {
    const nombre = await vehiculoService.eliminar(req.params.id);
    req.session.flash = nombre ? `${nombre} se eliminó del stock` : "Ese vehículo ya no existe";
    res.redirect("/admin/vehiculos");
  },

  // PATCH /admin/vehiculos/:id/alternar  { campo: "destacado" | "publicado" }
  async alternar(req, res) {
    const valor = await vehiculoService.alternar(req.params.id, req.body.campo);
    if (valor === null) return res.status(404).json({ ok: false, mensaje: "No se pudo actualizar" });
    res.json({ ok: true, valor });
  },
};
