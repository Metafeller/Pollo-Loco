/**
 * Ground bottle pickup that the player can collect
 * and later throw as a projectile.
 *
 * @extends MovableObject
 */
class Bottle extends MovableObject {
    /**
     * Creates a new bottle at the given world position.
     *
     * @param {number} x - X-position in the world.
     * @param {number} y - Y-position in the world.
     */
    constructor(x, y) {
        super().loadImage('/img/6_salsa_bottle/1_salsa_bottle_on_ground.png');
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 60;

        // Pickup hitbox slightly tighter so the bottle is not collected "from the air".
        this.offset = {
            left:   40, // previously 10
            right:  40, // previously 10
            top:    8,
            bottom: 6
        };
    }
}
