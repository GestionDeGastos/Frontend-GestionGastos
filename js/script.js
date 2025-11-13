// =================== CONFIGURACIÓN GENERAL ===================

const CONFIG = {
  API_URL: "http://127.0.0.1:8000",
};

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
//      CONEXIÓN REAL CON BACKEND (FASTAPI + SUPABASE)
// =============================================================

/**
 * REGISTRO REAL
 */
async function registerUser(data) {
  const res = await fetch(`${CONFIG.API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: data.nombre,
      apellido: data.apellido,
      edad: data.edad,
      email: data.email,
      password: data.pass
    })
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.detail || "Error al registrar");
  }

  return json;
}

/**
 * LOGIN REAL
 */
async function loginUser(email, pass) {
  const res = await fetch(`${CONFIG.API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: pass })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.detail || "Error al iniciar sesión");
  }

  // Guardar token real
  localStorage.setItem("authToken", data.access_token);

  // Guardar datos del usuario
  localStorage.setItem("usuarioActivo", JSON.stringify({
    email: email,
    nombre: email.split("@")[0]
  }));

  return data;
}

/**
 * VERIFICAR SESIÓN REAL
 */
async function verificarSesion() {
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  const res = await fetch(`${CONFIG.API_URL}/perfil`, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("usuarioActivo");
    window.location.href = "index.html";
  }
}

/**
 * CERRAR SESIÓN REAL
 */
function logout() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("usuarioActivo");
  window.location.href = "index.html";
}

// =============================================================
//      VERIFICAR SESIÓN AL CARGAR LA PÁGINA
// =============================================================

document.addEventListener("DOMContentLoaded", () => {
  if (
    window.location.pathname.includes("dashboard") ||
    window.location.pathname.includes("inicio")
  ) {
    verificarSesion();
  }
});

// =============================================================
//      FORMULARIOS – YA CONECTADOS AL BACKEND REAL
// =============================================================

// 🔹 REGISTRO
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
    return showAlert("warning", "Campos vacíos", "Completa todos los campos requeridos");
  }

  try {
    await registerUser(data);
    showAlert("success", "Registro exitoso", "Tu cuenta ha sido creada correctamente");
    
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1500);

  } catch (err) {
    showAlert("error", "Error al registrar", err.message);
  }
});

// 🔹 LOGIN
document.getElementById("loginForm")?.addEventListener("submit", async e => {
  e.preventDefault();

  const form = e.target;
  const email = form[0].value.trim();
  const pass = form[1].value.trim();

  if (!email || !pass) {
    return showAlert("warning", "Campos vacíos", "Completa todos los campos");
  }

  try {
    await loginUser(email, pass);
    showAlert("success", "Inicio exitoso", "Bienvenido");

    setTimeout(() => {
      window.location.href = "inicio.html";
    }, 1200);

  } catch (err) {
    showAlert("error", "Error al iniciar sesión", err.message);
  }
});

// 🔹 RECUPERAR CONTRASEÑA (pendiente)
document.getElementById("recuperarForm")?.addEventListener("submit", async e => {
  e.preventDefault();
  const email = e.target[0].value.trim();

  if (!email) {
    return showAlert("warning", "Campo vacío", "Ingresa tu correo electrónico");
  }

  showAlert("info", "En desarrollo", "Pronto estará disponible.");
});
