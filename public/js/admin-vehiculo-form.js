// Formulario de vehículo: km según la condición, vista del precio, contador de la
// descripción y editor de fotos (vista previa, principal, quitar y arrastrar).
(() => {
  const { $, $$, toast } = window.ADM;
  const form = $("#formVehiculo");
  if (!form) return;
  const MAX = Number(form.dataset.maxFotos) || 10;
  const MAX_MB = 5;

  // 0km → los kilómetros no hacen falta
  const campoKm = $("#campoKm");
  const inputKm = form.elements.km;
  const actualizarKm = () => {
    const es0km = form.elements.condicion.value === "0km";
    campoKm.classList.toggle("campo--deshabilitado", es0km);
    inputKm.disabled = es0km;
    if (es0km) inputKm.value = 0;
  };
  $$('input[name="condicion"]', form).forEach((r) => r.addEventListener("change", actualizarKm));
  actualizarKm();

  // Precio: se muestra como queda en la web ($ 43.500)
  const precio = form.elements.precio;
  const vista = $("#precioVista");
  const mostrarPrecio = () => {
    const n = Number(precio.value);
    vista.textContent = n > 0 ? `En la web: $ ${Math.round(n).toLocaleString("es-AR")}` : "Solo números, sin puntos.";
  };
  precio.addEventListener("input", mostrarPrecio);
  mostrarPrecio();

  const desc = $("#descripcion");
  desc.addEventListener("input", () => ($("#cuentaDesc").textContent = desc.value.length));

  // ── Fotos ──────────────────────────────────────────────
  const input = $("#archivosFotos");
  const lista = $("#fotosEditor");
  const zona = $("#zonaSubir");
  const nuevas = new DataTransfer();

  const existentesVivas = () => $$("[data-existente]:not(.quitada)", lista).length;

  function contar() {
    $("#cuentaFotos").textContent = existentesVivas() + nuevas.files.length;
    // Siempre tiene que haber una principal elegida
    if (!lista.querySelector('li:not(.quitada) input[name="principal"]:checked')) {
      const primera = lista.querySelector('li:not(.quitada) input[name="principal"]');
      if (primera) primera.checked = true;
    }
  }

  function pintarNuevas() {
    const elegida = lista.querySelector('input[name="principal"]:checked')?.value;
    $$("[data-nueva]", lista).forEach((li) => {
      URL.revokeObjectURL(li.querySelector("img").src);
      li.remove();
    });
    [...nuevas.files].forEach((f, i) => {
      const li = document.createElement("li");
      li.className = "foto-item";
      li.dataset.nueva = i;
      li.innerHTML = `<img src="${URL.createObjectURL(f)}" alt="">
        <span class="chip foto-item__nueva">Nueva</span>
        <label class="foto-item__principal"><input type="radio" name="principal" value="n-${i}"${elegida === "n-" + i ? " checked" : ""}><span>Principal</span></label>
        <button type="button" class="foto-item__quitar" data-sacar="${i}"><span>Quitar</span></button>`;
      lista.appendChild(li);
    });
    input.files = nuevas.files;
    contar();
  }

  function agregar(archivos) {
    for (const f of archivos) {
      if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast(`${f.name}: solo JPG, PNG o WEBP`, "error"); continue; }
      if (f.size > MAX_MB * 1024 * 1024) { toast(`${f.name} pesa más de ${MAX_MB} MB`, "error"); continue; }
      if (existentesVivas() + nuevas.files.length >= MAX) { toast(`Máximo ${MAX} fotos por vehículo`, "error"); break; }
      nuevas.items.add(f);
    }
    pintarNuevas();
  }

  input.addEventListener("change", () => {
    const elegidos = [...input.files];
    input.files = nuevas.files; // se rearma desde la lista propia para no duplicar
    agregar(elegidos);
  });
  ["dragenter", "dragover"].forEach((ev) => zona.addEventListener(ev, (e) => { e.preventDefault(); zona.classList.add("sobre"); }));
  ["dragleave", "drop"].forEach((ev) => zona.addEventListener(ev, () => zona.classList.remove("sobre")));
  zona.addEventListener("drop", (e) => { e.preventDefault(); agregar(e.dataTransfer.files); });

  lista.addEventListener("click", (e) => {
    const sacar = e.target.closest("[data-sacar]");
    if (!sacar) return;
    const n = Number(sacar.dataset.sacar);
    const quedan = [...nuevas.files].filter((_, i) => i !== n);
    nuevas.items.clear();
    quedan.forEach((f) => nuevas.items.add(f));
    pintarNuevas();
  });
  lista.addEventListener("change", (e) => {
    const quitar = e.target.closest('input[name="quitarImagenes"]');
    if (!quitar) return;
    const li = quitar.closest("li");
    li.classList.toggle("quitada", quitar.checked);
    if (quitar.checked) li.querySelector('input[name="principal"]').checked = false;
    contar();
  });
  contar();

  // Validación rápida antes de enviar (el servidor vuelve a validar todo)
  form.addEventListener("submit", (e) => {
    const faltan = ["marca", "modelo", "anio", "segmento", "precio"].filter((k) => !form.elements[k].value.trim());
    if (form.elements.condicion.value !== "0km" && inputKm.value === "") faltan.push("km");
    if (faltan.length) {
      e.preventDefault();
      form.elements[faltan[0]].focus();
      return toast("Completá los campos obligatorios", "error");
    }
    if (existentesVivas() + nuevas.files.length === 0) {
      e.preventDefault();
      zona.scrollIntoView({ behavior: "smooth", block: "center" });
      return toast("Subí al menos una foto", "error");
    }
  });
})();
