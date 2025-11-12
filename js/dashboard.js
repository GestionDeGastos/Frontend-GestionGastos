// js/dashboard.js

// =============================================================
//      DATOS DE PRUEBA (MOCK DATA)
// =============================================================
// 🔸 ¡CAMBIO! Agregamos datos de meses anteriores (Agosto, Septiembre)
// para que el gráfico de tendencia funcione.
const mockTransacciones = [
  // --- Octubre 2025 ---
  { id: 1, fecha: "2025-10-28", tipo: "Ingreso", monto: 15000, categoria: "Salario", descripcion: "Quincena" },
  { id: 2, fecha: "2025-10-28", tipo: "Gasto", monto: 800, categoria: "Servicios", descripcion: "Pago de luz" },
  { id: 3, fecha: "2025-10-27", tipo: "Gasto", monto: 450, categoria: "Comida", descripcion: "Supermercado" },
  { id: 4, fecha: "2025-10-26", tipo: "Ingreso", monto: 1000, categoria: "Freelance", descripcion: "Proyecto logo" },
  { id: 5, fecha: "2025-10-25", tipo: "Gasto", monto: 2500, categoria: "Renta", descripcion: "Pago mensual" },
  { id: 6, fecha: "2025-10-24", tipo: "Gasto", monto: 300, categoria: "Transporte", descripcion: "Gasolina" },
  { id: 7, fecha: "2025-10-23", tipo: "Gasto", monto: 1200, categoria: "Ocio", descripcion: "Cine y cena" },

  // --- Septiembre 2025 ---
  { id: 8, fecha: "2025-09-30", tipo: "Ingreso", monto: 15000, categoria: "Salario", descripcion: "Quincena" },
  { id: 9, fecha: "2025-09-28", tipo: "Gasto", monto: 800, categoria: "Servicios", descripcion: "Pago de luz" },
  { id: 10, fecha: "2025-09-25", tipo: "Gasto", monto: 3000, categoria: "Renta", descripcion: "Pago mensual" },
  { id: 11, fecha: "2025-09-20", tipo: "Gasto", monto: 1500, categoria: "Ocio", descripcion: "Concierto" },
  { id: 12, fecha: "2025-09-15", tipo: "Gasto", monto: 600, categoria: "Comida", descripcion: "Supermercado" },

  // --- Agosto 2025 ---
  { id: 13, fecha: "2025-08-30", tipo: "Ingreso", monto: 15000, categoria: "Salario", descripcion: "Quincena" },
  { id: 14, fecha: "2025-08-28", tipo: "Gasto", monto: 750, categoria: "Servicios", descripcion: "Pago de luz" },
  { id: 15, fecha: "2025-08-25", tipo: "Gasto", monto: 3000, categoria: "Renta", descripcion: "Pago mensual" },
  { id: 16, fecha: "2025-08-10", tipo: "Gasto", monto: 1000, categoria: "Transporte", descripcion: "Llantas" },
];


// =============================================================
//      VARIABLES GLOBALES DE GRÁFICOS
// =============================================================
let todasLasTransacciones = [];
let graficoDona = null;
let graficoBarras = null;

// Paleta de colores para la gráfica de dona
const PALETA_COLORES_DONA = [
  '#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b', 
  '#ffc94d', '#36a2eb', '#ff9f40', '#9966ff'
];


// =============================================================
//      LÓGICA DEL DASHBOARD (Sin API)
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
    Swal.fire({
      icon: 'success',
      title: 'Sesión cerrada',
      text: 'Has cerrado sesión exitosamente.',
      confirmButtonColor: '#7984ff',
      background: '#0f0f23',
      color: '#fff'
    });
    setTimeout(() => (window.location.href = "index.html"), 1500);
  });

  document.getElementById("tipoFiltro").addEventListener("change", aplicarFiltros);
  cargarTransacciones();
});

/**
 * Carga los datos (de mockTransacciones) y los muestra
 */
