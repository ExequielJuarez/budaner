// Si la base es de una versión anterior, crea las tablas que falten (no borra nada).
// Se ejecuta al arrancar la app.
const db = require("./models");

module.exports = async () => {
  // Versión anterior: se entraba con "email"; ahora la columna se llama "usuario"
  const columnas = await db.sequelize.getQueryInterface().describeTable("usuarios");
  if (columnas.email && !columnas.usuario) {
    await db.sequelize.query("ALTER TABLE usuarios RENAME COLUMN email TO usuario");
    console.log('🆕 La columna "email" de usuarios ahora se llama "usuario"');
  }

  const tablas = (await db.sequelize.getQueryInterface().showAllTables()).map((t) => (typeof t === "string" ? t : t.tableName));
  if (!tablas.includes("clientes")) {
    await db.sequelize.query(`
      CREATE TABLE clientes (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(80) NOT NULL,
        vehiculo VARCHAR(80) NULL,
        foto VARCHAR(200) NOT NULL,
        publicado TINYINT(1) NOT NULL DEFAULT 1,
        creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_clientes_publicado (publicado, creado_en)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    console.log('🆕 Se creó la tabla "clientes"');
  }
};
