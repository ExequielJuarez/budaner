const vehiculoService = require("../services/vehiculoService");
const clienteService = require("../services/clienteService");

module.exports = {
  async inicio(req, res) {
    const [vehiculos, clientes] = await Promise.all([vehiculoService.publicados(), clienteService.publicados()]);
    res.render("inicio", {
      titulo: "Concesionaria Automotor",
      estilo: "inicio",
      script: "inicio",
      destacados: vehiculos.filter((v) => v.destacado),
      vehiculos,
      clientes,
      vistaPrevia: vehiculoService.VISTA_PREVIA,
      opciones: vehiculoService.opciones(vehiculos),
    });
  },
};
