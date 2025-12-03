// js/controls.js
// Generall überholt durch js/controls-core.js und js/controls-ui.js -> Ich behalte es als Back-Up in meinen Dokumenten!

let world = null;
let keyboard = null;
let startScreen = null;
let menuAudio = null;
let isMuted = false;
let isStarting = false;
let pauseOverlay = null;

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

    return isMobileUI && (isPortrait || rotateVisible);
  } catch (e) {
    return false;
  }
}

/**
 * Handles the case where game start is blocked in portrait mode.
 * - Shows the rotate-overlay (if present)
 * - Hides the start screen only if overlay exists
 * - Triggers layout recalculation for responsive UI and touch controls
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

  // Only hide start screen if we really have a rotate overlay.
  // Otherwise keep start screen visible as fallback.
  if (overlayFound && startScreen && typeof startScreen.hide === 'function') {
    try {
      startScreen.hide();
    } catch (e) {}
  } else if (startScreen && typeof startScreen.show === 'function') {
    try {
      startScreen.show();
    } catch (e) {}
  }

  // Make responsive.js / touch-controls.js recalc layout immediately
  pokeMobileUiLayout();
}

/**
 * Dispatches a global resize event to trigger responsive layout recalculation
 * (used by responsive.js and touch-controls.js).
 */
function pokeMobileUiLayout() {
  try {
    window.dispatchEvent(new Event('resize'));
  } catch (e) {}
}

/**
 * Safely reads the mute state from localStorage.
 *
 * @returns {boolean} True if muted, false otherwise.
 */
function loadMutedFromStorage() {
  try {
    const saved = localStorage.getItem('soundMuted');
    if (saved === '1' || saved === 'true') return true;
    if (saved === '0' || saved === 'false') return false;
  } catch (e) {}
  return false;
}

/**
 * Application bootstrapping:
 * - Creates a shared Keyboard instance
 * - Restores mute state
 * - Wires up global control functions
 * - Instantiates StartScreen and menu music
 * - Handles optional autostart
 * - Sets up pause-overlay and i18n labels
 */
function bootApp() {
  // Single shared keyboard for the whole app
  keyboard = window.KEYBOARD || new Keyboard();
  window.KEYBOARD = keyboard;

  // List of UI-related audio objects managed globally
  window.__UI_AUDIOS = window.__UI_AUDIOS || [];

  // Restore mute state from localStorage
  isMuted = loadMutedFromStorage();

  // Expose game control functions globally so i18n.js etc. can wire them
  window.startGame   = startGame;
  window.pauseGame   = pauseGame;
  window.resumeGame  = resumeGame;

  window.restartGame = backToStart; // "Back to start screen"
  window.restartNow  = restartNow;  // Direct restart
  window.backToStart = backToStart;

  wireUiControls();

  // Prevent Space from triggering UI buttons while the game is running
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && window.world && !window.world.paused) {
      const a = document.activeElement;
      if (a && (a.tagName === 'BUTTON' || a.getAttribute('role') === 'button')) {
        e.preventDefault();
        e.stopPropagation();
        a.blur(); // Remove focus so Space no longer clicks the button
      }
    }
  }, true);

  // Check pending autostart as early as possible
  const pendingAutostart = (() => {
    try { return localStorage.getItem('autostart') === '1'; } catch (e) { return false; }
  })();

  // Start screen
  startScreen = new StartScreen('/img/9_intro_outro_screens/start/startscreen_3.png');
  startScreen.attachDom('#stage'); // previously '.game-container'
  startScreen.onStart(() => {
    // Block start in portrait orientation – require rotate first
    if (isPortraitBlocked()) {
      handlePortraitBlockedStart();
      return;
    }
    startGame();
  });
  startScreen.show();

  // Menu background music
  menuAudio = new Audio('audio/background-audio.mp3');
  try {
    menuAudio.loop = true;
    menuAudio.volume = 0.5;
    menuAudio.muted = isMuted;

    // Only play menu music if NO autostart is pending
    if (!pendingAutostart) {
      menuAudio.play().catch(() => {});
    }
  } catch (e) {}

  // Apply mute state to UI, menu audio and global audios
  setMuted(isMuted);

  // Run autostart now (without initial menu music)
  if (pendingAutostart) {
    try { localStorage.removeItem('autostart'); } catch (e) {}
    startGame(); // game start will stop menu music if necessary
  }

  // Create pause overlay
  pauseOverlay = createPauseOverlay();

  // Initial labels + react to language changes
  applyI18nLabels();
  window.addEventListener('i18n:changed', applyI18nLabels);

  // If we switch from portrait → landscape and no world is running yet,
  // ensure start screen is visible again.
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
 * Shuts down the current world instance without reloading the page:
 * - Pauses the game logic
 * - Deactivates story billboard and ambience
 * - Stops all world-related audio (boss, story, GO/Win, BG, steps, ...)
 * - Resets Game Over and Winner overlays
 * - Marks the world as destroyed to stop its draw loop
 */
