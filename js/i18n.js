// js/i18n.js
(() => {
  const DEFAULT_LANG = localStorage.getItem('lang') || 'de';
  const SUPPORTED = { de: 'i18n/de.json', en: 'i18n/en.json' };

  // Statische DOM-IDs -> Keys
  const I18N_MAP = {
    'lbl-title': 'app.title',
    'lbl-language': 'ui.language',
    'btn-start': 'ui.start',
    'btn-pause': 'ui.pause',
    'btn-restart': 'ui.backToStart',
    'btn-restart-now': 'ui.restart',
    'btn-lang-de': 'ui.lang_de',
    'btn-lang-en': 'ui.lang_en',
    'btn-to-top': 'ui.toTop',

    'lbl-rules': 'ui-nav.rules',
    'lbl-contact': 'ui-nav.contact',
    'lbl-imprint': 'ui-nav.imprint',
    'lbl-privacy': 'ui-nav.privacy',
    'lbl-copyright': 'footer.copyright',
    'lbl-rules-title': 'rules.title',
    'lbl-imprint-title': 'legal.imprint.title',
    'lbl-privacy-title': 'legal.privacy.title',
  };

  let current = 'de';
  const cache = {};
  let dict = {};

  function getEl(id){ return document.getElementById(id); }

  async function loadLang(lang){
    if (cache[lang]) return cache[lang];
    const res = await fetch(SUPPORTED[lang]);
    if (!res.ok) throw new Error('Failed to load i18n: ' + lang);
    const data = await res.json();
    cache[lang] = data;
    return data;
  }

  function t(obj, key){
    const d = obj || dict;
    return key.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), d) ?? key;
  }

  function applyTranslations(){
    // Statische IDs aus I18N_MAP
    Object.keys(I18N_MAP).forEach((id) => {
      const el = getEl(id);
      if (!el) return;
      const key = I18N_MAP[id];
      const label = t(dict, key);
      el.textContent = label;
      if (id === 'btn-to-top') {
        el.setAttribute('title', label);
        el.setAttribute('aria-label', label);
      }
    });

    // Dynamische Buttons, falls vorhanden (Startscreen, Pause, Winner, GameOver)
    const startGameBtn = getEl('btn-startgame');
    if (startGameBtn) startGameBtn.textContent = t(dict, 'ui.startGame');

    const contBtn = getEl('btn-continue');
    if (contBtn) contBtn.textContent = t(dict, 'ui.continue');

    // WINNER: neue 2-Button-Variante
    const winRestartNow = getEl('btn-win-restart-now');   // "Neu starten" / "Restart"
    if (winRestartNow) winRestartNow.textContent = t(dict, 'ui.restart');

    const winBackStart  = getEl('btn-win-backstart');     // "Zurück zum Startbildschirm" / "Back to Start Screen"
    if (winBackStart)  winBackStart.textContent  = t(dict, 'ui.backToStart');

    // WINNER: Legacy-Fallback (dein aktueller einzelner Button)
    const winRestartLegacy = getEl('btn-win-restart');
    if (winRestartLegacy && !winRestartNow && !winBackStart) {
      winRestartLegacy.textContent = t(dict, 'ui.restart');
    }

    // GAME OVER
    const tryAgain = getEl('btn-try-again');
    if (tryAgain) tryAgain.textContent = t(dict, 'ui.tryAgain');

    // UI-Start zeigt "Start" oder "Resume" je nach Spielzustand
    const uiStart = getEl('btn-start');
    if (uiStart) {
      const isRunning = !!window.world;
      uiStart.textContent = isRunning ? t(dict, 'ui.resume') : t(dict, 'ui.start');
    }

    // TOP-LEISTE: Buttons anpassen
    const uiRestartBack = getEl('btn-restart');       // wird zu "Zurück zum Startbildschirm"
    if (uiRestartBack) uiRestartBack.textContent = t(dict, 'ui.backToStart');

    const uiRestartNow = getEl('btn-restart-now');    // neuer, direkter Neustart
    if (uiRestartNow) uiRestartNow.textContent = t(dict, 'ui.restart');
  }

  function updateActiveButtons(){
    const deBtn = getEl('btn-lang-de');
    const enBtn = getEl('btn-lang-en');
    if (deBtn && enBtn){
      deBtn.classList.toggle('active', current === 'de');
      enBtn.classList.toggle('active', current === 'en');
    }
  }

  async function setLanguage(lang){
    if (!SUPPORTED[lang]) lang = 'de';
    current = lang;
    localStorage.setItem('lang', lang);
    dict = await loadLang(lang);
    applyTranslations();
    updateActiveButtons();
    // Event für dynamische Komponenten
    window.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang: current, dict } }));
  }

  function wireEvents(){
    const deBtn = getEl('btn-lang-de');
    const enBtn = getEl('btn-lang-en');
    if (deBtn) deBtn.addEventListener('click', () => setLanguage('de'));
    if (enBtn) enBtn.addEventListener('click', () => setLanguage('en'));

    // Optional: Game-Controls wenn vorhanden
    const startBtn = getEl('btn-start');
    const pauseBtn = getEl('btn-pause');
    const restartBtn = getEl('btn-restart');
    if (startBtn && typeof window.startGame === 'function') startBtn.addEventListener('click', () => window.startGame());
    if (pauseBtn && typeof window.pauseGame === 'function') pauseBtn.addEventListener('click', () => window.pauseGame());
    if (restartBtn && typeof window.restartGame === 'function') restartBtn.addEventListener('click', () => window.restartGame());
  }

  // Globales API für dynamische Klassen
  window.I18N = {
    t: (key) => t(dict, key),
    setLanguage,
    getDict: () => dict,
    lang: () => current,
    onChange: (cb) => window.addEventListener('i18n:changed', (e) => cb?.(e.detail))
  };

  document.addEventListener('DOMContentLoaded', async () => {
    wireEvents();
    await setLanguage(DEFAULT_LANG);
  });
})();
