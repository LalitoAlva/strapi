'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/azure/login',
    handler: 'azure.login',
    config: { auth: false },
  },
  {
    method: 'GET',
    path: '/azure/callback',
    handler: 'azure.callback',
    config: { auth: false },
  },
  // página de “pegado” del token admin al localStorage
  {
    method: 'GET',
    path: '/azure/complete',
    handler: 'azure.complete',
    config: { auth: false },
  },
];
