// Administradores del panel (/admin). Se entra con "usuario" y contraseña.
module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    "Usuario",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      nombre: { type: DataTypes.STRING(80), allowNull: false },
      usuario: { type: DataTypes.STRING(120), allowNull: false, unique: true },
      clave: { type: DataTypes.STRING(100), allowNull: false },
    },
    { tableName: "usuarios" }
  );
