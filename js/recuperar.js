import CONFIG from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    
    const form = document.getElementById("recuperarForm");
    const inputCorreo = document.getElementById("correoRecuperar");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const correo = inputCorreo.value.trim();

        if (!correo) {
            Swal.fire("Error", "Ingresa tu correo electrónico", "error");
            return;
        }

        try {
            const resp = await fetch(`${CONFIG.API_URL}/auth/recover`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo })
            });

            const data = await resp.json();

            if (!resp.ok) {
                Swal.fire("Error", data.message || "No se pudo procesar la solicitud", "error");
                return;
            }

            Swal.fire(
                "Correo enviado",
                "Revisa tu bandeja de entrada o spam. Te enviamos un enlace para restablecer tu contraseña.",
                "success"
            );

        } catch (err) {
            Swal.fire("Error", "No se pudo conectar con el servidor", "error");
        }
    });
});
