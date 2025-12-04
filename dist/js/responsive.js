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
   */
  function setBodyFlags() {
    document.body.classList.toggle('is-mobile-ui', isMobile);
    document.body.classList.toggle('is-desktop-ui', !isMobile);
    document.body.classList.toggle('is-portrait', isMobile && isPortrait());
    document.body.classList.toggle('is-landscape', isMobile && !isPortrait());
  }

  /**
   * Shows/hides the rotate overlay and handles auto pause/resume:
   * - When overlay becomes visible: pause world (remember previous pause state)
   * - When overlay hides: auto-resume only if game was NOT paused before
   */
  function applyRotateOverlay() {
    const ov = ensureRotateOverlay();
    const show = isMobile && isPortrait();
    const wasShown = ov.classList.contains('show');

    ov.classList.toggle('show', show);

    if (show === wasShown) return;

    const g = window;
    g.__ROTATE_OVERLAY_VISIBLE__ = show;

    const hasWorld = (typeof world !== 'undefined') && !!world;

    if (show) {
      g.__ROTATE_PREV_WAS_PAUSED__ = hasWorld && !!world.paused;

      if (hasWorld && !world.paused) {
        if (typeof g.pauseGame === 'function') {
          g.pauseGame();
        } else if (typeof world.setPaused === 'function') {
          world.setPaused(true);
        }
      }
    } else {
      const wasPausedBefore = !!g.__ROTATE_PREV_WAS_PAUSED__;
      g.__ROTATE_PREV_WAS_PAUSED__ = null;

      if (hasWorld && world.paused && !wasPausedBefore) {
        if (typeof g.resumeGame === 'function') {
          g.resumeGame();
        } else if (typeof world.setPaused === 'function') {
          world.setPaused(false);
        }
      }
    }
  }

  /**
   * Docks the #ui-bar either into the mobile dock or back into
   * its original desktop position.
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
    } else {
      if (uiBarOrigParent && uiBar.parentElement !== uiBarOrigParent) {
        if (uiBarOrigNext && uiBarOrigNext.parentElement === uiBarOrigParent) {
          uiBarOrigParent.insertBefore(uiBar, uiBarOrigNext);
        } else {
          uiBarOrigParent.appendChild(uiBar);
        }
      }
    }
  }

  /**
   * Ensures a mobile header burger & dropdown menu exist
   * and wires them up. Cleans them up again on desktop.
   */
  function ensureHeaderBurger() {
    const header = $('.header-bar');
    const right = header ? header.querySelector('.header-right') : null;
    if (!header || !right) return;

    const ensureHdrStyle = () => {
      const ID = 'hdr-dd-style';
      if (document.getElementById(ID)) return;
      const style = document.createElement('style');
      style.id = ID;
      style.textContent = `
        /* Base: hidden via CSS, not inline-style */
        #header-mobile-menu{ display:none; }
        #header-mobile-menu.open{ display:block; }
        @media (min-width:1369px){
          #header-burger, #header-mobile-menu{ display:none !important; }
        }`;
      document.head.appendChild(style);
    };

    let hb   = $('#header-burger');
    let menu = $('#header-mobile-menu');

    if (isMobile) {
      ensureHdrStyle();

      if (!menu) {
        menu = document.createElement('div');
        menu.id = 'header-mobile-menu';
        menu.style.position = 'absolute';
        menu.style.top = '70px';
        menu.style.right = '16px';
        menu.style.background = 'rgba(17,17,17,0.92)';
        menu.style.border = '1px solid rgba(242,212,162,0.35)';
        menu.style.borderRadius = '12px';
        menu.style.padding = '10px';
        menu.style.boxShadow = '0 10px 26px rgba(0,0,0,.55)';
        menu.style.zIndex = '8';
        menu.classList.add('mini-dd');

        menu.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button id="hdr-rules-dd" class="hdr-btn glass">${$('#lbl-rules')?.textContent || 'Rules'}</button>
            <a class="hdr-btn cta" href="https://metafeller.com" target="_blank" rel="noopener">${$('#lbl-contact')?.textContent || 'Contact'}</a>
            <a class="icon-link" href="https://github.com/Metafeller" target="_blank" rel="noopener"><img src="img/icons/social/github_1.svg" alt="GitHub"></a>
            <a class="icon-link" href="https://www.linkedin.com/" target="_blank" rel="noopener"><img src="img/icons/social/linkedin_1.svg" alt="LinkedIn"></a>
            <a class="icon-link" href="https://www.instagram.com/savasboas/#" target="_blank" rel="noopener"><img src="img/icons/social/instagram_1.svg" alt="Instagram"></a>
          </div>`;
        header.appendChild(menu);

        $('#hdr-rules-dd')?.addEventListener('click', () => {
          document.getElementById('btn-rules')?.click();
        });
      }

      if (!hb) {
        hb = document.createElement('button');
        hb.id = 'header-burger';
        hb.className = 'hdr-btn glass';
        hb.setAttribute('aria-haspopup', 'menu');
        hb.setAttribute('aria-expanded', 'false');
        hb.style.marginLeft = '8px';
        hb.innerHTML = '☰';
        header.insertBefore(hb, right);
      }

      if (!hb.__wired) {
        hb.__wired = true;
        hb.addEventListener('click', (ev) => {
          ev.preventDefault();
          const mm = document.getElementById('header-mobile-menu');
          if (!mm) return;
          const willOpen = !mm.classList.contains('open');
          mm.classList.toggle('open', willOpen);
          mm.style.display = willOpen ? 'block' : 'none';
          hb.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
          try {
            if (!window.IS_MUTED) {
              const a = new Audio('/audio/bottle.mp3');
              a.volume = .8;
              a.play();
            }
          } catch (_) {}
        });

        document.addEventListener('click', (e) => {
          const mm = document.getElementById('header-mobile-menu');
          const bt = document.getElementById('header-burger');
          if (!mm || !bt) return;
          if (!mm.classList.contains('open')) return;
          if (bt.contains(e.target) || mm.contains(e.target)) return;
          mm.classList.remove('open');
          mm.style.display = 'none';
          bt.setAttribute('aria-expanded', 'false');
        }, true);
      }

      right.style.display = 'none';
      hb.style.display = 'inline-flex';
    } else {
      if (menu) { menu.remove(); }
      if (hb) { hb.remove(); }
      right.style.display = '';
    }
  }

  /**
   * Watches fullscreen changes and keeps the overlay aligned
   * when entering/leaving fullscreen.
   */
  function installFullscreenWatch() {
    ['fullscreenchange', 'webkitfullscreenchange', 'msfullscreenchange'].forEach(ev => {
      document.addEventListener(ev, () => {
        const fs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
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
   */
  function installPositionSync() {
    window.addEventListener('resize', onResizeOrient, { passive: true });
    window.addEventListener('scroll', () => { syncCanvasOverlayBox(); }, true);
    window.addEventListener('orientationchange', onResizeOrient);

    window.addEventListener('i18n:changed', () => {
      const ov = ensureRotateOverlay();
      ov.querySelector('h3').textContent = t('mobile.rotateTitle', 'Landscape required');
      ov.querySelector('p').textContent = t('mobile.rotateBody', 'Rotate your device to play.');
    });

    window.addEventListener('mc:dock-ready', dockUiBar);
  }

  /**
   * Disables the context menu inside the game area and mobile controls.
   * Prevents long-press/right-click menus on:
   * - #stage
   * - .mc-dpad
   * - .mc-actions
   */
  function installTouchContextGuard() {
    document.addEventListener(
      'contextmenu',
      function (event) {
        const t = event.target;
        if (!t) return;

        const inStage  = t.closest && t.closest('#stage');
        const inDpad   = t.closest && t.closest('.mc-dpad');
        const inAction = t.closest && t.closest('.mc-actions');

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
   * - Ensures header burger visibility
   * - Syncs overlay box bounds
   */
  function onResizeOrient() {
    isMobile = detectMobile();
    setBodyFlags();
    applyRotateOverlay();
    dockUiBar();
    ensureHeaderBurger();
    syncCanvasOverlayBox();
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
