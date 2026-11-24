// Solo deja pasar a un administrador con sesión iniciada.
// Si no inició sesión lo manda al login (y después vuelve a donde quería ir).
module.exports = (req, res, next) => {
  if (req.session.admin) return next();
  if (req.accepts(["html", "json"]) === "json") {
    return res.status(401).json({ ok: false, mensaje: "Tu sesión terminó. Volvé a iniciar sesión." });
  }
  const volver = req.method === "GET" ? req.originalUrl : "/admin";
  res.redirect(`/admin/login?volver=${encodeURIComponent(volver)}`);
};
