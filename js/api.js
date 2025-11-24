import CONFIG from './config.js';

console.log("✅ api.js cargado correctamente");

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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error en el registro");
    }
    return await response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error login");
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
  if (!response.ok) throw new Error("Error perfil");
  return await response.json();
}

export async function obtenerDatosPerfil() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/perfil/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Error datos perfil");
  return await response.json();
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
  if (!response.ok) throw new Error("Error actualizar perfil");
  return await response.json();
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
  if (!response.ok) throw new Error("Error foto");
  return await response.json();
}

/* ============================================================
    INGRESOS Y GASTOS
   ============================================================ */
export async function obtenerIngresos() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/ingresos/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error ingresos");
  return await response.json();
}

export async function obtenerGastos() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/gastos/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error gastos");
  return await response.json();
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
  if (!response.ok) throw new Error("Error crear plan");
  return await response.json();
}

export async function obtenerPlanesGestion() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error obtener planes");
  return await response.json();
}

export async function obtenerPlanGestionById(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error obtener plan");
  return await response.json();
}

export async function obtenerAnalisisPlan(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${id}/analisis`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error analisis");
  return await response.json();
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
  if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Error actualizar plan");
  }
  return await response.json();
}

export async function eliminarPlan(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error eliminar plan");
  return await response.json();
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
  if (!response.ok) throw new Error("Error ingreso extra");
  return await response.json();
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
  if (!response.ok) throw new Error("Error gasto extra");
  return await response.json();
}

export async function crearGastoExtraordinarioEspecifico(datos) {
    // Alias para compatibilidad si se usa en otro lado
    return registrarGastoExtra(datos.plan_id, { monto: datos.monto });
}

/* ============================================================
    ADMIN Y REPORTES
   ============================================================ */
export async function obtenerReporte(inicio, fin) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/reporte?inicio=${inicio}&fin=${fin}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error reporte");
  return await response.json();
}

export async function obtenerDashboardAdmin(inicio = null, fin = null) {
  const token = obtenerToken();
  let url = `${CONFIG.API_URL}/api/admin/dashboard`;
  
  // Si hay fechas, las agregamos a la URL
  if (inicio && fin) {
    url += `?fecha_inicio=${inicio}&fecha_fin=${fin}`;
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error admin dashboard");
  return await response.json();
}

export async function obtenerListaUsuariosAdmin() {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/admin/usuarios`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error lista usuarios");
  return await response.json();
}

export async function obtenerDetalleUsuarioAdmin(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/admin/usuario/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error detalle usuario");
  return await response.json();
}

export async function eliminarUsuarioAdmin(id) {
  const token = obtenerToken();
  const response = await fetch(`${CONFIG.API_URL}/api/admin/usuario/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error al eliminar usuario");
  return await response.json(); 
}