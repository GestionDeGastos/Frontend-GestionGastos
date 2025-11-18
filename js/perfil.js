import CONFIG from "./config.js";
import { obtenerPerfilUsuario } from "./api.js";

const token = localStorage.getItem("authToken");
const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));

document.getElementById("welcomeMsg").textContent = "Hola, " + usuarioActivo.nombre;

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index.html";
});

let USER_ID = null;

window.addEventListener("DOMContentLoaded", async () => {
    if (!token) return alert("Inicia sesión de nuevo");

    try {
        const res = await fetch(`${CONFIG.API_URL}/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error();

        const user = await res.json();
        USER_ID = user.id;

        document.getElementById("correo").value = user.correo;
        document.getElementById("nombre").value = user.nombre;
        document.getElementById("apellido").value = user.apellido;

        if (user.foto_perfil)
            document.getElementById("fotoPerfil").src = user.foto_perfil;

    } catch (err) {
        alert("Error cargando tus datos");
    }
});

document.getElementById("btnCambiarFoto").addEventListener("click", () => {
    document.getElementById("fileFoto").click();
});

document.getElementById("fileFoto").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById("fotoPerfil").src = URL.createObjectURL(file);

    const formData = new FormData();
    formData.append("file", file);

    try {
        const res = await fetch(`${CONFIG.API_URL}/perfil/foto`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) throw new Error();

        usuarioActivo.foto_perfil = data;
        localStorage.setItem("usuarioActivo", JSON.stringify(usuarioActivo));

        alert("Foto actualizada ✔");

    } catch (err) {
        alert("Error al subir la foto ❌");
    }
});

document.getElementById("btnGuardar").addEventListener("click", async () => {
    if (!USER_ID) return alert("Error interno");

    const body = {
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value
    };

    const pass = document.getElementById("password").value;
    if (pass.length >= 8) body.password = pass;

    try {
        const res = await fetch(`${CONFIG.API_URL}/usuarios/${USER_ID}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) throw new Error();

        alert("Datos actualizados ✔");

    } catch (err) {
        alert("Error al guardar ❌");
    }
});
