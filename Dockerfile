# ================================
# Dockerfile Strapi (Node 20 Debian)
# Build de producción + runtime
# ================================

###########
# BUILDER #
###########
FROM node:20-bullseye-slim AS builder

# Evita proxies heredados y ruido de npm
ENV http_proxy="" https_proxy="" HTTP_PROXY="" HTTPS_PROXY="" no_proxy="" NO_PROXY="" \
    NODE_ENV=production \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_progress=false

# Limpia cualquier proxy previo de APT
RUN rm -f /etc/apt/apt.conf.d/*proxy* || true

# Dependencias para compilar (sharp/libvips)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates build-essential python3 make g++ libvips-dev wget \
  && rm -rf /var/lib/apt/lists/*

# Estos ARG llegan desde docker compose (para que el admin los "hornee")
ARG PUBLIC_URL
ARG ADMIN_PATH
ARG STRAPI_ADMIN_BACKEND_URL

ENV PUBLIC_URL=${PUBLIC_URL} \
    ADMIN_PATH=${ADMIN_PATH} \
    STRAPI_ADMIN_BACKEND_URL=${STRAPI_ADMIN_BACKEND_URL}

WORKDIR /opt/app

# 🔴 Importante: solo copiamos package.json (NO el lock) para resolver deps frescas
COPY package.json ./

# Diagnóstico opcional
RUN node -v && npm -v && npm config get registry && npm ping || true

# Blindaje: remover @strapi/plugin-cloud si estuviera
RUN node -e "const fs=require('fs');const p=require('./package.json');if(p.dependencies){delete p.dependencies['@strapi/plugin-cloud'];}fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

# Instalación fresca (sin lock)
RUN npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

# Copiamos el resto del proyecto
COPY . .

# Estructura esperada
RUN mkdir -p config database src public/uploads

# Compila admin + limpia caches/artefactos viejos
RUN rm -rf .cache build .strapi \
 && npm run build \
 && npm cache clean --force


############
# RUNTIME  #
############
FROM node:20-bullseye-slim AS runtime

# Sin proxies heredados
ENV http_proxy="" https_proxy="" HTTP_PROXY="" HTTPS_PROXY="" no_proxy="" NO_PROXY="" \
    NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=1337 \
    NODE_OPTIONS="--max-old-space-size=512" \
    HOME=/opt/app

# Dependencias runtime
RUN rm -f /etc/apt/apt.conf.d/*proxy* || true \
 && apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates libvips wget \
 && rm -rf /var/lib/apt/lists/*

# Repetimos los ARG/ENV para que existan también en runtime (no es estrictamente necesario,
# pero útil si quieres que Strapi lea algunas en tiempo de ejecución)
ARG PUBLIC_URL
ARG ADMIN_PATH
ARG STRAPI_ADMIN_BACKEND_URL

ENV PUBLIC_URL=${PUBLIC_URL} \
    ADMIN_PATH=${ADMIN_PATH} \
    STRAPI_ADMIN_BACKEND_URL=${STRAPI_ADMIN_BACKEND_URL}

WORKDIR /opt/app

# Traemos artefactos del builder
COPY --from=builder /opt/app/package.json ./package.json
COPY --from=builder /opt/app/node_modules ./node_modules
COPY --from=builder /opt/app/config ./config
COPY --from=builder /opt/app/database ./database
COPY --from=builder /opt/app/src ./src
COPY --from=builder /opt/app/public ./public
# El build del admin queda en ./build (lo sirve Strapi)
COPY --from=builder /opt/app/build ./build

# Permisos y usuario no-root (UID 1001 sin home global para evitar /.config)
RUN mkdir -p public/uploads logs tmp && chown -R 1001:1001 /opt/app
USER 1001

EXPOSE 1337

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/_health || exit 1

# Arranque producción
CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]
