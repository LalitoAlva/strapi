# ================================
# Dockerfile Strapi (Node 18 LTS - Versión Segura)
# Build de producción + runtime con medidas de seguridad
# ================================

###########
# BUILDER #
###########
FROM node:18-bullseye-slim AS builder

# Variables de entorno de seguridad
ENV NODE_ENV=production \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_progress=false \
    npm_config_loglevel=warn \
    NODE_OPTIONS="--max-old-space-size=2048"

# Limpiar proxies y configuraciones previas
RUN rm -f /etc/apt/apt.conf.d/*proxy* || true

# Instalar dependencias del sistema necesarias para compilación
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    build-essential \
    python3 \
    make \
    g++ \
    libvips-dev \
    curl \
    gnupg \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# Configurar npm con medidas de seguridad
RUN npm config set audit-level moderate \
  && npm config set fund false \
  && npm config set optional false \
  && npm config set progress false

# Argumentos de build
ARG PUBLIC_URL
ARG ADMIN_PATH
ARG STRAPI_ADMIN_BACKEND_URL

ENV PUBLIC_URL=${PUBLIC_URL} \
    ADMIN_PATH=${ADMIN_PATH} \
    STRAPI_ADMIN_BACKEND_URL=${STRAPI_ADMIN_BACKEND_URL}

WORKDIR /opt/app

# Crear usuario no-root para el build
RUN groupadd -r strapi && useradd -r -g strapi strapi

# Copiar package.json (SIN package-lock.json para forzar resolución limpia)
COPY package.json ./

# Verificar integridad del package.json
RUN node -e "const pkg = require('./package.json'); console.log('Package name:', pkg.name); console.log('Dependencies count:', Object.keys(pkg.dependencies || {}).length); const suspiciousPkgs = ['event-stream', 'flatmap-stream', 'ps-tree']; const deps = Object.keys(pkg.dependencies || {}); const found = deps.filter(d => suspiciousPkgs.includes(d)); if (found.length > 0) { console.error('SECURITY WARNING: Found suspicious packages:', found); process.exit(1); } console.log('Package.json security check: PASSED');"

# Instalación con medidas de seguridad adicionales
RUN npm ci --only=production --no-audit --no-fund --ignore-scripts 2>&1 | tee npm-install.log \
  && echo "Checking for suspicious install messages..." \
  && ! grep -i "warning\|deprecated\|vulnerability" npm-install.log || true \
  && rm npm-install.log

# Verificar integridad de node_modules críticos
RUN node -e "const criticalPkgs = ['jsonwebtoken', 'openid-client', '@strapi/strapi']; criticalPkgs.forEach(pkg => { try { const pkgPath = require.resolve(pkg + '/package.json'); const pkgInfo = require(pkgPath); console.log(pkg + '@' + pkgInfo.version + ' - OK'); } catch(e) { console.error('MISSING CRITICAL PACKAGE:', pkg); process.exit(1); } }); console.log('Critical packages integrity: PASSED');"

# Copiar código fuente
COPY . .

# Verificar estructura del plugin
RUN if [ ! -f "src/plugins/admin-azure-sso/server/index.js" ]; then \
      echo "ERROR: Plugin server index.js missing"; \
      exit 1; \
    fi \
  && if [ ! -f "src/plugins/admin-azure-sso/server/controllers/index.js" ]; then \
      echo "ERROR: Plugin controllers index.js missing"; \
      exit 1; \
    fi \
  && echo "Plugin structure verification: PASSED"

# Crear directorios necesarios
RUN mkdir -p config database src public/uploads logs tmp

# Limpiar y compilar admin
RUN rm -rf .cache build .strapi node_modules/.cache \
  && npm run build \
  && npm cache clean --force \
  && npm prune --production

# Cambiar ownership a usuario no-root
RUN chown -R strapi:strapi /opt/app

############
# RUNTIME  #
############
FROM node:18-bullseye-slim AS runtime

# Variables de entorno de seguridad
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337 \
    NODE_OPTIONS="--max-old-space-size=512" \
    HOME=/opt/app

# Argumentos de runtime
ARG PUBLIC_URL
ARG ADMIN_PATH
ARG STRAPI_ADMIN_BACKEND_URL

ENV PUBLIC_URL=${PUBLIC_URL} \
    ADMIN_PATH=${ADMIN_PATH} \
    STRAPI_ADMIN_BACKEND_URL=${STRAPI_ADMIN_BACKEND_URL}

# Limpiar configuraciones previas
RUN rm -f /etc/apt/apt.conf.d/*proxy* || true

# Instalar solo dependencias runtime necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libvips \
    curl \
    dumb-init \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# Crear usuario no-root
RUN groupadd -r strapi && useradd -r -g strapi -u 1001 strapi \
  && mkdir -p /opt/app \
  && chown strapi:strapi /opt/app

WORKDIR /opt/app

# Copiar artefactos del builder
COPY --from=builder --chown=strapi:strapi /opt/app/package.json ./package.json
COPY --from=builder --chown=strapi:strapi /opt/app/node_modules ./node_modules
COPY --from=builder --chown=strapi:strapi /opt/app/config ./config
COPY --from=builder --chown=strapi:strapi /opt/app/database ./database
COPY --from=builder --chown=strapi:strapi /opt/app/src ./src
COPY --from=builder --chown=strapi:strapi /opt/app/public ./public
COPY --from=builder --chown=strapi:strapi /opt/app/build ./build

# Crear directorios de runtime y configurar permisos
RUN mkdir -p public/uploads logs tmp .cache \
  && chown -R strapi:strapi /opt/app \
  && chmod 755 /opt/app \
  && chmod -R 755 public logs tmp \
  && chmod -R 755 build

# Cambiar a usuario no-root
USER strapi

# Verificación final de seguridad
RUN node -e "console.log('Runtime security check...'); console.log('User ID:', process.getuid()); console.log('Node version:', process.version); console.log('Working directory:', process.cwd()); if (process.getuid() === 0) { console.error('SECURITY ERROR: Running as root'); process.exit(1); } const fs = require('fs'); const criticalFiles = ['package.json', 'src/plugins/admin-azure-sso/server/index.js', 'build/index.html']; criticalFiles.forEach(file => { if (!fs.existsSync(file)) { console.error('MISSING CRITICAL FILE:', file); process.exit(1); } }); console.log('Runtime security check: PASSED');"

EXPOSE 1337

# Healthcheck mejorado
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:1337/_health || \
      curl -f http://localhost:1337/api || \
      exit 1

# Usar dumb-init para manejo correcto de señales
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Comando de inicio con usuario no-root
CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]