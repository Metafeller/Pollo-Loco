// js/controls.js
let world = null;
let keyboard = null;
let startScreen = null;
let menuAudio = null;
let isMuted = false;
let isStarting = false;
let pauseOverlay = null;

function bootApp() {
  // EIN gemeinsames Keyboard für alles
  keyboard = window.KEYBOARD || new Keyboard();
  window.KEYBOARD = keyboard;

  // Game-Controls global machen, damit i18n.js sie verknüpfen kann
  window.startGame = startGame;
  window.pauseGame = pauseGame;
  window.resumeGame = resumeGame;
  //   window.restartGame = () => window.location.reload();
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
  startScreen.attachDom('.game-container');
  startScreen.onStart(() => startGame());
  startScreen.show();

  // Menü-Musik initialisieren
  menuAudio = new Audio('/audio/background-audio.mp3');
  try { 
    menuAudio.loop = true; 
    menuAudio.volume = 0.5; 
    menuAudio.muted = isMuted; 
    // Nur abspielen, wenn KEIN Autostart ansteht
    if (!pendingAutostart) {
        menuAudio.play().catch(()=>{});
        }
  } catch(e){}

  // Autostart jetzt ausführen (ohne Menümusik)
  if (pendingAutostart) {
    try { localStorage.removeItem('autostart'); } catch(e){}
    startGame(); // stoppt ggf. vorhandene Musik, Spiel startet sofort
  }

  // NEU: Autostart nach Reload?
  try {
        if (localStorage.getItem('autostart') === '1') {
            localStorage.removeItem('autostart');
            startGame(); // direkt ins Spiel
        }
   } catch(e){}

  pauseOverlay = createPauseOverlay();

  // initiale Labels + auf Sprachwechsel reagieren
  applyI18nLabels();
  window.addEventListener('i18n:changed', applyI18nLabels);
}

function restartNow(){
  try { localStorage.setItem('autostart', '1'); } catch(e){}
  window.location.reload();
}
function backToStart(){
  try { localStorage.removeItem('autostart'); } catch(e){}
  window.location.reload();
}

function startGame() {
  if (isStarting || world) { startScreen?.hide(); return; }
  isStarting = true;
  try { stopMenuAudio(); } catch(e) {}

  const canvas = document.getElementById('canvas');
  world = new World(canvas, keyboard);

  setMuted(isMuted);

  // UI-Start Button auf Resume
  const btnStart = document.getElementById('btn-start');
  if (btnStart) btnStart.textContent = (window.I18N ? window.I18N.t('ui.resume') : 'Resume');

  startScreen?.hide();
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
}

function toggleMute(){ setMuted(!isMuted); }

function wireUiControls() {
  const qs = id => document.getElementById(id);

  qs('btn-start')?.addEventListener('click', () => {
    if (!world) { startScreen?.hide(); startGame(); }
    else { resumeGame(); }
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

function resumeGame() {
  if (!world || !world.paused) return;
  showPauseOverlay(false);
  world.setPaused(false);

  

  const btnStart = document.getElementById('btn-start');
  if (btnStart) btnStart.textContent = (window.I18N ? window.I18N.t('ui.resume') : 'Resume');
}

/* ===== Pause-Overlay DOM ===== */
function createPauseOverlay() {
  const host = document.querySelector('.game-container');
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
