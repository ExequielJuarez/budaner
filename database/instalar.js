// Crea la base de datos, las tablas y carga el stock inicial + el primer administrador.
// Usa los datos de conexión del .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME...).
//
//   npm run db:instalar            → estructura + stock inicial + administrador
//   npm run db:instalar -- --vacia → estructura + administrador, sin vehículos
//
// ATENCIÓN: borra y vuelve a crear todas las tablas de DB_NAME.

require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const DB = process.env.DB_NAME || "budaner_automotores";
const ZONA = process.env.DB_TIMEZONE || "-03:00";
const sinVehiculos = process.argv.includes("--vacia");

// El .sql usa "budaner_automotores"; si el .env pide otro nombre, se reemplaza
const schema = fs
  .readFileSync(path.join(__dirname, "schema.sql"), "utf8")
  .replace(/\bbudaner_automotores\b/g, `\`${DB}\``)
  .replace(/SET time_zone = '[^']*'/g, `SET time_zone = '${ZONA}'`);

(async () => {
  const admin = {
    nombre: process.env.ADMIN_NOMBRE || "Administrador",
    usuario: (process.env.ADMIN_USUARIO || "").trim().toLowerCase(),
    clave: process.env.ADMIN_PASSWORD || "",
  };
  if (!admin.usuario || admin.clave.length < 8) {
    console.error("❌ Completá ADMIN_USUARIO y ADMIN_PASSWORD (mínimo 8 caracteres) en el .env antes de instalar.");
    process.exit(1);
  }

  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || undefined,
    multipleStatements: true,
    charset: "utf8mb4",
  });

  try {
    console.log(`→ Creando estructura en "${DB}"…`);
    await conexion.query(schema);

    console.log(`→ Creando el administrador "${admin.usuario}"…`);
    await conexion.query("INSERT INTO usuarios (nombre, usuario, clave) VALUES (?, ?, ?)", [
      admin.nombre,
      admin.usuario,
      await bcrypt.hash(admin.clave, 10),
    ]);

    if (!sinVehiculos) {
      console.log("→ Cargando el stock inicial…");
      for (const v of require("./semilla-vehiculos")) {
        const [r] = await conexion.query(
          `INSERT INTO vehiculos (marca, modelo, anio, segmento, condicion, km, transmision, combustible, precio, descripcion, destacado, publicado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [v.marca, v.modelo, v.anio, v.segmento, v.condicion, v.km, v.transmision, v.combustible, v.precio, v.descripcion, v.destacado ? 1 : 0]
        );
        await conexion.query("INSERT INTO vehiculo_imagenes (vehiculo_id, ruta, orden) VALUES (?, ?, 0)", [r.insertId, v.imagen]);
      }

      console.log("→ Cargando las entregas de clientes…");
      for (const [i, c] of require("./semilla-clientes").entries()) {
        await conexion.query(
          "INSERT INTO clientes (nombre, vehiculo, foto, creado_en) VALUES (?, ?, ?, NOW() - INTERVAL ? MINUTE)",
          [c.nombre, c.vehiculo, c.foto, 10 - i]
        );
      }
    }

    const [tablas] = await conexion.query(
      `SELECT table_name AS tabla, table_rows AS filas FROM information_schema.tables
       WHERE table_schema = ? ORDER BY table_name`,
      [DB]
    );
    console.table(tablas);
    console.log("✅ Base de datos lista. Entrá al panel en /admin con ADMIN_USUARIO y ADMIN_PASSWORD del .env");
  } catch (error) {
    console.error("❌ No se pudo instalar la base de datos:", error.message);
    process.exitCode = 1;
  } finally {
    await conexion.end();
  }
})();
