// Panel: avisos (toast), pedidos al servidor, confirmación antes de eliminar y menú de cuenta.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let tToast;
  function toast(mensaje, tipo) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = mensaje;
    el.classList.toggle("toast--error", tipo === "error");
    el.classList.add("visible");
    clearTimeout(tToast);
    tToast = setTimeout(() => el.classList.remove("visible"), 3400);
  }

  // Pedido JSON al servidor: devuelve { ok, ...datos } sin tirar error
  async function pedir(url, { metodo = "GET", datos } = {}) {
    try {
      const r = await fetch(url, {
        method: metodo,
        headers: { Accept: "application/json", ...(datos ? { "Content-Type": "application/json" } : {}) },
        body: datos ? JSON.stringify(datos) : undefined,
      });
      if (r.status === 401) {
        location.href = "/admin/login?volver=" + encodeURIComponent(location.pathname + location.search);
        return { ok: false };
      }
      const json = await r.json().catch(() => ({}));
      return { ok: r.ok && json.ok !== false, status: r.status, ...json };
    } catch {
      return { ok: false, mensaje: "No hay conexión. Probá de nuevo." };
    }
  }

  // Número de consultas nuevas en el menú
  function contadorConsultas(n) {
    const link = $('.adm-nav a[href="/admin/consultas"]');
    if (!link) return;
    let b = $("[data-contador-consultas]", link);
    if (!n) return b?.remove();
    if (!b) link.insertAdjacentHTML("beforeend", '<b class="adm-nav__n" data-contador-consultas></b>');
    $("[data-contador-consultas]", link).textContent = n;
  }

  window.ADM = { $, $$, toast, pedir, contadorConsultas };

  const flash = $("#flash");
  if (flash) toast(flash.dataset.mensaje);

  // El menú de la cuenta se cierra al tocar afuera o con Escape
  const cuenta = $(".adm-usuario");
  document.addEventListener("click", (e) => {
    if (cuenta?.open && !cuenta.contains(e.target)) cuenta.open = false;
  });

  // ── Confirmación antes de eliminar (formularios con data-confirmar) ──
  const modal = $("#modalConfirmar");
  let pendiente = null;
  let ultimoFoco = null;

  function abrirConfirmar(form) {
    pendiente = form;
    ultimoFoco = document.activeElement;
    $("#confirmarTexto").textContent = form.dataset.confirmar;
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add("visible"));
    document.body.classList.add("sin-scroll");
    setTimeout(() => $("[data-cerrar]", modal).focus(), 50);
  }
  function cerrarConfirmar() {
    modal.classList.remove("visible");
    document.body.classList.remove("sin-scroll");
    setTimeout(() => (modal.hidden = true), 200);
    pendiente = null;
    ultimoFoco?.focus();
  }

  document.addEventListener("submit", (e) => {
    const form = e.target.closest("form[data-confirmar]");
    if (!form || form.dataset.confirmado) return;
    e.preventDefault();
    abrirConfirmar(form);
  });
  $("#confirmarSi")?.addEventListener("click", () => {
    if (!pendiente) return;
    const form = pendiente;
    form.dataset.confirmado = "1";
    cerrarConfirmar();
    form.requestSubmit ? form.requestSubmit() : form.submit();
  });
  modal?.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-cerrar]")) cerrarConfirmar();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (modal && !modal.hidden) cerrarConfirmar();
    else if (cuenta?.open) cuenta.open = false;
  });

  // Evita doble envío de formularios (doble toque en el celular)
  document.addEventListener("submit", (e) => {
    if (e.defaultPrevented) return;
    const boton = e.target.querySelector('[type="submit"]');
    if (boton) setTimeout(() => (boton.disabled = true), 0);
  });
})();
