// js/class.models/character-state-idle.js
(() => {
    if (typeof CharacterState === 'undefined') return;

    /**
     * Returns true if any relevant control key is currently active.
     * Includes movement, jump and throw inputs, but only if
     * bottles/whiskey are actually available for throws.
     *
     * @returns {boolean} whether the character is actively controlled
     */
    CharacterState.prototype.isControlActive = function () {
        const kb = this.world?.keyboard || {};

        const hasBottles =
            this.world &&
            typeof this.world.bottlesCollected === 'number' &&
            this.world.bottlesCollected > 0;

        const hasWhiskey =
            this.world &&
            typeof this.world.whiskeyCount === 'number' &&
            this.world.whiskeyCount > 0;

        return !!(
            kb.RIGHT ||
            kb.LEFT ||
            kb.SPACE ||
            (kb.D && hasBottles) ||
            (kb.F && hasWhiskey)
        );
    };

    /**
     * Enters the soft idle phase (no snore).
     *
     * @returns {void}
     */
    CharacterState.prototype.enterIdle = function () {
        if (this.idlePhase === 'idle') return;
        this.stopSnore();
        this.idlePhase = 'idle';
        this.currentImage = 0;
    };

    /**
     * Enters the snore (sleep) phase and starts the snore loop.
     *
     * @returns {void}
     */
    CharacterState.prototype.enterSnore = function () {
        if (this.idlePhase === 'snore') return;
        this.idlePhase = 'snore';
        this.currentImage = 0;

        try {
            if (this.snoreAudio) {
                this.snoreAudio.currentTime = 0;
                const p = this.snoreAudio.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {});
                }
            }
        } catch (e) {}
    };

    /**
     * Stops snore audio safely and resets its position.
     *
     * @returns {void}
     */
    CharacterState.prototype.stopSnore = function () {
        try {
            if (this.snoreAudio && !this.snoreAudio.paused) {
                this.snoreAudio.pause();
                this.snoreAudio.currentTime = 0;
            }
        } catch (e) {}
    };

    /**
     * Called when waking up from snore:
     * stops snore audio and plays the wake one-shot.
     *
     * @returns {void}
     */
    CharacterState.prototype.onWakeFromSnore = function () {
        this.stopSnore();
        try {
            if (this.wakeAudio) {
                this.wakeAudio.pause();
                this.wakeAudio.currentTime = 0;
                const p = this.wakeAudio.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {});
                }
            }
        } catch (e) {}
    };

    /**
     * Central idle / snore logic based on inactivity duration.
     *
     * @param {number} nowMs - current timestamp in ms
     * @returns {void}
     */
    CharacterState.prototype.updateIdleState = function (nowMs) {
        if (this.resetIdleWhenWorldFinished()) {
            return;
        }

        if (this.handleIdleWhileControlActive(nowMs)) {
            return;
        }

        const idleFor = this.computeIdleDuration(nowMs);
        this.updateIdlePhaseByDuration(idleFor);
    };

    /**
     * Resets idle/snore when world is finished (game over / won).
     *
     * @returns {boolean} true if the state was reset
     */
    CharacterState.prototype.resetIdleWhenWorldFinished = function () {
        const world = this.world;
        if (!world) return false;
        if (!world.gameOver && !world.gameWon) return false;

        this.stopSnore();
        this.idlePhase = 'idle';
        return true;
    };

    /**
     * Handles idle logic while the player is actively controlling Pepe
     * or while he's airborne/hurt.
     *
     * @param {number} nowMs - current timestamp in ms
     * @returns {boolean} true if the active-control branch handled the state
     */
    CharacterState.prototype.handleIdleWhileControlActive = function (nowMs) {
        const controlActive = this.isControlActive();

        if (!controlActive && !this.isAboveGround() && !this.isHurt()) {
            return false;
        }

        if (this.idlePhase === 'snore') {
            this.onWakeFromSnore();
        }

        this.idlePhase = 'active';
        this.lastActiveAt = nowMs;
        return true;
    };

    /**
     * Computes idle duration in milliseconds.
     *
     * @param {number} nowMs - current timestamp in ms
     * @returns {number} idle duration
     */
    CharacterState.prototype.computeIdleDuration = function (nowMs) {
        return nowMs - (this.lastActiveAt || nowMs);
    };

    /**
     * Updates idle/sleep state based on how long Pepe has been idle.
     *
     * @param {number} idleFor - idle duration in ms
     * @returns {void}
     */
    CharacterState.prototype.updateIdlePhaseByDuration = function (idleFor) {
        if (idleFor >= this.SNORE_DELAY_MS) {
            this.enterSnore();
            return;
        }

        if (idleFor >= this.IDLE_DELAY_MS) {
            this.enterIdle();
            return;
        }

        if (this.idlePhase === 'snore') {
            this.stopSnore();
        }
        this.idlePhase = 'active';
    };
})();
