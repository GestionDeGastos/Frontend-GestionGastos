import * as API from './api.js';

let chartGlobalInstance = null;
let chartUsuarioInstance = null;
let usuariosGlobales = []; 

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. Validar Token
    const token = localStorage.getItem("authToken");
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    // 2. Listeners
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => API.cerrarSesion());
    
    const cerrarModalBtn = document.getElementById("btnCerrarModal");
    if (cerrarModalBtn) {
        cerrarModalBtn.addEventListener("click", () => {
            document.getElementById("modalUsuario").classList.remove("open");
        });
    }

    const buscador = document.getElementById("buscadorUsuarios");
    if(buscador) {
        buscador.addEventListener("input", (e) => filtrarTablaUsuarios(e.target.value));
    }

    // 3. Carga inicial de datos
    await cargarDatosCompletos();
});

// ==========================================
// LÓGICA PRINCIPAL
// ==========================================

async function cargarDatosCompletos() {
    try {
        const data = await API.obtenerListaUsuariosAdmin();
        usuariosGlobales = data.usuarios || [];
        
        // Render inicial 
        renderizarFilas(usuariosGlobales);
        actualizarKPIsProvisionales(usuariosGlobales);
        
        await procesarDetallesUsuarios(usuariosGlobales);

    } catch (error) {
        console.error("Error cargando usuarios:", error);
    }
}

async function procesarDetallesUsuarios(lista) {
    let sumaEdades = 0;
    let usuariosConEdad = 0;
    let sumaPlanes = 0;
    let sumaIngresosTotales = 0;

    for (let i = 0; i < lista.length; i++) {
        const usuarioBase = lista[i];
        
        try {
            const detalle = await API.obtenerDetalleUsuarioAdmin(usuarioBase.id);
            
            // 1. Email (Si viene null, ponemos 'Sin email')
            usuarioBase.emailReal = detalle.email || detalle.correo || "Sin email";
            
            // 2. Edad (Intentamos buscarla, si no existe, será 0)
            let edadTemp = detalle.edad || detalle.age || (detalle.perfil ? detalle.perfil.edad : 0) || 0;
            usuarioBase.edadReal = parseInt(edadTemp) || 0;

            // 3. Planes
            let planesCount = 0;
            if (detalle.planes_activos !== undefined) planesCount = detalle.planes_activos;
            else if (detalle.planes && Array.isArray(detalle.planes)) planesCount = detalle.planes.length;
            
            usuarioBase.planesReal = planesCount;

            // 4. Finanzas
            usuarioBase.ingresosReal = parseFloat(detalle.total_ingresos || detalle.ingresos || 0);
            usuarioBase.gastosReal = parseFloat(detalle.total_gastos || detalle.gastos || 0);

            // Acumuladores para KPIs
            if (usuarioBase.edadReal > 0) {
                sumaEdades += usuarioBase.edadReal;
                usuariosConEdad++;
            }
            sumaPlanes += usuarioBase.planesReal;
            sumaIngresosTotales += usuarioBase.ingresosReal;

            actualizarFilaTabla(usuarioBase);

        } catch (e) {
        }
    }

    // KPIs FINALES
    const totalUsers = lista.length;
    
    const promedioEdad = usuariosConEdad > 0 ? (sumaEdades / usuariosConEdad).toFixed(0) : "--";
    const promedioIngreso = totalUsers > 0 ? (sumaIngresosTotales / totalUsers) : 0;
    const promedioPlanes = totalUsers > 0 ? (sumaPlanes / totalUsers).toFixed(1) : "0.0";

    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    
    // Actualizar Tarjetas Superiores
    const elKpiUsers = document.getElementById("kpiUsuarios");
    if(elKpiUsers) elKpiUsers.textContent = totalUsers;

    const elKpiEdad = document.getElementById("kpiEdad");
    if(elKpiEdad) elKpiEdad.textContent = (promedioEdad === "--") ? "--" : `${promedioEdad} años`;

    const elKpiIngreso = document.getElementById("kpiIngresoPromedio");
    if(elKpiIngreso) elKpiIngreso.textContent = fmt.format(promedioIngreso);

    const elKpiPlanes = document.getElementById("kpiPlanesPromedio");
    if(elKpiPlanes) elKpiPlanes.textContent = promedioPlanes;

    // Actualizar Gráfica Global
    let totalGastosGlobal = usuariosGlobales.reduce((sum, u) => sum + (u.gastosReal || 0), 0);
    renderizarChartGlobal(sumaIngresosTotales, totalGastosGlobal);
}

function actualizarKPIsProvisionales(lista) {
    const el = document.getElementById("kpiUsuarios");
    if(el) el.textContent = lista.length;
}

// ==========================================
// GRÁFICAS
// ==========================================

function renderizarChartGlobal(totalIngresos, totalGastos) {
    const canvas = document.getElementById('chartGlobal');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartGlobalInstance) chartGlobalInstance.destroy();

    chartGlobalInstance = new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: ['Ingresos Totales', 'Gastos Totales'],
            datasets: [{
                label: 'Global ($)',
                data: [totalIngresos, totalGastos],
                backgroundColor: ['#4dff91', '#ff6b6b'],
                borderRadius: 10,
                barThickness: 60
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                title: { display: true, text: 'Flujo Total ($)', color: '#fff' }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
                x: { grid: { display: false }, ticks: { color: '#fff' } }
            }
        }
    });
}

// ==========================================
// TABLA
// ==========================================

