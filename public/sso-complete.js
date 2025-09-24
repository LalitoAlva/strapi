(function () {
  try {
    // Une parámetros de query (?a=b) y fragment (#a=b)
    const q = new URLSearchParams(window.location.search);
    const h = new URLSearchParams(
      window.location.hash && window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash || ""
    );

    // Helper para obtener un campo por varios alias
    const get = (k) => q.get(k) || h.get(k) || q.get(k.toLowerCase()) || h.get(k.toLowerCase());

    // Token puede venir como access_token, jwt, token o id_token
    const token = get("access_token") || get("jwt") || get("token") || get("id_token");
    const err =
      get("error") ||
      get("error_description") ||
      get("error[error]") ||
      get("error[error_description]");

    if (err) {
      document.body.textContent = "Error de SSO: " + err;
      return;
    }

    if (!token) {
      document.body.textContent = "No llegó access_token (¿iniciaste con ?redirect=...?).";
      return;
    }

    // Guarda token para tu app
    localStorage.setItem("strapi_jwt", token);
    document.cookie = "strapi_jwt=" + token + "; Path=/; Secure; SameSite=None";

    // Redirige adonde quieras (se puede pasar ?next=/ruta en query o hash)
    const next = get("next") || "/";
    const url = new URL(next, window.location.origin);

    // Limpia la URL (quita query y hash) y navega
    window.history.replaceState({}, "", url.toString());
    window.location.assign(url.toString());
  } catch (e) {
    console.error(e);
    document.body.textContent = "Error procesando el inicio de sesión.";
  }
})();
