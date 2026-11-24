// Unidades del stock. "destacado" las muestra en el carrusel; "publicado" en false las oculta de la web.
const CONDICIONES = ["Usado Seleccionado", "0km"];
const TRANSMISIONES = ["Automática", "Manual"];
const COMBUSTIBLES = ["Nafta", "Diésel", "Híbrido", "Eléctrico", "GNC"];

module.exports = (sequelize, DataTypes) => {
  const Vehiculo = sequelize.define(
    "Vehiculo",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      marca: { type: DataTypes.STRING(40), allowNull: false },
      modelo: { type: DataTypes.STRING(80), allowNull: false },
      anio: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false },
      segmento: { type: DataTypes.STRING(40), allowNull: false },
      condicion: { type: DataTypes.ENUM(...CONDICIONES), allowNull: false, defaultValue: CONDICIONES[0] },
      km: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      transmision: { type: DataTypes.ENUM(...TRANSMISIONES), allowNull: false, defaultValue: TRANSMISIONES[0] },
      combustible: { type: DataTypes.ENUM(...COMBUSTIBLES), allowNull: false, defaultValue: COMBUSTIBLES[0] },
      precio: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      descripcion: { type: DataTypes.TEXT, allowNull: true },
      destacado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      publicado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: "vehiculos" }
  );

  Vehiculo.associate = (db) => {
    Vehiculo.hasMany(db.VehiculoImagen, { as: "imagenes", foreignKey: "vehiculoId", onDelete: "CASCADE" });
    Vehiculo.hasMany(db.Consulta, { as: "consultas", foreignKey: "vehiculoId" });
  };

  Vehiculo.OPCIONES = { CONDICIONES, TRANSMISIONES, COMBUSTIBLES };
  return Vehiculo;
};
