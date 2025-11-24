 import * as API from './api.js';

const PALETA_COLORES_DONA = ['#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b', '#ffce47', '#47ceff'];

let planActual = null; 



function cargarUsuario() {
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  
  if (!usuarioActivo) return;
  if(welcomeMsg) welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;
  if(logoutBtn) logoutBtn.addEventListener("click", () => API.cerrarSesion());
}

//      CARGAR DETALLES
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
    } catch(e) { 
        console.warn("No se pudo cargar el análisis", e); 
    }

    actualizarVistaDetalle(plan, analisis);

  } catch (error) {
    console.error("Error cargando plan:", error);
    const titulo = document.getElementById("planTitulo");
    if(titulo) titulo.textContent = "Error de conexión";
  }
}
function setupEliminarPlan() {
    const btn = document.getElementById("btnEliminarPlan");
    if (!btn) return;

    btn.addEventListener("click", async () => {

        const confirm = await Swal.fire({
            icon: "warning",
            title: "¿Eliminar plan?",
            text: "Esta acción no se puede deshacer.",
            showCancelButton: true,
            confirmButtonColor: "#e74c3c",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, eliminar",
            background: "#15192b",
            color: "#fff"
        });

        if (!confirm.isConfirmed) return;

        try {
            await API.eliminarPlan(planActual.id);
            await Swal.fire({
                icon: "success",
                title: "Plan eliminado",
                background: "#15192b",
                color: "#fff"
            });
            window.location.href = "planes.html";
        } catch (e) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: e.message || "No se pudo eliminar el plan.",
                background: "#15192b",
                color: "#fff"
            });
        }
    });
}

function actualizarVistaDetalle(plan, analisis) {
    const titulo = document.getElementById("planTitulo");
    if(titulo) titulo.textContent = plan.nombre_plan;

    const formatoMoneda = (monto) => (monto || 0).toLocaleString('es-MX', { style: 'currency', 'currency': 'MXN' });
    
    const progresoResumenEl = document.getElementById("progresoResumen");
    if(progresoResumenEl) {
        progresoResumenEl.innerHTML = `
          <h3>${formatoMoneda(plan.ingreso_total)}</h3>  
          <p>Ingreso total</p>
          <hr>
          <h4>${formatoMoneda(plan.ahorro_deseado)}</h4>
          <p>Meta de Ahorro</p>
        `;
    }

    renderizarGraficoDetalle(plan);
    mostrarAnalisis(analisis);
}

//      LÓGICA DE EDICIÓN Y MODAL

function setupModalEdicion() {
    const modal = document.getElementById("modalEditarPlan");
    const btnEditar = document.getElementById("btnEditarPlan");
    const btnCerrar = document.getElementById("btnCerrarEdit");
    const btnCancelar = document.getElementById("btnCancelarEdit");
    const formEditar = document.getElementById("formEditarPlan");

    if (btnEditar) {
        btnEditar.addEventListener("click", (e) => {
            e.preventDefault();
            if(planActual) {
                llenarFormularioEdicion(planActual);
                modal.classList.add("active");
                modal.style.display = 'flex';
            }
        });
    }

    const cerrar = (e) => {
        if(e) e.preventDefault();
        modal.classList.remove("active");
        modal.style.display = 'none';
    };
    
    if(btnCerrar) btnCerrar.addEventListener("click", cerrar);
    if(btnCancelar) btnCancelar.addEventListener("click", cerrar);

    if(formEditar) {
        formEditar.addEventListener("submit", async (e) => {
            e.preventDefault(); 
            await guardarCambiosPlan();
        });
    }
}

function llenarFormularioEdicion(plan) {
    // Llenamos los campos
    document.getElementById("editNombre").value = plan.nombre_plan || "";
    document.getElementById("editDuracion").value = plan.duracion_meses || 1;
    document.getElementById("editIngreso").value = plan.ingreso_total || 0;
    document.getElementById("editAhorro").value = plan.ahorro_deseado || 0;

    const gastoExtra = parseFloat(plan.total_gastos_extra || 0);
    document.getElementById("editIngreso").value = (plan.ingreso_total - gastoExtra).toFixed(2);

    const container = document.getElementById("containerDistribucion");
    container.innerHTML = "";
    
    let distribucion = plan.distribucion_gastos || {};
    
    if (Object.keys(distribucion).length === 0) {
        distribucion = { "Vivienda": 0, "Alimentos": 0, "Transporte": 0, "Otros": 0 };
    }

    Object.entries(distribucion).forEach(([categoria, monto]) => {
        // Ocultamos gasto extra
        if (categoria === "Gasto Extraordinario") return;

        const card = document.createElement("div");
        card.className = "dist-card";
        card.innerHTML = `
            <label>${categoria}</label>
            <div class="input-moneda-wrapper">
                <span class="currency-symbol">$</span>
                <input type="number" class="input-monto-dist" 
                       name="cat_${categoria}" 
                       value="${parseFloat(monto).toFixed(2)}" 
                       min="0" step="0.01">
            </div>
        `;
        container.appendChild(card);
    });

    document.querySelectorAll(".input-monto-dist").forEach(input => {
        input.addEventListener("input", validarPresupuesto);
    });

    validarPresupuesto();
}

