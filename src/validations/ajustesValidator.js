const { body } = require("express-validator");

module.exports = {
  datos: [
    body("whatsapp")
      .trim()
      .notEmpty()
      .withMessage("Poné el número de WhatsApp")
      .bail()
      .customSanitizer((v) => v.replace(/\D/g, ""))
      .isLength({ min: 10, max: 15 })
      .withMessage("Con código de país y área, solo números. Ej: 5493815550192"),
    body("horarios").trim().notEmpty().withMessage("Escribí los horarios").bail().isLength({ max: 160 }).withMessage("Máximo 160 caracteres"),
    body("ciudad").trim().notEmpty().withMessage("Escribí la ciudad").bail().isLength({ max: 80 }).withMessage("Máximo 80 caracteres"),
    body("instagram")
      .optional({ values: "falsy" })
      .trim()
      .isURL({ protocols: ["https"], require_protocol: true })
      .withMessage("Pegá el link completo, ej: https://www.instagram.com/budaner"),
  ],
  clave: [
    body("actual").notEmpty().withMessage("Escribí tu contraseña actual"),
    body("nueva").isLength({ min: 8 }).withMessage("Mínimo 8 caracteres"),
    body("repetir").custom((v, { req }) => v === req.body.nueva).withMessage("Las contraseñas no coinciden"),
  ],
};
