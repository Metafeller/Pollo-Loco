/**
 * DOM-based Game Over overlay:
 * - Becomes visible several seconds after the player dies
 * - Shows a "Try Again" button and a small credit line
 * - Uses i18n labels if available
 */
class GameOverScreen {
  /**
   * Creates the Game Over UI controller (canvas overlay + DOM button).
   */
  constructor() {
    this.visible = false;
    this._showButton = false;
    this.bgPath = '/img/objects/crying-at-gravestone.png';
    this.bgImg = new Image();
    this.bgImg.src = this.bgPath;
    this._container = null;
    this._btn = null;
    this._credit = null;
    this._syncToCanvas = null;
    this._gameOverLabel =
      (window.I18N ? window.I18N.t('game.gameOver') : 'GAME OVER');
    this._onLangChange = () => this._applyI18n();
  }

  /**
   * Applies current translation strings to UI elements
   * and re-syncs the layout if needed.
   *
   * @returns {void}
   * @private
   */
  _applyI18n() {
    if (!window.I18N) return;
    this._gameOverLabel = window.I18N.t('game.gameOver');

    if (this._btn) {
      this._btn.textContent = window.I18N.t('ui.tryAgain');
    }

    this._syncToCanvas && this._syncToCanvas();
  }

  /**
   * Creates and attaches the DOM overlay directly above the canvas area.
   * A flex container is positioned to follow the canvas rectangle.
   *
   * @param {string} [containerSelector='.stage'] - Optional selector for the root container.
   * @returns {void}
   */
  attachDom(containerSelector = '.stage') {
    if (this._container) return;

    const canvas = document.querySelector('#canvas');
    if (!canvas) return;

    const root = this._resolveRoot(containerSelector, canvas);
    const wrap = this._createOverlayWrapper();
    const btn = this._createTryAgainButton();
    const credit = this._createCreditLabel();
    wrap.appendChild(btn);
    wrap.appendChild(credit);
    this._ensureRootPositioned(root);
    root.appendChild(wrap);
    const syncToCanvas = this._createSyncToCanvasFn(canvas, root, wrap);
    this._syncToCanvas = syncToCanvas;
    this._initSyncListeners(syncToCanvas);
    this._registerI18n();
    this._container = wrap; 
    this._btn = btn; 
    this._credit = credit;
  }

  _resolveRoot(containerSelector, canvas) {
    const direct = document.querySelector(containerSelector);
    if (direct) return direct;

    const stageParent = canvas.closest('.stage') || canvas.parentElement;
    if (stageParent) return stageParent;

    return document.body;
  }

  _createOverlayWrapper() {
    const wrap = document.createElement('div');
    wrap.id = 'go-overlay-ui';
    wrap.style.position = 'absolute';
    wrap.style.left = '0';
    wrap.style.top = '0';
    wrap.style.width = '0';
    wrap.style.height = '0';
    wrap.style.display = 'none';
    wrap.style.pointerEvents = 'none';
    wrap.style.alignItems = 'center';
    wrap.style.justifyContent = 'flex-end';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '12px';
    wrap.style.zIndex = '995';
    wrap.style.paddingBottom = '48px';
    return wrap;
  }

  _createTryAgainButton() {
    const btn = document.createElement('button');
    btn.id = 'btn-try-again';
    btn.textContent =
      (window.I18N ? window.I18N.t('ui.tryAgain') : 'Try Again');

    btn.style.pointerEvents = 'auto';
    btn.style.padding = '14px 28px';
    btn.style.fontSize = '28px';
    btn.style.fontFamily = "'zabars', Arial, Helvetica, sans-serif";
    btn.style.border = 'none';
    btn.style.borderRadius = '16px';
    btn.style.cursor = 'pointer';
    btn.style.boxShadow = '0 10px 28px rgba(0,0,0,0.35)';
    btn.style.background = '#068F42';
    btn.style.color = '#fff';
    btn.style.letterSpacing = '0.5px';
    btn.style.backdropFilter = 'blur(2px)';
    btn.style.transform = 'translateY(0)';

    btn.onmouseenter = () => {
      btn.style.transform = 'translateY(-2px)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'translateY(0)';
    };

    return btn;
  }

