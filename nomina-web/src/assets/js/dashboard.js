document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#payrollTable tbody');
    const paginationControls = document.getElementById('paginationControls');
    const recordsPerPage = 12;
    let currentPage = 1;
    let sortedPayroll = [];

    const renderTable = (page) => {
        tableBody.innerHTML = ''; // Limpiar la tabla
        const start = (page - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const pageData = sortedPayroll.slice(start, end);

        pageData.forEach((item) => {
            const totalRowAmount = item.netMonth + item.flexibleCompensation + item.mileage;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.year}</td>
                <td>${item.month}</td>
                <td>${item.company}</td>
                <td>${item.netMonth.toFixed(2)}</td>
                <td>${item.flexibleCompensation.toFixed(2)}</td>
                <td>${item.mileage.toFixed(2)}</td>
                <td>${totalRowAmount.toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    };

    const renderPaginationControls = () => {
        paginationControls.innerHTML = ''; // Limpiar los controles de paginación
        const totalPages = Math.ceil(sortedPayroll.length / recordsPerPage);

        // Crear botón de flecha "Anterior"
        const prevButton = document.createElement('button');
        prevButton.textContent = '«';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable(currentPage);
                renderPaginationControls();
            }
        });
        paginationControls.appendChild(prevButton);

        // Calcular el rango de páginas a mostrar
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            const button = document.createElement('button');
            button.textContent = i;
            button.classList.add('pagination-button');
            if (i === currentPage) {
                button.classList.add('active');
            }
            button.addEventListener('click', () => {
                currentPage = i;
                renderTable(currentPage);
                renderPaginationControls();
            });
            paginationControls.appendChild(button);
        }

        // Crear botón de flecha "Siguiente"
        const nextButton = document.createElement('button');
        nextButton.textContent = '»';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable(currentPage);
                renderPaginationControls();
            }
        });
        paginationControls.appendChild(nextButton);
    };

    const renderChart = (data) => {
        const ctx = document.getElementById('evolutionChart').getContext('2d');

        // Crear etiquetas y datos
        const labels = data.map(item => `${item.year}-${String(item.month).padStart(2, '0')}`);
        const totals = data.map(item => item.netMonth + item.flexibleCompensation + item.mileage);

        // Asignar colores según la empresa
        const companyColors = {
            Pamicom: 'rgba(255, 99, 132, 1)',
            Devoteam: 'rgba(54, 162, 235, 1)',
            Flexicar: 'rgba(75, 192, 192, 1)',
        };

        const borderColors = data.map(item => companyColors[item.company] || 'rgba(201, 203, 207, 1)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Evolución del Total (€)',
                    data: totals,
                    borderColor: borderColors,
                    backgroundColor: 'rgba(0, 0, 0, 0)', // Sin relleno
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 2, // Grosor de los nodos igual al grosor de la línea
                    pointBackgroundColor: borderColors,
                    pointBorderColor: borderColors,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const company = data[context.dataIndex].company;
                                return `${company}: ${context.raw.toFixed(2)} €`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Tiempo (Año-Mes)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Total (€)'
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    };

    try {
        const token = localStorage.getItem('token'); // Obtener el token del almacenamiento local
        if (!token) {
            console.log('Usuario no autenticado. Redirigiendo al login...');
            window.location.href = '../pages/login.html'; // Redirigir al login
            return;
        }

        // Verificar si el usuario está autenticado
        const authResponse = await fetch('http://localhost:3000/api/authenticated', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`, // Enviar el token en el encabezado
            },
        });

        if (!authResponse.ok) {
            console.log('Usuario no autenticado. Redirigiendo al login...');
            window.location.href = '../pages/login.html'; // Redirigir al login
            return;
        }

        // Obtener los datos del servidor
        const response = await fetch('http://localhost:3000/api/payroll', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`, // Enviar el token en el encabezado
            },
        });

        if (!response.ok) {
            throw new Error(`Error al obtener los datos: ${response.statusText}`);
        }

        const data = await response.json();

        // Ordenar los datos por año (ascendente) y mes (ascendente)
        sortedPayroll = data.payroll.sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year; // Ordenar por año ascendente
            }
            return a.month - b.month; // Ordenar por mes ascendente
        }).reverse(); // Invertir el orden para la tabla

        // Renderizar la tabla y los controles de paginación
        renderTable(currentPage);
        renderPaginationControls();

        // Renderizar la gráfica (mantener el orden original)
        renderChart(data.payroll.sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year; // Ordenar por año ascendente
            }
            return a.month - b.month; // Ordenar por mes ascendente
        }));
    } catch (error) {
        console.error('Error al cargar los datos:', error);
        tableBody.innerHTML = '<tr><td colspan="7">Error al cargar los datos</td></tr>';
    }
});
