/**
 * Endboss enemy (giant chicken).
 * Core data, movement, damage and death logic.
 * AI and animation loop are extended in endboss-ai.js.
 *
 * @extends MovableObject
 */
class Endboss extends MovableObject {
    y = 60;
    height = 400;
    width = 300;
    speed = 0.5;

    aiState = 'IDLE';
    isInSight = false;

    startPosition = 5140;
    returning = false;
    leashRadius = 500;
    sightRange = 520;
    energy = 150;

    useRetreatOffset = true;
    retreatOffset    = 200;

    minX = 0;

    inAggroMode = false;
    baseSpeed = 0.5;
    aggroSpeed = 3.0;
    permanentChase = true;
    targetX = null;
    isDying = false;

    IMAGES_WALKING = [
        'img/4_enemie_boss_chicken/1_walk/G1.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G4.png'
    ];

    IMAGES_ALERT = [
        '/img/4_enemie_boss_chicken/2_alert/G5.png',
        '/img/4_enemie_boss_chicken/2_alert/G6.png',
        '/img/4_enemie_boss_chicken/2_alert/G7.png',
        '/img/4_enemie_boss_chicken/2_alert/G8.png',
        '/img/4_enemie_boss_chicken/2_alert/G9.png',
        '/img/4_enemie_boss_chicken/2_alert/G10.png',
        '/img/4_enemie_boss_chicken/2_alert/G11.png',
        '/img/4_enemie_boss_chicken/2_alert/G12.png',
        '/img/4_enemie_boss_chicken/3_attack/G13.png',
        '/img/4_enemie_boss_chicken/3_attack/G14.png',
        '/img/4_enemie_boss_chicken/3_attack/G15.png',
        '/img/4_enemie_boss_chicken/3_attack/G16.png',
        '/img/4_enemie_boss_chicken/3_attack/G17.png',
        '/img/4_enemie_boss_chicken/3_attack/G18.png',
        '/img/4_enemie_boss_chicken/3_attack/G19.png',
        '/img/4_enemie_boss_chicken/3_attack/G20.png'
    ];

    IMAGES_HURT = [
        '/img/4_enemie_boss_chicken/4_hurt/G21.png',
        '/img/4_enemie_boss_chicken/4_hurt/G22.png',
        '/img/4_enemie_boss_chicken/4_hurt/G23.png'
    ];

    IMAGES_DEAD = [
        '/img/4_enemie_boss_chicken/5_dead/G24.png',
        '/img/4_enemie_boss_chicken/5_dead/G25.png',
        '/img/4_enemie_boss_chicken/5_dead/G26.png'
    ];

    /**
     * Creates a new Endboss at the given X-position.
     *
     * @param {number} [startX=5140] - initial X-position (in front of the hut gate)
     */
    constructor(startX = 5140) {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_ALERT);
        this.loadImages(this.IMAGES_DEAD);
        this.loadImages(this.IMAGES_HURT);

        this.startPosition = startX;
        this.x = startX;
        this.minX = 0;

        this.offset = {
            left:   50,
            right:  50,
            top:    20,
            bottom: 8
        };

