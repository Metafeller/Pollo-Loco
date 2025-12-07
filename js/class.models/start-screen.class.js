/**
 * Start screen overlay in front of the game:
 * - Shows a background image
 * - Displays a localized "Start Game" button
 * - Calls a callback once the button is pressed
 */
class StartScreen {
  /**
   * Creates a start screen instance.
   *
   * @param {string} [img='/img/9_intro_outro_screens/start/startscreen_3.png']
   *        Background image URL used for the start screen.
   */
  constructor(img = '/img/9_intro_outro_screens/start/startscreen_3.png') {
    this.img = img;
    this.root = null;
    this._cb = null;

    // Bind i18n listener once
    this._onLang = this._onLang?.bind?.(this);
  }

  /**
   * Attaches the start screen DOM to the given container.
   * Creates a full-size overlay with a "Start Game" button.
   *
   * @param {string} [containerSel='.game-container'] - Host container selector.
   * @returns {void}
   */
  attachDom(containerSel = '.game-container') {
    const host = document.querySelector(containerSel);
    if (!host) return;

    const root = this._createRootElement();
    const btn  = this._createStartButton();

    root.appendChild(btn);
    host.appendChild(root);

    this.root = root;
    window.addEventListener('i18n:changed', this._onLang);
  }

  /**
   * Creates the root overlay container div.
   *
   * @returns {HTMLDivElement}
   * @private
   */
  _createRootElement() {
    const div = document.createElement('div');
    div.className = 'start-screen';
    div.style.backgroundImage = `url('${this.img}')`;
    return div;
  }

  /**
   * Creates the "Start Game" button element with listeners.
   *
   * @returns {HTMLButtonElement}
   * @private
   */
  _createStartButton() {
    const btn = document.createElement('button');
    btn.id = 'btn-startgame';

    btn.className = document.querySelector('.go-btn')
      ? 'go-btn'
      : 'game-primary-btn';

    btn.textContent = this._getStartButtonLabel();
    btn.addEventListener('click', () => this._handleStartClick());

    return btn;
  }

  /**
   * Returns the localized label for the start button.
   *
   * @returns {string}
   * @private
   */
  _getStartButtonLabel() {
    if (window.I18N) {
      return window.I18N.t('ui.startGame');
    }
    return 'Start Game';
  }

  /**
   * Handles the click on the start button.
   *
   * @returns {void}
   * @private
   */
  _handleStartClick() {
    this.hide();
    if (typeof this._cb === 'function') {
      this._cb();
    }
  }

  /**
   * Internal i18n listener that updates the button label
   * when the language is changed at runtime.
   *
   * @returns {void}
   * @private
   */
  _onLang() {
    const btn = this.root?.querySelector('#btn-startgame');
    if (!btn) return;
    btn.textContent = this._getStartButtonLabel();
  }

  /**
   * Registers a callback that will be invoked once the
   * player clicks on the "Start Game" button.
   *
   * @param {Function} cb - Callback to start the game.
   * @returns {void}
   */
  onStart(cb) {
    this._cb = cb;
  }

  /**
   * Shows the start screen overlay.
   *
   * @returns {void}
   */
  show() {
    if (this.root) {
      this.root.style.display = 'flex';
    }
  }

  /**
   * Hides the start screen overlay.
   *
   * @returns {void}
   */
  hide() {
    if (this.root) {
      this.root.style.display = 'none';
    }
  }
}
