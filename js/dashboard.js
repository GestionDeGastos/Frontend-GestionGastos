/* ============================================================
   ARCHIVO: js/dashboard.js - Dashboard de Usuario Optimizado
   ============================================================ */
import { 
    obtenerDashboardUsuario,
    obtenerPlanesGestion, 
    obtenerDatosPerfil,
    cerrarSesion,
    estaAutenticado 
} from './api.js';

// --- CONFIGURACIÓN INICIAL ---
if (!estaAutenticado()) window.location.href = "index.html";

// Variables para las gráficas
let chartDistribucion = null;
let chartMetas = null;

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Iniciando Dashboard de Usuario Optimizado...");
    
    // 1. Cargar nombre de usuario
    cargarUsuario();
    
    // 2. Cargar datos desde el backend optimizado
    await cargarDashboardOptimizado();
    
    // 3. Cargar planes para la tabla de detalle
    await cargarTablaPlanes();
});

async function cargarDashboardOptimizado() {
    try {
        // ✅ USAR ENDPOINT OPTIMIZADO: GET /dashboard/
        const data = await obtenerDashboardUsuario();
        
        console.log("📊 Dashboard data:", data);

        // Validar que llegaron los datos
        if (!data || !data.summary) {
            console.warn("⚠️ No se recibieron datos del dashboard");
            mostrarEstadoVacio();
            return;
        }

        const { summary, categorias_principales } = data;

        // --- ACTUALIZAR TARJETAS ---
        const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        // Tarjeta 1: Total Ingresos
        const elIngreso = document.getElementById("cardIngresoTotal");
        if(elIngreso) elIngreso.textContent = formatter.format(summary.total_ingresos || 0);

        // Tarjeta 2: Ahorro Actual
        const elMeta = document.getElementById("cardMetaTotal");
        if(elMeta) elMeta.textContent = formatter.format(summary.ahorro_actual || 0);

        // Tarjeta 3: Gasto Promedio (Como indicador de gestión)
        const elTotal = document.getElementById("cardTotalPlanes");
        if(elTotal) elTotal.textContent = formatter.format(summary.gasto_promedio || 0);

        // --- GRÁFICAS ---
        if (categorias_principales && categorias_principales.labels && categorias_principales.values) {
            generarGraficaDistribucion(categorias_principales.labels, categorias_principales.values);
            generarGraficaMetas(categorias_principales.labels, categorias_principales.values);
        }

        // Ocultar mensaje de "sin datos"
        const noData = document.getElementById("noDataMsg");
        if(noData) noData.style.display = "none";

    } catch (error) {
        console.error("❌ Error cargando dashboard:", error);
        mostrarEstadoVacio();
    }
}

async function cargarTablaPlanes() {
    try {
        // Obtenemos la lista de planes para la tabla de detalle
        const respuesta = await obtenerPlanesGestion();
        const planes = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);

        console.log(`📋 Planes cargados para tabla: ${planes.length}`);

        if (planes.length === 0) {
            return; // Ya se mostró estado vacío en cargarDashboardOptimizado
        }

        llenarTablaPlanes(planes);

    } catch (error) {
        console.error("❌ Error cargando planes:", error);
    }
}

// ============================================================
//      ACTUALIZACIÓN DE UI (Tarjetas y Tabla)
// ============================================================

function llenarTablaPlanes(planes) {
    const tbody = document.getElementById("planesBody");
    if(!tbody) return;
    
    tbody.innerHTML = "";
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    planes.forEach(plan => {
        const tr = document.createElement("tr");
        
        const ing = parseFloat(plan.ingreso_total) || 0;
        const meta = parseFloat(plan.ahorro_deseado) || 0;
        
        tr.innerHTML = `
            <td style="font-weight: bold; color: #fff;">${plan.nombre_plan}</td>
            <td>${plan.duracion_meses} meses</td>
            <td style="color: #4dff91;">${formatter.format(ing)}</td>
            <td style="color: #7984ff;">${formatter.format(meta)}</td>
            <td>
                <div style="background: #2a2a40; border-radius: 4px; height: 6px; width: 100%; position: relative;">
                    <div style="background: #7984ff; height: 100%; width: 100%; border-radius: 4px;"></div>
                </div>
                <small style="color: #aaa;">En curso</small>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function mostrarEstadoVacio() {
    const noData = document.getElementById("noDataMsg");
    if(noData) noData.style.display = "block";
    
    // Poner valores en 0
    const elIngreso = document.getElementById("cardIngresoTotal");
    const elMeta = document.getElementById("cardMetaTotal");
    const elTotal = document.getElementById("cardTotalPlanes");
    
    if(elIngreso) elIngreso.textContent = "$0.00";
    if(elMeta) elMeta.textContent = "$0.00";
    if(elTotal) elTotal.textContent = "$0.00";
}

// ============================================================
//      GRÁFICAS (CHART.JS)
// ============================================================

function generarGraficaDistribucion(labels, values) {
    const ctx = document.getElementById('graficaDistribucion');
    if(!ctx) return;

    if (chartDistribucion) chartDistribucion.destroy();

    chartDistribucion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b', '#ffce47', '#47ceff'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#fff' } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
                            return context.label + ': ' + formatter.format(context.raw);
                        }
                    }
                }
            }
        }
    });
}

function generarGraficaMetas(labels, values) {
    const ctx = document.getElementById('graficaMetas');
    if(!ctx) return;

    if (chartMetas) chartMetas.destroy();

    chartMetas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Gastos por Categoría',
                data: values,
                backgroundColor: '#7984ff',
                borderRadius: 6,
                barThickness: 30
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { 
                    callbacks: {
                        label: function(context) {
                            return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#2a2a40' },
                    ticks: { 
                        color: '#aaa',
                        callback: function(value) {
                            return '$' + value.toLocaleString('es-MX');
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#fff' }
                }
            }
        }
    });
}

// ============================================================
//      UTILIDADES
// ============================================================

function cargarUsuario() {
    const msg = document.getElementById("welcomeMsg");
    if (!msg) return;

    // Intentar leer de local storage primero
    try {
        const localUser = JSON.parse(localStorage.getItem("usuarioActivo"));
        if (localUser && localUser.nombre) {
            msg.textContent = `Hola, ${localUser.nombre}`;
            return;
        }
    } catch (e) {}

    // Si no, pedir a API
    obtenerDatosPerfil().then(perfil => {
        if(perfil && perfil.nombre) {
             msg.textContent = `Hola, ${perfil.nombre}`;
             localStorage.setItem("usuarioActivo", JSON.stringify(perfil));
        }
    }).catch(e => console.warn("No se pudo cargar el perfil"));
}

// Setup logout
const btnLogout = document.getElementById("logoutBtn");
if(btnLogout) btnLogout.addEventListener("click", cerrarSesion);