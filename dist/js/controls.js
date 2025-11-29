// js/controls.js
let world = null;
let keyboard = null;
let startScreen = null;
let menuAudio = null;
let isMuted = false;
let isStarting = false;
let pauseOverlay = null;


/**
 * True, wenn das Mobile-UI im Portrait läuft und das Rotate-Overlay aktiv ist.
 * Blockiert Spielstart/Resume im Hochformat.
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
 * Behandelt den Fall, dass der Start im Portrait-Modus geblockt wird.
 * Zeigt den Rotate-Overlay sichtbar an und blendet den Startscreen aus.
 * Falls kein Overlay existiert, bleibt der Startscreen als Fallback sichtbar.
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

  // Nur wenn wirklich ein Overlay vorhanden ist, Startscreen ausblenden,
  // damit der Hinweis nicht unter dem Startscreen "verschwindet".
  if (overlayFound && startScreen && typeof startScreen.hide === 'function') {
    try {
      startScreen.hide();
    } catch (e) {}
  } else if (startScreen && typeof startScreen.show === 'function') {
    // Fallback: kein Overlay gefunden -> Startscreen sichtbar lassen
    try {
      startScreen.show();
    } catch (e) {}
  }

  // sorgt dafür, dass responsive.js / touch-controls.js sofort layouten
  pokeMobileUiLayout();
}


/**
 * Triggert ein globales Resize-Event, damit responsive.js & touch-controls.js
 * die Canvas-UI und die Touch-Controls sofort neu layouten.
 */
function pokeMobileUiLayout() {
  try {
    window.dispatchEvent(new Event('resize'));
  } catch (e) {}
}


/**
 * Liest den Mute-Status sicher aus dem localStorage.
 * Gibt bei Fehlern oder fehlendem Wert standardmäßig false zurück.
 * @returns {boolean}
 */
function loadMutedFromStorage() {
  try {
    const saved = localStorage.getItem('soundMuted');
    if (saved === '1' || saved === 'true') return true;
    if (saved === '0' || saved === 'false') return false;
  } catch (e) {}
  return false;
}

function bootApp() {
  // EIN gemeinsames Keyboard für alles
  keyboard = window.KEYBOARD || new Keyboard();
  window.KEYBOARD = keyboard;

  window.__UI_AUDIOS = window.__UI_AUDIOS || [];

    // Mute-Status aus localStorage wiederherstellen
  isMuted = loadMutedFromStorage();

  // Game-Controls global machen, damit i18n.js sie verknüpfen kann
  window.startGame = startGame;
  window.pauseGame = pauseGame;
  window.resumeGame = resumeGame;
  
  window.restartGame = backToStart; // ← "Zurück zum Startbildschirm"
  window.restartNow  = restartNow;  // ← direkter Neustart
  window.backToStart = backToStart;

  wireUiControls();

  // Space auf UI-Buttons beim laufenden Spiel neutralisieren
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && window.world && !window.world.paused) {
      const a = document.activeElement;
      if (a && (a.tagName === 'BUTTON' || a.getAttribute('role') === 'button')) {
        e.preventDefault();
        e.stopPropagation();
        a.blur(); // Fokus wegnehmen -> kein "Space=Click"
      }
    }
  }, true);

  // Autostart früh prüfen (vor Musik-Setup!)
  const pendingAutostart = (() => {
    try { return localStorage.getItem('autostart') === '1'; } catch(e){ return false; }
  })();

  startScreen = new StartScreen('/img/9_intro_outro_screens/start/startscreen_3.png');
  startScreen.attachDom('#stage'); // vorher '.game-container'
  startScreen.onStart(() => {
    // Start im Portrait-Modus blockieren – erst drehen, dann spielen
    if (isPortraitBlocked()) {
      handlePortraitBlockedStart();  // ← zentraler Portrait-Block
      return;
    }
    startGame();
  });
  startScreen.show();

  // Menü-Musik initialisieren
  menuAudio = new Audio('audio/background-audio.mp3');
  try {
    menuAudio.loop = true;
    menuAudio.volume = 0.5;
    menuAudio.muted = isMuted;
    // Nur abspielen, wenn KEIN Autostart ansteht
    if (!pendingAutostart) {
      menuAudio.play().catch(()=>{});
    }
  } catch(e){}

  // Mute-Status auf UI, Menü-Audio und globale Audios anwenden
  setMuted(isMuted);

  // Autostart jetzt ausführen (ohne Menümusik)
  if (pendingAutostart) {
    try { localStorage.removeItem('autostart'); } catch(e){}
    startGame(); // stoppt ggf. vorhandene Musik, Spiel startet sofort
  }

  // NEU: Autostart nach Reload?
