const { body } = require("express-validator");

module.exports = [
  body("nombre").trim().notEmpty().withMessage("Escribí el nombre del cliente").bail().isLength({ max: 80 }).withMessage("Máximo 80 caracteres"),
  body("vehiculo").optional({ values: "falsy" }).trim().isLength({ max: 80 }).withMessage("Máximo 80 caracteres"),
];
