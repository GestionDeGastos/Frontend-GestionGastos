import { 
    obtenerDatosPerfil, 
    actualizarDatosPerfil, 
    subirFotoPerfil, 
    cerrarSesion,
    estaAutenticado 
} from './api.js';

import CONFIG from "./config.js";

// Validar sesión
if (!estaAutenticado()) {
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", async () => {

    const inputNombre = document.getElementById("nombre");
    const inputApellido = document.getElementById("apellido");
    const inputCorreo = document.getElementById("correo");
    const inputPassword = document.getElementById("password");
    const imgPerfil = document.getElementById("fotoPerfil");
    const btnGuardar = document.getElementById("btnGuardar");

    const btnCambiarFoto = document.getElementById("btnCambiarFoto");
    const inputFile = document.getElementById("fileFoto");

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", cerrarSesion);

    // =========================================
    // 1. CARGAR DATOS DEL PERFIL
    // =========================================
    try {
        const usuario = await obtenerDatosPerfil();

        inputNombre.value = usuario.nombre || "";
        inputApellido.value = usuario.apellido || "";
        inputCorreo.value = usuario.correo || "";

        const welcomeMsg = document.getElementById("welcomeMsg");
        if (welcomeMsg) welcomeMsg.textContent = `Hola, ${usuario.nombre}`;

        if (usuario.foto_perfil) {
            imgPerfil.src = `${usuario.foto_perfil}?t=${Date.now()}`;
        }
        localStorage.setItem("usuarioActivo", JSON.stringify(usuario));
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudieron cargar los datos del perfil.",
            confirmButtonColor: "#7984ff"
        });
    }

    // =========================================
    // 2. SUBIR FOTO DE PERFIL
    // =========================================
    if (btnCambiarFoto) {
        btnCambiarFoto.addEventListener("click", () => {
            inputFile.click();
        });
    }

    if (inputFile) {
        inputFile.addEventListener("change", async (e) => {
            const archivo = e.target.files[0];
            if (!archivo) return;

            try {
                const respuesta = await subirFotoPerfil(archivo);

                if (respuesta.foto_url) {
                    imgPerfil.src = `${respuesta.foto_url}?t=${Date.now()}`;
                }

                Swal.fire({
                    icon: "success",
                    title: "Foto Actualizada",
                    text: "Tu nueva foto de perfil ha sido guardada.",
                    confirmButtonColor: "#7984ff"
                });

            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Error al subir la foto.",
                    confirmButtonColor: "#7984ff"
                });
            }
        });
    }

    // =========================================
    // 3. GUARDAR CAMBIOS DEL PERFIL
    // =========================================
    if (btnGuardar) {
        btnGuardar.addEventListener("click", async () => {
            const datosAActualizar = {};

            if (inputNombre.value.trim()) datosAActualizar.nombre = inputNombre.value.trim();
            if (inputApellido.value.trim()) datosAActualizar.apellido = inputApellido.value.trim();

            if (Object.keys(datosAActualizar).length === 0) {
                Swal.fire({
                    icon: "warning",
                    title: "Sin cambios",
                    text: "No has realizado ningún cambio.",
                    confirmButtonColor: "#7984ff"
                });
                return;
            }

            try {
                await actualizarDatosPerfil(datosAActualizar);

                // A) Actualizar etiqueta "Hola, Nombre" en el header
                const welcomeMsg = document.getElementById("welcomeMsg");
                if (welcomeMsg && datosAActualizar.nombre) {
                     welcomeMsg.textContent = `Hola, ${datosAActualizar.nombre}`;
                }

                // B) Actualizar LocalStorage (para persistencia al navegar a otra página)
                const usuarioLocal = JSON.parse(localStorage.getItem("usuarioActivo")) || {};
                // Mezclamos los datos viejos con los nuevos cambios
                const usuarioActualizado = { ...usuarioLocal, ...datosAActualizar };
                localStorage.setItem("usuarioActivo", JSON.stringify(usuarioActualizado));
                

                Swal.fire({
                    icon: "success",
                    title: "Perfil Actualizado",
                    text: "Tus datos han sido guardados correctamente.",
                    confirmButtonColor: "#7984ff"
                });

            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Error al actualizar.",
                    confirmButtonColor: "#7984ff"
                });
            }
        });
    }

    // =======================================================
    // 4. CAMBIAR CONTRASEÑA – MODAL COMPLETO
    // =======================================================

    const modalPassword = document.getElementById("modalPassword");
    const btnOpenPassword = document.getElementById("btnOpenPassword");
    const btnCancelPassword = document.getElementById("btnCancelPassword");
    const btnSavePassword = document.getElementById("btnSavePassword");
// Abrir modal con zIndex alto
btnOpenPassword.addEventListener("click", () => {
    modalPassword.style.display = "flex";
    modalPassword.style.zIndex = "9999999999";
});

// Cerrar modal
btnCancelPassword.addEventListener("click", () => {
    modalPassword.style.display = "none";
});

    // Abrir modal
    btnOpenPassword.addEventListener("click", () => {
        modalPassword.style.display = "flex";
    });

    // Cerrar modal
    btnCancelPassword.addEventListener("click", () => {
        modalPassword.style.display = "none";
    });

    // Guardar nueva contraseña
    btnSavePassword.addEventListener("click", async () => {
        const actual = document.getElementById("oldPassword").value.trim();
        const nueva = document.getElementById("newPassword").value.trim();
        const confirmar = document.getElementById("confirmPassword").value.trim();

        if (!actual || !nueva || !confirmar) {
            Swal.fire("Campos Vacíos", "Completa todos los campos.", "warning");
            return;
        }

        if (nueva.length < 8) {
            Swal.fire("Error", "La nueva contraseña debe tener mínimo 8 caracteres.", "error");
            return;
        }

        if (nueva !== confirmar) {
            Swal.fire("Error", "Las contraseñas no coinciden.", "error");
            return;
        }

        try {
            const resp = await fetch(`${CONFIG.API_URL}/auth/change-password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("authToken")
                },
                body: JSON.stringify({
                    actual,
                    nueva,
                    confirmar
                })
            });

            const data = await resp.json();

            // ❌ Contraseña actual incorrecta
            if (!resp.ok) {
                Swal.fire({
                    icon: "error",
                    title: "Contraseña Incorrecta",
                    text: data.detail || "La contraseña actual no coincide.",
                    confirmButtonColor: "#7984ff"
                });
                return;
            }

            // ✔ Contraseña cambiada
            Swal.fire({
                icon: "success",
                title: "Éxito",
                text: "Contraseña actualizada correctamente.",
                confirmButtonColor: "#7984ff"
            });

            modalPassword.style.display = "none";

            document.getElementById("oldPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";

        } catch (error) {
            Swal.fire("Error", "No se pudo cambiar la contraseña.", "error");
        }
    });

});
