(() => {
  const CART_SYNC_DEBOUNCE_MS = 800;

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForAuth0(timeoutMs = 5000) {
    const start = Date.now();
    while (!window.Auth0Client) {
      if (Date.now() - start > timeoutMs) return null;
      await sleep(100);
    }
    try {
      await Auth0Client.getClient();
      return Auth0Client;
    } catch (err) {
      console.warn('Auth0 client unavailable for cart sync:', err);
      return null;
    }
  }

  function getCartId(cartEl) {
    return (
      cartEl.getAttribute('cart-id') ||
      cartEl.cartId ||
      cartEl.cart?.id ||
      cartEl.cart?.cart?.id ||
      null
    );
  }

  async function getCartSnapshot(cartEl) {
    let cart = null;
    if (typeof cartEl.getCart === 'function') {
      try {
        cart = await cartEl.getCart();
      } catch (err) {
        console.warn('Unable to read cart via getCart:', err);
      }
    }
    if (!cart) {
      cart = cartEl.cart || cartEl.cartState || null;
    }

    const cartId = cart?.id || cart?.cart?.id || getCartId(cartEl);
    const edges = cart?.lines?.edges || null;
    const rawLines = edges ? edges.map((edge) => edge.node) : (cart?.lines || []);

    const items = Array.isArray(rawLines)
      ? rawLines.map((line) => ({
        line_id: line?.id || null,
        variant_id: line?.merchandise?.id || line?.variant?.id || line?.merchandiseId || null,
        quantity: line?.quantity ?? line?.qty ?? 1,
        title: line?.merchandise?.product?.title || line?.title || line?.merchandise?.title || null
      })).filter((item) => item.variant_id || item.line_id)
      : [];

    return { cartId, items };
  }

  async function apiRequest(path, token, payload) {
    const res = await fetch(path, {
      method: payload ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: payload ? JSON.stringify(payload) : null
    });
    if (!res.ok) {
      throw new Error(`Cart sync error ${res.status}`);
    }
    return res.json();
  }

  function showRestoreBanner(message) {
    if (document.getElementById('cart-restore-banner')) return;
    if (sessionStorage.getItem('cart_restore_banner_dismissed') === 'true') return;
    const banner = document.createElement('div');
    banner.id = 'cart-restore-banner';
    banner.className = 'cart-restore-banner';
    banner.innerHTML = `
      <span>${message || 'We restored your cart from your last session.'}</span>
      <button type="button" aria-label="Dismiss restore notice">&times;</button>
    `;
    const closeBtn = banner.querySelector('button');
    closeBtn.addEventListener('click', () => {
      sessionStorage.setItem('cart_restore_banner_dismissed', 'true');
      banner.remove();
    });
    document.body.prepend(banner);
  }

  async function logCartRestoreIssue(token, payload) {
    try {
      await apiRequest('api/cart_log.php', token, payload);
    } catch (err) {
      console.warn('Unable to log cart restore issue:', err);
    }
  }

  function getStorefrontConfig() {
    const storeEl = document.querySelector('shopify-store');
    if (!storeEl) return null;
    const domain = storeEl.getAttribute('store-domain');
    const token = storeEl.getAttribute('public-access-token');
    if (!domain || !token) return null;
    return { domain, token };
  }

  async function storefrontRequest(config, query, variables) {
    const res = await fetch(`${config.domain}/api/2025-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.token
      },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) throw new Error(`Storefront API error ${res.status}`);
    return res.json();
  }

  async function fetchCartExists(config, cartId) {
    const query = `#graphql
      query CartCheck($id: ID!) {
        cart(id: $id) { id }
      }
    `;
    const data = await storefrontRequest(config, query, { id: cartId });
    return !!data?.data?.cart?.id;
  }

  async function createCartFromItems(config, items) {
    const lines = (items || []).map((item) => ({
      merchandiseId: item.variant_id,
      quantity: Math.max(1, Number(item.quantity) || 1)
    })).filter((line) => line.merchandiseId);
    if (!lines.length) return null;
    const mutation = `#graphql
      mutation CartCreate($lines: [CartLineInput!]) {
        cartCreate(input: { lines: $lines }) {
          cart { id }
          userErrors { field message }
        }
      }
    `;
    const data = await storefrontRequest(config, mutation, { lines });
    return data?.data?.cartCreate?.cart?.id || null;
  }

  let initialized = false;

  async function initCartSync() {
    if (initialized) return;
    const cartEl = document.getElementById('shopify-cart') || document.querySelector('shopify-cart');
    if (!cartEl) return;
    initialized = true;

    const auth0 = await waitForAuth0();
    if (!auth0) return;

    const authed = await auth0.isAuthenticated();
    if (!authed) return;

    let token;
    try {
      token = await auth0.getToken();
    } catch (err) {
      console.warn('Unable to get Auth0 token for cart sync:', err);
      return;
    }

    let debounceId = null;
    const scheduleSync = () => {
      if (debounceId) window.clearTimeout(debounceId);
      debounceId = window.setTimeout(async () => {
        debounceId = null;
        try {
          const snapshot = await getCartSnapshot(cartEl);
          if (!snapshot.cartId) return;
          await apiRequest('api/cart_save.php', token, {
            cart_id: snapshot.cartId,
            items: snapshot.items
          });
        } catch (err) {
          console.warn('Cart sync failed:', err);
        }
      }, CART_SYNC_DEBOUNCE_MS);
    };

    // Restore cart from server if available.
    try {
      const saved = await apiRequest('api/cart_get.php', token);
      const localId = getCartId(cartEl);
      if (saved?.cart_id) {
        if (saved.cart_id !== localId) {
          cartEl.setAttribute('cart-id', saved.cart_id);
          if ('cartId' in cartEl) cartEl.cartId = saved.cart_id;
          if (typeof cartEl.refresh === 'function') cartEl.refresh();
          if (typeof cartEl.load === 'function') cartEl.load();
        }

        if (saved.items?.length) {
          const storeConfig = getStorefrontConfig();
          if (storeConfig) {
            try {
              const exists = await fetchCartExists(storeConfig, saved.cart_id);
              if (!exists) {
                await logCartRestoreIssue(token, {
                  cart_id: saved.cart_id,
                  reason: 'cart_missing'
                });
                const newId = await createCartFromItems(storeConfig, saved.items);
                if (newId) {
                  cartEl.setAttribute('cart-id', newId);
                  if ('cartId' in cartEl) cartEl.cartId = newId;
                  if (typeof cartEl.refresh === 'function') cartEl.refresh();
                  if (typeof cartEl.load === 'function') cartEl.load();
                  await apiRequest('api/cart_save.php', token, { cart_id: newId, items: saved.items });
                  showRestoreBanner('We rebuilt your cart from your saved items.');
                } else {
                  await logCartRestoreIssue(token, {
                    cart_id: saved.cart_id,
                    reason: 'cart_rebuild_failed'
                  });
                }
              }
            } catch (err) {
              console.warn('Cart rebuild check failed:', err);
              await logCartRestoreIssue(token, {
                cart_id: saved.cart_id,
                reason: 'cart_check_failed',
                detail: err?.message || String(err)
              });
            }
          }
        }
      } else if (localId) {
        scheduleSync();
      } else if (saved?.items?.length) {
        const storeConfig = getStorefrontConfig();
        if (storeConfig) {
          try {
            const newId = await createCartFromItems(storeConfig, saved.items);
            if (newId) {
              cartEl.setAttribute('cart-id', newId);
              if ('cartId' in cartEl) cartEl.cartId = newId;
              if (typeof cartEl.refresh === 'function') cartEl.refresh();
              if (typeof cartEl.load === 'function') cartEl.load();
              await apiRequest('api/cart_save.php', token, { cart_id: newId, items: saved.items });
              showRestoreBanner('We restored your cart from your saved items.');
            } else {
              await logCartRestoreIssue(token, {
                cart_id: null,
                reason: 'cart_rebuild_failed'
              });
            }
          } catch (err) {
            console.warn('Cart rebuild failed:', err);
            await logCartRestoreIssue(token, {
              cart_id: null,
              reason: 'cart_rebuild_failed',
              detail: err?.message || String(err)
            });
          }
        }
      }
    } catch (err) {
      console.warn('Cart restore failed:', err);
      await logCartRestoreIssue(token, {
        cart_id: null,
        reason: 'cart_restore_failed',
        detail: err?.message || String(err)
      });
    }

    // Listen for cart changes (best-effort across web components versions).
    ['cart:updated', 'shopify:cart:updated', 'shopify:cart:update', 'shopify:cart:change'].forEach((evt) => {
      cartEl.addEventListener(evt, scheduleSync);
    });

    // Patch addLine/removeLine/updateLine to trigger sync after cart changes.
    ['addLine', 'removeLine', 'updateLine', 'addLines', 'clearLines'].forEach((fn) => {
      if (typeof cartEl[fn] !== 'function') return;
      const original = cartEl[fn].bind(cartEl);
      cartEl[fn] = (...args) => {
        const result = original(...args);
        Promise.resolve(result).finally(() => scheduleSync());
        return result;
      };
    });
  }

  function boot() {
    initCartSync().catch((err) => console.warn('Cart sync init failed:', err));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('partialsLoaded', boot);
})();
