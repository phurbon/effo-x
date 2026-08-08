(() => {
  function getScrollAmount(track) {
    const card = track.querySelector('.partner-card');
    if (!card) return 320;
    const styles = window.getComputedStyle(track);
    const gapValue = parseFloat(styles.gap || styles.columnGap || '0');
    return card.offsetWidth + (Number.isNaN(gapValue) ? 0 : gapValue);
  }

  function updateButtons(track, prevBtn, nextBtn) {
    const maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 4;
    nextBtn.disabled = track.scrollLeft >= maxScroll - 4;
  }

  function initCarousel(wrapper) {
    const track = wrapper.querySelector('[data-partners-track]');
    const controls = wrapper.closest('section')?.querySelector('[data-partners-controls]') || wrapper;
    const prevBtn = controls.querySelector('.carousel-btn.prev');
    const nextBtn = controls.querySelector('.carousel-btn.next');
    if (!track || !prevBtn || !nextBtn) return;

    const scrollByAmount = () => getScrollAmount(track);

    prevBtn.addEventListener('click', () => {
      track.scrollBy({ left: -scrollByAmount(), behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      track.scrollBy({ left: scrollByAmount(), behavior: 'smooth' });
    });

    const onScroll = () => updateButtons(track, prevBtn, nextBtn);
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-partners-carousel]').forEach(initCarousel);
  });
})();
