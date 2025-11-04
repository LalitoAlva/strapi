import React from 'react';

export default {
  config: {
    locales: ['es'],
    auth: {
      logo: null,
    },
  },
  bootstrap(app) {
    // Interceptar la autenticación
    console.log('Admin app bootstrap');
  },
};
