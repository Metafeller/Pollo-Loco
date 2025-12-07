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
 * Shuts down the current world instance without reloading the page.
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
 * Marks the next boot to auto-start the game.
 *
 * @returns {void}
 */
function markAutostartForNextBoot() {
  safeCall(() => {
    localStorage.setItem('autostart', '1');
  }, 'set-autostart-flag');
}

/**
 * Clears the autostart flag from localStorage.
 *
 * @returns {void}
 */
function clearAutostartFlag() {
  safeCall(() => {
    localStorage.removeItem('autostart');
  }, 'clear-autostart-flag');
}

/**
 * Resets level 1 safely if the reset function exists.
 *
 * @returns {void}
 */
function resetLevelSafely() {
  safeCall(() => {
    if (typeof resetLevel1 === 'function') {
      resetLevel1();
    }
  }, 'reset-level1');
}

/**
 * Clears world references and restart flags.
 *
 * @returns {void}
 */
function resetWorldRefsAfterRestart() {
  world = null;
  if (typeof window !== 'undefined') {
    window.world = null;
  }
  isStarting = false;
}

/**
 * Handles the portrait-blocked case on restart.
 *
 * @returns {boolean} True if portrait mode is blocked and handled.
 */
function restartToStartScreenIfPortraitBlocked() {
  if (typeof isPortraitBlocked !== 'function' || !isPortraitBlocked()) {
    return false;
  }
  if (startScreen && typeof startScreen.show === 'function') {
    startScreen.show();
  }
  return true;
}

/**
 * Hides the start screen if a hide() method exists.
 *
 * @returns {void}
 */
function hideStartScreenIfPossible() {
  if (startScreen && typeof startScreen.hide === 'function') {
    startScreen.hide();
  }
}

/**
 * Hides the pause overlay if the helper is available.
 *
 * @returns {void}
 */
function hidePauseOverlayIfPossible() {
  if (typeof showPauseOverlay !== 'function') return;
  safeCall(() => {
    showPauseOverlay(false);
  }, 'hide-pause-overlay');
}

/**
 * Shows the start screen if possible.
 *
 * @returns {void}
 */
function showStartScreenIfPossible() {
  if (!startScreen || typeof startScreen.show !== 'function') return;
  startScreen.show();
}

/**
 * Applies i18n labels safely if the helper exists.
 *
 * @returns {void}
 */
function applyI18nLabelsSafely() {
  if (typeof applyI18nLabels !== 'function') return;
  safeCall(() => {
    applyI18nLabels();
  }, 'apply-i18n-labels');
}

/**
 * Restarts the menu audio while honoring the mute state.
 *
 * @returns {void}
 */
function restartMenuAudioSafely() {
  safeCall(() => {
    if (!menuAudio) return;
    menuAudio.muted = !!isMuted;
    menuAudio.currentTime = 0;
    menuAudio.play().catch(() => {});
  }, 'restart-menu-audio');
}

/**
 * "Restart now" flow.
 *
 * @returns {void}
 */
function restartNow() {
  markAutostartForNextBoot();
  shutdownWorld();
  resetLevelSafely();
  resetWorldRefsAfterRestart();

  if (restartToStartScreenIfPortraitBlocked()) {
    return;
  }

  hideStartScreenIfPossible();
  startGame();
}

/**
 * Back to start screen flow.
 *
 * @returns {void}
 */
function backToStart() {
  clearAutostartFlag();
  shutdownWorld();
  resetLevelSafely();
  resetWorldRefsAfterRestart();
  hidePauseOverlayIfPossible();
  showStartScreenIfPossible();
  applyI18nLabelsSafely();
  restartMenuAudioSafely();
}

/**
 * Handles the portrait-blocked start case.
 *
 * @returns {boolean} True if start was blocked due to portrait mode.
 */
function handlePortraitBlockedOnStart() {
  if (typeof isPortraitBlocked === 'function' && isPortraitBlocked()) {
    if (typeof pokeMobileUiLayout === 'function') {
      pokeMobileUiLayout();
    }
    return true;
  }
  return false;
}

/**
 * Handles the case where a game is already starting or running.
 *
 * @returns {boolean} True if start should be aborted.
 */
function handleStartWhenAlreadyRunning() {
  if (!isStarting && !world) {
    return false;
  }
  if (startScreen && typeof startScreen.hide === 'function') {
    startScreen.hide();
  }
  return true;
}

/**
 * Marks the beginning of the game startup sequence.
 *
 * @returns {void}
 */
function beginGameStartup() {
  isStarting = true;
  stopMenuAudio();
}

/**
 * Returns the canvas element or aborts the start when not found.
 *
 * @returns {HTMLCanvasElement|null} Canvas or null if unavailable.
 */
function getGameCanvasOrAbort() {
  const canvas = document.getElementById('canvas');
  if (!canvas) {
    isStarting = false;
    return null;
  }
  return canvas;
}

/**
 * Creates a new World instance for the given canvas and exposes it globally.
 *
 * @param {HTMLCanvasElement} canvas - Game canvas.
 * @returns {void}
 */
function createWorldForCanvas(canvas) {
  world = new World(canvas, keyboard);
  if (typeof window !== 'undefined') {
    window.world = world;
  }
}

/**
 * Updates the start button label to the resume text.
 *
 * @returns {void}
 */
function updateStartButtonLabel() {
  const btnStart = document.getElementById('btn-start');
  if (!btnStart) return;

  const label = window.I18N ? window.I18N.t('ui.resume') : 'Resume';
  btnStart.textContent = label;
}

/**
 * Focuses the canvas and triggers mobile UI layout recalculation.
 *
 * @param {HTMLCanvasElement} canvas - Game canvas.
 * @returns {void}
 */
function focusCanvasAndUpdateLayout(canvas) {
  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  if (typeof pokeMobileUiLayout === 'function') {
    pokeMobileUiLayout();
  }
}

/**
 * Starts the game.
 *
 * @returns {void}
 */
function startGame() {
  if (handlePortraitBlockedOnStart()) {
    return;
  }
  if (handleStartWhenAlreadyRunning()) {
    return;
  }
  beginGameStartup();
  const canvas = getGameCanvasOrAbort();
  if (!canvas) {
    return;
  }
  createWorldForCanvas(canvas);
  setMuted(isMuted);
  updateStartButtonLabel();
  hideStartScreenIfPossible();
  focusCanvasAndUpdateLayout(canvas);
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
 * Resumes the game.
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
