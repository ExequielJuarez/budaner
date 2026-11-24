const { body } = require("express-validator");
const { OPCIONES } = require("../services/vehiculoService");

const anioMax = () => new Date().getFullYear() + 1;

module.exports = [
  body("marca").trim().notEmpty().withMessage("Escribí la marca").bail().isLength({ max: 40 }).withMessage("Máximo 40 caracteres"),
  body("modelo").trim().notEmpty().withMessage("Escribí el modelo y la versión").bail().isLength({ max: 80 }).withMessage("Máximo 80 caracteres"),
  body("anio")
    .trim()
    .notEmpty()
    .withMessage("Poné el año")
    .bail()
    .custom((v) => Number.isInteger(Number(v)) && Number(v) >= 1950 && Number(v) <= anioMax())
    .withMessage(`El año va de 1950 a ${anioMax()}`),
  body("segmento").trim().notEmpty().withMessage("Elegí o escribí el segmento").bail().isLength({ max: 40 }).withMessage("Máximo 40 caracteres"),
  body("condicion").isIn(OPCIONES.CONDICIONES).withMessage("Elegí la condición"),
  body("km")
    .if((v, { req }) => req.body.condicion !== "0km")
    .trim()
    .notEmpty()
    .withMessage("Poné los kilómetros")
    .bail()
    .isInt({ min: 0, max: 2000000 })
    .withMessage("Kilómetros inválidos (solo números)"),
  body("transmision").isIn(OPCIONES.TRANSMISIONES).withMessage("Elegí la transmisión"),
  body("combustible").isIn(OPCIONES.COMBUSTIBLES).withMessage("Elegí el combustible"),
  body("precio").trim().notEmpty().withMessage("Poné el precio").bail().isInt({ min: 1, max: 999999999 }).withMessage("Precio inválido (solo números, sin puntos)"),
  body("descripcion").optional({ values: "falsy" }).trim().isLength({ max: 1000 }).withMessage("Máximo 1000 caracteres"),
];
