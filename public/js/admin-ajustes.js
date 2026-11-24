// Ajustes: vista previa de la foto y el video de portada antes de guardar
(() => {
  const { $, $$, toast } = window.ADM;
  const MAX_MB_FOTO = 5;
  const MAX_MB_VIDEO = 40;

  function previa(input, { medio, vacio, maxMb, tipos, nombre }) {
    input?.addEventListener("change", () => {
      const archivo = input.files[0];
      if (!archivo) return;
      if (!tipos.test(archivo.type)) { input.value = ""; return toast(`El ${nombre} no tiene un formato válido`, "error"); }
      if (archivo.size > maxMb * 1024 * 1024) { input.value = ""; return toast(`El ${nombre} pesa más de ${maxMb} MB`, "error"); }
      const el = $(medio);
      el.src = URL.createObjectURL(archivo);
      el.hidden = false;
      $(vacio)?.remove();
      el.closest(".portada-editor__vista").classList.remove("quitada");
      toast(`Vista previa lista: tocá "Guardar ajustes" para publicar el ${nombre}`);
    });
  }

  previa($("#portadaArchivo"), { medio: "#portadaImg", vacio: "#portadaVacia", maxMb: MAX_MB_FOTO, tipos: /^image\/(jpeg|png|webp)$/, nombre: "foto" });
  previa($("#videoArchivo"), { medio: "#videoPrevio", vacio: "#videoVacio", maxMb: MAX_MB_VIDEO, tipos: /^video\/(mp4|webm)$/, nombre: "video" });

  // "Quitar" oscurece la vista previa
  $$("[data-quitar]").forEach((check) =>
    check.addEventListener("change", () => document.getElementById(check.dataset.quitar).classList.toggle("quitada", check.checked))
  );
})();
