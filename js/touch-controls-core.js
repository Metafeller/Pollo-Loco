// js/touch-controls-core.js
(() => {
  /**
   * Shorthand for querySelector on document or a given root node.
   *
   * @param {string} sel - CSS selector.
   * @param {Document|HTMLElement} [root=document] - Optional root element.
   * @returns {Element|null} First matching element or null.
   */
  const $ = (sel, root = document) => root.querySelector(sel);

  const Icons = {
    burger: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/></svg>`,
    fs:     `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h4v2H9v2H7V3zm10 0v4h-2V5h-2V3h4zM7 17v4h4v-2H9v-2H7zm10 0h-2v2h-2v2h4v-4z"/></svg>`,
    left:   `<svg viewBox="0 0 24 24"><path d="M14 7l-5 5 5 5V7z"/></svg>`,
    right:  `<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5v10z"/></svg>`,
    jump:   `<svg viewBox="0 0 24 24"><path d="M12 3l3 6h-6l3-6zm-1 8h2v10h-2z"/></svg>`,
    bottle: `<svg viewBox="0 0 24 24"><path d="M10 2h4v3l2 2v15l-2 2h-4l-2-2V7l2-2V2z"/></svg>`,
    super:  `<svg viewBox="0 0 24 24"><path d="M12 2l2.4 6.8L22 9l-5 4 1.9 7L12 16l-6.9 4L7 13 2 9l7.6-.2z"/></svg>`
  };

  /**
   * Simple click SFX for mobile controls.
   * Respects global mute state.
   *
   * @returns {void}
   */
  function clickSfx() {
    try {
      if (window.IS_MUTED) return;
      const a = new Audio('/audio/bottle.mp3');
      a.volume = 0.8;
      a.play();
    } catch (_) {}
  }

  /**
   * Sets a Keyboard flag on/off.
   * Includes exclusive logic for LEFT/RIGHT for mobile D-pad.
   *
   * @param {keyof Keyboard} flagName - Keyboard flag name.
   * @param {boolean} on - Desired on/off state.
   * @returns {void}
   */
  function setKey(flagName, on) {
    const kb = window.KEYBOARD;
    if (!kb || !(flagName in kb)) return;

    if (flagName === 'LEFT' && on) {
      kb.RIGHT = false;
    } else if (flagName === 'RIGHT' && on) {
      kb.LEFT = false;
    }

    kb[flagName] = !!on;
  }

  const touchDirTimers = { LEFT: null, RIGHT: null };

  /**
   * Clears a directional key flag.
   *
   * @param {'LEFT'|'RIGHT'} flag - Direction flag to clear.
   * @returns {void}
   */
  function clearDir(flag) {
    setKey(flag, false);
  }

  /**
   * Cancels any pending auto-release timer for a direction.
   *
   * @param {'LEFT'|'RIGHT'} flag - Direction with a potential timer.
   * @returns {void}
   */
  function cancelDirTimer(flag) {
    const t = touchDirTimers[flag];
    if (!t) return;
    clearTimeout(t);
    touchDirTimers[flag] = null;
  }

  /**
   * Activates a directional key and clears existing timers.
   *
   * @param {'LEFT'|'RIGHT'} flag - Direction to activate.
   * @returns {void}
   */
  function activateDir(flag) {
    cancelDirTimer(flag);
    setKey(flag, true);
  }

  /**
   * Pointer/mouse down handler for a D-pad button.
   *
   * @param {PointerEvent|MouseEvent} e - Pointer or mouse event.
   * @param {HTMLButtonElement} btn - Button element.
   * @param {'LEFT'|'RIGHT'} flag - Direction flag.
   * @returns {void}
   */
  function handleDirBtnDown(e, btn, flag) {
    e.preventDefault();
    btn.setAttribute('data-active', '1');
    btn.__pressTs = performance.now();
    activateDir(flag);
  }

  /**
   * Applies release behaviour for a D-pad button after tap/hold detection.
   *
   * @param {HTMLButtonElement} btn - Button element.
   * @param {'LEFT'|'RIGHT'} flag - Direction flag.
   * @param {boolean} tapLike - True if interaction is a short tap.
   * @param {number} stickMs - Sticky duration in ms for tap-like presses.
   * @returns {void}
   */
  function runDirectionRelease(btn, flag, tapLike, stickMs) {
    if (!tapLike) {
      clearDir(flag);
      btn.removeAttribute('data-active');
      return;
    }

    cancelDirTimer(flag);
    touchDirTimers[flag] = setTimeout(() => {
      clearDir(flag);
      btn.removeAttribute('data-active');
      touchDirTimers[flag] = null;
    }, stickMs);
  }

  /**
   * Pointer/mouse up handler for a D-pad button.
   * Distinguishes between tap and hold gestures.
   *
   * @param {PointerEvent|MouseEvent} e - Pointer or mouse event.
   * @param {HTMLButtonElement} btn - Button element.
   * @param {'LEFT'|'RIGHT'} flag - Direction flag.
   * @param {{TAP_MAX_MS:number, STICK_MS:number}} param3 - Timing config.
   * @returns {void}
   */
  function handleDirBtnUp(e, btn, flag, { TAP_MAX_MS, STICK_MS }) {
    e.preventDefault();
    const now = performance.now();
    const ts = btn.__pressTs || now;
    btn.__pressTs = 0;
    const tapLike = (now - ts) <= TAP_MAX_MS;
    runDirectionRelease(btn, flag, tapLike, STICK_MS);
  }

  /**
   * Attaches pointer/mouse events for a direction button.
   *
   * @param {HTMLButtonElement} btn - D-pad button.
   * @param {(e:PointerEvent|MouseEvent)=>void} downEv - Handler for down.
   * @param {(e:PointerEvent|MouseEvent)=>void} upEv - Handler for up.
   * @returns {void}
   */
  function attachDirectionButtonEvents(btn, downEv, upEv) {
    btn.addEventListener('pointerdown', downEv);
    btn.addEventListener('pointerup', upEv);
    btn.addEventListener('pointercancel', upEv);
    btn.addEventListener('pointerleave', (e) => {
      if (!btn.hasAttribute('data-active')) return;
      upEv(e);
    });

    btn.addEventListener('mousedown', downEv);
    ['mouseup', 'mouseleave'].forEach(ev => btn.addEventListener(ev, upEv));
  }

  /**
   * Smart-tap for D-pad:
   * - Short tap → short sticky impulse (Pepe turns & steps a bit)
   * - Hold → classic hold movement
   *
   * @param {HTMLButtonElement} btn - D-pad button element.
   * @param {'LEFT'|'RIGHT'} flag - Direction flag controlled by this button.
   * @returns {void}
   */
  function wireDirectionButton(btn, flag) {
    if (!btn) return;

    const config = { TAP_MAX_MS: 170, STICK_MS: 140 };
    const downEv = (e) => handleDirBtnDown(e, btn, flag);
    const upEv   = (e) => handleDirBtnUp(e, btn, flag, config);

    attachDirectionButtonEvents(btn, downEv, upEv);
  }

  /**
   * Generic "hold" behavior for action buttons.
   *
   * @param {HTMLElement} btn - Button element.
   * @param {Function} down - Called on pointer/mouse down.
   * @param {Function} up - Called on pointer/mouse up.
   * @returns {void}
   */
  function hold(btn, down, up) {
    if (!btn) return;

    const downEv = (e) => {
      e.preventDefault();
      down();
      btn.setAttribute('data-active', '1');
    };

    const upEv = (e) => {
      e.preventDefault();
      up();
      btn.removeAttribute('data-active');
    };

    attachHoldEvents(btn, downEv, upEv);
  }

  /**
   * Attaches pointer/mouse handlers to implement "hold" behaviour.
   *
   * @param {HTMLElement} btn - Button element.
   * @param {(e:PointerEvent|MouseEvent)=>void} downEv - Handler for down.
   * @param {(e:PointerEvent|MouseEvent)=>void} upEv - Handler for up.
   * @returns {void}
   */
  function attachHoldEvents(btn, downEv, upEv) {
    btn.addEventListener('pointerdown', downEv);
    btn.addEventListener('pointerup', upEv);
    btn.addEventListener('pointercancel', upEv);
    btn.addEventListener('pointerleave', (e) => {
      if (btn.hasAttribute('data-active')) upEv(e);
    });

    btn.addEventListener('mousedown', downEv);
    ['mouseup', 'mouseleave'].forEach(ev => btn.addEventListener(ev, upEv));
  }

  /**
   * i18n helper for mobile strings.
   *
   * @param {string} key - Translation key.
   * @param {string} fallback - Fallback value if no translation exists.
   * @returns {string} Translated or fallback string.
   */
  function t(key, fallback) {
    try {
      return (window.I18N && typeof window.I18N.t === 'function')
        ? window.I18N.t(key) || fallback
        : fallback;
    } catch (_) {
      return fallback;
    }
  }

  /**
   * Returns true if the element is currently visible in the layout.
   *
   * @param {HTMLElement|null} el - Element to check.
   * @returns {boolean} True if visible, false otherwise.
   */
  function isVisible(el) {
    return !!el &&
      el.offsetParent !== null &&
      getComputedStyle(el).display !== 'none';
  }

  // Namespace-Export Overlay-Script
  window.TouchControlsCore = {
    $, Icons,
    clickSfx,
    setKey,
    wireDirectionButton,
    hold,
    t,
    isVisible
  };
})();
