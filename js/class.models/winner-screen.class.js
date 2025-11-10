// js/class.models/winner-screen.class.js
class WinnerScreen extends DrawableObject {
  constructor() {
    super();
    this.width = 720;
    this.height = 480;

    this.FRAMES = [
      '/img/9_intro_outro_screens/win/win_1.png',
      '/img/9_intro_outro_screens/win/win_2.png',
      '/img/9_intro_outro_screens/win/win_3.png',
      '/img/9_intro_outro_screens/win/win_4.png'
    ];
    this.loadImages(this.FRAMES);
    this.img = this.imageCache[this.FRAMES[0]];

    this.visible = false;
    this._idx = 0;
    this._timer = null;
    this._delayMs = 300;

    // One-Shot (Frames laufen EINMAL durch, dann stoppen)
    this._oneShot = true;
    this._played = false;
    this.winAudio = new Audio('/audio/winning.mp3');

    // Canvas-Verdunklung
    this.overlayRGBA = 'rgba(0, 0, 0, 0.45)';

    // DOM-Overlay (Buttons)
    this._ui = null;
    this._btnRestartNow = null;
    this._btnBackStart = null;
    this._syncToCanvas = null;
  }

  // Callbacks nach außen
  onRestartNow(cb){ this._onRestartNow = cb; }
  onBackToStart(cb){ this._onBackToStart = cb; }

  show() {
    if (this.visible) return;
    this.visible = true;
    this._played = false;
    this._idx = 0;

    // Buttons verstecken bis Frames fertig
    this.ensureDom();
    this.toggleButtons(false);

    // Frames als One-Shot
    this._timer && clearInterval(this._timer);
    this._timer = setInterval(() => {
      this._idx++;
      const lastIdx = this.FRAMES.length - 1;
      if (this._idx > lastIdx) {
        if (this._oneShot) {
          clearInterval(this._timer);
          this._timer = null;
          this._idx = lastIdx;     // auf letztem Frame stehen bleiben
          this._played = true;
          this.toggleButtons(true); // erst jetzt Buttons zeigen
        } else {
          this._idx = 0;
        }
      }
      this.img = this.imageCache[this.FRAMES[Math.min(this._idx, lastIdx)]];
    }, this._delayMs);

    // Win-Sound einmalig
    try {
      this.winAudio.pause();
      this.winAudio.currentTime = 0;
      this.winAudio.play();
    } catch(e){}
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
    this.toggleButtons(false);
  }

