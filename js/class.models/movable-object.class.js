/**
 * Base class for all moveable objects in the game:
 * - Adds gravity, horizontal movement and collision bounds
 * - Provides generic "hurt" and "dead" state handling
 *
 * @extends DrawableObject
 */
class MovableObject extends DrawableObject {
    /** @type {number} Horizontal movement speed. */
    speed = 0.15;

    /** @type {boolean} True if facing left (used for mirroring). */
    otherDirection = false;

    /** @type {number} Vertical speed (for jumps / gravity). */
    speedY = 0;

    /** @type {number} Gravity acceleration factor. */
    acceleration = 2.5;

    /** @type {number} Health / hit points. */
    energy = 100;

    /** @type {number} Timestamp of the last hit in ms. */
    lastHit = 0;

    /** @type {boolean} True if the object is dead and should no longer move. */
    dead = false;

    /**
     * Creates a moveable object and initializes a default hitbox offset.
     */
    constructor() {
        super();
        // Default hitbox offsets (override in subclasses)
        this.offset = { left: 0, right: 0, top: 0, bottom: 0 };
    }

    // === Ground & Gravity (robust) ===

    /**
     * Checks if the object is above ground.
     *
     * Rules:
     * - Throwable objects are always considered "above ground" (projectile arc).
     * - If an object has its own groundPosition → use that.
     * - Otherwise, fall back to a fixed ground line (y < 150).
     *
     * @returns {boolean} True if the object is above the defined ground level.
     */
    isAboveGround() {
        // Throwable objects always fall (parabolic trajectory)
        if (this instanceof ThrowableObject) return true;

        // Use an object-specific ground line if defined
        if (typeof this.groundPosition === 'number') {
            return this.y < this.groundPosition;
        }

        // Fallback for legacy objects without a defined ground position
        return this.y < 150;
    }

    /**
     * Applies gravity and vertical motion:
     * - Uses speedY as vertical velocity
     * - Accelerates downwards using "acceleration"
     * - Clamps objects to "groundPosition" if one is defined
     *
     * NOTE: This method starts an internal interval and is usually called once from the constructor.
     *
     * @returns {void}
     */
    applyGravity() {
        setInterval(() => {
            // Store previous Y-position (important for stomp detection)
            this.prevY = this.y;

            if (this.isAboveGround() || this.speedY > 0) {
                this.y -= this.speedY;
                this.speedY -= this.acceleration;
            }

            // Only clamp when the object actually defines a ground line
            if (typeof this.groundPosition === 'number' && this.y >= this.groundPosition) {
                this.y = this.groundPosition;
                this.speedY = 0;
            }
        }, 1000 / 25);
    }

    /**
     * Returns the collision bounds including hitbox offsets.
     *
     * @returns {{left:number, top:number, right:number, bottom:number}} AABB bounds.
     */
    getBounds() {
        const x = (typeof this.x === 'number') ? this.x : 0;
        const y = (typeof this.y === 'number') ? this.y : 0;
        const w = (typeof this.width === 'number') ? this.width : 0;
        const h = (typeof this.height === 'number') ? this.height : 0;
        const off = this.offset || { left: 0, right: 0, top: 0, bottom: 0 };

        return {
            left:   x + (off.left   || 0),
            top:    y + (off.top    || 0),
            right:  x + w - (off.right  || 0),
            bottom: y + h - (off.bottom || 0)
        };
    }

    /**
     * Axis-aligned bounding box collision check (robust AABB).
     *
     * @param {Object} other - Other object with x/y/width/height or getBounds().
     * @returns {boolean} True if both AABBs overlap.
     */
    isColliding(other) {
        if ((this && this.dead === true) || (other && other.dead === true)) return false;
        if (!other || other === this) return false;

        const a = this.getBounds();
        const b = (typeof other.getBounds === 'function')
            ? other.getBounds()
            : {
                left:   other.x,
                top:    other.y,
                right:  (other.x || 0) + (other.width  || 0),
                bottom: (other.y || 0) + (other.height || 0)
            };

        const overlapX = a.left < b.right && a.right > b.left;
        const overlapY = a.top  < b.bottom && a.bottom > b.top;
        return overlapX && overlapY;
    }

    /**
     * Applies damage to the object and updates the lastHit timestamp.
     *
     * @param {number} [amount=5] - Damage amount to subtract from energy.
     * @returns {void}
     */
    hit(amount = 5) {
        const dmg = (typeof amount === 'number' && amount > 0) ? amount : 5;
        this.energy -= dmg;
        if (this.energy < 0) {
            this.energy = 0;
        } else {
            this.lastHit = new Date().getTime();
        }
    }

    /**
     * Returns whether the object is still in the hurt state
     * based on the time that has passed since the last hit.
     *
     * @returns {boolean} True if the object is considered "hurt".
     */
    isHurt() {
        const timePassed = (new Date().getTime() - this.lastHit) / 1000;
        return timePassed < 1.2;
    }

    /**
     * Returns true when energy has reached zero.
     *
     * @returns {boolean} True if the object is dead.
     */
    isDead() {
        return this.energy == 0;
    }

    /**
     * Moves the object to the right if it is not dead.
     *
     * @returns {void}
     */
    moveRight() {
        if (!this.dead) {
            this.x += this.speed;
        }
    }

    /**
     * Moves the object to the left if it is not dead.
     * NOTE: The second subtraction (0.15) is intentional to give
     * a different backwards speed curve.
     *
     * @returns {void}
     */
    moveLeft() {
        if (!this.dead) {
            this.x -= this.speed;
            this.x -= 0.15;
        }
    }

    /**
     * Classic frame-based sprite animation:
     * - Uses currentImage as frame index
     * - Loops within the provided images array
     *
     * @param {string[]} images - List of sprite frame paths.
     * @returns {void}
     */
    playAnimation(images) {
        if (this.dead) return;
        const i = this.currentImage % images.length;
        const path = images[i];
        this.img = this.imageCache[path];
        this.currentImage++;
    }

    /**
     * Placeholder for jump logic.
     * Overridden in Character to set speedY and start a jump.
     */
    jump() {
        /* this.speedY = 25; */
    }
}
