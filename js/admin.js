import * as API from './api.js';

let chartGlobalInstance = null;
let chartUsuarioInstance = null;
let usuariosGlobales = []; 

document.addEventListener("DOMContentLoaded", async () => {
    if (!localStorage.getItem("authToken")) { window.location.href = "index.html"; return; }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => API.cerrarSesion());
    
    const cerrarModalBtn = document.getElementById("btnCerrarModal");
    if (cerrarModalBtn) cerrarModalBtn.addEventListener("click", () => document.getElementById("modalUsuario").classList.remove("open"));

    const buscador = document.getElementById("buscadorUsuarios");
    if(buscador) buscador.addEventListener("input", (e) => filtrarTablaUsuarios(e.target.value));

    await cargarDashboardGlobal(); 
    await cargarTablaUsuarios();
});

// ==========================================
// 1. DASHBOARD GLOBAL
// ==========================================
async function cargarDashboardGlobal() {
    try {
        const data = await API.obtenerDashboardAdmin(); 
        const metricas = data.metricas_globales;
        const categorias = data.top_categorias;

        const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        // --- FILA 1: Totales ---
        setText("kpiUsuarios", metricas.total_usuarios);
        setText("kpiPlanes", metricas.planes_creados);
        setText("kpiIngresosTotales", fmt.format(metricas.ingresos_totales_sistema));
        setText("kpiGastosTotales", fmt.format(metricas.gastos_totales_sistema));

        // --- FILA 2: Promedios y Extras (NUEVO) ---
        // Estos datos ya vienen calculados desde el backend (admin_dashboard_service.py)
        setText("kpiGastosExtra", fmt.format(metricas.gastos_extraordinarios_totales));
        setText("kpiPromedioIngreso", fmt.format(metricas.promedio_ingresos_por_usuario));
        setText("kpiPromedioGasto", fmt.format(metricas.promedio_gastos_por_usuario));
        setText("kpiPromedioAhorro", fmt.format(metricas.ahorro_promedio));

        renderizarChartGlobal(categorias.labels, categorias.values);

    } catch (error) {
        console.error("Error dashboard:", error);
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if(el) el.textContent = val;
}

function renderizarChartGlobal(labels, values) {
    const ctx = document.getElementById('chartGlobal').getContext('2d');
    if (chartGlobalInstance) chartGlobalInstance.destroy();

    chartGlobalInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#7984ff', '#ff6b6b', '#4dff91', '#ffce47', '#bd93f9'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#fff' } } }
        }
    });
}

// ==========================================
// 2. TABLA DE USUARIOS
// ==========================================
async function cargarTablaUsuarios() {
    try {
        const data = await API.obtenerListaUsuariosAdmin();
        usuariosGlobales = data.usuarios || [];
        renderizarFilas(usuariosGlobales);
        
        // Hidratación
        usuariosGlobales.forEach(async (u) => {
            try {
                const detalle = await API.obtenerDetalleUsuarioAdmin(u.id);
                u.emailReal = detalle.email || detalle.correo || "Sin email";
                const cellEmail = document.getElementById(`email-${u.id}`);
                if(cellEmail) cellEmail.textContent = u.emailReal;

                u.planesReal = detalle.planes_activos || (detalle.planes ? detalle.planes.length : 0);
                const cellPlanes = document.getElementById(`planes-${u.id}`);
                if(cellPlanes) cellPlanes.textContent = u.planesReal;
            } catch(e) {}
        });
    } catch (error) { console.error(error); }
}

