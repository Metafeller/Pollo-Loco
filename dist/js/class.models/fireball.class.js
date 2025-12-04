/**
 * Special projectile that behaves like a fireball:
 * flies in a straight line, has a maximum travel distance
 * and can be treated as "done" once it exceeded its range.
 *
 * @extends MovableObject
 */
class Fireball extends MovableObject {
    /**
     * Creates a new fireball instance.
     *
     * @param {number} x - Initial X-position (spawn point).
     * @param {number} y - Initial Y-position (hand position).
     * @param {boolean} [facingRight=true] - Direction: true → right, false → left.
     */
    constructor(x, y, facingRight = true) {
        super();

        this.loadImage('/img/objects/fireball.png');

        this.x = x;
        this.y = y + 14;
        this.width = 64;
        this.height = 64;

        this.facingRight = !!facingRight;
        this.speedX = 10;
        this.spawnX = x;
        this.maxDistance = 540;
        this.done = false;

        this._interval = null;
        this.animate();
    }

    /**
     * Safe drawing:
     * - If the sprite is ready → render the image
     * - If not yet loaded → draw a visible orange fallback circle
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
     * @returns {void}
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

        ctx.save();
        ctx.fillStyle = 'rgba(255, 180, 0, 0.9)';
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const r = Math.min(this.width, this.height) / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Starts the movement interval:
     * moves in a straight line and marks the projectile as done
     * once it exceeded its maximum travel distance.
     *
     * @returns {void}
     */
    animate() {
        this._interval = setInterval(() => {
            if (this.done) {
                clearInterval(this._interval);
                return;
            }

            this.x += this.facingRight ? this.speedX : -this.speedX;

            if (Math.abs(this.x - this.spawnX) > this.maxDistance) {
                this.done = true;
                clearInterval(this._interval);
            }
        }, 1000 / 60);
    }
}
