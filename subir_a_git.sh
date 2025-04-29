#!/bin/bash

# Subir cambios del backend
echo "Subiendo cambios del backend..."
cd "$(dirname "$0")"
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/CesarHeredero/BackNomina.git
fi 

git add .
git commit -m "Actualización automática del backend"
git push origin main

# # Subir cambios del frontend
# echo "Subiendo cambios del frontend..."
# cd "$(dirname "$0")/nomina-web"
# if [ ! -d ".git" ]; then
#     git init
#     git remote add origin https://github.com/CesarHeredero/EvolucionNomina.git
# fi

# git add .
# git commit -m "Actualización automática del frontend"
# git push origin main

# echo "Subida completada para backend y frontend."

## ejecutar el script
# cd "/Users/cesarheredero/Desktop/Cesar/evolución nominas"
# chmod +x subir_a_git.sh
# ./subir_a_git.sh
