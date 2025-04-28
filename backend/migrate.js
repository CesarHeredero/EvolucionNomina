require('dotenv').config();
const { addPayroll } = require('./firebase');
const fs = require('fs');
const path = require('path');

// Leer el archivo payroll.json
const payrollFilePath = path.join(__dirname, 'payroll.json');
let payrollData;

try {
    payrollData = JSON.parse(fs.readFileSync(payrollFilePath, 'utf8'));
} catch (error) {
    console.error('Error al leer el archivo payroll.json:', error);
    process.exit(1);
}

const migrateData = async () => {
    try {
        if (!payrollData || !Array.isArray(payrollData.payroll)) {
            console.error('El archivo payroll.json no contiene un array válido en la propiedad "payroll".');
            process.exit(1);
        }

        for (const payroll of payrollData.payroll) {
            await addPayroll(payroll);
            console.log(`Nómina migrada: Año ${payroll.year}, Mes ${payroll.month}`);
        }
        console.log('Migración completada exitosamente.');
    } catch (error) {
        console.error('Error durante la migración:', error);
    }
};

migrateData();
