// El login solo tiene sentido sin sesión: si ya entró, va directo al panel
module.exports = (req, res, next) => (req.session.admin ? res.redirect("/admin") : next());
