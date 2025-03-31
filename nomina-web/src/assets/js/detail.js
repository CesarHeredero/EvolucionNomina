document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#payrollDetailTable tbody');
    const token = localStorage.getItem('token'); // Obtener el token del almacenamiento local

    if (!token) {
        console.log('Usuario no autenticado. Redirigiendo al login...');
        window.location.href = '../pages/login.html'; // Redirigir al login
        return;
    }

    // Obtener el ID de la nómina desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const payrollId = urlParams.get('id');

    if (!payrollId) {
        tableBody.innerHTML = '<tr><td colspan="7">Error: No se proporcionó un ID de nómina.</td></tr>';
        return;
    }

    try {
        // Obtener los detalles de la nómina desde el servidor
        const response = await fetch(`http://localhost:3000/api/payroll/${payrollId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`, // Enviar el token en el encabezado
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener los detalles: ${response.statusText}`);
        }

        const payroll = await response.json();

        // Renderizar los detalles de la nómina
        const totalRowAmount = payroll.netMonth + payroll.flexibleCompensation + payroll.mileage;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payroll.year}</td>
            <td>${payroll.month}</td>
            <td>${payroll.company}</td>
            <td>${payroll.netMonth.toFixed(2)}</td>
            <td>${payroll.flexibleCompensation.toFixed(2)}</td>
            <td>${payroll.mileage.toFixed(2)}</td>
            <td>${totalRowAmount.toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    } catch (error) {
        console.error('Error al cargar los detalles de la nómina:', error);
        tableBody.innerHTML = '<tr><td colspan="7">Error al cargar los detalles de la nómina.</td></tr>';
    }
});
