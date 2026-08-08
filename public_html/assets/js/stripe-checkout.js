(() => {
  const checkoutButton = document.querySelector('[data-stripe-checkout]');
  if (!checkoutButton) return;

  const publishableKey = checkoutButton.dataset.stripePublishableKey || '';
  const endpoint = checkoutButton.dataset.checkoutEndpoint || '/api/create-checkout-session';
  const statusEl = document.querySelector('[data-checkout-status]');
  const spinner = document.querySelector('[data-checkout-spinner]');

  const setStatus = (message, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.dataset.state = isError ? 'error' : 'info';
  };

  const toggleSpinner = (shouldShow) => {
    if (!spinner) return;
    if (shouldShow) {
      spinner.removeAttribute('hidden');
    } else {
      spinner.setAttribute('hidden', 'true');
    }
  };

  if (!publishableKey) {
    setStatus('Add your Stripe publishable key to enable checkout.', true);
    checkoutButton.disabled = true;
    return;
  }

  const getCartPayload = () => {
    try {
      const saved = localStorage.getItem('effo-cart');
      if (!saved) return { items: [] };
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return { items: parsed };
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
        return { items: parsed.items };
      }
    } catch (err) {
      console.warn('Unable to parse saved cart for Stripe payload', err);
    }
    return { items: [] };
  };

  checkoutButton.addEventListener('click', async () => {
    try {
      toggleSpinner(true);
      checkoutButton.disabled = true;
      setStatus('Contacting Stripe…');

      if (typeof Stripe !== 'function') {
        throw new Error('Stripe.js failed to load.');
      }
      const stripe = Stripe(publishableKey);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cart: getCartPayload() })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Checkout service error (${response.status}). ${errorBody || ''}`.trim());
      }

      const payload = await response.json();
      const sessionId = payload.id || payload.sessionId;
      if (!sessionId) throw new Error('Missing Checkout Session ID from server.');

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;

      setStatus('Redirecting to Stripe…');
    } catch (err) {
      console.error(err);
      setStatus(err?.message || 'Unable to start checkout. Please try again.', true);
      toggleSpinner(false);
      checkoutButton.disabled = false;
    }
  });
})();
