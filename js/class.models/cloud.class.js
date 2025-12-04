/**
 * Parallax cloud that slowly moves from right to left
 * and re-loops far to the right once it leaves the viewport.
 *
 * @extends MovableObject
 */
class Cloud extends MovableObject {
    /**
     * Default cloud width.
     * @type {number}
     */
    width = 500;

    /**
     * Default cloud height.
     * @type {number}
     */
    height = 250;

    /**
     * Creates a new cloud instance.
     *
     * @param {number} [x=0] - Initial X-position.
     * @param {number} [y=60] - Initial Y-position (recommended range: 40–110).
     * @param {number} [speed=0.15] - Horizontal movement speed.
     */
    constructor(x = 0, y = 60, speed = 0.15) {
        super().loadImage('/img/5_background/layers/4_clouds/1.png');
        this.x = x;
        this.y = y;
        this.speed = speed;
        this._timer = null;
        this.animate();
    }

    /**
     * Starts the movement loop for the cloud.
     * The cloud moves to the left and re-spawns far to the right
     * once it has fully left the visible area.
     *
     * @returns {void}
     */
    animate() {
        if (this._timer) {
            clearInterval(this._timer);
        }

        this._timer = setInterval(() => {

            this.x -= this.speed;

            if (this.x + this.width < -600) {
                this.x += 7000 + Math.random() * 2000;
                const ny = 40 + Math.random() * 70;
                this.y = Math.round(ny);
            }
        }, 1000 / 60);
    }
}
