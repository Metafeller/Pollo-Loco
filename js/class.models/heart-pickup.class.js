/**
 * Heart pickup that heals the player when collected.
 * Uses a slightly reduced hitbox compared to the visual sprite.
 *
 * @extends DrawableObject
 */
class HeartPickup extends DrawableObject {
    /**
     * Creates a new heart pickup.
     *
     * @param {number} x - X-position in the world.
     * @param {number} y - Y-position in the world.
     * @param {number} [size=80] - Width and height of the heart sprite.
     */
    constructor(x, y, size = 80) {
        super();
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.loadImage('/img/7_statusbars/3_icons/icon_health.png');
        this.offset = { left: 6, right: 6, top: 6, bottom: 6 };
    }

    /**
     * Returns the heart's collision bounds including offsets.
     *
     * @returns {{left:number, top:number, right:number, bottom:number}} Hitbox rectangle.
     */
    getBounds() {
        const off = this.offset || { left: 0, right: 0, top: 0, bottom: 0 };
        return {
            left:   this.x + off.left,
            top:    this.y + off.top,
            right:  this.x + this.width - off.right,
            bottom: this.y + this.height - off.bottom
        };
    }
}
