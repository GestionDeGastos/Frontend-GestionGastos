document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del Header (reutilizados)
    const welcomeMsg = document.getElementById('welcomeMsg');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Elementos de Pestañas
    const tabs = document.querySelectorAll('.plan-tab');
    const secciones = document.querySelectorAll('.plan-seccion');

    const ingreso = Number(document.getElementById("ingreso-total").value);
    if (ingreso <= 0 || isNaN(ingreso)) {
        Swal.fire("Ingreso inválido", "El ingreso mensual debe ser mayor a 0.", "error");
        return;
    }

    const ahorroValor = Number(document.getElementById("ahorro-valor").value);
    const ahorroTipo = document.getElementById("ahorro-tipo").value;

    if (document.getElementById("desea-ahorrar").checked) {
        if (ahorroTipo === "porcentaje" && (ahorroValor < 0 || ahorroValor > 100)) {
            Swal.fire("Porcentaje inválido", "El porcentaje debe estar entre 0 y 100.", "error");
            return;
        }

        if (ahorroTipo === "monto" && ahorroValor < 0) {
            Swal.fire("Ahorro inválido", "El monto de ahorro no puede ser negativo.", "error");
            return;
        }
    }

    // Elementos del Formulario
    const form = document.getElementById('form-crear-plan');
    const checkboxAhorrar = document.getElementById('desea-ahorrar');
    const camposAhorro = document.getElementById('campos-ahorro');
    
    const listaPlanesContainer = document.getElementById('lista-planes-container');

    const modalOverlay = document.getElementById('modal-plan-exito');
    const modalCerrarBtn = document.getElementById('modal-cerrar-btn');
    const modalResumenDiv = document.getElementById('modal-resumen-plan');

    // --- AUTENTICACIÓN ---

    // <-- Función helper para obtener el token
    const getToken = () => localStorage.getItem("authToken");
    
    // <-- Variable para guardar los endpoints de la API
    const API_URL = '/api'; // <-- Cambia esto por la URL base de tu API si es diferente

    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
    if (usuarioActivo) {
        welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;
    } else {
        // Si no hay usuario, deberíamos redirigir al login
        // window.location.href = "../index.html"; 
        welcomeMsg.textContent = 'Hola, Invitado'; 
    }

    // <-- Modificamos el logout para que sea async y llame al backend
    logoutBtn.addEventListener("click", async () => {
        try {
            // <-- Intentamos avisar al backend que cerramos sesión
            await fetch(`${API_URL}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                }
            });
        } catch (error) {
            console.error("Error al cerrar sesión en backend:", error);
        } finally {
        
            localStorage.removeItem("usuarioActivo");
            localStorage.removeItem("authToken");
            Swal.fire({
                icon: 'success', title: 'Sesión cerrada',
                text: 'Has cerrado sesión exitosamente.',
                confirmButtonColor: '#7984ff', background: '#0f0f23', color: '#fff'
            });
            setTimeout(() => (window.location.href = "../index.html"), 1500);
        }
    });

    // --- LÓGICA DE PESTAÑAS (Sin cambios) ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            secciones.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const targetTab = tab.getAttribute('data-tab');
            document.getElementById(`seccion-${targetTab}`).classList.add('active');
        });
    });

    // --- FORMULARIO ---

    checkboxAhorrar.addEventListener('change', function() {
        camposAhorro.classList.toggle('hidden', !checkboxAhorrar.checked);
    });

    
    form.addEventListener('submit', async function(e) {
        // Prevenir que la página se recargue
        e.preventDefault(); 
        
        // Recolectar datos del formulario
        const formData = new FormData(form);
        const planData = {
            // Ya no necesitamos un ID local, el backend lo generará
            // id: Date.now(), 
            nombre: formData.get('nombre_plan'),
            ingreso: parseFloat(formData.get('ingreso_total')),
            fechaInicio: formData.get('fecha_inicio'),
            fechaFin: formData.get('fecha_fin'),
            deseaAhorrar: formData.has('desea_ahorrar'),
            ahorroValor: parseFloat(formData.get('ahorro_valor')) || 0,
            ahorroTipo: formData.get('ahorro_tipo')
        };
        
        try {
            // <-- Esperamos a que el plan se guarde en el backend
            const nuevoPlan = await guardarPlan(planData); 

            // <-- Usamos el plan devuelto por el backend (que puede tener más datos, como un ID)
            mostrarModalExito(nuevoPlan); 
            
            // <-- Actualizamos la lista de planes (ahora con el nuevo plan)
            await renderizarPlanes(); // <-- Esperamos a que se renderice

            // Limpiar el formulario
            form.reset();
            camposAhorro.classList.add('hidden');

        } catch (error) {
            console.error("Error al crear el plan:", error);
            // <-- Mostrar un error al usuario si falla el guardado
            Swal.fire({
                icon: 'error', title: 'Error',
                text: `No se pudo crear el plan: ${error.message}`,
                confirmButtonColor: '#7984ff', background: '#0f0f23', color: '#fff'
            });
        }
    });

    // --- LÓGICA DE VENTANA EMERGENTE (Sin cambios) ---
    function mostrarModalExito(plan) {
        let ahorroTexto = "No especificado";
        if (plan.deseaAhorrar) {
            ahorroTexto = plan.ahorroTipo === 'monto' 
                ? `$${plan.ahorroValor.toFixed(2)} (Monto Fijo)`
                : `${plan.ahorroValor}% (Porcentaje)`;
        }
        modalResumenDiv.innerHTML = `
            <p><strong>Nombre:</strong> ${plan.nombre}</p>
            <p><strong>Ingreso:</strong> $${plan.ingreso.toFixed(2)}</p>
            <p><strong>Inicio:</strong> ${plan.fechaInicio}</p>
            <p><strong>Fin:</strong> ${plan.fechaFin}</p>
            <p><strong>Ahorro:</strong> ${ahorroTexto}</p>
        `;
        modalOverlay.classList.remove('hidden');
    }

    function cerrarModal() {
        modalOverlay.classList.add('hidden');
    }
    modalCerrarBtn.addEventListener('click', cerrarModal);
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            cerrarModal();
        }
    });

    // --- VER PLANES (Aquí están los cambios grandes) ---

    // <-- Esta función AHORA es ASYNC y hace un POST
    async function guardarPlan(plan) {
        const token = getToken();
        if (!token) {
            throw new Error("No estás autenticado.");
        }

        const response = await fetch(`${API_URL}/planes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // <-- Enviamos el token
            },
            body: JSON.stringify(plan) // <-- Enviamos el plan como JSON
        });

        if (!response.ok) {
            // <-- Si el backend da un error (ej. 400, 500)
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error del servidor');
        }
        
        return await response.json(); // <-- Devuelve el nuevo plan creado (con ID de la DB)
    }

    // <-- Esta función AHORA es ASYNC y hace un GET
    async function obtenerPlanes() {
        const token = getToken();
        if (!token) {
            // Si no hay token, no podemos pedir nada
            console.warn("No hay token, no se pueden obtener planes.");
            return []; // Devuelve un array vacío
        }

        const response = await fetch(`${API_URL}/planes`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` // <-- Enviamos el token
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token inválido o expirado
                window.location.href = "../index.html"; // Redirigir al login
            }
            throw new Error('No se pudieron obtener los planes.');
        }

        return await response.json(); // <-- Devuelve el array de planes [{}, {}, ...]
    }

    // <-- Esta función AHORA es ASYNC para poder usar 'await'
    async function renderizarPlanes() {
        let planes = []; // <-- Empezamos con un array vacío
        try {
            // <-- Pedimos los planes al backend
            planes = await obtenerPlanes(); 
        } catch (error) {
            console.error("Error al renderizar planes:", error.message);
            listaPlanesContainer.innerHTML = '<p class="empty-state">Error al cargar los planes. Intenta recargar.</p>';
            return; // <-- Salimos de la función si hay un error
        }
        
        // Limpiar la lista actual
        listaPlanesContainer.innerHTML = '';

        if (!planes || planes.length === 0) { // <-- Comprobamos si 'planes' es nulo o vacío
            listaPlanesContainer.innerHTML = '<p class="empty-state">Aún no has creado ningún plan.</p>';
            return;
        }

        // Crear una tarjeta por cada plan (esto es igual que antes)
        planes.forEach(plan => {
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            // <-- Usamos el ID del backend (usualmente _id o id)
            planCard.dataset.planId = plan.id || plan._id; 
            
            planCard.innerHTML = `
                <h3>${plan.nombre}</h3>
                <p><strong>Inicio:</strong> ${plan.fechaInicio}</p>
                <p><strong>Fin:</strong> ${plan.fechaFin}</p>
                <p><strong>Ingreso Base:</strong> $${plan.ingreso.toFixed(2)}</p>
                
                <div class="plan-detalle">
                    <p><strong>Ahorro:</strong> ${plan.deseaAhorrar ? (plan.ahorroTipo === 'monto' ? `$${plan.ahorroValor.toFixed(2)}` : `${plan.ahorroValor}%`) : 'No'}</p>
                    <p><strong>ID de Plan:</strong> ${plan.id || plan._id}</p>
                </div>
            `;
            
            planCard.addEventListener('click', function() {
                const detalle = this.querySelector('.plan-detalle');
                detalle.style.display = detalle.style.display === 'block' ? 'none' : 'block';
            });

            listaPlanesContainer.appendChild(planCard);
        });
    }

    // Renderizar los planes guardados al cargar la página
    renderizarPlanes(); // <-- Esta función ahora es async
});