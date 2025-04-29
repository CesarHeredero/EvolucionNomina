const checkSession = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Sesión perdida. Redirigiendo al login...');
        window.location.href = 'pages/login.html';
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

const keepAlive = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Token no encontrado. Redirigiendo al login...');
        window.location.href = 'pages/login.html';
        return;
    }

    fetch('https://backnomina.onrender.com/api/keep-alive', { // Cambiar URL
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    }).catch(err => console.error('Error al mantener la sesión activa:', err));
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!(await checkSession())) return;

    setInterval(keepAlive, 5 * 60 * 1000); // Mantener la sesión activa cada 5 minutos
});

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'pages/login.html';
}
