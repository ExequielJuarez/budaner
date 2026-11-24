// Datos de la concesionaria que usan las vistas (header, pie, WhatsApp, portada).
// Lo fijo está acá; lo editable (WhatsApp, horarios, ciudad, Instagram, portada) viene
// de Ajustes en el panel.
const NOMBRE = "Budaner Automotores";

module.exports = (ajustes) => {
  const numero = String(ajustes.whatsapp || "").replace(/\D/g, "");
  return {
    nombre: NOMBRE,
    ciudad: ajustes.ciudad,
    horarios: ajustes.horarios,
    instagram: ajustes.instagram || "",
    portada: ajustes.portada || null,
    video: ajustes.video || null,
    whatsappNumero: numero,
    // Arma el link de WhatsApp con un mensaje ya escrito
    whatsapp: (mensaje = `Hola ${NOMBRE}! Quiero consultar con un asesor.`) =>
      `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`,
  };
};
