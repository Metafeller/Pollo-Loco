(() => {
  const THRESHOLD = 300; // ab 300px Scroll-Tiefe anzeigen

  function getEl(id){ return document.getElementById(id); }

  function show(el){
    if (!el.classList.contains('show')) el.classList.add('show');
  }

  function hide(el){
    if (el.classList.contains('show')) el.classList.remove('show');
  }

  function onClick(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onKeyDown(e){
    // Accessibility: Enter/Space aktivieren
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  function init(){
    const btn = getEl('btn-to-top');
    if (!btn) return;

    // Click + Keyboard
    btn.addEventListener('click', onClick);
    btn.addEventListener('keydown', onKeyDown);

    // Performantes Scroll-Handling (rAF Throttle)
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

    // Initialer Zustand beim Laden
    const y0 = window.scrollY || document.documentElement.scrollTop;
    if (y0 > THRESHOLD) show(btn); else hide(btn);
  }

  // Start
  document.addEventListener('DOMContentLoaded', init);
})();
