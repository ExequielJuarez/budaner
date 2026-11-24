// Datos de la concesionaria editables desde el panel (clave → valor)
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Ajuste",
    {
      clave: { type: DataTypes.STRING(40), primaryKey: true },
      valor: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: "ajustes", timestamps: false }
  );
