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
     * Creates a new world instance and sets up the main game loop.
     *
     * @param {HTMLCanvasElement} canvas - canvas used for rendering
     * @param {Keyboard} keyboard - keyboard input handler
     */
    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.enemyDeathAudio = new Audio('/audio/chicken-wing.mp3');

        this.gameStartedAt = performance.now();
        this.hutGate = this.level.hutGate || null;
        this.hutStory = this.level.storyBillboard || null;
        if (this.hutStory && !this.hutStory.anchorGate && this.hutGate) {
            this.hutStory.anchorGate = this.hutGate;
        }

        this.totalCoins = Array.isArray(this.level.coins) ? this.level.coins.length : 0;
        this.coinStatusBar.setPercentage(this.totalCoins > 0 ? 0 : 100);
        this.whiskeyCounter.setCount(0);
        this.preloadGoSplash();

        this.winnerScreen = new WinnerScreen();

        this.startBgMusic();

        this.draw();
        this.setWorld();
        this.run();
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
     * Handles collection of normal bottles by the character.
     *
     * @returns {void}
     */
    checkBottleCollection() {
        let picked = false;
        this.level.bottles.forEach((bottle) => {
            if (this.character.isColliding(bottle)) {
                if (this.bottlesCollected < this.maxBottles) {
                    const pickedBottle = bottle;
                    this.level.bottles = this.level.bottles.filter(b => b !== pickedBottle);
                    this.bottlesCollected++;
                    picked = true;
                    const pct = (this.bottlesCollected / this.maxBottles) * 100;
                    this.bottleStatusBar.setPercentage(pct);
                }
            }
        });

        if (picked) {
            try {
                this.bottlePickupAudio.currentTime = 0;
                this.playAudioSafe(this.bottlePickupAudio);
            } catch (e) {}
        }
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
     * Handles coin pickup logic and updates the coin status bar and sound.
     *
     * @returns {void}
     */
    checkCoinCollection() {
        if (!this.level || !Array.isArray(this.level.coins)) return;

        const remaining = [];
        let pickedAny = false;

        for (const coin of this.level.coins) {
            if (this.character.isColliding(coin)) {
                pickedAny = true;
                this.coinsCollected++;
            } else {
                remaining.push(coin);
            }
        }

        if (pickedAny) {
            try {
                this.coinAudio.currentTime = 0;
                this.playAudioSafe(this.coinAudio);
            } catch (e) {}
            const pct = this.totalCoins > 0 ? (this.coinsCollected / this.totalCoins) * 100 : 100;
            this.coinStatusBar.setPercentage(pct);
        }

        this.level.coins = remaining;
    }

    /**
     * Handles whiskey pickup logic and updates the counter and sound.
     *
     * @returns {void}
     */
    checkWhiskeyCollection() {
        if (!this.level || !Array.isArray(this.level.whiskeys)) return;
        const remaining = [];
        let gained = 0;

        for (const w of this.level.whiskeys) {
            if (this.character.isColliding(w)) {
                gained++;
            } else {
                remaining.push(w);
            }
        }

        if (gained > 0) {
            this.whiskeyCount += gained;
            this.whiskeyCounter.setCount(this.whiskeyCount);
            try {
                this.whiskeyPickupAudio.currentTime = 0;
                this.playAudioSafe(this.whiskeyPickupAudio);
            } catch (e) {}
        }

        this.level.whiskeys = remaining;
    }

    /**
     * Handles heart pickup logic and heals the player accordingly.
     *
     * @returns {void}
     */
    checkHeartCollection() {
        if (!this.level || !Array.isArray(this.level.hearts)) return;

        const remaining = [];
        let picked = 0;
        const HEAL_PER_HEART = 40;

        for (const h of this.level.hearts) {
            if (this.character.isColliding(h)) picked++;
            else remaining.push(h);
        }

        if (picked > 0) {
            const heal = HEAL_PER_HEART * picked;
            this.character.energy = Math.min(100, (this.character.energy || 0) + heal);
            this.statusBar.setPercentage(this.character.energy);
            try {
                this.heartPickupAudio.currentTime = 0;
                this.playAudioSafe(this.heartPickupAudio);
            } catch (e) {}
        }

        this.level.hearts = remaining;
    }

    /**
     * Timer, GameOver and winner-screen logic
     * is implemented via world-timers.class.js and world-endgame.class.js
     * (prototype mixins on World.prototype).
     */
    
}