/**
 * Base physics, movement and camera behaviour for the player character.
 * No knowledge about idle/sleep, damage or sprite sets – that lives in CharacterState / Character.
 */
class CharacterMovement extends MovableObject {

    height = 280;
    y = 80;
    speed = 3; // previously 5 → calmer pace fitting the walk sound

    // Jump animation state
    jumpInProgress = false;
    jumpFrameIndex = 0;
    jumpAnimTick = 0;

    world;
    walking_sound = new Audio('/audio/stamping.mp3');
    walking_sound_back = new Audio('/audio/stamping.mp3');

    /**
     * Sets up physics and starts the continuous movement / animation loops.
     */
    constructor() {
        super();
        this.initPhysics();
        this.startLoops();
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
     * Single movement tick: pause/end checks, idle/sleep hook, input and camera update.
     *
     * @param {number} now - current timestamp in ms
     * @returns {void}
     */
    tickMovement(now) {
        if (this.handlePauseAndEndStates()) return;

        // Idle / snore logic is implemented in CharacterState
        if (typeof this.updateIdleState === 'function') {
            this.updateIdleState(now);
        }

        this.walking_sound.pause();

        this.handleHorizontalMovement();
        this.handleJumpInput();
        this.updateCameraPosition();
    }

    /**
     * Delegates to pause / gameOver / gameWon handlers when available.
     *
     * @returns {boolean} true if movement tick should be skipped
     */
    handlePauseAndEndStates() {
        if (typeof this.handlePausedState === 'function' && this.handlePausedState()) {
            return true;
        }

        if (typeof this.handleGameOverState === 'function' && this.handleGameOverState()) {
            return true;
        }

        if (typeof this.handleGameWonState === 'function' && this.handleGameWonState()) {
            return true;
        }

        return false;
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
     * Starts the 20 FPS loop that triggers state animation.
     * Actual animation logic lives in CharacterState.tickStateAnimation().
     *
     * @returns {void}
     */
    startAnimationLoop() {
        setInterval(() => {
            if (typeof this.tickStateAnimation === 'function') {
                this.tickStateAnimation();
            }
        }, 50);
    }

    /**
     * Resets jump animation once the character lands again.
     *
     * @param {boolean} aboveGround - whether the character is currently airborne
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
     * @param {boolean} aboveGround - whether the character is currently airborne
     * @returns {boolean} true if jump animation was played
     */
    handleJumpIfAirborne(aboveGround) {
        if (!aboveGround) return false;
        this.playJumpAnimation();
        return true;
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

}
