import * as API from './api.js';

let chartGlobalInstance = null;
let chartUsuarioInstance = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. Validar Token (básico)
    const token = localStorage.getItem("authToken");
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // 2. Logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
        API.cerrarSesion();
    });

    // 3. Cerrar Modal
    document.getElementById("btnCerrarModal").addEventListener("click", () => {
        document.getElementById("modalUsuario").classList.remove("open");
    });

    // 4. Cargar Datos
    await cargarDashboard();
    await cargarTablaUsuarios();
});

async function cargarDashboard() {
    try {
        const data = await API.obtenerDashboardAdmin();
        
        // Mapeamos los datos según tu admin_dashboard_service.py:

        const metricas = data.metricas_globales;
        const categorias = data.top_categorias;

        // Renderizar KPIs
        const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
        
        document.getElementById("kpiUsuarios").textContent = metricas.total_usuarios;
        document.getElementById("kpiPlanes").textContent = metricas.planes_creados;
        document.getElementById("kpiAhorro").textContent = fmt.format(metricas.ahorro_promedio);
        document.getElementById("kpiExtra").textContent = fmt.format(metricas.gastos_extraordinarios_totales);

        // Renderizar Gráfica Global (Top Categorías)
        renderizarChartGlobal(categorias.labels, categorias.values);

    } catch (error) {
        console.error("Error dashboard:", error);
        Swal.fire("Error", "No se pudieron cargar las métricas admin. ¿Tienes permisos?", "error");
    }
}

function renderizarChartGlobal(labels, values) {
    const ctx = document.getElementById('chartGlobal').getContext('2d');
    
    if (chartGlobalInstance) chartGlobalInstance.destroy();

    chartGlobalInstance = new Chart(ctx, {
        type: 'bar', // Barra porque pueden ser muchas categorías
        data: {
            labels: labels,
            datasets: [{
                label: 'Monto Gastado ($)',
                data: values,
                backgroundColor: '#7984ff',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

async function cargarTablaUsuarios() {
    try {
        const data = await API.obtenerListaUsuariosAdmin();
        const lista = data.usuarios || [];
        
        const tbody = document.getElementById("tablaUsuariosBody");
        tbody.innerHTML = "";
        
        const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        lista.forEach(user => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${user.nombre}</td>
                <td style="font-size: 0.9em; opacity: 0.8;">${user.email}</td>
                <td style="color: #50fa7b;">${fmt.format(user.total_ingresos)}</td>
                <td style="font-weight: bold;">${fmt.format(user.ahorro)}</td>
                <td>${user.planes_activos}</td>
                <td>
                    <button class="btn-ver" onclick="verDetalleUsuario('${user.id}')">
                        <i class='bx bx-search'></i> Ver
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        window.verDetalleUsuario = verDetalleUsuario;

    } catch (error) {
        console.error("Error usuarios:", error);
    }
}

async function verDetalleUsuario(id) {
    try {
        const user = await API.obtenerDetalleUsuarioAdmin(id);
        
        // Mapear datos según admin_dashboard_service.py -> get_estadisticas_usuario_admin
        const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        // Llenar textos
        document.getElementById("modalNombreUser").textContent = user.nombre;
        document.getElementById("modalIngresos").textContent = fmt.format(user.total_ingresos);
        document.getElementById("modalGastos").textContent = fmt.format(user.total_gastos);
        document.getElementById("modalAhorro").textContent = fmt.format(user.ahorro_actual);
        
        // Formatear fecha
        const fecha = new Date(user.fecha_registro).toLocaleDateString();
        document.getElementById("modalFecha").textContent = fecha;
        document.getElementById("modalPlanes").textContent = user.planes_activos;

        // Abrir Modal
        document.getElementById("modalUsuario").classList.add("open");

        // Renderizar Gráfica de Usuario (Dona)
        const categorias = user.categorias_principales || { labels: [], values: [] };
        renderizarChartUsuario(categorias.labels, categorias.values);

    } catch (error) {
        console.error("Error detalle:", error);
        Swal.fire("Error", "No se pudo cargar el detalle del usuario", "error");
    }
}

function renderizarChartUsuario(labels, values) {
    const ctx = document.getElementById('chartUsuario').getContext('2d');
    
    if (chartUsuarioInstance) chartUsuarioInstance.destroy();

    // Si no hay datos, mostrar algo vacío o texto
    if (values.length === 0) {
    }

    chartUsuarioInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#ffce47', '#ff6b6b', '#7984ff', '#4dff91', '#bd93f9'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#fff', boxWidth: 10 } }
            }
        }
    });
}