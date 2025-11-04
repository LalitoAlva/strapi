// config/admin.js
module.exports = ({ env }) => ({
  url: env('ADMIN_PATH', '/admin'),
  serveAdminPanel: true,
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
  // Importante para que funcione detrás de un proxy
  absoluteUrl: env('STRAPI_ADMIN_BACKEND_URL'),
});