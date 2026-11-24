// Datos de la concesionaria editables desde el panel (Ajustes).
// Se guardan en la tabla "ajustes" y se mantienen en memoria para no consultar la base en cada página.
const fs = require("fs/promises");
const path = require("path");
const db = require("../model/database/models");

// Valores de fábrica (los de la página original)
const POR_DEFECTO = {
  whatsapp: "5493815550192",
  horarios: "Lun a Vie de 9:00 a 13:00 y 17:00 a 20:30 hs • Sábados 9:30 a 13:00 hs.",
  ciudad: "San Miguel de Tucumán, Argentina",
  instagram: "",
  portada: "", // foto de la portada: se ve mientras carga el video, o sola si no hay video
  video: "/video/portada.mp4", // video de fondo de la portada (vacío = sin video)
};
const CLAVES = Object.keys(POR_DEFECTO);

let cache = null;

async function datos() {
  if (cache) return cache;
  const filas = await db.Ajuste.findAll({ raw: true });
  cache = { ...POR_DEFECTO };
  filas.forEach((f) => {
    if (CLAVES.includes(f.clave) && f.valor !== null) cache[f.clave] = f.valor;
  });
  return cache;
}

async function guardar(cambios) {
  const actuales = await datos();
  const filas = CLAVES.filter((k) => k in cambios).map((clave) => ({ clave, valor: String(cambios[clave] ?? "").trim() }));
  await db.Ajuste.bulkCreate(filas, { updateOnDuplicate: ["valor"] });

  // Si se cambió o quitó la foto o el video de portada, se borra el archivo anterior subido desde el panel
  for (const clave of ["portada", "video"]) {
    const anterior = actuales[clave];
    if (clave in cambios && anterior && anterior !== cambios[clave] && anterior.startsWith("/img/subidas/")) {
      await fs.unlink(path.join(__dirname, "../../public", anterior)).catch(() => {});
    }
  }
  cache = null;
  return datos();
}

module.exports = { POR_DEFECTO, datos, guardar };
