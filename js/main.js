// js/main.js
document.getElementById("btnCargar").addEventListener("click", async () => {
  const contenedor = document.getElementById("resultado");
  contenedor.innerHTML = "Cargando...";

  try {
    const respuesta = await fetch(`${CONFIG.API_URL}/usuarios`);
    if (!respuesta.ok) throw new Error("Error al conectar con el backend");

    const data = await respuesta.json();

    if (data.length === 0) {
      contenedor.innerHTML = "No hay usuarios registrados.";
    } else {
      contenedor.innerHTML = `
        <h3>Usuarios registrados:</h3>
        <ul>
          ${data.map(u => `<li>${u.nombre} (${u.email})</li>`).join("")}
        </ul>
      `;
    }
  } catch (error) {
    contenedor.innerHTML = `<span style="color:red;">${error.message}</span>`;
  }
});
