// Consultas: cambiar el estado sin recargar
(() => {
  const { $$, toast, pedir, contadorConsultas } = window.ADM;

  $$("[data-estado]").forEach((select) => {
    let anterior = select.value;
    select.addEventListener("change", async () => {
      const item = select.closest("[data-id]");
      select.disabled = true;
      const r = await pedir(`/admin/consultas/${item.dataset.id}`, { metodo: "PATCH", datos: { estado: select.value } });
      select.disabled = false;
      if (!r.ok) {
        select.value = anterior;
        return toast(r.mensaje || "No se pudo cambiar el estado", "error");
      }
      item.className = `consulta consulta--${select.value}`;
      // Actualiza los números de los filtros
      const menos = document.querySelector(`[data-cuenta="${anterior}"]`);
      const mas = document.querySelector(`[data-cuenta="${select.value}"]`);
      if (menos) menos.textContent = Number(menos.textContent) - 1;
      if (mas) mas.textContent = Number(mas.textContent) + 1;
      anterior = select.value;
      contadorConsultas(r.nuevas);
      toast("Estado actualizado ✓");
    });
  });
})();
