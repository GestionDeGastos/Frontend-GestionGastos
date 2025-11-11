/* ============ CARGAR DATOS DESDE LOCALSTORAGE ============ */
function obtenerTransacciones() {
  return JSON.parse(localStorage.getItem("transacciones")) || [];
}

/* ============ VARIABLES PARA GRÁFICAS ============ */
let chartBarras, chartPastel;

/* ============ FUNCIÓN PARA ACTUALIZAR GRÁFICAS ============ */
function actualizarGraficas() {
  const transacciones = obtenerTransacciones();

  // Totales
  const ingresos = transacciones
    .filter(t => t.tipo === "Ingreso")
    .reduce((a, b) => a + b.monto, 0);

  const gastos = transacciones
    .filter(t => t.tipo === "Gasto")
    .reduce((a, b) => a + b.monto, 0);

  // Categorías para la dona
  const categorias = {};
  transacciones.forEach(t => {
    if (!categorias[t.categoria]) categorias[t.categoria] = 0;
    categorias[t.categoria] += t.monto;
  });

  // ====== GRÁFICA DE BARRAS ======
  if (chartBarras) chartBarras.destroy();
  chartBarras = new Chart(document.getElementById("chartBarras"), {
    type: "bar",
    data: {
      labels: ["Ingresos", "Gastos"],
      datasets: [{
        data: [ingresos, gastos],
        backgroundColor: ["#00FFB6", "#FF6B6B"],
        borderRadius: 12
      }]
    },
    options: {
      plugins: { legend: { display: false }},
      scales: {
        y: { ticks: { color: "#ffffff" }},
        x: { ticks: { color: "#ffffff" }}
      }
    }
  });

  // ====== GRÁFICA DE PASTEL ======
  if (chartPastel) chartPastel.destroy();
  chartPastel = new Chart(document.getElementById("chartPastel"), {
    type: "doughnut",
    data: {
      labels: Object.keys(categorias),
      datasets: [{
        data: Object.values(categorias),
        backgroundColor: ["#FF7676", "#FFD876", "#76FFB3", "#76A8FF", "#CD76FF"],
        borderWidth: 2
      }]
    },
    options: {
      cutout: "55%",
      plugins: {
        legend: {
          labels: { color: "#ffffff" }
        }
      }
    }
  });
}

/* ============ EXPORTAR PDF ============ */
document.getElementById("btnExport").addEventListener("click", async () => {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const charts = document.querySelector(".charts-container");
  const canvas = await html2canvas(charts, { backgroundColor: null });
  const imgData = canvas.toDataURL("image/png");

  pdf.addImage(imgData, "PNG", 10, 10, 190, 130);
  pdf.save("Fintrack_Resumen.pdf");
});

/* ============ ESCUCHAR CAMBIOS DESDE DASHBOARD ============ */
window.addEventListener("storage", actualizarGraficas);

/* ============ INICIO ============ */
actualizarGraficas();
