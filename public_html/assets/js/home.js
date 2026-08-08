document.addEventListener('DOMContentLoaded', function () {
  const elementsToObserve = document.querySelectorAll('.text-container, .event-image');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      } else {
        entry.target.classList.remove('visible');
      }
    });
  }, {
    threshold: 0.3
  });

  elementsToObserve.forEach(element => {
    observer.observe(element);
  });

  initCategoryCarousel();
});

function initCategoryCarousel() {
  const track = document.querySelector('.category-track');
  const prevBtn = document.querySelector('.cat-prev');
  const nextBtn = document.querySelector('.cat-next');
  if (!track || !prevBtn || !nextBtn) return;

  const scrollStep = () => Math.min(track.clientWidth * 0.8, 480);

  const updateButtonState = () => {
    const maxScrollLeft = track.scrollWidth - track.clientWidth - 1;
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft >= maxScrollLeft;
  };

  const smoothScroll = (direction) => {
    track.scrollBy({ left: scrollStep() * direction, behavior: 'smooth' });
  };

  prevBtn.addEventListener('click', () => smoothScroll(-1));
  nextBtn.addEventListener('click', () => smoothScroll(1));

  track.addEventListener('scroll', updateButtonState, { passive: true });
  window.addEventListener('resize', updateButtonState);
  updateButtonState();
}
