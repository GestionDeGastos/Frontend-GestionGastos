// =================== CONFIGURACIÓN GENERAL ===================
// 🔹 URL del backend
const API_URL = "http://127.0.0.1:8000"; 

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
//      SECCIÓN DE SIMULACIÓN LOCAL (SIN BACKEND)
// =============================================================

// Esta función se mantiene por si el backend de "recuperar" aún no está listo.
async function fakeRecover(email) {
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const user = usuarios.find(u => u.email === email);
  if (!user) throw new Error("Correo no encontrado (simulado)");
  return { message: "Correo de recuperación enviado (simulado)" };
}

// Las funciones fakeRegister y fakeLogin ya no se usan.

// =============================================================
//      SECCIÓN DE CONEXIÓN REAL AL BACKEND
// =============================================================

/**
 * Registra un nuevo usuario en el backend.
 * Conecta con: POST /usuarios/
 */
async function registerUser(data) {
  // El endpoint de tu backend es /usuarios/
  const res = await fetch(`${API_URL}/usuarios/`, { 
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // El backend espera nombre, correo y password
    body: JSON.stringify({
      nombre: data.nombre,
      correo: data.email,
      password: data.pass
    })
  });
  
  const responseData = await res.json();
  
  if (!res.ok) {
    // Lanzar el mensaje de error que viene del backend (ej: "El correo... ya está registrado")
    throw new Error(responseData.detail || "Error al registrar usuario");
  }
  return responseData;
}

/**
 * Inicia sesión de un usuario en el backend.
 * Conecta con: POST /login
 */
async function loginUser(email, pass) {
  const res = await fetch(`${API_URL}/login`, { //
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // El backend espera "correo" y "password"
    body: JSON.stringify({ correo: email, password: pass }) 
  });

  const data = await res.json();

  if (!res.ok) {
    // Lanzar el mensaje de error que viene del backend (ej: "Contraseña incorrecta")
    throw new Error(data.detail || "Error al iniciar sesión");
  }
  
  // Guardamos el token y los datos del usuario
  localStorage.setItem("authToken", data.token);
  
  // Guardamos datos básicos del usuario para usar en el dashboard
  // El backend solo devuelve el token, así que simulamos el objeto 'usuarioActivo'
  localStorage.setItem("usuarioActivo", JSON.stringify({ 
      email: email, 
      nombre: email.split('@')[0] // Usamos la parte local del email como nombre temporal
  }));
  
  return data; // Devuelve { message: "...", token: "..." }
}

/*
// 🔸 Función de recuperar (cuando esté lista en el backend)
async function recoverUser(email) {
  const res = await fetch(`${API_URL}/recover`, { // (Endpoint de ejemplo)
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error("Correo no encontrado");
  return res.json();
}
*/

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
  
  // Solo validamos los campos que sí usa el backend
  if (!data.nombre || !data.email || !data.pass) {
    return showAlert("warning", "Campos vacíos", "Completa Nombre, Correo y Contraseña");
  }

  try {
    // 🔸 ¡Conectado al backend!
    await registerUser(data);
    showAlert("success", "Registro exitoso", "Tu cuenta ha sido creada");
    setTimeout(() => (window.location.href = "index.html"), 1500);
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
  if (!email || !pass) return showAlert("warning", "Campos vacíos", "Completa todos los campos");

  try {
    // 🔸 ¡Conectado al backend!
    const result = await loginUser(email, pass);
    showAlert("success", "Inicio exitoso", result.message);
    
    // Redirigir al dashboard
    setTimeout(() => {
      window.location.href = "dashboard.html"; 
    }, 1500);

  } catch (err) {
    showAlert("error", "Error de inicio", err.message);
  }
});

// 🔹 Recuperar
document.getElementById("recuperarForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = e.target[0].value.trim();
  if (!email) return showAlert("warning", "Campo vacío", "Ingresa tu correo electrónico");

  try {
    // 🔸 CAMBIA fakeRecover → recoverUser cuando tengas el backend listo
    await fakeRecover(email);
    showAlert("info", "Correo enviado", "Revisa tu bandeja de entrada (simulado)");
    setTimeout(() => (window.location.href = "index.html"), 2000);
  } catch (err) {
    showAlert("error", "Error", err.message);
  }
});