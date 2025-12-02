/**
 * Smaller chicken enemy variant:
 * - Can be spawned by the Endboss during the fight
 * - Moves from right to left with higher speed than regular chickens
 *
 * @extends MovableObject
 */
class MiniChicken extends MovableObject {
    y = 340;
    height = 80;
    width = 80;

    /** @type {number} Hit points of the mini chicken. */
    energy = 10;

    /** @type {boolean} True if spawned dynamically by the Endboss. */
    spawnedByBoss = false;

    IMAGES_WALKING = [
        '/img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
        '/img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
        '/img/3_enemies_chicken/chicken_small/1_walk/3_w.png'
    ];

    IMAGES_DEAD = [
        '/img/3_enemies_chicken/chicken_small/2_dead/dead.png'
    ];

    /**
     * Creates a new mini chicken.
     *
     * @param {number|null} [x=null] - Optional fixed spawn X-position.
     *                                 If null, a random position in [3000, 3500] is used.
     * @param {boolean} [fromBoss=false] - True if spawned during the boss fight.
     */
    constructor(x = null, fromBoss = false) {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_DEAD);

        // Mark minis that are spawned by the Endboss
        this.spawnedByBoss = !!fromBoss;

        // Injected X or fallback (in case normal minis are used elsewhere)
        this.x = (typeof x === 'number') ? x : (3000 + Math.random() * 500);

        // Faster than regular chickens
        this.speed = 1.15 + Math.random() * 0.5;

        // Slightly smaller hitbox than the visual sprite
        this.offset = {
            left:   20,
            right:  20,
            top:    24,
            bottom: 10
        };

        this.animate();
    }

    /**
     * Immediately kills the mini chicken.
     *
     * @returns {void}
     */
    hit() {
        this.energy = 0;
        this.die();
    }

    /**
     * Switches to dead state (no movement, static dead sprite).
     *
     * @returns {void}
     */
    die() {
        this.dead = true;
        this.speed = 0;
        this.loadImage(this.IMAGES_DEAD[0]);
    }

    /**
     * Starts the movement and walking animation loops.
     * - Movement: permanent left movement (60 FPS)
     * - Animation: walking cycle (200 ms per frame)
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
