(async function () {
  try {
    await Auth0Client.getClient();
    const authed = await Auth0Client.isAuthenticated();
    if (!authed) return;

    const user = await Auth0Client.getUser();
    if (user) {
      const nameEl = document.querySelector('[data-profile-name]');
      const emailEls = document.querySelectorAll('[data-profile-email]');
      if (nameEl) nameEl.textContent = user.name || user.nickname || 'Effo-X Member';
      emailEls.forEach((el) => {
        el.textContent = user.email || '—';
      });
    }

    const token = await Auth0Client.getToken();
    const response = await fetch('api/profile_get.php', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!response.ok) return;
    const profile = await response.json();

    const addressEl = document.querySelector('[data-profile-address]');
    const phoneEl = document.querySelector('[data-profile-phone]');
    const roleEl = document.querySelector('[data-profile-role]');
    const nameEl = document.querySelector('[data-profile-name]');
    const emailEls = document.querySelectorAll('[data-profile-email]');

    if (addressEl) addressEl.textContent = profile.address || '—';
    if (phoneEl) phoneEl.textContent = profile.phone || '—';
    if (roleEl) roleEl.textContent = profile.role || 'Member';
    if (nameEl && profile.name) nameEl.textContent = profile.name;
    if (profile.email) {
      emailEls.forEach((el) => {
        el.textContent = profile.email;
      });
    }
  } catch (err) {
    console.error('Profile load failed:', err);
  }
})();
