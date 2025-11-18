'use strict';

const passport = require('passport');
const AzureAdOAuth2Strategy = require('passport-azure-ad-oauth2').Strategy;
const axios = require('axios');

module.exports = ({ strapi }) => {
  const clientID = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantID = process.env.AZURE_TENANT_ID;
  const publicUrl = process.env.PUBLIC_URL || 'http://localhost:1337';

  if (!clientID || !clientSecret || !tenantID) {
    strapi.log.warn('⚠️  Azure AD OAuth no configurado. Variables de entorno faltantes.');
    strapi.log.warn('   Se requiere: AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID');
    return;
  }

  const callbackURL = `${publicUrl}/api/azure-oauth/connect/azuread/callback`;

  strapi.log.info('�� Configurando Azure AD OAuth');
  strapi.log.info(`   Client ID: ${clientID.substring(0, 8)}...`);
  strapi.log.info(`   Tenant ID: ${tenantID.substring(0, 8)}...`);
  strapi.log.info(`   Callback URL: ${callbackURL}`);

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
          strapi.log.info('🔍 Obteniendo información del usuario de Microsoft Graph');

          // Obtener información del usuario desde Microsoft Graph
          const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const userInfo = response.data;
          const email = userInfo.mail || userInfo.userPrincipalName;

          strapi.log.info(`✅ Usuario de Azure: ${email}`);

          // Buscar usuario admin existente
          let user = await strapi.query('admin::user').findOne({
            where: { email },
          });

          if (user) {
            strapi.log.info(`✅ Usuario encontrado en Strapi: ${user.email}`);
            
            if (!user.isActive) {
              strapi.log.warn(`⚠️  Usuario ${email} está inactivo`);
              return done(null, false, { message: 'Usuario inactivo' });
            }
            
            return done(null, user);
          }

          // Si no existe, crear nuevo usuario admin
          strapi.log.info(`🆕 Creando nuevo usuario admin: ${email}`);

          // Obtener el rol de Super Admin
          const superAdminRole = await strapi.query('admin::role').findOne({
            where: { code: 'strapi-super-admin' },
          });

          if (!superAdminRole) {
            strapi.log.error('❌ No se encontró el rol de Super Admin');
            return done(new Error('Super Admin role not found'), null);
          }

          user = await strapi.query('admin::user').create({
            data: {
              email,
              firstname: userInfo.givenName || userInfo.displayName?.split(' ')[0] || 'Usuario',
              lastname: userInfo.surname || userInfo.displayName?.split(' ').slice(1).join(' ') || 'Azure',
              username: email,
              isActive: true,
              roles: [superAdminRole.id],
            },
          });

          strapi.log.info(`✅ Usuario creado exitosamente: ${user.email}`);

          return done(null, user);
        } catch (error) {
          strapi.log.error('❌ Error en autenticación Azure AD:', error.message);
          if (error.response) {
            strapi.log.error('   Response:', error.response.data);
          }
          return done(error, null);
        }
      }
    )
  );

  strapi.log.info('✅ Azure AD OAuth configurado correctamente');
};
