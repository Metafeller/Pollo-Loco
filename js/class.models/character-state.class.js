/**
 * Extends CharacterMovement with idle/sleep state, audio hooks,
 * invulnerability and damage / hit handling.
 */
class CharacterState extends CharacterMovement {

    // === Idle / Snore state ===
    idlePhase = 'active'; // 'active' | 'idle' | 'snore'
    lastActiveAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // Idle / sleep timings (inactivity based)
    IDLE_DELAY_MS  = 300;   // ~6–7s until soft idle / pre-sleep
    SNORE_DELAY_MS = 9500;  // ~9–10s until snore / sleep phase

    // Counter to slow down idle / sleep frames
    idleAnimTick = 0;

    // Invulnerability state
    invulnerable = false;
    invulnerabilityDuration = 900;  // invulnerability duration in ms (previously 1500)

    /**
     * Returns true if animation should be skipped
     * because the world is not in a playable state.
     *
     * @returns {boolean} whether animation should be skipped
     */
    shouldSkipStateAnimation() {
        const world = this.world;
        if (!world) return false;

        if (world.gameOver) return true;
        if (world.gameWon)  return true;
        if (world.paused)   return true;
        return false;
    }

    /**
     * Dead / hurt states have the highest animation priority.
     *
     * @returns {boolean} true if a high priority state was handled
     */
    handleHighPriorityStates() {
        if (this.isDead()) {
            this.playAnimation(this.IMAGES_DEAD);
            return true;
        }

        if (this.isHurt()) {
            this.playAnimation(this.IMAGES_HURT);
            return true;
        }

        return false;
    }

    /**
     * Idle / snore animations while standing on the ground.
     *
     * @returns {boolean} true if an idle animation was played
     */
    handleIdleAnimations() {
        if (this.idlePhase === 'snore') {
            if (!this.shouldAdvanceIdleFrame()) return true;
            this.playAnimation(this.IMAGES_LONG_IDLE);
            return true;
        }

        if (this.idlePhase === 'idle') {
            if (!this.shouldAdvanceIdleFrame()) return true;
            this.playAnimation(this.IMAGES_IDLE);
            return true;
        }

        return false;
    }

    /**
     * Walking animation while movement keys are pressed.
     *
     * @returns {boolean} true if walking animation was played
     */
    handleWalkingAnimation() {
        const kb = this.world?.keyboard;
        if (!kb) return false;
        if (!kb.RIGHT && !kb.LEFT) return false;

        this.playAnimation(this.IMAGES_WALKING);
        return true;
    }

    /**
     * Fallback: classic idle animation with slowed frame advance.
     *
     * @returns {void}
     */
    playFallbackIdleAnimation() {
        this.playAnimation(this.IMAGES_IDLE);
        if (!this.shouldAdvanceIdleFrame()) return;
        this.playAnimation(this.IMAGES_IDLE);
    }

    /**
     * Slows down idle / sleep animations:
     * Only every second tick (~100ms) advances the frame.
     *
     * @returns {boolean} true if the frame should be advanced
     */
    shouldAdvanceIdleFrame() {
        this.idleAnimTick = (this.idleAnimTick || 0) + 1;
        return (this.idleAnimTick % 2) === 0;
    }

    /**
     * Returns true if any relevant control key is currently active.
     * Includes movement, jump and throw inputs, but only if
     * bottles/whiskey are actually available for throws.
     *
     * @returns {boolean} whether the character is actively controlled
     */
    isControlActive() {
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
    }

    /**
     * Enters the soft idle phase (no snore).
     *
     * @returns {void}
     */
    enterIdle() {
        if (this.idlePhase === 'idle') return;
        this.stopSnore();
        this.idlePhase = 'idle';
        this.currentImage = 0;
    }

    /**
     * Enters the snore (sleep) phase and starts the snore loop.
     *
     * @returns {void}
     */
    enterSnore() {
        if (this.idlePhase === 'snore') return;
        this.idlePhase = 'snore';
        this.currentImage = 0;
        try {
            if (this.snoreAudio) {
                this.snoreAudio.currentTime = 0;
                this.snoreAudio.play();
            }
        } catch (e) {}
    }

    /**
     * Stops snore audio safely and resets its position.
     *
     * @returns {void}
     */
    stopSnore() {
        try {
            if (this.snoreAudio && !this.snoreAudio.paused) {
                this.snoreAudio.pause();
                this.snoreAudio.currentTime = 0;
            }
        } catch (e) {}
    }

    /**
     * Called when waking up from snore:
     * stops snore audio and plays the wake one-shot.
     *
     * @returns {void}
     */
    onWakeFromSnore() {
        this.stopSnore();
        try {
            if (this.wakeAudio) {
                this.wakeAudio.pause();
                this.wakeAudio.currentTime = 0;
                this.wakeAudio.play();
            }
        } catch (e) {}
    }

