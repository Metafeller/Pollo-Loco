class Fireball extends MovableObject {
    constructor(x, y, facingRight = true) {
        super();
        this.loadImage('/img/objects/fireball.png');
        this.x = x;
        this.y = y + 14;     // kleiner Offset aus der Hand
        this.width = 64;     // größer
        this.height = 64;

        this.facingRight = facingRight;
        this.speedX = 10;    // langsamer (vorher 18)
        this.spawnX = x;
        this.maxDistance = 540; // ~¾ Bildschirmbreite
        this.done = false;

        this._interval = null;
        this.animate();
    }

    animate() {
        this._interval = setInterval(() => {
            if (this.done) { clearInterval(this._interval); return; }
            this.x += (this.facingRight ? this.speedX : -this.speedX);

            // Lebensdauer/Weite begrenzen
            if (Math.abs(this.x - this.spawnX) > this.maxDistance) {
                this.done = true;
                clearInterval(this._interval);
            }
        }, 1000 / 60);
    }
}
