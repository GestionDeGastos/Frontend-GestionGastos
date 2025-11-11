/* ================= CONFIG ================= */
let transacciones = JSON.parse(localStorage.getItem("transacciones")) || [];

/* ====== ELEMENTOS ====== */
const listaReciente = document.getElementById("listaReciente");
const tablaBody = document.getElementById("transactionsBody");
const totalIngresosTxt = document.getElementById("totalIngresos");
const totalGastosTxt = document.getElementById("totalGastos");
const saldoActualTxt = document.getElementById("saldoActual");
const filtroSelect = document.getElementById("tipoFiltro");

/* ====== FORMS ====== */
const formIngreso = document.getElementById("formIngreso");
const formGasto = document.getElementById("formGasto");
const tabIngresos = document.getElementById("tabIngresos");
const tabGastos = document.getElementById("tabGastos");

/* ====== CAMBIO DE TABS ====== */
tabIngresos.addEventListener("click", () => {
  tabIngresos.classList.add("active");
  tabGastos.classList.remove("active");
  formIngreso.classList.remove("hidden");
  formGasto.classList.add("hidden");
});

tabGastos.addEventListener("click", () => {
  tabGastos.classList.add("active");
  tabIngresos.classList.remove("active");
  formGasto.classList.remove("hidden");
  formIngreso.classList.add("hidden");
});

/* ====== TOAST ====== */
function mensaje(msg="Guardado ✅") {
  const t = document.createElement("div");
  t.classList.add("toast");
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}

/* ====== GUARDAR LOCAL ====== */
function guardar() {
  localStorage.setItem("transacciones", JSON.stringify(transacciones));
  localStorage.setItem("transaccionesGuardadas", JSON.stringify(transacciones));
  window.dispatchEvent(new Event("storage")); // <- actualiza gráficas al instante
}

/* ====== AGREGAR INGRESO ====== */
formIngreso.addEventListener("submit", e => {
  e.preventDefault();

  transacciones.push({
    fecha: ingresoFecha.value,
    tipo: "Ingreso",
    monto: Number(ingresoMonto.value),
    categoria: ingresoConcepto.value,
    descripcion: ingresoNombre.value
  });

  guardar();
  actualizarPantalla();
  mensaje("Ingreso registrado 💸");
});

/* ====== AGREGAR GASTO ====== */
formGasto.addEventListener("submit", e => {
  e.preventDefault();

  transacciones.push({
    fecha: gastoFecha.value,
    tipo: "Gasto",
    monto: Number(gastoMonto.value),
    categoria: gastoConcepto.value,
    descripcion: gastoNombre.value
  });

  guardar();
  actualizarPantalla();
  mensaje("Gasto registrado 📤");
});

/* ====== FILTRO ====== */
filtroSelect.addEventListener("change", actualizarPantalla);

/* ====== RESUMEN ====== */
function actualizarResumen() {
  const ingresos = transacciones.filter(t => t.tipo === "Ingreso").reduce((a,b)=>a+b.monto,0);
  const gastos = transacciones.filter(t => t.tipo === "Gasto").reduce((a,b)=>a+b.monto,0);
  const saldo = ingresos - gastos;

  totalIngresosTxt.textContent = `$${ingresos}`;
  totalGastosTxt.textContent = `$${gastos}`;
  saldoActualTxt.textContent = `$${saldo}`;

  saldoActualTxt.style.color = saldo > 0 ? "#77ff9e" : (saldo < 0 ? "#ff6b6b" : "white");
}

/* ====== TABLA ====== */
function actualizarTabla() {
  tablaBody.innerHTML = "";
  const filtro = filtroSelect.value;
  const lista = filtro === "todos" ? transacciones : transacciones.filter(t => t.tipo === filtro);

  lista.forEach(t => {
    tablaBody.innerHTML += `
      <tr>
        <td>${t.fecha}</td>
        <td class="${t.tipo === "Ingreso" ? "ingreso" : "gasto"}">${t.tipo}</td>
        <td>$${t.monto}</td>
        <td>${t.categoria}</td>
        <td>${t.descripcion}</td>
      </tr>
    `;
  });
}

/* ====== LISTA RECIENTE ====== */
function actualizarListaReciente() {
  listaReciente.innerHTML = "";

  [...transacciones].slice(-6).reverse().forEach((t, i) => {
    listaReciente.innerHTML += `
      <div class="list-item">
        <strong>${t.descripcion}</strong>
        <p>${t.categoria} — ${t.fecha}</p>
        <button class="btn-delete" data-i="${transacciones.length-1-i}">Eliminar</button>
      </div>
    `;
  });

  document.querySelectorAll(".btn-delete").forEach(btn =>{
    btn.onclick = () => {
      transacciones.splice(btn.dataset.i,1);
      guardar();
      actualizarPantalla();
      mensaje("Registro eliminado 🗑️");
    }
  });
}

/* ====== REFRESCAR TODO ====== */
function actualizarPantalla() {
  actualizarResumen();
  actualizarTabla();
  actualizarListaReciente();
}

/* ====== INICIO ====== */
actualizarPantalla();
guardar();
