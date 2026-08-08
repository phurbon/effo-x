(() => {
  const MAX_TRIES = 12;
  const RETRY_DELAY = 150;
  let modalScrollLock = null;

  function getStorefrontConfig() {
    const storeEl = document.querySelector('shopify-store');
    if (!storeEl) return null;
    const domain = storeEl.getAttribute('store-domain');
    const token = storeEl.getAttribute('public-access-token');
    if (!domain || !token) return null;
    return { domain, token };
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
    if (!res.ok) throw new Error(`Storefront API error ${res.status}`);
    return res.json();
  }

  async function fetchProductImages(config, handle) {
    const query = `#graphql
      query ProductImages($handle: String!) {
        product(handle: $handle) {
          images(first: 6) {
            nodes { url altText }
          }
        }
      }
    `;
    const data = await fetchStorefront(config, query, { handle });
    const nodes = data?.data?.product?.images?.nodes || [];
    return nodes.filter((img) => img?.url);
  }

  function renderGallery(gallery, images) {
    const mainImg = gallery.querySelector('[data-modal-main]');
    const thumbs = gallery.querySelector('[data-modal-thumbs]');
    if (!mainImg || !thumbs) return;

    thumbs.innerHTML = '';
    const useImages = images.slice(0, 2);
    if (!useImages.length) return;

    const setMain = (img) => {
      mainImg.src = img.url;
      mainImg.alt = img.altText || 'Product image';
    };

    useImages.forEach((img, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'modal-thumb';
      btn.setAttribute('aria-label', `View image ${index + 1}`);
      const thumbImg = document.createElement('img');
      thumbImg.src = img.url;
      thumbImg.alt = img.altText || `Thumbnail ${index + 1}`;
      btn.appendChild(thumbImg);
      btn.addEventListener('click', () => {
        setMain(img);
        thumbs.querySelectorAll('.modal-thumb').forEach((el) => el.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
      if (index === 0) btn.classList.add('is-active');
      thumbs.appendChild(btn);
    });

    setMain(useImages[0]);
  }

  async function hydrateGallery(modal) {
    const gallery = modal.querySelector('[data-modal-gallery]');
    const handleEl = modal.querySelector('[data-modal-handle]');
    if (!gallery || !handleEl) return;

    const handle = handleEl.textContent.trim();
    if (!handle) return;
    if (gallery.dataset.loadedFor === handle) return;

    const config = getStorefrontConfig();
    if (!config) return;

    try {
      const images = await fetchProductImages(config, handle);
      renderGallery(gallery, images);
      gallery.dataset.loadedFor = handle;
    } catch (err) {
      console.warn('Modal gallery fetch failed:', err);
    }
  }

  function scheduleHydrate(modal, attempt = 0) {
    if (attempt >= MAX_TRIES) return;
    setTimeout(() => {
      const handleEl = modal.querySelector('[data-modal-handle]');
      if (handleEl && handleEl.textContent.trim()) {
        hydrateGallery(modal);
      } else {
        scheduleHydrate(modal, attempt + 1);
      }
    }, RETRY_DELAY);
  }

  function initModalScrollLock(modal) {
    if (!modal || modalScrollLock) return;

    const body = document.body;
    const html = document.documentElement;
    if (!body || !html) return;

    const state = {
      active: false,
      scrollY: 0,
      bodyStyle: {
        position: body.style.position,
        top: body.style.top,
        left: body.style.left,
        right: body.style.right,
        width: body.style.width,
        overflow: body.style.overflow,
        paddingRight: body.style.paddingRight
      },
      htmlStyle: {
        overflow: html.style.overflow
      }
    };

    const lock = () => {
      if (state.active) return;
      state.active = true;
      state.scrollY = window.scrollY || window.pageYOffset || 0;

      const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
      body.classList.add('modal-open');
      body.style.position = 'fixed';
      body.style.top = `-${state.scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      if (scrollbarWidth) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      html.style.overflow = 'hidden';
    };

    const unlock = () => {
      if (!state.active) return;
      state.active = false;

      body.classList.remove('modal-open');
      body.style.position = state.bodyStyle.position;
      body.style.top = state.bodyStyle.top;
      body.style.left = state.bodyStyle.left;
      body.style.right = state.bodyStyle.right;
      body.style.width = state.bodyStyle.width;
      body.style.overflow = state.bodyStyle.overflow;
      body.style.paddingRight = state.bodyStyle.paddingRight;
      html.style.overflow = state.htmlStyle.overflow;
      window.scrollTo(0, state.scrollY);
    };

    const openObserver = new MutationObserver(() => {
      if (modal.open) lock();
      else unlock();
    });
    openObserver.observe(modal, { attributes: true, attributeFilter: ['open'] });

    modal.addEventListener('cancel', unlock);
    modal.addEventListener('close', unlock);
    if (modal.open) lock();

    modalScrollLock = { lock, unlock, openObserver };
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.product__link');
    if (!trigger) return;
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    scheduleHydrate(modal, 0);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('product-modal');
    if (!modal) return;
    initModalScrollLock(modal);
    if (modal.open) scheduleHydrate(modal, 0);
  });
})();
