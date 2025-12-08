/**
 * Winner overlay screen:
 * - Drawn on top of the game canvas
 * - Plays a short winning animation once (one-shot)
 * - Darkens the background
 * - Shows two DOM buttons:
 *   - Restart game
 *   - Back to start screen
 */
class WinnerScreen extends DrawableObject {
  constructor() {
    super();
    this.initDimensions();
    this.initFramesAndImage();
    this.initState();
    this.initAudio();
  }

  initDimensions() {
    this.width = 720;
    this.height = 480;
  }

  initFramesAndImage() {
    this.FRAMES = [
      '/img/9_intro_outro_screens/win/win_1.png',
      '/img/9_intro_outro_screens/win/win_2.png',
      '/img/9_intro_outro_screens/win/won_1.png',
      '/img/9_intro_outro_screens/win/won_2.png'
    ];
    this.loadImages(this.FRAMES);
    this.img = this.imageCache[this.FRAMES[0]];
  }

  initState() {
    /** @type {boolean} True while the winner overlay is visible. */
    this.visible = false; this._idx = 0; this._timer = null; this._delayMs = 300;
    this._oneShot = true; this._played = false; this.overlayRGBA = 'rgba(0, 0, 0, 0.45)';
    this._ui = null; this._btnRestartNow = null; this._btnBackStart = null; this._syncToCanvas = null;
    this._onRestartNow = null; this._onBackToStart = null;
  }

  initAudio() {
    this.winAudio = new Audio('/audio/winning.mp3');
  }

  onRestartNow(cb) {
    this._onRestartNow = cb;
  }

  onBackToStart(cb) {
    this._onBackToStart = cb;
  }

  /**
   * Shows the winner overlay and starts the win animation + audio.
   *
   * @returns {void}
   */
  show() {
    if (this.visible) return;
    this.visible = true;
    this._played = false;
    this._idx = 0;
    this.ensureDom();
    this.toggleButtons(false);
    this.startAnimationLoop();
    this.playWinAudio();
  }

  /**
   * Starts the animation interval loop.
   *
   * @returns {void}
   */
  startAnimationLoop() {
    this.stopAnimationLoop();
    const lastIdx = this.FRAMES.length - 1;
    this._timer = setInterval(() => {
      this.advanceAnimationFrame(lastIdx);
    }, this._delayMs);
  }

  /**
   * Advances animation frame and handles one-shot end behaviour.
   *
   * @param {number} lastIdx
   * @returns {void}
   */
  advanceAnimationFrame(lastIdx) {
    this._idx++;
    if (this._idx > lastIdx) {
      if (this._oneShot) {
        this.finishOneShotAnimation(lastIdx);
        return;
      }
      this._idx = 0;
    }
    const frameIdx = Math.min(this._idx, lastIdx);
    this.img = this.imageCache[this.FRAMES[frameIdx]];
  }

  /**
   * Finalises one-shot animation and reveals buttons.
   *
   * @param {number} lastIdx
   * @returns {void}
   */
  finishOneShotAnimation(lastIdx) {
    this.stopAnimationLoop();
    this._idx = lastIdx;
    this._played = true;
    this.toggleButtons(true);
  }

  /**
   * Stops the animation interval if active.
   *
   * @returns {void}
   */
  stopAnimationLoop() {
    if (!this._timer) return;
    clearInterval(this._timer);
    this._timer = null;
  }

  /**
   * Plays the win sound once from the beginning.
   *
   * @returns {void}
   */
  playWinAudio() {
    try {
      this.winAudio.pause();
      this.winAudio.currentTime = 0;
      this.winAudio.play();
    } catch (e) {}
  }