//   try {
//         if (localStorage.getItem('autostart') === '1') {
//             localStorage.removeItem('autostart');
//             startGame(); // direkt ins Spiel
//         }
//    } catch(e){}

  pauseOverlay = createPauseOverlay();

  // initiale Labels + auf Sprachwechsel reagieren
  applyI18nLabels();
  window.addEventListener('i18n:changed', applyI18nLabels);

  // NEU: Wenn wir von Portrait → Landscape wechseln und noch keine World läuft,
  // stellen wir sicher, dass der Startscreen wieder sichtbar ist.
  const ensureStartScreenVisible = () => {
    // nur, wenn noch kein Spiel läuft:
    if (!world && startScreen && !isPortraitBlocked()) {
      try {
        startScreen.show();
      } catch (e) {}
    }
  };

  window.addEventListener('resize', ensureStartScreenVisible);
  window.addEventListener('orientationchange', ensureStartScreenVisible);
}

// === World-Reset ohne Page-Reload ==================================

// function shutdownWorld() {
//     if (!world) return;

//     try { world.setPaused(true); } catch (e) {}
//     try { world.stopAllGameOverAudio(); } catch (e) {}
//     try { world.pauseBgMusic(); } catch (e) {}

//     // 🔥 WICHTIG: GameOver-/Winner-Overlays sauber zurücksetzen
//     try {
//         if (world.gameOverScreen) {
//             world.gameOverScreen.visible = false;

//           // NEU: DOM-Button wirklich verstecken
//             if (typeof world.gameOverScreen.hideButton === 'function') {
//                 world.gameOverScreen.hideButton();
//             }
//         }
          
//         if (world.winnerScreen) {
//             // WinnerScreen hat eine eigene hide()-Methode
//             if (typeof world.winnerScreen.hide === 'function') {
//                 world.winnerScreen.hide();
//             } else {
//                 world.winnerScreen.visible = false;
//             }
//         }
          
//         world.gameOver = false;
//         world.gameWon  = false;
//     } catch (e) {}

//     // Draw-Loop dieser Instanz hart stoppen
//     world.destroyed = true;
// }

function shutdownWorld() {
    if (!world) return;

    // 1) Logik pausieren, damit keine weitere Spiel-Loop aktiv ist
    try { world.setPaused(true); } catch (e) {}

    // 2) Story-/Boss-Umgebung stoppen (kein "Help / What are you doing" im Startscreen)
    try {
        if (world.hutStory && typeof world.hutStory.deactivate === 'function') {
            world.hutStory.deactivate();
        }
    } catch (e) {}

    // Endboss-Countdown + Ambience hart aus
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

    // 3) Alle World-Audios (Boss, Story, GO/Win, BG, Steps …) sauber stoppen & zurücksetzen
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

    // 4) GameOver-/Winner-Overlays sauber zurücksetzen
    try {
        if (world.gameOverScreen) {
            world.gameOverScreen.visible = false;

            // NEU: DOM-Button wirklich verstecken
            if (typeof world.gameOverScreen.hideButton === 'function') {
                world.gameOverScreen.hideButton();
            }
        }

        if (world.winnerScreen) {
            // WinnerScreen hat eine eigene hide()-Methode
            if (typeof world.winnerScreen.hide === 'function') {
                world.winnerScreen.hide();
            } else {
                world.winnerScreen.visible = false;
            }
        }

        world.gameOver = false;
        world.gameWon  = false;
    } catch (e) {}

    // 5) Draw-Loop dieser Instanz hart stoppen
    world.destroyed = true;
}


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

    // Im Portrait nicht direkt neu starten – zurück zum Startscreen
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


function backToStart() {
    // Autostart-Flag löschen, damit wir wirklich im Startscreen landen
    try { localStorage.removeItem('autostart'); } catch (e) {}

    // laufende World beenden
    shutdownWorld();

    // NEU: Level-Reset auch hier
    try {
        if (typeof resetLevel1 === 'function') {
            resetLevel1();
        }
    } catch (e) {}

    // globale Referenz freigeben
    world = null;
    if (typeof window !== 'undefined') window.world = null;
    isStarting = false;

    // Pause-Overlay sicher verstecken (falls offen)
    try { showPauseOverlay(false); } catch (e) {}

    // Startscreen anzeigen
    if (startScreen && typeof startScreen.show === 'function') {
        startScreen.show();
    }

    // Labels neu setzen (btn-start = "Start" statt "Resume")
    try { applyI18nLabels(); } catch (e) {}

    // Menü-Musik wieder starten (respektiert Mute-Status)
    try {
        if (menuAudio) {
            menuAudio.muted = !!isMuted;
            menuAudio.currentTime = 0;
            menuAudio.play().catch(() => {});
        }
    } catch (e) {}
}

// === Alte Versionen (Page-Reload) ================================

