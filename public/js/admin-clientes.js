// Clientes: vista previa de la foto, botón "Guardar" solo si hay cambios y mostrar/ocultar sin recargar
(() => {
  const { $$, toast, pedir } = window.ADM;
  const MAX_MB = 5;

  // Vista previa al elegir una foto
  $$("[data-previa]").forEach((input) =>
    input.addEventListener("change", () => {
      const archivo = input.files[0];
      if (!archivo) return;
      if (!/^image\/(jpeg|png|webp)$/.test(archivo.type)) { input.value = ""; return toast("Solo JPG, PNG o WEBP", "error"); }
      if (archivo.size > MAX_MB * 1024 * 1024) { input.value = ""; return toast(`La foto pesa más de ${MAX_MB} MB`, "error"); }
      const caja = input.closest(".foto-cliente");
      const img = caja.querySelector("img");
      img.src = URL.createObjectURL(archivo);
      img.hidden = false;
      caja.querySelector(".foto-cliente__vacia")?.remove();
      caja.classList.remove("con-error");
    })
  );

  // En las tarjetas, "Guardar cambios" aparece recién cuando se cambia algo
  $$(".cliente-adm__form").forEach((form) => {
    const guardar = form.querySelector(".cliente-adm__guardar");
    const mostrar = () => (guardar.hidden = false);
    form.addEventListener("input", mostrar);
    form.addEventListener("change", mostrar);
    if (form.querySelector(".con-error")) mostrar();
  });

  // Mostrar u ocultar en la web
  $$("[data-alternar-cliente]").forEach((boton) =>
    boton.addEventListener("click", async () => {
      const item = boton.closest("[data-id]");
      boton.disabled = true;
      const r = await pedir(`/admin/clientes/${item.dataset.id}/alternar`, { metodo: "PATCH" });
      boton.disabled = false;
      if (!r.ok) return toast(r.mensaje || "No se pudo actualizar", "error");
      boton.setAttribute("aria-checked", String(r.valor));
      item.classList.toggle("cliente-adm--oculto", !r.valor);
      toast(r.valor ? "Ahora se ve en la web" : "Ya no se ve en la web");
    })
  );
})();
