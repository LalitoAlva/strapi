// config/admin.js
module.exports = ({ env }) => ({
  url: '/admin',            // NO pongas /strapi/admin aquí
  serveAdminPanel: true,
  auth: { secret: env('ADMIN_JWT_SECRET') },
  apiToken: { salt: env('API_TOKEN_SALT') },
  transfer: { token: { salt: env('TRANSFER_TOKEN_SALT') } },
});