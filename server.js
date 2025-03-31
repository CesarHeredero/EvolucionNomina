const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000; // Cambiar el puerto si es necesarioss.env.PORT || 3001; // Cambiar a 3001 si 3000 está en uso
const JWT_SECRET = 'secret-key'; // Cambiar por una clave segura

// Middleware para habilitar CORS
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:5501'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin); // Permitir el origen
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
}));

// Middleware para parsear JSON
app.use(express.json());

// Usuarios simulados
const users = [
  { username: 'admin', password: '1234' },
];

// Ruta para manejar el login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  console.log('Intento de login:', username);

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    console.log('Login exitoso:', username);
    res.status(200).json({ message: 'Login exitoso', token });
  } else {
    console.log('Credenciales incorrectas:', username);
    res.status(401).json({ error: 'Credenciales incorrectas' });
  }
});

// Middleware para verificar el token JWT
const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Falta el encabezado Authorization'); // Log para depuración
    return res.status(401).json({ error: 'No autorizado' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token inválido o expirado'); // Log para depuración
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user; // Adjuntar el usuario al objeto de la solicitud
    console.log('Token válido. Usuario autenticado:', user.username); // Log para depuración
    next();
  });
};

// Ruta para verificar si el usuario está autenticado
app.get('/api/authenticated', isAuthenticated, (req, res) => {
  console.log('Usuario autenticado:', req.user.username);
  res.status(200).json({ authenticated: true });
});

// Proteger las rutas de la API
app.use('/api/payroll', isAuthenticated);

// Ruta para guardar datos en payroll.json
app.post('/api/payroll', (req, res) => {
  const newPayrollData = req.body;

  console.log('Datos recibidos:', newPayrollData);

  if (!newPayrollData || Object.keys(newPayrollData).length === 0) {
    return res.status(400).json({ error: 'El cuerpo de la solicitud está vacío o es inválido' });
  }

  const filePath = path.join(__dirname, 'nomina-web/src/data/payroll.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo:', err);
      return res.status(500).json({ error: 'Error al leer el archivo' });
    }

    let payroll = [];
    try {
      payroll = JSON.parse(data).payroll || [];
    } catch (parseErr) {
      console.error('Error al parsear el archivo:', parseErr);
      return res.status(500).json({ error: 'Error al parsear el archivo' });
    }

    payroll.push(newPayrollData);

    const updatedData = JSON.stringify({ payroll }, null, 2);
    fs.writeFile(filePath, updatedData, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Error al escribir en el archivo:', writeErr);
        return res.status(500).json({ error: 'Error al escribir en el archivo' });
      }

      res.status(200).json({ message: 'Datos guardados correctamente' });
    });
  });
});

// Ruta para obtener los datos de payroll.json
app.get('/api/payroll', (req, res) => {
  const filePath = path.join(__dirname, 'nomina-web/src/data/payroll.json');

  console.log('Solicitud GET a /api/payroll');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo:', err);
      return res.status(500).json({ error: 'Error al leer el archivo' });
    }

    try {
      const payroll = JSON.parse(data);
      console.log('Datos enviados:', payroll);
      res.status(200).json(payroll);
    } catch (parseErr) {
      console.error('Error al parsear el archivo:', parseErr);
      res.status(500).json({ error: 'Error al parsear el archivo' });
    }
  });
});

// Ruta para obtener los detalles de una nómina específica
app.get('/api/payroll/:id', isAuthenticated, (req, res) => {
  const payrollId = parseInt(req.params.id, 10);
  const filePath = path.join(__dirname, 'nomina-web/src/data/payroll.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo:', err);
      return res.status(500).json({ error: 'Error al leer el archivo' });
    }

    try {
      const payrolls = JSON.parse(data).payroll || [];
      const payroll = payrolls[payrollId];

      if (!payroll) {
        return res.status(404).json({ error: 'Nómina no encontrada' });
      }

      res.status(200).json(payroll);
    } catch (parseErr) {
      console.error('Error al parsear el archivo:', parseErr);
      res.status(500).json({ error: 'Error al parsear el archivo' });
    }
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
