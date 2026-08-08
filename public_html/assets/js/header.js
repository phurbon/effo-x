(function () {
  let initialized = false;

  function initSiteHeader() {
    if (initialized) return;
    const header = document.querySelector('header.header');
    if (!header) return;
    const nav = header.querySelector('.navbar');
    const triggers = header.querySelectorAll('.menu-trigger');
    const panels = header.querySelectorAll('.mega');
    const backdrop = header.querySelector('.nav-backdrop');
    const navToggle = header.querySelector('.nav-toggle');

    if (!nav || !triggers.length || !panels.length || !backdrop) return;
    initialized = true;

    const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

    const setNavH = () => {
      const h = nav.getBoundingClientRect().height + 'px';
      document.documentElement.style.setProperty('--nav-h', h);
    };
    setNavH();

    function openMobileNav() {
      header.classList.add('mobile-open');
      document.body.classList.add('no-scroll');
      navToggle?.setAttribute('aria-expanded', 'true');
    }
    function closeMobileNav(resetPanel = true) {
      header.classList.remove('mobile-open');
      document.body.classList.remove('no-scroll');
      navToggle?.setAttribute('aria-expanded', 'false');
      if (resetPanel) closePanel();
    }

    const handleResize = () => {
      setNavH();
      if (!isMobile()) {
        closeMobileNav(false);
        closePanel();
      }
    };
    window.addEventListener('resize', handleResize);

    let hoverTimer;
    function openPanel(id) {
      panels.forEach(p => {
        const isTarget = p.id === id;
        p.toggleAttribute('hidden', !isTarget);
        p.removeAttribute('aria-current');
        if (isTarget) p.setAttribute('aria-current', 'open');
      });
      header.classList.add('nav-open');
      triggers.forEach(t => t.setAttribute('aria-expanded', t.getAttribute('aria-controls') === id ? 'true' : 'false'));
      if (id === 'panel-search') {
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    }
    function closePanel() {
      header.classList.remove('nav-open');
      panels.forEach(p => { p.setAttribute('hidden', ''); p.removeAttribute('aria-current'); });
      triggers.forEach(t => t.setAttribute('aria-expanded', 'false'));
    }

    navToggle?.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    triggers.forEach(trigger => {
      const panelId = trigger.getAttribute('aria-controls');
      trigger.addEventListener('mouseenter', () => {
        if (isMobile()) return;
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => openPanel(panelId), 100);
      });
      trigger.addEventListener('focus', () => {
        if (isMobile()) return;
        openPanel(panelId);
      });
      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        if (isOpen) { closePanel(); }
        else { openPanel(panelId); }
      });
    });

    header.addEventListener('mouseleave', () => {
      if (isMobile()) return;
      hoverTimer = setTimeout(closePanel, 200);
    });
    header.addEventListener('mouseenter', () => {
      if (isMobile()) return;
      clearTimeout(hoverTimer);
    });
    backdrop.addEventListener('click', () => {
      closePanel();
      closeMobileNav();
    });
    document.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        closePanel();
        closeMobileNav();
      }
    });

    header.addEventListener('click', (event) => {
      if (!isMobile()) return;
      const target = event.target.closest('a, button');
      if (!target) return;
      if (
        target.classList.contains('menu-trigger') ||
        target.classList.contains('nav-toggle')
      ) return;
      closeMobileNav();
    });
  }

  document.addEventListener('partialsLoaded', initSiteHeader);
  window.initSiteHeader = initSiteHeader;
})();