function validarPresupuesto() {
    const ingreso = parseFloat(planActual.ingreso_total) || 0;
    const ahorro = parseFloat(planActual.ahorro_deseado) || 0;
    const gastoExtra = parseFloat(planActual.total_gastos_extra || 0);
    const ingresoDisponible = ingreso - ahorro - gastoExtra;

    
    let sumaGastos = 0;
    document.querySelectorAll(".input-monto-dist").forEach(input => sumaGastos += parseFloat(input.value || 0));

    const remanente = ingresoDisponible - sumaGastos;
    const validacionBar = document.querySelector(".validacion-bar");
    const btnGuardar = document.getElementById("btnGuardarCambios");
    
    let porcentajeUso = 0;
    if (ingresoDisponible > 0) porcentajeUso = (sumaGastos / ingresoDisponible) * 100;

    let mensaje = "";
    let claseEstado = "estado-ok";
    let bloqueado = false;

    // Tolerancia visual de $1
    if (remanente < -1) { 
        mensaje = `Te excedes por <strong>$${Math.abs(remanente).toLocaleString('es-MX')}</strong>`;
        claseEstado = "estado-over";
        bloqueado = true;
    } else if (remanente > 1) {
        mensaje = `Te sobran <strong>$${remanente.toLocaleString('es-MX')}</strong> (Se asignarán a 'Otros')`;
    } else {
        mensaje = `Distribución balanceada.`;
    }

    if(validacionBar) {
        validacionBar.className = `validacion-bar ${claseEstado}`;
        validacionBar.innerHTML = `
            <div class="resumen-validacion">
                <span>Asignado: <strong>$${sumaGastos.toLocaleString('es-MX')}</strong></span>
                <span>Disponible: <strong>$${ingresoDisponible.toLocaleString('es-MX')}</strong></span>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${Math.min(porcentajeUso, 100)}%"></div>
            </div>
            <div class="mensaje-validacion">${mensaje}</div>
        `;
    }

    if(btnGuardar) btnGuardar.disabled = bloqueado;
}

//      GUARDAR CAMBIOS (ALGORITMO MATEMÁTICO CORREGIDO)

