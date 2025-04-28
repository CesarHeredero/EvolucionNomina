const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc } = require('firebase/firestore');

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

// Inicializar Firestore
const db = getFirestore(firebaseApp);

// Funciones para interactuar con Firestore
const getPayrolls = async () => {
    const payrollCollection = collection(db, 'payrolls');
    const payrollSnapshot = await getDocs(payrollCollection);
    return payrollSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    }));
};

const addPayroll = async (payroll) => {
    const payrollCollection = collection(db, 'payrolls');
    return await addDoc(payrollCollection, payroll);
};

const updatePayroll = async (id, updatedPayroll) => {
    try {
        const payrollDoc = doc(db, 'payrolls', id);
        await updateDoc(payrollDoc, updatedPayroll);
    } catch (error) {
        console.error('Error al actualizar el documento en Firestore:', error);
        throw error;
    }
};

const deletePayroll = async (id) => {
    const payrollDoc = doc(db, 'payrolls', id);
    return await deleteDoc(payrollDoc);
};

module.exports = { getPayrolls, addPayroll, updatePayroll, deletePayroll };
