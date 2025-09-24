// config/middlewares.js
module.exports = [
  'strapi::errors',
  'strapi::security',
  { name: 'strapi::session', config: { secure: true, sameSite: 'none', httpOnly: true } },
  'strapi::cors',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::favicon',
  'strapi::public',
];