// Ajustes (/admin/ajustes): datos de la concesionaria, portada (foto y video) y contraseña
const { validationResult } = require("express-validator");
const ajusteService = require("../services/ajusteService");
const usuarioService = require("../services/usuarioService");
const { borrarArchivos } = require("../services/vehiculoService");
const { MAX_MB } = require("../middlewares/subirImagenes");

async function vista(res, { datos, errores = {}, erroresClave = {}, status = 200 } = {}) {
  const actuales = await ajusteService.datos();
  res.status(status).render("admin/ajustes", {
    titulo: "Ajustes",
    estilo: ["admin", "admin-ajustes"],
    script: "admin-ajustes",
    seccion: "ajustes",
    datos: datos || actuales,
    portadaActual: actuales.portada,
    videoActual: actuales.video,
    errores,
    erroresClave,
  });
}

module.exports = {
  ver: (req, res) => vista(res),

  async guardar(req, res) {
    const foto = req.files?.portada?.[0];
    const video = req.files?.video?.[0];
    const subidos = [foto, video].filter(Boolean).map((f) => "/img/subidas/" + f.filename);

    const errores = validationResult(req).mapped();
    if (req.errorImagen) errores.portada = { msg: req.errorImagen };
    if (foto && foto.size > MAX_MB * 1024 * 1024) errores.portada = { msg: `La foto puede pesar hasta ${MAX_MB} MB` };
    if (Object.keys(errores).length) {
      await borrarArchivos(subidos);
      return vista(res, { datos: req.body, errores, status: 422 });
    }

    const cambios = {
      whatsapp: req.body.whatsapp,
      horarios: req.body.horarios,
      ciudad: req.body.ciudad,
      instagram: req.body.instagram || "",
    };
    if (foto) cambios.portada = "/img/subidas/" + foto.filename;
    else if (req.body.quitarPortada) cambios.portada = "";
    if (video) cambios.video = "/img/subidas/" + video.filename;
    else if (req.body.quitarVideo) cambios.video = "";

    await ajusteService.guardar(cambios);
    req.session.flash = "Ajustes guardados ✓";
    res.redirect("/admin/ajustes");
  },

  async cambiarClave(req, res) {
    const erroresClave = validationResult(req).mapped();
    if (!Object.keys(erroresClave).length) {
      const ok = await usuarioService.cambiarClave(req.session.admin.id, req.body.actual, req.body.nueva);
      if (!ok) erroresClave.actual = { msg: "La contraseña actual no es correcta" };
    }
    if (Object.keys(erroresClave).length) return vista(res, { erroresClave, status: 422 });
    req.session.flash = "Contraseña actualizada ✓";
    res.redirect("/admin/ajustes");
  },
};
