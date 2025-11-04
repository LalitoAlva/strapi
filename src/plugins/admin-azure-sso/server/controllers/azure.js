'use strict';

const { Issuer, generators } = require('openid-client');

const stateStore = new Map(); // simple store en memoria para state/nonce
const codeVerifiers = new Map();

const buildIssuerUrl = () => {
  const tenant = process.env.AZURE_TENANT_ID || 'common';
  return `https://login.microsoftonline.com/${tenant}/v2.0`;
};

module.exports = {
  async login(ctx) {
    const issuer = await Issuer.discover(buildIssuerUrl());
    const client = new issuer.Client({
      client_id: process.env.AZURE_CLIENT_ID,
      client_secret: process.env.AZURE_CLIENT_SECRET,
      redirect_uris: [process.env.AZURE_REDIRECT_URI],
      response_types: ['code'],
    });

    const state = generators.state();
    const nonce = generators.nonce();
    const code_verifier = generators.codeVerifier();
    const code_challenge = generators.codeChallenge(code_verifier);

    stateStore.set(state, { nonce, createdAt: Date.now() });
    codeVerifiers.set(state, code_verifier);

    const authorizationUrl = client.authorizationUrl({
      scope: 'openid profile email',
      response_mode: 'query',
      state,
      nonce,
      code_challenge,
      code_challenge_method: 'S256',
      // a dónde quieres ir al final (admin por defecto)
      // puedes pasar ?redirect=/strapi/admin desde la UI
      // y lo preservamos en stateStore
    });

    // guarda redirect final (si viene)
    const finalRedirect = ctx.query.redirect || `${process.env.PUBLIC_URL}/admin`;
    stateStore.set(state, { nonce, finalRedirect });

    ctx.redirect(authorizationUrl);
  },

  async callback(ctx) {
    const issuer = await Issuer.discover(buildIssuerUrl());
    const client = new issuer.Client({
      client_id: process.env.AZURE_CLIENT_ID,
      client_secret: process.env.AZURE_CLIENT_SECRET,
      redirect_uris: [process.env.AZURE_REDIRECT_URI],
      response_types: ['code'],
    });

    const { state, code } = ctx.query || {};
    const stash = state && stateStore.get(state);
    if (!stash) {
      ctx.throw(400, 'Invalid state');
    }
    const code_verifier = codeVerifiers.get(state);

    const tokenSet = await client.callback(
      process.env.AZURE_REDIRECT_URI,
      { code, state },
      { state, nonce: stash.nonce, code_verifier }
    );

    const id = tokenSet.claims();
    const email = id.email || id.preferred_username;
    if (!email) ctx.throw(400, 'Missing email in id_token');

    // filtro dominio
    const allowed = (process.env.AZURE_ALLOWED_DOMAINS || '')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.length && !allowed.some((d) => email.toLowerCase().endsWith(`@${d}`))) {
      ctx.throw(403, 'Forbidden domain');
    }

    // Busca admin::user por email
    const existing = await strapi.db.query('admin::user').findOne({ 
      where: { email },
      populate: ['roles']
    });

    let adminUser = existing;
    if (!adminUser) {
      // AUTOPROVISIONAR nuevo usuario
      // Busca rol super admin
      const superRole = await strapi.db.query('admin::role').findOne({ 
        where: { code: 'strapi-super-admin' }
      });
      if (!superRole) {
        ctx.throw(500, 'No se encontró el rol de super admin');
      }

      // Crear usuario con contraseña hasheada (requerido por Strapi)
      const crypto = require('crypto');
      const bcrypt = require('bcryptjs');
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      adminUser = await strapi.db.query('admin::user').create({
        data: {
          email,
          firstname: id.given_name || 'Azure',
          lastname: id.family_name || 'User',
          username: email.split('@')[0],
          isActive: true,
          roles: [superRole.id],
          password: hashedPassword,
        },
        populate: ['roles'],
      });
    } else if (!adminUser.isActive) {
      ctx.throw(403, 'Usuario inactivo');
    }

    // Emite JWT de admin usando el servicio de admin de Strapi
    const token = strapi.plugins.admin.services.token.createJwtToken(adminUser);

    // Determina la URL final de redirección
    const adminPath = process.env.ADMIN_PATH || '/admin';
    const publicUrl = process.env.PUBLIC_URL || '';
    const final = (stash.finalRedirect && decodeURIComponent(stash.finalRedirect)) || `${publicUrl}${adminPath}`;
    const completeUrl = `${publicUrl}/api/admin-azure-sso/azure/complete?token=${encodeURIComponent(token)}&next=${encodeURIComponent(final)}`;

    // limpia state
    stateStore.delete(state);
    codeVerifiers.delete(state);

    ctx.redirect(completeUrl);
  },

  // página que pega el token en localStorage y salta al admin
  async complete(ctx) {
    const token = ctx.query.token;
    const adminPath = process.env.ADMIN_PATH || '/admin';
    const publicUrl = process.env.PUBLIC_URL || '';
    const next = ctx.query.next || `${publicUrl}${adminPath}`;

    if (!token) {
      ctx.throw(400, 'Token no proporcionado');
    }

    ctx.set('Content-Type', 'text/html; charset=utf-8');
    ctx.body = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Iniciando sesión...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: #f6f6f9;
    }
    .message {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <div class="message">
    <h2>Iniciando sesión en Strapi...</h2>
    <p>Por favor espera...</p>
  </div>
  <script>
    (function() {
      try {
        // Clave que usa Strapi Admin v4 para el JWT
        localStorage.setItem('jwtToken', ${JSON.stringify(token)});
        // Limpiar otros tokens antiguos
        localStorage.removeItem('strapi_jwt');
        // Redirigir al panel de admin
        setTimeout(function() {
          window.location.replace(${JSON.stringify(next)});
        }, 500);
      } catch (e) {
        document.querySelector('.message').innerHTML = 
          '<h2>Error</h2><p>No se pudo guardar el token: ' + e.message + '</p>';
      }
    })();
  </script>
</body>
</html>`;
  },
};
