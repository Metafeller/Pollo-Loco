// js/ui-frame-overlay.js
(() => {
  const core = window.UiFrameCore;
  if (!core) return;

  const {
    $, on,
    play,
    placeStartScreen,
    placeOverlayCard
  } = core;

  /**
   * Returns focusable elements inside an overlay card.
   *
   * @param {HTMLElement} card - Overlay card container.
   * @returns {HTMLElement[]} Focusable elements.
   */
  function getOverlayFocusables(card) {
    if (!card) return [];
    const nodes = card.querySelectorAll(
      'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    return Array.from(nodes).filter(el =>
      !el.hasAttribute('disabled') &&
      !el.getAttribute('aria-hidden')
    );
  }

  /**
   * Handles TAB navigation within an overlay focus trap.
   *
   * @param {KeyboardEvent} e - Key event.
   * @param {HTMLElement[]} focusables - Focusable elements list.
   * @returns {void}
   */
  function handleOverlayTab(e, focusables) {
    if (focusables.length === 0) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /**
   * Handles overlay keydown:
   * - ESC closes overlay
   * - TAB is trapped inside overlay card
   *
   * @param {KeyboardEvent} e - Key event.
   * @param {HTMLElement} overlay - Overlay root element.
   * @param {HTMLElement} card - Overlay card element.
   * @returns {void}
   */
  function handleOverlayKeydown(e, overlay, card) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close(overlay.id);
      return;
    }
    if (e.key !== 'Tab') return;

    const f = getOverlayFocusables(card);
    handleOverlayTab(e, f);
  }

  /**
   * Sets initial focus for an overlay:
   * focuses first focusable element or the card itself.
   *
   * @param {HTMLElement} card - Overlay card element.
   * @returns {void}
   */
  function setInitialOverlayFocus(card) {
    const first = getOverlayFocusables(card)[0] || card;
    if (first && typeof first.focus === 'function') {
      first.focus();
    }
  }

  /**
   * Installs a focus trap and ESC handler inside an overlay.
   *
   * @param {HTMLElement} overlay - Overlay root element.
   * @returns {void}
   */
  function trap(overlay) {
    const card = overlay.querySelector('.overlay-card');
    if (!card) return;

    const handler = (e) => handleOverlayKeydown(e, overlay, card);

    overlay.__trap = handler;
    overlay.addEventListener('keydown', handler);
    setTimeout(() => setInitialOverlayFocus(card), 10);
  }

  /**
   * Removes a previously installed focus trap from an overlay.
   *
   * @param {HTMLElement} overlay - Overlay root element.
   * @returns {void}
   */
  function untrap(overlay) {
    if (!overlay || !overlay.__trap) return;
    overlay.removeEventListener('keydown', overlay.__trap);
    delete overlay.__trap;
  }

  /**
   * Opens an overlay by ID:
   * - Positions overlay card
   * - Shows overlay
   * - Installs focus trap
   * - Pauses world (if running)
   *
   * @param {string} id - Overlay element ID.
   * @returns {void}
   */
  function open(id) {
    const ov = $(id);
    if (!ov) return;

    const card = ov.querySelector('.overlay-card');
    placeOverlayCard(card);

    ov.classList.add('show');
    ov.removeAttribute('hidden');
    trap(ov);

    try {
      window.world?.setPaused(true);
    } catch (e) {}
  }

  /**
   * Closes overlay by ID and removes its focus trap.
   *
   * @param {string} id - Overlay element ID.
   * @returns {void}
   */
  function close(id) {
    const ov = $(id);
    if (!ov) return;

    ov.classList.remove('show');
    ov.setAttribute('hidden', '');
    untrap(ov);
  }

  /**
   * Wires header buttons (rules, contact, social, brand logo).
   *
   * @returns {void}
   */
  function wireHeaderButtons() {
    on($('btn-rules'), 'click', (e) => {
      e.preventDefault();
      play('rules');
      open('rules-overlay');
    });

    on($('btn-contact'), 'click', () => play('cta'));
    on($('lnk-github'),  'click', () => play());
    on($('lnk-linkedin'),'click', () => play());
    on($('lnk-instagram'),'click', () => play());

    const logo = document.querySelector('.brand-logo');
    on(logo, 'click', () => play('logo'));
  }

  /**
   * Wires footer buttons for Imprint and Privacy overlays.
   *
   * @returns {void}
   */
  function wireFooterButtons() {
    on($('btn-imprint'), 'click', () => {
      play();
      open('imprint-overlay');
    });

    on($('btn-privacy'), 'click', () => {
      play();
      open('privacy-overlay');
    });
  }

  /**
   * Wires close buttons (data-close) inside overlays.
   *
   * @returns {void}
   */
  function wireOverlayCloseButtons() {
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ov = btn.closest('.overlay');
        if (ov) close(ov.id);
      });
    });
  }

  /**
   * Wires mask click behaviour for Imprint and Privacy overlays.
   *
   * @returns {void}
   */
  function wireOverlayMaskClose() {
    document
      .querySelectorAll('#imprint-overlay .overlay-mask, #privacy-overlay .overlay-mask')
      .forEach(mask => {
        mask.addEventListener('click', () => {
          const ov = mask.closest('.overlay');
          if (ov) close(ov.id);
        });
      });
  }

  /**
   * Wires header/footer UI:
   * - Header buttons with SFX
   * - Footer overlays
   * - Close buttons + mask-close behaviour
   *
   * @returns {void}
   */
  function wireHeaderFooter() {
    wireHeaderButtons();
    wireFooterButtons();
    wireOverlayCloseButtons();
    wireOverlayMaskClose();
  }

  /**
   * Icon hover swap for header social icons.
   * Uses data-hv attribute as hover image source.
   *
   * @returns {void}
   */
  function hoverSwapIcons() {
    document.querySelectorAll('.icon-link img').forEach(img => {
      const hv = img.getAttribute('data-hv');
      if (!hv) return;

      img.addEventListener('mouseenter', () => {
        img.__orig = img.src;
        img.src = hv;
      });

      img.addEventListener('mouseleave', () => {
        if (img.__orig) img.src = img.__orig;
      });
    });
  }

  /**
   * Repositions all overlay cards to match current layout.
   *
   * @returns {void}
   */
  function syncAllOverlayCards() {
    document
      .querySelectorAll('.overlay-card')
      .forEach(placeOverlayCard);
  }

  /**
   * Registers window/scroll listeners to keep overlays and start screen in sync.
   *
   * @returns {void}
   */
  function keepSynced() {
    const syncOverlays = () => syncAllOverlayCards();
    const syncStart = () => placeStartScreen();

    window.addEventListener('resize', () => {
      syncOverlays();
      syncStart();
    });

    window.addEventListener('scroll', () => {
      syncOverlays();
      syncStart();
    }, true);
  }

  /**
   * Global ESC fallback:
   * - Closes the top-most open overlay (including Rules) when ESC is pressed.
   *
   * @returns {void}
   */
  function wireGlobalEsc() {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;

      const openOverlays = Array.from(
        document.querySelectorAll('.overlay.show')
      );
      if (!openOverlays.length) return;

      const top = openOverlays[openOverlays.length - 1];
      e.preventDefault();
      close(top.id);
    });
  }

  /**
   * Observes runtime changes of the canvas size and keeps
   * the start-screen box in sync.
   *
   * @returns {void}
   */
  function observeCanvasBox() {
    const c = document.querySelector('#canvas');
    if (!c || typeof ResizeObserver === 'undefined') return;

    const ro = new ResizeObserver(() => {
      placeStartScreen();
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
      });
    });

    ro.observe(c);
  }

  /**
   * Initialises UI frame wiring once the DOM is ready.
   *
   * @returns {void}
   */
  function initUiFrameOnDomReady() {
    wireHeaderFooter();
    hoverSwapIcons();
    keepSynced();
    wireGlobalEsc();
    placeStartScreen();
    requestAnimationFrame(placeStartScreen);
    setTimeout(placeStartScreen, 60);
    setTimeout(placeStartScreen, 160);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        placeStartScreen();
        setTimeout(placeStartScreen, 50);
      });
    }

    observeCanvasBox();
  }

  /**
   * Registers global window-level listeners
   * to keep the start screen aligned.
   *
   * @returns {void}
   */
  function wireGlobalLayoutListeners() {
    window.addEventListener('load', () => {
      placeStartScreen();
      setTimeout(placeStartScreen, 50);
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(placeStartScreen, 80);
      setTimeout(placeStartScreen, 220);
    });
  }

  document.addEventListener('DOMContentLoaded', initUiFrameOnDomReady);
  wireGlobalLayoutListeners();
})();
