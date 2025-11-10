class GameOverScreen {
    /**
     * Canvas-Overlay für Game Over:
     * - ab 6s nach Tod sichtbar
     * - ab 10s "Try again"-Button
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

        // i18n
        this._gameOverLabel = (window.I18N ? window.I18N.t('game.gameOver') : 'GAME OVER');
        this._onLangChange = () => this._applyI18n();
    }

    _applyI18n() {
        if (!window.I18N) return;
        this._gameOverLabel = window.I18N.t('game.gameOver');
        if (this._btn) this._btn.textContent = window.I18N.t('ui.tryAgain');
        // Größe/Position evtl. neu berechnen (Fonts können variieren)
        this._syncToCanvas && this._syncToCanvas();
    }

    attachDom(containerSelector = '.game-container') {
        if (this._container) return;

        const canvas = document.querySelector('#canvas');
        const root = document.querySelector(containerSelector) || document.body;
        const wrap = document.createElement('div');
        wrap.id = 'go-overlay-ui';

        // Absolute Position direkt über dem Canvas-Rechteck
        wrap.style.position = 'absolute';
        wrap.style.left = '0';
        wrap.style.top = '0';
        wrap.style.width = '0';
        wrap.style.height = '0';
        wrap.style.display = 'none';
        wrap.style.pointerEvents = 'none';
        wrap.style.alignItems = 'center';
        wrap.style.justifyContent = 'flex-end';  // an unteren Rand
        wrap.style.flexDirection = 'column';
        wrap.style.gap = '12px';
        wrap.style.zIndex = '9999';
        wrap.style.paddingBottom = '48px';

        // Button (i18n)
        const btn = document.createElement('button');
        btn.id = 'btn-try-again';
        btn.textContent = (window.I18N ? window.I18N.t('ui.tryAgain') : 'Try Again');
        btn.style.marginBottom = '24px';
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
        btn.onmouseenter = () => btn.style.transform = 'translateY(-2px)';
        btn.onmouseleave = () => btn.style.transform = 'translateY(0)';

        // Credit
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

        wrap.appendChild(btn);
        wrap.appendChild(credit);

        // Container relativ
        const gc = root;
        if (getComputedStyle(gc).position === 'static') {
            gc.style.position = 'relative';
        }
        gc.appendChild(wrap);

        // Position/Größe auf Canvas syncen
        const syncToCanvas = () => {
            const r = canvas.getBoundingClientRect();
            const gr = gc.getBoundingClientRect();
            const left = r.left - gr.left + gc.scrollLeft;
            const top  = r.top  - gr.top  + gc.scrollTop;
            wrap.style.left = `${left}px`;
            wrap.style.top  = `${top}px`;
            wrap.style.width  = `${r.width}px`;
            wrap.style.height = `${r.height}px`;
            wrap.style.display = this._showButton ? 'flex' : 'none';
        };
        this._syncToCanvas = syncToCanvas;

        // initial + on resize/scroll
        syncToCanvas();
        window.addEventListener('resize', syncToCanvas);
        window.addEventListener('scroll', syncToCanvas, true);

        // Sprachwechsel live mitnehmen
        window.addEventListener('i18n:changed', this._onLangChange);
        // Falls i18n schon geladen, einmal initial anwenden
        this._applyI18n();

        this._container = wrap;
        this._btn = btn;
        this._credit = credit;
    }

    onTryAgain(handler) {
        if (!this._btn) return;
        this._btn.onclick = (ev) => {
            ev?.preventDefault?.();
            try { handler?.(); } catch (e) {}
        };
    }

    show() { this.visible = true; }

    showButton() {
        this._showButton = true;
        if (this._container) {
            this._container.style.display = 'flex';
            this._syncToCanvas && this._syncToCanvas();
        }
    }

    hideButton() {
        this._showButton = false;
        if (this._container) this._container.style.display = 'none';
    }

    /**
     * Zeichnet den Overlay-Layer über das Canvas (mit weinender Frau).
     */
    drawOverlay(ctx, canvas) {
        if (!this.visible) return;

        const { width, height } = canvas;

        // BG-Bild vollflächig (cover-fit)
        if (this.bgImg.complete && this.bgImg.naturalWidth > 0) {
            const imgW = this.bgImg.naturalWidth;
            const imgH = this.bgImg.naturalHeight;
            const scale = Math.max(width / imgW, height / imgH);
            const drawW = imgW * scale;
            const drawH = imgH * scale;
            const dx = (width - drawW) / 2;
            const dy = (height - drawH) / 2;
            ctx.drawImage(this.bgImg, dx, dy, drawW, drawH);
        } else {
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, width, height);
        }

        // Dark film
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(0, 0, width, height);

        // GAME OVER (i18n)
        const title = this._gameOverLabel || 'GAME OVER';
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.font = "bold 64px 'zabars', Arial, Helvetica, sans-serif";
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 12;
        ctx.fillText(title.toUpperCase(), width / 2, Math.floor(height * 0.50));
        ctx.shadowBlur = 0;

        // Button ist DOM – Canvas zeichnet nur den Rest
    }
}
