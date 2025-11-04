'use strict';

module.exports = async ({ strapi }) => {
  // Verificar que las variables de entorno necesarias estén configuradas
  const requiredEnvVars = [
    'AZURE_CLIENT_ID',
    'AZURE_CLIENT_SECRET',
    'AZURE_TENANT_ID',
    'AZURE_REDIRECT_URI',
    'ADMIN_JWT_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    strapi.log.error(`❌ admin-azure-sso: Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`);
  } else {
    strapi.log.info('✅ admin-azure-sso plugin inicializado correctamente');
    strapi.log.info(`   - Tenant: ${process.env.AZURE_TENANT_ID}`);
    strapi.log.info(`   - Client ID: ${process.env.AZURE_CLIENT_ID}`);
    strapi.log.info(`   - Redirect URI: ${process.env.AZURE_REDIRECT_URI}`);
    strapi.log.info(`   - Dominios permitidos: ${process.env.AZURE_ALLOWED_DOMAINS || 'todos'}`);
  }
};
