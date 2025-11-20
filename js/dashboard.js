import { 
    obtenerReporte, 
    obtenerGastos, 
    obtenerIngresos, 
    obtenerDatosPerfil,
    cerrarSesion,
    estaAutenticado 
} from './api.js';

// --- CONFIGURACIÓN INICIAL ---
if (!estaAutenticado()) window.location.href = "index.html";

// Instancias de las gráficas para poder destruirlas al recargar
let chartDona = null;
let chartBarras = null;

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Cargando Dashboard...");

    // 1. Cargar nombre del usuario
    cargarUsuario();

    // 2. Configurar Fechas (Por defecto: mes actual)
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // 1er día del mes
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0); // Último día del mes

    // Formato YYYY-MM-DD para el backend de Python
    const strInicio = formatearFechaISO(primerDia);
    const strFin = formatearFechaISO(ultimoDia);

    // 3. Cargar Datos del Dashboard
    await cargarDatosDashboard(strInicio, strFin);

    // 4. Configurar Botones y Filtros
    setupEventListeners();
});

/**
 * Carga toda la información visual
 */
async function cargarDatosDashboard(inicio, fin) {
    try {
        // A. Obtener TOTALES (Endpoint de Reporte)
        const reporte = await obtenerReporte(inicio, fin);
        actualizarTarjetas(reporte);

        // B. Obtener LISTAS CRUDAS (Para Gráficas y Tabla)
        // Como el endpoint de reporte no da categorías, traemos los datos y procesamos en JS
        const [listaIngresos, listaGastos] = await Promise.all([
            obtenerIngresos(),
            obtenerGastos()
        ]);

        // C. Generar Gráficas
        generarGraficaGastos(listaGastos);
        generarGraficaTendencia(listaIngresos, listaGastos);

        // D. Generar Tabla Combinada
        generarTablaTransacciones(listaIngresos, listaGastos);

    } catch (error) {
        console.error("Error cargando dashboard:", error);
        // No mostrar alert intrusivo al inicio, mejor log
    }
}

// ============================================================
//      LÓGICA DE UI (TARJETAS Y TABLA)
// ============================================================

function actualizarTarjetas(data) {
    // Formateador de moneda
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    // Los nombres de las keys vienen de report_service.py
    document.getElementById("totalIngresos").textContent = formatter.format(data.total_ingresos);
    document.getElementById("totalGastos").textContent = formatter.format(data.total_gastos);
    document.getElementById("saldoActual").textContent = formatter.format(data.balance);
    
    // Color dinámico del saldo
    const saldoEl = document.getElementById("saldoActual");
    if(data.balance >= 0) {
        saldoEl.style.color = "#2ecc71"; // Verde
    } else {
        saldoEl.style.color = "#e74c3c"; // Rojo
    }
}

let transaccionesGlobales = []; // Para poder filtrar sin recargar API

function generarTablaTransacciones(ingresos, gastos) {
    // 1. Unificar arrays y normalizar datos
    const ingresosNorm = ingresos.map(i => ({ ...i, tipo: "Ingreso", categoria: "Ingreso" }));
    const gastosNorm = gastos.map(g => ({ ...g, tipo: "Gasto" })); // Gastos ya traen categoría

    // 2. Unir y Ordenar por fecha (más reciente primero)
    transaccionesGlobales = [...ingresosNorm, ...gastosNorm].sort((a, b) => {
        return new Date(b.fecha) - new Date(a.fecha);
    });

    renderizarTabla(transaccionesGlobales);
}

function renderizarTabla(lista) {
    const tbody = document.getElementById("transactionsBody");
    const noDataMsg = document.getElementById("noDataMsg");
    tbody.innerHTML = "";

    if (lista.length === 0) {
        noDataMsg.style.display = "block";
        return;
    }
    noDataMsg.style.display = "none";

    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    lista.forEach(item => {
        const tr = document.createElement("tr");
        
        // Estilo visual para tipo
        const claseTipo = item.tipo === "Ingreso" ? "badge-ingreso" : "badge-gasto";
        const signo = item.tipo === "Ingreso" ? "+" : "-";
        
        tr.innerHTML = `
            <td>${item.fecha}</td>
            <td><span class="${claseTipo}">${item.tipo}</span></td>
            <td style="font-weight:bold; color: ${item.tipo === 'Ingreso' ? '#2ecc71' : '#e74c3c'}">
                ${signo} ${formatter.format(item.monto)}
            </td>
            <td>${item.categoria || 'General'}</td>
            <td>${item.descripcion || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// ============================================================
//      LÓGICA DE GRÁFICAS (CHART.JS)
// ============================================================

function generarGraficaGastos(gastos) {
    const ctx = document.getElementById('graficaGastosDona').getContext('2d');

    // 1. Agrupar gastos por categoría
    const categorias = {};
    gastos.forEach(g => {
        const cat = g.categoria || "Otros";
        categorias[cat] = (categorias[cat] || 0) + g.monto;
    });

    const labels = Object.keys(categorias);
    const dataValues = Object.values(categorias);

    // Destruir anterior si existe
    if (chartDona) chartDona.destroy();

    if (labels.length === 0) {
        // Gráfica vacía visual
        labels.push("Sin Datos");
        dataValues.push(1);
    }

    chartDona = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function generarGraficaTendencia(ingresos, gastos) {
    const ctx = document.getElementById('graficaTendencia').getContext('2d');

    // Destruir anterior
    if (chartBarras) chartBarras.destroy();

    // Agrupar por Fechas (Últimos 7 registros o días, simplificado para demo)
    // Para simplificar visualización: Comparativa Total Ingresos vs Gastos
    const totalI = ingresos.reduce((sum, i) => sum + i.monto, 0);
    const totalG = gastos.reduce((sum, g) => sum + g.monto, 0);

    chartBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ingresos Totales', 'Gastos Totales'],
            datasets: [{
                label: 'Monto (MXN)',
                data: [totalI, totalG],
                backgroundColor: ['#2ecc71', '#e74c3c'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// ============================================================
//      UTILIDADES Y EVENTOS
// ============================================================

async function cargarUsuario() {
    try {
        const perfil = await obtenerDatosPerfil();
        const msg = document.getElementById("welcomeMsg");
        if(msg) msg.textContent = `Hola, ${perfil.nombre}`;
    } catch (e) { console.log("Usuario no cargado"); }
}

function setupEventListeners() {
    // Filtro de tabla
    const filtro = document.getElementById("tipoFiltro");
    filtro.addEventListener("change", (e) => {
        const valor = e.target.value;
        if (valor === "todos") {
            renderizarTabla(transaccionesGlobales);
        } else {
            const filtrados = transaccionesGlobales.filter(item => item.tipo === valor);
            renderizarTabla(filtrados);
        }
    });

    // Botón Logout
    const btnLogout = document.getElementById("logoutBtn");
    if(btnLogout) btnLogout.addEventListener("click", cerrarSesion);
}

function formatearFechaISO(fecha) {
    const d = new Date(fecha);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}