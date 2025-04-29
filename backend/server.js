require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Importar el paquete CORS
const { getPayrolls, addPayroll, updatePayroll, deletePayroll } = require('./firebase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');
const db = require('./firebase');

const app = express();

// Configurar CORS
app.use(cors({
    origin: '*', // Permitir solicitudes desde cualquier origen
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
}));

// Middleware
app.use(express.json());

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
        const docRef = await addPayroll(newPayroll);
        res.status(201).json({ id: docRef.id }); // Devolver el ID generado por Firebase
    } catch (error) {
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

        // Validar que los campos requeridos estén presentes
        const requiredFields = ['year', 'month', 'company', 'netMonth', 'flexibleCompensation', 'mileage'];
        for (const field of requiredFields) {
            if (!(field in updatedPayroll)) {
                return res.status(400).json({ error: `El campo ${field} es obligatorio.` });
            }
        }

        // Intentar actualizar el documento
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
                console.log('Documento no encontrado. No se puede eliminar.');
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
        // Credenciales predeterminadas
        const defaultUser = {
            username: 'admin',
            password: '1234', // Contraseña sin cifrar para este ejemplo
        };

        console.log('Intentando iniciar sesión con:', username, password);

        // Verificar credenciales
        if (username === defaultUser.username && password === defaultUser.password) {
            const token = jwt.sign(
                { username: defaultUser.username, role: 'admin' }, // Agregar un nuevo campo al payload
                process.env.JWT_SECRET, 
                { expiresIn: '2h' } // Cambiar la duración del token
            );
            console.log('Inicio de sesión exitoso. Token generado:', token);
            return res.json({ token });
        }

        console.log('Credenciales incorrectas');
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
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
        console.error('Error al verificar el token:', error);
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
        console.error('Error al mantener la sesión activa:', error);
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});