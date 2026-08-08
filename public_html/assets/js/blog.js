(function () {
  const postsArray = Array.isArray(window.EFFO_BLOG_POSTS) ? window.EFFO_BLOG_POSTS : [];
  const posts = new Map();
  const slugIndex = new Map();

  postsArray.forEach((post) => {
    if (!post || !post.id) return;
    const images = Array.isArray(post.images)
      ? post.images
          .filter((img) => img && typeof img.src === 'string')
          .map((img) => ({
            src: img.src,
            alt: img.alt || post.heroAlt || post.title || ''
          }))
      : [];
    const normalised = {
      ...post,
      images
    };
    posts.set(post.id, normalised);
    if (post.slug) {
      slugIndex.set(post.slug, post.id);
    }
  });

  if (!posts.size) return;

  const ready = () => {
    initBlogHome();
    initBlogPost();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ready, { once: true });
  } else {
    ready();
  }

  function initBlogHome() {
    const cards = document.querySelectorAll('.blog-post[data-post-id]');
    if (!cards.length) return;

    cards.forEach((card) => {
      const data = posts.get(card.dataset.postId);
      if (!data) return;

      const img = card.querySelector('.thumb img');
      const first = data.images?.[0];
      if (img && first) {
        if (first.src && img.getAttribute('src') !== first.src) {
          img.src = first.src;
        }
        if (typeof first.alt === 'string') {
          img.alt = first.alt;
        }
        img.loading = img.loading || 'lazy';
        img.decoding = img.decoding || 'async';
      }

      const title = card.querySelector('h2');
      if (title && data.title) {
        title.textContent = data.title;
      }

      const date = card.querySelector('.date');
      if (date && data.date) {
        date.textContent = data.date;
      }

      const excerpt = card.querySelector('.excerpt');
      if (excerpt && data.excerpt) {
        excerpt.textContent = data.excerpt;
      }

      const cta = card.querySelector('.read-more');
      if (cta) {
        cta.href = `pages/blogPost.html?id=${encodeURIComponent(data.id)}`;
      }
    });
  }

  function initBlogPost() {
    const container = document.querySelector('.post-container[data-post-id]');
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const requested = (params.get('id') || params.get('slug') || '').trim();
    const fallbackId = container.dataset.postId;

    let postData = requested ? posts.get(requested) : null;
    if (!postData && requested) {
      const bySlug = slugIndex.get(requested);
      if (bySlug) {
        postData = posts.get(bySlug);
      }
    }
    if (!postData && fallbackId) {
      postData = posts.get(fallbackId);
    }
    if (!postData) {
      const firstEntry = posts.values().next();
      postData = firstEntry && !firstEntry.done ? firstEntry.value : null;
    }
    if (!postData) return;

    container.dataset.postId = postData.id;

    const titleEl = container.querySelector('[data-role="post-title"]');
    if (titleEl && postData.title) {
      titleEl.textContent = postData.title;
    }

    const dateEl = container.querySelector('[data-role="post-date"]');
    if (dateEl) {
      if (postData.date) {
        dateEl.textContent = postData.date;
        dateEl.hidden = false;
      } else {
        dateEl.hidden = true;
      }
    }

    const tagsWrap = container.querySelector('[data-role="post-tags"]');
    if (tagsWrap) {
      tagsWrap.innerHTML = '';
      if (Array.isArray(postData.tags) && postData.tags.length) {
        postData.tags.forEach((tag, idx) => {
          const chip = document.createElement('span');
          chip.className = idx === 0 ? 'tag tag--accent' : 'tag';
          chip.textContent = tag;
          tagsWrap.appendChild(chip);
        });
        tagsWrap.hidden = false;
      } else {
        tagsWrap.hidden = true;
      }
    }

    const bodyEl = container.querySelector('[data-role="post-body"]');
    if (bodyEl && postData.bodyHtml) {
      bodyEl.innerHTML = postData.bodyHtml;
    }

    const media = container.querySelector('.post-media');
    if (!media) return;

    const hero = media.querySelector('[data-role="hero"]') || media.querySelector('img');
    if (hero && postData.images?.length) {
      const first = postData.images[0];
      setHero(hero, first);
    }

    initGallery(container, postData, hero);
  }

  function initGallery(container, postData, heroImg) {
    const gallery = container.querySelector('[data-role="post-gallery"]');
    if (!gallery) return;

    const main = gallery.querySelector('[data-role="gallery-main"]') || heroImg;
    const thumbsWrap = gallery.querySelector('[data-role="gallery-thumbs"]');
    const prevBtn = gallery.querySelector('[data-role="gallery-prev"]');
    const nextBtn = gallery.querySelector('[data-role="gallery-next"]');

    const images = Array.isArray(postData.images) ? postData.images : [];
    if (!main || !thumbsWrap || !images.length) {
      gallery.hidden = true;
      return;
    }

    thumbsWrap.innerHTML = '';
    let index = 0;

    const setActive = (nextIndex) => {
      if (!images.length) return;
      index = (nextIndex + images.length) % images.length;
      const image = images[index];
      if (!image) return;
      if (image.src && main.getAttribute('src') !== image.src) {
        main.src = image.src;
      }
      const altText = typeof image.alt === 'string' ? image.alt : postData.title || '';
      main.alt = altText;
      main.dataset.index = String(index);
      const buttons = thumbsWrap.querySelectorAll('button[data-index]');
      buttons.forEach((btn) => {
        const active = Number(btn.dataset.index) === index;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    };

    images.forEach((image, idx) => {
      if (!image || !image.src) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-thumb';
      button.dataset.index = String(idx);
      button.setAttribute('aria-label', `Select photo ${idx + 1}`);
      button.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
      const img = document.createElement('img');
      img.src = image.src;
      img.alt = image.alt || postData.title || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      button.appendChild(img);
      button.addEventListener('click', () => setActive(idx));
      thumbsWrap.appendChild(button);
    });

    const hasMany = images.length > 1;
    if (prevBtn) {
      prevBtn.disabled = !hasMany;
      prevBtn.addEventListener('click', () => setActive(index - 1));
    }
    if (nextBtn) {
      nextBtn.disabled = !hasMany;
      nextBtn.addEventListener('click', () => setActive(index + 1));
    }

    if (!hasMany) {
      thumbsWrap.hidden = true;
    }

    setActive(0);
  }

  function setHero(imgEl, image) {
    if (!image) return;
    if (image.src) {
      imgEl.src = image.src;
      imgEl.dataset.loadedSrc = image.src;
    }
    const altText = typeof image.alt === 'string' ? image.alt : '';
    imgEl.alt = altText;
    imgEl.setAttribute('aria-label', altText || 'Blog post image');
    imgEl.loading = imgEl.loading || 'lazy';
    imgEl.decoding = imgEl.decoding || 'async';
  }
})();
