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

    console.log("🚀 Iniciando Panel Administrativo Optimizado...");
    await cargarDashboardGlobal(); 
    await cargarTablaUsuarios();
});

// ==========================================
// 1. DASHBOARD GLOBAL - ESTRUCTURA OPTIMIZADA
// ==========================================
async function cargarDashboardGlobal() {
    try {
        console.log("🔍 Solicitando dashboard admin...");
        const data = await API.obtenerDashboardAdmin(); 
        
        console.log("📊 Dashboard Admin data RAW:", data);
        console.log("📊 Tipo de data:", typeof data);
        console.log("📊 Keys de data:", data ? Object.keys(data) : "null");
        
        // ✅ Validar que llegaron los datos correctamente
        if (!data || !data.metricas_globales) {
            console.error("⚠️ No se recibieron métricas del dashboard admin");
            console.error("⚠️ Data completa:", JSON.stringify(data, null, 2));
            return;
        }

        const metricas = data.metricas_globales;
        const categorias = data.top_categorias;

        console.log("✅ Métricas globales:", metricas);
        console.log("✅ Categorías:", categorias);

        const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

        // --- FILA 1: Totales ---
        console.log("📝 Actualizando KPIs...");
        setText("kpiUsuarios", metricas.total_usuarios || 0);
        setText("kpiPlanes", metricas.planes_creados || 0);
        setText("kpiIngresosTotales", fmt.format(metricas.ingresos_totales_sistema || 0));
        setText("kpiGastosTotales", fmt.format(metricas.gastos_totales_sistema || 0));

        // --- FILA 2: Promedios y Extras ---
        setText("kpiGastosExtra", fmt.format(metricas.gastos_extraordinarios_totales || 0));
        setText("kpiPromedioIngreso", fmt.format(metricas.promedio_ingresos_por_usuario || 0));
        setText("kpiPromedioGasto", fmt.format(metricas.promedio_gastos_por_usuario || 0));
        setText("kpiPromedioAhorro", fmt.format(metricas.ahorro_promedio || 0));

        // --- GRÁFICA DE CATEGORÍAS ---
        if (categorias && categorias.labels && categorias.values) {
            renderizarChartGlobal(categorias.labels, categorias.values);
        }

    } catch (error) {
        console.error("❌ Error cargando dashboard admin:", error);
        // Mostrar valores por defecto
        setText("kpiUsuarios", "0");
        setText("kpiPlanes", "0");
        setText("kpiIngresosTotales", "$0.00");
        setText("kpiGastosTotales", "$0.00");
        setText("kpiGastosExtra", "$0.00");
        setText("kpiPromedioIngreso", "$0.00");
        setText("kpiPromedioGasto", "$0.00");
        setText("kpiPromedioAhorro", "$0.00");
    }
}

function setText(id, val) {
    const el = document.getElementById(id);
    if(el) {
        el.textContent = val;
        console.log(`✅ setText: ${id} = ${val}`);
    } else {
        console.warn(`⚠️ Elemento no encontrado: ${id}`);
    }
}