  /**
   * Hides the winner overlay and stops animation/buttons.
   *
   * @returns {void}
   */
  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.stopAnimationLoop();
    this.toggleButtons(false);
  }

  /**
   * Draws the winner overlay on top of the canvas.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   * @returns {void}
   */
  drawOverlay(ctx, canvas) {
    if (!this.visible) return;
    this.drawOverlayBackground(ctx, canvas);
    this.drawOverlayFrame(ctx, canvas);
    if (this._syncToCanvas) {
      this._syncToCanvas();
    }
  }

  /**
   * Draws the dark overlay behind the win image.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   * @returns {void}
   */
  drawOverlayBackground(ctx, canvas) {
    ctx.save();
    ctx.fillStyle = this.overlayRGBA;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  /**
   * Draws the current win frame scaled to canvas.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement} canvas
   * @returns {void}
   */
  drawOverlayFrame(ctx, canvas) {
    const idx = Math.max(0, Math.min(this._idx, this.FRAMES.length - 1));
    const img = this.imageCache[this.FRAMES[idx]];
    if (img) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Ensures the DOM overlay for the winner buttons exists.
   *
   * @param {string} [containerSelector='.stage']
   * @returns {void}
   */
  ensureDom(containerSelector = '.stage') {
    if (this._ui) return;

    const canvas = document.querySelector('#canvas');
    const root = document.querySelector(containerSelector) || document.body;
    const ui = this.createUiContainer(root);
    const btnRestartNow = this.createPrimaryButton('btn-win-restart-now');
    const btnBackStart = this.createSecondaryButton('btn-win-backstart');
    this.setButtonLabels(btnRestartNow, btnBackStart);
    this.attachButtonHandlers(btnRestartNow, btnBackStart);
    ui.appendChild(btnRestartNow);
    ui.appendChild(btnBackStart);
    this.attachUiToRoot(root, ui, canvas);
    this._ui = ui;
    this._btnRestartNow = btnRestartNow;
    this._btnBackStart = btnBackStart;
  }

  /**
   * Creates the flex container overlay for the buttons.
   *
   * @param {HTMLElement} root
   * @returns {HTMLDivElement}
   */
  createUiContainer(root) {
    const ui = document.createElement('div');
    ui.id = 'win-overlay-ui';

    Object.assign(ui.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '0',
      height: '0',
      display: 'none',
      pointerEvents: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '12px',
      zIndex: '9999'
    });

    if (getComputedStyle(root).position === 'static') {
      root.style.position = 'relative';
    }

    root.appendChild(ui);
    return ui;
  }

  /**
   * Creates the primary "Restart" style button.
   *
   * @param {string} id
   * @returns {HTMLButtonElement}
   */
  createPrimaryButton(id) {
    const btn = document.createElement('button');
    btn.id = id;

    btn.className = document.querySelector('.go-btn')
      ? 'go-btn'
      : 'game-primary-btn';

    Object.assign(btn.style, {
      pointerEvents: 'auto', padding: '14px 80px',
      fontSize: '28px', fontFamily: "'zabars', Arial, Helvetica, sans-serif",
      border: 'none', borderRadius: '12px',
      cursor: 'pointer', boxShadow: '0 10px 28px rgba(0,0,0,0.35)',
      background: '#068F42', color: '#fff',
      letterSpacing: '1px', backdropFilter: 'blur(2px)',
      transform: 'translateY(0)'
    });

    btn.onmouseenter = () => {
      btn.style.transform = 'translateY(-2px)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'translateY(0)';
    };

    return btn;
  }

  /**
   * Creates the secondary "Back to Start" style button.
   *
   * @param {string} id
   * @returns {HTMLButtonElement}
   */
  createSecondaryButton(id) {
    const btn = this.createPrimaryButton(id);

    Object.assign(btn.style, {
      background: '#f2d5a280', color: '#1a1a1a',
      border: '1px solid #F2D4A2', boxShadow: '4px 4px 8px rgba(0, 0, 0, 0.5)',
      padding: '14px 18px', backdropFilter: 'blur(6px)', marginTop: '8px'
    });

    return btn;
  }

  /**
   * Sets button labels, optionally from I18N.
   *
   * @param {HTMLButtonElement} btnRestartNow
   * @param {HTMLButtonElement} btnBackStart
   * @returns {void}
   */
  setButtonLabels(btnRestartNow, btnBackStart) {
    if (window.I18N) {
      btnRestartNow.textContent = window.I18N.t('ui.restart');
      btnBackStart.textContent = window.I18N.t('ui.backToStart');
      return;
    }
    btnRestartNow.textContent = 'Restart';
    btnBackStart.textContent = 'Back to Start Screen';
  }

  /**
   * Attaches click handlers for restart and back-to-start.
   *
   * @param {HTMLButtonElement} btnRestartNow
   * @param {HTMLButtonElement} btnBackStart
   * @returns {void}
   */
  attachButtonHandlers(btnRestartNow, btnBackStart) {
    btnRestartNow.addEventListener('click', () => {
      if (typeof this._onRestartNow === 'function') {
        this._onRestartNow();
      }
    });

    btnBackStart.addEventListener('click', () => {
      if (typeof this._onBackToStart === 'function') {
        this._onBackToStart();
      }
    });
  }

  /**
   * Anchors the UI overlay to the canvas rect and wires listeners.
   *
   * @param {HTMLElement} root
   * @param {HTMLDivElement} ui
   * @param {HTMLCanvasElement} canvas
   * @returns {void}
   */
  attachUiToRoot(root, ui, canvas) {
    const syncToCanvas = () => {
      const r = canvas.getBoundingClientRect();
      const gr = root.getBoundingClientRect();
      const left = r.left - gr.left + root.scrollLeft;
      const top = r.top - gr.top + root.scrollTop;

      Object.assign(ui.style, {
        left: `${left}px`, top: `${top}px`,
        width: `${r.width}px`, height: `${r.height}px`
      });
    };

    this._syncToCanvas = syncToCanvas;
    syncToCanvas();
    window.addEventListener('resize', syncToCanvas);
    window.addEventListener('scroll', syncToCanvas, true);
    window.addEventListener('i18n:changed', () => {
      this.updateButtonLabels();
    });
  }

  /**
   * Updates button labels when language changes.
   *
   * @returns {void}
   */
  updateButtonLabels() {
    if (!window.I18N) return;

    if (this._btnRestartNow) {
      this._btnRestartNow.textContent = window.I18N.t('ui.restart');
    }
    if (this._btnBackStart) {
      this._btnBackStart.textContent = window.I18N.t('ui.backToStart');
    }
  }

  /**
   * Shows or hides the DOM buttons for the winner overlay.
   *
   * @param {boolean} show
   * @returns {void}
   */
  toggleButtons(show) {
    if (!this._ui) return;
    this._ui.style.display = show ? 'flex' : 'none';
  }
}