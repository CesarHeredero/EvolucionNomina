require('dotenv').config();
const { getPayrolls, addPayroll, updatePayroll } = require('./firebase');
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

const synchronizeData = async () => {
    try {
        if (!payrollData || !Array.isArray(payrollData.payroll)) {
            console.error('El archivo payroll.json no contiene un array válido en la propiedad "payroll".');
            process.exit(1);
        }

        // Obtener los datos existentes en Firestore
        const firestoreData = await getPayrolls();
        const firestoreMap = new Map(firestoreData.map(item => [`${item.year}-${item.month}-${item.company}`, item]));

        // Sincronizar los datos del JSON con Firestore
        for (const payroll of payrollData.payroll) {
            const key = `${payroll.year}-${payroll.month}-${payroll.company}`;
            if (firestoreMap.has(key)) {
                // Si el documento ya existe en Firestore, actualízalo
                const existingDoc = firestoreMap.get(key);
                await updatePayroll(existingDoc.id, payroll);
                console.log(`Actualizado en Firestore: Año ${payroll.year}, Mes ${payroll.month}, Empresa ${payroll.company}`);
            } else {
                // Si el documento no existe en Firestore, créalo
                const docRef = await addPayroll(payroll);
                console.log(`Añadido a Firestore: Año ${payroll.year}, Mes ${payroll.month}, Empresa ${payroll.company}, ID ${docRef.id}`);
            }
        }

        console.log('Sincronización completada exitosamente.');
    } catch (error) {
        console.error('Error durante la sincronización:', error);
    }
};

synchronizeData();
