require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, collectionGroup } = require('firebase/firestore');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuración de Firebase
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();

// Configurar CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(express.json());

// Funciones auxiliares para Firestore
const getPayrolls = async () => {
    try {
        const payrollCollection = collection(db, 'payrolls'); // Segundo nivel
        const payrollSnapshot = await getDocs(payrollCollection);

        const payrolls = await Promise.all(
            payrollSnapshot.docs.map(async (doc) => {
                const fieldsCollection = collection(doc.ref, 'fields'); // Tercer nivel
                const fieldsSnapshot = await getDocs(fieldsCollection);

                // Asumimos que hay un único documento en el tercer nivel
                const fieldsData = fieldsSnapshot.docs.map(fieldDoc => ({
                    id: doc.id, // ID del documento del segundo nivel
                    ...fieldDoc.data(), // Datos del tercer nivel
                }));

                return fieldsData[0]; // Retornar el único documento de los campos
            })
        );

        return payrolls.filter(Boolean); // Filtrar cualquier valor nulo o indefinido
    } catch (error) {
        console.error('Error al obtener las nóminas:', error.message);
        throw new Error('Error al obtener las nóminas');
    }
};

const addPayroll = async (payroll) => {
    const payrollCollection = collection(db, 'payrolls'); // Segundo nivel
    const docRef = await addDoc(payrollCollection, {}); // Crear un documento vacío en el segundo nivel
    const fieldsCollection = collection(docRef, 'fields'); // Tercer nivel
    await addDoc(fieldsCollection, payroll); // Agregar los campos en el tercer nivel
    return docRef.id; // Retorna el ID del documento del segundo nivel
};

const updatePayroll = async (id, updatedPayroll) => {
    const payrollDoc = doc(db, 'payrolls', id); // Segundo nivel
    const fieldsCollection = collection(payrollDoc, 'fields'); // Tercer nivel
    const fieldsSnapshot = await getDocs(fieldsCollection);

    if (fieldsSnapshot.empty) {
        throw { code: 'not-found', message: 'Documento no encontrado. No se puede actualizar.' };
    }

    const fieldDoc = fieldsSnapshot.docs[0].ref; // Asumimos que hay un único documento en el tercer nivel
    await updateDoc(fieldDoc, updatedPayroll);
};

const deletePayroll = async (id) => {
    const payrollDoc = doc(db, 'payrolls', id); // Segundo nivel
    const fieldsCollection = collection(payrollDoc, 'fields'); // Tercer nivel
    const fieldsSnapshot = await getDocs(fieldsCollection);

    if (fieldsSnapshot.empty) {
        throw { code: 'not-found', message: 'Documento no encontrado. No se puede eliminar.' };
    }

    // Eliminar todos los documentos en el tercer nivel
    for (const fieldDoc of fieldsSnapshot.docs) {
        await deleteDoc(fieldDoc.ref);
    }

    // Eliminar el documento del segundo nivel
    await deleteDoc(payrollDoc);
};

// Rutas
app.get('/api/payroll', async (req, res) => {
    try {
        const payrolls = await getPayrolls();
        res.json({ payrolls });
    } catch (error) {
        console.error('Error al obtener las nóminas:', error.message);
        res.status(500).json({ error: 'Error al obtener las nóminas' });
    }
});

app.post('/api/payroll', async (req, res) => {
    try {
        const newPayroll = req.body;
        const id = await addPayroll(newPayroll);
        res.status(201).json({ id });
    } catch (error) {
        console.error('Error al añadir la nómina:', error.message);
        res.status(500).json({ error: 'Error al añadir la nómina' });
    }
});

app.put('/api/payroll/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedPayroll = req.body;

        if (!id || !updatedPayroll) {
            return res.status(400).json({ error: 'ID o datos de nómina no proporcionados' });
        }

        try {
            await updatePayroll(id, updatedPayroll);
            res.status(200).json({ message: 'Nómina actualizada correctamente' });
        } catch (error) {
            if (error.code === 'not-found') {
                console.log('Documento no encontrado. No se puede actualizar.');
                return res.status(404).json({ error: 'Documento no encontrado. No se puede actualizar.' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error al actualizar la nómina:', error.message);
        res.status(500).json({ error: 'Error al actualizar la nómina' });
    }
});

app.delete('/api/payroll/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'ID no proporcionado' });
        }

        try {
            await deletePayroll(id);
            res.status(200).json({ message: 'Nómina eliminada correctamente' });
        } catch (error) {
            if (error.code === 'not-found') {
                console.log(`Documento con ID ${id} no encontrado. No se puede eliminar.`);
                return res.status(404).json({ error: 'Documento no encontrado. No se puede eliminar.' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error al eliminar la nómina:', error.message);
        res.status(500).json({ error: 'Error al eliminar la nómina' });
    }
});

// Ruta para iniciar sesión
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const defaultUser = {
            username: 'admin',
            password: bcrypt.hashSync('1234', 10),
        };

        if (username === defaultUser.username && bcrypt.compareSync(password, defaultUser.password)) {
            const token = jwt.sign(
                { username: defaultUser.username, role: 'admin' },
                process.env.JWT_SECRET,
                { expiresIn: '2h' }
            );
            return res.json({ token });
        }

        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    } catch (error) {
        console.error('Error al iniciar sesión:', error.message);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Ruta para verificar si el token es válido
app.get('/api/authenticated', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        res.json({ user: decoded });
    } catch (error) {
        console.error('Error al verificar el token:', error.message);
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
});

// Ruta para mantener la sesión activa
app.get('/api/keep-alive', (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        res.status(200).json({ message: 'Sesión activa' });
    } catch (error) {
        console.error('Error al mantener la sesión activa:', error.message);
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});