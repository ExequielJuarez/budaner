// Clientes: foto de la entrega + nombre + vehículo que se llevaron
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Cliente",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(80), allowNull: false },
      vehiculo: { type: DataTypes.STRING(80), allowNull: true },
      foto: { type: DataTypes.STRING(200), allowNull: false },
      publicado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "clientes" }
  );