function shutdownWorld() {
    if (!world) return;

    // 1) Pause logic so no further game loop runs
    try { world.setPaused(true); } catch (e) {}

    // 2) Stop story / boss environment audio (no "Help / What are you doing" on start screen)
    try {
        if (world.hutStory && typeof world.hutStory.deactivate === 'function') {
            world.hutStory.deactivate();
        }
    } catch (e) {}

    // Endboss countdown and ambience off
    try {
        if (typeof world.stopEndbossTimer === 'function') {
            world.stopEndbossTimer();
        }
    } catch (e) {}

    try {
        if (typeof world.stopAmbienceLoop === 'function') {
            world.stopAmbienceLoop();
        }
    } catch (e) {}

    // 3) Stop and reset all world-related audio
    try {
        if (typeof world.resetAllAudios === 'function') {
            world.resetAllAudios();
        } else {
            if (typeof world.stopAllGameOverAudio === 'function') {
                world.stopAllGameOverAudio();
            }
            if (typeof world.pauseBgMusic === 'function') {
                world.pauseBgMusic();
            }
        }
    } catch (e) {}

    // 4) Reset GameOver/Winner overlays
    try {
        if (world.gameOverScreen) {
            world.gameOverScreen.visible = false;

            // Hide DOM "Try Again" button if helper exists
            if (typeof world.gameOverScreen.hideButton === 'function') {
                world.gameOverScreen.hideButton();
            }
        }

        if (world.winnerScreen) {
            // WinnerScreen has its own hide() method
            if (typeof world.winnerScreen.hide === 'function') {
                world.winnerScreen.hide();
            } else {
                world.winnerScreen.visible = false;
            }
        }

        world.gameOver = false;
        world.gameWon  = false;
    } catch (e) {}

    // 5) Hard-stop draw loop of this world instance
    world.destroyed = true;
}

/**
 * "Restart now" flow:
 * - Mark autostart for next boot
 * - Shutdown current world
 * - Reset level
 * - Either go back to start screen (portrait) or restart game immediately (landscape)
 */
function restartNow() {
    try { localStorage.setItem('autostart', '1'); } catch (e) {}

    shutdownWorld();

    try {
        if (typeof resetLevel1 === 'function') {
            resetLevel1();
        }
    } catch (e) {}

    world = null;
    if (typeof window !== 'undefined') window.world = null;
    isStarting = false;

    // In portrait do NOT start immediately – go back to start screen
    if (isPortraitBlocked()) {
        if (startScreen && typeof startScreen.show === 'function') {
            startScreen.show();
        }
        return;
    }

    if (startScreen && typeof startScreen.hide === 'function') {
        startScreen.hide();
    }

    startGame();
}

/**
 * Back to start screen flow:
 * - Clear autostart flag
 * - Shutdown current world
 * - Reset level
 * - Hide pause overlay and show start screen
 * - Reset start button label
 * - Restart menu music (honoring mute state)
 */
function backToStart() {
    // Make sure we really land on the start screen
    try { localStorage.removeItem('autostart'); } catch (e) {}

    shutdownWorld();

    // Level reset
    try {
        if (typeof resetLevel1 === 'function') {
            resetLevel1();
        }
    } catch (e) {}

    world = null;
    if (typeof window !== 'undefined') window.world = null;
    isStarting = false;

    // Hide pause overlay if open
    try { showPauseOverlay(false); } catch (e) {}

    // Show start screen
    if (startScreen && typeof startScreen.show === 'function') {
        startScreen.show();
    }

    // Reset labels (start button = "Start" instead of "Resume")
    try { applyI18nLabels(); } catch (e) {}

    // Restart menu music (respecting mute state)
    try {
        if (menuAudio) {
            menuAudio.muted = !!isMuted;
            menuAudio.currentTime = 0;
            menuAudio.play().catch(() => {});
        }
    } catch (e) {}
}

/**
 * Starts the game:
 * - Blocks start in portrait mode (rotate overlay instead)
 * - Creates a new World instance
 * - Applies mute state
 * - Updates start button label to "Resume"
 * - Focuses canvas so Space no longer triggers UI buttons
 * - Forces touch-controls layout recalculation
 */
function startGame() {
  // Block start while rotate-overlay / portrait-block is active
  if (isPortraitBlocked()) {
    pokeMobileUiLayout();
    return;
  }

  if (isStarting || world) {
    startScreen?.hide();
    return;
  }

  isStarting = true;
  try { stopMenuAudio(); } catch (e) {}

  const canvas = document.getElementById('canvas');
  if (!canvas) {
    isStarting = false;
    return;
  }

  world = new World(canvas, keyboard);

  setMuted(isMuted);

  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.textContent = (window.I18N ? window.I18N.t('ui.resume') : 'Resume');
  }

  startScreen?.hide();

  // Focus canvas so Space key does not click UI buttons
  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  // Trigger immediate layout so D-pad is visible on first start in landscape
  pokeMobileUiLayout();
}

