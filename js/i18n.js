// js/i18n.js
(() => {
  const DEFAULT_LANG = localStorage.getItem('lang') || 'de';
  const SUPPORTED = { de: 'i18n/de.json', en: 'i18n/en.json' };

  // Map DOM IDs -> i18n keys
  const I18N_MAP = {
    'lbl-title': 'app.title',
    'lbl-language': 'ui.language',
    'btn-start': 'ui.start',
    'btn-pause': 'ui.pause',
    'btn-restart': 'ui.restart',
    'btn-lang-de': 'ui.lang_de',
    'btn-lang-en': 'ui.lang_en'
  };

  let current = 'de';
  const cache = {};

  function getEl(id){ return document.getElementById(id); }

  async function loadLang(lang){
    if (cache[lang]) return cache[lang];
    const res = await fetch(SUPPORTED[lang]);
    if (!res.ok) throw new Error('Failed to load i18n: ' + lang);
    const data = await res.json();
    cache[lang] = data;
    return data;
  }

  function t(dict, key){
    return key.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), dict) || key;
  }

  function applyTranslations(dict){
    Object.keys(I18N_MAP).forEach((id) => {
      const el = getEl(id);
      if (!el) return;
      const key = I18N_MAP[id];
      el.textContent = t(dict, key);
    });
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
    const dict = await loadLang(lang);
    applyTranslations(dict);
    updateActiveButtons();
  }

  function wireEvents(){
    const deBtn = getEl('btn-lang-de');
    const enBtn = getEl('btn-lang-en');
    if (deBtn) deBtn.addEventListener('click', () => setLanguage('de'));
    if (enBtn) enBtn.addEventListener('click', () => setLanguage('en'));

    // Optional: hook up game controls if present
    const startBtn = getEl('btn-start');
    const pauseBtn = getEl('btn-pause');
    const restartBtn = getEl('btn-restart');
    if (startBtn && typeof window.startGame === 'function') startBtn.addEventListener('click', () => window.startGame());
    if (pauseBtn && typeof window.pauseGame === 'function') pauseBtn.addEventListener('click', () => window.pauseGame());
    if (restartBtn && typeof window.restartGame === 'function') restartBtn.addEventListener('click', () => window.restartGame());
  }

  document.addEventListener('DOMContentLoaded', async () => {
    wireEvents();
    await setLanguage(DEFAULT_LANG);
  });
})();
