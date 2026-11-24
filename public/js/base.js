// Comportamiento común a toda la web: menú lateral, modales y "Consultar con asesor".
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NOMBRE = "Budaner Automotores";
  // El número sale de Ajustes en el panel (data-whatsapp del modal)
  const WHATSAPP = document.getElementById("modalAsesor")?.dataset.whatsapp || "";

  // Bloquea el scroll de fondo mientras haya un menú o modal abierto
  const abiertos = new Set();
  const bloquearScroll = () => document.body.classList.toggle("sin-scroll", abiertos.size > 0);

  // ── Menú lateral (celular / tablet) ─────────────────────
  const drawer = $("#drawer");
  const fondo = $("#drawerFondo");
  const btnMenu = $("#btnMenu");

  function abrirMenu() {
    fondo.hidden = false;
    drawer.inert = false;
    drawer.setAttribute("aria-hidden", "false");
    btnMenu.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      fondo.classList.add("visible");
      drawer.classList.add("abierto");
    });
    abiertos.add("menu");
    bloquearScroll();
    setTimeout(() => $("#drawerCerrar").focus(), 50);
  }
  function cerrarMenu({ devolverFoco = true } = {}) {
    if (!drawer.classList.contains("abierto")) return;
    fondo.classList.remove("visible");
    drawer.classList.remove("abierto");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    btnMenu.setAttribute("aria-expanded", "false");
    setTimeout(() => (fondo.hidden = true), 250);
    abiertos.delete("menu");
    bloquearScroll();
    if (devolverFoco) btnMenu.focus();
  }
  btnMenu?.addEventListener("click", abrirMenu);
  $("#drawerCerrar")?.addEventListener("click", () => cerrarMenu());
  fondo?.addEventListener("click", () => cerrarMenu());
  // Al tocar un link o botón del menú, se cierra
  drawer?.addEventListener("click", (e) => {
    if (e.target.closest("a, [data-asesor]")) cerrarMenu({ devolverFoco: false });
  });
  // Si se agranda la pantalla a PC con el menú abierto, se cierra solo
  matchMedia("(min-width: 1024px)").addEventListener("change", (e) => e.matches && cerrarMenu({ devolverFoco: false }));

  // ── Modales genéricos ──────────────────────────────────
  let ultimoFoco = null;

  function abrirModal(modal) {
    if (!modal) return;
    ultimoFoco = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("visible"));
    abiertos.add(modal.id);
    bloquearScroll();
    const primero = modal.querySelector("input:not([type=hidden]), button, a[href]");
    setTimeout(() => primero?.focus({ preventScroll: true }), 60);
  }
  function cerrarModal(modal) {
    if (!modal || modal.hidden) return;
    modal.classList.remove("visible");
    setTimeout(() => (modal.hidden = true), 200);
    abiertos.delete(modal.id);
    bloquearScroll();
    if (ultimoFoco && document.contains(ultimoFoco)) ultimoFoco.focus({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    // Botón de cerrar dentro del modal
    const cerrar = e.target.closest("[data-cerrar]");
    if (cerrar) return cerrarModal(cerrar.closest(".modal"));
    // Clic en el fondo oscuro
    if (e.target.classList?.contains("modal")) cerrarModal(e.target);
  });

  // Tecla Escape: cierra lo último que se abrió. Tab queda dentro del modal.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = $$(".modal:not([hidden])").pop();
      if (modal) return cerrarModal(modal);
      cerrarMenu();
    }
    if (e.key === "Tab") {
      const modal = $$(".modal:not([hidden])").pop();
      if (!modal) return;
      const focos = $$("button:not([disabled]), a[href], input:not([type=hidden]), select, textarea", modal).filter(
        (el) => el.offsetParent !== null
      );
      if (!focos.length) return;
      const [primero, ultimo] = [focos[0], focos[focos.length - 1]];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  });

  // ── Consultar con asesor ───────────────────────────────
  const modalAsesor = $("#modalAsesor");
  const form = $("#formAsesor");
  const listo = $("#asesorListo");

  const linkWhatsapp = (texto) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;

  function abrirAsesor(motivo, vehiculoId = "") {
    $("#asesorMotivo").textContent = motivo;
    $("#asesorMotivoInput").value = motivo;
    $("#asesorVehiculoInput").value = vehiculoId;
    form.hidden = false;
    listo.hidden = true;
    limpiarErrores();
    abrirModal(modalAsesor);
  }

  // Cualquier botón con data-asesor="motivo" abre el formulario
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-asesor]");
    if (!btn) return;
    e.preventDefault();
    // Si se abre desde la ficha, primero se cierra la ficha
    const modalPadre = btn.closest(".modal");
    if (modalPadre) cerrarModal(modalPadre);
    abrirAsesor(btn.dataset.asesor, btn.dataset.vehiculo || "");
  });

  function limpiarErrores() {
    $$(".campo", form).forEach((c) => c.classList.remove("con-error"));
    $$("[data-error]", form).forEach((el) => (el.textContent = ""));
  }
  function mostrarErrores(errores) {
    Object.entries(errores).forEach(([campo, { msg }]) => {
      const el = $(`[data-error="${campo}"]`, form);
      if (!el) return;
      el.textContent = msg;
      el.closest(".campo")?.classList.add("con-error");
    });
    form.querySelector(".con-error input")?.focus();
  }
  // Validación rápida en el navegador (el servidor vuelve a validar)
  function validarLocal(datos) {
    const errores = {};
    if (!datos.nombre.trim()) errores.nombre = { msg: "Escribí tu nombre" };
    if (!datos.telefono.trim()) errores.telefono = { msg: "Dejanos un teléfono" };
    else if (!/^[0-9 +()-]{6,20}$/.test(datos.telefono.trim())) errores.telefono = { msg: "Revisá el número (solo números, espacios o guiones)" };
    return errores;
  }

  function mensajeWhatsapp() {
    const nombre = form.nombre.value.trim() || "un cliente";
    const mensaje = form.mensaje.value.trim();
    return `Hola ${NOMBRE}! Soy ${nombre}, quiero consultar con un asesor por: ${form.motivo.value}${mensaje ? ". " + mensaje : ""}`;
  }

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    limpiarErrores();
    const datos = Object.fromEntries(new FormData(form));
    const errores = validarLocal(datos);
    if (Object.keys(errores).length) return mostrarErrores(errores);

    const boton = form.querySelector("[type=submit]");
    boton.disabled = true;
    let respuesta = {};
    try {
      const r = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      respuesta = await r.json().catch(() => ({}));
      if (r.status === 422 && respuesta.errores) {
        boton.disabled = false;
        return mostrarErrores(respuesta.errores);
      }
    } catch {
      // Sin conexión: igual se ofrece seguir por WhatsApp
    }
    boton.disabled = false;
    $("#asesorListoWhatsapp").href = respuesta.whatsapp || linkWhatsapp(mensajeWhatsapp());
    form.hidden = true;
    listo.hidden = false;
    form.reset();
    listo.querySelector("a, button")?.focus();
  });

  $("#asesorWhatsapp")?.addEventListener("click", () => {
    window.open(linkWhatsapp(mensajeWhatsapp()), "_blank", "noopener");
  });

  // Para usar desde inicio.js
  window.Budaner = { abrirModal, cerrarModal, abrirAsesor };
})();
