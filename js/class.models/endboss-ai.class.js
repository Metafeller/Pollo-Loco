/**
 * AI and animation behaviour for Endboss.
 * Depends on Endboss core being loaded first.
 */

/* global Endboss */

if (typeof Endboss !== 'undefined') {
    /**
     * Enters aggro mode: only done once,
     * then speed is raised to aggroSpeed.
     *
     * @returns {void}
     */
    Endboss.prototype.enterAggro = function () {
        if (this.inAggroMode) return;
        this.inAggroMode = true;
        this.speed = Math.max(this.speed, this.aggroSpeed);
    };

    /**
     * Updates the AI state based on the player's X-position.
     * Called multiple times per second from world.run().
     *
     * @param {number} characterX - current X-position of the player character
     * @returns {void}
     */
    Endboss.prototype.updateAI = function (characterX) {
        if (this.dead || this.isDying) return;

        this.targetX = characterX;

        const inSight = (characterX > this.x - this.sightRange);
        if (this.aiState === 'IDLE' && inSight) {
            this.aiState = 'CHASE';
            this.enterAggro();
        }

        if (!this.permanentChase) {
            this.applyLeash();
        }
        this.isInSight = (this.aiState === 'CHASE');
    };

    /**
     * Limits the chase distance to the left if permanentChase is disabled.
     * When the boss reaches the leash radius, the AI switches to RETURN.
     *
     * @returns {void}
     */
    Endboss.prototype.applyLeash = function () {
        if (this.aiState !== 'CHASE') return;

        const leftLimit = this.startPosition - this.leashRadius;
        if (this.x <= leftLimit) {
            this.aiState = 'RETURN';
            this.returning = true;
        }
    };

    /**
     * RETURN state logic:
     * moves the boss back towards his return target until he is close enough
     * and then snaps him to the target and switches to IDLE.
     *
     * @returns {void}
     */
    Endboss.prototype.returnToStart = function () {
        if (this.isDying || this.dead) {
            this.returning = false;
            this.aiState = 'IDLE';
            return;
        }

        this.returning = true;
        this.aiState = 'RETURN';

        const target = this.getReturnTargetX();
        const EPSILON = this.speed * 1.5;

        if (this.x < target - EPSILON) {
            this.moveRight();
        } else {
            this.snapToStart();
        }

        this.otherDirection = true;
        this.playAnimation(this.IMAGES_WALKING);
    };

    // ===== Animation / AI loop (60 FPS) =====

    /**
     * Returns true if the boss is alive (not dying and not dead).
     *
     * @returns {boolean}
     */
    Endboss.prototype._isAlive = function () {
        return !this.dead && !this.isDying;
    };

    /**
     * Handles CHASE state:
     * - Moves toward targetX
     * - Plays walking or alert frames depending on aggro mode
     *
     * @returns {void}
     */
    Endboss.prototype._tickChaseState = function () {
        const target = (typeof this.targetX === 'number')
            ? this.targetX
            : this.x;

        const dx = target - this.x;
        if (Math.abs(dx) > 5) {
            this._moveTowardsTarget(dx);
        }

        const frames = this.inAggroMode
            ? this.IMAGES_ALERT
            : this.IMAGES_WALKING;

        this.playAnimation(frames);
    };

    /**
     * Moves the boss towards the given delta on the X-axis
     * and updates the facing direction flag.
     *
     * @param {number} dx - distance from boss to target
     * @returns {void}
     */
    Endboss.prototype._moveTowardsTarget = function (dx) {
        if (dx < 0) {
            this.moveLeft();
            this.otherDirection = false;
        } else {
            this.moveRight();
            this.otherDirection = true;
        }
    };

    /**
     * Single animation tick:
     * - Skips if dead/dying
     * - Plays hurt animation while in hurt knockback
     * - Otherwise runs CHASE or RETURN branch
     *
     * @returns {void}
     */
    Endboss.prototype._tickAnimation = function () {
        if (!this._isAlive()) return;

        if (this.isHurtAnimation) {
            this.playAnimation(this.IMAGES_HURT);
            this.clampX();
            return;
        }

        if (this.aiState === 'CHASE') {
            this._tickChaseState();
        } else if (this.aiState === 'RETURN') {
            this.returnToStart();
        }

        this.clampX();
    };

    /**
     * Main animation / AI loop for the boss (60 FPS).
     * Handles CHASE, RETURN and hurt animations while alive.
     *
     * @returns {void}
     */
    Endboss.prototype.animate = function () {
        const TICK_MS = 1000 / 60;
        setInterval(() => this._tickAnimation(), TICK_MS);
    };
}
