// js/script.js
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

  // ⚠️ IMPORTANTE: los índices corresponden al HTML que ya tienes:
  // 0: nombre, 1: apellido, 2: edad, 3: correo, 4: password
  const nombre   = form[0].value.trim();
  const apellido = form[1].value.trim();
  const edadStr  = form[2].value.trim();
  const correo   = form[3].value.trim();
  const password = form[4].value.trim();

  const edad = parseInt(edadStr, 10);

  if (!nombre || !apellido || !edadStr || !correo || !password) {
    return showAlert("warning", "Campos vacíos", "Completa todos los campos");
  }

  if (Number.isNaN(edad)) {
    return showAlert("warning", "Edad inválida", "Ingresa una edad numérica");
  }

  if (edad < 18) {
    return showAlert("warning", "Edad mínima", "Debes ser mayor de 18 años");
  }

  if (password.length < 8) {
    return showAlert("warning", "Contraseña débil", "Mínimo 8 caracteres");
  }

  try {
    console.log("🚀 Registrando...", { nombre, apellido, edad, correo });
    await API.registrarUsuario(nombre, apellido, edad, correo, password);
    console.log("✅ Registro exitoso");
    showAlert("success", "Registro exitoso", "Tu cuenta ha sido creada");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (err) {
    console.error("❌ Error:", err);
    showAlert("error", "Error en registro", err.message || "Error inesperado");
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
