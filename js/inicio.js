// js/inicio.js

window.addEventListener("DOMContentLoaded", () => {
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  // 1. Verificar si hay un usuario activo en localStorage
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  
  // Si no hay usuario, redirigir al login (index.html)
  if (!usuarioActivo) {
    window.location.href = "index.html"; 
    return;
  }

  // 2. Mostrar el mensaje de bienvenida
  welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;

  // 3. Configurar el botón de logout
  logoutBtn.addEventListener("click", () => {
    // Limpiar localStorage
    localStorage.removeItem("usuarioActivo");
    localStorage.removeItem("authToken");
    
    // Mostrar alerta de éxito
    Swal.fire({
      icon: 'success',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión exitosamente.',
      confirmButtonColor: '#7984ff',
      background: '#0f0f23',
      color: '#fff'
    });
    
    // Redirigir al login después de 1.5 segundos
    setTimeout(() => (window.location.href = "index.html"), 1500);
  });
});