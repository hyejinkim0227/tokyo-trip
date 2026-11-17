(function () {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('details').forEach(details => {
    const summary = details.querySelector(':scope > summary');
    if (!summary) return;
    let animation = null;
    let targetOpen = details.open;
    function clearStyles() {
      details.style.height = '';
      details.style.overflow = '';
    }
    function settle() {
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
        animation = null;
      }
      details.open = targetOpen;
      clearStyles();
    }
    summary.addEventListener('click', event => {
      // Leave links and other controls inside a summary to their own actions.
      if (event.target.closest('a,button,input,select,textarea')) return;
      if (event.defaultPrevented) return;
      if (reducedMotion.matches || typeof details.animate !== 'function') {
        if (animation) settle();
        return;
      }
      event.preventDefault();
      if (!animation) targetOpen = details.open;
      targetOpen = !targetOpen;
      const startHeight = details.getBoundingClientRect().height;
      if (animation) {
        animation.onfinish = null;
        animation.cancel();
      }
      // Measure both natural states, then keep content mounted while closing.
      details.style.height = '';
      details.open = targetOpen;
      const endHeight = details.getBoundingClientRect().height;
      details.open = true;
      details.style.height = startHeight + 'px';
      details.style.overflow = 'hidden';
      animation = details.animate(
        [{ height: startHeight + 'px' }, { height: endHeight + 'px' }],
        { duration: 260, easing: 'cubic-bezier(.22,.61,.36,1)' }
      );
      animation.onfinish = settle;
    });
    // Layout changes must not leave an animated panel clipped.
    window.addEventListener('resize', () => { if (animation) settle(); });
    reducedMotion.addEventListener('change', () => { if (animation) settle(); });
  });
}());
