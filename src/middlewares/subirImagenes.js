// Subida de archivos con multer. Guarda en public/img/subidas con nombres únicos.
//   fotosVehiculo → campo "fotos" (varias fotos de un vehículo)
//   fotoCliente   → campo "foto" (una foto de una entrega)
//   archivosPortada → campos "portada" (foto) y "video" (video de fondo) de Ajustes
// Fotos: JPG, PNG o WEBP de hasta 5 MB. Video: MP4 o WEBM de hasta 40 MB.
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const { MAX_FOTOS } = require("../services/vehiculoService");

const FOTOS = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const VIDEOS = { "video/mp4": ".mp4", "video/webm": ".webm" };
const MAX_MB = 5;
const MAX_MB_VIDEO = 40;

const almacen = (prefijo) =>
  multer.diskStorage({
    destination: path.join(__dirname, "../../public/img/subidas"),
    filename: (req, file, cb) =>
      cb(null, `${prefijo}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}${FOTOS[file.mimetype] || VIDEOS[file.mimetype]}`),
  });

// El campo "video" acepta videos; el resto, fotos
const filtro = (req, file, cb) => {
  const tipos = file.fieldname === "video" ? VIDEOS : FOTOS;
  if (tipos[file.mimetype]) return cb(null, true);
  const error = new Error("tipo");
  error.code = file.fieldname === "video" ? "VIDEO_INVALIDO" : "TIPO_INVALIDO";
  cb(error);
};

const MENSAJES = {
  LIMIT_FILE_SIZE: `Cada foto puede pesar hasta ${MAX_MB} MB y el video hasta ${MAX_MB_VIDEO} MB`,
  LIMIT_FILE_COUNT: `Podés subir hasta ${MAX_FOTOS} fotos`,
  LIMIT_UNEXPECTED_FILE: `Podés subir hasta ${MAX_FOTOS} fotos`,
  TIPO_INVALIDO: "Las fotos tienen que ser JPG, PNG o WEBP",
  VIDEO_INVALIDO: "El video tiene que ser MP4 o WEBM",
};

// Envuelve multer para que un error de archivo se muestre como error del formulario
const envolver = (subir) => (req, res, next) =>
  subir(req, res, (err) => {
    if (err) req.errorImagen = MENSAJES[err.code] || "No se pudieron subir los archivos";
    req.files = req.files || [];
    next();
  });

const fotos = (prefijo, extra = {}) =>
  multer({ storage: almacen(prefijo), fileFilter: filtro, limits: { fileSize: MAX_MB * 1024 * 1024, ...extra } });

// Los videos pesan más: el límite se controla por campo después de subir
const portada = multer({ storage: almacen("portada"), fileFilter: filtro, limits: { fileSize: MAX_MB_VIDEO * 1024 * 1024, files: 2 } });

module.exports = {
  MAX_MB,
  MAX_MB_VIDEO,
  fotosVehiculo: envolver(fotos("vehiculo", { files: MAX_FOTOS }).array("fotos", MAX_FOTOS)),
  fotoCliente: envolver(fotos("cliente", { files: 1 }).single("foto")),
  archivosPortada: envolver(portada.fields([{ name: "portada", maxCount: 1 }, { name: "video", maxCount: 1 }])),
};
