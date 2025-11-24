import * as API from "./api.js";

const PALETA_COLORES_DONA = [
    "#7984ff",
    "#b1b9ff",
    "#4dff91",
    "#ff6b6b",
    "#ffce47",
    "#47ceff"
];

let planActual = null;

/* ============================
   CARGAR USUARIO
============================ */
function cargarUsuario() {
    const welcomeMsg = document.getElementById("welcomeMsg");
    const logoutBtn = document.getElementById("logoutBtn");
    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  
    if (!usuarioActivo) return;
    if (welcomeMsg) welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;
    if (logoutBtn) logoutBtn.addEventListener("click", () => API.cerrarSesion());
}

/* ============================
   CARGAR DETALLE DEL PLAN
============================ */
async function cargarDetallesDelPlan() {
    const params = new URLSearchParams(window.location.search);
    const planId = params.get("id");

    if (!planId) return;

    try {
        const plan = await API.obtenerPlanGestionById(planId);
        planActual = plan;

        let analisis = {};
        try {
            const res = await API.obtenerAnalisisPlan(planId);
            analisis = res.analisis || res;
        } catch {}

        actualizarVistaDetalle(plan, analisis);

    } catch (error) {
        console.error("Error cargando plan:", error);
        document.getElementById("planTitulo").textContent = "Error al cargar plan";
    }
}

/* ============================
   ACTUALIZAR VISTA
============================ */
function actualizarVistaDetalle(plan, analisis) {
    document.getElementById("planTitulo").textContent = plan.nombre_plan;

    const formatMX = (v) =>
        (v || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

    document.getElementById("progresoResumen").innerHTML = `
        <h3>${formatMX(plan.ingreso_total)}</h3>
        <p>Ingreso total</p>
        <hr>
        <h4>${formatMX(plan.ahorro_deseado)}</h4>
        <p>Meta de ahorro</p>
    `;

    renderizarGraficoDetalle(plan);
    mostrarAnalisis(analisis);
}

/* ============================
   INICIALIZAR MODAL EDICIÓN
============================ */
function setupModalEdicion() {
    const modal = document.getElementById("modalEditarPlan");
    const btnEditar = document.getElementById("btnEditarPlan");
    const btnCerrar = document.getElementById("btnCerrarEdit");
    const btnCancelar = document.getElementById("btnCancelarEdit");
    const form = document.getElementById("formEditarPlan");

    btnEditar.onclick = () => {
        llenarFormularioEdicion(planActual);
        modal.style.display = "flex";
    };

    const cerrar = () => (modal.style.display = "none");
    btnCerrar.onclick = cerrar;
    btnCancelar.onclick = cerrar;

    form.onsubmit = async (e) => {
        e.preventDefault();
        await guardarCambiosPlan();
    };
}

/* ============================
   LLENAR FORMULARIO
============================ */
function llenarFormularioEdicion(plan) {
    document.getElementById("editNombre").value = plan.nombre_plan;
    document.getElementById("editDuracion").value = plan.duracion_meses;
    document.getElementById("editIngreso").value = plan.ingreso_total;
    document.getElementById("editAhorro").value = plan.ahorro_deseado;

    const cont = document.getElementById("containerDistribucion");
    cont.innerHTML = "";

    for (const [categoria, monto] of Object.entries(plan.distribucion_gastos)) {
        const card = document.createElement("div");
        card.className = "dist-card";
        card.innerHTML = `
            <label>${categoria}</label>
            <div class="input-moneda-wrapper">
                <span class="currency-symbol">$</span>
                <input type="number" name="cat_${categoria}"
                       class="input-monto-dist"
                       value="${monto}" min="0" step="0.01">
            </div>
        `;
        cont.appendChild(card);
    }
}

/* ============================
   VALIDAR Y GUARDAR CAMBIOS
============================ */
async function guardarCambiosPlan() {
    const ingreso = planActual.ingreso_total;
    const ahorro = planActual.ahorro_deseado;
    const ingresoDisponible = ingreso - ahorro;

    const inputs = document.querySelectorAll(".input-monto-dist");
    let montos = {};
    let suma = 0;

    inputs.forEach((i) => {
        const cat = i.name.replace("cat_", "");
        const val = parseFloat(i.value) || 0;
        montos[cat] = val;
        suma += val;
    });

    if (suma > ingresoDisponible) {
        return Swal.fire("Error", "Superas el ingreso disponible", "error");
    }

    let porcentajes = {};
    Object.keys(montos).forEach((cat) => {
        porcentajes[cat] = Number(((montos[cat] / ingresoDisponible) * 100).toFixed(2));
    });

    await API.actualizarPlanGestion(planActual.id, { porcentajes });

    Swal.fire("Guardado", "Tu plan ha sido actualizado", "success");

    document.getElementById("modalEditarPlan").style.display = "none";

    cargarDetallesDelPlan();
}

/* ============================
   GRAFICA
============================ */
function renderizarGraficoDetalle(plan) {
    const canvas = document.getElementById("graficaProgresoDona");
    const ctx = canvas.getContext("2d");

    const labels = Object.keys(plan.distribucion_gastos);
    const data = Object.values(plan.distribucion_gastos);

    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: PALETA_COLORES_DONA,
                    borderColor: "#0f0f23",
                    borderWidth: 2
                }
            ]
        },
        options: {
            plugins: { legend: { labels: { color: "#fff" } } }
        }
    });
}

