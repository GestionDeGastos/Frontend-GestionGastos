// js/plan-detalle.js
import * as API from './api.js';

const PALETA_COLORES_DONA = ['#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b'];

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
    API.cerrarSesion();
  });

  cargarDetallesDelPlan();
});

async function cargarDetallesDelPlan() {
  const params = new URLSearchParams(window.location.search);
  const planId = parseInt(params.get('id'));

  if (!planId) {
    document.getElementById("planTitulo").textContent = "Error: Plan no encontrado";
    return;
  }

  try {
    const plan = await API.obtenerPlanGestionById(planId);
    const analisis = await API.obtenerAnalisisPlan(planId);

    document.getElementById("planTitulo").textContent = plan.nombre_plan;

    const formatoMoneda = (monto) => (monto || 0).toLocaleString('es-MX', { style: 'currency', 'currency': 'MXN' });
    
    const progresoResumenEl = document.getElementById("progresoResumen");
    progresoResumenEl.innerHTML = `
      <h3>${formatoMoneda(plan.ingreso_total)}</h3>
      <p>Ingreso total mensual</p>
      <hr>
      <h4>${formatoMoneda(plan.ahorro_deseado)}</h4>
      <p>Ahorro deseado</p>
    `;

    renderizarGraficoDetalle(plan);
    
    // Mostrar análisis si existe
    if (analisis && analisis.analisis) {
      mostrarAnalisis(analisis.analisis);
    }

  } catch (error) {
    console.error("Error cargando plan:", error);
    document.getElementById("planTitulo").textContent = "Error al cargar el plan";
  }
}

function renderizarGraficoDetalle(plan) {
  const ctx = document.getElementById('graficaProgresoDona')?.getContext('2d');
  if (!ctx) return;
  
  const distribucion = plan.distribucion_gastos || {};
  const labels = Object.keys(distribucion);
  const data = Object.values(distribucion);

  if (labels.length === 0) {
    return;
  }

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: PALETA_COLORES_DONA,
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

function mostrarAnalisis(analisis) {
  const statsContainer = document.querySelector('.analisis-stats-container');
  if (!statsContainer) return;

  const formatoMoneda = (monto) => (monto || 0).toLocaleString('es-MX', { style: 'currency', 'currency': 'MXN' });

  statsContainer.innerHTML = `
    <div class="stat-card">
      <h4>Total Gastos</h4>
      <p>${formatoMoneda(analisis.total_gastos)}</p>
    </div>
    <div class="stat-card">
      <h4>% Ahorro</h4>
      <p>${analisis.porcentaje_ahorro}%</p>
    </div>
    <div class="stat-card">
      <h4>Mayor Gasto</h4>
      <p>${analisis.categoria_mayor_gasto}</p>
    </div>
  `;

  // Mostrar recomendaciones
  if (analisis.recomendaciones && analisis.recomendaciones.length > 0) {
    const recomendacionesEl = document.querySelector('.analisis-stats-card');
    const recomHTML = `
      <h4 style="margin-top: 20px;">Recomendaciones:</h4>
      <ul style="color: #fff; opacity: 0.8;">
        ${analisis.recomendaciones.map(r => `<li>• ${r}</li>`).join('')}
      </ul>
    `;
    recomendacionesEl.innerHTML += recomHTML;
  }
}

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