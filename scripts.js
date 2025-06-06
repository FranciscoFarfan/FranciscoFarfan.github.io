document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[id^='btn-']").forEach((boton) => {
    boton.addEventListener("click", () => {
      const idBase = boton.id.replace("btn-", "");
      const contenido = document.getElementById(`conocimientos-${idBase}`);
      const visible = contenido.style.display !== "none";

      if (visible) {
        contenido.style.display = "none";
        boton.textContent = "Mostrar";
      } else {
        contenido.style.display = "block";
        boton.textContent = "Ocultar";
      }
    });
  });
});
