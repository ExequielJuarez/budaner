// Clientes (/admin/clientes): fotos de las entregas que se ven al final del inicio
const { validationResult } = require("express-validator");
const clienteService = require("../services/clienteService");
const { borrarArchivos } = require("../services/vehiculoService");

async function vista(res, { errores = {}, datos = {}, editando = null, status = 200 } = {}) {
  const [clientes, cuenta] = await Promise.all([clienteService.listar(), clienteService.contar()]);
  res.status(status).render("admin/clientes", {
    titulo: "Clientes",
    estilo: ["admin", "admin-clientes"],
    script: "admin-clientes",
    seccion: "clientes",
    clientes,
    cuenta,
    errores,
    datos,
    editando,
  });
}

// Errores de datos y de la foto; si hay alguno, borra lo que se subió
async function revisar(req, { fotoObligatoria }) {
  const errores = validationResult(req).mapped();
  if (req.errorImagen) errores.foto = { msg: req.errorImagen };
  else if (fotoObligatoria && !req.file) errores.foto = { msg: "Elegí la foto de la entrega" };
  if (Object.keys(errores).length && req.file) await borrarArchivos(["/img/subidas/" + req.file.filename]);
  return errores;
}

module.exports = {
  listado: (req, res) => vista(res),

  async crear(req, res) {
    const errores = await revisar(req, { fotoObligatoria: true });
    if (Object.keys(errores).length) return vista(res, { errores, datos: req.body, status: 422 });
    await clienteService.crear(req.body, "/img/subidas/" + req.file.filename);
    req.session.flash = `Se agregó la entrega de ${req.body.nombre.trim()} ✓`;
    res.redirect("/admin/clientes");
  },

  async actualizar(req, res) {
    const errores = await revisar(req, { fotoObligatoria: false });
    if (Object.keys(errores).length) return vista(res, { errores, datos: req.body, editando: Number(req.params.id), status: 422 });
    const ok = await clienteService.actualizar(req.params.id, req.body, req.file ? "/img/subidas/" + req.file.filename : null);
    req.session.flash = ok ? "Cambios guardados ✓" : "Ese cliente ya no existe";
    res.redirect("/admin/clientes#cliente-" + req.params.id);
  },

  // PATCH /admin/clientes/:id/alternar → mostrar u ocultar en la web
  async alternar(req, res) {
    const valor = await clienteService.alternar(req.params.id);
    if (valor === null) return res.status(404).json({ ok: false, mensaje: "No se pudo actualizar" });
    res.json({ ok: true, valor });
  },

  async eliminar(req, res) {
    const nombre = await clienteService.eliminar(req.params.id);
    req.session.flash = nombre ? `Se eliminó la entrega de ${nombre}` : "Ese cliente ya no existe";
    res.redirect("/admin/clientes");
  },
};
