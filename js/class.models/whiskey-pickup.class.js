class WhiskeyPickup extends DrawableObject {
    /**
     * Whiskey bottle pickup:
     * - Can be placed on the ground
     * - Uses a slightly smaller hitbox to avoid "air pickups"
     *
     * @param {number} x - World X position.
     * @param {number} y - World Y position.
     */
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 52;
        this.loadImage('/img/objects/whiskey_bottle_on_ground.png');
        this.offset = {
            left: 8,
            right: 8,
            top: 8,
            bottom: 4
        };
    }

    /**
     * Returns the collision bounds using the internal offset.
     *
     * @returns {{left:number, top:number, right:number, bottom:number}} AABB bounds for collision checks.
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