/**
 * Stops menu background audio and resets its playback position.
 */
function stopMenuAudio() {
  try {
    if (menuAudio) {
      menuAudio.pause();
      menuAudio.currentTime = 0;
    }
  } catch (e) {}
}

/**
 * Applies the mute state to:
 * - UI mute button
 * - Menu music
 * - All known world and UI audio elements
 * Also persists the mute state to localStorage.
 *
 * @param {boolean} flag - True to mute, false to unmute.
 */
function setMuted(flag) {
  isMuted = !!flag;
  const btn = document.getElementById('btn-mute');
  if (btn) {
    btn.textContent = isMuted ? '🔇' : '🔈';
    btn.setAttribute('aria-pressed', String(isMuted));
  }
  if (menuAudio) menuAudio.muted = isMuted;

  if (world) {
    try {
      const auds = world.getAllAudiosDeep();
      auds.forEach(a => {
        try { a.muted = isMuted; } catch (e) {}
      });
    } catch (e) {}
  }

  if (window.__UI_AUDIOS && Array.isArray(window.__UI_AUDIOS)) {
    try {
      window.__UI_AUDIOS.forEach(a => {
        try { a.muted = isMuted; } catch (e) {}
      });
    } catch (e) {}
  }

  window.IS_MUTED = isMuted; // used by ui-frame.js

  // Persist mute status
  try {
    localStorage.setItem('soundMuted', isMuted ? '1' : '0');
  } catch (e) {}
}

/**
 * Toggles the mute state on/off.
 */
function toggleMute() { setMuted(!isMuted); }

/**
 * Wires up all main UI controls:
 * - Start / Resume
 * - Pause
 * - Back to start
 * - Restart now
 * - Mute toggle
 */
function wireUiControls() {
  const qs = id => document.getElementById(id);

  qs('btn-start')?.addEventListener('click', () => {
    if (!world) {
      // Do not start in portrait; show rotate-overlay instead
      if (isPortraitBlocked()) {
        handlePortraitBlockedStart();
      } else {
        startScreen?.hide();
        startGame();
      }
    } else {
      resumeGame();
    }
    document.activeElement?.blur();
  });

  qs('btn-pause')?.addEventListener('click', () => {
    if (world) pauseGame();
    document.activeElement?.blur();
  });

  qs('btn-restart')?.addEventListener('click', () => {
    backToStart();
    document.activeElement?.blur();
  });

  qs('btn-restart-now')?.addEventListener('click', () => {
    restartNow();
    document.activeElement?.blur();
  });

  qs('btn-mute')?.addEventListener('click', () => {
    toggleMute();
    document.activeElement?.blur();
  });
}

/* ===== Pause / Resume ===== */

/**
 * Pauses the game:
 * - Sets world.paused
 * - Shows pause overlay
 */
function pauseGame() {
  if (!world || world.paused) return;
  world.setPaused(true);
  showPauseOverlay(true);
}

/**
 * Resumes the game:
 * - Only resumes in landscape (blocks while rotate-overlay is active)
 * - Hides pause overlay
 * - Resumes world
 * - Refocuses canvas and updates start button label
 */
function resumeGame() {
  if (!world || !world.paused) return;

  // Do not resume while portrait-block is active
  if (isPortraitBlocked()) {
    pokeMobileUiLayout();
    return;
  }

  showPauseOverlay(false);
  world.setPaused(false);

  const cv = document.getElementById('canvas');
  cv?.setAttribute('tabindex', '0');
  cv?.focus();

  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.textContent = (window.I18N ? window.I18N.t('ui.resume') : 'Resume');
  }
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
    <button id="btn-continue" class="${document.querySelector('.go-btn') ? 'go-btn' : 'game-primary-btn'}"></button>
  `;

  host.appendChild(wrap);
  const btn = wrap.querySelector('#btn-continue');
  btn.addEventListener('click', () => resumeGame());
  return wrap;
}

/**
 * Shows or hides the pause overlay.
 *
 * @param {boolean} show - True to show, false to hide.
 */
function showPauseOverlay(show) {
  if (!pauseOverlay) return;
  pauseOverlay.classList.toggle('hidden', !show);
}

/* ===== i18n label wiring ===== */

/**
 * Applies translations to various UI labels and buttons.
 * Uses I18N.t if available, otherwise falls back to key names.
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
  if (btnContinue) btnContinue.textContent = t('ui.continue');
  if (startGameBtn) startGameBtn.textContent = t('ui.startGame');

  if (btnRestart) btnRestart.textContent = t('ui.backToStart');
  if (btnRestartNow) btnRestartNow.textContent = t('ui.restart');
}
