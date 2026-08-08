// Auth0 helper module
// Purpose: keep all Auth0 plumbing in one place so pages can just call Auth0Client.login(), etc.
(function () {
  // Config is injected by assets/js/auth0-config.js
  // If something "Auth0" feels broken, start by checking that file.
  const config = window.AUTH0_CONFIG || {};

  // Cached Auth0 SDK client instance (created once, reused everywhere).
  let auth0Client;

  // Promise used while handling the Auth0 redirect callback.
  // This prevents race conditions if multiple calls happen at once.
  let callbackPromise;
  let callbackHandled = false;

  // Find the Auth0 SDK factory function (depends on how the SDK was loaded).
  function getAuth0Factory() {
    if (typeof window.createAuth0Client === 'function') return window.createAuth0Client;
    if (window.auth0 && typeof window.auth0.createAuth0Client === 'function') {
      window.createAuth0Client = window.auth0.createAuth0Client;
      return window.createAuth0Client;
    }
    return null;
  }

  // Create (or return) the Auth0 client and process callback tokens if present.
  async function getClient() {
    if (auth0Client) {
      if (callbackPromise) {
        await callbackPromise;
      }
      return auth0Client;
    }
    const factory = getAuth0Factory();
    if (typeof factory !== 'function') {
      throw new Error('Auth0 client script not loaded');
    }
    // Main Auth0 client setup. Change domain/clientId/audience in auth0-config.js.
    auth0Client = await factory({
      domain: config.domain,
      clientId: config.clientId,
      cacheLocation: config.cacheLocation || 'localstorage',
      useRefreshTokens: config.useRefreshTokens !== false,
      authorizationParams: {
        redirect_uri: (config.redirectUri || (window.location.origin + '/login')),
        audience: config.audience
      }
    });

    // ----- Redirect callback handling -----
    // After Auth0 login, the browser is redirected back to /login
    // with ?code=...&state=... (or error params).
    const searchParams = new URLSearchParams(window.location.search);
    const hasError = searchParams.has('error');
    const hasErrorDesc = searchParams.has('error_description');
    const hasCode = searchParams.has('code');
    const hasState = searchParams.has('state');

    // If Auth0 returned an error, store it for the login page to show.
    if (hasError) {
      const err = searchParams.get('error') || 'login_error';
      const desc = searchParams.get('error_description') || 'Authentication failed. Please try again.';
      try {
        sessionStorage.setItem('auth0_callback_error', `${err}: ${desc}`);
        sessionStorage.setItem('auth0_callback_complete', 'error');
      } catch (storageErr) {
        console.warn('Unable to store Auth0 error:', storageErr);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // If there's a code but no state, something is wrong with the redirect.
    if (hasCode && !hasState) {
      try {
        sessionStorage.setItem('auth0_callback_error', 'Auth0 callback missing state. Login likely started without the Auth0 SDK.');
        sessionStorage.setItem('auth0_callback_complete', 'missing_state');
      } catch (storageErr) {
        console.warn('Unable to store Auth0 missing state error:', storageErr);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // If we have both code + state, complete the login exchange.
    if (hasCode && hasState && !callbackHandled) {
      callbackHandled = true;
      callbackPromise = auth0Client.handleRedirectCallback()
        .then((result) => {
          try {
            sessionStorage.setItem('auth0_callback_complete', 'success');
          } catch (storageErr) {
            console.warn('Unable to store Auth0 callback status:', storageErr);
          }
          // appState.target is set by our login() helper (see below).
          const target = result?.appState?.target;
          window.history.replaceState({}, document.title, window.location.pathname);
          if (target) {
            window.location.assign(target);
          }
        })
        .catch((err) => {
          console.error('Auth0 callback failed:', err);
          try {
            sessionStorage.setItem('auth0_callback_error', err?.message || 'Authentication failed. Please try again.');
            sessionStorage.setItem('auth0_callback_complete', 'error');
          } catch (storageErr) {
            console.warn('Unable to store Auth0 error:', storageErr);
          }
          window.history.replaceState({}, document.title, window.location.pathname);
        });
      await callbackPromise;
    } else if (callbackPromise) {
      await callbackPromise;
    }

    return auth0Client;
  }

  // Kick off a login (or signup if you pass screen_hint in options).
  // Example:
  // Auth0Client.login({
  //   authorizationParams: { screen_hint: 'signup' },
  //   appState: { target: '/profile' }
  // });
  async function login(options = {}) {
    const client = await getClient();
    const authParams = {
      redirect_uri: (config.redirectUri || (window.location.origin + '/login')),
      audience: config.audience,
      ...(options.authorizationParams || {})
    };
    await client.loginWithRedirect({
      authorizationParams: authParams,
      appState: options.appState
    });
  }

  // Log the user out of Auth0 and return to the site root.
  async function logout() {
    const client = await getClient();
    client.logout({
      logoutParams: {
        returnTo: window.location.origin + '/'
      }
    });
  }

  // True/false if the user is logged in (checks local session).
  async function isAuthenticated() {
    const client = await getClient();
    return client.isAuthenticated();
  }

  // Fetch basic user profile (name, email, picture) from the ID token.
  async function getUser() {
    const client = await getClient();
    return client.getUser();
  }

  // Get an access token for API calls (uses silent auth).
  async function getToken() {
    const client = await getClient();
    return client.getTokenSilently({
      authorizationParams: {
        audience: config.audience
      }
    });
  }

  // Public API used by pages (login.html, header auth menu, etc.)
  window.Auth0Client = {
    getClient,
    login,
    logout,
    isAuthenticated,
    getUser,
    getToken
  };
})();
