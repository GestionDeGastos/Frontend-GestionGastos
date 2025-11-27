import * as API from './api.js';

const PALETA_COLORES_DONA = ['#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b', '#ffce47', '#47ceff'];
let planActual = null;

/* =========================================
   1. CARGA INICIAL
   ========================================= */
function cargarUsuario() {
    const welcomeMsg = document.getElementById("welcomeMsg");
    const logoutBtn = document.getElementById("logoutBtn");
    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));

    if (!usuarioActivo) return;
    if (welcomeMsg) welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;
    if (logoutBtn) logoutBtn.addEventListener("click", () => API.cerrarSesion());
}

async function cargarDetallesDelPlan() {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get('id');

    if (!planId) return;

    try {
        const plan = await API.obtenerPlanGestionById(planId);
        planActual = plan;

        let analisis = {};
        try {
            const res = await API.obtenerAnalisisPlan(planId);
            analisis = res.analisis || res;
        } catch (e) { console.log("Sin análisis", e); }

        actualizarVistaDetalle(plan, analisis);

    } catch (error) {
        console.error("Error cargando plan:", error);
        const titulo = document.getElementById("planTitulo");
        if (titulo) titulo.textContent = "Error de conexión";
    }
}

function actualizarVistaDetalle(plan, analisis) {
    const titulo = document.getElementById("planTitulo");
    if (titulo) titulo.textContent = plan.nombre_plan;

    const fmt = (m) => (m || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

    const progresoResumen = document.getElementById("progresoResumen");
    if (progresoResumen) {
        progresoResumen.innerHTML = `
          <h3>${fmt(plan.ingreso_total)}</h3>
          <p>Ingreso total mensual</p>
          <hr>
          <h4>${fmt(plan.ahorro_deseado)}</h4>
          <p>Meta de Ahorro</p>
        `;
    }

    renderizarGraficoDetalle(plan);
    mostrarAnalisis(analisis);
}

function renderizarGraficoDetalle(plan) {
    const canvas = document.getElementById('graficaProgresoDona');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dist = plan.distribucion_gastos || {};
    
    // Filtrar gastos 0 para que no se vea feo
    const labels = [];
    const data = [];
    for(const [key, value] of Object.entries(dist)){
        if(value > 0){
            labels.push(key);
            data.push(value);
        }
    }

    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: PALETA_COLORES_DONA,
                borderColor: '#0f0f23',
                borderWidth: 2
            }]
        },
        options: {
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

function mostrarAnalisis(analisis) {
    const container = document.getElementById('statsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="stat-card"><h4>Total Gastos</h4><p>$${(analisis.total_gastos || 0).toLocaleString()}</p></div>
      <div class="stat-card"><h4>% Ahorro</h4><p>${analisis.porcentaje_ahorro || 0}%</p></div>
      <div class="stat-card"><h4>Mayor Gasto</h4><p>${analisis.mayor_gasto || "N/A"}</p></div>
    `;
}

/* =========================================
   2. MODAL EDICIÓN
   ========================================= */
function setupModalEdicion() {
    const modal = document.getElementById("modalEditarPlan");
    const btnEditar = document.getElementById("btnEditarPlan");
    const btnCerrar = document.getElementById("btnCerrarEdit");
    const btnCancelar = document.getElementById("btnCancelarEdit");
    const form = document.getElementById("formEditarPlan");

    if (btnEditar) {
        btnEditar.addEventListener("click", (e) => {
            e.preventDefault();
            if (!planActual) return;
            llenarFormularioEdicion(planActual);
            modal.style.display = "flex";
            setTimeout(() => modal.classList.add("active"), 10);
        });
    }

    const cerrar = (e) => {
        if (e) e.preventDefault();
        modal.classList.remove("active");
        setTimeout(() => modal.style.display = 'none', 300);
    };

    if (btnCerrar) btnCerrar.addEventListener("click", cerrar);
    if (btnCancelar) btnCancelar.addEventListener("click", cerrar);

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await guardarCambiosPlan();
        });
    }
}

function llenarFormularioEdicion(plan) {
    document.getElementById("editNombre").value = plan.nombre_plan || "";
    document.getElementById("editDuracion").value = plan.duracion_meses || 1;
    document.getElementById("editIngreso").value = plan.ingreso_total || 0;
    document.getElementById("editAhorro").value = plan.ahorro_deseado || 0;

    const container = document.getElementById("containerDistribucion");
    container.innerHTML = "";
    
    for (const [cat, monto] of Object.entries(plan.distribucion_gastos || {})) {
        if (cat === "Gasto Extraordinario") continue;
        container.innerHTML += `
            <div class="dist-card">
                <label>${cat}</label>
                <div class="input-moneda-wrapper">
                    <span class="currency-symbol">$</span>
                    <input type="number" class="input-monto-dist" name="cat_${cat}" value="${monto}" step="0.01">
                </div>
            </div>`;
    }
}

async function guardarCambiosPlan() {
    const ingreso = planActual.ingreso_total;
    const ahorro = planActual.ahorro_deseado;
    const disponible = ingreso - ahorro;

    const inputs = document.querySelectorAll(".input-monto-dist");
    let montos = {};
    let suma = 0;

    inputs.forEach(i => {
        const val = parseFloat(i.value) || 0;
        montos[i.name.replace("cat_", "")] = val;
        suma += val;
    });

    if (suma > disponible) return Swal.fire("Error", "Los gastos superan el disponible", "error");

    let porcentajes = {};
    for (let k in montos) {
        porcentajes[k] = parseFloat(((montos[k] / disponible) * 100).toFixed(2));
    }

    try {
        await API.actualizarPlanGestion(planActual.id, { porcentajes });
        Swal.fire("Éxito", "Plan actualizado", "success");
        document.getElementById("modalEditarPlan").classList.remove("active");
        setTimeout(() => document.getElementById("modalEditarPlan").style.display = 'none', 300);
        cargarDetallesDelPlan();
    } catch (e) {
        Swal.fire("Error", e.message, "error");
    }
}

/* =========================================
   3. MINI MODALES Y ELIMINAR PLAN
   ========================================= */
function abrirMiniModal(id) {
    const m = document.getElementById(id);
    if (m) {
        const inputs = m.querySelectorAll("input");
        inputs.forEach(input => input.value = "");
        
        m.style.display = "flex";
    }
}

function cerrarMiniModal(id) {
    const m = document.getElementById(id);
    if (m) {
        m.style.display = "none";
        const inputs = m.querySelectorAll("input");
        inputs.forEach(input => input.value = "");
    }
}

async function guardarNuevoIngreso() {
    const input = document.getElementById("montoNuevoIngreso");
    const monto = parseFloat(input.value);
    if (!monto || monto <= 0) return Swal.fire("Error", "Monto inválido", "warning");

    try {
        await API.registrarIngresoExtra(planActual.id, { monto });
        cerrarMiniModal("modalNuevoIngreso");
        input.value = "";
        Swal.fire("Registrado", "Ingreso añadido", "success");
        cargarDetallesDelPlan();
    } catch (e) {
        Swal.fire("Error", e.message, "error");
    }
}

async function guardarGastoExtra() {
    const input = document.getElementById("montoGastoExtra");
    const monto = parseFloat(input.value);
    if (!monto || monto <= 0) return Swal.fire("Error", "Monto inválido", "warning");

    try {
        await API.registrarGastoExtra(planActual.id, { monto });
        cerrarMiniModal("modalGastoExtra");
        input.value = "";
        Swal.fire("Registrado", "Gasto extra añadido", "success");
        cargarDetallesDelPlan();
    } catch (e) {
        Swal.fire("Error", e.message, "error");
    }
}

async function eliminarPlan() {
    if (!planActual || !planActual.id) return Swal.fire("Info", "Plan no cargado aún", "info");

    const result = await Swal.fire({
        title: '¿Eliminar plan?',
        text: "Irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4d4d',
        background: '#15192b',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            await API.eliminarPlan(planActual.id);
            await Swal.fire("Eliminado", "", "success");
            window.location.href = "planes.html";
        } catch (e) {
            Swal.fire("Error", e.message, "error");
        }
    }
}

/* =========================================
   4. LISTENERS
   ========================================= */
window.addEventListener("DOMContentLoaded", () => {
    cargarUsuario();
    cargarDetallesDelPlan();
    setupModalEdicion();

    // Botones de Apertura
    const btnIngreso = document.getElementById("btnNuevoIngreso");
    if (btnIngreso) btnIngreso.addEventListener("click", () => abrirMiniModal("modalNuevoIngreso"));

    const btnGasto = document.getElementById("btnGastoExtra");
    if (btnGasto) btnGasto.addEventListener("click", () => abrirMiniModal("modalGastoExtra"));

    const btnEliminar = document.getElementById("btnEliminarPlan");
    if (btnEliminar) btnEliminar.addEventListener("click", eliminarPlan);

    // Botones de Modales (Guardar / Cerrar)
    const btnSaveIngreso = document.getElementById("btnConfirmarIngreso");
    if (btnSaveIngreso) btnSaveIngreso.addEventListener("click", guardarNuevoIngreso);

    const btnSaveGasto = document.getElementById("btnConfirmarGasto");
    if (btnSaveGasto) btnSaveGasto.addEventListener("click", guardarGastoExtra);

    const closeIngreso = document.getElementById("btnCloseIngreso");
    if (closeIngreso) closeIngreso.addEventListener("click", () => cerrarMiniModal("modalNuevoIngreso"));

    const closeGasto = document.getElementById("btnCloseGasto");
    if (closeGasto) closeGasto.addEventListener("click", () => cerrarMiniModal("modalGastoExtra"));
});