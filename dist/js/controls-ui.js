/**
 * Returns true if the mobile UI is in portrait mode and the rotate-overlay
 * is active. In that case the game must not start or resume yet.
 *
 * @returns {boolean}
 */
function isPortraitBlocked() {
  try {
    const body = document.body;
    if (!body) return false;

    const isMobileUI = body.classList.contains('is-mobile-ui');
    const isPortrait = body.classList.contains('is-portrait');
    const rotateVisible = !!window.__ROTATE_OVERLAY_VISIBLE__;

    return isMobileUI && (isMobileUI && (isPortrait || rotateVisible));
  } catch (e) {
    return false;
  }
}

/**
 * Handles the case where game start is blocked in portrait mode.
 * - Shows the rotate-overlay (if present)
 * - Hides the start screen only if overlay exists
 * - Triggers layout recalculation for responsive UI and touch controls
 *
 * @returns {void}
 */
function handlePortraitBlockedStart() {
  let overlayFound = false;

  try {
    const overlay = document.getElementById('rotate-overlay');
    if (overlay) {
      overlay.classList.add('show');
      window.__ROTATE_OVERLAY_VISIBLE__ = true;
      overlayFound = true;
    }
  } catch (e) {}

  if (overlayFound && startScreen && typeof startScreen.hide === 'function') {
    try {
      startScreen.hide();
    } catch (e) {}
  } else if (startScreen && typeof startScreen.show === 'function') {
    try {
      startScreen.show();
    } catch (e) {}
  }

  pokeMobileUiLayout();
}

/**
 * Dispatches a global resize event to trigger responsive layout recalculation
 * (used by responsive.js and touch-controls.js).
 *
 * @returns {void}
 */
function pokeMobileUiLayout() {
  try {
    window.dispatchEvent(new Event('resize'));
  } catch (e) {}
}

/**
 * Application bootstrapping:
 * - Creates a shared Keyboard instance
 * - Restores mute state
 * - Wires up global control functions
 * - Instantiates StartScreen and menu music
 * - Handles optional autostart
 * - Sets up pause-overlay and i18n labels
 *
 * @returns {void}
 */
function bootApp() {
  keyboard = window.KEYBOARD || new Keyboard();
  window.KEYBOARD = keyboard;
  window.__UI_AUDIOS = window.__UI_AUDIOS || [];

  isMuted = loadMutedFromStorage();

  window.startGame = startGame;
  window.pauseGame = pauseGame;
  window.resumeGame = resumeGame;
  window.restartGame = backToStart;
  window.restartNow = restartNow;
  window.backToStart = backToStart;

  wireUiControls();

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.code === 'Space' && window.world && !window.world.paused) {
        const a = document.activeElement;
        if (a && (a.tagName === 'BUTTON' || a.getAttribute('role') === 'button')) {
          e.preventDefault();
          e.stopPropagation();
          a.blur();
        }
      }
    },
    true
  );

  const pendingAutostart = (() => {
    try {
      return localStorage.getItem('autostart') === '1';
    } catch (e) {
      return false;
    }
  })();

  startScreen = new StartScreen('/img/9_intro_outro_screens/start/startscreen_3.png');
  startScreen.attachDom('#stage');
  startScreen.onStart(() => {
    if (isPortraitBlocked()) {
      handlePortraitBlockedStart();
      return;
    }
    startGame();
  });
  startScreen.show();

  menuAudio = new Audio('audio/background-audio.mp3');
  try {
    menuAudio.loop = true;
    menuAudio.volume = 0.5;
    menuAudio.muted = isMuted;

    if (!pendingAutostart) {
      menuAudio.play().catch(() => {});
    }
  } catch (e) {}

  setMuted(isMuted);

  if (pendingAutostart) {
    try {
      localStorage.removeItem('autostart');
    } catch (e) {}
    startGame();
  }

  pauseOverlay = createPauseOverlay();

  applyI18nLabels();
  window.addEventListener('i18n:changed', applyI18nLabels);

  const ensureStartScreenVisible = () => {
    if (!world && startScreen && !isPortraitBlocked()) {
      try {
        startScreen.show();
      } catch (e) {}
    }
  };

  window.addEventListener('resize', ensureStartScreenVisible);
  window.addEventListener('orientationchange', ensureStartScreenVisible);
}

