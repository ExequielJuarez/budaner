// Consultas recibidas (/admin/consultas)
const consultaService = require("../services/consultaService");

module.exports = {
  async listado(req, res) {
    const estado = consultaService.ESTADOS.includes(req.query.estado) ? req.query.estado : "";
    const [consultas, cuenta] = await Promise.all([consultaService.listar({ estado }), consultaService.contar()]);
    res.render("admin/consultas", {
      titulo: "Consultas",
      estilo: "admin",
      script: "admin-consultas",
      seccion: "consultas",
      consultas,
      cuenta,
      estado,
      ESTADOS: consultaService.ESTADOS,
    });
  },

  // PATCH /admin/consultas/:id  { estado }
  async cambiarEstado(req, res) {
    const ok = await consultaService.cambiarEstado(req.params.id, req.body.estado);
    if (!ok) return res.status(400).json({ ok: false, mensaje: "No se pudo cambiar el estado" });
    res.json({ ok: true, nuevas: await consultaService.nuevas() });
  },

  async eliminar(req, res) {
    const ok = await consultaService.eliminar(req.params.id);
    if (req.accepts(["html", "json"]) === "json") return res.status(ok ? 200 : 404).json({ ok, nuevas: await consultaService.nuevas() });
    req.session.flash = ok ? "Consulta eliminada" : "Esa consulta ya no existe";
    res.redirect("/admin/consultas");
  },
};
