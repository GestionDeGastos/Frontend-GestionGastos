// =================== CONFIGURACIÓN GENERAL ===================
// 🔹 URL del backend (La quitamos, ya no se usa)
// const API_URL = "http://127.0.0.1:8010"; 

function showAlert(icon, title, text) {
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
//      SECCIÓN DE CONEXIÓN (AHORA SIMULADA)
// =============================================================

/**
 * SIMULADO: Registra un nuevo usuario.
 */
async function registerUser(data) {
  console.log("SIMULADO: Registrando usuario", data);
  // Simular un retraso
  await new Promise(resolve => setTimeout(resolve, 500));
  // Simplemente resolvemos con éxito
  return { success: true, message: "Usuario registrado (simulado)" };
}

/**
 * SIMULADO: Inicia sesión de un usuario.
 * Esto te permitirá entrar al dashboard.
 */
async function loginUser(email, pass) {
  console.log("SIMULADO: Iniciando sesión con", email);

  // Simular un pequeño retraso
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulación de error simple (solo para que veas)
  if (pass.length < 4) {
    throw new Error("Contraseña muy corta (simulado)");
  }
  
  // Guardamos un token falso
  localStorage.setItem("authToken", "fake-jwt-token-for-visual-testing");
  
  // Guardamos datos básicos del usuario
  localStorage.setItem("usuarioActivo", JSON.stringify({ 
    email: email, 
    nombre: email.split('@')[0] // Un nombre de prueba basado en el email
  }));
  
  return { access_token: "fake-jwt-token-for-visual-testing" };
}

/**
 * SIMULADO: Verifica si el usuario tiene sesión activa
 */
async function verificarSesion() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    console.log("Simulado: No hay token, redirigiendo a login.");
    // Redirigir al login (index.html en tu caso)
    window.location.href = "/index.html"; 
    return false;
  }

  // Si hay un token (aunque sea falso), decimos que es válido.
  console.log("Simulado: Sesión válida con token falso.");
  return true;
}

/**
 * Cierra sesión del usuario
 * (Esta función no cambia, es solo lógica de localStorage)
 */
function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("usuarioActivo");
  window.location.href = "/index.html"; // O login.html, usa el correcto
}

// =============================================================
//      VERIFICAR SESIÓN AL CARGAR LA PÁGINA
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Si estamos en el dashboard, verificar que tenga sesión
  if (window.location.pathname.includes("dashboard")) {
    // 🔸 ¡CAMBIO AQUÍ! Llamamos a la versión simulada
    verificarSesion();
  }
});

// =============================================================
//      FORMULARIOS (CONECTADOS A FUNCIONES SIMULADAS)
// =============================================================
// (Todo este bloque no cambia, ya que ahora llama
// a las funciones simuladas 'registerUser' y 'loginUser')

// 🔹 Registro
document.getElementById("registerForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const data = {
    nombre: form[0].value.trim(),
    apellido: form[1].value.trim(), 
    edad: form[2].value.trim(),     
    email: form[3].value.trim(),
    pass: form[4].value.trim()
  };
  
  if (!data.nombre || !data.email || !data.pass) {
    return showAlert("warning", "Campos vacíos", "Completa Nombre, Correo y Contraseña");
  }

  try {
    await registerUser(data); // Llama a la función simulada
    showAlert("success", "Registro exitoso", "Tu cuenta ha sido creada (Simulado)");
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);
  } catch (err) {
    showAlert("error", "Error en registro", err.message);
  }
});

// 🔹 Login
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const form = e.target;
  const email = form[0].value.trim();
  const pass = form[1].value.trim();
  
  if (!email || !pass) {
    return showAlert("warning", "Campos vacíos", "Completa todos los campos");
  }

  try {
    await loginUser(email, pass); // Llama a la función simulada
    showAlert("success", "Inicio exitoso", "Bienvenido");
    
    setTimeout(() => {
      // ⬇️ ¡CAMBIO AQUÍ! ⬇️
      window.location.href = "inicio.html"; // Antes decía "dashboard.html"
      // ⬆️ ¡CAMBIO AQUÍ! ⬆️
    }, 1500);

  } catch (err) {
    showAlert("error", "Error de inicio", err.message);
  }
});

// 🔹 Recuperar (sigue siendo visual)
document.getElementById("recuperarForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = e.target[0].value.trim();
  
  if (!email) {
    return showAlert("warning", "Campo vacío", "Ingresa tu correo electrónico");
  }

  try {
    // TODO: Conectar con endpoint /auth/recover cuando esté listo
    showAlert("info", "En desarrollo", "Esta función será habilitada pronto");
    
  } catch (err) {
    showAlert("error", "Error", err.message);
  }
});