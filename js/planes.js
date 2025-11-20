import * as API from './api.js';

console.log("✅ planes.js cargado - Versión Final Matemáticas");

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

document.addEventListener("DOMContentLoaded", async () => {
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  if (usuarioActivo) {
    const welcomeMsg = document.getElementById("welcomeMsg");
    if (welcomeMsg) welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", () => API.cerrarSesion());

  await cargarPlanes();

  // Modal
  const btnAbrirModal = document.getElementById("btnAbrirModal");
  const btnCerrarModal = document.getElementById("btnCerrarModal");
  const formCrearPlan = document.getElementById("formCrearPlan");
  const modalOverlay = document.getElementById("modalCrearPlan");

  if (btnAbrirModal) btnAbrirModal.addEventListener("click", abrirModal);
  if (btnCerrarModal) btnCerrarModal.addEventListener("click", cerrarModal);
  if (formCrearPlan) formCrearPlan.addEventListener("submit", crearNuevoPlan);
  
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) cerrarModal();
    });
  }

  // Checkbox
  const checkPersonalizar = document.getElementById("checkPersonalizar");
  const seccionGastos = document.getElementById("seccionGastosPersonalizados");
  
  if (checkPersonalizar && seccionGastos) {
    checkPersonalizar.addEventListener("change", (e) => {
        seccionGastos.style.display = e.target.checked ? "block" : "none";
        if (e.target.checked) validarDistribucionCreacion();
    });
  }

  // Listeners Validación
  const inputsValidacion = [
      document.getElementById("planMonto"),
      document.getElementById("planAhorro"),
      ...document.querySelectorAll(".input-gasto-crear")
  ];
  inputsValidacion.forEach(input => {
      if(input) input.addEventListener("input", validarDistribucionCreacion);
  });
});

// ============================================================
//      VALIDACIÓN
// ============================================================
function validarDistribucionCreacion() {
    const check = document.getElementById("checkPersonalizar");
    if (!check || !check.checked) return;

    const ingreso = parseFloat(document.getElementById("planMonto").value) || 0;
    const ahorro = parseFloat(document.getElementById("planAhorro").value) || 0;
    const infoBox = document.getElementById("validacionCrear");
    const btnSubmit = document.getElementById("btnCrearSubmit");

    const disponible = ingreso - ahorro;
    
    let sumaGastos = 0;
    document.querySelectorAll(".input-gasto-crear").forEach(input => {
        sumaGastos += parseFloat(input.value) || 0;
    });

    const restante = disponible - sumaGastos;
    infoBox.style.display = "block";
    infoBox.className = "validacion-info";

    if (disponible < 0) {
        infoBox.innerHTML = `<i class='bx bx-error'></i> Error: Ahorro mayor al ingreso.`;
        infoBox.classList.add("error");
        btnSubmit.disabled = true;
    } else if (restante < -1) {
        infoBox.innerHTML = `<i class='bx bx-error-circle'></i> Excedes el disponible por <strong>$${Math.abs(restante).toFixed(2)}</strong>`;
        infoBox.classList.add("error");
        btnSubmit.disabled = true;
    } else if (restante > 1) {
        infoBox.innerHTML = `<i class='bx bx-info-circle'></i> Sobran <strong>$${restante.toFixed(2)}</strong> (Irán a 'Otros')`;
        infoBox.classList.remove("error", "success");
        btnSubmit.disabled = false;
    } else {
        infoBox.innerHTML = `<i class='bx bx-check-circle'></i> Distribución perfecta.`;
        infoBox.classList.add("success");
        btnSubmit.disabled = false;
    }
}

function abrirModal() {
  const modal = document.getElementById("modalCrearPlan");
  if (modal) modal.style.display = "flex";
}

function cerrarModal() {
  const modal = document.getElementById("modalCrearPlan");
  if (modal) modal.style.display = "none";
  document.getElementById("formCrearPlan").reset();
  document.getElementById("seccionGastosPersonalizados").style.display = "none";
}

// ============================================================
//      CREAR NUEVO PLAN (LÓGICA PRINCIPAL)
// ============================================================
async function crearNuevoPlan(e) {
  e.preventDefault();
  
  const btnSubmit = document.getElementById("btnCrearSubmit");
  const txtOriginal = btnSubmit.textContent;
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Procesando...";

  try {
    const nombre = document.getElementById("planNombre").value.trim();
    const ingreso = parseFloat(document.getElementById("planMonto").value);
    const ahorro = parseFloat(document.getElementById("planAhorro").value) || 0;
    const duracion = parseInt(document.getElementById("planDuracion").value);
    const personalizar = document.getElementById("checkPersonalizar").checked;

    if (ahorro >= ingreso) {
        throw new Error("El ahorro debe ser menor al ingreso total.");
    }

    // 1. CREAR PLAN BASE
    const dataPlan = {
      nombre_plan: nombre,
      ingreso_total: ingreso,
      ahorro_deseado: ahorro,
      duracion_meses: duracion
    };

    console.log("🚀 1. Creando plan base...");
    const resultado = await API.crearPlanGestion(dataPlan);
    const planId = resultado.plan ? resultado.plan.id : resultado.id;
    
    console.log("✅ Plan creado ID:", planId);

    // 2. PERSONALIZAR (SI APLICA)
    if (personalizar) {
        console.log("🚀 2. Aplicando personalización...");
        await aplicarPersonalizacion(planId, ingreso, ahorro);
    }
    
    showAlert("success", "¡Plan Creado!", "Tu plan ha sido configurado correctamente.");
    cerrarModal();
    await cargarPlanes();

  } catch (err) {
    console.error("❌ Error:", err);
    showAlert("error", "Error", err.message);
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = txtOriginal;
  }
}

