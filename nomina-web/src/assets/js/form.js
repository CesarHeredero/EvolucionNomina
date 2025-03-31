// Este archivo maneja la lógica del formulario, incluyendo la recolección de datos del formulario y la validación antes de enviarlos al archivo JSON.

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('payrollForm');

    // Rellenar el campo "Año"
    const yearSelect = document.getElementById('year');
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === currentYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }

    // Rellenar el campo "Mes"
    const monthSelect = document.getElementById('month');
    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const currentMonth = new Date().getMonth(); // Índice del mes actual (0-11)
    months.forEach((month, index) => {
        const option = document.createElement('option');
        option.value = index + 1; // Meses en formato 1-12
        option.textContent = month;
        if (index === currentMonth) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Evitar el comportamiento por defecto del formulario

        // Recoger los datos del formulario
        const year = document.getElementById('year').value;
        const month = document.getElementById('month').value;
        const company = document.getElementById('company').value;
        const netMonth = parseFloat(document.getElementById('netMonth').value) || 0;
        const flexibleCompensation = parseFloat(document.getElementById('flexibleCompensation').value) || 0;
        const mileage = parseFloat(document.getElementById('mileage').value) || 0;

        // Crear el objeto de datos
        const data = {
            year,
            month,
            company,
            netMonth,
            flexibleCompensation,
            mileage,
        };

        try {
            const token = localStorage.getItem('token'); // Obtener el token del almacenamiento local
            if (!token) {
                console.log('Usuario no autenticado. Redirigiendo al login...');
                window.location.href = '../pages/login.html'; // Redirigir al login
                return;
            }

            // Enviar los datos al servidor
            const response = await fetch('http://localhost:3000/api/payroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`, // Enviar el token en el encabezado
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const result = await response.json();
                alert(result.message); // Mostrar mensaje de éxito
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`); // Mostrar mensaje de error
            }
        } catch (err) {
            console.error('Error al enviar los datos:', err);
            alert('Error al enviar los datos.'); // Mostrar mensaje de error
        }
    });
});