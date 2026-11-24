// Fotos de un vehículo. La de orden 0 es la principal (la de la tarjeta).
module.exports = (sequelize, DataTypes) => {
  const VehiculoImagen = sequelize.define(
    "VehiculoImagen",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      vehiculoId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      ruta: { type: DataTypes.STRING(200), allowNull: false },
      orden: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
    },
    { tableName: "vehiculo_imagenes", timestamps: false }
  );

  VehiculoImagen.associate = (db) => {
    VehiculoImagen.belongsTo(db.Vehiculo, { as: "vehiculo", foreignKey: "vehiculoId" });
  };

  return VehiculoImagen;
};
