import CONFIG from "./config.js";

const form = document.getElementById("resetForm");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPass = document.getElementById("newPass").value;
    const confirmPass = document.getElementById("confirmPass").value;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
        Swal.fire("Error", "Token inválido", "error");
        return;
    }

    if (newPass !== confirmPass) {
        Swal.fire("Error", "Las contraseñas no coinciden", "error");
        return;
    }

    try {
        const res = await fetch(`${CONFIG.API_URL}/auth/reset`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                token: token,
                nueva_password: newPass,
                confirmar_password: confirmPass
            })
        });

        const data = await res.json();

        if (!res.ok) {
            Swal.fire("Error", data.detail || "No se pudo restablecer la contraseña", "error");
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Contraseña actualizada",
            text: "Ahora puedes iniciar sesión.",
        }).then(() => {
            window.location.href = "index.html";
        });

    } catch (error) {
        Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    }
});
