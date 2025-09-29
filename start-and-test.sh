#!/bin/bash

echo "🚀 Guía rápida para iniciar y probar el SSO"
echo "=============================================="

echo ""
echo "1️⃣ Iniciar Docker Desktop si no está corriendo"
echo "   - Abre Docker Desktop desde Aplicaciones"
echo "   - Espera a que aparezca el ícono en la barra superior"

echo ""
echo "2️⃣ Ir al directorio del proyecto:"
echo "   cd /Users/loloman/Library/CloudStorage/SynologyDrive-SyncLoloman/Pemex/Workspaces/Pemex/docker/strapi"

echo ""
echo "3️⃣ Levantar los contenedores:"
echo "   docker-compose up -d"

echo ""
echo "4️⃣ Verificar que estén corriendo:"
echo "   docker-compose ps"

echo ""
echo "5️⃣ Ver los logs de Strapi:"
echo "   docker-compose logs -f strapi"

echo ""
echo "6️⃣ URLs para probar (¡IMPORTANTES!):"
echo "   📄 Página de login: https://vlverappd00574.pemex.pmx.com/strapi/login.html"
echo "   🔐 Login directo:    https://vlverappd00574.pemex.pmx.com/strapi/api/admin-azure-sso/azure/login"
echo "   ⚙️  Panel admin:      https://vlverappd00574.pemex.pmx.com/strapi/admin"

echo ""
echo "❌ NO uses estas URLs (son del sistema anterior):"
echo "   https://vlverappd00574.pemex.pmx.com/strapi/api/connect/microsoft"
echo "   https://vlverappd00574.pemex.pmx.com/strapi/api/auth/azure/callback"

echo ""
echo "✅ URLs correctas de nuestro plugin:"
echo "   Login:    /strapi/api/admin-azure-sso/azure/login"
echo "   Callback: /strapi/api/admin-azure-sso/azure/callback"
echo "   Complete: /strapi/api/admin-azure-sso/azure/complete"

echo ""
echo "🔍 Para verificar la configuración:"
echo "   ./verify-sso-setup.sh"

echo ""
echo "🐛 Si tienes problemas:"
echo "   1. Verificar que Docker esté corriendo"
echo "   2. Verificar que nginx esté configurado correctamente"
echo "   3. Revisar los logs: docker-compose logs -f"