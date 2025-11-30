import * as API from './api.js';

const PALETA_COLORES_DONA = ['#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b', '#ffce47', '#47ceff'];
let planActual = null;
function showAlert(icon, title, text) {
    if (typeof Swal === 'undefined') {
        alert(`${title}\n${text}`);
        return;
    }
    Swal.fire({
        icon: icon,
        title: title,
        text: text,
        confirmButtonColor: '#7984ff', // Tu color morado
        background: '#0f0f23',         // Tu fondo oscuro
        color: '#fff'                  // Texto blanco
    });
}
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
    
    const labels = [];
    const data = [];
    for(const [key, value] of Object.entries(dist)){
        if(value > 0){
            const labelCapitalized = key.charAt(0).toUpperCase() + key.slice(1);
            labels.push(labelCapitalized);
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { 
                    position: 'bottom',
                    labels: { color: '#fff', padding: 20 } 
                } 
            }
        }
    });
}

function mostrarAnalisis(analisisBackend) {
    const container = document.getElementById('statsContainer');
    
    // Si no hay plan actual cargado, no podemos calcular
    if (!planActual || !container) return;

    // --- PARTE 1: ESTADÍSTICAS NUMÉRICAS ---
    // Recalculamos totales en vivo para que coincidan con la edición
    let totalGastosReal = 0;
    let mayorGastoVal = 0;
    let mayorGastoCat = "N/A";

    const gastos = planActual.distribucion_gastos || {};
    for (const [cat, val] of Object.entries(gastos)) {
        const monto = parseFloat(val) || 0;
        totalGastosReal += monto;
        if (monto > mayorGastoVal) {
            mayorGastoVal = monto;
            mayorGastoCat = cat;
        }
    }
    
    // Cálculo de porcentaje ahorro real
    const ingreso = parseFloat(planActual.ingreso_total) || 1;
    const ahorro = parseFloat(planActual.ahorro_deseado) || 0;
    const pctAhorro = ((ahorro / ingreso) * 100).toFixed(1);

    // Renderizado de tarjetas superiores
    container.innerHTML = `
      <div class="stat-card">
        <h4>Total Gastos</h4>
        <p>$${totalGastosReal.toLocaleString('es-MX', {minimumFractionDigits: 2})}</p>
      </div>
      <div class="stat-card">
        <h4>% Ahorro</h4>
        <p>${pctAhorro}%</p>
      </div>
      <div class="stat-card">
        <h4>Mayor Gasto</h4>
        <p style="color: #ff6b6b;">${mayorGastoCat}</p> 
      </div>
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

    // ABRIR MODAL
    if (btnEditar) {
        btnEditar.addEventListener("click", (e) => {
            e.preventDefault();
            if (!planActual) return;
            llenarFormularioEdicion(planActual);
            
            modal.style.display = "flex";
            // Bloqueamos scroll del fondo
            document.body.classList.add("no-scroll");
            
            setTimeout(() => modal.classList.add("active"), 10);
        });
    }

    // FUNCIÓN CERRAR
    const cerrar = (e) => {
        if (e) e.preventDefault();
        modal.classList.remove("active");
        
        // Reactivamos scroll del fondo
        document.body.classList.remove("no-scroll");

        setTimeout(() => modal.style.display = 'none', 300);
    };

    if (btnCerrar) btnCerrar.addEventListener("click", cerrar);
    if (btnCancelar) btnCancelar.addEventListener("click", cerrar);

    // NOTA: HE ELIMINADO EL LISTENER DE CLICK EN "modal" PARA QUE NO SE CIERRE AL DAR CLIC FUERA

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            await guardarCambiosPlan();
        });
    }
}

function llenarFormularioEdicion(plan) {
    // 1. Cargar datos de cabecera
    document.getElementById("editNombre").value = plan.nombre_plan || "";
    document.getElementById("editDuracion").value = plan.duracion_meses || 1;
    document.getElementById("editIngreso").value = plan.ingreso_total || 0;
    document.getElementById("editAhorro").value = plan.ahorro_deseado || 0;

    const container = document.getElementById("containerDistribucion");
    container.innerHTML = "";
    
    // 2. DEFINIR TU ESTRUCTURA IDEAL (Lo que quieres que siempre aparezca)
    const categoriasEstandar = [
        "vivienda", 
        "alimentación", 
        "transporte",  
        "entretenimiento", 
        "otros"
    ];

    // 3. OBTENER DATOS REALES DEL PLAN
    // Clonamos el objeto para no modificar la referencia original
    const gastosBackend = { ...(plan.distribucion_gastos || {}) };
    
    // Limpiamos llaves internas que no son gastos visuales
    delete gastosBackend.id;
    delete gastosBackend.porcentajes;
    delete gastosBackend["Gasto Extraordinario"];

    // 4. RELLENAR HUECOS (La lógica Anti-Duplicados)
    // Recorremos tu lista estándar. Si esa categoría NO está en los datos del backend, la creamos en 0.
    categoriasEstandar.forEach(catFija => {
        // Buscamos si ya existe alguna llave igual (ignorando mayúsculas/minúsculas)
        // Ej: Si backend trae "VIVIENDA", detecta que es igual a "Vivienda" y retorna true.
        const existe = Object.keys(gastosBackend).some(
            k => k.toLowerCase() === catFija.toLowerCase()
        );

        // Solo si NO existe de ninguna forma, la agregamos inicializada en 0
        if (!existe) {
            gastosBackend[catFija] = 0;
        }
    });

    // 5. RENDERIZAR TODO
    // Al usar gastosBackend, renderizamos lo que venía de BD + los huecos que rellenamos
    Object.entries(gastosBackend).forEach(([categoria, monto]) => {
        const valor = parseFloat(monto) || 0; // Asegurar número
        
        container.innerHTML += `
            <div class="dist-card">
                <label>${categoria}</label>
                <div class="input-moneda-wrapper">
                    <span class="currency-symbol">$</span>
                    <input type="number" 
                           class="input-monto-dist" 
                           name="cat_${categoria}" 
                           value="${valor}" 
                           step="0.01">
                </div>
            </div>`;
    });

    // 6. Reactivar listeners de la barra
    const inputs = document.querySelectorAll(".input-monto-dist");
    inputs.forEach(input => {
        input.addEventListener("input", actualizarBarraPresupuesto);
    });
    
    // Calcular barra inicial
    actualizarBarraPresupuesto();
}
function actualizarBarraPresupuesto() {
    const ingreso = parseFloat(document.getElementById("editIngreso").value) || 0;
    const ahorro = parseFloat(document.getElementById("editAhorro").value) || 0;
    const disponible = ingreso - ahorro;

    const inputs = document.querySelectorAll(".input-monto-dist");
    let sumaActual = 0;

    inputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) sumaActual += val;
    });

    const restante = disponible - sumaActual;

    // Actualizar Textos
    const txt = document.getElementById("txtPresupuesto");
    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    
    // Elemento para mensajes dinámicos (asegúrate de tener un div para esto o usamos el mismo txt)
    // Para no romper tu HTML actual, usaremos el mismo txtPresupuesto con colores.
    
    const barra = document.getElementById("barraPresupuesto");
    const btnGuardar = document.querySelector("#formEditarPlan button[type='submit']");
    
    // --- LÓGICA DE ESTADOS ---

    // 1. ERROR: Se pasa del presupuesto
    if (restante < -0.01) { 
        if(txt) txt.innerHTML = `<span style="color: #ff6b6b">Excedes por ${fmt.format(Math.abs(restante))}</span>`;
        if(barra) {
            barra.style.width = "100%";
            barra.className = "barra-fill danger";
        }
        if(btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.style.opacity = "0.5";
            btnGuardar.textContent = "Presupuesto Excedido";
            btnGuardar.style.cursor = "not-allowed";
        }
    } 
    // 2. INFO: Sobra dinero (Se irá a Otros)
    else if (restante > 0.01) {
        if(txt) txt.innerHTML = `<span style="color: #47ceff">Sobran ${fmt.format(restante)} (Irán a 'Otros')</span>`;
        
        // Calculamos el porcentaje visual
        const porcentaje = disponible > 0 ? (sumaActual / disponible) * 100 : 0;
        
        if(barra) {
            barra.style.width = `${porcentaje}%`;
            barra.className = "barra-fill"; // Quitamos clases de color fijo
            barra.style.backgroundColor = "#47ceff"; // Azul informativo
            barra.style.boxShadow = "0 0 10px rgba(71, 206, 255, 0.5)";
        }

        // EL BOTÓN SE QUEDA HABILITADO
        if(btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.style.opacity = "1";
            btnGuardar.textContent = "Guardar (Ajustar Otros)";
            btnGuardar.style.cursor = "pointer";
        }
    } 
    // 3. ÉXITO: Cuadra perfecto
    else {
        if(txt) txt.innerHTML = `<span style="color: #4dff91">${fmt.format(sumaActual)} / ${fmt.format(disponible)}</span>`;
        if(barra) {
            barra.style.width = "100%";
            barra.className = "barra-fill ok";
            barra.style.backgroundColor = ""; // Reset inline
            barra.style.boxShadow = "";
        }
        if(btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.style.opacity = "1";
            btnGuardar.textContent = "Guardar Cambios";
            btnGuardar.style.cursor = "pointer";
        }
    }
}
async function guardarCambiosPlan() {
    const ingreso = parseFloat(planActual.ingreso_total);
    const ahorro = parseFloat(planActual.ahorro_deseado);
    const disponible = ingreso - ahorro;

    const inputs = document.querySelectorAll(".input-monto-dist");
    let montos = {};
    let suma = 0;

    for (const i of inputs) {
        const val = parseFloat(i.value);
        if (isNaN(val) || val < 0) {
            showAlert("error", "Error en montos", "Los gastos no pueden ser negativos.");
            return;
        }
        montos[i.name.replace("cat_", "")] = val;
        suma += val;
    }

    // 1. BLOQUEO: Si se pasa del presupuesto
    if (suma > disponible + 0.01) {
        showAlert("error", "Presupuesto Excedido", `La suma ($${suma.toFixed(2)}) supera lo disponible ($${disponible.toFixed(2)}). Por favor ajusta los montos.`);
        return;
    }

    // 2. ADVERTENCIA: Si sobra dinero (Esto usa un confirm especial, lo dejamos con estilo oscuro también)
    if (suma < disponible - 0.01) {
        const restante = (disponible - suma).toFixed(2);
        
        const confirm = await Swal.fire({
            title: '¿Guardar con sobrante?',
            text: `Te faltan asignar $${restante}. Este monto se moverá automáticamente a "Otros". ¿Deseas continuar?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#7984ff',
            cancelButtonColor: '#ff6b6b',
            confirmButtonText: 'Sí, asignar a Otros',
            cancelButtonText: 'Seguir editando',
            background: '#0f0f23', // Fondo oscuro
            color: '#fff'          // Texto blanco
        });

        if (!confirm.isConfirmed) return; // Se queda en el modal
        
        // Sumamos el restante a Otros
        montos["Otros"] = (montos["Otros"] || 0) + parseFloat(restante);
    }

    // Calcular porcentajes
    let porcentajes = {};
    for (let k in montos) {
        const pct = disponible > 0 ? (montos[k] / disponible) * 100 : 0;
        porcentajes[k] = parseFloat(pct.toFixed(6));
    }

    // --- EFECTO DE CARGA EN EL BOTÓN ---
    const btnGuardar = document.querySelector("#formEditarPlan button[type='submit']");
    const txtOriginal = btnGuardar.textContent;
    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";
    btnGuardar.style.opacity = "0.7";

    try {
        await API.actualizarPlanGestion(planActual.id, { porcentajes });
        
        // CERRAR MODAL PRIMERO
        document.getElementById("modalEditarPlan").classList.remove("active");
        setTimeout(() => document.getElementById("modalEditarPlan").style.display = 'none', 300);

        // MOSTRAR ALERTA DE ÉXITO (ESTILO OSCURO)
        showAlert('success', '¡Cambios Guardados!', 'Tu plan ha sido actualizado correctamente.');
        
        // RECARGAR DATOS
        cargarDetallesDelPlan(); 

    } catch (e) {
        console.error(e);
        showAlert("error", "Error al guardar", e.message || "No se pudo actualizar el plan. Revisa tu conexión.");
    } finally {
        // RESTAURAR BOTÓN
        if(btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.textContent = txtOriginal;
            btnGuardar.style.opacity = "1";
        }
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
    
    if (isNaN(monto) || monto <= 0) {
        return Swal.fire("Error", "Ingresa un monto válido mayor a 0.", "warning");
    }

    try {
        await API.registrarIngresoExtra(planActual.id, { monto });
        cerrarMiniModal("modalNuevoIngreso");
        input.value = "";
        
        Swal.fire({
            icon: 'success',
            title: '¡Ingreso Registrado!',
            text: 'Tu ingreso extra se ha sumado exitosamente.',
            timer: 2000,
            showConfirmButton: false
        });
        
        cargarDetallesDelPlan();
    } catch (e) {
        Swal.fire("Error", e.message, "error");
    }
}

