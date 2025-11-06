// =================== CONFIGURACIÓN GENERAL ===================
// 🔹 URL del backend
const API_URL = "http://127.0.0.1:8010"; 

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
//      SECCIÓN DE CONEXIÓN REAL AL BACKEND
// =============================================================

/**
 * Registra un nuevo usuario en el backend.
 * Conecta con: POST /usuarios/
 */
async function registerUser(data) {
  const res = await fetch(`${API_URL}/usuarios/`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: data.nombre,
      correo: data.email,
      password: data.pass
    })
  });
  
  const responseData = await res.json();
  
  if (!res.ok) {
    throw new Error(responseData.detail || "Error al registrar usuario");
  }
  return responseData;
}

/**
 * Inicia sesión de un usuario en el backend.
 * Conecta con: POST /auth/login
 */
async function loginUser(email, pass) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: email, password: pass }) 
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Error al iniciar sesión");
    }
    
    // Guardamos el token
    localStorage.setItem("authToken", data.access_token);
    
    // Guardamos datos básicos del usuario
    localStorage.setItem("usuarioActivo", JSON.stringify({ 
      email: email, 
      nombre: email.split('@')[0]
    }));
    
    return data;

  } catch (error) {
    console.error("Error en login:", error.message);
    throw error;
  }
}

/**
 * Verifica si el usuario tiene sesión activa
 */
async function verificarSesion() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.location.href = "/login.html";
    return false;
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!res.ok) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("usuarioActivo");
      window.location.href = "/login.html";
      return false;
    }

    return true;

  } catch (error) {
    console.error("Error verificando sesión:", error);
    window.location.href = "/login.html";
    return false;
  }
}

/**
 * Cierra sesión del usuario
 */
function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("usuarioActivo");
  window.location.href = "/login.html";
}

// =============================================================
//      VERIFICAR SESIÓN AL CARGAR LA PÁGINA
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Si estamos en el dashboard, verificar que tenga sesión
  if (window.location.pathname.includes("dashboard")) {
    verificarSesion();
  }
});

// =============================================================
//      FORMULARIOS (CONECTADOS AL BACKEND)
// =============================================================

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
    await registerUser(data);
    showAlert("success", "Registro exitoso", "Tu cuenta ha sido creada");
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
    const result = await loginUser(email, pass);
    showAlert("success", "Inicio exitoso", "Bienvenido");
    
    setTimeout(() => {
      window.location.href = "dashboard.html"; 
    }, 1500);

  } catch (err) {
    showAlert("error", "Error de inicio", err.message);
  }
});

// 🔹 Recuperar (cuando esté lista en el backend)
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