function renderizarFilas(lista) {
    const tbody = document.getElementById("tablaUsuariosBody");
    if(!tbody) return;
    tbody.innerHTML = "";
    
    if(lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; opacity:0.6;">No se encontraron resultados</td></tr>`;
        return;
    }

    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    lista.forEach(user => {
        const tr = document.createElement("tr");
        tr.id = `fila-${user.id}`; 
        const emailMostrar = user.emailReal || '<span style="opacity:0.7">Cargando...</span>';
        const planesMostrar = (user.planesReal !== undefined) ? user.planesReal : 0;

        const estiloPlanes = (user.planesReal > 0) ? "font-weight:bold; color:#4dff91;" : "";
        const estiloEmail = (user.emailReal && user.emailReal !== "Sin email") ? "color:#fff;" : "font-size:0.9em; opacity:0.8;";

        tr.innerHTML = `
            <td>${user.nombre}</td>
            <td id="email-${user.id}" class="td-email" style="${estiloEmail}">${emailMostrar}</td>
            
            <td style="color:#4dff91">${fmt.format(user.total_ingresos || 0)}</td>
            
            <td id="planes-${user.id}" class="td-planes" style="${estiloPlanes}">${planesMostrar}</td>
            
            <td>
                <div style="display:flex; gap:5px;">
                    <button class="btn-ver" onclick="window.verDetalle('${user.id}')" title="Ver Estadísticas">
                        <i class='bx bx-search'></i>
                    </button>
                    <button class="btn-eliminar" onclick="window.eliminar('${user.id}')" title="Eliminar" style="border: 1px solid #ff5555; color: #ff5555; background: transparent; border-radius: 5px; cursor: pointer;">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarTablaUsuarios(texto) {
    if (!texto || texto.trim() === "") {
        renderizarFilas(usuariosGlobales);
        return;
    }
    const textoBajo = texto.trim().toLowerCase();

    const filtrados = usuariosGlobales.filter(u => 
        (u.nombre && u.nombre.toLowerCase().includes(textoBajo)) || 
        (u.emailReal && u.emailReal.toLowerCase().includes(textoBajo)) ||
        (u.email && u.email.toLowerCase().includes(textoBajo))
    );

    renderizarFilas(filtrados);
}

// ==========================================
// 3. ACCIONES Y MODAL
// ==========================================
window.verDetalle = async (id) => {
    try {
        const d = await API.obtenerDetalleUsuarioAdmin(id);
        const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
        
        // 1. Datos Básicos
        setText("modalNombreUser", d.nombre);
        setText("modalCorreo", d.email || d.correo || "Sin email");
        setText("modalId", d.usuario_id || id);
        setText("modalIngresos", fmt.format(d.total_ingresos || 0));
        setText("modalGastos", fmt.format(d.total_gastos || 0));

        // 2. CÁLCULOS DE ESTADÍSTICAS SOLICITADAS
        const planes = d.planes_activos || 0;
        const ingresos = d.total_ingresos || 0;

        // A. Total Planes
        setText("modalPlanesDetail", planes);

        // B. Nivel de Uso (Lógica Frontend)
        let nivelUso = "Bajo";
        let colorUso = "#ff6b6b"; // Rojo
        
        if (planes > 0) { 
            nivelUso = "Medio"; 
            colorUso = "#4dff91"; // Verde
        }
        if (planes >= 3 || ingresos > 50000) { 
            nivelUso = "Alto"; 
            colorUso = "#7984ff"; // Azul
        }
        
        const elUso = document.getElementById("modalNivelUso");
        elUso.textContent = nivelUso;
        elUso.style.color = colorUso;

        // C. Promedio Ingresos por Plan
        // Evitamos división por cero
        let promedio = 0;
        if (planes > 0) {
            promedio = ingresos / planes;
        }
        setText("modalPromedioPlan", fmt.format(promedio));

        // 3. Gráfica Modal
        const ctx = document.getElementById('chartUsuario').getContext('2d');
        if (chartUsuarioInstance) chartUsuarioInstance.destroy();
        
        chartUsuarioInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Ingresos', 'Gastos', 'Ahorro Neto'],
                datasets: [{ 
                    data: [d.total_ingresos||0, d.total_gastos||0, (d.total_ingresos - d.total_gastos)||0], 
                    backgroundColor: ['#4dff91', '#ff6b6b', '#7984ff'], 
                    borderWidth: 0 
                }]
            },
            options: { 
                plugins: { legend: { position: 'right', labels: { color: '#fff' } } } 
            }
        });

        document.getElementById("modalUsuario").classList.add("open");

    } catch(e) { 
        console.error(e);
        Swal.fire("Error", "No se pudo cargar el detalle", "error"); 
    }
};

window.eliminar = async (id) => {
    if((await Swal.fire({title:'¿Eliminar?', icon:'warning', showCancelButton:true, background:'#15192b', color:'#fff'})).isConfirmed){
        try {
            await API.eliminarUsuarioAdmin(id);
            Swal.fire({icon:'success', title:'Eliminado', showConfirmButton:false, timer:1000, background:'#15192b', color:'#fff'});
            cargarTablaUsuarios();
        } catch(e) { Swal.fire({icon:'error', title:'Error', text:'Backend no permite eliminar', background:'#15192b', color:'#fff'}); }
    }
};