async function guardarCambiosPlan() {
    try {
        const ingreso = parseFloat(planActual.ingreso_total);
        const ahorro = parseFloat(planActual.ahorro_deseado);
        const gastoExtra = parseFloat(planActual.total_gastos_extra || 0);
        const ingresoDisponible = ingreso - ahorro - gastoExtra;


        if (ingresoDisponible <= 0) {
            throw new Error("Error: No hay dinero disponible para distribuir.");
        }

        const inputsDist = document.querySelectorAll(".input-monto-dist");
        const montosTemp = {};
        let sumaGastosInput = 0;
        
        // 1. Recolectar montos ingresados
        inputsDist.forEach(input => {
            const cat = input.name.replace("cat_", "");
            const raw = input.value.replace(/,/g, "");   
            const val = parseFloat(raw) || 0;

            montosTemp[cat] = val;
            sumaGastosInput += val;
        });

        // 2. Auto-balanceo de dinero (Sobrantes a 'Otros')
        const remanenteDinero = ingresoDisponible - sumaGastosInput;
        
        if (remanenteDinero > 0.01) {
            let catDestino = "Otros";
            // Si no existe 'Otros', usar la categoría con mayor presupuesto
            if (!montosTemp["Otros"]) {
                const keys = Object.keys(montosTemp);
                if (keys.length > 0) {
                    catDestino = keys.reduce((a, b) => montosTemp[a] > montosTemp[b] ? a : b);
                }
            } else {
                if(montosTemp["Otros"] === undefined) montosTemp["Otros"] = 0;
            }
            
            // Ajustar el monto antes de calcular porcentajes
            montosTemp[catDestino] += remanenteDinero;
            console.log(`Auto-balanceo: Sumando $${remanenteDinero.toFixed(2)} a ${catDestino}`);
        } else if (remanenteDinero < -1) {
             throw new Error("Tus gastos superan el ingreso disponible.");
        }

        // 3. Calcular porcentajes directamente (sin autobalanceo por montos)
const porcentajesFinales = {};

Object.keys(montosTemp).forEach(cat => {
    const pct = (montosTemp[cat] / ingresoDisponible) * 100;
    porcentajesFinales[cat] = Number(pct.toFixed(2));
});

// 4. Normalización opcional (asegura que sumen 100)
let suma = Object.values(porcentajesFinales).reduce((a,b)=>a+b,0);
let diferencia = Number((100 - suma).toFixed(2));

if (Math.abs(diferencia) > 0.01) {
    // Se la agregamos a la categoría más grande (casi imperceptible)
    const catMayor = Object.keys(porcentajesFinales)
        .reduce((a,b)=>porcentajesFinales[a] > porcentajesFinales[b] ? a : b);

    porcentajesFinales[catMayor] = Number((porcentajesFinales[catMayor] + diferencia).toFixed(2));
}

const payload = { porcentajes: porcentajesFinales };

        console.log("Enviando Payload Perfecto:", payload);

        // 5. Enviar al Backend
        await API.actualizarPlanGestion(planActual.id, payload);

        // 6. Cerrar modal y Mostrar Alerta
        const modal = document.getElementById("modalEditarPlan");
        modal.classList.remove("active");
        modal.style.display = 'none';

        // Usamos un pequeño timeout o await Swal directamente
        await Swal.fire({
            icon: 'success',
            title: '¡Guardado con éxito!',
            text: 'Tu plan financiero ha sido actualizado.',
            background: '#15192b', 
            color: '#fff',
            confirmButtonColor: '#7984ff',
            timer: 3000
        });

        // 7. Recargar
        cargarDetallesDelPlan(); 

    } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire({
            icon: 'error', 
            title: 'Error', 
            text: error.message || "Ocurrió un error al guardar.",
            background: '#15192b', color: '#fff'
        });
    }
}

function renderizarGraficoDetalle(plan) {
    const canvas = document.getElementById('graficaProgresoDona');
    if (!canvas) return;

    const existingChart = Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();

    const ctx = canvas.getContext('2d');

    const distribucion = plan.distribucion_gastos || {};
    const ahorro = parseFloat(plan.ahorro_deseado || 0);

    // No incluimos gasto extra en la gráfica, solo categorías y ahorro
    const labels = [...Object.keys(distribucion), "Ahorro"];
    const data = [...Object.values(distribucion).map(Number), ahorro];

    const labelsFinal = [];
    const dataFinal = [];

    data.forEach((valor, i) => {
        if (parseFloat(valor) > 0.01) {
            labelsFinal.push(labels[i]);
            dataFinal.push(parseFloat(valor));
        }
    });

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labelsFinal,
            datasets: [{
                data: dataFinal,
                backgroundColor: PALETA_COLORES_DONA,
                borderColor: "#0f0f23",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: "bottom", labels: { color: "#fff" } }
            }
        }
    });
}


function mostrarAnalisis(analisis) {
    const statsContainer = document.getElementById('statsContainer'); 
    const recomContainer = document.getElementById('recomendacionesContainer');
    const recomList = document.getElementById('recomendacionesList');

    if (!statsContainer) return;
    
    const mayorGasto = analisis.categoria_mayor_gasto || analisis.mayor_gasto || "No registrado";
    const total = analisis.total_gastos ?? 0;
    const porcentaje = analisis.porcentaje_ahorro ?? 0;

    statsContainer.innerHTML = `
      <div class="stat-card">
        <h4>Total Gastos</h4>
        <p>$${total.toLocaleString()}</p>
      </div>
      <div class="stat-card">
        <h4>% Ahorro</h4>
        <p>${porcentaje}%</p>
      </div>
      <div class="stat-card">
        <h4>Mayor Gasto</h4>
        <p>${mayorGasto}</p>
      </div>
    `;

    if (analisis.recomendaciones && Array.isArray(analisis.recomendaciones) && analisis.recomendaciones.length > 0) {
        if(recomContainer) recomContainer.style.display = 'block';
        if(recomList) {
            recomList.innerHTML = analisis.recomendaciones.map(r => {
                const textoLimpio = r.replace(/^[-•*]\s*/, ''); 
                return `<li>${textoLimpio}</li>`;
            }).join('');
        }
    } else {
        if(recomContainer) recomContainer.style.display = 'none';
    }
}

