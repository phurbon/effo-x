(function () {
  async function initAuthNav() {
    const nav = document.querySelector('[data-auth-nav]');
    if (!nav) return false;

    const guestEl = nav.querySelector('.auth-guest');
    const userEl = nav.querySelector('.auth-user');
    const nameEl = nav.querySelector('[data-auth-name]');
    const logoutBtn = document.querySelector('[data-auth-logout]');

    function setAuthed(user) {
      if (guestEl) guestEl.hidden = true;
      if (userEl) userEl.hidden = false;
      if (nameEl) nameEl.textContent = user?.name || user?.nickname || user?.email || 'Account';
    }

    function setGuest() {
      if (guestEl) guestEl.hidden = false;
      if (userEl) userEl.hidden = true;
    }

    const hasFactory =
      typeof window.createAuth0Client === 'function' ||
      (window.auth0 && typeof window.auth0.createAuth0Client === 'function');

    if (!window.createAuth0Client && window.auth0 && typeof window.auth0.createAuth0Client === 'function') {
      window.createAuth0Client = window.auth0.createAuth0Client;
    }

    if (!window.Auth0Client || !hasFactory) {
      setGuest();
      return false;
    }

    try {
      await Auth0Client.getClient();
      const authed = await Auth0Client.isAuthenticated();
      if (!authed) {
        setGuest();
        return true;
      }

      const user = await Auth0Client.getUser();
      setAuthed(user);

      if (logoutBtn && !logoutBtn.dataset.authBound) {
        logoutBtn.dataset.authBound = '1';
        logoutBtn.addEventListener('click', () => Auth0Client.logout());
      }
    } catch (err) {
      console.error('Auth nav init failed:', err);
      setGuest();
    }

    return true;
  }

  (async function boot() {
    await initAuthNav();

    // Re-run when shared scripts/partials are loaded and when mobile restores pages from bfcache.
    document.addEventListener('partialsLoaded', initAuthNav);
    document.addEventListener('authScriptsLoaded', initAuthNav);
    window.addEventListener('pageshow', initAuthNav);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        initAuthNav();
      }
    });
  })();
})();
