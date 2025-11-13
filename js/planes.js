// js/planes.js

// =============================================================
//      DATOS DE PRUEBA (MOCK DATA)
// =============================================================
// Usaremos un array global para simular la base de datos.
// En un mundo real, esto vendría de localStorage o de la API.
let mockPlanes = [
  { 
    id: 1, 
    nombre: "🏝️ Vacaciones Playa", 
    tipo: "ahorro", 
    monto: 10000,
    montoActual: 7500 // Añadimos monto actual para el detalle
  },
  { 
    id: 2, 
    nombre: "🍔 Comida (Restaurantes)", 
    tipo: "presupuesto", 
    monto: 3000,
    montoActual: 2100 
  },
  { 
    id: 3, 
    nombre: "💻 Nueva Laptop", 
    tipo: "ahorro", 
    monto: 25000,
    montoActual: 25000
  },
];


// =============================================================
//      LÓGICA DEL HEADER (Bienvenida y Logout)
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

  // =============================================================
  //      LÓGICA DEL MODAL "CREAR PLAN"
  // =============================================================
  
  const modal = document.getElementById("modalCrearPlan");
  const btnAbrir = document.getElementById("btnAbrirModal");
  const btnCerrar = document.getElementById("btnCerrarModal");
  const formCrearPlan = document.getElementById("formCrearPlan");

  btnAbrir.addEventListener("click", () => modal.style.display = "flex");
  btnCerrar.addEventListener("click", () => modal.style.display = "none");
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // =============================================================
  //      LÓGICA DE PLANES 
  // =============================================================

  // Cargar y renderizar los planes al iniciar
  // Simulamos carga de localStorage. Si no hay, usamos el mock.
  const planesGuardados = localStorage.getItem("todosLosPlanes");
  if (planesGuardados) {
    mockPlanes = JSON.parse(planesGuardados);
  }
  renderizarPlanes();


  // Manejar el envío del formulario (AHORA ES FUNCIONAL)
  formCrearPlan.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // 1. Obtener datos
    const nombre = document.getElementById("planNombre").value;
    const tipo = document.getElementById("planTipo").value;
    const monto = parseFloat(document.getElementById("planMonto").value);

    // 2. Crear nuevo objeto plan
    const nuevoPlan = {
      id: Date.now(), // ID único basado en el tiempo
      nombre: nombre,
      tipo: tipo,
      monto: monto,
      montoActual: 0 // Un plan nuevo empieza en 0
    };

    // 3. Añadir al array
    mockPlanes.push(nuevoPlan);
    
    // 4. Volver a renderizar la lista
    renderizarPlanes();

    // 5. Cerrar y notificar
    modal.style.display = "none";
    formCrearPlan.reset();
    Swal.fire({
      icon: 'success',
      title: 'Plan Creado',
      text: `Tu plan "${nombre}" ha sido creado.`,
      confirmButtonColor: '#7984ff',
      background: '#0f0f23',
      color: '#fff'
    });
  });

  // Delegación de eventos para botones de eliminar
  document.getElementById("planesGrid").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-plan-delete")) {
      e.preventDefault();
      const id = parseInt(e.target.dataset.id); // Obtener ID del data-attribute
      eliminarPlan(id);
    }
  });

});


function renderizarPlanes() {
  const grid = document.getElementById("planesGrid");
  const msgVacio = document.getElementById("noPlanesMsg");
  grid.innerHTML = ""; // Limpiar grid

  // Guardar en localStorage para la página de detalles
  localStorage.setItem("todosLosPlanes", JSON.stringify(mockPlanes));

  if (mockPlanes.length === 0) {
    msgVacio.style.display = "block";
    return;
  }

  msgVacio.style.display = "none";

  mockPlanes.forEach(plan => {
    // Calcular progreso
    const montoActual = plan.montoActual || 0;
    const montoTotal = plan.monto;
    let porcentaje = 0;
    if (montoTotal > 0) {
      porcentaje = (montoActual / montoTotal) * 100;
    }
    const esPresupuesto = plan.tipo === 'presupuesto';
    const claseBarra = esPresupuesto ? 'gasto' : '';

    const formatoMoneda = (monto) => (monto || 0).toLocaleString('es-MX', { style: 'currency', 'currency': 'MXN' });

    const planHTML = `
      <div class="plan-card">
        <h3>${plan.nombre}</h3>
        <p class="plan-meta">${esPresupuesto ? 'Presupuesto Mensual' : 'Meta de Ahorro'}</p>
        <div class="progreso-info">
          <span class="progreso-actual">${formatoMoneda(montoActual)}</span> / <span class="progreso-total">${formatoMoneda(montoTotal)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill ${claseBarra}" style="width: ${porcentaje}%;"></div> 
        </div>
        <div class="plan-actions">
          <a href="plan-detalle.html?id=${plan.id}" class="btn-plan-detalle">Ver Detalles (Análisis)</a>
          
          <a href="#" class="btn-plan-delete" data-id="${plan.id}">🗑️</a>
        </div>
      </div>
    `;
    grid.innerHTML += planHTML;
  });
}


function eliminarPlan(id) {
  // Confirmación
  Swal.fire({
    title: '¿Estás seguro?',
    text: "No podrás revertir esta acción.",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ff6b6b',
    cancelButtonColor: '#7984ff',
    confirmButtonText: 'Sí, ¡bórralo!',
    cancelButtonText: 'Cancelar',
    background: '#0f0f23',
    color: '#fff'
  }).then((result) => {
    if (result.isConfirmed) {
      // Filtrar el array (inmutabilidad simulada)
      mockPlanes = mockPlanes.filter(plan => plan.id !== id);
      
      // Volver a renderizar
      renderizarPlanes();

      Swal.fire({
        title: '¡Eliminado!',
        text: 'Tu plan ha sido eliminado.',
        icon: 'success',
        confirmButtonColor: '#7984ff',
        background: '#0f0f23',
        color: '#fff'
      });
    }
  });
}