/**
 * Main game world controller.
 * Manages the player, enemies, projectiles, HUD, audio, timers and the main render loop.
 */
class World {
    character = new Character();
    level = level1;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    destroyed = false;

    paused = false;
    START_GRACE_MS = 3000;
    gameStartedAt = 0;

    DEBUG_FRAMES = false;

    statusBar = new StatusBar();
    bottleStatusBar = new BottleStatusBar();
    endbossStatusBar = new EndbossStatusBar();
    endbossInSight = false;
    bossDefeated = false;

    endbossTimerId = null;
    endbossTimerActive = false;
    endbossTimerSeconds = 0;
    ENDBOSS_TIMEOUT_SECONDS = 30;

    portalTimerId = null;
    portalTimerActive = false;
    portalTimerSeconds = 0;
    PORTAL_TIMEOUT_SECONDS = 11;

    bgMusic = new Audio('/audio/pixel-adventure.mp3');

    MINI_SWARM_INTERVAL_MS = 3000;
    MINI_SWARM_GROUP_SIZE  = 5;
    MINI_SWARM_MAX_COUNT   = 8;

    miniSwarmTimerId = null;
    miniSwarmActive  = false;
    miniSwarmOriginX = null;

    coinStatusBar = new CoinStatusBar();
    coinsCollected = 0;
    totalCoins = 0;
    coinAudio = new Audio('/audio/game-bonus-coins.mp3');
    heartPickupAudio = new Audio('/audio/level-up-03.mp3');

    whiskeyCounter = new WhiskeyCounter();
    whiskeyCount = 0;

    supernovaAudio = new Audio('/audio/supernova.mp3');
    bottlePickupAudio = new Audio('/audio/bottle.mp3');
    whiskeyPickupAudio = new Audio('/audio/man-says-amazing.mp3');

    gameOver = false;
    gravestone = null;

    goSplashImg = null;
    goSplashActive = false;
    goSplashPath = '/img/9_intro_outro_screens/game_over/1_game-over.png';

    gameOverScreen = null;

    goT0 = 0;
    SPLASH_DELAY_MS = 3000;
    SPLASH_MS = 3000;
    OVERLAY_AT_MS = 7000;
    BUTTON_AT_MS  = 12000;

    goOverlayShown = false;
    goButtonShown = false;
    goLoopsStarted = false;
    goSplashShown   = false;

    painAudio = new Audio('/audio/genervt.mp3');
    _painLock = false;

    playerDeathAudio = new Audio('/audio/man-screaming.mp3');

    deathSong = new Audio('/audio/spiel-mir-das-lied-vom-tod.mp3');

    goCryLoop = new Audio('/audio/woman-cry-loop.mp3');
    goRainLoop = new Audio('/audio/raindrops.mp3');

    dramaticAudio = new Audio('/audio/dark-battle.mp3');
    bossDeathAudio = new Audio('/audio/cry-dead.mp3');
    hitAudio = new Audio('/audio/punch-3.mp3');

    portalTimerAudio = new Audio('/audio/10sec-countdown.mp3');

    throwableObjects = [];
    effects = [];
    bottlesCollected = 0;
    maxBottles = 5;

    hutGate = null;
    hutStory = null;
    winnerScreen = null;
    gameWon = false;
    storyLatched = false;

    /**
     * Creates a new world instance and sets up the main game loop.
     *
     * @param {HTMLCanvasElement} canvas - canvas used for rendering
     * @param {Keyboard} keyboard - keyboard input handler
     */
    constructor(canvas, keyboard) {
        this.initCanvasAndInput(canvas, keyboard);
        this.initLevelGateAndStory();
        this.initPickupCounters();
        this.initGameOverAssets();
        this.initAudioAndLoops();
    }

    /**
     * Sets up canvas, context, keyboard and basic audio.
     *
     * @param {HTMLCanvasElement} canvas
     * @param {Keyboard} keyboard
     * @returns {void}
     */
    initCanvasAndInput(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.enemyDeathAudio = new Audio('/audio/chicken-wing.mp3');
        this.gameStartedAt = performance.now();
    }

