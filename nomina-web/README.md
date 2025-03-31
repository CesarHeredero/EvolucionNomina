# Proyecto Nómina Web

Este proyecto es una aplicación web para gestionar y visualizar la evolución de la nómina. Permite a los usuarios ingresar datos relacionados con su nómina y ver gráficos que representan la evolución de los totales a lo largo del tiempo.

## Estructura del Proyecto

```
nomina-web
├── src
│   ├── assets
│   │   ├── css
│   │   │   └── styles.css         # Estilos CSS para la aplicación
│   │   └── js
│   │       ├── form.js            # Lógica del formulario
│   │       ├── chart.js           # Generación de gráficos
│   │       └── dataHandler.js      # Manejo de datos en JSON
│   ├── data
│   │   └── payroll.json           # Almacenamiento de datos de nómina
│   ├── pages
│   │   ├── form.html              # Página del formulario
│   │   └── dashboard.html         # Página del dashboard
│   └── index.html                 # Punto de entrada de la aplicación
└── README.md                      # Documentación del proyecto
```

## Instalación

1. Clona este repositorio en tu máquina local.
2. Abre el archivo `index.html` en tu navegador para acceder a la aplicación.

## Uso

- **Formulario**: Navega a `form.html` para ingresar los datos de la nómina. Los campos requeridos son: año, mes neto, retribución flexible, kilometraje, total y empresa.
- **Dashboard**: Accede a `dashboard.html` para ver los datos ingresados y la gráfica que muestra la evolución del total de la nómina.

## Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar este proyecto, por favor abre un issue o envía un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.