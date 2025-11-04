# Strapi SIIC CMS con Azure AD SSO

Este proyecto implementa un CMS basado en Strapi con autenticación Single Sign-On (SSO) usando Azure Active Directory OAuth.

## 🛡️ Seguridad de dependencias

Las dependencias han sido fijadas a versiones específicas (sin rangos `^` o `~`) para evitar las vulnerabilidades reportadas en el ataque de malware de septiembre de 2025. Todas las dependencias utilizan versiones anteriores a esa fecha.

## 📁 Estructura del proyecto

```
strapi/
├── src/plugins/admin-azure-sso/    # Plugin SSO personalizado
│   ├── server/
│   │   ├── controllers/azure.js    # Lógica de autenticación
│   │   ├── routes/index.js         # Rutas del plugin 
│   │   ├── services/token.js       # Servicio de JWT
│   │   └── bootstrap.js            # Inicialización
│   └── package.json                # Dependencias del plugin
├── config/                         # Configuración de Strapi
├── public/                         # Archivos públicos
│   ├── login.html                  # Página de login personalizada
│   ├── sso-complete.html           # Página de finalización SSO
│   └── sso-complete.js             # Script de finalización
├── nginx/reverse-proxy.conf        # Configuración proxy inverso
├── docker-compose.yml              # Orquestación de contenedores
├── .env                            # Variables de entorno
└── AZURE_AD_SETUP.md               # Guía de configuración Azure AD
```

## 🚀 Inicio rápido

### 1. Verificar configuración
```bash
./verify-sso-setup.sh
```

### 2. Levantar servicios
```bash
docker-compose up -d
```

### 3. Ver logs
```bash
docker-compose logs -f strapi
```

## 🔐 URLs de acceso

- **Página de login**: `https://vlverappd00574.pemex.pmx.com/strapi/login.html`
- **Panel admin**: `https://vlverappd00574.pemex.pmx.com/strapi/admin`
- **Login directo SSO**: `https://vlverappd00574.pemex.pmx.com/strapi/api/admin-azure-sso/azure/login`

## ⚙️ Configuración Azure AD

### Variables de entorno requeridas:
```env
AZURE_CLIENT_ID=tu-client-id-de-azure
AZURE_CLIENT_SECRET=tu-client-secret-de-azure
AZURE_TENANT_ID=tu-tenant-id-de-azure
AZURE_REDIRECT_URI=https://tu-dominio.com/strapi/api/admin-azure-sso/azure/callback
AZURE_ALLOWED_DOMAINS=pemex.com
```

### Configuración en Azure Portal:
1. **Redirect URI**: `https://vlverappd00574.pemex.pmx.com/strapi/api/admin-azure-sso/azure/callback`
2. **Permisos API**: openid, profile, email, User.Read
3. **Tipo de cuenta**: Solo directorio organizativo (Pemex)

Ver `AZURE_AD_SETUP.md` para instrucciones detalladas.

## 🔄 Flujo de autenticación

1. Usuario accede a `/strapi/login.html`
2. Click en "Entrar con Microsoft Azure AD"
3. Redirección a Azure AD para autenticación
4. Callback a `/strapi/api/admin-azure-sso/azure/callback`
5. Validación de dominio (@pemex.com)
6. Creación/búsqueda de usuario admin en Strapi
7. Generación de JWT admin
8. Redirección a página de completado con token
9. Guardado del JWT en localStorage
10. Acceso al panel admin de Strapi

## 🌐 Configuración del proxy inverso

El proyecto utiliza nginx como proxy inverso:

- **Puerto externo**: 443 (HTTPS)
- **Puerto interno Strapi**: 1338
- **Subpath**: `/strapi/`

### Configuración de nginx:
```nginx
location /strapi/ {
    proxy_pass http://127.0.0.1:1338/;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-Prefix /strapi;
    # ... más configuración
}
```

## 👥 Gestión de usuarios

- **Acceso automático**: Usuarios con email @pemex.com
- **Rol asignado**: Super Admin (automático)
- **Aprovisionamiento**: Automático al primer login
- **Datos del usuario**: Obtenidos de Azure AD (nombre, apellido, email)

## 🛠️ Desarrollo

### Dependencias principales:
- **Strapi**: 4.25.0 (CMS)
- **openid-client**: 5.6.5 (OAuth/OIDC)
- **jsonwebtoken**: 9.0.2 (JWT)
- **postgres**: 15-alpine (Base de datos)

### Variables de entorno completas:
Ver archivo `.env` para todas las configuraciones disponibles.

### Logs útiles:
```bash
# Ver logs de Strapi
docker-compose logs -f strapi

# Ver logs de PostgreSQL
docker-compose logs -f postgres

# Ver todos los logs
docker-compose logs -f
```

## 🐛 Troubleshooting

### Problemas comunes:

1. **Error "Invalid redirect URI"**
   - Verificar configuración en Azure AD
   - Asegurar que la URI coincida exactamente

2. **Error "Forbidden domain"**
   - Verificar `AZURE_ALLOWED_DOMAINS` en .env
   - Usuario debe tener email @pemex.com

3. **Error de proxy 502**
   - Verificar que Strapi esté corriendo
   - Revisar configuración de nginx

4. **No se guarda el token**
   - Verificar JavaScript en sso-complete.js
   - Revisar localStorage del navegador

### Verificar estado:
```bash
# Estado de contenedores
docker-compose ps

# Verificar configuración
./verify-sso-setup.sh

# Probar conectividad
curl -I https://vlverappd00574.pemex.pmx.com/strapi/admin
```

## 📚 Recursos adicionales

- [Documentación de Strapi](https://docs.strapi.io/)
- [Azure AD OAuth 2.0](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [OpenID Connect](https://openid.net/connect/)

## 📝 Changelog

### v1.0.0 - Configuración inicial
- ✅ Plugin SSO Azure AD configurado
- ✅ Dependencias actualizadas por seguridad
- ✅ Proxy inverso nginx configurado
- ✅ Auto-aprovisionamiento de usuarios
- ✅ Scripts de verificación incluidos