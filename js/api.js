// js/api.js
import CONFIG from './config.js';

console.log("✅ api.js cargado. CONFIG:", CONFIG);

// ============================================================
//      FUNCIONES DE AUTENTICACIÓN
// ============================================================

/**
 * Registra un nuevo usuario
 * POST /auth/register
 *
 * IMPORTANTE: el backend espera:
 * {
 *   nombre: string,
 *   apellido: string,
 *   edad: number,
 *   correo: string,
 *   password: string
 * }
 */
export async function registrarUsuario(nombre, apellido, edad, correo, password) {
  try {
    console.log("📤 Enviando registro a:", `${CONFIG.API_URL}/auth/register`);

    const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre: nombre,
        apellido: apellido,
        edad: parseInt(edad, 10),
        correo: correo,
        password: password,
      }),
    });

    console.log("📥 Status registro:", response.status);

    if (!response.ok) {
      let errorMessage = "Error en el registro";

      try {
        const error = await response.json();
        console.error("❌ Error del backend:", error);

        if (Array.isArray(error.detail)) {
          // FastAPI 422: detail es un arreglo de errores
          errorMessage = error.detail
            .map((d) => d.msg || JSON.stringify(d))
            .join(" | ");
        } else if (typeof error.detail === "string") {
          errorMessage = error.detail;
        }
      } catch (parseErr) {
        console.error("❌ No se pudo parsear el error:", parseErr);
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("✅ Registro exitoso:", data);
    return data;
  } catch (error) {
    console.error("❌ Error registrando usuario:", error);
    throw error;
  }
}

/**
 * Inicia sesión de un usuario
 * POST /auth/login
 */
export async function loginUsuario(correo, password) {
  try {
    console.log("📤 Enviando login a:", CONFIG.API_URL + "/auth/login");

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

    console.log("📥 Status login:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Error del backend:", error);
      throw new Error(error.detail || "Error al iniciar sesión");
    }

    const data = await response.json();
    console.log("✅ Token recibido:", data.access_token);

    // Guardar token en localStorage
    localStorage.setItem("authToken", data.access_token);

    // Obtener datos del usuario
    const usuarioData = await obtenerPerfilUsuario(data.access_token);
    console.log("✅ Usuario obtenido:", usuarioData);
    localStorage.setItem("usuarioActivo", JSON.stringify(usuarioData));

    return data;
  } catch (error) {
    console.error("❌ Error en loginUsuario:", error);
    throw error;
  }
}

/**
 * Obtiene el perfil del usuario autenticado
 * GET /auth/me
 */
export async function obtenerPerfilUsuario(token) {
  try {
    console.log("📤 Obteniendo perfil...");

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
    console.log("✅ Perfil obtenido:", data);
    return data;
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
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
      throw new Error(error.detail || "Error al crear gasto");
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
