/**
 * Small ground chicken enemy.
 * Walks from right to left and dies from a single hit.
 *
 * @extends MovableObject
 */
class Chicken extends MovableObject {
    y = 340;
    height = 80;
    width = 80;

    /**
     * Hitpoints of the chicken. Can be adjusted if needed.
     * @type {number}
     */
    energy = 10;

    /**
     * Walking animation frames.
     * @type {string[]}
     */
    IMAGES_WALKING = [
        '/img/3_enemies_chicken/chicken_normal/1_walk/1_w.png',
        '/img/3_enemies_chicken/chicken_normal/1_walk/2_w.png',
        '/img/3_enemies_chicken/chicken_normal/1_walk/3_w.png'
    ];

    /**
     * Single frame used when the chicken is dead.
     * @type {string[]}
     */
    IMAGES_DEAD = [
        '/img/3_enemies_chicken/chicken_normal/2_dead/dead.png'
    ];

    /**
     * Creates a new chicken. If no X-position is provided,
     * it spawns in a random range on the far right of the level.
     *
     * @param {number|null} [x=null] - Optional initial X-position.
     */
    constructor(x = null) {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_DEAD);

        this.x = (typeof x === 'number') ? x : (4200 + Math.random() * 700);
        this.speed = 0.15 + Math.random() * 0.5;

        this.offset = {
            left:   12,
            right:  12,
            top:    20,
            bottom: 8
        };

        this.animate();
    }

    /**
     * Applies damage and kills the chicken immediately.
     *
     * @returns {void}
     */
    hit() {
        this.energy = 0;
        this.die();
    }

    /**
     * Marks the chicken as dead and switches to the dead sprite.
     *
     * @returns {void}
     */
    die() {
        this.dead = true;
        this.speed = 0;
        this.loadImage(this.IMAGES_DEAD[0]);
    }

    /**
     * Starts the movement (60 FPS) and walking animation (5 FPS).
     *
     * @returns {void}
     */
    animate() {
        setInterval(() => {
            this.moveLeft();
        }, 1000 / 60);

        setInterval(() => {
            this.playAnimation(this.IMAGES_WALKING);
        }, 200);
    }
}
