import * as API from './api.js';

const PALETA_COLORES_DONA = ['#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b', '#ffce47', '#47ceff'];

let planActual = null; 

window.addEventListener("DOMContentLoaded", () => {
  cargarUsuario();
  cargarDetallesDelPlan();
  setupModalEdicion();
});

function cargarUsuario() {
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  
  if (!usuarioActivo) return;
  if(welcomeMsg) welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;
  if(logoutBtn) logoutBtn.addEventListener("click", () => API.cerrarSesion());
}

// ============================================================
//      CARGAR DETALLES
// ============================================================
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

function actualizarVistaDetalle(plan, analisis) {
    const titulo = document.getElementById("planTitulo");
    if(titulo) titulo.textContent = plan.nombre_plan;

    const formatoMoneda = (monto) => (monto || 0).toLocaleString('es-MX', { style: 'currency', 'currency': 'MXN' });
    
    const progresoResumenEl = document.getElementById("progresoResumen");
    if(progresoResumenEl) {
        progresoResumenEl.innerHTML = `
          <h3>${formatoMoneda(plan.ingreso_total)}</h3>
          <p>Ingreso total mensual</p>
          <hr>
          <h4>${formatoMoneda(plan.ahorro_deseado)}</h4>
          <p>Meta de Ahorro</p>
        `;
    }

    renderizarGraficoDetalle(plan);
    mostrarAnalisis(analisis);
}

// ============================================================
//      LÓGICA DE EDICIÓN Y MODAL
// ============================================================

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
    // Llenamos los campos (Visibles pero bloqueados en HTML)
    document.getElementById("editNombre").value = plan.nombre_plan || "";
    document.getElementById("editDuracion").value = plan.duracion_meses || 1;
    document.getElementById("editIngreso").value = plan.ingreso_total || 0;
    document.getElementById("editAhorro").value = plan.ahorro_deseado || 0;

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
    const ingresoDisponible = ingreso - ahorro;
    
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

// ============================================================
//      GUARDAR CAMBIOS (ALGORITMO MATEMÁTICO CORREGIDO)
// ============================================================
async function guardarCambiosPlan() {
    try {
        const ingreso = parseFloat(planActual.ingreso_total);
        const ahorro = parseFloat(planActual.ahorro_deseado);
        const ingresoDisponible = ingreso - ahorro;

        if (ingresoDisponible <= 0) {
            throw new Error("Error: No hay dinero disponible para distribuir.");
        }

        const inputsDist = document.querySelectorAll(".input-monto-dist");
        const montosTemp = {};
        let sumaGastosInput = 0;
        
        // 1. Recolectar montos ingresados
        inputsDist.forEach(input => {
            const cat = input.name.replace("cat_", "");
            const val = parseFloat(input.value) || 0;
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
            console.log(`⚖️ Auto-balanceo: Sumando $${remanenteDinero.toFixed(2)} a ${catDestino}`);
        } else if (remanenteDinero < -1) {
             throw new Error("Tus gastos superan el ingreso disponible.");
        }

        // 3. Calcular Porcentajes y REDONDEAR PRIMERO
        const porcentajesFinales = {};
        let sumaPorcentajes = 0;
        
        Object.keys(montosTemp).forEach(cat => {
            const monto = montosTemp[cat];
            // Paso crítico: Redondear a 2 decimales AHORA, no después
            let pct = (monto / ingresoDisponible) * 100;
            pct = Math.round(pct * 100) / 100; // Redondeo estricto a 2 decimales
            
            porcentajesFinales[cat] = pct;
            sumaPorcentajes += pct;
        });

        // 4. Ajuste fino final (El "cuadre" de los decimales)
        // Si la suma da 99.99 o 100.01 debido al redondeo previo, ajustamos la diferencia.
        // Como ya redondeamos, la diferencia será exactamente 0.01 o -0.01 si existe.
        const diferencia = 100.00 - sumaPorcentajes;
        
        if (Math.abs(diferencia) > 0.0001) {
            // Se la sumamos a la categoría más grande para que sea imperceptible
            const keys = Object.keys(porcentajesFinales);
            const catMayor = keys.reduce((a, b) => porcentajesFinales[a] > porcentajesFinales[b] ? a : b);
            
            console.log(`🔧 Ajuste de precisión: ${diferencia.toFixed(2)}% aplicado a ${catMayor}`);
            
            // Sumamos la diferencia y aseguramos el formato
            let nuevoValor = porcentajesFinales[catMayor] + diferencia;
            porcentajesFinales[catMayor] = parseFloat(nuevoValor.toFixed(2));
        }

        const payload = { porcentajes: porcentajesFinales };
        console.log("📤 Enviando Payload Perfecto:", payload);

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
        console.error("❌ Error al guardar:", error);
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
    
    let valorExtra = 0;
    if(plan.gasto_extraordinario) {
         valorExtra = (typeof plan.gasto_extraordinario === 'object') 
                      ? (plan.gasto_extraordinario.monto || 0) 
                      : parseFloat(plan.gasto_extraordinario);
    }

    const labels = [...Object.keys(distribucion), 'Ahorro', 'Gasto Extra'];
    const data = [...Object.values(distribucion), plan.ahorro_deseado, valorExtra];

    const finalLabels = [];
    const finalData = [];
    data.forEach((val, i) => {
        if(val > 0.01) {
            finalLabels.push(labels[i]);
            finalData.push(val);
        }
    });
  
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: finalLabels,
        datasets: [{
          data: finalData,
          backgroundColor: PALETA_COLORES_DONA,
          borderColor: '#0f0f23',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#fff' } }
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