'use strict';

const passport = require('passport');

module.exports = {
  async login(ctx) {
    strapi.log.info('Iniciando autenticación Azure AD OAuth');
    
    return passport.authenticate('azuread', {
      scope: ['openid', 'profile', 'email', 'User.Read'],
      session: false,
    })(ctx, ctx.next);
  },

  async callback(ctx) {
    strapi.log.info('Callback recibido de Azure AD');
    
    return passport.authenticate('azuread', { session: false }, async (err, user, info) => {
      if (err) {
        strapi.log.error('Error en autenticación:', err);
        return ctx.redirect('/admin/auth/login?error=auth_failed');
      }

      if (!user) {
        strapi.log.error('No se recibió usuario:', info);
        return ctx.redirect('/admin/auth/login?error=no_user');
      }

      try {
        // Generar JWT token para admin
        const token = strapi.admin.services.token.createJwtToken({
          id: user.id,
        });

        strapi.log.info(`Usuario autenticado exitosamente: ${user.email}`);

        // Redirigir al admin con el token
        const adminUrl = strapi.config.get('admin.url', '/admin');
        ctx.redirect(`${adminUrl}?token=${token}`);
      } catch (error) {
        strapi.log.error('Error generando token:', error);
        ctx.redirect('/admin/auth/login?error=token_failed');
      }
    })(ctx, ctx.next);
  },
};