async function guardarNuevoIngreso() {
    const monto = parseFloat(document.getElementById("montoNuevoIngreso").value);

    if (isNaN(monto) || monto <= 0) {
        Swal.fire("Error", "Ingresa un monto válido.", "error");
        return;
    }

    try {
        await API.registrarIngresoExtra(planActual.id, { monto });

        cerrarMiniModal("modalNuevoIngreso");

        Swal.fire({
            icon: "success",
            title: "Ingreso registrado",
            text: "El plan se actualizará automáticamente.",
            background: "#15192b",
            color: "#fff"
        });

        cargarDetallesDelPlan(); // recalcula y actualiza vista

    } catch (error) {
        Swal.fire("Error", "No se pudo registrar el ingreso.", "error");
    }
}
async function guardarGastoExtra() {
    const monto = parseFloat(document.getElementById("montoGastoExtra").value);

    if (isNaN(monto) || monto <= 0) {
        Swal.fire("Error", "Ingresa un monto válido.", "error");
        return;
    }

    try {
        await API.registrarGastoExtra(planActual.id, { monto });

cerrarMiniModal("modalGastoExtra");

// Recargar el plan DESPUÉS del registro
        planActual = await API.obtenerPlanGestionById(planActual.id);

        Swal.fire({
            icon: "success",
            title: "Gasto registrado",
            text: "El plan se actualizó correctamente.",
            background: "#15192b",
            color: "#fff"
        });

        cargarDetallesDelPlan();

    } catch (error) {
        Swal.fire("Error", "No se pudo registrar el gasto.", "error");
    }
}

function cerrarMiniModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = "none";
}
// === LISTENERS PARA ABRIR LOS MODALES ===
window.addEventListener("DOMContentLoaded", () => {
  
  // Inicializaciones principales
  cargarUsuario();
  cargarDetallesDelPlan();
  setupModalEdicion();

  // LISTENER para abrir modal de ingreso
  const btnIngreso = document.getElementById("btnNuevoIngreso");
  const modalIngreso = document.getElementById("modalNuevoIngreso");

  if (btnIngreso && modalIngreso) {
      btnIngreso.addEventListener("click", () => {
        document.getElementById("modalEditarPlan").style.display = "none";
          modalIngreso.style.display = "flex";
      });
  }

  // LISTENER para abrir modal de gasto extra
  const btnGastoExtra = document.getElementById("btnGastoExtra");
  const modalGastoExtra = document.getElementById("modalGastoExtra");

if (btnGastoExtra && modalGastoExtra) {
    btnGastoExtra.addEventListener("click", () => {
        document.getElementById("modalEditarPlan").style.display = "none";
        modalGastoExtra.style.display = "flex";
    });
}


});

//Exponer funciones al DOM
window.guardarNuevoIngreso = guardarNuevoIngreso;
window.guardarGastoExtra = guardarGastoExtra;
window.cerrarMiniModal = cerrarMiniModal;


/* ============================
   FIX PARA MODALES INVISIBLES
   ============================ */

function abrirMiniModal(id) {
    const m = document.getElementById(id);
    if (!m) return;

    m.style.display = "flex";   // aseguramos que se ve
    m.style.position = "fixed";
    m.style.top = "0";
    m.style.left = "0";
    m.style.width = "100%";
    m.style.height = "100%";
    m.style.zIndex = "9999999"; // más alto que el modal grande
    m.style.background = "rgba(0,0,0,0.7)";
}

/* Reemplazar listeners */
window.addEventListener("DOMContentLoaded", () => {

    cargarUsuario();
    cargarDetallesDelPlan();
    setupModalEdicion();
    setupEliminarPlan();

    document.getElementById("btnNuevoIngreso").onclick = () => {
        document.getElementById("modalEditarPlan").style.display = "none";
        abrirMiniModal("modalNuevoIngreso");
    };

    document.getElementById("btnGastoExtra").onclick = () => {
        document.getElementById("modalEditarPlan").style.display = "none";
        abrirMiniModal("modalGastoExtra");
    };
});

document.getElementById("btnEliminarPlan").addEventListener("click", async () => {

    const confirm = await Swal.fire({
        title: "¿Eliminar este plan?",
        text: "Esta acción es irreversible.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ff4d4d",
        cancelButtonColor: "#7984ff",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    });

    if (!confirm.isConfirmed) return;

    try {
        await API.eliminarPlan(planActual.id);

        await Swal.fire({
            icon: "success",
            title: "Plan eliminado",
            text: "Tu plan fue eliminado correctamente.",
            background: "#15192b",
            color: "#fff",
            confirmButtonColor: "#7984ff"
        });

        window.location.href = "planes.html";

    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo eliminar el plan.",
            background: "#15192b",
            color: "#fff"
        });
    }
});




