function fetchPayrollData() {
    return fetch('../data/payroll.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

function savePayrollData(data) {
    return fetch('../data/payroll.json', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
    });
}

function updatePayrollEntry(updatedEntry) {
    return fetchPayrollData().then(data => {
        const index = data.findIndex(entry => entry.id === updatedEntry.id);
        if (index !== -1) {
            data[index] = updatedEntry;
            return savePayrollData(data);
        }
        throw new Error('Entry not found');
    });
}

function deletePayrollEntry(entryId) {
    return fetchPayrollData().then(data => {
        const filteredData = data.filter(entry => entry.id !== entryId);
        return savePayrollData(filteredData);
    });
}

function addPayrollEntry(newEntry) {
    return fetchPayrollData().then(data => {
        data.push(newEntry);
        return savePayrollData(data);
    });
}