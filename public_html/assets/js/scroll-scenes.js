(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = [];
  const targetMeta = new WeakMap();

  function parseRange(value, fallback) {
    if (!value) return fallback;
    const parts = value.split(',').map((v) => parseFloat(v.trim())).filter((v) => !Number.isNaN(v));
    if (!parts.length) return fallback;
    if (parts.length === 1) return [parts[0], parts[0]];
    return [parts[0], parts[1]];
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function collectTargets() {
    targets.length = 0;
    document.querySelectorAll('[data-scroll]').forEach((el) => {
      const scene = el.closest('[data-scene]') || document.body;
      const meta = {
        scene,
        x: parseRange(el.dataset.x, [0, 0]),
        y: parseRange(el.dataset.y, [0, 0]),
        scale: parseRange(el.dataset.scale, [1, 1]),
        rotate: parseRange(el.dataset.rotate, [0, 0]),
        opacity: parseRange(el.dataset.opacity, [1, 1]),
        blur: parseRange(el.dataset.blur, [0, 0])
      };
      el.style.willChange = 'transform, opacity, filter';
      targetMeta.set(el, meta);
      targets.push(el);
    });
  }

  function getProgress(scene) {
    if (scene === document.body) return 1;
    const rect = scene.getBoundingClientRect();
    const viewH = window.innerHeight || 1;
    const progress = (viewH - rect.top) / (rect.height + viewH);
    return clamp(progress, 0, 1);
  }

  let ticking = false;
  function update() {
    ticking = false;
    targets.forEach((el) => {
      const meta = targetMeta.get(el);
      if (!meta) return;
      const t = getProgress(meta.scene);
      const x = lerp(meta.x[0], meta.x[1], t);
      const y = lerp(meta.y[0], meta.y[1], t);
      const scale = lerp(meta.scale[0], meta.scale[1], t);
      const rotate = lerp(meta.rotate[0], meta.rotate[1], t);
      const opacity = lerp(meta.opacity[0], meta.opacity[1], t);
      const blur = lerp(meta.blur[0], meta.blur[1], t);
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rotate}deg)`;
      el.style.opacity = `${opacity}`;
      el.style.filter = blur ? `blur(${blur}px)` : 'none';
    });
  }

  function requestTick() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function init() {
    collectTargets();
    update();
    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', () => {
      collectTargets();
      requestTick();
    });
  }

  document.addEventListener('DOMContentLoaded', init, { once: true });
  document.addEventListener('partialsLoaded', () => {
    collectTargets();
    requestTick();
  });
})();
