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
    const allowed = (process.env.AZURE_ALLOWED_DOMAIN || '')
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.length && !allowed.some((d) => email.toLowerCase().endsWith(`@${d}`))) {
      ctx.throw(403, 'Forbidden domain');
    }

    // Busca admin::user por email
    const existing = await strapi.db.query('admin::user').findOne({ where: { email } });

    let adminUser = existing;
    if (!adminUser) {
      // (opcional) AUTOPROVISIONAR
      // Busca rol super admin
      const superRole = await strapi.db.query('admin::role').findOne({ where: { code: 'strapi-super-admin' }});
      if (!superRole) ctx.throw(500, 'No admin role found');

      adminUser = await strapi.db.query('admin::user').create({
        data: {
          email,
          firstname: id.given_name || 'Azure',
          lastname: id.family_name || 'User',
          username: email,
          isActive: true,
          roles: [superRole.id],
          password: require('crypto').randomBytes(16).toString('hex'), // no se usa
        },
      });
    }

    // Emite JWT de admin
    const token = await strapi
      .plugin('admin-azure-sso')
      .service('token')
      .issueAdminJwt(adminUser);

    // Redirige a /azure/complete con ?token=...
    const final = (stash.finalRedirect && decodeURIComponent(stash.finalRedirect)) || `${process.env.PUBLIC_URL}/admin`;
    const completeUrl = `${process.env.PUBLIC_URL}/azure/complete?token=${encodeURIComponent(token)}&next=${encodeURIComponent(final)}`;

    // limpia state
    stateStore.delete(state);
    codeVerifiers.delete(state);

    ctx.redirect(completeUrl);
  },

  // página que pega el token en localStorage y salta al admin
  async complete(ctx) {
    const token = ctx.query.token;
    const next = ctx.query.next || `${process.env.PUBLIC_URL}/admin`;

    ctx.set('Content-Type', 'text/html; charset=utf-8');
    ctx.body = `<!doctype html>
<html><meta charset="utf-8">
<title>Signing in…</title>
<body>Iniciando sesión en Strapi…</body>
<script>
try {
  // **Clave que usa el Admin v4 para su JWT**
  localStorage.setItem('jwtToken', ${JSON.stringify(token)});
  // por compatibilidad, limpia otros
  localStorage.removeItem('strapi_jwt');
  // hacia el panel
  location.replace(${JSON.stringify(next)});
} catch (e) {
  document.body.textContent = 'No se pudo guardar el token en localStorage: ' + e;
}
</script>
</html>`;
  },
};
