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
    console.log("🚀 Iniciando Dashboard (Versión Ligera)...");
    cargarUsuario();
    await cargarEstadisticasPlanes();
    setupEventListeners();
});

async function cargarEstadisticasPlanes() {
    try {
        // Solo necesitamos la lista básica de planes
        const respuesta = await obtenerPlanesGestion();
        
        // Manejo robusto si la respuesta viene directa o en .data
        const planes = Array.isArray(respuesta) ? respuesta : (respuesta.data || []);

        console.log(`📊 Planes cargados: ${planes.length}`);

        if (planes.length === 0) {
            mostrarEstadoVacio();
            return;
        }

        // --- CÁLCULOS GLOBALES ---
        let totalIngresoMensual = 0;
        let totalMetaAhorro = 0;

        planes.forEach(plan => {
            totalIngresoMensual += parseFloat(plan.ingreso_total) || 0;
            totalMetaAhorro += parseFloat(plan.ahorro_deseado) || 0;
        });

        // --- ACTUALIZAR UI ---
        actualizarTarjetas(totalIngresoMensual, totalMetaAhorro, planes.length);
        generarGraficaDistribucion(planes);
        generarGraficaMetas(planes);
        llenarTablaPlanes(planes);

        // Ocultar mensaje de vacío
        const noData = document.getElementById("noDataMsg");
        if(noData) noData.style.display = "none";

    } catch (error) {
        console.error("❌ Error cargando estadísticas:", error);
        mostrarEstadoVacio();
    }
}

//      TABLA LIMPIA (Solo 4 columnas, sin extras)
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
        `;
        tbody.appendChild(tr);
    });
}

//      TARJETAS DE RESUMEN
function actualizarTarjetas(ingreso, meta, cantidad) {
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    const elIngreso = document.getElementById("cardIngresoTotal");
    if(elIngreso) elIngreso.textContent = formatter.format(ingreso);

    const elMeta = document.getElementById("cardMetaTotal");
    if(elMeta) elMeta.textContent = formatter.format(meta);

    const elTotal = document.getElementById("cardTotalPlanes");
    if(elTotal) elTotal.textContent = cantidad;
}

function mostrarEstadoVacio() {
    const noData = document.getElementById("noDataMsg");
    if(noData) noData.style.display = "block";
    actualizarTarjetas(0, 0, 0);
}

//      GRÁFICAS
function generarGraficaDistribucion(planes) {
    const ctx = document.getElementById('graficaDistribucion');
    if(!ctx) return; 

    const labels = planes.map(p => p.nombre_plan);
    const data = planes.map(p => parseFloat(p.ingreso_total) || 0);

    if (chartDistribucion) chartDistribucion.destroy();

    chartDistribucion = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#7984ff', '#b1b9ff', '#4dff91', '#ff6b6b', '#ffce47', '#47ceff'],
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

//      UTILIDADES USUARIO
function cargarUsuario() {
    const msg = document.getElementById("welcomeMsg");
    if (!msg) return;

    try {
        const localUser = JSON.parse(localStorage.getItem("usuarioActivo"));
        if (localUser && localUser.nombre) {
            msg.textContent = `Hola, ${localUser.nombre}`;
            return;
        }
    } catch (e) {}

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