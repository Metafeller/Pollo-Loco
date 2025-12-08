(() => {
  const core = window.TouchControlsCore;
  if (!core) return;

  const { $, Icons, clickSfx, setKey, wireDirectionButton, hold, t, isVisible } = core;

  /**
   * Returns true if the document is currently in fullscreen mode.
   *
   * @returns {boolean} Whether any element is fullscreen.
   */
  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
  }

  /**
   * Requests fullscreen mode for the given stage element.
   *
   * @param {HTMLElement} stage - Element to show in fullscreen.
   * @returns {Promise<void>}
   */
  async function enterFullscreen(stage) {
    const req =
      stage.requestFullscreen ||
      stage.webkitRequestFullscreen ||
      stage.msRequestFullscreen;
    if (!req) return;
    await req.call(stage);
  }

  /**
   * Attempts to lock the screen orientation to landscape if supported.
   *
   * @returns {Promise<void>}
   */
  async function lockLandscapeIfPossible() {
    const api = screen.orientation;
    if (!api || !api.lock) return;
    try {
      await api.lock('landscape');
    } catch (_) {}
  }

  /**
   * Exits fullscreen mode if possible.
   *
   * @returns {Promise<void>}
   */
  async function exitFullscreenSafe() {
    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (!exit) return;
    await exit.call(document);
  }

  /**
   * Toggles fullscreen on the given stage element.
   * Enters fullscreen + landscape lock, or exits if already active.
   *
   * @param {HTMLElement} stage - Element to toggle fullscreen for.
   * @returns {Promise<void>}
   */
  async function toggleFullscreenStage(stage) {
    if (!isFullscreen()) {
      await enterFullscreen(stage);
      await lockLandscapeIfPossible();
      return;
    }
    await exitFullscreenSafe();
  }

  /**
   * Toggles fullscreen mode for the #stage (or #canvas) element.
   * Tries to lock orientation to landscape where supported.
   *
   * @returns {Promise<void>}
   */
  async function toggleFullscreenForCanvas() {
    const stage =
      document.getElementById('stage') || document.getElementById('canvas');
    if (!stage) return;

    try {
      await toggleFullscreenStage(stage);
    } catch (_) {}

    setTimeout(applyVisibility, 50);
  }

  /**
   * Toggles the mobile control panel visibility.
   *
   * @returns {void}
   */
  function togglePanel() {
    const panel = $('#mc-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    clickSfx();
  }

  /**
   * Ensures a .canvas-ui host exists under the given root and returns it.
   *
   * @param {HTMLElement} root - Root container (stage or body).
   * @returns {HTMLDivElement} The canvas-ui host element.
   */
  function ensureCanvasUiHost(root) {
    let host = root.querySelector('.canvas-ui');
    if (!host) {
      host = document.createElement('div');
      host.className = 'canvas-ui';
      root.appendChild(host);
    }
    return host;
  }

  /**
   * Builds the HTML markup for the mobile control overlay inside the host.
   *
   * @param {HTMLElement} host - Host element for the overlay.
   * @returns {void}
   */
  function buildOverlayMarkup(host) {
    host.innerHTML = `
      <button id="mc-burger" class="mc-btn mc-burger" aria-label="${t('mobile.menu','Menu')}" title="${t('mobile.menu','Menu')}">
        ${Icons.burger}
      </button>

      <div id="mc-panel" class="mc-panel" aria-label="${t('mobile.menu','Menu')}">
        <div class="mc-panel-head">${t('mobile.controls','Controls')}</div>
        <div class="mc-panel-body">
          <div id="mobile-ui-dock"></div>
        </div>
      </div>

      <div class="mc-dpad">
        <button id="mc-left"  class="mc-btn" aria-label="${t('mobile.left','Left')}" title="${t('mobile.left','Left')}">${Icons.left}</button>
        <button id="mc-right" class="mc-btn" aria-label="${t('mobile.right','Right')}" title="${t('mobile.right','Right')}">${Icons.right}</button>
      </div>

      <div class="mc-actions">
        <button id="mc-throw" class="mc-btn" aria-label="${t('mobile.throw','Bottle')}" title="${t('mobile.throw','Bottle')}">${Icons.bottle}</button>
        <button id="mc-jump"  class="mc-btn" aria-label="${t('mobile.jump','Jump')}"   title="${t('mobile.jump','Jump')}">${Icons.jump}</button>
        <button id="mc-super" class="mc-btn" aria-label="${t('mobile.super','Supernova')}" title="${t('mobile.super','Supernova')}">${Icons.super}</button>
      </div>

      <button id="mc-fs" class="mc-btn mc-fs" aria-label="${t('mobile.fullscreen','Fullscreen')}" title="${t('mobile.fullscreen','Fullscreen')}">
        ${Icons.fs}
      </button>
    `;
  }

  /**
   * Wires all interactions for the touch overlay:
   * - Burger menu, fullscreen button
   * - D-pad and action buttons
   *
   * @returns {void}
   */
  function wireOverlayInteractions() {
    $('#mc-burger')?.addEventListener('click', togglePanel);
    $('#mc-fs')?.addEventListener('click', toggleFullscreenForCanvas);

    wireDirectionButton($('#mc-left'), 'LEFT');
    wireDirectionButton($('#mc-right'), 'RIGHT');

    hold($('#mc-jump'),  () => setKey('SPACE', true), () => setKey('SPACE', false));
    hold($('#mc-throw'), () => setKey('D', true),     () => setKey('D', false));
    hold($('#mc-super'), () => setKey('F', true),     () => setKey('F', false));
  }

  /**
   * Updates text and ARIA labels on overlay elements based on i18n.
   *
   * @returns {void}
   */
  function updateOverlayI18n() {
    const burger = $('#mc-burger');
    if (burger) {
      const label = t('mobile.menu', 'Menu');
      burger.setAttribute('title', label);
      burger.setAttribute('aria-label', label);
    }

    const fs = $('#mc-fs');
    if (fs) {
      const label = t('mobile.fullscreen', 'Fullscreen');
      fs.setAttribute('title', label);
      fs.setAttribute('aria-label', label);
    }

    const head = $('#mc-panel .mc-panel-head');
    if (head) {
      head.textContent = t('mobile.controls', 'Controls');
    }
  }

  /**
   * Registers i18n change listeners for the overlay and applies defaults.
   *
   * @returns {void}
   */
  function registerOverlayI18nListeners() {
    window.addEventListener('i18n:changed', updateOverlayI18n);
  }

  /**
   * Ensures the main `.canvas-ui` mobile overlay is built.
   * Wires all touch/mobile controls and dispatches "mc:dock-ready".
   *
   * @returns {void}
   */
  function ensureOverlay() {
    const root = document.getElementById('stage') || document.body;
    const host = ensureCanvasUiHost(root);
    if (document.getElementById('mc-burger')) return;

    buildOverlayMarkup(host);
    wireOverlayInteractions();
    registerOverlayI18nListeners();
    updateOverlayI18n();

    window.dispatchEvent(new Event('mc:dock-ready'));
  }

  /**
   * Checks whether any "blocking" overlay is currently open.
   *
   * @returns {boolean} True if a blocking overlay is visible.
   */
  function anyGameOverlayOpen() {
    if (document.querySelector('.overlay.show')) return true;

    const overlays = [...document.querySelectorAll('.overlay')];
    if (overlays.some(el => !el.hasAttribute('hidden'))) return true;

    const ss = document.querySelector('.start-screen');
    if (ss && isVisible(ss)) return true;

    return false;
  }

  /**
   * Resets all keyboard flags used by the mobile controls.
   *
   * @returns {void}
   */
  function resetAllKeys() {
    setKey('LEFT', false);
    setKey('RIGHT', false);
    setKey('SPACE', false);
    setKey('D', false);
    setKey('F', false);
  }

  /**
   * Shows or hides the entire touch controls group.
   * Also resets any active key flags when hiding.
   *
   * @param {boolean} on - True to show, false to hide.
   * @returns {void}
   */
  function showControlsGroup(on) {
    const selectors = [
      '#mc-burger',
      '.mc-dpad',
      '.mc-actions',
      '#mc-fs',
      '#mc-panel'
    ];

    const nodes = selectors
      .map(s => document.querySelector(s))
      .filter(Boolean);

    nodes.forEach(n => {
      n.style.display = on ? '' : 'none';
    });

    if (!on) {
      document.getElementById('mc-panel')?.classList.remove('open');
      resetAllKeys();
    }
  }

  /**
   * Applies visibility rules for mobile controls:
   * - Only visible on mobile UI
   * - Only visible in landscape
   * - Hidden while overlays/start screen are open
   *
   * @returns {void}
   */
  function applyVisibility() {
    const isMobileUI = document.body.classList.contains('is-mobile-ui');
    const isLandscape = document.body.classList.contains('is-landscape');
    const blockedByUI = anyGameOverlayOpen();

    const host = document.querySelector('.canvas-ui');
    if (host) {
      host.style.display = isMobileUI ? 'block' : 'none';
    }

    const showControls = isMobileUI && isLandscape && !blockedByUI;
    showControlsGroup(showControls);
  }

  /**
   * Keeps the canvas-ui host stretched over the entire stage area.
   *
   * @returns {void}
   */
  function syncBox() {
    const host = document.querySelector('.canvas-ui');
    if (!host) return;

    host.style.left = '0';
    host.style.top = '0';
    host.style.width = '100%';
    host.style.height = '100%';
  }

  /**
   * Sets up a MutationObserver to react to body class changes
   * (e.g. mobile/landscape flags) and update overlay visibility.
   *
   * @returns {void}
   */
  function setupMutationObserver() {
    const obs = new MutationObserver(() => {
      applyVisibility();
      syncBox();
    });

    obs.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  /**
   * Registers listeners for fullscreen changes to keep
   * the overlay aligned and visibility rules up-to-date.
   *
   * @returns {void}
   */
  function setupFullscreenListeners() {
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'msfullscreenchange'
    ];

    events.forEach(ev => {
      document.addEventListener(ev, () => {
        applyVisibility();
        syncBox();
      });
    });
  }

  /**
   * Registers resize, scroll and orientationchange listeners
   * to keep the overlay in sync with the stage area.
   *
   * @returns {void}
   */
  function setupResizeScrollOrientationListeners() {
    window.addEventListener('resize', () => {
      applyVisibility();
      syncBox();
    }, { passive: true });

    window.addEventListener('scroll', () => {
      syncBox();
    }, true);

    window.addEventListener('orientationchange', () => {
      applyVisibility();
      setTimeout(syncBox, 80);
    });
  }

  /**
   * Initialises the touch controls system once DOM is ready:
   * - Builds overlay
   * - Applies visibility rules
   * - Registers all observers & listeners
   *
   * @returns {void}
   */
  function initTouchControls() {
    ensureOverlay();
    applyVisibility();
    syncBox();

    setupMutationObserver();
    setupFullscreenListeners();
    setupResizeScrollOrientationListeners();
  }

  document.addEventListener('DOMContentLoaded', initTouchControls);
})();