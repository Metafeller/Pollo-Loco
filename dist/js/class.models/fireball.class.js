class Fireball extends MovableObject {
    constructor(x, y, facingRight = true) {
        super();

        // Robustes Laden des Sprites
        this.loadImage('/img/objects/fireball.png');

        this.x = x;
        this.y = y + 14;     // kleiner Offset aus der Hand
        this.width = 64;
        this.height = 64;

        this.facingRight = !!facingRight;
        this.speedX = 10;    // langsamer (vorher 18)
        this.spawnX = x;
        this.maxDistance = 540; // ~¾ Bildschirmbreite
        this.done = false;

        this._interval = null;
        this.animate();
    }


    /**
     * Sichere Darstellung:
     * - Wenn das Bild geladen ist → normales Draw
     * - Wenn noch nicht → gut sichtbarer orangener Kreis als Fallback
     */
    draw(ctx) {
        const imgReady =
            this.img &&
            this.img.complete &&
            typeof this.img.naturalWidth === 'number' &&
            this.img.naturalWidth > 0;

        if (imgReady) {
            super.draw(ctx);
            return;
        }

        // 🔥 Fallback: sichtbarer "Energyball", falls Sprite noch lädt
        ctx.save();
        ctx.fillStyle = 'rgba(255, 180, 0, 0.9)';
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r  = Math.min(this.width, this.height) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }


    animate() {
        this._interval = setInterval(() => {
            if (this.done) {
                clearInterval(this._interval);
                return;
            }

            this.x += (this.facingRight ? this.speedX : -this.speedX);

            // Lebensdauer/Weite begrenzen
            if (Math.abs(this.x - this.spawnX) > this.maxDistance) {
                this.done = true;
                clearInterval(this._interval);
            }
        }, 1000 / 60);
    }
}
