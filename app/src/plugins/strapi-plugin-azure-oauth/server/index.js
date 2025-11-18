'use strict';

console.log('🔵 Cargando plugin azure-oauth - server/index.js');

module.exports = {
  register: require('./register'),
  controllers: require('./controllers'),
  routes: require('./routes'),
};
