(() => {
  const DEFAULT_LANG = localStorage.getItem('lang') || 'de';
  const SUPPORTED = { de: 'i18n/de.json', en: 'i18n/en.json' };

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
    'lbl-privacy-title': 'legal.privacy.title'
  };

  const FALLBACKS = {
    de: {
      app: { title: 'Das verrückte Huhn' },
      ui: {
        language: 'Sprache',
        start: 'Starten',
        pause: 'Pause',
        restart: 'Neu starten',
        backToStart: 'Zurück zum Startbildschirm',
        lang_de: 'DE',
        lang_en: 'EN',
        toTop: 'Nach oben'
      }
    },
    en: {
      app: { title: 'El Pollo Loco' },
      ui: {
        language: 'Language',
        start: 'Start',
        pause: 'Pause',
        restart: 'Restart',
        backToStart: 'Back to Start Screen',
        lang_de: 'DE',
        lang_en: 'EN',
        toTop: 'Back to top'
      }
    }
  };

  let current = 'de';
  const cache = {};
  let dict = {};

  const getEl = (id) => document.getElementById(id);

  /**
   * Builds the JSON URL for a given language.
   *
   * @param {string} lang
   * @returns {string}
   */
  function buildLangUrl(lang) {
    const file = SUPPORTED[lang];
    return `${file}?v=${Date.now()}`;
  }

  /**
   * Fetches a URL with a timeout wrapper.
   *
   * @param {string} url
   * @param {number} [ms=3500]
   * @returns {Promise<Response>}
   */
  function fetchLangWithTimeout(url, ms = 3500) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('i18n timeout')), ms);

      fetch(url, { cache: 'no-store' }).then(
        (res) => {
          clearTimeout(t);
          resolve(res);
        },
        (err) => {
          clearTimeout(t);
          reject(err);
        }
      );
    });
  }

  /**
   * Validates a fetch response and parses JSON.
   *
   * @param {Response} res
   * @returns {Promise<object>}
   */
  async function parseLangResponse(res) {
    if (!res.ok) {
      throw new Error('HTTP ' + res.status);
    }
    return res.json();
  }

  /**
   * Returns a fallback dictionary for a language.
   *
   * @param {string} lang
   * @returns {object}
   */
  function getFallbackDict(lang) {
    return FALLBACKS[lang] || {};
  }

  /**
   * Loads a language JSON file (with cache + timeout).
   * Falls back to a minimal inline dictionary on failure.
   *
   * @param {string} lang - Language code.
   * @returns {Promise<object>} i18n dictionary.
   */
  async function loadLang(lang) {
    if (cache[lang]) return cache[lang];

    const url = buildLangUrl(lang);

    try {
      const res = await fetchLangWithTimeout(url, 3500);
      const data = await parseLangResponse(res);
      cache[lang] = data;
      return data;
    } catch (e) {
      console.warn('[i18n] Fallback activated for', lang, e);
      const fb = getFallbackDict(lang);
      cache[lang] = fb;
      return fb;
    }
  }

  /**
   * Resolves a dotted i18n key (e.g. "ui.start") into a value.
   *
   * @param {object} obj - Dictionary object.
   * @param {string} key - Dotted key path.
   * @returns {string} Translation or key itself as fallback.
   */
  function t(obj, key) {
    const d = obj || dict;
    return key
      .split('.')
      .reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), d) ?? key;
  }

  /**
   * Minimal "rich" renderer:
   * - If `spec.html` exists → innerHTML
   * - If `spec.body` is an array → wrap each entry in <p>
   *
   * @param {HTMLElement|null} container
   * @param {any} spec - i18n content (html/body).
   */
  function renderRich(container, spec) {
    if (!container || !spec) return;
    if (typeof spec.html === 'string') {
      container.innerHTML = spec.html;
      return;
    }
    if (Array.isArray(spec.body)) {
      container.innerHTML = spec.body.map(p => `<p>${p}</p>`).join('');
    }
  }

  /**
   * Applies translations defined in the static ID → key map.
   *
   * @returns {void}
   */
  function applyStaticIdTranslations() {
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
  }

  /**
   * Updates the "Start Game" button label.
   *
   * @returns {void}
   */
  function updateStartGameButton() {
    const btn = getEl('btn-startgame');
    if (!btn) return;
    btn.textContent = t(dict, 'ui.startGame');
  }

  /**
   * Updates the "Continue" button label.
   *
   * @returns {void}
   */
  function updateContinueButton() {
    const btn = getEl('btn-continue');
    if (!btn) return;
    btn.textContent = t(dict, 'ui.continue');
  }

  /**
   * Updates the "Try again" button label.
   *
   * @returns {void}
   */
  function updateTryAgainButton() {
    const btn = getEl('btn-try-again');
    if (!btn) return;
    btn.textContent = t(dict, 'ui.tryAgain');
  }

  /**
   * Updates the main UI start button ("Start" / "Resume").
   *
   * @returns {void}
   */
  function updateUiStartButton() {
    const btn = getEl('btn-start');
    if (!btn) return;

    const isRunning = !!window.world;
    const key = isRunning ? 'ui.resume' : 'ui.start';
    btn.textContent = t(dict, key);
  }

  /**
   * Updates back / restart button labels in the header controls.
   *
   * @returns {void}
   */
  function updateRestartButtons() {
    const uiRestartBack = getEl('btn-restart');
    if (uiRestartBack) {
      uiRestartBack.textContent = t(dict, 'ui.backToStart');
    }

    const uiRestartNow = getEl('btn-restart-now');
    if (uiRestartNow) {
      uiRestartNow.textContent = t(dict, 'ui.restart');
    }
  }

  /**
   * Applies translations for primary UI buttons
   * (start, continue, restart/back).
   *
   * @returns {void}
   */
  function applyPrimaryButtons() {
    updateStartGameButton();
    updateContinueButton();
    updateTryAgainButton();
    updateUiStartButton();
    updateRestartButtons();
  }

  /**
   * Applies translations for win-screen buttons
   * (new layout + legacy fallback).
   *
   * @returns {void}
   */
  function applyWinScreenButtons() {
    const winRestartNow = getEl('btn-win-restart-now');
    if (winRestartNow) {
      winRestartNow.textContent = t(dict, 'ui.restart');
    }

    const winBackStart = getEl('btn-win-backstart');
    if (winBackStart) {
      winBackStart.textContent = t(dict, 'ui.backToStart');
    }

    const winRestartLegacy = getEl('btn-win-restart');
    const hasModernButtons = !!(winRestartNow || winBackStart);

    if (winRestartLegacy && !hasModernButtons) {
      winRestartLegacy.textContent = t(dict, 'ui.restart');
    }
  }

  /**
   * Applies translations for rich overlay bodies
   * (rules, imprint, privacy).
   *
   * @returns {void}
   */
  function applyOverlayBodies() {
    renderRich(getEl('rules-body'),   dict.rules);
    renderRich(getEl('imprint-body'), dict.legal?.imprint);
    renderRich(getEl('privacy-body'), dict.legal?.privacy);
  }

  /**
   * Applies translations to:
   * - Static ID map
   * - Dynamic buttons (header, overlays, win screen)
   * - Overlay bodies (rules / imprint / privacy)
   *
   * @returns {void}
   */
  function applyTranslations() {
    applyStaticIdTranslations();
    applyPrimaryButtons();
    applyWinScreenButtons();
    applyOverlayBodies();
  }

  /**
   * Updates "active" visual state on language toggle buttons.
   *
   * @returns {void}
   */
  function updateActiveButtons() {
    const deBtn = getEl('btn-lang-de');
    const enBtn = getEl('btn-lang-en');
    if (deBtn && enBtn) {
      deBtn.classList.toggle('active', current === 'de');
      enBtn.classList.toggle('active', current === 'en');
    }
  }

  /**
   * Sets the current language:
   * - Loads dictionary
   * - Applies translations
   * - Updates toggle buttons
   * - Emits an "i18n:changed" event with {lang, dict}
   *
   * @param {string} lang - Language code.
   * @returns {Promise<void>}
   */
  async function setLanguage(lang) {
    if (!SUPPORTED[lang]) lang = 'de';
    current = lang;
    localStorage.setItem('lang', lang);
    dict = await loadLang(lang);
    applyTranslations();
    updateActiveButtons();
    window.dispatchEvent(
      new CustomEvent('i18n:changed', { detail: { lang: current, dict } })
    );
  }

  /**
   * Wires up basic UI events such as:
   * - Start / Pause / Restart (legacy wiring for header buttons)
   * - Language switch buttons (DE/EN)
   *
   * @returns {void}
   */
  function wireEvents() {
    const startBtn = getEl('btn-start');
    const pauseBtn = getEl('btn-pause');
    const restartBtn = getEl('btn-restart');

    if (startBtn && typeof window.startGame === 'function') {
      startBtn.addEventListener('click', () => window.startGame());
    }
    if (pauseBtn && typeof window.pauseGame === 'function') {
      pauseBtn.addEventListener('click', () => window.pauseGame());
    }
    if (restartBtn && typeof window.restartGame === 'function') {
      restartBtn.addEventListener('click', () => window.restartGame());
    }

    const deBtn = getEl('btn-lang-de');
    const enBtn = getEl('btn-lang-en');
    if (deBtn) deBtn.addEventListener('click', () => setLanguage('de'));
    if (enBtn) enBtn.addEventListener('click', () => setLanguage('en'));
  }

  window.I18N = {
    t: (key) => t(dict, key),
    setLanguage,
    getDict: () => dict,
    lang: () => current,
    onChange: (cb) =>
      window.addEventListener('i18n:changed', (e) => cb?.(e.detail))
  };

  document.addEventListener('DOMContentLoaded', async () => {
    wireEvents();
    await setLanguage(DEFAULT_LANG);
  });
})();

window.addEventListener('unhandledrejection', (e) => {
  e.preventDefault();

  const reason = e.reason;
  if (reason && reason.name === 'AbortError') {
    return;
  }

  console.warn('[Unhandled promise]', reason);
});
