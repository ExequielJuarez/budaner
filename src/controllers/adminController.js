// Resumen del panel (/admin)
const vehiculoService = require("../services/vehiculoService");
const consultaService = require("../services/consultaService");

module.exports = {
  async resumen(req, res) {
    const [stock, consultas, recientes, ultimos] = await Promise.all([
      vehiculoService.contar(),
      consultaService.contar(),
      consultaService.recientes(6),
      vehiculoService.listar(),
    ]);
    res.render("admin/resumen", {
      titulo: "Resumen",
      estilo: "admin",
      seccion: "resumen",
      stock,
      consultas,
      recientes,
      ultimos: ultimos.slice(0, 5),
    });
  },
};
