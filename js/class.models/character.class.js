/**
 * Main player character (Pepe).
 * Handles movement, idle/sleep behaviour, jump animation, damage and invulnerability.
 */
class Character extends MovableObject {

    height = 280;
    y = 80;
    speed = 3; // previously 5 → calmer pace fitting the walk sound

    // === Idle / Snore state ===
    idlePhase = 'active'; // 'active' | 'idle' | 'snore'
    lastActiveAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());

    // Idle / sleep timings (inactivity based)
    IDLE_DELAY_MS  = 300;   // ~6–7s until soft idle / pre-sleep
    SNORE_DELAY_MS = 9500;  // ~9–10s until snore / sleep phase

    // Counter to slow down idle / sleep frames
    idleAnimTick = 0;

    // Audio
    snoreAudio = new Audio('/audio/snoring-man.mp3');       // loop
    wakeAudio  = new Audio('/audio/ave-maria-speech.mp3');  // one-shot

    // Invulnerability state
    invulnerable = false;
    invulnerabilityDuration = 900;  // invulnerability duration in ms (previously 1500)

    // === Jump animation state (once per jump) ===
    jumpInProgress = false;
    jumpFrameIndex = 0;
    jumpAnimTick = 0;

    // === Idle frames ===
    IMAGES_IDLE = [
        '/img/2_character_pepe/1_idle/idle/I-1.png',
        '/img/2_character_pepe/1_idle/idle/I-2.png',
        '/img/2_character_pepe/1_idle/idle/I-3.png',
        '/img/2_character_pepe/1_idle/idle/I-4.png',
        '/img/2_character_pepe/1_idle/idle/I-5.png',
        '/img/2_character_pepe/1_idle/idle/I-6.png',
        '/img/2_character_pepe/1_idle/idle/I-7.png',
        '/img/2_character_pepe/1_idle/idle/I-8.png',
        '/img/2_character_pepe/1_idle/idle/I-9.png',
        '/img/2_character_pepe/1_idle/idle/I-10.png'
    ];

    // === Long idle (snore) frames ===
    IMAGES_LONG_IDLE = [
        '/img/2_character_pepe/1_idle/long_idle/I-11.png',
        '/img/2_character_pepe/1_idle/long_idle/I-12.png',
        '/img/2_character_pepe/1_idle/long_idle/I-13.png',
        '/img/2_character_pepe/1_idle/long_idle/I-14.png',
        '/img/2_character_pepe/1_idle/long_idle/I-15.png',
        '/img/2_character_pepe/1_idle/long_idle/I-16.png',
        '/img/2_character_pepe/1_idle/long_idle/I-17.png',
        '/img/2_character_pepe/1_idle/long_idle/I-18.png',
        '/img/2_character_pepe/1_idle/long_idle/I-19.png',
        '/img/2_character_pepe/1_idle/long_idle/I-20.png'
    ];

    IMAGES_WALKING = [
        '/img/2_character_pepe/2_walk/W-21.png',
        '/img/2_character_pepe/2_walk/W-22.png',
        '/img/2_character_pepe/2_walk/W-23.png',
        '/img/2_character_pepe/2_walk/W-24.png',
        '/img/2_character_pepe/2_walk/W-25.png',
        '/img/2_character_pepe/2_walk/W-26.png'
    ];

    IMAGES_JUMPING = [
        '/img/2_character_pepe/3_jump/J-31.png',
        '/img/2_character_pepe/3_jump/J-32.png',
        '/img/2_character_pepe/3_jump/J-33.png',
        '/img/2_character_pepe/3_jump/J-34.png',
        '/img/2_character_pepe/3_jump/J-35.png',
        '/img/2_character_pepe/3_jump/J-36.png',
        '/img/2_character_pepe/3_jump/J-37.png',
        '/img/2_character_pepe/3_jump/J-38.png',
        '/img/2_character_pepe/3_jump/J-39.png'
    ];

    IMAGES_HURT = [
        '/img/2_character_pepe/4_hurt/H-41.png',
        '/img/2_character_pepe/4_hurt/H-42.png',
        '/img/2_character_pepe/4_hurt/H-43.png'
    ];

    IMAGES_DEAD = [
        '/img/2_character_pepe/5_dead/D-51.png',
        '/img/2_character_pepe/5_dead/D-52.png',
        '/img/2_character_pepe/5_dead/D-53.png',
        '/img/2_character_pepe/5_dead/D-54.png',
        '/img/2_character_pepe/5_dead/D-55.png',
        '/img/2_character_pepe/5_dead/D-56.png',
        '/img/2_character_pepe/5_dead/D-57.png'
    ];

    world;
    walking_sound = new Audio('/audio/stamping.mp3');
    walking_sound_back = new Audio('/audio/stamping.mp3');

    /**
     * Creates a new character instance and prepares images, audio, gravity and animation.
     */
    constructor() {
        super().loadImage('/img/2_character_pepe/2_walk/W-21.png');

        this.initAnimations();
        this.initAudio();
        this.initPhysics();
        this.startLoops();
    }

    /**
     * Preloads all animation frames for the character.
     *
     * @returns {void}
     */
    initAnimations() {
        this.loadImages(this.IMAGES_IDLE);
        this.loadImages(this.IMAGES_LONG_IDLE);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_JUMPING);
        this.loadImages(this.IMAGES_HURT);
        this.loadImages(this.IMAGES_DEAD);
    }

    /**
     * Configures snore and wake audio (loop, volume).
     *
     * @returns {void}
     */
    initAudio() {
        try {
            this.snoreAudio.loop = true;
            this.snoreAudio.volume = 0.55;
        } catch (e) {}

        try {
            this.wakeAudio.volume = 0.85;
        } catch (e) {}
    }

    /**
     * Sets the ground position, hitbox offset and enables gravity.
     *
     * @returns {void}
     */
    initPhysics() {
        // Ground line: Pepe stands at y = 80
        this.groundPosition = 150;

        this.offset = {
            left: 18,
            right: 18,
            top: 64,   // previously 50
            bottom: 12 // previously 10
        };

        this.applyGravity();
    }

    /**
     * Starts the continuous movement and animation loops.
     *
     * @returns {void}
     */
    startLoops() {
        this.animate();
    }


    /**
     * Starts both the movement and animation loops.
     *
     * @returns {void}
     */
    animate() {
        this.startMovementLoop();
        this.startAnimationLoop();
    }

    /**
     * Starts the 60 FPS loop that handles movement and input.
     *
     * @returns {void}
     */
    startMovementLoop() {
        setInterval(() => {
            const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            this.tickMovement(now);
        }, 1000 / 60);
    }

    /**
     * Single movement tick: pause/end checks, idle/sleep, input and camera update.
     *
     * @param {number} now - current timestamp in ms
     * @returns {void}
     */
    tickMovement(now) {
        if (this.handlePauseAndEndStates()) return;

        // Idle / snore state before movement
        this.updateIdleState(now);
        this.walking_sound.pause();

        this.handleHorizontalMovement();
        this.handleJumpInput();
        this.updateCameraPosition();
    }

    /**
     * Handles pause / gameOver / gameWon early exits in movement.
     *
     * @returns {boolean} true if movement tick should be skipped
     */
    handlePauseAndEndStates() {
        if (this.handlePausedState()) return true;
        if (this.handleGameOverState()) return true;
        if (this.handleGameWonState()) return true;
        return false;
    }

    /**
     * Paused world: stop walking sounds, keep camera following Pepe.
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
     * Horizontal movement (right / left) including level bounds.
     *
     * @returns {void}
     */
    handleHorizontalMovement() {
        const world = this.world;
        if (!world || !world.keyboard || !world.level) return;

        this.handleRightMovement(world);
        this.handleLeftMovement(world);
    }

    /**
     * Handles movement to the right, clamped to level_end_x.
     *
     * @param {World} world - world instance
     * @returns {void}
     */
    handleRightMovement(world) {
        if (!world.keyboard.RIGHT) return;

        if (this.x < world.level.level_end_x) {
            this.moveRight();
            this.otherDirection = false;
            this.walking_sound.play();
        } else if (this.x >= world.level.level_end_x) {
            // Character stops at the end of the level
            this.x = world.level.level_end_x;
        }
    }

    /**
     * Handles movement to the left, clamped to x >= 0.
     *
     * @param {World} world - world instance
     * @returns {void}
     */
    handleLeftMovement(world) {
        if (!world.keyboard.LEFT) return;
        if (this.x <= 0) return;

        this.moveLeft();
        this.otherDirection = true;
        this.walking_sound_back.play();
    }

    /**
     * Jump input (SPACE) – only when on the ground.
     *
     * @returns {void}
     */
    handleJumpInput() {
        const world = this.world;
        if (!world?.keyboard?.SPACE) return;
        if (this.isAboveGround()) return;

        this.jump();
    }

    /**
     * Camera follows character position.
     *
     * @returns {void}
     */
    updateCameraPosition() {
        if (!this.world) return;
        this.world.camera_x = -this.x + 100;
    }

    /**
     * Starts the 20 FPS loop that controls animation state.
     *
     * @returns {void}
     */
    startAnimationLoop() {
        setInterval(() => {
            this.tickStateAnimation();
        }, 50);
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
     * Resets jump animation once Pepe lands again.
     *
     * @param {boolean} aboveGround - whether Pepe is currently airborne
     * @returns {void}
     */
    syncJumpResetIfLanded(aboveGround) {
        if (!aboveGround && this.jumpInProgress) {
            this.resetJumpAnimation();
        }
    }

    /**
     * While airborne, use the jump animation once per jump.
     *
     * @param {boolean} aboveGround - whether Pepe is currently airborne
     * @returns {boolean} true if jump animation was played
     */
    handleJumpIfAirborne(aboveGround) {
        if (!aboveGround) return false;
        this.playJumpAnimation();
        return true;
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
     * Slows down jump animation frames:
     * only every few ticks the jump frame is advanced.
     *
     * @returns {boolean} true if the jump frame should be advanced
     */
    shouldAdvanceJumpFrame() {
        this.jumpAnimTick = (this.jumpAnimTick || 0) + 1;

        // Change the divisor to fine-tune the speed:
        // 2 = slightly slower, 3 = even slower.
        return (this.jumpAnimTick % 2) === 0;
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
        // Safely stop snore audio if we come from snore phase
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
            this.snoreAudio.currentTime = 0;
            this.snoreAudio.play();
        } catch (e) {}
    }

    /**
     * Stops snore audio safely and resets its position.
     *
     * @returns {void}
     */
    stopSnore() {
        try {
            if (!this.snoreAudio.paused) {
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
            this.wakeAudio.pause();
            this.wakeAudio.currentTime = 0;
            this.wakeAudio.play();
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
     * Starts a jump if the character is on the ground.
     * Also resets jump animation state for a fresh jump.
     *
     * @returns {void}
     */
    jump() {
        // Safety: no double jump in mid-air
        if (this.isAboveGround()) return;

        this.speedY = 25;
        this.resetJumpAnimation();
        this.jumpInProgress = true;
    }

    /**
     * Resets jump animation state.
     *
     * @returns {void}
     */
    resetJumpAnimation() {
        this.jumpInProgress = false;
        this.jumpFrameIndex = 0;
    }

    /**
     * Plays the jump animation, advancing frames in a slowed-down fashion
     * and clamping the index at the last frame.
     *
     * @returns {void}
     */
    playJumpAnimation() {
        const frames = this.IMAGES_JUMPING;
        if (!Array.isArray(frames) || frames.length === 0) return;

        if (!this.jumpInProgress) {
            this.jumpInProgress = true;
            this.jumpFrameIndex = 0;
            this.jumpAnimTick = 0;
        }

        const idx = Math.min(this.jumpFrameIndex, frames.length - 1);
        const path = frames[idx];
        const img = this.imageCache[path];

        if (img) {
            this.img = img;
        }

        if (this.jumpFrameIndex < frames.length - 1 && this.shouldAdvanceJumpFrame()) {
            this.jumpFrameIndex++;
        }
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
