(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const MOBILE_MAX_WIDTH = 1368;

  let isMobile = false;
  let uiBar = null;
  let uiBarOrigParent = null;
  let uiBarOrigNext = null;

  /**
   * Ensures the `.canvas-ui` overlay container exists.
   * This is the main DOM host for rotate overlays and mobile controls.
   *
   * @returns {HTMLDivElement} The canvas-ui host element.
   */
  function ensureCanvasOverlay() {
    const root = document.getElementById('stage') || document.body;
    let host = root.querySelector('.canvas-ui');
    if (!host) {
      host = document.createElement('div');
      host.className = 'canvas-ui';
      root.appendChild(host);
    }
    return host;
  }

  /**
   * Ensures the "rotate your device" overlay exists.
   * The text is i18n-aware via window.I18N.
   *
   * @returns {HTMLDivElement} The rotate overlay element.
   */
  function ensureRotateOverlay() {
    const host = ensureCanvasOverlay();
    let ov = host.querySelector('#rotate-overlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'rotate-overlay';
      ov.innerHTML = `
        <div class="card">
          <h3>${t('mobile.rotateTitle', 'Landscape required')}</h3>
          <p>${t('mobile.rotateBody', 'Rotate your device to play.')}</p>
        </div>`;
      host.appendChild(ov);
    }
    return ov;
  }

  /**
   * Small helper for i18n lookups with a safe fallback.
   *
   * @param {string} key
   * @param {string} fallback
   * @returns {string}
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
   * Keeps the canvas overlay aligned to the full stage area.
   * (This wrapper simply stretches over the entire host container.)
   *
   * @returns {void}
   */
  function syncCanvasOverlayBox() {
    const host = ensureCanvasOverlay();
    if (!host) return;
    host.style.left = '0';
    host.style.top = '0';
    host.style.width = '100%';
    host.style.height = '100%';
  }

  /**
   * IMPORTANT: In fullscreen mode, the mobile UI stays active
   * regardless of touch presence or viewport size hints.
   *
   * @returns {boolean} True if we should run "mobile UI" mode.
   */
  function detectMobile() {
    const fs = document.body.classList.contains('fs-active');
    return (window.innerWidth <= MOBILE_MAX_WIDTH) || fs;
  }

  /**
   * Checks if the viewport is currently in portrait orientation.
   *
   * @returns {boolean}
   */
  function isPortrait() {
    const mq = window.matchMedia && window.matchMedia('(orientation: portrait)');
    if (mq && 'matches' in mq) return mq.matches;
    return window.innerHeight >= window.innerWidth;
  }

  /**
   * Updates body CSS flags for responsive logic:
   * - is-mobile-ui / is-desktop-ui
   * - is-portrait / is-landscape
   *
   * @returns {void}
   */
  function setBodyFlags() {
    document.body.classList.toggle('is-mobile-ui', isMobile);
    document.body.classList.toggle('is-desktop-ui', !isMobile);
    document.body.classList.toggle('is-portrait', isMobile && isPortrait());
    document.body.classList.toggle('is-landscape', isMobile && !isPortrait());
  }

  /**
   * Returns true if the rotate overlay should be visible.
   *
   * @returns {boolean}
   */
  function shouldShowRotateOverlay() {
    return isMobile && isPortrait();
  }

  /**
   * Updates the DOM visibility of the rotate overlay.
   *
   * @param {HTMLElement} ov
   * @param {boolean} show
   * @returns {boolean} true if visibility changed
   */
  function updateRotateOverlayDom(ov, show) {
    if (!ov) return false;
    const wasShown = ov.classList.contains('show');
    if (show === wasShown) return false;
    ov.classList.toggle('show', show);
    return true;
  }

  /**
   * Remembers whether the world was paused before
   * the rotate overlay became visible.
   *
   * @param {Window} globalObj
   * @param {boolean} hasWorld
   * @returns {void}
   */
  function rememberRotatePauseState(globalObj, hasWorld) {
    if (!hasWorld || typeof world === 'undefined') {
      globalObj.__ROTATE_PREV_WAS_PAUSED__ = false;
      return;
    }
    globalObj.__ROTATE_PREV_WAS_PAUSED__ = !!world.paused;
  }

  /**
   * Pauses the world if it is currently running.
   *
   * @param {boolean} hasWorld
   * @returns {void}
   */
  function pauseWorldIfNeeded(hasWorld) {
    if (!hasWorld || !world || world.paused) return;

    if (typeof window.pauseGame === 'function') {
      window.pauseGame();
    } else if (typeof world.setPaused === 'function') {
      world.setPaused(true);
    }
  }

  /**
   * Resumes the world when rotate overlay closes,
   * but only if it was not paused before.
   *
   * @param {Window} globalObj
   * @param {boolean} hasWorld
   * @returns {void}
   */
  function resumeWorldIfNeeded(globalObj, hasWorld) {
    if (!hasWorld || !world || !world.paused) {
      globalObj.__ROTATE_PREV_WAS_PAUSED__ = null;
      return;
    }

    const wasPausedBefore = !!globalObj.__ROTATE_PREV_WAS_PAUSED__;
    globalObj.__ROTATE_PREV_WAS_PAUSED__ = null;
    if (wasPausedBefore) return;

    if (typeof window.resumeGame === 'function') {
      window.resumeGame();
    } else if (typeof world.setPaused === 'function') {
      world.setPaused(false);
    }
  }

  /**
   * Handles pause/resume side effects when the rotate
   * overlay visibility changes.
   *
   * @param {boolean} show
   * @returns {void}
   */
  function handleRotateOverlayStateChange(show) {
    const g = window;
    const hasWorld = (typeof world !== 'undefined') && !!world;

    g.__ROTATE_OVERLAY_VISIBLE__ = show;

    if (show) {
      rememberRotatePauseState(g, hasWorld);
      pauseWorldIfNeeded(hasWorld);
    } else {
      resumeWorldIfNeeded(g, hasWorld);
    }
  }

  /**
   * Shows/hides the rotate overlay and handles auto pause/resume:
   * - When overlay becomes visible: pause world (remember previous pause state)
   * - When overlay hides: auto-resume only if game was NOT paused before
   *
   * @returns {void}
   */
  function applyRotateOverlay() {
    const ov = ensureRotateOverlay();
    const show = shouldShowRotateOverlay();
    const changed = updateRotateOverlayDom(ov, show);
    if (!changed) return;
    handleRotateOverlayStateChange(show);
  }

  /**
   * Docks the #ui-bar either into the mobile dock or back into
   * its original desktop position.
   *
   * @returns {void}
   */
  function dockUiBar() {
    uiBar = uiBar || $('#ui-bar');
    if (!uiBar) return;

    if (!uiBarOrigParent) {
      uiBarOrigParent = uiBar.parentElement;
      uiBarOrigNext = uiBar.nextElementSibling;
    }

    if (isMobile) {
      const dock = $('#mobile-ui-dock') || $('#mobile-ui-dock', ensureCanvasOverlay());
      if (dock && uiBar.parentElement !== dock) {
        dock.appendChild(uiBar);
      }
    } else if (uiBarOrigParent && uiBar.parentElement !== uiBarOrigParent) {
      if (uiBarOrigNext && uiBarOrigNext.parentElement === uiBarOrigParent) {
        uiBarOrigParent.insertBefore(uiBar, uiBarOrigNext);
      } else {
        uiBarOrigParent.appendChild(uiBar);
      }
    }
  }

  /**
   * Watches fullscreen changes and keeps the overlay aligned
   * when entering/leaving fullscreen.
   *
   * @returns {void}
   */
  function installFullscreenWatch() {
    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange']
      .forEach((ev) => {
        document.addEventListener(ev, () => {
          const fs = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.msFullscreenElement
          );

          document.body.classList.toggle('fs-active', !!fs);
          setTimeout(syncCanvasOverlayBox, 50);
          setTimeout(syncCanvasOverlayBox, 250);
        });
      });
  }

  /**
   * Installs all position-related listeners:
   * - resize / scroll / orientationchange → reposition overlays
   * - i18n:changed → update rotate overlay text
   * - mc:dock-ready → re-dock ui bar when mobile dock is created
   *
   * @returns {void}
   */
  function installPositionSync() {
    window.addEventListener('resize', onResizeOrient, { passive: true });
    window.addEventListener('scroll', () => { syncCanvasOverlayBox(); }, true);
    window.addEventListener('orientationchange', onResizeOrient);

    window.addEventListener('i18n:changed', () => {
      const ov = ensureRotateOverlay();
      ov.querySelector('h3').textContent =
        t('mobile.rotateTitle', 'Landscape required');
      ov.querySelector('p').textContent =
        t('mobile.rotateBody', 'Rotate your device to play.');
    });

    window.addEventListener('mc:dock-ready', dockUiBar);
  }

  /**
   * Disables the context menu inside the game area and mobile controls.
   * Prevents long-press/right-click menus on:
   * - #stage
   * - .mc-dpad
   * - .mc-actions
   *
   * @returns {void}
   */
  function installTouchContextGuard() {
    document.addEventListener(
      'contextmenu',
      (event) => {
        const tEl = event.target;
        if (!tEl || !tEl.closest) return;

        const inStage  = tEl.closest('#stage');
        const inDpad   = tEl.closest('.mc-dpad');
        const inAction = tEl.closest('.mc-actions');

        if (inStage || inDpad || inAction) {
          event.preventDefault();
        }
      },
      true
    );
  }

  /**
   * Main resize/orientation handler:
   * - Updates mobile/desktop flags
   * - Applies rotate overlay behavior (auto pause/resume)
   * - Docks UI bar to the right place
   * - Syncs overlay box bounds
   * - Notifies other modules via custom event
   *
   * @returns {void}
   */
  function onResizeOrient() {
    isMobile = detectMobile();
    window.__RESP_IS_MOBILE__ = isMobile;

    setBodyFlags();
    applyRotateOverlay();
    dockUiBar();
    syncCanvasOverlayBox();

    window.dispatchEvent(
      new CustomEvent('ui:responsive-mode-changed', { detail: { isMobile } })
    );
  }

  window.addEventListener('load', onResizeOrient);

  document.addEventListener('DOMContentLoaded', () => {
    ensureCanvasOverlay();
    installFullscreenWatch();
    installPositionSync();
    installTouchContextGuard();
    onResizeOrient();
    setTimeout(syncCanvasOverlayBox, 50);
    setTimeout(syncCanvasOverlayBox, 250);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        syncCanvasOverlayBox();
        setTimeout(syncCanvasOverlayBox, 50);
      });
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(syncCanvasOverlayBox, 50);
      setTimeout(syncCanvasOverlayBox, 250);
    }
  });
})();
