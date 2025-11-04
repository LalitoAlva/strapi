// config/middlewares.js
module.exports = [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:', 'http:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https://login.microsoftonline.com'],
          'frame-src': ["'self'", 'https://login.microsoftonline.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  { 
    name: 'strapi::session', 
    config: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      httpOnly: true 
    } 
  },
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: ['https://vlverappd00574.pemex.pmx.com', 'https://login.microsoftonline.com'],
      credentials: true,
    },
  },
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::favicon',
  'strapi::public',
];