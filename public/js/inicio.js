// Inicio: carrusel de destacados, buscador + filtros + orden, "Ver todo" y ficha de la unidad.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const { abrirModal } = window.Budaner;

  // ── 0. Video de la portada ──────────────────────────────
  // Con "reducir movimiento" activado se queda quieto; si el navegador bloquea
  // la reproducción automática, igual se ve el primer cuadro o la foto.
  const video = $("#videoPortada");
  if (video) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) video.pause();
    else video.play?.().catch(() => {});
  }

  // ── 1. Carrusel de destacados ───────────────────────────
  const carrusel = $("#carrusel");
  const [flechaAnt, flechaSig] = $$("[data-carrusel]");

  function actualizarFlechas() {
    const max = carrusel.scrollWidth - carrusel.clientWidth - 4;
    flechaAnt.disabled = carrusel.scrollLeft <= 4;
    flechaSig.disabled = carrusel.scrollLeft >= max;
  }
  $$("[data-carrusel]").forEach((btn) =>
    btn.addEventListener("click", () => {
      carrusel.scrollBy({ left: Number(btn.dataset.carrusel) * carrusel.clientWidth * 0.85, behavior: "smooth" });
    })
  );
  carrusel.addEventListener("scroll", () => requestAnimationFrame(actualizarFlechas), { passive: true });
  carrusel.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); flechaSig.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); flechaAnt.click(); }
  });
  window.addEventListener("resize", actualizarFlechas);
  actualizarFlechas();

  // Carrusel de "Nuestros clientes" (mismas flechas)
  const listaClientes = $("#clientesLista");
  if (listaClientes) {
    const flechasClientes = $$("[data-clientes]");
    const actualizarClientes = () => {
      const max = listaClientes.scrollWidth - listaClientes.clientWidth - 4;
      if (flechasClientes.length) {
        flechasClientes[0].disabled = listaClientes.scrollLeft <= 4;
        flechasClientes[1].disabled = listaClientes.scrollLeft >= max;
        // Si todas entran en pantalla, las flechas sobran
        flechasClientes[0].parentElement.hidden = max <= 0;
      }
    };
    flechasClientes.forEach((b) =>
      b.addEventListener("click", () => listaClientes.scrollBy({ left: Number(b.dataset.clientes) * listaClientes.clientWidth * 0.9, behavior: "smooth" }))
    );
    listaClientes.addEventListener("scroll", () => requestAnimationFrame(actualizarClientes), { passive: true });
    window.addEventListener("resize", actualizarClientes);
    actualizarClientes();
  }

  // ── 2. Catálogo: búsqueda, filtros y orden ──────────────
  const grilla = $("#grilla");
  const tarjetas = $$(".vehiculo", grilla);
  const VISTA_PREVIA = Number(grilla.dataset.vistaPrevia) || 6;
  grilla.classList.add("grilla--lista"); // desde acá el JS decide qué se ve

  const campos = {
    texto: $("#busqueda"),
    marca: $("#filtroMarca"),
    precioMin: $("#precioMin"),
    precioMax: $("#precioMax"),
    anioMin: $("#anioMin"),
    anioMax: $("#anioMax"),
    orden: $("#orden"),
  };
  const btnVerTodo = $("#btnVerTodo");
  const verTodoAbajo = $("#verTodoAbajo");
  const sinResultados = $("#sinResultados");
  const contador = $("#contador");
  const btnFiltros = $("#btnFiltros");
  const panelFiltros = $("#panelFiltros");
  const filtrosActivos = $("#filtrosActivos");

  let verTodo = false;

  // Busca sin importar mayúsculas ni tildes ("peugeot", "Peugeót"...)
  const normalizar = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  const numero = (v) => (v === "" || v == null ? null : Number(v));

  const ORDENES = {
    destacados: (a, b) => b.dataset.destacado - a.dataset.destacado || a.dataset.posicion - b.dataset.posicion,
    nuevos: (a, b) => b.dataset.anio - a.dataset.anio || a.dataset.posicion - b.dataset.posicion,
    "precio-asc": (a, b) => a.dataset.precio - b.dataset.precio,
    "precio-desc": (a, b) => b.dataset.precio - a.dataset.precio,
  };

  function leerFiltros() {
    return {
      texto: normalizar(campos.texto.value),
      marca: campos.marca.value,
      precioMin: numero(campos.precioMin.value),
      precioMax: numero(campos.precioMax.value),
      anioMin: numero(campos.anioMin.value),
      anioMax: numero(campos.anioMax.value),
    };
  }

  function aplicar() {
    const f = leerFiltros();
    // Filtros del panel (sin contar el buscador), para el numerito del botón "Filtros"
    const enPanel = ["marca", "precioMin", "precioMax", "anioMin", "anioMax"].filter((k) => f[k] !== "" && f[k] !== null).length;
    const hayFiltros = enPanel > 0 || f.texto !== "";

    const coinciden = tarjetas
      .filter((t) => {
        const d = t.dataset;
        if (f.texto && !normalizar(d.texto).includes(f.texto)) return false;
        if (f.marca && d.marca !== f.marca) return false;
        if (f.precioMin !== null && Number(d.precio) < f.precioMin) return false;
        if (f.precioMax !== null && Number(d.precio) > f.precioMax) return false;
        if (f.anioMin !== null && Number(d.anio) < f.anioMin) return false;
        if (f.anioMax !== null && Number(d.anio) > f.anioMax) return false;
        return true;
      })
      .sort(ORDENES[campos.orden.value] || ORDENES.destacados);

    // Reordena las tarjetas en la grilla según el orden elegido
    const mostrarTodas = verTodo || hayFiltros;
    const visibles = new Set(mostrarTodas ? coinciden : coinciden.slice(0, VISTA_PREVIA));
    coinciden.forEach((t) => grilla.appendChild(t));
    tarjetas.forEach((t) => (t.hidden = !visibles.has(t)));

    contador.textContent = coinciden.length;
    sinResultados.hidden = coinciden.length > 0;
    grilla.hidden = coinciden.length === 0;
    verTodoAbajo.hidden = mostrarTodas || coinciden.length <= VISTA_PREVIA;

    filtrosActivos.hidden = enPanel === 0;
    filtrosActivos.textContent = enPanel;
  }

  function cambiarVista(todo, { desplazar = false } = {}) {
    verTodo = todo;
    $("#btnVerTodoTexto").textContent = todo ? "Ver menos" : "Ver todo";
    btnVerTodo.setAttribute("aria-expanded", String(todo));
    aplicar();
    if (desplazar) $("#vehiculos-disp").scrollIntoView({ behavior: "smooth" });
  }

  function limpiar() {
    Object.entries(campos).forEach(([k, el]) => (el.value = k === "orden" ? "destacados" : ""));
    aplicar();
  }

  // Búsqueda en vivo mientras se escribe
  let espera;
  campos.texto.addEventListener("input", () => {
    clearTimeout(espera);
    espera = setTimeout(aplicar, 120);
  });
  ["marca", "anioMin", "anioMax", "orden"].forEach((k) => campos[k].addEventListener("change", aplicar));
  ["precioMin", "precioMax"].forEach((k) => campos[k].addEventListener("input", aplicar));

  // "Buscar": aplica y cierra el teclado del celular
  $("#buscador").addEventListener("submit", (e) => {
    e.preventDefault();
    aplicar();
    campos.texto.blur();
  });

  btnFiltros.addEventListener("click", () => {
    const abrir = panelFiltros.hidden;
    panelFiltros.hidden = !abrir;
    btnFiltros.setAttribute("aria-expanded", String(abrir));
  });

  btnVerTodo.addEventListener("click", () => cambiarVista(!verTodo, { desplazar: !verTodo }));

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-limpiar]")) return limpiar();

    // "Ver Stock", "Vehículos Disponibles", "Ver todo el stock disponible"
    const verTodoLink = e.target.closest("[data-ver-todo]");
    if (verTodoLink) {
      e.preventDefault();
      history.replaceState(null, "", "#vehiculos-disp");
      return cambiarVista(true, { desplazar: true });
    }

    // "Inicio" y "Destacados" vuelven a la vista previa
    if (e.target.closest("[data-vista-inicio]") && verTodo) cambiarVista(false);
  });

  // Si se entra directo con /#vehiculos-disp, se muestra todo el stock
  if (location.hash === "#vehiculos-disp") cambiarVista(true);
  else aplicar();

  // ── 3. Ficha de la unidad ───────────────────────────────
  const datos = JSON.parse($("#datosVehiculos").textContent);
  const porId = new Map(datos.map((v) => [String(v.id), v]));
  const modalFicha = $("#modalFicha");

  // Galería de fotos de la ficha (flechas, miniaturas y deslizar con el dedo)
  const img = $("#fichaImagen");
  const miniaturas = $("#fichaMiniaturas");
  let fotos = [];
  let fotoActual = 0;

  function mostrarFoto(i) {
    fotoActual = (i + fotos.length) % fotos.length;
    delete img.dataset.sinFoto;
    img.src = fotos[fotoActual] || "/img/sin-foto.svg";
    $$("button", miniaturas).forEach((b, n) => b.setAttribute("aria-current", String(n === fotoActual)));
  }
  $$("[data-foto]").forEach((b) => b.addEventListener("click", () => mostrarFoto(fotoActual + Number(b.dataset.foto))));
  miniaturas.addEventListener("click", (e) => {
    const b = e.target.closest("[data-indice]");
    if (b) mostrarFoto(Number(b.dataset.indice));
  });
  let toqueX = null;
  img.parentElement.addEventListener("touchstart", (e) => (toqueX = e.touches[0].clientX), { passive: true });
  img.parentElement.addEventListener("touchend", (e) => {
    if (toqueX === null || fotos.length < 2) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 40) mostrarFoto(fotoActual + (dx < 0 ? 1 : -1));
    toqueX = null;
  });
  modalFicha.addEventListener("keydown", (e) => {
    if (fotos.length < 2) return;
    if (e.key === "ArrowRight") mostrarFoto(fotoActual + 1);
    if (e.key === "ArrowLeft") mostrarFoto(fotoActual - 1);
  });

  function abrirFicha(id) {
    const v = porId.get(String(id));
    if (!v) return;
    fotos = v.imagenes.length ? v.imagenes : ["/img/sin-foto.svg"];
    const varias = fotos.length > 1;
    $$("[data-foto]").forEach((b) => (b.hidden = !varias));
    miniaturas.hidden = !varias;
    miniaturas.innerHTML = varias
      ? fotos.map((f, i) => `<button type="button" data-indice="${i}" aria-label="Foto ${i + 1}"><img src="${f}" alt="" loading="lazy"></button>`).join("")
      : "";
    img.alt = v.titulo;
    mostrarFoto(0);
    $("#fichaEtiqueta").textContent = v.etiqueta;
    $("#fichaTitulo").textContent = v.titulo;
    $("#fichaSub").textContent = v.sub;
    $("#fichaPrecio").textContent = v.precio;
    $("#fichaKm").textContent = v.km;
    $("#fichaTransmision").textContent = v.transmision;
    $("#fichaCombustible").textContent = v.combustible;
    $("#fichaDescripcion").textContent = v.descripcion;
    $("#fichaAsesor").dataset.asesor = v.motivo;
    $("#fichaAsesor").dataset.vehiculo = v.id;
    modalFicha.querySelector(".modal__caja").scrollTop = 0;
    abrirModal(modalFicha);
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-ficha]");
    if (btn) abrirFicha(btn.dataset.ficha);
  });
})();
