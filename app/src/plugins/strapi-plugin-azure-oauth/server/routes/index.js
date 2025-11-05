'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/connect/azuread',
    handler: 'auth.login',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/connect/azuread/callback',
    handler: 'auth.callback',
    config: {
      auth: false,
      policies: [],
    },
  },
];
