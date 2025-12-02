/**
 * Endboss enemy (giant chicken).
 * Handles simple AI states (idle, chase, return), aggro behaviour,
 * damage, hurt state and death animation.
 *
 * @extends MovableObject
 */
class Endboss extends MovableObject {
    y = 60;
    height = 400;
    width = 300;
    speed = 0.5; // previously 0.3

    // AI state
    aiState = 'IDLE'; // IDLE | CHASE | RETURN
    isInSight = false;

    startPosition = 5140; // starting position in front of the hut (gate ~5400)
    returning = false;
    leashRadius = 500;    // how far he can chase to the left before switching to RETURN (previously 360)
    sightRange = 520;     // how early he sees the player and starts CHASE (previously 400)
    energy = 150;

    // === Retreat fine-tuning ===
    useRetreatOffset = true;   // true = do not return all the way to startPosition
    retreatOffset    = 200;    // how many pixels LEFT of startPosition he should stop
    // Example: startPosition = 6400 → return target = 6200

    minX = 0;

    inAggroMode = false;
    baseSpeed = 0.5;          // base speed when not in combat
    aggroSpeed = 5.0;         // aggro speed: clearly faster than Pepe
    permanentChase = true;    // true = boss keeps chasing, no automatic RETURN
    targetX = null;           // last known X-position of the player
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
    constructor(startX = 5140 /* in front of the gate */) {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_ALERT);
        this.loadImages(this.IMAGES_DEAD);
        this.loadImages(this.IMAGES_HURT);

        // Set exact start position and remember it for return behaviour
        this.startPosition = startX;
        this.x = startX;
        this.minX = 0;

        // Hitbox slightly smaller than the sprite to avoid "air damage"
        this.offset = {
            left:   50,
            right:  50,
            top:    20,
            bottom: 8
        };

        this.animate();
    }

    /**
     * Clamps the boss' x-position to the valid range and
     * falls back to a safe target if x ever becomes invalid.
     *
     * @returns {void}
     */
    clampX() {
        // Failsafe: if x is not a finite number (e.g. due to a bug), snap to return target
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
     * Enters aggro mode: only done once, then speed is raised to aggroSpeed.
     *
     * @returns {void}
     */
    enterAggro() {
        if (this.inAggroMode) return;
        this.inAggroMode = true;
        this.speed = Math.max(this.speed, this.aggroSpeed);
    }

    /**
     * Updates the AI state based on the player's X-position.
     * Called multiple times per second from world.run().
     *
     * @param {number} characterX - current X-position of the player character
     * @returns {void}
     */
    updateAI(characterX) {
        if (this.dead || this.isDying) return;

        this.targetX = characterX;

        const inSight = (characterX > this.x - this.sightRange);
        if (this.aiState === 'IDLE' && inSight) {
            this.aiState = 'CHASE';
            this.enterAggro(); // immediately switch to aggro speed
        }

        if (!this.permanentChase) {
            this.applyLeash();
        }

        // Used by the HUD to show or hide the boss status bar
        this.isInSight = (this.aiState === 'CHASE');
    }

    /**
     * Limits the chase distance to the left if permanentChase is disabled.
     * When the boss reaches the leash radius, the AI switches to RETURN.
     *
     * @returns {void}
     */
    applyLeash() {
        if (this.aiState !== 'CHASE') return;

        const leftLimit = this.startPosition - this.leashRadius;
        if (this.x <= leftLimit) {
            this.aiState = 'RETURN';
            this.returning = true;
        }
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

    /**
     * Starts the death animation if it is not already running.
     * Plays through IMAGES_DEAD and then marks the boss as dead.
     *
     * @returns {void}
     */
    die() {
        clearTimeout(this.hurtTimeout);
        if (this.isDying || this.dead) return;

        this.isDying = true;
        this.isHurtAnimation = false;
        this.isInSight = false;
        this.returning = false;
        this.speed = 0;

        const frames = this.IMAGES_DEAD;
        let i = 0;

        if (frames && frames.length > 0) {
            this.img = this.imageCache[frames[0]];
        }

        this.deathTimer = setInterval(() => {
            i++;
            if (!frames || i >= frames.length) {
                clearInterval(this.deathTimer);
                this.isDying = false;
                this.dead = true;

                if (frames && frames.length > 0) {
                    this.img = this.imageCache[frames[frames.length - 1]];
                }
                return;
            }
            this.img = this.imageCache[frames[i]];
        }, 180);
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

    /**
     * RETURN state logic:
     * moves the boss back towards his return target until he is close enough
     * and then snaps him to the target and switches to IDLE.
     *
     * @returns {void}
     */
    returnToStart() {
        if (this.isDying || this.dead) {
            this.returning = false;
            this.aiState = 'IDLE';
            return;
        }

        this.returning = true;
        this.aiState = 'RETURN';

        const target = this.getReturnTargetX();
        const EPSILON = this.speed * 1.5; // distance tolerance for snapping

        if (this.x < target - EPSILON) {
            this.moveRight(); // move right until reaching the target
        } else {
            this.snapToStart(); // snap to target and switch back to IDLE
        }

        this.otherDirection = true; // looks to the right while returning
        this.playAnimation(this.IMAGES_WALKING);
    }

    /**
     * Main animation / AI loop for the boss (60 FPS).
     * Handles CHASE, RETURN and hurt animations while alive.
     *
     * @returns {void}
     */
    animate() {
        setInterval(() => {
            if (this.dead || this.isDying) return;

            if (this.aiState === 'CHASE' && !this.isHurtAnimation) {
                const target = (typeof this.targetX === 'number') ? this.targetX : this.x;
                const dx = target - this.x;
                const absDx = Math.abs(dx);

                // Only move if there is still some distance (prevents jitter at minimal distance)
                if (absDx > 5) {
                    if (dx < 0) {
                        this.moveLeft();
                        this.otherDirection = false; // looking left
                    } else {
                        this.moveRight();
                        this.otherDirection = true;  // looking right
                    }
                }

                const frames = this.inAggroMode ? this.IMAGES_ALERT : this.IMAGES_WALKING;
                this.playAnimation(frames);

            } else if (this.aiState === 'RETURN' && !this.isHurtAnimation) {
                this.returnToStart();

            } else if (this.isHurtAnimation) {
                this.playAnimation(this.IMAGES_HURT);
            }

            this.clampX();
        }, 1000 / 60);
    }

}
