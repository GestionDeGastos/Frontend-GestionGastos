// js/inicio.js
import * as API from './api.js';

window.addEventListener("DOMContentLoaded", () => {
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  
  if (!usuarioActivo) {
    window.location.href = "index.html"; 
    return;
  }

  welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;

  logoutBtn.addEventListener("click", () => {
    API.cerrarSesion();
  });
});