  drawOverlay(ctx, canvas) {
    if (!this.visible) return;
    try {
      // 1) Dark overlay
      ctx.save();
      ctx.fillStyle = this.overlayRGBA;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();

      // 2) aktueller Win-Frame fullscreen
      const img = this.imageCache[this.FRAMES[Math.max(0, Math.min(this._idx, this.FRAMES.length - 1))]];
      if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 3) DOM-Overlay an Canvas-Rect anpassen
      this._syncToCanvas && this._syncToCanvas();
    } catch(e) {}
  }

  // ===== DOM-Overlay (Buttons) =====
  ensureDom(containerSelector = '.game-container') {
    if (this._ui) return;

    const canvas = document.querySelector('#canvas');
    const root = document.querySelector(containerSelector) || document.body;

    const ui = document.createElement('div');
    ui.id = 'win-overlay-ui';
    ui.style.position = 'absolute';
    ui.style.left = '0';
    ui.style.top = '0';
    ui.style.width = '0';
    ui.style.height = '0';
    ui.style.display = 'none';
    ui.style.pointerEvents = 'none';
    ui.style.alignItems = 'center';
    ui.style.justifyContent = 'center';
    ui.style.flexDirection = 'column';
    ui.style.gap = '12px';
    ui.style.zIndex = '9999';

    const mkBtn = (id) => {
      const b = document.createElement('button');
      b.id = id;
      b.className = (document.querySelector('.go-btn')) ? 'go-btn' : 'game-primary-btn';
      b.style.pointerEvents = 'auto';
      b.style.padding = '14px 80px';
      b.style.fontSize = '28px';
      b.style.fontFamily = "'zabars', Arial, Helvetica, sans-serif";
      b.style.border = 'none';
      b.style.borderRadius = '12px';
      b.style.cursor = 'pointer';
      b.style.boxShadow = '0 10px 28px rgba(0,0,0,0.35)';
      b.style.background = '#068F42';
      b.style.color = '#fff';
      b.style.letterSpacing = '1px';
      b.style.backdropFilter = 'blur(2px)';
      b.style.transform = 'translateY(0)';
      b.onmouseenter = () => b.style.transform = 'translateY(-2px)';
      b.onmouseleave = () => b.style.transform = 'translateY(0)';
      return b;
    };

    const btnRestartNow = mkBtn('btn-win-restart-now');
    btnRestartNow.textContent = (window.I18N ? window.I18N.t('ui.restart') : 'Restart');
    btnRestartNow.addEventListener('click', () => {
      if (typeof this._onRestartNow === 'function') this._onRestartNow();
    });

    const btnBackStart = mkBtn('btn-win-backstart');
    btnBackStart.textContent = (window.I18N ? window.I18N.t('ui.backToStart') : 'Back to Start Screen');

    // Back to Start: transparenter Blur-Button
    // btnBackStart.style.background = 'rgba(0,0,0,0.1)';
    // btnBackStart.style.color = '#fff';
    // btnBackStart.style.border = '1px solid rgba(255,255,255,0.35)';
    // btnBackStart.style.backdropFilter = 'blur(6px)';
    // btnBackStart.style.marginTop = '8px';

    btnBackStart.style.background = '#f2d5a280';
    btnBackStart.style.color = '#1a1a1a';
    btnBackStart.style.border = '1px solid #F2D4A2';
    btnBackStart.style.borderRadius = '12px';
    btnBackStart.style.boxShadow = '4px 4px 8px rgba(0, 0, 0, 0.5)';
    btnBackStart.style.padding = '14px 18px';
    btnBackStart.style.fontSize = '28px';
    btnBackStart.style.backdropFilter = 'blur(6px)';
    btnBackStart.style.marginTop = '8px';
    btnBackStart.cursor = 'pointer';
    btnBackStart.letterSpacing = '1px';
    btnBackStart.addEventListener('click', () => {
      if (typeof this._onBackToStart === 'function') this._onBackToStart();
    });

    ui.appendChild(btnRestartNow);
    ui.appendChild(btnBackStart);

    // Container relativ setzen
    if (getComputedStyle(root).position === 'static') {
      root.style.position = 'relative';
    }
    root.appendChild(ui);

    // Canvas-Sync
    const syncToCanvas = () => {
      const r = canvas.getBoundingClientRect();
      const gr = root.getBoundingClientRect();
      const left = r.left - gr.left + root.scrollLeft;
      const top  = r.top  - gr.top  + root.scrollTop;
      ui.style.left = `${left}px`;
      ui.style.top  = `${top}px`;
      ui.style.width  = `${r.width}px`;
      ui.style.height = `${r.height}px`;
    };
    this._syncToCanvas = syncToCanvas;
    syncToCanvas();
    window.addEventListener('resize', syncToCanvas);
    window.addEventListener('scroll', syncToCanvas, true);

    // i18n live
    window.addEventListener('i18n:changed', () => {
      if (window.I18N) {
        btnRestartNow.textContent = window.I18N.t('ui.restart');
        btnBackStart.textContent  = window.I18N.t('ui.backToStart');
      }
    });

    this._ui = ui;
    this._btnRestartNow = btnRestartNow;
    this._btnBackStart  = btnBackStart;
  }

  toggleButtons(show) {
    if (!this._ui) return;
    this._ui.style.display = show ? 'flex' : 'none';
  }
}
