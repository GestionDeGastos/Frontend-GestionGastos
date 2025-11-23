import * as API from './api.js';

window.addEventListener("DOMContentLoaded", () => {
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  // 1. Obtener usuario activo (Datos básicos del localStorage)
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  
  if (!usuarioActivo) {
    window.location.href = "index.html"; 
    return;
  }

  // 2. Mostrar nombre
  if (welcomeMsg) welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;

  // 3. Configurar Logout
  if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        API.cerrarSesion();
      });
  }

  const token = localStorage.getItem("authToken");
  
  if (token) {
    try {
      // Decodificar el Payload del JWT
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      console.log("🔑 [DEBUG] Datos del Token:", payload); // Mira la consola del navegador

      // Verificamos si el rol es 'admin'
      // IMPORTANTE: Algunos backend usan 'sub' o metadatos, aquí buscamos 'rol' o 'role'
      if (payload.rol === 'admin' || payload.role === 'admin') {
          console.log("✅ Usuario es ADMIN. Mostrando botón...");
          const btnAdmin = document.getElementById("btnPanelAdmin");
          if (btnAdmin) {
              btnAdmin.style.display = "flex"; 
          } else {
              console.error("⚠️ No se encontró el botón con ID 'btnPanelAdmin' en el HTML.");
          }
      } else {
          console.log("ℹ️ El usuario NO es admin (Rol detectado:", payload.rol || payload.role, ")");
      }

    } catch (e) {
      console.error("❌ Error al leer el token:", e);
    }
  }
});