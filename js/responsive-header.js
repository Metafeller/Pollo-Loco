(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const MOBILE_BREAKPOINT = 1368;

  /**
   * Returns true if header should use mobile layout.
   * Uses core flag if available, falls back to viewport.
   *
   * @returns {boolean}
   */
  function isMobileUi() {
    if (typeof window.__RESP_IS_MOBILE__ === 'boolean') {
      return window.__RESP_IS_MOBILE__;
    }

    if (document.body.classList.contains('is-mobile-ui')) {
      return true;
    }

    return window.innerWidth <= MOBILE_BREAKPOINT;
  }

  /**
   * Ensures the style block for the mobile header dropdown exists.
   *
   * @returns {void}
   */
  function ensureHeaderDropdownStyle() {
    const ID = 'hdr-dd-style';
    if (document.getElementById(ID)) return;

    const style = document.createElement('style');
    style.id = ID;
    style.textContent = `
      /* Base: hidden via CSS, not inline-style */
      #header-mobile-menu{ display:none; }
      #header-mobile-menu.open{ display:block; }
      @media (min-width:1369px){
        #header-burger, #header-mobile-menu{ display:none !important; }
      }`;
    document.head.appendChild(style);
  }

  /**
   * Applies inline styles for the mobile header dropdown menu.
   *
   * @param {HTMLDivElement} menu
   * @returns {void}
   */
  function applyHeaderMenuStyles(menu) {
    menu.style.position = 'absolute';
    menu.style.top = '70px';
    menu.style.right = '16px';
    menu.style.background = 'rgba(17,17,17,0.92)';
    menu.style.border = '1px solid rgba(242,212,162,0.35)';
    menu.style.borderRadius = '12px';
    menu.style.padding = '10px';
    menu.style.boxShadow = '0 10px 26px rgba(0,0,0,.55)';
    menu.style.zIndex = '8';
  }

  /**
   * Builds the inner HTML for the mobile header dropdown menu.
   *
   * @returns {string}
   */
  function buildHeaderMenuInnerHtml() {
    const rules   = $('#lbl-rules')?.textContent   || 'Rules';
    const contact = $('#lbl-contact')?.textContent || 'Contact';

    return `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button id="hdr-rules-dd" class="hdr-btn glass">${rules}</button>
        <a class="hdr-btn cta" href="https://metafeller.com" target="_blank" rel="noopener">${contact}</a>
        <a class="icon-link" href="https://github.com/Metafeller" target="_blank" rel="noopener">
          <img src="img/icons/social/github_1.svg" alt="GitHub">
        </a>
        <a class="icon-link" href="https://www.linkedin.com/" target="_blank" rel="noopener">
          <img src="img/icons/social/linkedin_1.svg" alt="LinkedIn">
        </a>
        <a class="icon-link" href="https://www.instagram.com/savasboas/#" target="_blank" rel="noopener">
          <img src="img/icons/social/instagram_1.svg" alt="Instagram">
        </a>
      </div>`;
  }

  /**
   * Wires menu-specific actions like "Rules" inside the mobile dropdown.
   *
   * @param {HTMLDivElement} menu
   * @returns {void}
   */
  function wireHeaderMenuActions(menu) {
    const rulesBtn = menu.querySelector('#hdr-rules-dd');
    if (!rulesBtn) return;

    rulesBtn.addEventListener('click', () => {
      document.getElementById('btn-rules')?.click();
    });
  }

  /**
   * Ensures the mobile header dropdown menu exists.
   *
   * @param {HTMLElement} header
   * @returns {HTMLDivElement}
   */
  function ensureMobileHeaderMenu(header) {
    let menu = $('#header-mobile-menu');
    if (menu) return menu;

    menu = document.createElement('div');
    menu.id = 'header-mobile-menu';
    menu.classList.add('mini-dd');

    applyHeaderMenuStyles(menu);
    menu.innerHTML = buildHeaderMenuInnerHtml();
    header.appendChild(menu);
    wireHeaderMenuActions(menu);

    return menu;
  }

  /**
   * Ensures the header burger button exists.
   *
   * @param {HTMLElement} header
   * @param {HTMLElement} right
   * @returns {HTMLButtonElement}
   */
  function ensureHeaderBurgerButton(header, right) {
    let hb = $('#header-burger');
    if (hb) return hb;

    hb = document.createElement('button');
    hb.id = 'header-burger';
    hb.className = 'hdr-btn glass';
    hb.setAttribute('aria-haspopup', 'menu');
    hb.setAttribute('aria-expanded', 'false');
    hb.style.marginLeft = '8px';
    hb.innerHTML = '☰';

    header.insertBefore(hb, right);
    return hb;
  }

  /**
   * Plays a small bottle SFX when the burger is toggled.
   *
   * @returns {void}
   */
  function playBurgerClickSfx() {
    try {
      if (window.IS_MUTED) return;
      const a = new Audio('/audio/bottle.mp3');
      a.volume = 0.8;
      a.play();
    } catch (_) {}
  }

  /**
   * Handles burger button click: opens/closes the mobile menu.
   *
   * @param {MouseEvent} ev
   * @returns {void}
   */
  function onBurgerClick(ev) {
    ev.preventDefault();

    const menu = document.getElementById('header-mobile-menu');
    const btn  = document.getElementById('header-burger');
    if (!menu || !btn) return;

    const willOpen = !menu.classList.contains('open');
    menu.classList.toggle('open', willOpen);
    menu.style.display = willOpen ? 'block' : 'none';

    btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    playBurgerClickSfx();
  }

  /**
   * Closes the mobile menu when clicking outside burger and menu.
   *
   * @param {MouseEvent} e
   * @returns {void}
   */
  function onBurgerDocumentClick(e) {
    const menu = document.getElementById('header-mobile-menu');
    const btn  = document.getElementById('header-burger');
    if (!menu || !btn) return;
    if (!menu.classList.contains('open')) return;

    const target = e.target;
    if (btn.contains(target) || menu.contains(target)) return;

    menu.classList.remove('open');
    menu.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
  }

  /**
   * Installs a single global click guard to close the mobile menu.
   *
   * @returns {void}
   */
  function installBurgerOutsideClickGuard() {
    if (document.__hdrMenuGuardInstalled) return;
    document.__hdrMenuGuardInstalled = true;

    document.addEventListener('click', onBurgerDocumentClick, true);
  }

  /**
   * Wires the burger button once.
   *
   * @param {HTMLButtonElement|null} btn
   * @returns {void}
   */
  function wireHeaderBurgerButton(btn) {
    if (!btn || btn.__wired) return;
    btn.__wired = true;

    btn.addEventListener('click', onBurgerClick);
    installBurgerOutsideClickGuard();
  }

  /**
   * Hides the desktop header-right area and shows the burger button.
   *
   * @param {HTMLElement} right
   * @param {HTMLButtonElement} burger
   * @returns {void}
   */
  function hideDesktopHeaderRight(right, burger) {
    right.style.display = 'none';
    if (burger) {
      burger.style.display = 'inline-flex';
    }
  }

  /**
   * Restores the desktop header-right area.
   *
   * @param {HTMLElement} right
   * @returns {void}
   */
  function showDesktopHeaderRight(right) {
    right.style.display = '';
  }

  /**
   * Removes burger button and mobile dropdown menu (desktop mode).
   *
   * @returns {void}
   */
  function teardownMobileHeaderMenu() {
    const menu   = $('#header-mobile-menu');
    const burger = $('#header-burger');

    if (menu)   menu.remove();
    if (burger) burger.remove();
  }

  /**
   * Syncs header state to current responsive mode:
   * - On mobile: ensure burger + dropdown
   * - On desktop: restore full header and remove mobile artifacts
   *
   * @returns {void}
   */
  function syncHeaderBurger() {
    const header = $('.header-bar');
    const right  = header ? header.querySelector('.header-right') : null;
    if (!header || !right) return;

    const mobile = isMobileUi();

    if (mobile) {
      ensureHeaderDropdownStyle();
      const menu   = ensureMobileHeaderMenu(header);
      const burger = ensureHeaderBurgerButton(header, right);
      void menu; // keep linter happy if any
      wireHeaderBurgerButton(burger);
      hideDesktopHeaderRight(right, burger);
    } else {
      teardownMobileHeaderMenu();
      showDesktopHeaderRight(right);
    }
  }

  // React on core responsive mode changes
  window.addEventListener('ui:responsive-mode-changed', () => {
    syncHeaderBurger();
  });

  // Initial sync after DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    syncHeaderBurger();
  });
})();
