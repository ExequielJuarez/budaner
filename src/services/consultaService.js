// Consultas que llegan desde "Consultar con asesor"
const db = require("../model/database/models");

const ESTADOS = db.Consulta.ESTADOS;

module.exports = {
  ESTADOS,

  async crear({ nombre, telefono, mensaje, motivo, vehiculoId }) {
    // Solo se vincula si el vehículo existe
    const id = Number(vehiculoId) || null;
    const vehiculo = id ? await db.Vehiculo.findByPk(id, { attributes: ["id"] }) : null;
    return db.Consulta.create({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      mensaje: (mensaje || "").trim() || null,
      motivo: motivo.trim(),
      vehiculoId: vehiculo ? vehiculo.id : null,
    });
  },

  async listar({ estado = "" } = {}) {
    const where = ESTADOS.includes(estado) ? { estado } : {};
    return db.Consulta.findAll({
      where,
      include: [{ model: db.Vehiculo, as: "vehiculo", attributes: ["id", "marca", "modelo", "anio"] }],
      order: [["creado_en", "DESC"]],
      limit: 300,
    });
  },

  async recientes(cantidad = 5) {
    return db.Consulta.findAll({ order: [["creado_en", "DESC"]], limit: cantidad });
  },

  async contar() {
    const filas = await db.Consulta.findAll({
      attributes: ["estado", [db.sequelize.fn("COUNT", db.sequelize.col("id")), "n"]],
      group: ["estado"],
      raw: true,
    });
    const cuenta = Object.fromEntries(ESTADOS.map((e) => [e, 0]));
    filas.forEach((f) => (cuenta[f.estado] = Number(f.n)));
    cuenta.total = ESTADOS.reduce((s, e) => s + cuenta[e], 0);
    return cuenta;
  },

  nuevas: () => db.Consulta.count({ where: { estado: "nueva" } }),

  async cambiarEstado(id, estado) {
    if (!ESTADOS.includes(estado)) return false;
    const [filas] = await db.Consulta.update({ estado }, { where: { id } });
    return filas > 0;
  },

  async eliminar(id) {
    return (await db.Consulta.destroy({ where: { id } })) > 0;
  },
};
