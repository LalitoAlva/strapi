(function () {
  try {
    const q = new URLSearchParams(window.location.search);
    
    // Obtener parámetros del plugin de Azure SSO
    const token = q.get("token");
    const next = q.get("next") || "/strapi/admin";
    const error = q.get("error");

    if (error) {
      document.body.textContent = "Error de SSO: " + error;
      return;
    }

    if (!token) {
      document.body.textContent = "No se recibió el token de autenticación.";
      return;
    }

    // Guarda el token JWT para Strapi Admin
    localStorage.setItem("jwtToken", token);
    // Limpia tokens antiguos
    localStorage.removeItem("strapi_jwt");

    document.body.textContent = "Redirigiendo al panel de administración...";

    // Redirige al admin de Strapi
    setTimeout(() => {
      window.location.replace(next);
    }, 1000);
  } catch (e) {
    console.error(e);
    document.body.textContent = "Error procesando el inicio de sesión: " + e.message;
  }
})();