    /**
     * Initialises hut gate and story billboard references.
     *
     * @returns {void}
     */
    initLevelGateAndStory() {
        this.hutGate = this.level.hutGate || null;
        this.hutStory = this.level.storyBillboard || null;

        if (this.hutStory && !this.hutStory.anchorGate && this.hutGate) {
            this.hutStory.anchorGate = this.hutGate;
        }
    }

    /**
     * Initialises coin total, HUD percentage and whiskey counter.
     *
     * @returns {void}
     */
    initPickupCounters() {
        this.totalCoins = Array.isArray(this.level.coins)
            ? this.level.coins.length
            : 0;

        const pct = this.totalCoins > 0 ? 0 : 100;
        this.coinStatusBar.setPercentage(pct);
        this.whiskeyCounter.setCount(0);
    }

    /**
     * Prepares game over splash image and winner screen.
     *
     * @returns {void}
     */
    initGameOverAssets() {
        this.preloadGoSplash();
        this.winnerScreen = new WinnerScreen();
    }

    /**
     * Starts background music and the main loops (render + world tick).
     *
     * @returns {void}
     */
    initAudioAndLoops() {
        this.startBgMusic();
        this.draw();
        this.setWorld();
        this.run();
    }

    /**
     * Returns true if the world is still in the start grace period.
     * During this time, enemy collisions are ignored so the player
     * cannot die immediately at spawn.
     *
     * @returns {boolean} whether the world is in the start grace period
     */
    isInStartGrace() {
        if (this.gameOver || this.gameWon) return false;
        if (!this.gameStartedAt || this.START_GRACE_MS <= 0) return false;

        const now = performance.now();
        return (now - this.gameStartedAt) < this.START_GRACE_MS;
    }

    /**
     * Preloads the single game over splash image (no randomisation).
     *
     * @returns {void}
     */
    preloadGoSplash() {
        try {
            const img = new Image();
            img.onload = () => {};
            img.onerror = () => {};
            img.src = this.goSplashPath;
            this.goSplashImg = img;
        } catch (e) {}
    }

    /**
     * Injects the world reference into the character.
     *
     * @returns {void}
     */
    setWorld() {
        this.character.world = this;
    }

    /**
     * Main world tick (every 200 ms): updates pickups, boss phase and portal logic.
     *
     * @returns {void}
     */
    run() {
        setInterval(() => {
            if (this.shouldSkipWorldTick()) return;
            this.handleWorldTick();
        }, 200);
    }

    /**
     * Returns true if the world tick should be skipped
     * because of pause or end state.
     *
     * @returns {boolean} whether the tick should be skipped
     */
    shouldSkipWorldTick() {
        if (this.gameWon || this.gameOver) {
            if (this.hutStory) this.hutStory.deactivate();
            return true;
        }
        if (this.paused) return true;
        return false;
    }

    /**
     * Executes a single logical world tick while the game is running.
     *
     * @returns {void}
     */
    handleWorldTick() {
        this.updatePickupsAndThrows();
        this.updateEndbossPhase();
        this.updateBossMusicState();
        this.updateHutAndPortal();
        this.cleanupEffectsList();
    }

    /**
     * Updates all pickups and throwable objects in a single tick.
     *
     * @returns {void}
     */
    updatePickupsAndThrows() {
        this.checkThrowObjects();
        this.checkBottleCollection();
        this.checkCoinCollection();
        this.checkWhiskeyCollection();
        this.checkHeartCollection();
    }

    /**
     * Updates hut gate, story billboard and portal checks.
     *
     * @returns {void}
     */
    updateHutAndPortal() {
        if (this.hutGate) this.hutGate.update();
        if (this.hutStory) this.hutStory.update();

        this.checkHutProximityAndStory();
        this.checkPortalEnter();
    }

    /**
     * Removes finished visual effects from the effects list.
     *
     * @returns {void}
     */
    cleanupEffectsList() {
        if (!Array.isArray(this.effects)) {
            this.effects = [];
            return;
        }
        this.effects = this.effects.filter(e => !e.done);
    }

    /**
     * Timer, GameOver and winner-screen logic
     * is implemented via world-timers.class.js and world-endgame.class.js
     * (prototype mixins on World.prototype).
     */
}
