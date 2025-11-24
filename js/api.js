// js/api.js
import CONFIG from './config.js';

console.log("✅ api.js cargado. CONFIG:", CONFIG);

// ============================================================
//      FUNCIONES DE AUTENTICACIÓN
// ============================================================


export async function registrarUsuario(nombre, apellido, edad, correo, password, adminKey = null) {
  try {
    
    // 1. DECIDIR EL ENDPOINT CORRECTO
    const endpoint = adminKey ? "/auth/register/admin" : "/auth/register";
    const url = `${CONFIG.API_URL}${endpoint}`;

    console.log(`Enviando registro a: ${url}`);

    // 2. Construir el objeto de datos
    const payload = {
      nombre: nombre,
      apellido: apellido,
      edad: parseInt(edad, 10),
      correo: correo,
      password: password,
    };

    // Si es admin, agregamos la clave al JSON
    if (adminKey) {
        payload.admin_key = adminKey;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log("Status registro:", response.status);

    if (!response.ok) {
      let errorMessage = "Error en el registro";
      try {
        const error = await response.json();
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail.map((d) => d.msg || JSON.stringify(d)).join(" | ");
        } else if (typeof error.detail === "string") {
          errorMessage = error.detail;
        }
      } catch (e) { console.error(e); }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error registrando usuario:", error);
    throw error;
  }
}

/**
 * Inicia sesión de un usuario
 * POST /auth/login
 */
export async function loginUsuario(correo, password) {
  try {
    console.log("Enviando login a:", CONFIG.API_URL + "/auth/login");

    const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        correo,
        password,
      }),
    });

    console.log("Status login:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("Error del backend:", error);
      throw new Error(error.detail || "Error al iniciar sesión");
    }

    const data = await response.json();
    console.log("Token recibido:", data.access_token);

    // Guardar token en localStorage
    localStorage.setItem("authToken", data.access_token);

    // Obtener datos del usuario
    const usuarioData = await obtenerPerfilUsuario(data.access_token);
    console.log("Usuario obtenido:", usuarioData);
    localStorage.setItem("usuarioActivo", JSON.stringify(usuarioData));

    return data;
  } catch (error) {
    console.error("Error en loginUsuario:", error);
    throw error;
  }
}

/**
 * Obtiene el perfil del usuario autenticado
 * GET /auth/me
 */
export async function obtenerPerfilUsuario(token) {
  try {
    console.log("Obteniendo perfil...");

    const response = await fetch(`${CONFIG.API_URL}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener perfil");
    }

    const data = await response.json();
    console.log("Perfil obtenido:", data);
    return data;
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    throw error;
  }
}

// ============================================================
//      FUNCIONES DE INGRESOS
// ============================================================

export async function crearIngreso(ingreso) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/ingresos/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ingreso),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al crear ingreso");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creando ingreso:", error);
    throw error;
  }
}

export async function obtenerIngresos() {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/ingresos/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener ingresos");
    }

    return await response.json();
  } catch (error) {
    console.error("Error obteniendo ingresos:", error);
    throw error;
  }
}

export async function obtenerIngresoById(id) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/ingresos/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener ingreso");
    }

    return await response.json();
  } catch (error) {
    console.error("Error obteniendo ingreso:", error);
    throw error;
  }
}

export async function actualizarIngreso(id, ingreso) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/ingresos/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ingreso),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al actualizar ingreso");
    }

    return await response.json();
  } catch (error) {
    console.error("Error actualizando ingreso:", error);
    throw error;
  }
}

export async function eliminarIngreso(id) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/ingresos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al eliminar ingreso");
    }

    return await response.json();
  } catch (error) {
    console.error("Error eliminando ingreso:", error);
    throw error;
  }
}
export async function crearGastoExtraordinarioEspecifico(datos) {
  const token = localStorage.getItem("authToken");
  const response = await fetch(`${CONFIG.API_URL}/gastos/extraordinario`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!response.ok) throw new Error("Error al desbloquear plan");
  return await response.json();
}
// ============================================================
//      FUNCIONES DE GASTOS
// ============================================================
export async function crearGasto(gasto) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/gastos/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gasto),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Error del backend al crear gasto:", error);
      
      let errorMessage = "Error al crear gasto";
      if (error.detail) {
        if (Array.isArray(error.detail)) {
          errorMessage = error.detail.map(d => d.msg || JSON.stringify(d)).join(" | ");
        } else {
          errorMessage = error.detail;
        }
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creando gasto:", error);
    throw error;
  }
}

export async function obtenerGastos() {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/gastos/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener gastos");
    }

    return await response.json();
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    throw error;
  }
}

export async function obtenerGastoById(id) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/gastos/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener gasto");
    }

    return await response.json();
  } catch (error) {
    console.error("Error obteniendo gasto:", error);
    throw error;
  }
}

export async function actualizarGasto(id, gasto) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/gastos/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gasto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al actualizar gasto");
    }

    return await response.json();
  } catch (error) {
    console.error("Error actualizando gasto:", error);
    throw error;
  }
}

export async function eliminarGasto(id) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/gastos/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al eliminar gasto");
    }

    return await response.json();
  } catch (error) {
    console.error("Error eliminando gasto:", error);
    throw error;
  }
}

// ============================================================
//      FUNCIONES DE PLANES DE GESTIÓN
// ============================================================

export async function crearPlanGestion(plan) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plan),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al crear plan");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creando plan:", error);
    throw error;
  }
}

export async function obtenerPlanesGestion() {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener planes");
    }

    return await response.json();
  } catch (error) {
    console.error("Error obteniendo planes:", error);
    throw error;
  }
}

export async function obtenerPlanGestionById(planId) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${planId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener plan");
    }

    return await response.json();
  } catch (error) {
    console.error("Error obteniendo plan:", error);
    throw error;
  }
}

export async function obtenerAnalisisPlan(planId) {
  const token = localStorage.getItem("authToken");

  try {
    const response = await fetch(
      `${CONFIG.API_URL}/api/plan-gestion/${planId}/analisis`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener análisis");
    }

    return await response.json();
  } catch (error) {
    console.error("Error obteniendo análisis:", error);
    throw error;
  }
}

// ============================================================
//      FUNCIONES AUXILIARES
// ============================================================

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

/**
 * Obtiene los datos completos del perfil (incluyendo foto y apellido)
 * GET /perfil/
 */
export async function obtenerDatosPerfil() {
  const token = localStorage.getItem("authToken");
  try {
    const response = await fetch(`${CONFIG.API_URL}/perfil/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Error al cargar datos del perfil");
    return await response.json();
  } catch (error) {
    console.error("Error en obtenerDatosPerfil:", error);
    throw error;
  }
}

/**
 * Actualiza nombre, apellido o password
 * PATCH /perfil/
 */
export async function actualizarDatosPerfil(datos) {
  const token = localStorage.getItem("authToken");
  try {
    const response = await fetch(`${CONFIG.API_URL}/perfil/`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al actualizar perfil");
    }
    return await response.json();
  } catch (error) {
    console.error("Error en actualizarDatosPerfil:", error);
    throw error;
  }
}

/**
 * Sube la foto de perfil
 * POST /perfil/foto
 */
export async function subirFotoPerfil(archivo) {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  formData.append("file", archivo); // 'file' es el nombre que espera FastAPI

  try {
    const response = await fetch(`${CONFIG.API_URL}/perfil/foto`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // NO poner Content-Type aquí, el navegador lo pone automático con el boundary
      },
      body: formData,
    });

    if (!response.ok) throw new Error("Error al subir la imagen");
    return await response.json();
  } catch (error) {
    console.error("Error en subirFotoPerfil:", error);
    throw error;
  }
}