function renderizarFilas(lista) {
    const tbody = document.getElementById("tablaUsuariosBody");
    if(!tbody) return;
    tbody.innerHTML = "";
    
    if(lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; opacity:0.6;">Sin usuarios</td></tr>`;
        return;
    }

    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

    lista.forEach(user => {
        const tr = document.createElement("tr");
        tr.id = `fila-${user.id}`; 
        
        tr.innerHTML = `
            <td>${user.nombre}</td>
            <td class="td-email" style="font-size:0.9em; opacity:0.7;">Cargando...</td>
            <td class="td-edad">--</td>
            <td>${fmt.format(user.total_ingresos || 0)}</td>
            <td class="td-planes">0</td>
            <td>
                <div style="display:flex; gap:5px;">
                    <button class="btn-ver" onclick="window.verDetalleUsuario('${user.id}')" title="Ver Estadísticas">
                        <i class='bx bx-bar-chart-alt-2'></i>
                    </button>
                    <button class="btn-eliminar" onclick="window.confirmarEliminacion('${user.id}')" title="Eliminar" style="border: 1px solid #ff5555; color: #ff5555; background: transparent; border-radius: 5px; cursor: pointer;">
                        <i class='bx bx-trash'></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarFilaTabla(user) {
    const fila = document.getElementById(`fila-${user.id}`);
    if (fila) {
        // Email
        const emailCell = fila.querySelector(".td-email");
        emailCell.textContent = user.emailReal;
        if(user.emailReal !== "Sin email") emailCell.style.color = "#fff";

        // Edad
        const edadCell = fila.querySelector(".td-edad");
        edadCell.textContent = user.edadReal > 0 ? `${user.edadReal}` : "--";
        
        // Planes
        const planesCell = fila.querySelector(".td-planes");
        planesCell.textContent = user.planesReal;
        if(user.planesReal > 0) {
            planesCell.style.color = "#4dff91";
            planesCell.style.fontWeight = "bold";
        }
    }
}

function filtrarTablaUsuarios(texto) {
    if(!texto) {
        renderizarFilas(usuariosGlobales);
        usuariosGlobales.forEach(u => actualizarFilaTabla(u)); 
        return;
    }
    const textoBajo = texto.toLowerCase();
    const filtrados = usuariosGlobales.filter(u => 
        (u.nombre && u.nombre.toLowerCase().includes(textoBajo)) || 
        (u.emailReal && u.emailReal.toLowerCase().includes(textoBajo))
    );
    renderizarFilas(filtrados);
    filtrados.forEach(u => actualizarFilaTabla(u));
}

// ==========================================
// MODAL ESTADÍSTICAS
// ==========================================

window.verDetalleUsuario = async (id) => {
    let user = usuariosGlobales.find(u => u.id === id);
    
    // Si no está hidratado, pedimos datos
    if (!user || user.emailReal === undefined) {
        try {
            const detalle = await API.obtenerDetalleUsuarioAdmin(id);
            user = { 
                ...user, 
                ...detalle,
                planesReal: detalle.planes_activos || 0,
                ingresosReal: detalle.total_ingresos || 0,
                gastosReal: detalle.total_gastos || 0,
                emailReal: detalle.email || detalle.correo || "Sin email"
            };
        } catch (e) {
            return Swal.fire("Error", "No se pudieron cargar datos", "error");
        }
    }

    document.getElementById("modalNombreUser").textContent = user.nombre;
    document.getElementById("modalCorreo").textContent = user.emailReal;
    
    const fecha = user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : "N/A";
    document.getElementById("modalFecha").textContent = fecha;

    document.getElementById("modalPlanesCount").textContent = user.planesReal;

    // Nivel de Uso
    let uso = "Bajo";
    if (user.planesReal > 0) uso = "Medio";
    if (user.planesReal >= 2 && user.ingresosReal > 1000) uso = "Alto";
    
    const usoEl = document.getElementById("modalUso");
    usoEl.textContent = uso;
    usoEl.className = uso === "Bajo" ? "text-red" : (uso === "Medio" ? "text-blue" : "text-green");

    // Promedio Ingresos
    const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
    let promedio = user.planesReal > 0 ? (user.ingresosReal / user.planesReal) : 0;
    document.getElementById("modalPromedioIngresoPlan").textContent = fmt.format(promedio);

    document.getElementById("modalUsuario").classList.add("open");
    renderizarChartUsuario(user.ingresosReal, user.gastosReal);
};

function renderizarChartUsuario(ingresos, gastos) {
    const canvas = document.getElementById('chartUsuario');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if (chartUsuarioInstance) chartUsuarioInstance.destroy();
    
    chartUsuarioInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ingresos', 'Gastos', 'Disponible'],
            datasets: [{
                data: [ingresos, gastos, Math.max(0, ingresos - gastos)],
                backgroundColor: ['#4dff91', '#ff6b6b', '#7984ff'],
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

window.confirmarEliminacion = async (id) => {
    const result = await Swal.fire({
        title: '¿Eliminar?',
        text: "Esta acción borrará al usuario.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ff5555',
        background: '#15192b', color: '#fff'
    });

    if (result.isConfirmed) {
        try {
            await API.eliminarUsuarioAdmin(id);
            Swal.fire({icon:'success', title:'Eliminado', background:'#15192b', color:'#fff', showConfirmButton:false, timer:1000});
            await cargarDatosCompletos();
        } catch (error) {
            Swal.fire({icon:'error', title:'Error', text:'El backend no permite eliminar este usuario.', background:'#15192b', color:'#fff'});
        }
    }
};