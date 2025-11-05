// URL del backend 
const API_URL = "http://127.0.0.1:8000"; 

// Variable global para almacenar todas las transacciones
let todasLasTransacciones = [];

// =============================================================
//      SECCIÓN DE CONEXIÓN REAL AL BACKEND
// =============================================================

/**
 * Obtiene los datos reales de ingresos y gastos del backend.
 * Utiliza el token guardado en localStorage.
 */
async function getFinanzasReales() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    // Si no hay token, no podemos pedir datos.
    throw new Error("No autenticado");
  }

  const headers = {
    "Authorization": `Bearer ${token}`, // Así lo espera el backend
    "Content-Type": "application/json"
  };

  try {
    // Hacemos las dos peticiones en paralelo
    const [resIngresos, resGastos] = await Promise.all([
      fetch(`${API_URL}/ingresos/`, { headers }), //
      fetch(`${API_URL}/gastos/`, { headers })   //
    ]);

    // Manejo de error de autenticación (token expirado o inválido)
    if (resIngresos.status === 401 || resGastos.status === 401) {
      throw new Error("Token expirado o inválido");
    }
    if (!resIngresos.ok || !resGastos.ok) {
      throw new Error("Error al cargar los datos del servidor");
    }

    const dataIngresos = await resIngresos.json();
    const dataGastos = await resGastos.json();

    // Combinamos los resultados en un solo array
    // 1. Mapeamos ingresos para que coincidan con la tabla
    const ingresos = dataIngresos.data.map(item => ({
      ...item,
      tipo: "Ingreso",
      categoria: item.concepto // El backend lo llama 'concepto'
    }));
    
    // 2. Mapeamos gastos para que coincidan con la tabla
    const gastos = dataGastos.data.map(item => ({
      ...item,
      tipo: "Gasto" 
      // 'categoria' ya viene bien en gastos
    }));

    // 3. Retornamos el array combinado
    return [...ingresos, ...gastos];

  } catch (error) {
    // Si el token falla, limpiamos la sesión y redirigimos
    if (error.message.includes("autenticado") || error.message.includes("Token")) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("usuarioActivo");
      window.location.href = "index.html";
    }
    // Propagamos el error para que la UI muestre "Error al cargar"
    throw error;
  }
}


// =============================================================
//      LÓGICA DEL DASHBOARD (Sin cambios, excepto una función)
// =============================================================

window.addEventListener("DOMContentLoaded", () => {
  const welcomeMsg = document.getElementById("welcomeMsg");
  const logoutBtn = document.getElementById("logoutBtn");

  // 1. Verificar autenticación
  const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));

  if (!usuarioActivo) {
    window.location.href = "index.html";
    return;
  }

  // 2. Personalizar bienvenida
  welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;

  // 3. Configurar botón de logout
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("usuarioActivo");
    localStorage.removeItem("authToken"); // ¡Importante limpiar el token!
    
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

  // 4. Configurar el listener del filtro
  document.getElementById("tipoFiltro").addEventListener("change", aplicarFiltros);

  // 5. Cargar y renderizar transacciones iniciales
  cargarTransacciones(usuarioActivo.email);
});

/**
 * Carga los datos y los muestra en la tabla
 */
async function cargarTransacciones(userEmail) {
  const transactionsBody = document.getElementById("transactionsBody");
  const noDataMsg = document.getElementById("noDataMsg");
  transactionsBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>';

  try {
    // Usamos la función real
    todasLasTransacciones = await getFinanzasReales(); 
    
    // 5. Renderizar datos iniciales (todos)
    aplicarFiltros();

  } catch (error) {
    console.error(error);
    transactionsBody.innerHTML = '';
    noDataMsg.textContent = "Error al cargar los datos. Revisa la conexión con el backend.";
    noDataMsg.style.display = "block";
    noDataMsg.style.color = "red";
  }
}

/**
 * Función central que filtra los datos y actualiza la UI
 */
function aplicarFiltros() {
  const tipoFiltro = document.getElementById("tipoFiltro").value;

  let transaccionesFiltradas = [];
  if (tipoFiltro === "todos") {
    transaccionesFiltradas = todasLasTransacciones;
  } else {
    transaccionesFiltradas = todasLasTransacciones.filter(tx => tx.tipo === tipoFiltro);
  }
  
  renderizarTabla(transaccionesFiltradas);
  calcularYMostrarResumen(transaccionesFiltradas);
}

/**
 * Renderiza la tabla
 */
function renderizarTabla(transacciones) {
  const transactionsBody = document.getElementById("transactionsBody");
  const noDataMsg = document.getElementById("noDataMsg");
  transactionsBody.innerHTML = ''; 

  if (transacciones.length === 0) {
    noDataMsg.style.display = "block";
    return;
  }

  noDataMsg.style.display = "none";
  
  // Ordenamos por fecha (más reciente primero)
  transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  transacciones.forEach(tx => {
    const tr = document.createElement('tr');
    const tipoClase = tx.tipo.toLowerCase() === 'ingreso' ? 'ingreso' : 'gasto';
    // Usamos 'monto' que es el nombre del campo en ambas tablas
    const montoFormateado = (tx.monto || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    
    tr.innerHTML = `
      <td>${tx.fecha}</td>
      <td class="${tipoClase}">${tx.tipo}</td>
      <td class="${tipoClase}">${montoFormateado}</td>
      <td>${tx.categoria}</td>
      <td>${tx.descripcion || ''}</td> 
    `;
    transactionsBody.appendChild(tr);
  });
}

/**
 * Calcula y muestra los totales
 */
function calcularYMostrarResumen(transacciones) {
  let totalIngresos = 0;
  let totalGastos = 0;

  transacciones.forEach(tx => {
    if (tx.tipo === "Ingreso") {
      totalIngresos += tx.monto;
    } else if (tx.tipo === "Gasto") {
      totalGastos += tx.monto;
    }
  });

  const saldoActual = totalIngresos - totalGastos;
  const formatoMoneda = (monto) => (monto || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  document.getElementById("totalIngresos").textContent = formatoMoneda(totalIngresos);
  document.getElementById("totalGastos").textContent = formatoMoneda(totalGastos);
  document.getElementById("saldoActual").textContent = formatoMoneda(saldoActual);
}

