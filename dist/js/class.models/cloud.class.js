class Cloud extends MovableObject {
    // sinnvolle Defaults
    width  = 500;
    height = 250;

    /**
     * @param {number} x
     * @param {number} y  (40–110 empfohlen)
     * @param {number} speed
     */
    constructor(x = 0, y = 60, speed = 0.15) {
        super().loadImage('/img/5_background/layers/4_clouds/1.png');
        this.x = x;
        this.y = y;
        this.speed = speed;
        this._timer = null;
        this.animate();
    }

    animate() {
        // Safety: nur ein Timer
        if (this._timer) clearInterval(this._timer);
        this._timer = setInterval(() => {
            // konstante Linksbewegung
            this.x -= this.speed;

            // Re-Loop weit rechts (Levelbreite ~ 5600 → plus Puffer)
            if (this.x + this.width < -600) {
                this.x += 7000 + Math.random() * 2000; // 7–9k nach rechts „teleportieren“
                // kleine vertikale Varianz
                const ny = 40 + Math.random() * 70; // 40–110
                this.y = Math.round(ny);
            }
        }, 1000 / 60);
    }
}
