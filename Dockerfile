FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
# Desactivar verificación SSL para redes corporativas
RUN apk --no-cache --allow-untrusted add ca-certificates && \
    apk update --no-cache && \
    apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    vips-dev \
    git

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Build Strapi
ENV NODE_ENV=production
RUN npm run build

EXPOSE 1337

CMD ["npm", "start"]