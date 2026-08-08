(async function () {
  try {
    await Auth0Client.getClient();
    const authed = await Auth0Client.isAuthenticated();
    if (!authed) {
      await Auth0Client.login({
        appState: {
          target: window.location.pathname + window.location.search
        }
      });
    }
  } catch (err) {
    console.error('Auth protection failed:', err);
  }
})();