        // animate() wird in endboss-ai.js an das Prototype gehängt
        this.animate();
    }

    /**
     * Clamps the boss' x-position to the valid range and
     * falls back to a safe target if x ever becomes invalid.
     *
     * @returns {void}
     */
    clampX() {
        if (!Number.isFinite(this.x)) {
            this.x = this.getReturnTargetX();
        }

        if (this.x > this.startPosition) this.x = this.startPosition;
        if (this.x < this.minX) this.x = this.minX;
    }

    /**
     * Computes the target X-position for the RETURN state.
     * Uses retreatOffset if enabled to stop a bit in front of the start position.
     *
     * @returns {number} target X-position for the boss to return to
     */
    getReturnTargetX() {
        const target = this.useRetreatOffset
            ? (this.startPosition - this.retreatOffset)
            : this.startPosition;
        return Math.max(this.minX, target);
    }

    /**
     * Snaps the boss to its return target and resets RETURN state.
     *
     * @returns {void}
     */
    snapToStart() {
        this.x = this.getReturnTargetX();
        this.returning = false;
        this.aiState = 'IDLE';
    }

    /**
     * Moves the boss to the left and clamps his position.
     *
     * @returns {void}
     */
    moveLeft()  {
        this.x -= this.speed;
        this.clampX();
    }

    /**
     * Moves the boss to the right and clamps his position.
     *
     * @returns {void}
     */
    moveRight() {
        this.x += this.speed;
        this.clampX();
    }

    /**
     * Applies standard damage to the boss.
     * At 0 energy, triggers the death sequence; otherwise plays a hurt animation.
     *
     * @returns {void}
     */
    hit() {
        this.energy -= 20;
        if (this.energy < 0) this.energy = 0;

        if (this.energy === 0) {
            this.die();
        } else {
            this.isHurtAnimation = true;
            this.speedY = 30;
            this.applyGravity();
            setTimeout(() => this.endHurtAnimation(), 1500);
            this.ensureCorrectLanding();
        }
    }

    /**
     * Ensures the boss lands back at y = 60 after a hurt knockback.
     * Runs a small interval until the boss is back on his base height.
     *
     * @returns {void}
     */
    ensureCorrectLanding() {
        setInterval(() => {
            if (this.y > 60) {
                this.y = 60;
                this.speedY = 0;
            }
        }, 1000 / 60);
    }

    /**
     * Plays an animation sequence with an optional speed factor.
     * The speed factor controls how many ticks each frame is shown.
     *
     * @param {string[]} images - array of frame paths
     * @param {number} [speedFactor=4] - ticks per frame (higher = slower animation)
     * @returns {void}
     */
    playAnimation(images, speedFactor = 4) {
        const i = Math.floor(this.currentImage / speedFactor) % images.length;
        this.img = this.imageCache[images[i]];
        this.currentImage++;
    }

    /**
     * Activates the hurt animation, applies a short upward knockback
     * and then restores walking sprites after a delay.
     *
     * @returns {void}
     */
    activateHurtAnimation() {
        this.isHurtAnimation = true;
        this.loadImages(this.IMAGES_HURT);
        this.speedY = -20;
        this.applyGravity();
        this.hurtTimeout = setTimeout(() => {
            this.isHurtAnimation = false;
            this.loadImages(this.IMAGES_WALKING);
        }, 1000);
    }

    // ===== Death sequence helpers =====

    _cancelHurtTimeout() {
        if (!this.hurtTimeout) return;
        clearTimeout(this.hurtTimeout);
        this.hurtTimeout = null;
    }

    _beginDeathState() {
        this.isDying = true;
        this.isHurtAnimation = false;
        this.isInSight = false;
        this.returning = false;
        this.speed = 0;
    }

    _setInitialDeathFrame(frames) {
        if (!Array.isArray(frames) || frames.length === 0) return;
        const firstPath = frames[0];
        this.img = this.imageCache[firstPath];
    }

    _startDeathInterval(frames) {
        let frameIndex = 0;

        this.deathTimer = setInterval(() => {
            frameIndex++;

            const noFrames = !Array.isArray(frames) || frames.length === 0;
            const lastIdx = noFrames ? -1 : frames.length - 1;

            if (noFrames || frameIndex > lastIdx) {
                this._finishDeath(frames);
                return;
            }

            const path = frames[frameIndex];
            this.img = this.imageCache[path];
        }, 180);
    }

    _finishDeath(frames) {
        if (this.deathTimer) {
            clearInterval(this.deathTimer);
            this.deathTimer = null;
        }

        this.isDying = false;
        this.dead = true;

        if (Array.isArray(frames) && frames.length > 0) {
            const lastPath = frames[frames.length - 1];
            this.img = this.imageCache[lastPath];
        }
    }

    /**
     * Starts the death animation if it is not already running.
     * Plays through IMAGES_DEAD and then marks the boss as dead.
     *
     * @returns {void}
     */
    die() {
        this._cancelHurtTimeout();
        if (this.isDying || this.dead) return;

        this._beginDeathState();

        const frames = this.IMAGES_DEAD;
        this._setInitialDeathFrame(frames);
        this._startDeathInterval(frames);
    }

    /**
     * Ends the hurt animation and snaps the boss back to y = 60.
     *
     * @returns {void}
     */
    endHurtAnimation() {
        this.isHurtAnimation = false;
        this.y = 60;
    }
}
