// config/server.js
module.exports = ({ env }) => ({
  url: env('PUBLIC_URL', 'https://vlverappd00574.pemex.pmx.com/strapi'),
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  proxy: true,
  app: { keys: (env.array('APP_KEYS') || ['dev1','dev2','dev3','dev4']) },
});