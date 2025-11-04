#!/bin/bash

echo "======================================"
echo "Iniciando Strapi con Azure AD SSO"
echo "======================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "Error: No se encontró package.json. Ejecuta este script desde el directorio raíz de Strapi."
    exit 1
fi

# Verificar variables de entorno
echo "1. Verificando configuración..."
./verify-azure-sso.sh
if [ $? -ne 0 ]; then
    echo "Error: La verificación de configuración falló."
    exit 1
fi

echo ""
echo "2. Instalando dependencias..."
npm install

echo ""
echo "3. Construyendo panel de administración..."
npm run build

echo ""
echo "4. Iniciando Strapi..."
echo "======================================"
echo ""
echo "URLs importantes:"
echo "  - Admin: ${PUBLIC_URL:-http://localhost:1337}/admin"
echo "  - Login SSO: ${PUBLIC_URL:-http://localhost:1337}/login.html"
echo "  - API: ${PUBLIC_URL:-http://localhost:1337}/api"
echo ""
echo "======================================"
echo ""

npm run start
