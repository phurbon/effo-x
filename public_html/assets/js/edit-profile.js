(async function () {
  const statusEl = document.querySelector('[data-profile-status]');
  const nameEl = document.querySelector('[data-profile-name]');
  const emailDisplayEl = document.querySelector('[data-profile-email]');
  const roleEl = document.querySelector('[data-profile-role]');

  const form = document.getElementById('profile-form');
  const emailInput = document.getElementById('profile-email');
  const phoneInput = document.getElementById('profile-phone');
  const addressInput = document.getElementById('profile-address');

  function setStatus(message, tone) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    if (!message) {
      statusEl.style.color = '';
      return;
    }
    if (tone === 'error') statusEl.style.color = '#c0392b';
    else if (tone === 'success') statusEl.style.color = '#0b8457';
    else statusEl.style.color = '#2c3e50';
  }

  function setFormDisabled(disabled) {
    if (emailInput) emailInput.disabled = disabled;
    if (phoneInput) phoneInput.disabled = disabled;
    if (addressInput) addressInput.disabled = disabled;
    if (form) {
      const submit = form.querySelector('button[type="submit"]');
      if (submit) submit.disabled = disabled;
    }
  }

  try {
    await Auth0Client.getClient();
    const authed = await Auth0Client.isAuthenticated();
    if (!authed) return;

    const user = await Auth0Client.getUser();
    if (nameEl) nameEl.textContent = user?.name || user?.nickname || 'Effo-X Member';
    if (emailDisplayEl) emailDisplayEl.textContent = user?.email || '—';
    if (emailInput) emailInput.value = user?.email || '';

    const token = await Auth0Client.getToken();
    const response = await fetch('api/profile_get.php', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.ok) {
      const profile = await response.json();
      if (nameEl && profile.name) nameEl.textContent = profile.name;
      if (emailDisplayEl && profile.email) emailDisplayEl.textContent = profile.email;
      if (emailInput && profile.email) emailInput.value = profile.email;
      if (roleEl) roleEl.textContent = profile.role || 'Member';
      if (phoneInput) phoneInput.value = profile.phone || '';
      if (addressInput) addressInput.value = profile.address || '';
    } else {
      setStatus('Unable to load your profile yet. You can still save updates below.', 'error');
    }

    if (form) {
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        setStatus('Saving changes...', 'info');
        setFormDisabled(true);
        try {
          const payload = {
            phone: phoneInput && phoneInput.value.trim() ? phoneInput.value.trim() : null,
            address: addressInput && addressInput.value.trim() ? addressInput.value.trim() : null
          };
          const saveResponse = await fetch('api/profile_upsert.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          if (!saveResponse.ok) {
            setStatus('We could not save your profile. Please try again.', 'error');
            return;
          }
          setStatus('Profile updated.', 'success');
        } catch (err) {
          console.error('Profile update failed:', err);
          setStatus('We could not save your profile. Please try again.', 'error');
        } finally {
          setFormDisabled(false);
        }
      });
    }
  } catch (err) {
    console.error('Edit profile load failed:', err);
    setStatus('Unable to load your profile right now.', 'error');
  }
})();
