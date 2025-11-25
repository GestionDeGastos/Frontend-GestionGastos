/* ============================================================
   ARCHIVO: js/dashboard.js
   ============================================================ */
import { 
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
    console.log("🚀 Iniciando Dashboard de Planes...");
    
    // 1. Cargar nombre de usuario
    cargarUsuario();
    
    // 2. Cargar y calcular datos de los planes
    await cargarEstadisticasPlanes();
});

async function cargarEstadisticasPlanes() {
    try {
        // Obtenemos la lista de planes desde la API
        const respuesta = await obtenerPlanesGestion();
        
        // Aseguramos que sea un array (por si la API devuelve {data: []} o directo [])
        const planes = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);

        console.log(`📊 Planes cargados: ${planes.length}`);

        // Si no hay planes, mostramos estado vacío
        if (planes.length === 0) {
            mostrarEstadoVacio();
            return;
        }

        // --- CÁLCULOS MATEMÁTICOS ---
        let totalIngresoMensual = 0;
        let totalMetaAhorro = 0;

        planes.forEach(plan => {
            // Sumamos los ingresos configurados en cada plan
            totalIngresoMensual += parseFloat(plan.ingreso_total) || 0;
            // Sumamos las metas de ahorro de cada plan
            totalMetaAhorro += parseFloat(plan.ahorro_deseado) || 0;
        });

        // --- ACTUALIZAR INTERFAZ ---
        actualizarTarjetas(totalIngresoMensual, totalMetaAhorro, planes.length);
        generarGraficaDistribucion(planes);
        generarGraficaMetas(planes);
        llenarTablaPlanes(planes);

        // Ocultar mensaje de "sin datos" si estaba visible
        const noData = document.getElementById("noDataMsg");
        if(noData) noData.style.display = "none";

    } catch (error) {
        console.error("❌ Error cargando estadísticas:", error);
    }
}

// ============================================================
//      ACTUALIZACIÓN DE UI (Tarjetas y Tabla)
// ============================================================

function actualizarTarjetas(ingreso, meta, cantidad) {
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    // Tarjeta 1: Total Ingreso Mensual (Suma de todos los planes)
    const elIngreso = document.getElementById("cardIngresoTotal");
    if(elIngreso) elIngreso.textContent = formatter.format(ingreso);

    // Tarjeta 2: Meta Global (Suma de todos los ahorros deseados)
    const elMeta = document.getElementById("cardMetaTotal");
    if(elMeta) elMeta.textContent = formatter.format(meta);

    // Tarjeta 3: Cantidad de Planes Activos
    const elTotal = document.getElementById("cardTotalPlanes");
    if(elTotal) elTotal.textContent = cantidad;
}

function llenarTablaPlanes(planes) {
    const tbody = document.getElementById("planesBody");
    if(!tbody) return;
    
    tbody.innerHTML = "";
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    planes.forEach(plan => {
        const tr = document.createElement("tr");
        
        const ing = parseFloat(plan.ingreso_total) || 0;
        const meta = parseFloat(plan.ahorro_deseado) || 0;
        
        // Barra de progreso visual (decorativa basada en duración vs meta)
        // Simplemente mostramos una barra llena para indicar "Activo"
        
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
    actualizarTarjetas(0, 0, 0);
}

// ============================================================
//      GRÁFICAS (CHART.JS)
// ============================================================

function generarGraficaDistribucion(planes) {
    const ctx = document.getElementById('graficaDistribucion');
    if(!ctx) return; // Protección por si no existe el canvas

    // Preparamos datos: Nombres de planes y sus Ingresos Mensuales
    const labels = planes.map(p => p.nombre_plan);
    const data = planes.map(p => parseFloat(p.ingreso_total) || 0);

    if (chartDistribucion) chartDistribucion.destroy();

    chartDistribucion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
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
                legend: { position: 'right', labels: { color: '#fff' } }
            }
        }
    });
}

function generarGraficaMetas(planes) {
    const ctx = document.getElementById('graficaMetas');
    if(!ctx) return;

    const labels = planes.map(p => p.nombre_plan);
    const dataMetas = planes.map(p => parseFloat(p.ahorro_deseado) || 0);

    if (chartMetas) chartMetas.destroy();

    chartMetas = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Meta de Ahorro',
                data: dataMetas,
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
                    ticks: { color: '#aaa' }
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

function setupEventListeners() {
    const btnLogout = document.getElementById("logoutBtn");
    if(btnLogout) btnLogout.addEventListener("click", cerrarSesion);
}