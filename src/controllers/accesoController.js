// Inicio y cierre de sesión del panel (/admin/login)
const { validationResult } = require("express-validator");
const usuarioService = require("../services/usuarioService");

// Freno a la fuerza bruta: 5 intentos fallidos por IP cada 15 minutos
const INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const fallidos = new Map();

function bloqueado(ip) {
  const r = fallidos.get(ip);
  if (!r) return false;
  if (Date.now() > r.hasta) return fallidos.delete(ip) && false;
  return r.n >= INTENTOS;
}
function sumarFallo(ip) {
  const r = fallidos.get(ip);
  if (!r || Date.now() > r.hasta) fallidos.set(ip, { n: 1, hasta: Date.now() + VENTANA_MS });
  else r.n++;
}

// Solo se vuelve a rutas internas del panel (evita redirecciones a otros sitios)
const destinoSeguro = (url) => (typeof url === "string" && url.startsWith("/admin") && !url.startsWith("//") ? url : "/admin");

const vista = (res, extra = {}) =>
  res.render("admin/login", { titulo: "Ingresar al panel", estilo: "admin-login", errores: {}, datos: {}, volver: "/admin", ...extra });

module.exports = {
  ver(req, res) {
    vista(res, { volver: destinoSeguro(req.query.volver) });
  },

  async ingresar(req, res) {
    const volver = destinoSeguro(req.body.volver);
    const datos = { usuario: req.body.usuario || "" };

    if (bloqueado(req.ip)) {
      return res.status(429).render("admin/login", {
        titulo: "Ingresar al panel", estilo: "admin-login", datos, volver, errores: {},
        aviso: "Demasiados intentos. Esperá 15 minutos y probá de nuevo.",
      });
    }

    const errores = validationResult(req);
    if (!errores.isEmpty()) return vista(res.status(422), { datos, volver, errores: errores.mapped() });

    const admin = await usuarioService.verificar(req.body.usuario, req.body.clave);
    if (!admin) {
      sumarFallo(req.ip);
      return vista(res.status(401), { datos, volver, aviso: "Usuario o contraseña incorrectos." });
    }

    fallidos.delete(req.ip);
    // Sesión nueva al entrar (evita fijación de sesión)
    req.session.regenerate((err) => {
      if (err) return vista(res.status(500), { datos, volver, aviso: "No pudimos iniciar sesión, probá de nuevo." });
      req.session.admin = admin;
      req.session.flash = `¡Hola, ${admin.nombre}!`;
      req.session.save(() => res.redirect(volver));
    });
  },

  salir(req, res) {
    req.session.destroy(() => {
      res.clearCookie("budaner.sid");
      res.redirect("/admin/login");
    });
  },
};
