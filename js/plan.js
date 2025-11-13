document.addEventListener('DOMContentLoaded', function() {
    
    // Elementos del Header (reutilizados)
    const welcomeMsg = document.getElementById('welcomeMsg');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Elementos de Pestañas
    const tabs = document.querySelectorAll('.plan-tab');
    const secciones = document.querySelectorAll('.plan-seccion');

    // Elementos del Formulario
    const form = document.getElementById('form-crear-plan');
    const checkboxAhorrar = document.getElementById('desea-ahorrar');
    const camposAhorro = document.getElementById('campos-ahorro');
    
    const listaPlanesContainer = document.getElementById('lista-planes-container');

    const modalOverlay = document.getElementById('modal-plan-exito');
    const modalCerrarBtn = document.getElementById('modal-cerrar-btn');
    const modalResumenDiv = document.getElementById('modal-resumen-plan');

    const usuarioActivo = JSON.parse(localStorage.getItem("usuarioActivo"));
    if (usuarioActivo) {
        welcomeMsg.textContent = `Hola, ${usuarioActivo.nombre}`;
    } else {
        // window.location.href = "../index.html"; 
        welcomeMsg.textContent = 'Hola, Invitado'; 
    }

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("usuarioActivo");
        localStorage.removeItem("authToken");
        Swal.fire({
            icon: 'success', title: 'Sesión cerrada',
            text: 'Has cerrado sesión exitosamente.',
            confirmButtonColor: '#7984ff', background: '#0f0f23', color: '#fff'
        });
        setTimeout(() => (window.location.href = "../index.html"), 1500);
    });

    //LÓGICA DE PESTAÑAS
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            secciones.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            const targetTab = tab.getAttribute('data-tab');
            document.getElementById(`seccion-${targetTab}`).classList.add('active');
        });
    });

    //FORMULARIO

    checkboxAhorrar.addEventListener('change', function() {
        camposAhorro.classList.toggle('hidden', !checkboxAhorrar.checked);
    });

    form.addEventListener('submit', function(e) {
        // Prevenir que la página se recargue
        e.preventDefault(); 
        
        // Recolectar datos del formulario
        const formData = new FormData(form);
        const planData = {
            id: Date.now(), // ID único para el plan
            nombre: formData.get('nombre_plan'),
            ingreso: parseFloat(formData.get('ingreso_total')),
            fechaInicio: formData.get('fecha_inicio'),
            fechaFin: formData.get('fecha_fin'),
            deseaAhorrar: formData.has('desea_ahorrar'),
            ahorroValor: parseFloat(formData.get('ahorro_valor')) || 0,
            ahorroTipo: formData.get('ahorro_tipo')
        };
        
        // Guardar el plan en localStorage
        guardarPlan(planData);
        mostrarModalExito(planData);
        renderizarPlanes();

        // Limpiar el formulario
        form.reset();
        camposAhorro.classList.add('hidden');
    });

    //LÓGICA DE VENTANA EMERGENTE

    function mostrarModalExito(plan) {
        //datos para el resumen
        let ahorroTexto = "No especificado";
        if (plan.deseaAhorrar) {
            ahorroTexto = plan.ahorroTipo === 'monto' 
                ? `$${plan.ahorroValor.toFixed(2)} (Monto Fijo)`
                : `${plan.ahorroValor}% (Porcentaje)`;
        }

        // Insertar el resumen en el HTML del modal
        modalResumenDiv.innerHTML = `
            <p><strong>Nombre:</strong> ${plan.nombre}</p>
            <p><strong>Ingreso:</strong> $${plan.ingreso.toFixed(2)}</p>
            <p><strong>Inicio:</strong> ${plan.fechaInicio}</p>
            <p><strong>Fin:</strong> ${plan.fechaFin}</p>
            <p><strong>Ahorro:</strong> ${ahorroTexto}</p>
        `;
        
        // Mostrar el modal
        modalOverlay.classList.remove('hidden');
    }

    function cerrarModal() {
        modalOverlay.classList.add('hidden');
    }

    modalCerrarBtn.addEventListener('click', cerrarModal);
    modalOverlay.addEventListener('click', function(e) {
        // Cierra el modal si se hace clic fuera del contenido
        if (e.target === modalOverlay) {
            cerrarModal();
        }
    });

    //VER PLANES

    function guardarPlan(plan) {
        //Obtener los planes existentes
        let planes = JSON.parse(localStorage.getItem('planesFinTrack')) || [];
        //Añadir el nuevo plan
        planes.push(plan);
        //Guardar el array actualizado
        localStorage.setItem('planesFinTrack', JSON.stringify(planes));
    }

    function obtenerPlanes() {
        return JSON.parse(localStorage.getItem('planesFinTrack')) || [];
    }

    function renderizarPlanes() {
        const planes = obtenerPlanes();
        
        // Limpiar la lista actual
        listaPlanesContainer.innerHTML = '';

        if (planes.length === 0) {
            listaPlanesContainer.innerHTML = '<p class="empty-state">Aún no has creado ningún plan.</p>';
            return;
        }

        // Crear una tarjeta por cada plan
        planes.forEach(plan => {
            const planCard = document.createElement('div');
            planCard.className = 'plan-card';
            // Guardamos el ID del plan en el elemento
            planCard.dataset.planId = plan.id; 
            
            planCard.innerHTML = `
                <h3>${plan.nombre}</h3>
                <p><strong>Inicio:</strong> ${plan.fechaInicio}</p>
                <p><strong>Fin:</strong> ${plan.fechaFin}</p>
                <p><strong>Ingreso Base:</strong> $${plan.ingreso.toFixed(2)}</p>
                
                <div class="plan-detalle">
                    <p><strong>Ahorro:</strong> ${plan.deseaAhorrar ? (plan.ahorroTipo === 'monto' ? `$${plan.ahorroValor.toFixed(2)}` : `${plan.ahorroValor}%`) : 'No'}</p>
                    <p><strong>ID de Plan:</strong> ${plan.id}</p>
                </div>
            `;
            
            // Añadir el listener para desplegar detalles
            planCard.addEventListener('click', function() {
                const detalle = this.querySelector('.plan-detalle');
                detalle.style.display = detalle.style.display === 'block' ? 'none' : 'block';
            });

            listaPlanesContainer.appendChild(planCard);
        });
    }
    // Renderizar los planes guardados al cargar la página
    renderizarPlanes();
});