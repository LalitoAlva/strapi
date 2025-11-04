#!/bin/bash

echo "=========================================="
echo "Verificación de Configuración Azure AD SSO"
echo "=========================================="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

# Función para verificar variable de entorno
check_env_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" .env 2>/dev/null | cut -d'=' -f2-)
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}✗${NC} ${var_name}: NO CONFIGURADA"
        ((ERRORS++))
        return 1
    else
        echo -e "${GREEN}✓${NC} ${var_name}: Configurada"
        return 0
    fi
}

echo "1. Verificando archivo .env..."
echo "----------------------------"

if [ ! -f .env ]; then
    echo -e "${RED}✗ Archivo .env no encontrado!${NC}"
    exit 1
fi

# Variables requeridas
REQUIRED_VARS=(
    "AZURE_CLIENT_ID"
    "AZURE_CLIENT_SECRET"
    "AZURE_TENANT_ID"
    "AZURE_REDIRECT_URI"
    "ADMIN_JWT_SECRET"
    "PUBLIC_URL"
    "STRAPI_ADMIN_BACKEND_URL"
)

for var in "${REQUIRED_VARS[@]}"; do
    check_env_var "$var"
done

echo ""
echo "2. Verificando estructura de archivos..."
echo "----------------------------"

# Archivos del plugin
REQUIRED_FILES=(
    "src/plugins/admin-azure-sso/strapi-server.js"
    "src/plugins/admin-azure-sso/server/index.js"
    "src/plugins/admin-azure-sso/server/bootstrap.js"
    "src/plugins/admin-azure-sso/server/controllers/azure.js"
    "src/plugins/admin-azure-sso/server/routes/index.js"
    "config/plugins.js"
    "config/admin.js"
    "config/server.js"
    "config/middlewares.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} ${file}"
    else
        echo -e "${RED}✗${NC} ${file} - NO ENCONTRADO"
        ((ERRORS++))
    fi
done

echo ""
echo "3. Verificando dependencias en package.json..."
echo "----------------------------"

REQUIRED_DEPS=(
    "openid-client"
    "jsonwebtoken"
    "bcryptjs"
)

for dep in "${REQUIRED_DEPS[@]}"; do
    if grep -q "\"${dep}\"" package.json; then
        echo -e "${GREEN}✓${NC} ${dep}"
    else
        echo -e "${RED}✗${NC} ${dep} - NO ENCONTRADA"
        ((ERRORS++))
    fi
done

echo ""
echo "4. Verificando configuración de Azure AD..."
echo "----------------------------"

REDIRECT_URI=$(grep "^AZURE_REDIRECT_URI=" .env | cut -d'=' -f2-)
PUBLIC_URL=$(grep "^PUBLIC_URL=" .env | cut -d'=' -f2-)

if [[ "$REDIRECT_URI" == *"/api/admin-azure-sso/azure/callback" ]]; then
    echo -e "${GREEN}✓${NC} AZURE_REDIRECT_URI tiene el formato correcto"
else
    echo -e "${YELLOW}⚠${NC} AZURE_REDIRECT_URI debe terminar en /api/admin-azure-sso/azure/callback"
    echo "   Actual: $REDIRECT_URI"
fi

if [[ "$REDIRECT_URI" == "${PUBLIC_URL}"* ]]; then
    echo -e "${GREEN}✓${NC} AZURE_REDIRECT_URI coincide con PUBLIC_URL"
else
    echo -e "${YELLOW}⚠${NC} AZURE_REDIRECT_URI debe empezar con PUBLIC_URL"
    echo "   PUBLIC_URL: $PUBLIC_URL"
    echo "   REDIRECT_URI: $REDIRECT_URI"
fi

echo ""
echo "5. Verificando configuración del plugin..."
echo "----------------------------"

if grep -q "admin-azure-sso" config/plugins.js; then
    echo -e "${GREEN}✓${NC} Plugin habilitado en config/plugins.js"
else
    echo -e "${RED}✗${NC} Plugin NO habilitado en config/plugins.js"
    ((ERRORS++))
fi

echo ""
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Verificación completada sin errores${NC}"
    echo ""
    echo "Siguiente paso:"
    echo "1. Instala las dependencias: npm install"
    echo "2. Construye el admin: npm run build"
    echo "3. Inicia Strapi: npm run start"
    echo ""
    echo "Luego accede a: ${PUBLIC_URL}/login.html"
else
    echo -e "${RED}✗ Se encontraron $ERRORS error(es)${NC}"
    echo ""
    echo "Por favor corrige los errores antes de continuar."
fi
echo "=========================================="