async function guardarGastoExtra() {
    const input = document.getElementById("montoGastoExtra");
    const monto = parseFloat(input.value);
    
    if (isNaN(monto) || monto <= 0) {
        return Swal.fire("Error", "Ingresa un monto válido mayor a 0.", "warning");
    }

    try {
        await API.registrarGastoExtra(planActual.id, { monto });
        cerrarMiniModal("modalGastoExtra");
        input.value = "";
        
        Swal.fire({
            icon: 'success',
            title: 'Gasto Registrado',
            text: 'Se ha registrado el gasto extraordinario.',
            timer: 2000,
            showConfirmButton: false
        });
        
        cargarDetallesDelPlan();
    } catch (e) {
        Swal.fire("Error", e.message, "error");
    }
}

async function eliminarPlan() {
    if (!planActual || !planActual.id) return;

    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará el plan y todos sus datos permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff4d4d',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#15192b',
        color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            await API.eliminarPlan(planActual.id);
            await Swal.fire({
                title: "Eliminado",
                text: "El plan ha sido eliminado.",
                icon: "success",
                background: '#15192b',
                color: '#fff'
            });
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

    const btnIngreso = document.getElementById("btnNuevoIngreso");
    if (btnIngreso) btnIngreso.addEventListener("click", () => abrirMiniModal("modalNuevoIngreso"));

    const btnGasto = document.getElementById("btnGastoExtra");
    if (btnGasto) btnGasto.addEventListener("click", () => abrirMiniModal("modalGastoExtra"));

    const btnEliminar = document.getElementById("btnEliminarPlan");
    if (btnEliminar) btnEliminar.addEventListener("click", eliminarPlan);

    const btnSaveIngreso = document.getElementById("btnConfirmarIngreso");
    if (btnSaveIngreso) btnSaveIngreso.addEventListener("click", guardarNuevoIngreso);

    const btnSaveGasto = document.getElementById("btnConfirmarGasto");
    if (btnSaveGasto) btnSaveGasto.addEventListener("click", guardarGastoExtra);

    const closeIngreso = document.getElementById("btnCloseIngreso");
    if (closeIngreso) closeIngreso.addEventListener("click", () => cerrarMiniModal("modalNuevoIngreso"));

    const closeGasto = document.getElementById("btnCloseGasto");
    if (closeGasto) closeGasto.addEventListener("click", () => cerrarMiniModal("modalGastoExtra"));
});