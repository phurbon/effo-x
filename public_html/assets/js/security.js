(() => {
  'use strict';

  const BANNER_SESSION_KEY = 'effo-security-banner-dismissed';

  function injectSecurityBanner() {
    if (!document.body) return;
    if (sessionStorage.getItem(BANNER_SESSION_KEY) === 'true') return;
    if (document.getElementById('security-trust-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'security-trust-banner';
    banner.className = 'security-banner';
    banner.setAttribute('role', 'status');
    banner.innerHTML = `
      <div class="security-banner__content">
        <strong>Protect your Effo-X login.</strong>
        <span>Only trust links that start with <code>effo-x.com</code> or <code>effo-x.myshopify.com</code>. Never share passwords in DMs.</span>
      </div>
      <button type="button" class="security-banner__close" aria-label="Dismiss security notice">&times;</button>
    `;

    const onDismiss = () => {
      sessionStorage.setItem(BANNER_SESSION_KEY, 'true');
      document.body.classList.remove('has-security-banner');
      banner.remove();
    };
    banner.querySelector('.security-banner__close')?.addEventListener('click', onDismiss);

    document.body.prepend(banner);
    document.body.classList.add('has-security-banner');
  }

  function hardenExternalLinks() {
    const anchors = document.querySelectorAll('a[target="_blank"]');
    anchors.forEach((anchor) => {
      const rel = anchor.getAttribute('rel') || '';
      const tokens = rel.split(/\s+/).filter(Boolean);
      if (!tokens.includes('noopener')) tokens.push('noopener');
      if (!tokens.includes('noreferrer')) tokens.push('noreferrer');
      anchor.setAttribute('rel', tokens.join(' '));

      const href = anchor.getAttribute('href') || '';
      if (href.startsWith('http')) {
        anchor.setAttribute('data-trusted-link', 'external');
      }
    });
  }

  function initSecurityLayer() {
    // Banner removed per request; keep link hardening only.
    try { hardenExternalLinks(); } catch (err) { console.warn('Security layer external link error', err); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSecurityLayer, { once: true });
  } else {
    initSecurityLayer();
  }
})();
