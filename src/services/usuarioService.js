// Administradores: inicio de sesión y cambio de clave
const bcrypt = require("bcryptjs");
const db = require("../model/database/models");

// Hash de una clave cualquiera: compara aunque el usuario no exista y así el
// tiempo de respuesta no delata qué usuarios están registrados
const HASH_FALSO = bcrypt.hashSync("clave-que-no-existe", 10);

// Datos que se guardan en la sesión (nunca la clave)
const paraSesion = (u) => ({ id: u.id, nombre: u.nombre, usuario: u.usuario });

module.exports = {
  async verificar(nombreUsuario, clave) {
    const usuario = await db.Usuario.findOne({ where: { usuario: String(nombreUsuario).trim().toLowerCase() } });
    const ok = await bcrypt.compare(String(clave), usuario ? usuario.clave : HASH_FALSO);
    return ok && usuario ? paraSesion(usuario) : null;
  },

  async cambiarClave(id, actual, nueva) {
    const usuario = await db.Usuario.findByPk(id);
    if (!usuario || !(await bcrypt.compare(String(actual), usuario.clave))) return false;
    await usuario.update({ clave: await bcrypt.hash(String(nueva), 10) });
    return true;
  },
};
