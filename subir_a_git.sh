#!/bin/bash

# Subir cambios del proyecto completo
echo "Subiendo cambios del proyecto..."
cd "$(dirname "$0")"
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/CesarHeredero/EvolucionNomina.git
fi 

git add .
git commit -m "Actualización automática del proyecto"
git push origin main

# echo "Subida completada para el proyecto completo."

## ejecutar el script
# cd "/Users/cesarheredero/Desktop/Cesar/evolución nominas"
# chmod +x subir_a_git.sh
# ./subir_a_git.sh
