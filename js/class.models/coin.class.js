/**
 * Collectable coin inside the level.
 * Uses a slightly reduced hitbox so it is only collected on visible contact.
 *
 * @extends DrawableObject
 */
class Coin extends DrawableObject {
    /**
     * Creates a new coin at the given world position.
     *
     * @param {number} x - X-position in the world.
     * @param {number} y - Y-position in the world.
     */
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.loadImage('/img/7_statusbars/3_icons/icon_coin.png');

        this.offset = {
            left: 20,
            right: 20,
            top: 8,
            bottom: 50
        };
    }

    /**
     * Returns the current bounding box of the coin, including offsets.
     *
     * @returns {{left:number, top:number, right:number, bottom:number}} Coin bounds.
     */
    getBounds() {
        const off = this.offset || { left: 0, right: 0, top: 0, bottom: 0 };
        return {
            left:   this.x + off.left,
            top:    this.y + off.top,
            right:  this.x + this.width  - off.right,
            bottom: this.y + this.height - off.bottom
        };
    }
}
