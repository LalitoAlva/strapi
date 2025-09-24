'use strict';
const jwt = require('jsonwebtoken');

module.exports = () => ({
  issueAdminJwt(adminUser) {
    // payload mínimo para Admin (v4 funciona con id)
    const payload = { id: adminUser.id };
    const secret = process.env.ADMIN_JWT_SECRET;
    // Strapi usa HS256 por defecto en admin JWT
    return jwt.sign(payload, secret, { expiresIn: '1h', subject: String(adminUser.id) });
  },
});