function renderizarChartGlobal(labels, values) {
    const ctx = document.getElementById('chartGlobal');
    if (!ctx) {
        console.warn("⚠️ Canvas 'chartGlobal' no encontrado");
        return;
    }
    
    const context = ctx.getContext('2d');
    if (chartGlobalInstance) chartGlobalInstance.destroy();

    chartGlobalInstance = new Chart(context, {
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

// ==========================================
// 2. TABLA DE USUARIOS - ESTRUCTURA OPTIMIZADA
// ==========================================
async function cargarTablaUsuarios() {
    try {
        const data = await API.obtenerListaUsuariosAdmin();
        
        console.log("👥 Usuarios data:", data);
        
        // ✅ Validar estructura de respuesta
        if (!data || !Array.isArray(data.usuarios)) {
            console.error("⚠️ Estructura de usuarios incorrecta:", data);
            usuariosGlobales = [];
            renderizarFilas([]);
            return;
        }

        usuariosGlobales = data.usuarios;
        renderizarFilas(usuariosGlobales);
        
        console.log(`✅ ${usuariosGlobales.length} usuarios cargados`);
        
    } catch (error) { 
        console.error("❌ Error cargando usuarios:", error);
        usuariosGlobales = [];
        renderizarFilas([]);
    }
}

function renderizarFilas(lista) {
    const tbody = document.getElementById("tablaUsuariosBody");
    if (!tbody) {
        console.warn("⚠️ Tabla de usuarios no encontrada");
        return;
    }

    tbody.innerHTML = "";
    
    if(lista.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#aaa;">Sin usuarios registrados</td></tr>`; 
        return; 
    }
    
    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    lista.forEach(user => {
        const tr = document.createElement("tr");
        
        // ✅ Usar campos correctos según la estructura del backend
        const nombre = user.nombre || "Sin nombre";
        const email = user.email || "Sin email";
        const ingresos = user.total_ingresos || 0;
        const planes = user.planes_activos || 0;
        const userId = user.id;

        tr.innerHTML = `
            <td>${nombre}</td>
            <td style="opacity:0.7">${email}</td>
            <td style="color:#4dff91">${fmt.format(ingresos)}</td>
            <td>${planes}</td>
            <td>
                <button class="btn-ver" onclick="window.verDetalle('${userId}')"><i class='bx bx-search'></i></button>
                <button class="btn-eliminar" onclick="window.eliminar('${userId}')" style="margin-left:5px; color:#ff6b6b; background:none; border:1px solid #ff6b6b; border-radius:5px; cursor:pointer;"><i class='bx bx-trash'></i></button>
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
        (u.nombre && u.nombre.toLowerCase().includes(term)) || 
        (u.email && u.email.toLowerCase().includes(term))
    );

    renderizarFilas(filtrados);
}

// ==========================================
// 3. MODAL DE DETALLE DE USUARIO - OPTIMIZADO
// ==========================================
window.verDetalle = async (id) => {
    try {
        const d = await API.obtenerDetalleUsuarioAdmin(id);
        
        console.log("👤 Detalle usuario:", d);
        
        const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
        
        // ✅ 1. Datos Básicos
        setText("modalNombreUser", d.nombre || "Usuario");
        setText("modalCorreo", d.email || d.correo || "Sin email");
        setText("modalId", d.usuario_id || id);
        setText("modalIngresos", fmt.format(d.total_ingresos || 0));
        setText("modalGastos", fmt.format(d.total_gastos || 0));

        // ✅ 2. Estadísticas Calculadas
        const planes = d.planes_activos || 0;
        const ingresos = d.total_ingresos || 0;
        const gastos = d.total_gastos || 0;
        const ahorro = ingresos - gastos;

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
        if (elUso) {
            elUso.textContent = nivelUso;
            elUso.style.color = colorUso;
        }

        // C. Promedio Ingresos por Plan (evitar división por cero)
        let promedio = 0;
        if (planes > 0) {
            promedio = ingresos / planes;
        }
        setText("modalPromedioPlan", fmt.format(promedio));

        // ✅ 3. Gráfica Modal
        const ctx = document.getElementById('chartUsuario');
        if (ctx) {
            const context = ctx.getContext('2d');
            if (chartUsuarioInstance) chartUsuarioInstance.destroy();
            
            chartUsuarioInstance = new Chart(context, {
                type: 'doughnut',
                data: {
                    labels: ['Ingresos', 'Gastos', 'Ahorro Neto'],
                    datasets: [{ 
                        data: [ingresos, gastos, ahorro > 0 ? ahorro : 0], 
                        backgroundColor: ['#4dff91', '#ff6b6b', '#7984ff'], 
                        borderWidth: 0 
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
                                    return context.label + ': ' + fmt.format(context.raw);
                                }
                            }
                        }
                    } 
                }
            });
        }

        document.getElementById("modalUsuario").classList.add("open");

    } catch(e) { 
        console.error("❌ Error cargando detalle:", e);
        Swal.fire({
            icon: "error",
            title: "Error", 
            text: "No se pudo cargar el detalle del usuario",
            background: '#15192b',
            color: '#fff',
            confirmButtonColor: '#7984ff'
        }); 
    }
};

window.eliminar = async (id) => {
    const result = await Swal.fire({
        title: '¿Eliminar usuario?',
        text: "Esta acción no se puede deshacer",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#15192b',
        color: '#fff',
        confirmButtonColor: '#ff6b6b',
        cancelButtonColor: '#7984ff'
    });

    if(result.isConfirmed){
        try {
            await API.eliminarUsuarioAdmin(id);
            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'Usuario eliminado correctamente',
                showConfirmButton: false,
                timer: 1500,
                background: '#15192b',
                color: '#fff'
            });
            await cargarTablaUsuarios();
        } catch(e) {
            console.error("❌ Error eliminando usuario:", e);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: e.message || 'No se pudo eliminar el usuario',
                background: '#15192b',
                color: '#fff',
                confirmButtonColor: '#7984ff'
            });
        }
    }
};