function cargarTransacciones() {
  const transactionsBody = document.getElementById("transactionsBody");
  const noDataMsg = document.getElementById("noDataMsg");
  transactionsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

  setTimeout(() => {
    try {
      todasLasTransacciones = mockTransacciones; 
      
      if (todasLasTransacciones.length === 0) {
        transactionsBody.innerHTML = '';
        noDataMsg.style.display = "block";
        noDataMsg.textContent = "No hay transacciones registradas (datos de prueba).";
      } else {
        aplicarFiltros();
      }

    } catch (error) {
      console.error(error);
      transactionsBody.innerHTML = '';
      noDataMsg.textContent = "Error al cargar los datos visuales.";
      noDataMsg.style.display = "block";
      noDataMsg.style.color = "red";
    }
  }, 800); // 800ms de espera simulada
}

/**
 * Función central que filtra los datos y actualiza la UI
 */
function aplicarFiltros() {
  const tipoFiltro = document.getElementById("tipoFiltro").value;

  let transaccionesFiltradas = [];
  if (tipoFiltro === "todos") {
    transaccionesFiltradas = todasLasTransacciones;
  } else {
    transaccionesFiltradas = todasLasTransacciones.filter(tx => tx.tipo === tipoFiltro);
  }
  
  // 1. Renderizar la tabla
  renderizarTabla(transaccionesFiltradas);
  
  // 2. Calcular tarjetas de resumen
  // (Si filtramos, usamos 'todas' para el resumen, si no, las filtradas)
  const transaccionesParaResumen = (tipoFiltro === "todos") ? todasLasTransacciones : transaccionesFiltradas;
  calcularYMostrarResumen(transaccionesParaResumen);

  // 3. 🔸 ¡NUEVO! Renderizar las gráficas con los datos filtrados
  // (El filtro de tipo también afectará a las gráficas)
  renderizarGraficaDona(transaccionesFiltradas);
  renderizarGraficaTendencia(transaccionesFiltradas);
}

/**
 * Renderiza la tabla
 */
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

/**
 * Calcula y muestra los totales
 */
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


// =============================================================
//      NUEVAS FUNCIONES DE GRÁFICOS
// =============================================================

/**
 * 🔹 GRÁFICA 1: DESGLOSE DE GASTOS (DONA)
 * Renderiza la gráfica de dona con el desglose de gastos por categoría.
 */
function renderizarGraficaDona(transacciones) {
  const ctx = document.getElementById('graficaGastosDona')?.getContext('2d');
  if (!ctx) return; 

  if (graficoDona) {
    graficoDona.destroy();
  }
  
  // Procesar datos: Agrupar gastos por categoría
  const gastosPorCategoria = transacciones
    .filter(tx => tx.tipo === 'Gasto') // Solo gastos
    .reduce((acc, tx) => {
      if (!acc[tx.categoria]) {
        acc[tx.categoria] = 0;
      }
      acc[tx.categoria] += tx.monto;
      return acc;
    }, {});

  const labels = Object.keys(gastosPorCategoria);
  const data = Object.values(gastosPorCategoria);

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

/**
 * 🔹 GRÁFICA 2: TENDENCIA MENSUAL (BARRAS)
 * Renderiza la gráfica de barras con ingresos vs gastos por mes.
 */
function renderizarGraficaTendencia(transacciones) {
  const ctx = document.getElementById('graficaTendencia')?.getContext('2d');
  if (!ctx) return;

  if (graficoBarras) {
    graficoBarras.destroy();
  }

  // Procesar datos: Agrupar por mes (Agosto=7, Sept=8, Oct=9)
  const labels = ['Agosto', 'Septiembre', 'Octubre'];
  const ingresosData = [0, 0, 0];
  const gastosData = [0, 0, 0];

  transacciones.forEach(tx => {
    const mes = new Date(tx.fecha).getMonth(); // 7, 8, o 9
    const index = mes - 7; // Convertir 7->0, 8->1, 9->2

    if (index >= 0 && index < 3) {
      if (tx.tipo === 'Ingreso') {
        ingresosData[index] += tx.monto;
      } else if (tx.tipo === 'Gasto') {
        gastosData[index] += tx.monto;
      }
    }
  });

  graficoBarras = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Ingresos',
          data: ingresosData,
          backgroundColor: '#4dff91', // Color ingreso
        },
        {
          label: 'Gastos',
          data: gastosData,
          backgroundColor: '#ff6b6b', // Color gasto
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

/**
 * Función de ayuda para formatear el tooltip de Chart.js
 */
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