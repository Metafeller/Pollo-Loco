// js/controls-core.js
// Globale Game- und Audio-States + Mute-/Audio-Helfer.

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
 * @param {Function} fn - Callback to execute.
 * @param {string} [label] - Optional label for debug output.
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
    } catch (logError) {}
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
 * Updates the mute button label and aria state.
 *
 * @param {boolean} muted - Current mute state.
 * @returns {void}
 */
function updateMuteButtonUI(muted) {
  const btn = document.getElementById('btn-mute');
  if (!btn) return;

  btn.textContent = muted ? '🔇' : '🔈';
  btn.setAttribute('aria-pressed', String(muted));
}

/**
 * Applies the mute state to the menu audio instance.
 *
 * @param {boolean} muted - Current mute state.
 * @returns {void}
 */
function applyMutedToMenuAudio(muted) {
  if (!menuAudio) return;
  menuAudio.muted = muted;
}

/**
 * Applies the mute state to all world-related audio objects.
 *
 * @param {boolean} muted - Current mute state.
 * @returns {void}
 */
function applyMutedToWorldAudios(muted) {
  if (!world || typeof world.getAllAudiosDeep !== 'function') return;

  safeCall(() => {
    const auds = world.getAllAudiosDeep();
    if (!Array.isArray(auds)) return;

    auds.forEach((a) => {
      if (!a) return;
      safeCall(() => {
        a.muted = muted;
      }, 'mute-world-audio');
    });
  }, 'mute-world-audios');
}

/**
 * Applies the mute state to UI audio elements registered in window.__UI_AUDIOS.
 *
 * @param {boolean} muted - Current mute state.
 * @returns {void}
 */
function applyMutedToUiAudios(muted) {
  if (!window.__UI_AUDIOS || !Array.isArray(window.__UI_AUDIOS)) return;

  safeCall(() => {
    window.__UI_AUDIOS.forEach((a) => {
      if (!a) return;
      safeCall(() => {
        a.muted = muted;
      }, 'mute-ui-audio');
    });
  }, 'mute-ui-audios');
}

/**
 * Stores the mute state on the global window object.
 *
 * @param {boolean} muted - Current mute state.
 * @returns {void}
 */
function setGlobalMuteFlag(muted) {
  window.IS_MUTED = muted;
}

/**
 * Persists the mute state into localStorage.
 *
 * @param {boolean} muted - Current mute state.
 * @returns {void}
 */
function persistMutedFlag(muted) {
  safeCall(() => {
    localStorage.setItem('soundMuted', muted ? '1' : '0');
  }, 'persist-muted-flag');
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

  updateMuteButtonUI(isMuted);
  applyMutedToMenuAudio(isMuted);
  applyMutedToWorldAudios(isMuted);
  applyMutedToUiAudios(isMuted);
  setGlobalMuteFlag(isMuted);
  persistMutedFlag(isMuted);
}

/**
 * Toggles the mute state on/off.
 *
 * @returns {void}
 */
function toggleMute() {
  setMuted(!isMuted);
}
