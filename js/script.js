// =================== CONFIGURACIÓN GENERAL ===================
// 🔹 Cuando conecten el backend, solo cambien esta URL
const API_URL = "http://localhost:3000/api"; 

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

async function fakeRegister(data) {
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  if (usuarios.some(u => u.email === data.email)) throw new Error("Correo ya registrado");
  usuarios.push(data);
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
  return { message: "Cuenta creada exitosamente" };
}

async function fakeLogin(email, pass) {
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const user = usuarios.find(u => u.email === email && u.pass === pass);
  if (!user) throw new Error("Correo o contraseña incorrectos");
  localStorage.setItem("usuarioActivo", JSON.stringify(user));
  return { message: `Bienvenido ${user.nombre}`, user };
}

async function fakeRecover(email) {
  let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];
  const user = usuarios.find(u => u.email === email);
  if (!user) throw new Error("Correo no encontrado");
  return { message: "Correo de recuperación enviado" };
}

// =============================================================
//      SECCIÓN DE CONEXIÓN REAL AL BACKEND (DESCOMENTAR LUEGO)
// =============================================================
/*
// 🔸 Cuando el backend esté listo, descomentar estas funciones:

async function registerUser(data) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Error al registrar usuario");
  return res.json();
}

async function loginUser(email, pass) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, pass })
  });
  if (!res.ok) throw new Error("Credenciales inválidas");
  return res.json();
}

async function recoverUser(email) {
  const res = await fetch(`${API_URL}/recover`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  if (!res.ok) throw new Error("Correo no encontrado");
  return res.json();
}
*/

// =============================================================
//      FORMULARIOS (LISTOS PARA BACKEND)
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
  if (Object.values(data).some(v => !v)) return showAlert("warning", "Campos vacíos", "Completa todos los campos");

  try {
    // 🔸 CAMBIA fakeRegister → registerUser cuando tengas backend
    await fakeRegister(data);
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
    // 🔸 CAMBIA fakeLogin → loginUser cuando tengas backend
    const result = await fakeLogin(email, pass);
    showAlert("success", "Inicio exitoso", result.message);
    setTimeout(() => {
      // 🔹 Redirección temporal, cambiar cuando haya dashboard
      showAlert("info", "Sesión activa", "Tu sesión se ha iniciado correctamente");
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
    // 🔸 CAMBIA fakeRecover → recoverUser cuando tengas backend
    await fakeRecover(email);
    showAlert("info", "Correo enviado", "Revisa tu bandeja de entrada");
    setTimeout(() => (window.location.href = "index.html"), 2000);
  } catch (err) {
    showAlert("error", "Error", err.message);
  }
});
