// js/script.js
// =================== IMPORTAR FUNCIONES DE API ===================
import * as API from './api.js';

console.log("✅ script.js cargado");

// Lógica para mostrar/ocultar el campo de Clave Admin
document.addEventListener("DOMContentLoaded", () => {
    const checkAdmin = document.getElementById("checkAdmin");
    const keyContainer = document.getElementById("adminKeyContainer");
    const adminKeyInput = document.getElementById("adminKey");

    if(checkAdmin && keyContainer) {
        checkAdmin.addEventListener("change", (e) => {
            if (e.target.checked) {
                keyContainer.style.display = "block";
            } else {
                keyContainer.style.display = "none";
                if(adminKeyInput) adminKeyInput.value = ""; // Limpiar si se desmarca
            }
        });
    }
});

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
  // VALIDAR EDAD POSITIVA
  const edadInput = document.querySelector('input[placeholder="Edad"]');
  if (!edadInput.value || edadInput.value <= 0 || !Number.isInteger(Number(edadInput.value))) {
      Swal.fire("Edad inválida", "La edad debe ser un número entero mayor a 0.", "error");
    return;
}

  console.log("📝 Registro iniciado");

  const form = e.target;
  
  // Obtenemos los valores. Usamos querySelector para mayor seguridad si cambiaron los índices
  // O mantenemos los índices asumiendo que el checkbox está AL FINAL.
  const nombre   = form[0].value.trim();
  const apellido = form[1].value.trim();
  const edadStr  = form[2].value.trim();
  const correo   = form[3].value.trim();
  const password = form[4].value.trim();
  
  // Obtenemos la clave de admin 
  const adminKeyInput = document.getElementById("adminKey");
  const adminKey = (adminKeyInput && adminKeyInput.value.trim() !== "") ? adminKeyInput.value.trim() : null;

  const edad = parseInt(edadStr, 10);

  if (!nombre || !apellido || !edadStr || !correo || !password) {
    return showAlert("warning", "Campos vacíos", "Completa todos los campos obligatorios");
  }

  if (edad < 18) return showAlert("warning", "Edad mínima", "Debes ser mayor de 18 años");
  if (password.length < 8) return showAlert("warning", "Contraseña débil", "Mínimo 8 caracteres");

  try {
    console.log("🚀 Registrando...", { nombre, correo, admin: !!adminKey });
    
    await API.registrarUsuario(nombre, apellido, edad, correo, password, adminKey);
    
    console.log("✅ Registro exitoso");
    showAlert("success", "Registro exitoso", "Tu cuenta ha sido creada. Inicia sesión.");

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
const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!regexCorreo.test(correo)) {
    return showAlert("warning", "Correo inválido", "Ingresa un correo válido con formato nombre@correo.com");
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
    console.error("❌ Error de login:", err);

    // Forzar mensaje legible
    const mensaje = err?.message || "Correo o contraseña incorrectos";

    showAlert("error", "Error de inicio", mensaje);
}

});

// =============================================================
//      RECUPERAR
// =============================================================
document.getElementById("recuperarForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  showAlert("info", "En desarrollo", "Esta función será habilitada pronto");
});
