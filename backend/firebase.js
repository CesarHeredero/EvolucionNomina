const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, doc, setDoc } = require('firebase/firestore');

// Configuración de Firebase
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Funciones para interactuar con Firestore
const getPayrolls = async () => {
    try {
        const payrollCollection = collection(db, 'payrolls');
        const payrollSnapshot = await getDocs(payrollCollection);
        return payrollSnapshot.docs.map(doc => ({
            id: doc.id, // Usar el ID generado por Firebase
            ...doc.data(),
        }));
    } catch (error) {
        console.error('Error al obtener los documentos de Firestore:', error.message);
        throw new Error('Error al obtener los documentos de Firestore');
    }
};

const addPayroll = async (payroll) => {
    try {
        const payrollCollection = collection(db, 'payrolls');
        return await addDoc(payrollCollection, payroll); // Dejar que Firebase genere el ID
    } catch (error) {
        console.error('Error al añadir la nómina:', error.message);
        throw new Error('Error al añadir la nómina');
    }
};

const updatePayroll = async (id, updatedPayroll) => {
    try {
        const payrollDoc = doc(db, 'payrolls', id); // Usar el ID generado por Firebase
        await updateDoc(payrollDoc, updatedPayroll);
    } catch (error) {
        console.error('Error al actualizar el documento en Firestore:', error);
        throw error;
    }
};

const deletePayroll = async (id) => {
    try {
        const payrollDoc = doc(db, 'payrolls', id); // Usar el ID generado por Firebase
        await deleteDoc(payrollDoc);
    } catch (error) {
        console.error('Error al eliminar el documento en Firestore:', error);
        throw error;
    }
};

module.exports = { getPayrolls, addPayroll, updatePayroll, deletePayroll };
