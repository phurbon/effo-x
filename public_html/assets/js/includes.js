const loadScriptOnce = (() => {
  const cache = new Map();
  return (src) => {
    if (cache.has(src)) return cache.get(src);
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      const promise = Promise.resolve();
      cache.set(src, promise);
      return promise;
    }
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
    cache.set(src, promise);
    return promise;
  };
})();

async function loadAuthScripts() {
  try {
    await loadScriptOnce('https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.js');
    await loadScriptOnce('assets/js/auth0-config.js');
    await loadScriptOnce('assets/js/auth0-client.js');
    await loadScriptOnce('assets/js/auth-nav.js');
    await loadScriptOnce('assets/js/cart-sync.js');
  } catch (err) {
    console.warn('Auth scripts failed to load:', err);
  }
}

loadAuthScripts()
  .catch(() => {})
  .finally(() => {
    document.dispatchEvent(new CustomEvent('authScriptsLoaded'));
  });

loadScriptOnce('assets/js/modal-gallery.js').catch(() => {});
loadScriptOnce('assets/js/scroll-scenes.js').catch(() => {});

const ensureSharedProtectionScripts = (() => {
  const loadedScripts = new Set();
  return (src, markerAttr) => {
    if (loadedScripts.has(src)) return;
    const existing = document.querySelector(`script[src="${src}"]`) ||
      (markerAttr ? document.querySelector(`script[${markerAttr}]`) : null);
    if (existing) {
      loadedScripts.add(src);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    if (markerAttr) {
      script.setAttribute(markerAttr, 'true');
    }
    document.head.appendChild(script);
    loadedScripts.add(src);
  };
})();

ensureSharedProtectionScripts('assets/js/security.js', 'data-security-layer');
ensureSharedProtectionScripts('assets/js/formSecurity.js', 'data-form-guard');

document.addEventListener('DOMContentLoaded', () => {
  const includeTargets = Array.from(document.querySelectorAll('[data-include]'));
  if (!includeTargets.length) {
    document.dispatchEvent(new CustomEvent('partialsLoaded'));
    return;
  }

  Promise.all(includeTargets.map(async (el) => {
    const path = el.getAttribute('data-include');
    if (!path) return;
    try {
      // Shared partials change independently from the page that loads them.
      // Revalidate them so a CDN/browser cannot combine new markup with stale CSS.
      const separator = path.includes('?') ? '&' : '?';
      const includeUrl = `${path}${separator}v=20260808-2`;
      const response = await fetch(includeUrl, { cache: 'no-cache' });
      if (!response.ok) {
        console.warn(`Failed to load include "${path}": ${response.status}`);
        return;
      }
      const html = await response.text();
      el.innerHTML = html;
      el.removeAttribute('data-include');
    } catch (err) {
      console.warn(`Failed to load include "${path}":`, err);
    }
  })).finally(() => {
    document.dispatchEvent(new CustomEvent('partialsLoaded'));
  });
});
