document.addEventListener("DOMContentLoaded", () => {
  const botones = document.querySelectorAll("[id^='btn-']");
  
  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      const idBase = boton.id.replace("btn-", "");
      const contenido = document.getElementById(`conocimientos-${idBase}`);

     
      botones.forEach((b) => {
        const base = b.id.replace("btn-", "");
        const c = document.getElementById(`conocimientos-${base}`);
        c.style.display = "none";
        b.textContent = "Mostrar";
      });

      
      if (contenido.style.display === "none") {
        contenido.style.display = "block";
        boton.textContent = "Ocultar";
      }
    });
  });
});
