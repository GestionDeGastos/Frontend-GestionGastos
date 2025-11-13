// =================== IMPORTAR FUNCIONES DE API ===================
import * as API from './api.js';

console.log("✅ planes.js cargado");

function showAlert(icon, title, text) {
  if (typeof Swal === 'undefined') {
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

// ============================================================
//      CARGAR USUARIO BIENVENIDA
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("📄 Página de planes cargada");

  // Mostrar nombre del usuario
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (usuarioActivo) {
    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) {
      welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;
    }
  }

  // Cerrar sesión
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      API.cerrarSesion();
    });
  }

  // Cargar planes
  await cargarPlanes();

  // Modal - Abrir
  const btnAbrirModal = document.getElementById("btnAbrirModal");
  if (btnAbrirModal) {
    btnAbrirModal.addEventListener("click", abrirModal);
  }

  // Modal - Cerrar
  const btnCerrarModal = document.getElementById("btnCerrarModal");
  if (btnCerrarModal) {
    btnCerrarModal.addEventListener("click", cerrarModal);
  }

  // Formulario crear plan
  const formCrearPlan = document.getElementById("formCrearPlan");
  if (formCrearPlan) {
    formCrearPlan.addEventListener("submit", crearNuevoPlan);
  }

  // Cerrar modal al clickear overlay
  const modalOverlay = document.getElementById("modalCrearPlan");
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        cerrarModal();
      }
    });
  }
});

// ============================================================
//      FUNCIONES DEL MODAL
// ============================================================

function abrirModal() {
  console.log("🪟 Abriendo modal");
  const modal = document.getElementById("modalCrearPlan");
  if (modal) {
    modal.style.display = "flex";
  }
}

function cerrarModal() {
  console.log("🪟 Cerrando modal");
  const modal = document.getElementById("modalCrearPlan");
  if (modal) {
    modal.style.display = "none";
  }
  // Limpiar formulario
  const formCrearPlan = document.getElementById("formCrearPlan");
  if (formCrearPlan) {
    formCrearPlan.reset();
  }
}

// ============================================================
//      CREAR NUEVO PLAN
// ============================================================

async function crearNuevoPlan(e) {
  e.preventDefault();
  console.log("📋 Creando nuevo plan");

  try {
    // Obtener valores del formulario
    const planNombre = document.getElementById("planNombre")?.value?.trim();
    const planMonto = document.getElementById("planMonto")?.value;
    const planAhorro = document.getElementById("planAhorro")?.value;
    const planDuracion = document.getElementById("planDuracion")?.value;

    console.log("📝 Datos del plan:", {
      nombre: planNombre,
      monto: planMonto,
      ahorro: planAhorro,
      duracion: planDuracion,
    });

    // Validaciones
    if (!planNombre || !planMonto || !planDuracion) {
      showAlert("warning", "Campos incompletos", "Completa todos los campos requeridos");
      return;
    }

    if (isNaN(planMonto) || planMonto <= 0) {
      showAlert("warning", "Monto inválido", "El ingreso debe ser un número mayor a 0");
      return;
    }

    if (isNaN(planDuracion) || planDuracion <= 0) {
      showAlert("warning", "Duración inválida", "La duración debe ser mayor a 0");
      return;
    }

    // Preparar datos
    const dataPlan = {
      nombre_plan: planNombre,
      ingreso_total: parseFloat(planMonto),
      ahorro_deseado: planAhorro ? parseFloat(planAhorro) : 0,
      duracion_meses: parseInt(planDuracion),
    };

    console.log("🚀 Enviando plan:", dataPlan);

    // Enviar al backend
    const respuesta = await API.crearPlanGestion(dataPlan);
    console.log("✅ Plan creado:", respuesta);

    showAlert("success", "Plan creado", "Tu plan ha sido guardado correctamente");

    // Cerrar modal y recargar planes
    cerrarModal();
    await cargarPlanes();

  } catch (err) {
    console.error("❌ Error creando plan:", err);
    showAlert("error", "Error al crear plan", err.message);
  }
}

// ============================================================
//      CARGAR Y MOSTRAR PLANES
// ============================================================

async function cargarPlanes() {
  console.log("📥 Cargando planes...");

  try {
    const respuesta = await API.obtenerPlanesGestion();
    console.log("✅ Planes obtenidos:", respuesta);

    const planes = respuesta.data || respuesta || [];
    const planesGrid = document.getElementById("planesGrid");
    const noPlanesMsg = document.getElementById("noPlanesMsg");

    if (!planesGrid) {
      console.error("❌ No se encontró el elemento planesGrid");
      return;
    }

    // Limpiar grid
    planesGrid.innerHTML = "";

    if (planes.length === 0) {
      console.log("📭 No hay planes registrados");
      noPlanesMsg.style.display = "block";
      return;
    }

    noPlanesMsg.style.display = "none";

    // Crear tarjetas de planes
    planes.forEach((plan) => {
      const planCard = document.createElement("div");
      planCard.className = "plan-card";
      planCard.innerHTML = `
        <h3>${plan.nombre_plan}</h3>
        <p class="plan-monto">Ingreso: $${parseFloat(plan.ingreso_total).toFixed(2)}</p>
        <p class="plan-ahorro">Ahorro: $${parseFloat(plan.ahorro_deseado || 0).toFixed(2)}</p>
        <p class="plan-duracion">Duración: ${plan.duracion_meses} meses</p>
        <a href="plan-detalle.html?id=${plan.id}" class="btn btn-ver-detalle">Ver Detalle</a>
      `;
      planesGrid.appendChild(planCard);
    });

  } catch (err) {
    console.error("❌ Error cargando planes:", err);
    showAlert("error", "Error al cargar planes", err.message);
  }
}