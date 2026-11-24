const { validationResult } = require("express-validator");
const consultaService = require("../services/consultaService");

module.exports = {
  // POST /consultas → formulario "Consultar con asesor".
  // Se guarda en la base (el admin la ve en /admin/consultas) y se devuelve el link
  // de WhatsApp con el mensaje armado para seguir la charla.
  async crear(req, res) {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(422).json({ ok: false, errores: errores.mapped() });
    }
    const { nombre, telefono, mensaje, motivo, vehiculoId } = req.body;
    await consultaService.crear({ nombre, telefono, mensaje, motivo, vehiculoId });
    console.log(`📩 Nueva consulta: ${nombre} (${telefono}) · ${motivo}`);

    const { whatsapp, nombre: concesionaria } = res.locals.concesionaria;
    const texto = `Hola ${concesionaria}! Soy ${nombre.trim()}, quiero consultar con un asesor por: ${motivo.trim()}.${mensaje ? " " + mensaje.trim() : ""}`;
    res.json({ ok: true, whatsapp: whatsapp(texto) });
  },
};