/**
 * Wires up all main UI controls:
 * - Start / Resume
 * - Pause
 * - Back to start
 * - Restart now
 * - Mute toggle
 *
 * @returns {void}
 */
function wireUiControls() {
  const qs = (id) => document.getElementById(id);

  const blurActive = () => {
    const el = document.activeElement;
    if (el && typeof el.blur === 'function') {
      el.blur();
    }
  };

  qs('btn-start')?.addEventListener('click', () => {
    if (!world) {
      if (isPortraitBlocked()) {
        handlePortraitBlockedStart();
      } else {
        if (startScreen && typeof startScreen.hide === 'function') {
          startScreen.hide();
        }
        startGame();
      }
    } else {
      resumeGame();
    }
    blurActive();
  });

  qs('btn-pause')?.addEventListener('click', () => {
    if (world) {
      pauseGame();
    }
    blurActive();
  });

  qs('btn-restart')?.addEventListener('click', () => {
    backToStart();
    blurActive();
  });

  qs('btn-restart-now')?.addEventListener('click', () => {
    restartNow();
    blurActive();
  });

  qs('btn-mute')?.addEventListener('click', () => {
    toggleMute();
    blurActive();
  });
}

/* ===== Pause overlay DOM ===== */

/**
 * Creates the DOM pause overlay:
 * - Semi-transparent mask
 * - "Continue" button (resumes the game)
 *
 * @returns {HTMLDivElement|null} Overlay root element or null.
 */
function createPauseOverlay() {
  const host = document.querySelector('#stage') || document.querySelector('.game-container');
  if (!host) return null;

  const wrap = document.createElement('div');
  wrap.className = 'pause-overlay hidden';
  wrap.innerHTML = `
    <div class="pause-mask"></div>
    <button id="btn-continue" class="${
      document.querySelector('.go-btn') ? 'go-btn' : 'game-primary-btn'
    }"></button>
  `;

  host.appendChild(wrap);
  const btn = wrap.querySelector('#btn-continue');
  if (btn) {
    btn.addEventListener('click', () => resumeGame());
  }
  return wrap;
}

/**
 * Shows or hides the pause overlay.
 *
 * @param {boolean} show - True to show, false to hide.
 * @returns {void}
 */
function showPauseOverlay(show) {
  if (!pauseOverlay) return;
  pauseOverlay.classList.toggle('hidden', !show);
}

/* ===== i18n label wiring ===== */

/**
 * Applies translations to various UI labels and buttons.
 * Uses I18N.t if available, otherwise falls back to key names.
 *
 * @returns {void}
 */
function applyI18nLabels() {
  const t = (k) => (window.I18N ? window.I18N.t(k) : k);

  const btnStart = document.getElementById('btn-start');
  const btnContinue = document.getElementById('btn-continue');
  const startGameBtn = document.getElementById('btn-startgame');
  const btnRestart = document.getElementById('btn-restart');
  const btnRestartNow = document.getElementById('btn-restart-now');

  if (btnStart) {
    const label = window.world ? t('ui.resume') : t('ui.start');
    btnStart.textContent = label;
  }
  if (btnContinue) {
    btnContinue.textContent = t('ui.continue');
  }
  if (startGameBtn) {
    startGameBtn.textContent = t('ui.startGame');
  }
  if (btnRestart) {
    btnRestart.textContent = t('ui.backToStart');
  }
  if (btnRestartNow) {
    btnRestartNow.textContent = t('ui.restart');
  }
}
