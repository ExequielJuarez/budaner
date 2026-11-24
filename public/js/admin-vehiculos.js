// Listado de vehículos: prender/apagar "En la web" y "Destacado" sin recargar
(() => {
  const { $$, toast, pedir } = window.ADM;
  const TEXTOS = {
    publicado: [" ya no se ve en la web", " ahora se ve en la web"],
    destacado: [" salió de Destacados", " está en Destacados"],
  };

  $$("[data-alternar]").forEach((boton) =>
    boton.addEventListener("click", async () => {
      const item = boton.closest("[data-id]");
      const campo = boton.dataset.alternar;
      boton.disabled = true;
      const r = await pedir(`/admin/vehiculos/${item.dataset.id}/alternar`, { metodo: "PATCH", datos: { campo } });
      boton.disabled = false;
      if (!r.ok) return toast(r.mensaje || "No se pudo actualizar", "error");
      boton.setAttribute("aria-checked", String(r.valor));
      if (campo === "publicado") item.classList.toggle("stock__item--oculto", !r.valor);
      const nombre = item.querySelector(".stock__modelo").textContent.trim();
      toast(nombre + TEXTOS[campo][Number(r.valor)]);
    })
  );
})();
