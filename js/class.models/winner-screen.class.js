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

        // Overlay-Farbe (halbtransparent)
        this.overlayRGBA = 'rgba(0, 0, 0, 0.45)';
    }

    show() {
        if (this.visible) return;
        this.visible = true;
        this._idx = 0;
        this._timer = setInterval(() => {
            this._idx = (this._idx + 1) % this.FRAMES.length;
            this.img = this.imageCache[this.FRAMES[this._idx]];
        }, this._delayMs);
    }

    hide() {
        if (!this.visible) return;
        this.visible = false;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
    }

    drawOverlay(ctx, canvas) {
        if (!this.visible) return;
        try {
            // 1) halbtransparenten Hintergrund zeichnen
            ctx.save();
            ctx.fillStyle = this.overlayRGBA;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            // 2) animiertes Win-Bild zentriert
            ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
        } catch(e) {}
    }
}
