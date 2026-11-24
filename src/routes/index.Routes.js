const express = require("express");
const router = express.Router();

const inicioController = require("../controllers/inicioController");
const consultaController = require("../controllers/consultaController");
const consultaValidator = require("../validations/consultaValidator");

// ── INICIO (portada, destacados, catálogo con filtros y "vender mi auto") ──
router.get("/", inicioController.inicio);

// ── CONSULTAS (modal "Consultar con asesor") ───────────────
router.post("/consultas", consultaValidator, consultaController.crear);

module.exports = router;