  _createCreditLabel() {
    const credit = document.createElement('div');
    credit.id = 'go-credit';
    credit.textContent = 'Made By Taironman';

    credit.style.marginBottom = '80px';
    credit.style.marginTop = '8px';
    credit.style.fontSize = '13px';
    credit.style.fontFamily = "'Arial', Helvetica, sans-serif";
    credit.style.opacity = '0.9';
    credit.style.color = '#e0e0e0';
    credit.style.textShadow = '0 1px 2px rgba(0,0,0,0.6)';
    credit.style.pointerEvents = 'none';

    return credit;
  }

  _ensureRootPositioned(root) {
    const style = getComputedStyle(root);
    if (style.position === 'static') {
      root.style.position = 'relative';
    }
  }

  _createSyncToCanvasFn(canvas, root, wrap) {
    return () => {
      const r = canvas.getBoundingClientRect();
      const gr = root.getBoundingClientRect();

      const left = r.left - gr.left + root.scrollLeft;
      const top = r.top - gr.top + root.scrollTop;

      wrap.style.left = `${left}px`;
      wrap.style.top = `${top}px`;
      wrap.style.width = `${r.width}px`;
      wrap.style.height = `${r.height}px`;
      wrap.style.display = this._showButton ? 'flex' : 'none';
    };
  }

  _initSyncListeners(syncToCanvas) {
    syncToCanvas();
    window.addEventListener('resize', syncToCanvas);
    window.addEventListener('scroll', syncToCanvas, true);
    document.addEventListener('fullscreenchange', syncToCanvas);
  }

  _registerI18n() {
    window.addEventListener('i18n:changed', this._onLangChange);
    this._applyI18n();
  }

  /**
   * Registers a callback for the Try Again button.
   *
   * @param {Function} handler - Callback invoked when the button is clicked.
   * @returns {void}
   */
  onTryAgain(handler) {
    if (!this._btn) return;

    this._btn.onclick = (ev) => {
      ev?.preventDefault?.();
      try {
        handler?.();
      } catch (e) {}
    };
  }

  show() {
    this.visible = true;
  }

  showButton() {
    this._showButton = true;
    if (this._container) {
      this._container.style.display = 'flex';
      this._syncToCanvas && this._syncToCanvas();
    }
  }

  hideButton() {
    this._showButton = false;
    if (this._container) {
      this._container.style.display = 'none';
    }
  }

  /**
   * Draws the Game Over canvas overlay (background, dark film, title text).
   * The DOM button itself is not drawn here – it is handled by attachDom().
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context.
   * @param {HTMLCanvasElement} canvas - The game canvas.
   * @returns {void}
   */
  drawOverlay(ctx, canvas) {
    if (!this.visible || !ctx || !canvas) return;

    const { width, height } = canvas;
    this._drawBackground(ctx, width, height);
    this._drawDarkOverlay(ctx, width, height);
    this._drawGameOverTitle(ctx, width, height);
  }

  /**
   * Draws the background image (or a fallback color) behind the overlay.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   * @returns {void}
   * @private
   */
  _drawBackground(ctx, width, height) {
    const img = this.bgImg;
    const valid =
      img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;

    if (!valid) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const scale = Math.max(width / imgW, height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const dx = (width - drawW) / 2;
    const dy = (height - drawH) / 2;

    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  /**
   * Draws the semi-transparent dark film over the whole canvas.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   * @returns {void}
   * @private
   */
  _drawDarkOverlay(ctx, width, height) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Draws the "GAME OVER" title text centered on the canvas.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   * @returns {void}
   * @private
   */
  _drawGameOverTitle(ctx, width, height) {
    const title = (this._gameOverLabel || 'GAME OVER').toUpperCase();

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    ctx.font = "bold 64px 'zabars', Arial, Helvetica, sans-serif";
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 12;

    const x = width / 2;
    const y = Math.floor(height * 0.5);
    ctx.fillText(title, x, y);
    ctx.restore();
  }
}
