// js/ui-frame-core.js
(() => {
  const $  = (id) => document.getElementById(id);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, { passive: false });

  const sfxDefault = new Audio('/audio/bottle.mp3');
  const sfxCTA     = new Audio('/audio/lets-go.mp3');
  const sfxRules   = new Audio('/audio/rooster-cry.mp3');
  const sfxLogo    = new Audio('/audio/chicken-noise.mp3');

  [sfxDefault, sfxCTA, sfxRules, sfxLogo].forEach(a => {
    try { a.volume = 0.8; } catch (e) {}
  });

  window.__UI_AUDIOS = window.__UI_AUDIOS || [];
  window.__UI_AUDIOS.push(sfxDefault, sfxCTA, sfxRules, sfxLogo);

  let clickLock = false;

  /**
   * Plays a small UI sound effect depending on type.
   * Respects global mute state and throttles rapid re-triggering.
   *
   * @param {'cta'|'rules'|'logo'|string} type - Effect type key.
   * @returns {void}
   */
  function play(type) {
    if (window.IS_MUTED || clickLock) return;
    clickLock = true;
    setTimeout(() => { clickLock = false; }, 220);

    try {
      const a =
        type === 'cta'   ? sfxCTA   :
        type === 'rules' ? sfxRules :
        type === 'logo'  ? sfxLogo  :
        sfxDefault;

      a.currentTime = 0;
      a.play();
    } catch (e) {}
  }

  /**
   * Returns the current canvas client rectangle.
   *
   * @returns {{left:number,top:number,w:number,h:number}|null}
   */
  function canvasRect() {
    const c = document.querySelector('#canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  }

  /**
   * Keeps the start screen exactly aligned with the #stage area.
   * The start-screen fills the stage, not the whole viewport.
   *
   * @returns {void}
   */
  function placeStartScreen() {
    const ss = document.querySelector('.start-screen');
    const stage = document.getElementById('stage');
    if (!ss || !stage) return;

    ss.style.left = '0';
    ss.style.top  = '0';
    ss.style.width  = `${stage.clientWidth}px`;
    ss.style.height = `${stage.clientHeight}px`;
  }

  /**
   * Computes a "safe" vertical area between header and footer
   * within the viewport for displaying overlays.
   *
   * @returns {{top:number,bottom:number,height:number}}
   */
  function overlaySafeBox() {
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    let top = 0;
    let bottom = vh;

    const header = document.querySelector('.header-bar');
    const footer = document.querySelector('.footer-bar');

    if (header) {
      const r = header.getBoundingClientRect();
      top = Math.max(top, r.bottom);
    }

    if (footer) {
      const r = footer.getBoundingClientRect();
      bottom = Math.min(bottom, r.top);
    }

    const height = Math.max(0, bottom - top);
    return { top, bottom, height };
  }

  /**
   * Sizes an overlay card for mobile UI:
   * - Full width minus small margins
   * - Uses safe box between header/footer
   *
   * @param {HTMLElement} card - Overlay card element.
   * @returns {void}
   */
  function sizeOverlayMobile(card) {
    const marginX = 8;
    const marginY = 8;

    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const safe = overlaySafeBox();

    const width = Math.max(0, vw - marginX * 2);
    const innerTop = safe.top + marginY;
    const innerHeight = Math.max(0, safe.height - marginY * 2);

    card.style.left   = `${marginX}px`;
    card.style.top    = `${innerTop}px`;
    card.style.width  = `${width}px`;
    card.style.height = `${innerHeight}px`;
  }

  /**
   * Sizes an overlay card for desktop UI:
   * - Matches canvas width if possible, otherwise up to 720px centered
   * - Uses safe box between header/footer
   *
   * @param {HTMLElement} card - Overlay card element.
   * @returns {void}
   */
  function sizeOverlayDesktop(card) {
    const marginY = 16;

    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const safe = overlaySafeBox();
    const rect = canvasRect();

    let width = Math.min(720, vw);
    let left = Math.max(0, (vw - width) / 2);

    if (rect) {
      width = rect.w;
      left  = rect.left;
    }

    const innerTop = safe.top + marginY;
    const innerHeight = Math.max(0, safe.height - marginY * 2);

    card.style.left   = `${left}px`;
    card.style.top    = `${innerTop}px`;
    card.style.width  = `${width}px`;
    card.style.height = `${innerHeight}px`;
  }

  /**
   * Positions an overlay card (Rules / Imprint / Privacy) based on UI mode.
   *
   * @param {HTMLElement} card - Overlay card element.
   * @returns {void}
   */
  function placeOverlayCard(card) {
    if (!card) return;
    const body = document.body;
    const isMobileUi = body && body.classList.contains('is-mobile-ui');

    if (isMobileUi) {
      sizeOverlayMobile(card);
    } else {
      sizeOverlayDesktop(card);
    }
  }

  // Export Core-API für das Overlay-Script
  window.UiFrameCore = {
    $, on,
    play,
    canvasRect,
    placeStartScreen,
    placeOverlayCard
  };
})();
