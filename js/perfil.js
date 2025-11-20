import { 
    obtenerDatosPerfil, 
    actualizarDatosPerfil, 
    subirFotoPerfil, 
    cerrarSesion,
    estaAutenticado 
} from './api.js';

// Validar sesión al inicio
if (!estaAutenticado()) {
    window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Cargando módulo de Perfil...");

    // Referencias al DOM
    const inputNombre = document.getElementById("nombre");
    const inputApellido = document.getElementById("apellido");
    const inputCorreo = document.getElementById("correo");
    const inputPassword = document.getElementById("password");
    const imgPerfil = document.getElementById("fotoPerfil");
    const btnGuardar = document.getElementById("btnGuardar");
    
    // Manejo de Foto
    const btnCambiarFoto = document.getElementById("btnCambiarFoto");
    const inputFile = document.getElementById("fileFoto");

    // Manejo de Logout
    const logoutBtn = document.getElementById("logoutBtn");
    if(logoutBtn) logoutBtn.addEventListener("click", cerrarSesion);

    // =========================================
    // 1. CARGAR DATOS INICIALES
    // =========================================
    try {
        const usuario = await obtenerDatosPerfil();
        console.log("Datos recibidos del backend:", usuario); // Para depurar
        
        // Rellenar campos de texto
        inputNombre.value = usuario.nombre || "";
        inputApellido.value = usuario.apellido || "";
        inputCorreo.value = usuario.correo || ""; 
        
        // Actualizar saludo
        const welcomeMsg = document.getElementById("welcomeMsg");
        if(welcomeMsg) welcomeMsg.textContent = `Hola, ${usuario.nombre}`;

        // --- CORRECCIÓN AQUÍ ---
        // El backend envía 'foto_perfil', no 'foto_url' al cargar
        if (usuario.foto_perfil) {
            imgPerfil.src = `${usuario.foto_perfil}?t=${new Date().getTime()}`;
        }

    } catch (error) {
        alert("No se pudieron cargar los datos del perfil.");
        console.error(error);
    }

    // =========================================
    // 2. SUBIR FOTO
    // =========================================
    if(btnCambiarFoto) {
        btnCambiarFoto.addEventListener("click", () => {
            inputFile.click(); 
        });
    }

    if(inputFile) {
        inputFile.addEventListener("change", async (e) => {
            const archivo = e.target.files[0];
            if (!archivo) return;

            try {
                document.body.style.cursor = "wait";
                
                const respuesta = await subirFotoPerfil(archivo);
                
                // NOTA: El endpoint de SUBIDA (POST) sí devuelve 'foto_url'
                // El endpoint de LECTURA (GET) devuelve 'foto_perfil'
                if (respuesta.foto_url) {
                    imgPerfil.src = `${respuesta.foto_url}?t=${new Date().getTime()}`;
                }
                
                alert("✅ Foto actualizada correctamente");

            } catch (error) {
                alert("❌ Error al subir la foto: " + error.message);
            } finally {
                document.body.style.cursor = "default";
            }
        });
    }

    // =========================================
    // 3. GUARDAR CAMBIOS (TEXTO)
    // =========================================
    if(btnGuardar) {
        btnGuardar.addEventListener("click", async () => {
            const datosAActualizar = {};

            // Solo enviamos lo que tenga valor y sea distinto de vacío
            if (inputNombre.value.trim()) datosAActualizar.nombre = inputNombre.value.trim();
            if (inputApellido.value.trim()) datosAActualizar.apellido = inputApellido.value.trim();
            
            // Validación extra de contraseña
            if (inputPassword.value.trim()) {
                if (inputPassword.value.length < 8) {
                    alert("⚠️ La contraseña debe tener al menos 8 caracteres.");
                    return;
                }
                datosAActualizar.password = inputPassword.value.trim();
            }

            // Evitar enviar petición vacía
            if (Object.keys(datosAActualizar).length === 0) {
                alert("⚠️ No has realizado ningún cambio.");
                return;
            }

            try {
                btnGuardar.textContent = "Guardando...";
                btnGuardar.disabled = true;

                await actualizarDatosPerfil(datosAActualizar);
                
                alert("✅ Perfil actualizado con éxito.");
                inputPassword.value = ""; // Limpiar password por seguridad
                
                // Actualizar saludo
                if (datosAActualizar.nombre) {
                    const welcomeMsg = document.getElementById("welcomeMsg");
                    if(welcomeMsg) welcomeMsg.textContent = `Hola, ${datosAActualizar.nombre}`;
                }

            } catch (error) {
                console.error(error);
                alert("❌ Error al actualizar: " + error.message);
            } finally {
                btnGuardar.textContent = "GUARDAR CAMBIOS";
                btnGuardar.disabled = false;
            }
        });
    }
});