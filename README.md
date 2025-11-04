1️⃣ Clonar el repositorio
git clone https://github.com/GestionDeGastos/Frontend-GestionGastos.git
cd Frontend-GestionGastos

🧰 requirements.txt (FRONTEND)

(Solo referencia, ya que es frontend puro)

Live Server (extensión VS Code)
Figma (diseño visual)
Navegador web moderno (Chrome, Edge, Firefox)

2️⃣ Instalar Live Server

Si usas VS Code:

Instala la extensión Live Server.

Abre index.html.

Da clic derecho → “Open with Live Server”.

si da un error o no muestra configuralo segun tu navegador y que corra en el puerto utilizado.

3️⃣ Conectar con el backend

Asegúrate de que el backend esté corriendo:

http://127.0.0.1:8000


En tu archivo js/api.js, pon la URL base:

const API_URL = "http://127.0.0.1:8000/usuarios";

export async function registrarUsuario(nombre, correo, password) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, correo, password }),
  });
  return response.json();
}