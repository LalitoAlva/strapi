// src/admin/app.js
export default {
  config: {
    // Deshabilitar la página de login por defecto y redirigir a Azure
    auth: {
      logo: null,
    },
    // Personalizar la aplicación de admin
    locales: ['es'],
  },
  bootstrap(app) {
    console.log('Admin bootstrap loaded');
  },
};
