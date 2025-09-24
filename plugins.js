// config/plugins.js
module.exports = ({ env }) => ({
  'users-permissions': {
    config: {
      grant: {
        enabled: true,
        config: {
          defaults: {
            origin: env('PUBLIC_URL'),
            transport: 'session',
            state: true,
            callback: '/api/auth/azure/callback',
          },
          azure: {
            key: env('AZURE_CLIENT_ID'),
            secret: env('AZURE_CLIENT_SECRET'),
            tenant: env('AZURE_TENANT_ID'),
            scope: (env('AZURE_SCOPE') || 'openid profile email').split(' '),
            prompt: env('AZURE_PROMPT', 'select_account'),
          },
        },
      },
    },
  },
});