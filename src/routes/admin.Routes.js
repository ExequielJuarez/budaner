const express = require("express");
const router = express.Router();

const soloAdmin = require("../middlewares/soloAdmin");
const soloInvitados = require("../middlewares/soloInvitados");
const { fotosVehiculo, fotoCliente, archivosPortada } = require("../middlewares/subirImagenes");
const loginValidator = require("../validations/loginValidator");
const vehiculoValidator = require("../validations/vehiculoValidator");
const ajustesValidator = require("../validations/ajustesValidator");

const acceso = require("../controllers/accesoController");
const admin = require("../controllers/adminController");
const vehiculos = require("../controllers/vehiculosAdminController");
const consultas = require("../controllers/consultasAdminController");
const ajustes = require("../controllers/ajustesAdminController");
const clientes = require("../controllers/clientesAdminController");
const clienteValidator = require("../validations/clienteValidator");
const consultaService = require("../services/consultaService");

// ── Acceso (sin sesión) ────────────────────────────────────
router.get("/login", soloInvitados, acceso.ver);
router.post("/login", soloInvitados, loginValidator, acceso.ingresar);
router.post("/logout", acceso.salir);

// Desde acá, todo el panel requiere un administrador
router.use(soloAdmin);

// Consultas nuevas (número en el menú) y aviso de un solo uso
router.use(async (req, res, next) => {
  res.locals.admin = req.session.admin;
  res.locals.consultasNuevas = await consultaService.nuevas();
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

router.get("/", admin.resumen);

// ── Vehículos ──────────────────────────────────────────────
router.get("/vehiculos", vehiculos.listado);
router.get("/vehiculos/nuevo", vehiculos.nuevo);
router.post("/vehiculos", fotosVehiculo, vehiculoValidator, vehiculos.crear);
router.get("/vehiculos/:id/editar", vehiculos.editar);
router.put("/vehiculos/:id", fotosVehiculo, vehiculoValidator, vehiculos.actualizar);
router.delete("/vehiculos/:id", vehiculos.eliminar);
router.patch("/vehiculos/:id/alternar", vehiculos.alternar);

// ── Consultas ──────────────────────────────────────────────
router.get("/consultas", consultas.listado);
router.patch("/consultas/:id", consultas.cambiarEstado);
router.delete("/consultas/:id", consultas.eliminar);

// ── Clientes (fotos de las entregas) ───────────────────────
router.get("/clientes", clientes.listado);
router.post("/clientes", fotoCliente, clienteValidator, clientes.crear);
router.put("/clientes/:id", fotoCliente, clienteValidator, clientes.actualizar);
router.patch("/clientes/:id/alternar", clientes.alternar);
router.delete("/clientes/:id", clientes.eliminar);

// ── Ajustes ────────────────────────────────────────────────
router.get("/ajustes", ajustes.ver);
router.put("/ajustes", archivosPortada, ajustesValidator.datos, ajustes.guardar);
router.put("/ajustes/clave", ajustesValidator.clave, ajustes.cambiarClave);

module.exports = router;
