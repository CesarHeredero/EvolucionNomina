#!/bin/bash

# Navegar al directorio del proyecto
cd "$(dirname "$0")"

# Inicializar el repositorio Git si no está inicializado
if [ ! -d ".git" ]; then
    git init
fi

# Agregar todos los cambios al área de preparación
git add .

# Crear un commit con un mensaje predeterminado
git commit -m "Actualización automática de archivos"

# Subir los cambios al repositorio remoto
git push


## ejecutar el script
# cd "/Users/cesarheredero/Desktop/Cesar/evolución nominas"
# chmod +x subir_a_git.sh
# ./subir_a_git.sh
