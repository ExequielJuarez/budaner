// Consultas del formulario "Consultar con asesor"
const ESTADOS = ["nueva", "contactada", "cerrada"];

module.exports = (sequelize, DataTypes) => {
  const Consulta = sequelize.define(
    "Consulta",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(80), allowNull: false },
      telefono: { type: DataTypes.STRING(20), allowNull: false },
      mensaje: { type: DataTypes.STRING(500), allowNull: true },
      motivo: { type: DataTypes.STRING(160), allowNull: false },
      vehiculoId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      estado: { type: DataTypes.ENUM(...ESTADOS), allowNull: false, defaultValue: "nueva" },
    },
    { tableName: "consultas" }
  );

  Consulta.associate = (db) => {
    Consulta.belongsTo(db.Vehiculo, { as: "vehiculo", foreignKey: "vehiculoId" });
  };

  Consulta.ESTADOS = ESTADOS;
  return Consulta;
};
