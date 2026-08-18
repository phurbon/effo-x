(() => {
  const KEY = 'effox_cookie_choice_v1';
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (_) { return null; } };
  const activateOptional = () => {
    document.querySelectorAll('iframe[data-consent-src]').forEach((frame) => {
      if (!frame.src) frame.src = frame.dataset.consentSrc;
    });
  };
  const save = (optional) => {
    localStorage.setItem(KEY, JSON.stringify({ necessary: true, optional, savedAt: new Date().toISOString() }));
    document.getElementById('cookie-consent')?.remove();
    if (optional) activateOptional();
  };
  const show = () => {
    document.getElementById('cookie-consent')?.remove();
    const box = document.createElement('section');
    box.id = 'cookie-consent';
    box.className = 'cookie-consent';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie choices');
    box.innerHTML = '<p><strong>Your privacy choices</strong><br>Necessary technologies keep the store, account and cart working. Optional media may share device and usage information with providers such as YouTube. <a href="pages/cookies.html">Cookie details</a> · <a href="pages/fr/temoins.html" lang="fr">Français</a></p><div><button type="button" data-cookie="necessary">Necessary only</button><button type="button" data-cookie="all">Allow optional media</button></div>';
    document.body.appendChild(box);
    box.querySelector('[data-cookie="necessary"]').addEventListener('click', () => save(false));
    box.querySelector('[data-cookie="all"]').addEventListener('click', () => save(true));
  };
  const choice = read();
  if (choice?.optional) activateOptional();
  if (!choice) show();
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-cookie-settings]')) { event.preventDefault(); show(); }
  });
})();