// function restartNow(){
//   try { localStorage.setItem('autostart', '1'); } catch(e){}
//   window.location.reload();
// }

// function backToStart(){
//   try { localStorage.removeItem('autostart'); } catch(e){}
//   window.location.reload();
// }


// function startGame() {
//   if (isStarting || world) { startScreen?.hide(); return; }
//   isStarting = true;
//   try { stopMenuAudio(); } catch(e) {}

//   const canvas = document.getElementById('canvas');

//   // Fokusierbar machen (einmal reicht, schadet aber nicht)
// //   canvas.setAttribute('tabindex', '0');

//   world = new World(canvas, keyboard);

//   setMuted(isMuted);

//   // UI-Start Button auf Resume
//   const btnStart = document.getElementById('btn-start');
//   if (btnStart) btnStart.textContent = (window.I18N ? window.I18N.t('ui.resume') : 'Resume');

//   startScreen?.hide();
  
//   // <<< WICHTIG: Canvas fokussieren, damit Space nicht Buttons triggert
//   canvas.focus();
// }


function startGame() {
  // Portrait-Block: wenn Rotate-Overlay aktiv ist, kein Spielstart
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

  // Canvas fokussieren, damit Space nicht Buttons triggert
  canvas.setAttribute('tabindex', '0');
  canvas.focus();

  // WICHTIG: Touch-Controls sofort neu layouten, damit D-Pad beim ersten Start
  // im Landscape-Modus direkt sichtbar ist (kein zweiter Rotate nötig)
  pokeMobileUiLayout();
}


function stopMenuAudio() {
  try { if (menuAudio) { menuAudio.pause(); menuAudio.currentTime = 0; } } catch(e){}
}

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
      auds.forEach(a => { try { a.muted = isMuted; } catch(e){} });
    } catch(e){}
  }

  if (window.__UI_AUDIOS && Array.isArray(window.__UI_AUDIOS)) {
  try { window.__UI_AUDIOS.forEach(a => { try { a.muted = isMuted; } catch(e){} }); } catch(e){}
  }
  window.IS_MUTED = isMuted; // damit ui-frame.js den Zustand kennt

  // Mute-Status persistent speichern
  try {
    localStorage.setItem('soundMuted', isMuted ? '1' : '0');
  } catch (e) {}
}

function toggleMute(){ setMuted(!isMuted); }


function wireUiControls() {
  const qs = id => document.getElementById(id);

  qs('btn-start')?.addEventListener('click', () => {
    if (!world) {
      // Kein Start im Portrait-Modus
      if (isPortraitBlocked()) {
        handlePortraitBlockedStart();   // ← gleicher Flow wie auf dem Startscreen
      } else {
        startScreen?.hide();
        startGame();
      }
    } else {
      resumeGame();
    }
    document.activeElement?.blur();
  });

  qs('btn-pause')?.addEventListener('click', () => { if (world) pauseGame(); document.activeElement?.blur(); });
  qs('btn-restart')?.addEventListener('click', () => { backToStart(); document.activeElement?.blur(); });
  qs('btn-restart-now')?.addEventListener('click', () => { restartNow(); document.activeElement?.blur(); });
  qs('btn-mute')?.addEventListener('click', () => { toggleMute(); document.activeElement?.blur(); });
}


/* ===== Pause / Resume ===== */
function pauseGame() {
  if (!world || world.paused) return;
  world.setPaused(true);
  showPauseOverlay(true);
}

// function resumeGame() {
//   if (!world || !world.paused) return;
//   showPauseOverlay(false);
//   world.setPaused(false);

//   // Canvas wieder fokussieren
//   const cv = document.getElementById('canvas');
//   cv?.setAttribute('tabindex','0');
//   cv?.focus();

//   const btnStart = document.getElementById('btn-start');
//   if (btnStart) btnStart.textContent = (window.I18N ? window.I18N.t('ui.resume') : 'Resume');
// }


function resumeGame() {
  if (!world || !world.paused) return;

  // Im Portrait-Modus nicht fortsetzen, solange Rotate-Overlay aktiv ist
  if (isPortraitBlocked()) {
    pokeMobileUiLayout();
    return;
  }

  showPauseOverlay(false);
  world.setPaused(false);

  // Canvas wieder fokussieren
  const cv = document.getElementById('canvas');
  cv?.setAttribute('tabindex','0');
  cv?.focus();

  const btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.textContent = (window.I18N ? window.I18N.t('ui.resume') : 'Resume');
  }
}


/* ===== Pause-Overlay DOM ===== */
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

function showPauseOverlay(show) {
  if (!pauseOverlay) return;
  pauseOverlay.classList.toggle('hidden', !show);
}

/* ===== i18n-Labels anpassen ===== */
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