/**
 * Obtiene el reporte de totales por rango de fechas
 * GET /api/reporte?inicio=YYYY-MM-DD&fin=YYYY-MM-DD
 */
export async function obtenerReporte(fechaInicio, fechaFin) {
  const token = localStorage.getItem("authToken");
  try {
    // Construimos la URL con los parámetros query
    const url = `${CONFIG.API_URL}/api/reporte?inicio=${fechaInicio}&fin=${fechaFin}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al obtener reporte");
    }
    return await response.json();
  } catch (error) {
    console.error("Error en obtenerReporte:", error);
    throw error;
  }
}

export async function actualizarPlanGestion(id, datos) {
    const token = localStorage.getItem("authToken"); 

    const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${id}/personalizar`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datos)
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.log("DETALLES DEL ERROR:", errorData);
        throw new Error(errorData.detail || 'Error al actualizar el plan');
    }

    return await response.json();
}

export async function obtenerDashboardAdmin() {
    const token = localStorage.getItem("authToken");
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/admin/dashboard`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            // Si es 403, es que no es admin
            if(response.status === 403) throw new Error("Acceso denegado: No eres administrador.");
            throw new Error("Error al obtener datos del dashboard admin");
        }

        return await response.json();
    } catch (error) {
        console.error("Error en obtenerDashboardAdmin:", error);
        throw error;
    }
}

export async function obtenerListaUsuariosAdmin() {
    const token = localStorage.getItem("authToken");
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/admin/usuarios`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Error al cargar lista de usuarios");
        
        return await response.json(); // Retorna { total_usuarios, usuarios: [] }
    } catch (error) {
        console.error("Error en obtenerListaUsuariosAdmin:", error);
        throw error;
    }
}

export async function obtenerDetalleUsuarioAdmin(idUsuario) {
    const token = localStorage.getItem("authToken");
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/admin/usuario/${idUsuario}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Error al obtener detalle del usuario");
        
        return await response.json();
    } catch (error) {
        console.error("Error en obtenerDetalleUsuarioAdmin:", error);
        throw error;
    }
}
export async function registrarIngresoExtra(plan_id, data) {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/ingresos_extra/${plan_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                monto: data.monto
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al registrar ingreso extra");
        }

        return await response.json();
    } catch (error) {
        console.error("Error en registrarIngresoExtra:", error);
        throw error;
    }
}

export async function registrarGastoExtra(plan_id, data) {
    const token = localStorage.getItem("authToken");

    try {
        const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/gastos_extra/${plan_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({
                monto: data.monto
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Error al registrar gasto extraordinario");
        }

        return await response.json();
    } catch (error) {
        console.error("Error en registrarGastoExtra:", error);
        throw error;
    }
}
export async function eliminarPlan(planId) {
    const token = localStorage.getItem("authToken");

    const response = await fetch(`${CONFIG.API_URL}/api/plan-gestion/${planId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {
        let error = {};
        try { error = await response.json(); } catch {}
        throw new Error(error.detail || "Error al eliminar el plan");
    }

    return await response.json();
}
