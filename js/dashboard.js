// js/dashboard.js
import * as API from './api.js';

let todasLasTransacciones = [];
let graficoDona = null;
let graficoBarras = null;

const PALETA_COLORES_DONA = [
  '#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b', 
  '#ffc94d', '#36a2eb', '#ff9f40', '#9966ff'
];

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

  document.getElementById("tipoFiltro").addEventListener("change", aplicarFiltros);
  cargarTransacciones();
});

async function cargarTransacciones() {
  const transactionsBody = document.getElementById("transactionsBody");
  const noDataMsg = document.getElementById("noDataMsg");
  transactionsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

  try {
    const respuestaGastos = await API.obtenerGastos();
    const respuestaIngresos = await API.obtenerIngresos();

    const gastos = respuestaGastos.data || [];
    const ingresos = respuestaIngresos.data || [];

    todasLasTransacciones = [
      ...ingresos.map(i => ({
        id: i.id,
        fecha: i.fecha,
        tipo: "Ingreso",
        monto: i.monto,
        categoria: i.nombre_fuente,
        descripcion: i.descripcion
      })),
      ...gastos.map(g => ({
        id: g.id,
        fecha: g.fecha,
        tipo: "Gasto",
        monto: g.monto,
        categoria: g.categoria,
        descripcion: g.descripcion
      }))
    ];

    if (todasLasTransacciones.length === 0) {
      transactionsBody.innerHTML = '';
      noDataMsg.style.display = "block";
      noDataMsg.textContent = "No hay transacciones registradas.";
    } else {
      aplicarFiltros();
    }

  } catch (error) {
    console.error("Error cargando transacciones:", error);
    transactionsBody.innerHTML = '';
    noDataMsg.textContent = "Error al cargar las transacciones.";
    noDataMsg.style.display = "block";
    noDataMsg.style.color = "red";
  }
}

function aplicarFiltros() {
  const tipoFiltro = document.getElementById("tipoFiltro").value;

  let transaccionesFiltradas = [];
  if (tipoFiltro === "todos") {
    transaccionesFiltradas = todasLasTransacciones;
  } else {
    transaccionesFiltradas = todasLasTransacciones.filter(tx => tx.tipo === tipoFiltro);
  }
  
  renderizarTabla(transaccionesFiltradas);
  const transaccionesParaResumen = (tipoFiltro === "todos") ? todasLasTransacciones : transaccionesFiltradas;
  calcularYMostrarResumen(transaccionesParaResumen);
  renderizarGraficaDona(transaccionesFiltradas);
  renderizarGraficaTendencia(transaccionesFiltradas);
}

function renderizarTabla(transacciones) {
  const transactionsBody = document.getElementById("transactionsBody");
  const noDataMsg = document.getElementById("noDataMsg");
  transactionsBody.innerHTML = ''; 

  if (transacciones.length === 0) {
    noDataMsg.style.display = "block";
    noDataMsg.textContent = "No hay transacciones para este filtro.";
    return;
  }

  noDataMsg.style.display = "none";
  
  transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  transacciones.forEach(tx => {
    const tr = document.createElement('tr');
    const tipoClase = tx.tipo.toLowerCase() === 'ingreso' ? 'ingreso' : 'gasto';
    const montoFormateado = (tx.monto || 0).toLocaleString('es-MX', { style: 'currency', 'currency': 'MXN' });
    
    tr.innerHTML = `
      <td>${tx.fecha}</td>
      <td class="${tipoClase}">${tx.tipo}</td>
      <td class="${tipoClase}">${montoFormateado}</td>
      <td>${tx.categoria}</td>
      <td>${tx.descripcion || ''}</td> 
    `;
    transactionsBody.appendChild(tr);
  });
}

function calcularYMostrarResumen(transacciones) {
  let totalIngresos = 0;
  let totalGastos = 0;

  transacciones.forEach(tx => {
    if (tx.tipo === "Ingreso") {
      totalIngresos += tx.monto;
    } else if (tx.tipo === "Gasto") {
      totalGastos += tx.monto;
    }
  });

  const saldoActual = totalIngresos - totalGastos;
  const formatoMoneda = (monto) => (monto || 0).toLocaleString('es-MX', { style: 'currency', 'currency': 'MXN' });

  document.getElementById("totalIngresos").textContent = formatoMoneda(totalIngresos);
  document.getElementById("totalGastos").textContent = formatoMoneda(totalGastos);
  document.getElementById("saldoActual").textContent = formatoMoneda(saldoActual);
}

function renderizarGraficaDona(transacciones) {
  const ctx = document.getElementById('graficaGastosDona')?.getContext('2d');
  if (!ctx) return; 

  if (graficoDona) {
    graficoDona.destroy();
  }
  
  const gastosPorCategoria = transacciones
    .filter(tx => tx.tipo === 'Gasto')
    .reduce((acc, tx) => {
      if (!acc[tx.categoria]) {
        acc[tx.categoria] = 0;
      }
      acc[tx.categoria] += tx.monto;
      return acc;
    }, {});

  const labels = Object.keys(gastosPorCategoria);
  const data = Object.values(gastosPorCategoria);

  if (labels.length === 0) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    return;
  }

  graficoDona = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Gastos',
        data: data,
        backgroundColor: PALETA_COLORES_DONA,
        borderColor: '#0f0f23',
        borderWidth: 2,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#fff', font: { family: 'Poppins' } }
        },
        tooltip: { callbacks: { label: crearTooltipMoneda } }
      }
    }
  });
}

function renderizarGraficaTendencia(transacciones) {
  const ctx = document.getElementById('graficaTendencia')?.getContext('2d');
  if (!ctx) return;

  if (graficoBarras) {
    graficoBarras.destroy();
  }

  const mesesMap = {};
  const mesesOrdenados = [];

  transacciones.forEach(tx => {
    const fecha = new Date(tx.fecha);
    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    
    if (!mesesMap[mesKey]) {
      mesesMap[mesKey] = { ingresos: 0, gastos: 0 };
      mesesOrdenados.push(mesKey);
    }

    if (tx.tipo === 'Ingreso') {
      mesesMap[mesKey].ingresos += tx.monto;
    } else {
      mesesMap[mesKey].gastos += tx.monto;
    }
  });

  const labels = mesesOrdenados.map(m => {
    const [año, mes] = m.split('-');
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return mesesNombres[parseInt(mes) - 1];
  });

  const ingresosData = mesesOrdenados.map(m => mesesMap[m].ingresos);
  const gastosData = mesesOrdenados.map(m => mesesMap[m].gastos);

  graficoBarras = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Ingresos',
          data: ingresosData,
          backgroundColor: '#4dff91',
        },
        {
          label: 'Gastos',
          data: gastosData,
          backgroundColor: '#ff6b6b',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#fff', font: { family: 'Poppins' } }
        },
        tooltip: { callbacks: { label: crearTooltipMoneda } }
      },
      scales: {
        x: { 
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        },
        y: { 
          ticks: { color: '#fff' },
          grid: { color: 'rgba(255, 255, 255, 0.1)' }
        }
      }
    }
  });
}

function crearTooltipMoneda(context) {
  let label = context.dataset.label || context.label || '';
  if (label) {
    label += ': ';
  }
  if (context.parsed.y !== null || context.parsed !== null) {
    const valor = context.parsed.y || context.parsed;
    label += valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
  return label;
}