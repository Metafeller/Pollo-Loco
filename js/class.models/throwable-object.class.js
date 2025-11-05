class ThrowableObject extends MovableObject {

    constructor(x, y, facingRight = true) {
        super().loadImage('/img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png');
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 70;

        this.facingRight = facingRight;
        this.spawnX = x;
        this.maxDistance = 420;   // kürzer, bleibt im Sichtfeld
        this.done = false;

        this.throw();
    }

    throw() {
        // flacherer Wurf
        this.speedY = 10;         // weniger Steigflug
        this.acceleration = 1.9;  // sanftere Kurve
        this.applyGravity();

        // horizontale Bewegung etwas langsamer -> bessere Trefferchance
        this._interval = setInterval(() => {
            this.x += (this.facingRight ? 8 : -8); // vorher 12
            if (Math.abs(this.x - this.spawnX) > this.maxDistance) {
                this.done = true;
                clearInterval(this._interval);
            }
        }, 1000 / 60);
    }
}