    /**
     * Central idle / snore logic based on inactivity duration.
     *
     * @param {number} nowMs - current timestamp in ms
     * @returns {void}
     */
    updateIdleState(nowMs) {
        // If the game is out of play → stop everything
        if (this.world?.gameOver || this.world?.gameWon) {
            this.stopSnore();
            this.idlePhase = 'idle'; // neutral rest
            return;
        }

        const control = this.isControlActive();

        if (control || this.isAboveGround() || this.isHurt()) {
            // Active → reset timer
            if (this.idlePhase === 'snore') this.onWakeFromSnore();
            this.idlePhase = 'active';
            this.lastActiveAt = nowMs;
            return;
        }

        // No input → calculate inactivity duration
        const idleFor = nowMs - (this.lastActiveAt || nowMs);

        if (idleFor >= this.SNORE_DELAY_MS) {
            // Sleep / snore after ~9–10s
            this.enterSnore();
        } else if (idleFor >= this.IDLE_DELAY_MS) {
            // Soft idle after ~6–7s of inactivity
            this.enterIdle();
        } else {
            // Still in the "active" range
            if (this.idlePhase === 'snore') this.stopSnore();
            this.idlePhase = 'active';
        }
    }

    /**
     * Handles pause state: stop walking sounds, keep camera following Pepe.
     *
     * @returns {boolean} true if world is paused
     */
    handlePausedState() {
        const world = this.world;
        if (!world || !world.paused) return false;

        this.walking_sound.pause();
        this.walking_sound_back.pause();
        world.camera_x = -this.x + 100;
        return true;
    }

    /**
     * Game over: stop snore and fully reset walking sounds.
     *
     * @returns {boolean} true if world is in game over state
     */
    handleGameOverState() {
        const world = this.world;
        if (!world || !world.gameOver) return false;

        this.stopSnore();

        this.walking_sound.pause();
        this.walking_sound.currentTime = 0;
        this.walking_sound_back.pause();
        this.walking_sound_back.currentTime = 0;
        return true;
    }

    /**
     * Game won: stop snore and walking sounds (no full reset).
     *
     * @returns {boolean} true if world is in game won state
     */
    handleGameWonState() {
        const world = this.world;
        if (!world || !world.gameWon) return false;

        this.stopSnore();
        this.walking_sound.pause();
        this.walking_sound_back.pause();
        return true;
    }

    /**
     * Single animation tick: state priority handling (dead, hurt, jump, idle, walk).
     *
     * @returns {void}
     */
    tickStateAnimation() {
        if (this.shouldSkipStateAnimation()) return;
        if (this.handleHighPriorityStates()) return;

        const aboveGround = this.isAboveGround();
        this.syncJumpResetIfLanded(aboveGround);

        if (this.handleJumpIfAirborne(aboveGround)) return;
        if (this.handleIdleAnimations()) return;
        if (this.handleWalkingAnimation()) return;

        this.playFallbackIdleAnimation();
    }

    /**
     * Activates short-term invulnerability.
     *
     * @returns {void}
     */
    makeInvulnerable() {
        this.invulnerable = true;
        setTimeout(() => {
            this.invulnerable = false;
        }, this.invulnerabilityDuration);
    }

    /**
     * Applies damage to the character and updates UI and game state.
     *
     * @param {number} [amount=5] - damage amount
     * @returns {void}
     */
    hit(amount = 5) {
        if (this.world?.gameOver || this.world?.gameWon) return;

        const damage = this.resolveDamageAmount(amount);
        this.updateEnergyAfterHit(damage);
        this.updateHurtStateAfterHit();
        this.syncStatusBarAfterHit();
        this.triggerDeathIfNeeded();
    }

    /**
     * Normalises and validates the requested damage amount.
     *
     * @param {number} amount - raw damage amount
     * @returns {number} sanitised damage value
     */
    resolveDamageAmount(amount) {
        if (typeof amount === 'number' && amount > 0) {
            return amount;
        }
        return 5;
    }

    /**
     * Updates the energy value after taking damage
     * and keeps it clamped between 0 and 100.
     *
     * @param {number} damage - damage to apply
     * @returns {void}
     */
    updateEnergyAfterHit(damage) {
        const current = (typeof this.energy === 'number') ? this.energy : 100;

        let next = current - damage;
        if (next < 0) next = 0;
        if (next > 100) next = 100;

        this.energy = next;
    }

    /**
     * Updates the internal hurt flag when the character
     * is still alive so classic IMAGES_HURT stays functional.
     *
     * @returns {void}
     */
    updateHurtStateAfterHit() {
        if (this.energy <= 0) return;

        this.lastHit = Date.now
            ? Date.now()
            : new Date().getTime();
    }

    /**
     * Synchronises the main status bar with the current energy.
     *
     * @returns {void}
     */
    syncStatusBarAfterHit() {
        const bar = this.world?.statusBar;
        if (!bar || typeof bar.setPercentage !== 'function') return;

        bar.setPercentage(this.energy);
    }

    /**
     * Triggers the game over flow when the character reaches 0 HP.
     *
     * @returns {void}
     */
    triggerDeathIfNeeded() {
        if (this.energy > 0) return;

        const onPlayerDeath = this.world?.onPlayerDeath;
        if (typeof onPlayerDeath === 'function') {
            onPlayerDeath.call(this.world);
        }
    }

    /**
     * IMPORTANT: no local isAboveGround() override here!
     * checkIfJumpedOnEnemy relies on MovableObject.isAboveGround().
     *
     * Returns true if the character jumped on the enemy
     * (airborne, falling and colliding).
     *
     * @param {object} enemy - enemy instance
     * @returns {boolean} whether the enemy was jumped on
     */
    checkIfJumpedOnEnemy(enemy) {
        return this.isAboveGround() && this.speedY < 0 && this.isColliding(enemy);
    }

}
