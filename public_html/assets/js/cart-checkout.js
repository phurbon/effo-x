(() => {
  function getStorefrontConfig() {
    const storeEl = document.querySelector('shopify-store');
    if (!storeEl) return null;
    const domain = storeEl.getAttribute('store-domain');
    const token = storeEl.getAttribute('public-access-token');
    if (!domain || !token) return null;
    return { domain, token };
  }

  function getCartElement() {
    return document.getElementById('shopify-cart') || document.querySelector('shopify-cart');
  }

  function getCartId(cartEl) {
    return (
      cartEl?.getAttribute('cart-id') ||
      cartEl?.cartId ||
      cartEl?.cart?.id ||
      cartEl?.cart?.cart?.id ||
      null
    );
  }

  async function fetchStorefront(config, query, variables) {
    const res = await fetch(`${config.domain}/api/2025-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': config.token
      },
      body: JSON.stringify({ query, variables })
    });
    if (!res.ok) {
      throw new Error(`Storefront API error ${res.status}`);
    }
    return res.json();
  }

  async function getCheckoutUrl(config, cartId) {
    const query = `#graphql
      query CartCheckout($id: ID!) {
        cart(id: $id) {
          id
          checkoutUrl
        }
      }
    `;
    const data = await fetchStorefront(config, query, { id: cartId });
    return data?.data?.cart?.checkoutUrl || null;
  }

  async function applyDiscountCode(config, cartId, code) {
    const mutation = `#graphql
      mutation CartDiscountCodesUpdate($cartId: ID!, $codes: [String!]!) {
        cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $codes) {
          cart {
            id
            checkoutUrl
            discountCodes { code applicable }
          }
          userErrors { field message }
        }
      }
    `;
    const data = await fetchStorefront(config, mutation, { cartId, codes: [code] });
    return data?.data?.cartDiscountCodesUpdate || null;
  }

  function setStatus(el, message, kind) {
    if (!el) return;
    el.textContent = message;
    el.classList.remove('is-error', 'is-success');
    if (kind === 'error') el.classList.add('is-error');
    if (kind === 'success') el.classList.add('is-success');
  }

  async function handleCheckout({ applyOnly = false } = {}) {
    const statusEl = document.getElementById('promo-status');
    const codeInput = document.getElementById('promo-code');
    const cartEl = getCartElement();
    const config = getStorefrontConfig();

    if (!cartEl || !config) {
      setStatus(statusEl, 'Cart is not ready yet. Please refresh and try again.', 'error');
      return;
    }

    const cartId = getCartId(cartEl);
    if (!cartId) {
      setStatus(statusEl, 'No cart found yet. Add an item first.', 'error');
      return;
    }

    const code = (codeInput?.value || '').trim();
    let checkoutUrl = null;

    try {
      if (code) {
        setStatus(statusEl, 'Applying promo code...', null);
        const result = await applyDiscountCode(config, cartId, code);
        const errors = result?.userErrors || [];
        if (errors.length) {
          setStatus(statusEl, errors[0].message || 'Promo code failed.', 'error');
          if (applyOnly) return;
        } else {
          const applicable = result?.cart?.discountCodes?.some((d) => d.code === code && d.applicable);
          if (!applicable) {
            setStatus(statusEl, 'Promo code not applicable to this cart.', 'error');
            if (applyOnly) return;
          } else {
            setStatus(statusEl, 'Promo code applied.', 'success');
          }
          checkoutUrl = result?.cart?.checkoutUrl || null;
        }
      }

      if (applyOnly) return;

      if (!checkoutUrl) {
        checkoutUrl = await getCheckoutUrl(config, cartId);
      }

      if (!checkoutUrl) {
        setStatus(statusEl, 'Unable to start checkout. Please try again.', 'error');
        return;
      }

      window.location.assign(checkoutUrl);
    } catch (err) {
      console.error(err);
      setStatus(statusEl, 'Checkout failed. Please try again.', 'error');
    }
  }

  function init() {
    const applyBtn = document.getElementById('apply-promo');
    const checkoutBtn = document.getElementById('checkout-btn');
    if (!applyBtn || !checkoutBtn) return;

    applyBtn.addEventListener('click', () => handleCheckout({ applyOnly: true }));
    checkoutBtn.addEventListener('click', () => handleCheckout({ applyOnly: false }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