/* ============================
   MOSTRAR ANÁLISIS
============================ */
function mostrarAnalisis(a) {
    document.getElementById("statsContainer").innerHTML = `
        <div class="stat-card"><h4>Total gastos</h4><p>$${(a.total_gastos || 0).toLocaleString()}</p></div>
        <div class="stat-card"><h4>% Ahorro</h4><p>${a.porcentaje_ahorro || 0}%</p></div>
        <div class="stat-card"><h4>Mayor gasto</h4><p>${a.mayor_gasto || "N/A"}</p></div>
    `;
}

/* ============================
   GUARDAR INGRESO EXTRA
============================ */
async function guardarNuevoIngreso() {
    const monto = parseFloat(document.getElementById("montoNuevoIngreso").value);
    if (!monto || monto <= 0) return Swal.fire("Error", "Monto inválido", "error");

    await API.registrarIngresoExtra(planActual.id, { monto });
    cerrarMiniModal("modalNuevoIngreso");
    Swal.fire("Ingreso registrado", "", "success");
    cargarDetallesDelPlan();
}

/* ============================
   GUARDAR GASTO EXTRA
============================ */
async function guardarGastoExtra() {
    const monto = parseFloat(document.getElementById("montoGastoExtra").value);
    if (!monto || monto <= 0) return Swal.fire("Error", "Monto inválido", "error");

    await API.registrarGastoExtra(planActual.id, { monto });
    cerrarMiniModal("modalGastoExtra");
    Swal.fire("Gasto registrado", "", "success");
    cargarDetallesDelPlan();
}

function cerrarMiniModal(id) {
    document.getElementById(id).style.display = "none";
}



/* ============================
   ELIMINAR PLAN
============================ */
async function eliminarPlan() {
    const confirm = await Swal.fire({
        icon: "warning",
        title: "¿Eliminar plan?",
        text: "Esta acción no se puede deshacer.",
        showCancelButton: true,
        confirmButtonColor: "#e74c3c",
        background: "#15192b",
        color: "#fff"
    });

    if (!confirm.isConfirmed) return;

    await API.eliminarPlan(planActual.id);

    await Swal.fire("Plan eliminado", "", "success");
    window.location.href = "planes.html";
}




/* Mini-modal helper */
function abrirMiniModal(id) {
    const m = document.getElementById(id);
    m.style.display = "flex";
}
/*===============================
  LISTENERS PARA ABRIR MINI-MODALES
================================*/
window.addEventListener("DOMContentLoaded", () => {

    // BOTÓN INGRESO EXTRA
    const btnIngreso = document.getElementById("btnNuevoIngreso");
    if (btnIngreso) {
        btnIngreso.onclick = () => {
            abrirMiniModal("modalNuevoIngreso");
        };
    }

    // BOTÓN GASTO EXTRA
    const btnGasto = document.getElementById("btnGastoExtra");
    if (btnGasto) {
        btnGasto.onclick = () => {
            abrirMiniModal("modalGastoExtra");
        };
    }

    // BOTÓN ELIMINAR PLAN
    const btnEliminar = document.getElementById("btnEliminarPlan");
    if (btnEliminar) {
        btnEliminar.onclick = eliminarPlan;
    }
});

window.guardarNuevoIngreso = guardarNuevoIngreso;
window.guardarGastoExtra = guardarGastoExtra;
window.cerrarMiniModal = cerrarMiniModal;
