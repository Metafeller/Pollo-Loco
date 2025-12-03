// js/controls-core.js
let world = null;
let keyboard = null;
let startScreen = null;
let menuAudio = null;
let isMuted = false;
let isStarting = false;
let pauseOverlay = null;

/**
 * Runs a function in a guarded block and optionally logs errors
 * when a debug flag is active.
 *
 * @param {Function} fn - callback to execute.
 * @param {string} [label] - optional label for debug output.
 * @returns {void}
 */
function safeCall(fn, label) {
  try {
    fn();
  } catch (e) {
    try {
      if (typeof window !== 'undefined' && window.__DEBUG_SAFE_CALL__) {
        console.warn('[safeCall]', label || 'unnamed', e);
      }
    } catch (logError) {
      // Never throw from safeCall
    }
  }
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
 * Stops menu background audio and resets its playback position.
 *
 * @returns {void}
 */
function stopMenuAudio() {
  safeCall(() => {
    if (!menuAudio) return;
    menuAudio.pause();
    menuAudio.currentTime = 0;
  }, 'stopMenuAudio');
}

/**
 * Applies the mute state to:
 * - UI mute button
 * - Menu music
 * - All known world and UI audio elements
 * and persists it to localStorage.
 *
 * @param {boolean} flag - True to mute, false to unmute.
 * @returns {void}
 */
function setMuted(flag) {
  isMuted = !!flag;

  const btn = document.getElementById('btn-mute');
  if (btn) {
    btn.textContent = isMuted ? '🔇' : '🔈';
    btn.setAttribute('aria-pressed', String(isMuted));
  }

  if (menuAudio) {
    menuAudio.muted = isMuted;
  }

  if (world && typeof world.getAllAudiosDeep === 'function') {
    safeCall(() => {
      const auds = world.getAllAudiosDeep();
      if (!Array.isArray(auds)) return;
      auds.forEach((a) => {
        if (!a) return;
        safeCall(() => {
          a.muted = isMuted;
        }, 'mute-world-audio');
      });
    }, 'mute-world-audios');
  }

  if (window.__UI_AUDIOS && Array.isArray(window.__UI_AUDIOS)) {
    safeCall(() => {
      window.__UI_AUDIOS.forEach((a) => {
        if (!a) return;
        safeCall(() => {
          a.muted = isMuted;
        }, 'mute-ui-audio');
      });
    }, 'mute-ui-audios');
  }

  window.IS_MUTED = isMuted;

  safeCall(() => {
    localStorage.setItem('soundMuted', isMuted ? '1' : '0');
  }, 'persist-muted-flag');
}

/**
 * Toggles the mute state on/off.
 *
 * @returns {void}
 */
function toggleMute() {
  setMuted(!isMuted);
}

/**
 * Pauses the current world loop if possible.
 *
 * @returns {void}
 */
function pauseWorldForShutdown() {
  if (!world) return;
  safeCall(() => {
    if (typeof world.setPaused === 'function') {
      world.setPaused(true);
    } else {
      world.paused = true;
    }
  }, 'pause-world');
}

/**
 * Deactivates story billboard and boss ambience.
 *
 * @returns {void}
 */
function stopWorldStoryAndAmbience() {
  if (!world) return;

  safeCall(() => {
    if (world.hutStory && typeof world.hutStory.deactivate === 'function') {
      world.hutStory.deactivate();
    }
  }, 'hutStory.deactivate');

  safeCall(() => {
    if (typeof world.stopEndbossTimer === 'function') {
      world.stopEndbossTimer();
    }
  }, 'stopEndbossTimer');

  safeCall(() => {
    if (typeof world.stopAmbienceLoop === 'function') {
      world.stopAmbienceLoop();
    }
  }, 'stopAmbienceLoop');
}

/**
 * Stops and resets all world-related audio.
 *
 * @returns {void}
 */
function resetWorldAudioState() {
  if (!world) return;

  safeCall(() => {
    if (typeof world.resetAllAudios === 'function') {
      world.resetAllAudios();
      return;
    }

    if (typeof world.stopAllGameOverAudio === 'function') {
      world.stopAllGameOverAudio();
    }
    if (typeof world.pauseBgMusic === 'function') {
      world.pauseBgMusic();
    }
  }, 'reset-world-audio');
}

/**
 * Resets Game Over and Winner overlays and internal flags.
 *
 * @returns {void}
 */
function resetWorldOverlayState() {
  if (!world) return;

  safeCall(() => {
    if (world.gameOverScreen) {
      world.gameOverScreen.visible = false;
      if (typeof world.gameOverScreen.hideButton === 'function') {
        world.gameOverScreen.hideButton();
      }
    }

    if (world.winnerScreen) {
      if (typeof world.winnerScreen.hide === 'function') {
        world.winnerScreen.hide();
      } else {
        world.winnerScreen.visible = false;
      }
    }

    world.gameOver = false;
    world.gameWon = false;
  }, 'reset-overlays');
}

/**
 * Shuts down the current world instance without reloading the page:
 * - Pauses the game logic
 * - Deactivates story billboard and ambience
 * - Stops all world-related audio
 * - Resets Game Over and Winner overlays
 * - Marks the world as destroyed to stop its draw loop
 *
 * @returns {void}
 */
function shutdownWorld() {
  if (!world) return;

  pauseWorldForShutdown();
  stopWorldStoryAndAmbience();
  resetWorldAudioState();
  resetWorldOverlayState();

  world.destroyed = true;
}

/**
 * "Restart now" flow:
 * - Mark autostart for next boot
 * - Shutdown current world
 * - Reset level
 * - Either go back to start screen (portrait) or restart game immediately (landscape)
 *
 * @returns {void}
 */
function restartNow() {
  safeCall(() => {
    localStorage.setItem('autostart', '1');
  }, 'set-autostart-flag');

  shutdownWorld();

  safeCall(() => {
    if (typeof resetLevel1 === 'function') {
      resetLevel1();
    }
  }, 'reset-level1');

  world = null;
  if (typeof window !== 'undefined') {
    window.world = null;
  }
  isStarting = false;

  // In portrait do NOT start immediately – go back to start screen
  if (typeof isPortraitBlocked === 'function' && isPortraitBlocked()) {
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
 * - Reset labels
 * - Restart menu music (honoring mute state)
 *
 * @returns {void}
 */
function backToStart() {
  safeCall(() => {
    localStorage.removeItem('autostart');
  }, 'clear-autostart-flag');

  shutdownWorld();

  safeCall(() => {
    if (typeof resetLevel1 === 'function') {
      resetLevel1();
    }
  }, 'reset-level1');

  world = null;
  if (typeof window !== 'undefined') {
    window.world = null;
  }
  isStarting = false;

  if (typeof showPauseOverlay === 'function') {
    safeCall(() => showPauseOverlay(false), 'hide-pause-overlay');
  }

  if (startScreen && typeof startScreen.show === 'function') {
    startScreen.show();
  }

  if (typeof applyI18nLabels === 'function') {
    safeCall(() => applyI18nLabels(), 'apply-i18n-labels');
  }

  safeCall(() => {
    if (!menuAudio) return;
    menuAudio.muted = !!isMuted;
    menuAudio.currentTime = 0;
    menuAudio.play().catch(() => {});
  }, 'restart-menu-audio');
}

/**
 * Starts the game:
 * - Blocks start in portrait mode (rotate overlay instead)
 * - Creates a new World instance
 * - Applies mute state
 * - Updates start button label to "Resume"
 * - Focuses canvas so Space no longer triggers UI buttons
 * - Forces touch-controls layout recalculation
 *
 * @returns {void}
 */
function startGame() {
  if (typeof isPortraitBlocked === 'function' && isPortraitBlocked()) {
    if (typeof pokeMobileUiLayout === 'function') {
      pokeMobileUiLayout();
    }
    return;
  }

  if (isStarting || world) {
    if (startScreen && typeof startScreen.hide === 'function') {
      startScreen.hide();
    }
    return;
  }

  isStarting = true;
  stopMenuAudio();

  const canvas = document.getElementById('canvas');
  if (!canvas) {
    isStarting = false;
    return;
  }

  world = new World(canvas, keyboard);
  if (typeof window !== 'undefined') {
    window.world = world;
  }

  setMuted(isMuted);

  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    const label = window.I18N ? window.I18N.t('ui.resume') : 'Resume';
    btnStart.textContent = label;
  }

  if (startScreen && typeof startScreen.hide === 'function') {
    startScreen.hide();
  }

  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  if (typeof pokeMobileUiLayout === 'function') {
    pokeMobileUiLayout();
  }
}

/**
 * Pauses the game:
 * - Sets world.paused
 * - Shows pause overlay
 *
 * @returns {void}
 */
function pauseGame() {
  if (!world || world.paused) return;

  if (typeof world.setPaused === 'function') {
    world.setPaused(true);
  } else {
    world.paused = true;
  }

  if (typeof showPauseOverlay === 'function') {
    showPauseOverlay(true);
  }
}

/**
 * Resumes the game:
 * - Only resumes in landscape (blocks while rotate-overlay is active)
 * - Hides pause overlay
 * - Resumes world
 * - Refocuses canvas and updates start button label
 *
 * @returns {void}
 */
function resumeGame() {
  if (!world || !world.paused) return;

  if (typeof isPortraitBlocked === 'function' && isPortraitBlocked()) {
    if (typeof pokeMobileUiLayout === 'function') {
      pokeMobileUiLayout();
    }
    return;
  }

  if (typeof showPauseOverlay === 'function') {
    showPauseOverlay(false);
  }

  if (typeof world.setPaused === 'function') {
    world.setPaused(false);
  } else {
    world.paused = false;
  }

  const cv = document.getElementById('canvas');
  if (cv) {
    cv.setAttribute('tabindex', '0');
    cv.focus();
  }

  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    const label = window.I18N ? window.I18N.t('ui.resume') : 'Resume';
    btnStart.textContent = label;
  }
}
