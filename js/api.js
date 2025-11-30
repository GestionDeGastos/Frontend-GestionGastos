import CONFIG from './config.js';

console.log("✅ api.js cargado correctamente (Versión Anti-Bloqueo)");

/* ============================================================
    AUTENTICACIÓN
   ============================================================ */
export function obtenerToken() {
  return localStorage.getItem("authToken");
}

export function estaAutenticado() {
  return !!localStorage.getItem("authToken");
}

export function cerrarSesion() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("usuarioActivo");
  window.location.href = "index.html";
}

// --- FUNCIÓN HELPER PARA MANEJAR ERRORES DE SESIÓN ---
async function handleResponse(response) {
    if (response.status === 401) {
        console.warn("⚠️ Sesión expirada (401). Cerrando sesión...");
        cerrarSesion(); // Redirige al login inmediatamente
        throw new Error("Sesión expirada");
    }
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `Error ${response.status}: ${response.statusText}`);
    }
    return await response.json();
}

export async function registrarUsuario(nombre, apellido, edad, correo, password, adminKey = null) {
  try {
    const endpoint = adminKey ? "/auth/register/admin" : "/auth/register";
    const url = `${CONFIG.API_URL}${endpoint}`;
    
    const payload = {
      nombre, apellido, edad: parseInt(edad, 10), correo, password
    };
    if (adminKey) payload.admin_key = adminKey;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Error registro:", error);
    throw error;
  }
}

export async function loginUsuario(correo, password) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password }),
    });

    // Aquí no usamos handleResponse porque queremos manejar el token manualmente
   if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    // Mensaje claro para el usuario
    let mensaje = "Error al iniciar sesión";

    if (error.detail) mensaje = error.detail;
    if (error.message) mensaje = error.message;

    throw new Error(mensaje);
}


    const data = await response.json();
    localStorage.setItem("authToken", data.access_token);
    
    const usuario = await obtenerPerfilUsuario(data.access_token);
    localStorage.setItem("usuarioActivo", JSON.stringify(usuario));
    
    return data;
  } catch (error) {
    console.error("Error login:", error);
    throw error;
  }
}

export async function obtenerPerfilUsuario(token) {
  const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) return null; // Caso especial login
  if (!response.ok) throw new Error("Error perfil");
  return await response.json();
}

export async function obtenerDatosPerfil() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/perfil/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return await handleResponse(response);
}

export async function actualizarDatosPerfil(datos) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/perfil/`, {
    method: "PATCH",
    headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(datos),
  });
  return await handleResponse(response);
}

export async function subirFotoPerfil(archivo) {
  const token = obtenerToken();
  const formData = new FormData();
  formData.append("file", archivo);

  const response = await fetch(`${CONFIG.API_URL}/perfil/foto`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return await handleResponse(response);
}

/* ============================================================
    INGRESOS Y GASTOS
   ============================================================ */
export async function obtenerIngresos() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/ingresos/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function obtenerGastos() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/gastos/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

/* ============================================================
    PLANES DE GESTIÓN
   ============================================================ */
export async function crearPlanGestion(plan) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/`, {
    method: "POST",
    headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(plan),
  });
  return await handleResponse(response);
}

export async function obtenerPlanesGestion() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function obtenerPlanGestionById(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function obtenerAnalisisPlan(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${id}/analisis`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function actualizarPlanGestion(id, datos) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${id}/personalizar`, {
    method: "PUT",
    headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(datos),
  });
  return await handleResponse(response);
}

export async function eliminarPlan(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

// --- FUNCIONES DE EXTRAS ---
export async function registrarIngresoExtra(planId, datos) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/ingresos_extra/${planId}`, {
    method: "POST",
    headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ monto: datos.monto }),
  });
  return await handleResponse(response);
}

export async function registrarGastoExtra(planId, datos) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/gastos_extra/${planId}`, {
    method: "POST",
    headers: { 
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ monto: datos.monto }),
  });
  return await handleResponse(response);
}

export async function crearGastoExtraordinarioEspecifico(datos) {
    return registrarGastoExtra(datos.plan_id, { monto: datos.monto });
}

/* ============================================================
    DASHBOARD Y REPORTES
   ============================================================ */
export async function obtenerDashboardUsuario() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/dashboard/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function obtenerReporte(inicio, fin) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/reporte?inicio=${inicio}&fin=${fin}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function obtenerDashboardAdmin(inicio = null, fin = null) {
  const token = obtenerToken();
  let url = `${CONFIG.API_URL}/api/admin/dashboard`;
  
  if (inicio && fin) {
    url += `?fecha_inicio=${inicio}&fecha_fin=${fin}`;
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function obtenerListaUsuariosAdmin() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/admin/usuarios`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function obtenerDetalleUsuarioAdmin(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/admin/usuario/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}

export async function eliminarUsuarioAdmin(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/admin/usuarios/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await handleResponse(response);
}