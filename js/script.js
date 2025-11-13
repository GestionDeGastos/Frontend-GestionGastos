// =================== IMPORTAR FUNCIONES DE API ===================
import * as API from './api.js';

console.log("✅ script.js cargado");

function showAlert(icon, title, text) {
  console.log(`🔔 Mostrando alerta: ${icon} - ${title}`);
  
  if (typeof Swal === 'undefined') {
    console.error("❌ Swal no disponible, usando alert");
    alert(`${title}\n${text}`);
    return;
  }

  Swal.fire({
    icon,
    title,
    text,
    confirmButtonColor: '#7984ff',
    background: '#0f0f23',
    color: '#fff'
  });
}

// =============================================================
//      REGISTRO
// =============================================================
document.getElementById("registerForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  console.log("📝 Registro iniciado");
  
  const form = e.target;
  const nombre = form[0].value.trim();
  const correo = form[3].value.trim();
  const password = form[4].value.trim();
  
  if (!nombre || !correo || !password) {
    return showAlert("warning", "Campos vacíos", "Completa Nombre, Correo y Contraseña");
  }

  if (password.length < 8) {
    return showAlert("warning", "Contraseña débil", "Mínimo 8 caracteres");
  }

  try {
    console.log("🚀 Registrando...");
    await API.registrarUsuario(nombre, correo, password);
    console.log("✅ Registro exitoso");
    showAlert("success", "Registro exitoso", "Tu cuenta ha sido creada");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (err) {
    console.error("❌ Error:", err);
    showAlert("error", "Error en registro", err.message);
  }
});

// =============================================================
//      LOGIN
// =============================================================
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  console.log("🔐 Login iniciado");
  
  const form = e.target;
  const correo = form[0].value.trim();
  const password = form[1].value.trim();
  
  console.log("📧 Correo:", correo);
  
  if (!correo || !password) {
    return showAlert("warning", "Campos vacíos", "Completa todos los campos");
  }

  try {
    console.log("🚀 Enviando petición...");
    await API.loginUsuario(correo, password);
    console.log("✅ Login exitoso");
    showAlert("success", "Inicio exitoso", "Bienvenido");
    
    setTimeout(() => {
      console.log("🔄 Redirigiendo...");
      window.location.href = "inicio.html";
    }, 1500);

  } catch (err) {
    console.error("❌ Error de login:", err.message);
    showAlert("error", "Error de inicio", err.message);
  }
});

// =============================================================
//      RECUPERAR
// =============================================================
document.getElementById("recuperarForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  showAlert("info", "En desarrollo", "Esta función será habilitada pronto");
});