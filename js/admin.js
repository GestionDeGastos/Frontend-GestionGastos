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
    tbody.innerHTML = "";
    if(lista.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center">Sin datos</td></tr>`; return; }
    
    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    lista.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.nombre}</td>
            <td id="email-${user.id}" style="opacity:0.7">Cargando...</td>
            <td style="color:#4dff91">${fmt.format(user.total_ingresos || 0)}</td>
            <td id="planes-${user.id}">0</td>
            <td>
                <button class="btn-ver" onclick="window.verDetalle('${user.id}')"><i class='bx bx-search'></i></button>
                <button class="btn-eliminar" onclick="window.eliminar('${user.id}')" style="margin-left:5px; color:#ff6b6b; background:none; border:1px solid #ff6b6b; border-radius:5px; cursor:pointer;"><i class='bx bx-trash'></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarTablaUsuarios(txt) {
    const term = txt.toLowerCase();
    const filtrados = usuariosGlobales.filter(u => 
        u.nombre.toLowerCase().includes(term) || (u.emailReal && u.emailReal.toLowerCase().includes(term))
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