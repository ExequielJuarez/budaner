require("dotenv").config({ quiet: true });
const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const session = require("express-session");

const app = express();

const indexRouter = require("./routes/index.Routes");
const adminRouter = require("./routes/admin.Routes");
const db = require("./model/database/models");
const ajusteService = require("./services/ajusteService");
const datosConcesionaria = require("./helpers/concesionaria");

// Render (y otros hostings) indican el puerto en PORT
const puerto = Number(process.env.PORT) || 3000;
// Por defecto escucha en todas las interfaces: así también se abre desde el celular
// (misma red Wi-Fi) con la IP de la compu. HOST=127.0.0.1 la deja solo para esta compu.
const host = process.env.HOST || "0.0.0.0";

app.use(express.static(path.join(__dirname, "../public")));
app.get("/favicon.ico", (req, res) => res.redirect(301, "/img/favicon.svg"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// Formularios con PUT / DELETE: action="...?_method=PUT"
app.use(methodOverride("_method"));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Detrás del proxy https de Render: necesario para que la cookie segura funcione
app.set("trust proxy", 1);

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  console.warn("⚠️  Falta SESSION_SECRET en las variables de entorno: usá una clave larga y secreta.");
}

app.use(
  session({
    name: "budaner.sid",
    secret: process.env.SESSION_SECRET || "clave-solo-para-desarrollo-local",
    resave: false,
    saveUninitialized: false,
    // "auto": cookie segura cuando la página se sirve por https, normal en localhost
    cookie: { secure: "auto", httpOnly: true, sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 },
  })
);

// Helpers disponibles en todas las vistas
const formato = require("./helpers/formato");
app.locals.formatoPrecio = formato.precio;
app.locals.formatoKm = formato.km;
app.locals.icono = require("./helpers/iconos");
// Texto del motivo de consulta para una unidad: "2024 Ford Ranger XLT 4x4 ($ 43.500)"
app.locals.motivoVehiculo = (v) => `${v.anio} ${v.marca} ${v.modelo} (${formato.precio(v.precio)})`;
app.locals.formatoFecha = (fecha, conHora = true) =>
  new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });

// Datos de la concesionaria (WhatsApp, horarios, portada...) editables desde el panel
app.use(async (req, res, next) => {
  res.locals.concesionaria = datosConcesionaria(await ajusteService.datos());
  next();
});

app.use("/admin", adminRouter);
app.use("/", indexRouter);

// Página que no existe
app.use((req, res) => {
  if (req.accepts(["html", "json"]) === "json") return res.status(404).json({ ok: false, mensaje: "No encontrado" });
  res.status(404).render("error", {
    titulo: "Página no encontrada",
    estilo: "error",
    mensaje: "La página que buscás no existe o cambió de lugar.",
    codigo: 404,
  });
});

// Error inesperado (por ejemplo, se cayó la base de datos)
app.use((err, req, res, next) => {
  console.error("❌", err);
  if (req.accepts(["html", "json"]) === "json") {
    return res.status(500).json({ ok: false, mensaje: "Error del servidor, probá de nuevo" });
  }
  res.status(500).render(
    "error",
    { titulo: "Algo salió mal", estilo: "error", mensaje: "Tuvimos un problema. Probá de nuevo en unos minutos.", codigo: 500 },
    (error, html) => res.send(error ? "<h1>Algo salió mal</h1><p>Probá de nuevo en unos minutos.</p>" : html)
  );
});

// Arranca solo si hay conexión con la base de datos
db.sequelize
  .authenticate()
  // Si la base es de una versión anterior, agrega lo que falte (no borra nada)
  .then(() => require("./model/database/actualizar")())
  .then(() => db.Vehiculo.count())
  .then(() => {
    console.log(`✅ Conectado a la base de datos "${db.sequelize.config.database}"`);
    app.listen(puerto, host, () => {
      console.log(`🚗 Budaner Automotores corriendo en el puerto ${puerto}`);
      console.log(`   🔐 Panel de administración: http://localhost:${puerto}/admin`);
      require("./helpers/red").avisoDeArranque(puerto, host).forEach((linea) => console.log(linea));
    });
  })
  .catch((error) => {
    console.error("❌ No se pudo conectar con la base de datos:", error.message);
    console.error("   Revisá DB_HOST, DB_USER, DB_PASSWORD y DB_NAME en el .env y que MySQL esté encendido.");
    console.error("   Para crear las tablas y cargar el stock inicial: npm run db:instalar");
    process.exit(1);
  });