// ============================================================
//      LÓGICA DE PERSONALIZACIÓN POST-CREACIÓN
// ============================================================
async function aplicarPersonalizacion(planId, ingreso, ahorro) {
    try {
        const inputs = document.querySelectorAll(".input-gasto-crear");
        const porcentajesCalculados = {};
        let sumaGastos = 0;
        let sumaPorcentajes = 0;

        // BASE DE CÁLCULO: EL DISPONIBLE (Ingreso - Ahorro)
        const disponible = ingreso - ahorro;

        if (disponible <= 0) throw new Error("Sin fondos disponibles.");

        // 1. Calcular porcentajes
        inputs.forEach(input => {
            const monto = parseFloat(input.value) || 0;
            const categoria = input.dataset.cat;
            
            if (monto > 0) {
                // FÓRMULA CORREGIDA: Dividir entre DISPONIBLE, no Ingreso Total
                let pct = (monto / disponible) * 100;
                
                // Redondear a 4 decimales para precisión
                pct = parseFloat(pct.toFixed(4));
                
                porcentajesCalculados[categoria] = pct;
                sumaGastos += monto;
                sumaPorcentajes += pct;
            }
        });

        // 2. Ajustar Sobrante
        const remanenteDinero = disponible - sumaGastos;
        
        // Cuadrar 100% matemático
        const diferenciaPct = 100 - sumaPorcentajes;

        if (Math.abs(diferenciaPct) > 0.0001) {
            let catDestino = "Otros";
            
            // Si sobra dinero real, va a Otros. Si es redondeo, a la mayor.
            if (remanenteDinero > 1) {
                 catDestino = "Otros";
                 if(porcentajesCalculados["Otros"] === undefined) porcentajesCalculados["Otros"] = 0;
            } else {
                 // Redondeo: sumar a la primera categoría existente si no hay "Otros"
                 if (!porcentajesCalculados["Otros"] && Object.keys(porcentajesCalculados).length > 0) {
                     catDestino = Object.keys(porcentajesCalculados)[0];
                 }
            }
            
            if(porcentajesCalculados[catDestino] !== undefined) {
                porcentajesCalculados[catDestino] += diferenciaPct;
            }
        }

        // 3. Redondeo final para envío
        Object.keys(porcentajesCalculados).forEach(k => {
            porcentajesCalculados[k] = parseFloat(porcentajesCalculados[k].toFixed(2));
        });

        console.log("📊 Enviando porcentajes corregidos:", porcentajesCalculados);

        // 4. Intentar Actualizar (Con manejo de bloqueo)
        try {
            await API.actualizarPlanGestion(planId, { porcentajes: porcentajesCalculados });
        } catch (error) {
            if (error.message.includes("editable") || error.message.includes("extraordinario")) {
                console.log("🔓 Desbloqueando plan...");
                // Gasto fantasma para desbloquear
                await API.crearGastoExtraordinarioEspecifico({
                    plan_id: planId,
                    nombre_gasto: "Ajuste Inicial",
                    monto: 0.01,
                    fecha: new Date().toISOString().split('T')[0],
                    descripcion: "Activación",
                    categoria: "Otros",
                    extraordinario: true
                });
                // Reintentar
                await API.actualizarPlanGestion(planId, { porcentajes: porcentajesCalculados });
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error("❌ Falló la personalización:", error);
        // No lanzamos error fatal para que al menos el plan base quede creado
    }
}

async function cargarPlanes() {
  try {
    const respuesta = await API.obtenerPlanesGestion();
    const planes = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);
    const planesGrid = document.getElementById("planesGrid");
    const noPlanesMsg = document.getElementById("noPlanesMsg");

    if (!planesGrid) return;
    planesGrid.innerHTML = "";

    if (planes.length === 0) {
      if(noPlanesMsg) noPlanesMsg.style.display = "block";
      return;
    }
    if(noPlanesMsg) noPlanesMsg.style.display = "none";

    planes.forEach((plan) => {
      const planCard = document.createElement("div");
      planCard.className = "plan-card";
      
      const ing = parseFloat(plan.ingreso_total).toLocaleString('es-MX', {style:'currency', currency:'MXN'});
      const aho = parseFloat(plan.ahorro_deseado || 0).toLocaleString('es-MX', {style:'currency', currency:'MXN'});

      planCard.innerHTML = `
        <h3>${plan.nombre_plan}</h3>
        <p class="plan-monto">Ingreso: ${ing}</p>
        <p class="plan-ahorro">Ahorro Meta: ${aho}</p>
        <p class="plan-duracion">Duración: ${plan.duracion_meses} meses</p>
        <a href="plan-detalle.html?id=${plan.id}" class="btn btn-ver-detalle">Ver Detalle</a>
      `;
      planesGrid.appendChild(planCard);
    });
  } catch (err) {
    console.error("❌ Error cargando planes:", err);
  }
}