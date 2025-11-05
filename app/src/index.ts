const passport = require('koa-passport');
const AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2').Strategy;
const axios = require('axios');

console.log('🔴 Cargando Azure OAuth desde src/index.ts');

export default {
  register({ strapi }) {
    console.log('🔴 Registrando Azure OAuth...');
    
    const clientID = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const tenantID = process.env.AZURE_TENANT_ID;
    const publicUrl = process.env.PUBLIC_URL || 'http://localhost:1337';

    console.log('📋 Variables:', {
      clientID: clientID ? 'OK' : 'MISSING',
      clientSecret: clientSecret ? 'OK' : 'MISSING',
      tenantID: tenantID ? 'OK' : 'MISSING',
      publicUrl,
    });

    if (!clientID || !clientSecret || !tenantID) {
      console.log('⚠️  Azure OAuth no configurado');
      return;
    }

    const callbackURL = `${publicUrl}/api/connect/azuread/callback`;
    console.log('🔗 Callback:', callbackURL);

    // Inicializar passport
    strapi.server.app.use(passport.initialize());

    passport.use(
      'azuread',
      new AzureAdOAuth2Strategy(
        {
          clientID,
          clientSecret,
          callbackURL,
          tenant: tenantID,
        },
        async (accessToken, refreshToken, params, profile, done) => {
          try {
            console.log('🔍 Obteniendo usuario...');

            const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });

            const userInfo = response.data;
            const email = userInfo.mail || userInfo.userPrincipalName;

            console.log('✅ Usuario:', email);

            let user = await strapi.query('admin::user').findOne({
              where: { email },
            });

            if (user) {
              console.log('✅ Usuario encontrado');
              if (!user.isActive) {
                return done(null, false, { message: 'Inactivo' });
              }
              return done(null, user);
            }

            console.log('🆕 Creando usuario...');

            const superAdminRole = await strapi.query('admin::role').findOne({
              where: { code: 'strapi-super-admin' },
            });

            if (!superAdminRole) {
              return done(new Error('Super Admin role not found'), null);
            }

            user = await strapi.query('admin::user').create({
              data: {
                email,
                firstname: userInfo.givenName || 'Usuario',
                lastname: userInfo.surname || 'Azure',
                username: email,
                isActive: true,
                roles: [superAdminRole.id],
              },
            });

            console.log('✅ Usuario creado');
            return done(null, user);
          } catch (error) {
            console.log('❌ Error:', error.message);
            return done(error, null);
          }
        }
      )
    );

    console.log('✅ Passport configurado');

    strapi.server.routes([
      {
        method: 'GET',
        path: '/api/connect/azuread',
        handler: async (ctx, next) => {
          console.log('�� Login Azure');
          
          await passport.authenticate('azuread', {
            scope: ['openid', 'profile', 'email', 'User.Read'],
          })(ctx, next);
        },
        config: { auth: false },
      },
      {
        method: 'GET',
        path: '/api/connect/azuread/callback',
        handler: async (ctx, next) => {
          console.log('📨 Callback Azure');
          
          await passport.authenticate('azuread', async (err, user, info) => {
            if (err || !user) {
              console.log('❌ Auth failed:', err || info);
              return ctx.redirect('/admin/auth/login?error=auth_failed');
            }

            try {
              const token = strapi.admin.services.token.createJwtToken({ id: user.id });
              console.log('✅ Token creado para:', user.email);
              
              const adminUrl = strapi.config.get('admin.url', '/admin');
              ctx.redirect(`${adminUrl}?token=${token}`);
            } catch (error) {
              console.log('❌ Token error:', error.message);
              ctx.redirect('/admin/auth/login?error=token_failed');
            }
          })(ctx, next);
        },
        config: { auth: false },
      },
    ]);

    console.log('✅ Rutas Azure OAuth registradas');
  },

  bootstrap() {},
};
