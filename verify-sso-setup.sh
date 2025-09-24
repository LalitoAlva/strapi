#!/bin/bash

# Script para verificar la configuración del SSO Azure AD con Strapi
# Uso: ./verify-sso-setup.sh

echo "🔍 Verificando configuración de SSO Azure AD para Strapi..."
echo "=================================================="

# Verificar variables de entorno críticas
echo "📋 Verificando variables de entorno..."
if [ -f .env ]; then
    source .env
    
    # Variables requeridas
    required_vars=("AZURE_CLIENT_ID" "AZURE_CLIENT_SECRET" "AZURE_TENANT_ID" "AZURE_REDIRECT_URI" "PUBLIC_URL" "ADMIN_JWT_SECRET")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            echo "❌ Falta variable de entorno: $var"
        else
            echo "✅ $var configurado"
        fi
    done
else
    echo "❌ Archivo .env no encontrado"
fi

echo ""
echo "🔗 Verificando URLs de Azure AD..."

# Verificar conectividad con Azure AD
tenant_id=${AZURE_TENANT_ID:-""}
if [ ! -z "$tenant_id" ]; then
    azure_url="https://login.microsoftonline.com/${tenant_id}/v2.0/.well-known/openid_configuration"
    
    if curl -s --head "$azure_url" | head -n 1 | grep -q "200 OK"; then
        echo "✅ Conexión con Azure AD exitosa"
    else
        echo "❌ No se puede conectar con Azure AD"
    fi
else
    echo "❌ AZURE_TENANT_ID no configurado"
fi

echo ""
echo "📂 Verificando archivos del plugin..."

# Verificar archivos del plugin
plugin_files=(
    "src/plugins/admin-azure-sso/server/controllers/azure.js"
    "src/plugins/admin-azure-sso/server/routes/index.js"
    "src/plugins/admin-azure-sso/server/services/token.js"
    "src/plugins/admin-azure-sso/server/bootstrap.js"
    "src/plugins/admin-azure-sso/package.json"
)

for file in "${plugin_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file no encontrado"
    fi
done

echo ""
echo "⚙️ Verificando configuración de Strapi..."

# Verificar archivos de configuración
config_files=("config/plugins.js" "config/admin.js" "config/server.js" "config/database.js")

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file no encontrado"
    fi
done

echo ""
echo "🌐 Verificando archivos públicos..."

# Verificar archivos públicos
public_files=("public/login.html" "public/sso-complete.html" "public/sso-complete.js")

for file in "${public_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file no encontrado"
    fi
done

echo ""
echo "🐳 Verificando configuración de Docker..."

if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml existe"
    
    # Verificar puerto mapeado
    if grep -q "1338:1337" docker-compose.yml; then
        echo "✅ Puerto 1338:1337 configurado correctamente"
    else
        echo "❌ Puerto no configurado correctamente"
    fi
else
    echo "❌ docker-compose.yml no encontrado"
fi

echo ""
echo "🔒 Verificando configuración de nginx..."

if [ -f "nginx/reverse-proxy.conf" ]; then
    echo "✅ nginx/reverse-proxy.conf existe"
    
    # Verificar configuración de proxy
    if grep -q "/strapi/" nginx/reverse-proxy.conf; then
        echo "✅ Configuración de proxy /strapi/ encontrada"
    else
        echo "❌ Configuración de proxy /strapi/ no encontrada"
    fi
else
    echo "❌ nginx/reverse-proxy.conf no encontrado"
fi

echo ""
echo "📦 Verificando dependencias..."

if [ -f "package.json" ]; then
    echo "✅ package.json existe"
    
    # Verificar dependencias críticas
    if grep -q "openid-client" package.json; then
        echo "✅ openid-client está en las dependencias"
    else
        echo "❌ openid-client no encontrado en dependencias"
    fi
    
    if grep -q "jsonwebtoken" package.json; then
        echo "✅ jsonwebtoken está en las dependencias"
    else
        echo "❌ jsonwebtoken no encontrado en dependencias"
    fi
else
    echo "❌ package.json no encontrado"
fi

echo ""
echo "🎯 URLs para probar:"
echo "=================================================="
if [ ! -z "$PUBLIC_URL" ]; then
    echo "🔐 Login page:  ${PUBLIC_URL}/login.html"
    echo "🚀 Admin panel: ${PUBLIC_URL}/admin"
    echo "🔗 SSO login:   ${PUBLIC_URL}/api/admin-azure-sso/azure/login"
else
    echo "❌ PUBLIC_URL no configurado - no se pueden mostrar URLs"
fi

echo ""
echo "✨ Verificación completada!"

# Comando para levantar los servicios
echo ""
echo "🚀 Para levantar los servicios:"
echo "docker-compose up -d"
echo ""
echo "📋 Para ver los logs:"
echo "docker-compose logs -f strapi"