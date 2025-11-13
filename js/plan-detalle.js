// js/plan-detalle.js

// Paleta de colores (reutilizada)
const PALETA_COLORES_DONA = ['#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b'];

// =============================================================
//      LÓGICA DEL HEADER (Bienvenida y Logout)
// =============================================================
window.addEventListener("DOMContentLoaded", () => {
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
  
  if (!usuarioActivo) {
    window.location.href = "index.html"; 
    return;
  }

  welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("usuarioActivo");
    localStorage.removeItem("authToken");
    Swal.fire({ icon: 'success', title: 'Sesión cerrada', text: 'Has cerrado sesión exitosamente.', confirmButtonColor: '#7984ff', background: '#0f0f23', color: '#fff' });
    setTimeout(() => (window.location.href = "index.html"), 1500);
  });

  // =============================================================
  //      LÓGICA DE CARGA DE DETALLES
  // =============================================================
  cargarDetallesDelPlan();
});

/**
 * Carga los detalles del plan basado en el ID de la URL
 */
function cargarDetallesDelPlan() {
  // 1. Obtener el ID de la URL
  const params = new URLSearchParams(window.location.search);
  const planId = parseInt(params.get('id')); // Convertir a número

  if (!planId) {
    document.getElementById("planTitulo").textContent = "Error: Plan no encontrado";
    return;
  }

  // 2. Cargar los planes guardados en localStorage
  const todosLosPlanes = JSON.parse(localStorage.getItem("todosLosPlanes")) || [];
  
  // 3. Encontrar el plan específico
  const plan = todosLosPlanes.find(p => p.id === planId);

  if (!plan) {
    document.getElementById("planTitulo").textContent = "Error: Plan no encontrado";
    return;
  }

  // 4. Poblar la página con los datos del plan
  document.getElementById("planTitulo").textContent = plan.nombre;

  // Formatear moneda
  const formatoMoneda = (monto) => (monto || 0).toLocaleString('es-MX', { style: 'currency', 'currency': 'MXN' });
  
  // Simulación de "monto actual" (para el ejemplo)
  // En un caso real, esto vendría de la suma de transacciones
  const montoActualSimulado = plan.montoActual || (plan.monto * 0.75); // Simula el 75%
  const montoFaltante = plan.monto - montoActualSimulado;
  const esPresupuesto = plan.tipo === 'presupuesto';

  // 5. Poblar el resumen de progreso
  const progresoResumenEl = document.getElementById("progresoResumen");
  progresoResumenEl.innerHTML = `
    <h3>${formatoMoneda(montoActualSimulado)}</h3>
    <p>${esPresupuesto ? 'Gastado de' : 'Ahorrado de'} <strong>${formatoMoneda(plan.monto)}</strong></p>
    <hr>
    <h4>${formatoMoneda(montoFaltante)}</h4>
    <p>${esPresupuesto ? 'Disponible' : 'Faltante'}</p>
  `;

  // 6. Renderizar la gráfica de dona
  renderizarGraficoDetalle(montoActualSimulado, montoFaltante, esPresupuesto);
}

/**
 * Renderiza la gráfica de dona para el detalle
 */
function renderizarGraficoDetalle(actual, faltante, esPresupuesto) {
  const ctx = document.getElementById('graficaProgresoDona')?.getContext('d');
  if (!ctx) return;
  
  const labels = esPresupuesto ? ['Gastado', 'Disponible'] : ['Ahorrado', 'Faltante'];
  const data = [actual, faltante];
  const colores = esPresupuesto ? [PALETA_COLORES_DONA[3], PALETA_COLORES_DONA[2]] : [PALETA_COLORES_DONA[0], 'rgba(255, 255, 255, 0.1)'];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colores,
        borderColor: '#0f0f23',
        borderWidth: 4,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#fff' } },
        tooltip: { callbacks: { label: crearTooltipMoneda } }
      }
    }
  });
}

/**
 * Función de ayuda para formatear el tooltip de Chart.js
 */
function crearTooltipMoneda(context) {
  let label = context.label || '';
  if (label) {
    label += ': ';
  }
  if (context.parsed !== null) {
    label += context.parsed.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
  return label;
}