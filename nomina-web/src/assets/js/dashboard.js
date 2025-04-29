document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('#payrollTable tbody');
    const paginationControls = document.getElementById('paginationControls');
    const chartContainer = document.getElementById('evolutionChart');
    const payrollModal = document.getElementById('payrollModal');
    const payrollForm = document.getElementById('payrollForm');

    if (!tableBody || !paginationControls || !chartContainer || !payrollModal || !payrollForm) {
        console.error('Elementos necesarios no existen en el DOM.');
        return;
    }

    const recordsPerPage = 12;
    let currentPage = 1;
    let sortedPayroll = [];
    let chartInstance = null;

    const checkSession = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('Sesión perdida. Redirigiendo al login...');
            window.location.href = '../pages/login.html';
            return false;
        }

        try {
            const response = await fetch('https://backnomina.onrender.com/api/authenticated', { // Cambiar URL
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok || response.status === 401) {
                console.log('Token inválido o sesión expirada. Redirigiendo al login...');
                localStorage.removeItem('token');
                window.location.href = '../pages/login.html';
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error al verificar la sesión:', error);
            window.location.href = '../pages/login.html';
            return false;
        }
    };

    if (!(await checkSession())) return;

    const keepAlive = () => {
        fetch('https://backnomina.onrender.com/api/keep-alive', { // Cambiar URL
            method: 'GET',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }).catch(err => console.error('Error al mantener la sesión activa:', err));
    };

    setInterval(keepAlive, 5 * 60 * 1000);

    const fetchPayrolls = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Usuario no autenticado. Redirigiendo al login...');
                window.location.href = '../pages/login.html';
                return [];
            }

            const response = await fetch('https://backnomina.onrender.com/api/payroll', { // Cambiar URL
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error al obtener las nóminas:', errorData.error || response.statusText);
                return [];
            }

            const data = await response.json();
            if (!data || !Array.isArray(data.payrolls)) {
                console.error('El formato de los datos no es válido. Se esperaba un array en la propiedad "payrolls".');
                return [];
            }

            return data.payrolls.map(item => ({
                id: item.id, // Document ID de Firestore
                ...item,
            }));
        } catch (error) {
            console.error('Error al obtener las nóminas:', error.message);
            return [];
        }
    };

    const loadData = async () => {
        try {
            const payrolls = await fetchPayrolls();
            if (!payrolls.length) {
                tableBody.innerHTML = '<tr><td colspan="8">No hay datos disponibles</td></tr>';
                return;
            }

            sortedPayroll = payrolls.map(item => ({
                id: item.id,
                year: parseInt(item.year, 10),
                month: parseInt(item.month, 10),
                company: item.company,
                netMonth: parseFloat(item.netMonth) || 0,
                flexibleCompensation: parseFloat(item.flexibleCompensation) || 0,
                mileage: parseFloat(item.mileage) || 0,
            })).sort((a, b) => {
                if (a.year !== b.year) {
                    return b.year - a.year; // Ordenar por año descendente
                }
                return b.month - a.month; // Ordenar por mes descendente
            });

            const totalPages = Math.ceil(sortedPayroll.length / recordsPerPage);
            renderTable(currentPage);
            renderPaginationControls(totalPages);
            renderChart(sortedPayroll); // Renderizar la gráfica con los datos
        } catch (error) {
            console.error('Error al cargar los datos:', error.message);
            tableBody.innerHTML = '<tr><td colspan="8">Error al cargar los datos. Por favor, inténtalo más tarde.</td></tr>';
        }
    };

    const renderTable = (page) => {
        tableBody.innerHTML = ''; // Limpiar la tabla
        const start = (page - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const pageData = sortedPayroll.slice(start, end);

        if (pageData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="8">No hay datos disponibles</td></tr>';
            return;
        }

        pageData.forEach((item) => {
            const totalRowAmount = item.netMonth + item.flexibleCompensation + item.mileage;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="display: none;">${item.id}</td> <!-- ID oculto -->
                <td>${item.year}</td>
                <td>${item.month}</td>
                <td>${item.company}</td>
                <td>${item.netMonth.toFixed(2)}</td>
                <td>${item.flexibleCompensation.toFixed(2)}</td>
                <td>${item.mileage.toFixed(2)}</td>
                <td>${totalRowAmount.toFixed(2)}</td>
                <td>
                    <button class="edit-btn" onclick="enableRowEdit(${sortedPayroll.indexOf(item)})">✏️</button>
                    <button class="delete-btn" onclick="deleteRow(${sortedPayroll.indexOf(item)})">🗑️</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    const renderPaginationControls = (totalPages) => {
        paginationControls.innerHTML = ''; // Limpiar controles previos

        const createButton = (text, disabled, onClick) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.disabled = disabled;
            button.className = 'pagination-button';
            if (disabled) button.classList.add('disabled');
            button.addEventListener('click', onClick);
            return button;
        };

        paginationControls.appendChild(createButton('<<', currentPage === 1, () => {
            currentPage = 1;
            renderTable(currentPage);
            renderPaginationControls(totalPages);
        }));

        paginationControls.appendChild(createButton('<', currentPage === 1, () => {
            currentPage -= 1;
            renderTable(currentPage);
            renderPaginationControls(totalPages);
        }));

        for (let i = 1; i <= totalPages; i++) {
            const button = createButton(i, i === currentPage, () => {
                currentPage = i;
                renderTable(currentPage);
                renderPaginationControls(totalPages);
            });
            if (i === currentPage) button.classList.add('active');
            paginationControls.appendChild(button);
        }

        paginationControls.appendChild(createButton('>', currentPage === totalPages, () => {
            currentPage += 1;
            renderTable(currentPage);
            renderPaginationControls(totalPages);
        }));

        paginationControls.appendChild(createButton('>>', currentPage === totalPages, () => {
            currentPage = totalPages;
            renderTable(currentPage);
            renderPaginationControls(totalPages);
        }));
    };

    const renderChart = (data) => {
        const ctx = chartContainer.getContext('2d');
        if (chartInstance) {
            chartInstance.destroy(); // Destruir la gráfica anterior si existe
        }

        const sortedData = [...data].sort((a, b) => {
            if (a.year !== b.year) {
                return a.year - b.year;
            }
            return a.month - b.month;
        });

        const labels = sortedData.map(item => `${item.year}-${String(item.month).padStart(2, '0')}`);
        const totals = sortedData.map(item => item.netMonth + item.flexibleCompensation + item.mileage);

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Evolución del Total (€)',
                    data: totals,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderWidth: 2,
                    tension: 0.3,
                    pointRadius: 3,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
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

    const openModal = () => {
        const now = new Date();
        document.getElementById('year').value = now.getFullYear(); // Establecer el año actual
        document.getElementById('month').value = now.getMonth() + 1; // Establecer el mes actual (0-indexado)
        payrollModal.style.display = 'block';
    };

    const closeModal = () => {
        payrollModal.style.display = 'none';
    };

    payrollForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            id: Date.now(), // Generar un ID único basado en la marca de tiempo actual
            year: parseInt(document.getElementById('year').value, 10),
            month: parseInt(document.getElementById('month').value, 10),
            company: document.getElementById('company').value,
            netMonth: parseFloat(document.getElementById('netSalary').value) || 0,
            flexibleCompensation: parseFloat(document.getElementById('flexibleCompensation').value) || 0,
            mileage: parseFloat(document.getElementById('mileage').value) || 0,
        };

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Usuario no autenticado. Redirigiendo al login...');
                window.location.href = '../pages/login.html';
                return;
            }

            const response = await fetch('http://localhost:3000/api/payroll', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error(`Error al guardar los datos: ${response.statusText}`);
            }

            alert('Nómina añadida correctamente.');
            closeModal();
            await loadData(); // Recargar la tabla y la gráfica después de añadir la nómina
        } catch (error) {
            console.error('Error al guardar los datos:', error);
            alert('Hubo un problema al guardar los datos. Por favor, inténtalo más tarde.');
        }
    });

    const enableRowEdit = (index) => {
        const row = tableBody.children[index];
        const item = sortedPayroll[index];

        if (!row || !item) {
            console.error('No se pudo encontrar la fila o el elemento correspondiente.');
            return;
        }

        row.innerHTML = `
            <td style="display: none;">${item.id}</td> <!-- ID oculto -->
            <td><input type="number" class="edit-input" value="${item.year}" data-field="year"></td>
            <td><input type="number" class="edit-input" value="${item.month}" data-field="month"></td>
            <td><input type="text" class="edit-input" value="${item.company}" data-field="company"></td>
            <td><input type="number" class="edit-input" value="${item.netMonth}" step="0.01" data-field="netMonth"></td>
            <td><input type="number" class="edit-input" value="${item.flexibleCompensation}" step="0.01" data-field="flexibleCompensation"></td>
            <td><input type="number" class="edit-input" value="${item.mileage}" step="0.01" data-field="mileage"></td>
            <td>${(item.netMonth + item.flexibleCompensation + item.mileage).toFixed(2)}</td>
            <td>
                <button class="save-btn" onclick="saveRowEdit(${index})">💾</button>
                <button class="cancel-btn" onclick="cancelRowEdit(${index})">❌</button>
            </td>
        `;
    };

    const saveRowEdit = async (index) => {
        const row = tableBody.children[index];
        const inputs = row.querySelectorAll('.edit-input');
        const updatedItem = { ...sortedPayroll[index] };

        if (!updatedItem.id) {
            console.error('El ID del documento no está definido. No se puede guardar la edición.');
            alert('Error: No se puede guardar la edición porque falta el ID del documento.');
            return;
        }

        inputs.forEach(input => {
            const field = input.dataset.field;
            updatedItem[field] = field === 'year' || field === 'month' ? parseInt(input.value, 10) : parseFloat(input.value);
        });

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Usuario no autenticado. Redirigiendo al login...');
                window.location.href = '../pages/login.html';
                return;
            }

            const response = await fetch(`https://backnomina.onrender.com/api/payroll/${updatedItem.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(updatedItem),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error al guardar los cambios:', errorData.error || response.statusText);
                alert(`Error: ${errorData.error || 'No se pudo guardar los cambios.'}`);
                return;
            }

            alert('Cambios guardados correctamente.');
            await loadData();
        } catch (error) {
            console.error('Error al guardar los cambios:', error.message);
            alert('Hubo un problema al guardar los cambios. Por favor, inténtalo más tarde.');
        }
    };

    const cancelRowEdit = (index) => {
        // Volver a renderizar la tabla para cancelar la edición
        renderTable(currentPage);
    };

    const deleteRow = async (index) => {
        const item = sortedPayroll[index];
        if (!item || !item.id) {
            console.error('El ID del documento no está definido. No se puede eliminar.');
            alert('Error: No se puede eliminar el registro porque falta el ID del documento.');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('Usuario no autenticado. Redirigiendo al login...');
                window.location.href = '../pages/login.html';
                return;
            }

            const response = await fetch(`https://backnomina.onrender.com/api/payroll/${item.id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error al eliminar el registro:', errorData.error || response.statusText);
                alert(`Error: ${errorData.error || 'No se pudo eliminar el registro.'}`);
                return;
            }

            alert('Registro eliminado correctamente.');
            await loadData(); // Recargar la tabla después de eliminar el registro
        } catch (error) {
            console.error('Error al eliminar el registro:', error.message);
            alert('Hubo un problema al eliminar el registro. Por favor, inténtalo más tarde.');
        }
    };

    // Hacer que las funciones estén disponibles globalmente
    window.enableRowEdit = enableRowEdit;
    window.saveRowEdit = saveRowEdit;
    window.cancelRowEdit = cancelRowEdit; // Asegurarse de que esta función esté disponible globalmente
    window.deleteRow = deleteRow;

    document.querySelector('.add-payroll-btn').addEventListener('click', openModal);
    document.querySelector('.close').addEventListener('click', closeModal);

    await loadData();
});
