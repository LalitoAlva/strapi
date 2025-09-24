// config/server.js
module.exports = ({ env }) => ({
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  proxy: true,
  app: { keys: (env.array('APP_KEYS') || ['dev1','dev2','dev3','dev4']) },
});