const ctx = document.getElementById('payrollChart').getContext('2d');

fetch('../data/payroll.json')
    .then(response => response.json())
    .then(data => {
        const labels = data.map(entry => `${entry.año}-${entry.mes}`);
        const totals = data.map(entry => entry.total);

        const payrollChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Evolución del Total de Nómina',
                    data: totals,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    })
    .catch(error => console.error('Error al cargar los datos:', error));