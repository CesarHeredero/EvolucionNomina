const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Sesión perdida. Redirigiendo al login...');
        window.location.href = 'pages/login.html';
        return false;
    }

    try {
        const response = await fetch('http://localhost:3000/api/authenticated', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok || response.status === 401) {
            console.log('Token inválido o sesión expirada. Redirigiendo al login...');
            localStorage.removeItem('token');
            window.location.href = 'pages/login.html';
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
        window.location.href = 'pages/login.html';
        return false;
    }
};

const handleTokenExpiration = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token no encontrado. Redirigiendo al login...');
        window.location.href = 'pages/login.html';
        return;
    }

    const tokenPayload = JSON.parse(atob(token.split('.')[1])); // Decodificar el payload del token
    const expirationTime = tokenPayload.exp * 1000; // Convertir a milisegundos
    const currentTime = Date.now();

    if (currentTime >= expirationTime) {
        console.log('El token ha expirado. Redirigiendo al login...');
        localStorage.removeItem('token');
        window.location.href = 'pages/login.html';
    } else {
        const timeUntilExpiration = expirationTime - currentTime;
        setTimeout(() => {
            console.log('El token ha expirado. Redirigiendo al login...');
            localStorage.removeItem('token');
            window.location.href = 'pages/login.html';
        }, timeUntilExpiration);
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!(await checkSession())) return;

    handleTokenExpiration(); // Configurar la lógica para manejar la expiración del token

    const keepAlive = () => {
        fetch('http://localhost:3000/api/keep-alive', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
        }).catch(err => console.error('Error al mantener la sesión activa:', err));
    };

    setInterval(keepAlive, 5 * 60 * 1000); // Mantener la sesión activa cada 5 minutos
});

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'pages/login.html';
}
