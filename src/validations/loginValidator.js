const { body } = require("express-validator");

module.exports = [
  body("usuario").trim().notEmpty().withMessage("Escribí tu usuario").bail().isLength({ max: 120 }).withMessage("Usuario demasiado largo"),
  body("clave").notEmpty().withMessage("Escribí tu contraseña"),
];
