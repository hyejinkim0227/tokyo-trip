(function () {
  'use strict';
  const button = document.getElementById('back-to-top');
  if (!button) return;
  let scheduled = false;
  function update() {
    const visible = window.scrollY > 320;
    if (!visible && document.activeElement === button) {
      const top = document.getElementById('page-top');
      if (top) top.focus({ preventScroll: true });
    }
    button.hidden = !visible;
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
  window.addEventListener('pageshow', update);
  button.addEventListener('click', () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
    const top = document.getElementById('page-top');
    if (top) top.focus({ preventScroll: true });
  });
  update();
}());
