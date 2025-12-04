(() => {
  const THRESHOLD = 300;

  const getEl = (id) => document.getElementById(id);

  function show(el) {
    if (!el.classList.contains('show')) el.classList.add('show');
  }

  function hide(el) {
    if (el.classList.contains('show')) el.classList.remove('show');
  }

  /**
   * Scrolls smoothly back to the top of the page.
   */
  function onClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Keyboard handler:
   * - Activates scroll-to-top on Enter/Space for accessibility.
   *
   * @param {KeyboardEvent} e
   */
  function onKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  /**
   * Initializes the scroll-to-top button behavior:
   * - Wires click/keyboard handlers
   * - Uses rAF throttling for scroll performance
   * - Applies initial visibility based on current scroll position
   */
  function init() {
    const btn = getEl('btn-to-top');
    if (!btn) return;

    btn.addEventListener('click', onClick);
    btn.addEventListener('keydown', onKeyDown);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY || document.documentElement.scrollTop;
          if (y > THRESHOLD) show(btn); else hide(btn);
          ticking = false;
        });
        ticking = true;
      }
    });

    const y0 = window.scrollY || document.documentElement.scrollTop;
    if (y0 > THRESHOLD) show(btn); else hide(btn);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
