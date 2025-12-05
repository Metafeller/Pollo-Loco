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
     * Throws a normal bottle if at least one is available.
     *
     * @returns {void}
     */
    throwBottle() {
        if (this.bottlesCollected > 0) {
            const bottle = new ThrowableObject(this.character.x + 100, this.character.y + 100);
            this.throwableObjects.push(bottle);
            this.bottlesCollected--;
            const pct = (this.bottlesCollected / this.maxBottles) * 100;
            this.bottleStatusBar.setPercentage(pct);
        }
    }

    /**
     * Checks whether the Endboss is currently in chase state and updates
     * the world flag used for HUD and audio decisions.
     *
     * @returns {void}
     */
    checkEndbossSight() {
        const endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (!endboss) return;
        this.endbossInSight = (endboss.aiState === 'CHASE');
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
     * Handles AI and state for the Endboss and the mini-chicken swarm.
     *
     * @returns {void}
     */
    updateEndbossPhase() {
        const endboss = this.getCurrentEndboss();
        if (endboss && !this.bossDefeated) {
            endboss.updateAI(this.character?.x || 0);
            this.endbossInSight = (endboss.aiState === 'CHASE');

            if (this.endbossInSight) {
                this.startEndbossTimer();
                this.startMiniChickenSwarm();
            } else {
                this.stopMiniChickenSwarm();
            }
            return;
        }

        this.endbossInSight = false;
        this.stopMiniChickenSwarm();
    }

    /**
     * Pauses or resumes background music depending on boss visibility.
     *
     * @returns {void}
     */
    updateBossMusicState() {
        if (this.endbossInSight) {
            this.pauseBgMusic();
        } else {
            this.resumeBgMusic();
        }
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
     * Handles throw input for bottles and fireballs, and cleans up finished projectiles.
     *
     * @returns {void}
     */
    checkThrowObjects() {
        if (this.keyboard.D && this.bottlesCollected > 0) {
            const facingRight = true;

            const bottle = new ThrowableObject(
                this.character.x + 100,
                this.character.y + 80,
                facingRight,
                this
            );

            this.throwableObjects.push(bottle);
            this.bottlesCollected--;

            const pct = (this.bottlesCollected / this.maxBottles) * 100;
            this.bottleStatusBar.setPercentage(pct);
        }

        if (this.keyboard.F && this.whiskeyCount > 0) {
            const facingRight = true;
            const fire = new Fireball(this.character.x + 110, this.character.y + 70, facingRight);
            this.throwableObjects.push(fire);
            this.whiskeyCount--;
            this.whiskeyCounter.setCount(this.whiskeyCount);
            try {
                this.supernovaAudio.currentTime = 0;
                this.playAudioSafe(this.supernovaAudio);
            } catch (e) {}
        }

        this.throwableObjects = this.throwableObjects.filter(p => !p.done);
    }

    /**
     * Checks all projectile ↔ enemy collisions in the current frame.
     *
     * @returns {void}
     */
    checkProjectileCollisions() {
        if (!this.canCheckProjectileCollisions()) return;

        this.throwableObjects.forEach((proj, idx) => {
            this.level.enemies.forEach((enemy) => {
                if (!proj.isColliding(enemy)) return;
                this.handleProjectileHitsEnemy(proj, enemy, idx);
            });
        });

        this.cleanupProjectiles();
    }

    /**
     * Returns true if projectile collision checks are safe to run.
     *
     * @returns {boolean} whether projectile checks can run
     */
    canCheckProjectileCollisions() {
        if (!Array.isArray(this.throwableObjects)) return false;
        if (!this.level) return false;
        if (!Array.isArray(this.level.enemies)) return false;
        return true;
    }

    /**
     * Dispatches projectile hits to specific handlers based on projectile type.
     *
     * @param {ThrowableObject|Fireball} proj - projectile object
     * @param {object} enemy - enemy that was hit
     * @param {number} idx - projectile index in the array
     * @returns {void}
     */
    handleProjectileHitsEnemy(proj, enemy, idx) {
        if (proj instanceof Fireball) {
            this.handleFireballHitEnemy(proj, enemy);
            return;
        }
        this.handleBottleHitEnemy(proj, enemy, idx);
    }

    /**
     * Fireball behaviour: ignores small ground enemies, hits boss or flying enemies.
     *
     * @param {Fireball} proj - fireball projectile
     * @param {object} enemy - enemy that was hit
     * @returns {void}
     */
    handleFireballHitEnemy(proj, enemy) {
        if (enemy instanceof Chicken || enemy instanceof MiniChicken) return;
        if (!(enemy instanceof Endboss || enemy.canBeHitByFireball === true)) return;

        if (typeof enemy.enterAggro === 'function') enemy.enterAggro();
        this.startAmbienceLoop();

        const dmg = 40;
        this.applyFireballDamage(enemy, dmg);

        this.endbossStatusBar.setPercentage(enemy.energy);
        if (enemy.energy === 0 && typeof this.onEndbossDeath === 'function') {
            this.onEndbossDeath(enemy);
        }

        proj.done = true;
    }

    /**
     * Applies fireball damage with the original fallback behaviour.
     *
     * @param {object} enemy - enemy to damage
     * @param {number} dmg - damage amount
     * @returns {void}
     */
    applyFireballDamage(enemy, dmg) {
        try {
            if (enemy.hit.length >= 1) {
                enemy.hit(dmg);
            } else {
                enemy.hit();
                if (typeof enemy.energy === 'number') {
                    enemy.energy = Math.max(0, enemy.energy - 20);
                }
            }
        } catch (e) {
            if (typeof enemy.energy === 'number') {
                enemy.energy = Math.max(0, enemy.energy - dmg);
            }
        }
    }

    /**
     * Standard bottle behaviour for all enemies.
     *
     * @param {ThrowableObject} proj - bottle projectile
     * @param {object} enemy - enemy that was hit
     * @param {number} idx - projectile index in the array
     * @returns {void}
     */
    handleBottleHitEnemy(proj, enemy, idx) {
        if (proj.hasHit === true) return;
        proj.hasHit = true;

        this.onBottleHitsEnemy(proj, enemy);

        if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
            this.handleBottleHitChicken(enemy);
        } else if (enemy instanceof Endboss) {
            this.handleBottleHitEndboss(enemy);
        }

        this.throwableObjects.splice(idx, 1);
    }

    /**
     * Bottle hit on small enemies: kill + delayed removal with sound.
     *
     * @param {object} enemy - chicken or mini-chicken
     * @returns {void}
     */
    handleBottleHitChicken(enemy) {
        if (typeof enemy.die === 'function') enemy.die();
        setTimeout(() => {
            try {
                this.playEnemyDeathSound();
            } catch (e) {}
            this.level.enemies = this.level.enemies.filter(e => e !== enemy);
        }, 320);
    }

    /**
     * Bottle hit on Endboss: aggro + damage + death check.
     *
     * @param {Endboss} enemy - boss instance
     * @returns {void}
     */
    handleBottleHitEndboss(enemy) {
        if (typeof enemy.enterAggro === 'function') enemy.enterAggro();
        this.startAmbienceLoop();

        const dmg = 20;
        this.applyBottleDamageToEndboss(enemy, dmg);

        this.endbossStatusBar.setPercentage(enemy.energy);
        if (enemy.energy === 0 && typeof this.onEndbossDeath === 'function') {
            this.onEndbossDeath(enemy);
        }
    }

    /**
     * Applies bottle damage to the Endboss with original fallback logic.
     *
     * @param {Endboss} enemy - boss instance
     * @param {number} dmg - damage amount
     * @returns {void}
     */
    applyBottleDamageToEndboss(enemy, dmg) {
        try {
            if (enemy.hit.length >= 1) {
                enemy.hit(dmg);
            } else {
                enemy.hit();
            }
        } catch (e) {
            if (typeof enemy.energy === 'number') {
                enemy.energy = Math.max(0, enemy.energy - dmg);
            }
        }
    }

    /**
     * Removes finished projectiles after processing collisions.
     *
     * @returns {void}
     */
    cleanupProjectiles() {
        this.throwableObjects = this.throwableObjects.filter(p => !p.done);
    }

    /**
     * Checks collisions between the player and all enemies,
     * including stomp detection and damage handling.
     *
     * @returns {void}
     */
    checkCollisions() {
        if (this.isInStartGrace()) return;

        this.level.enemies.forEach((enemy) => {
            if (!enemy || enemy.dead === true) return;

            const bodyHit  = this.character.isColliding(enemy);
            const stompHit = this.didStompEnemy(enemy);

            if (stompHit) {
                if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
                    enemy.die();
                    this.playEnemyDeathSound();
                    setTimeout(() => {
                        const victim = enemy;
                        this.level.enemies = this.level.enemies.filter(e => e !== victim);
                    }, 500);

                    this.character.speedY = 15;
                    this.character.makeInvulnerable();

                } else if (enemy instanceof Endboss) {
                    this.character.speedY = 18;
                    this.character.makeInvulnerable();
                }

            } else if (bodyHit && !this.character.invulnerable) {

                this.character.hit(20);
                this.playPainOnce();

                this.character.makeInvulnerable();

                this.character.speedY = Math.max(this.character.speedY, 8);
            }
        });
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
     * Stops the portal timer and clears its interval.
     *
     * @returns {void}
     */
    stopPortalTimer() {
        if (this.portalTimerId) {
            clearInterval(this.portalTimerId);
            this.portalTimerId = null;
        }

        this.portalTimerActive = false;
        this.portalTimerSeconds = 0;

        this.stopPortalTimerSound();
    }

    /**
     * Final player death handler.
     * Stops all relevant systems, spawns the gravestone,
     * starts the game over audio sequence and initialises the GO sequencer.
     *
     * @returns {void}
     */
    onPlayerDeath() {
        if (this.gameOver) return;
        this.gameOver = true;

        this.stopBossAndPortalSystems();
        this.stopStepAndAmbienceSounds();
        this.freezeEnemiesAndCharacter();
        this.createGravestoneForCharacter();
        this.playDeathAudioSequence();
        this.setupGameOverScreenWithRestartHook();
        this.initGameOverSequencer();
    }

    /**
     * Stops all boss and portal related timers plus mini-chicken swarm.
     *
     * @returns {void}
     */
    stopBossAndPortalSystems() {
        this.stopEndbossTimer();
        this.stopPortalTimer();
        this.stopMiniChickenSwarm();
    }

    /**
     * Freezes all enemies and the player character.
     *
     * @returns {void}
     */
    freezeEnemiesAndCharacter() {
        this.freezeAllEnemies();
        this.freezeCharacter();
    }

    /**
     * Sets all enemies to a frozen state (no movement, no AI).
     *
     * @returns {void}
     */
    freezeAllEnemies() {
        try {
            (this.level?.enemies || []).forEach(e => {
                if (!e) return;
                e.speed = 0;
                e.baseSpeed = 0;

                if (typeof e.moveLeft  === 'function')  e.moveLeft  = function() {};
                if (typeof e.moveRight === 'function')  e.moveRight = function() {};
                if (typeof e.updateAI  === 'function')  e.updateAI  = function() {};

                if (e instanceof Endboss) {
                    e.inAggroMode = false;
                    e.aiState = 'IDLE';
                    e.returning = false;
                }
            });
        } catch (e) {}
    }

    /**
     * Freezes the player character and marks him as dead.
     *
     * @returns {void}
     */
    freezeCharacter() {
        try {
            this.character.dead = true;
            this.character.speed = 0;
            this.character.speedY = 0;
        } catch (e) {}
    }

    /**
     * Places the gravestone at the player's feet with a slight sink.
     *
     * @returns {void}
     */
    createGravestoneForCharacter() {
        try {
            const SW = 120;
            const SH = 340;
            const gx = this.character.x + (this.character.width * 0.5) - (SW / 2);

            const SINK_PX = 64;
            const gy = this.character.y + this.character.height - SH + SINK_PX;

            this.gravestone = new Gravestone(gx, gy, SW, SH);
        } catch (e) {}
    }

    /**
     * Builds the GameOver screen overlay and wires the Try Again callback.
     *
     * @returns {void}
     */
    setupGameOverScreenWithRestartHook() {
        try {
            if (!this.gameOverScreen) this.gameOverScreen = new GameOverScreen();
            this.gameOverScreen.attachDom('.stage');

            this.gameOverScreen.onTryAgain(() => {
                try {
                    if (typeof this.resetAllAudios === 'function') {
                        this.resetAllAudios();
                    } else if (typeof this.stopAllGameOverAudio === 'function') {
                        this.stopAllGameOverAudio();
                    }
                } catch (e) {}

                if (window.restartNow) {
                    window.restartNow();
                }
            });
        } catch (e) {}
    }

    /**
     * Resets GameOver sequencer timing flags and prepares the splash.
     *
     * @returns {void}
     */
    initGameOverSequencer() {
        this.goT0 = performance.now();
        this.goOverlayShown = false;
        this.goButtonShown = false;
        this.goLoopsStarted = false;
        this.goSplashShown  = false;
        this.goSplashActive = false;

        try {
            if (this.goSplashImg && typeof this.goSplashImg.decode === 'function') {
                this.goSplashImg.decode().catch(() => {});
            }
        } catch (e) {}

        try {
            this.pauseBgMusic();
        } catch (e) {}
    }

    /**
     * Per-frame game over sequencer.
     * No timers used to avoid race conditions with restart.
     *
     * @param {number} now - current timestamp from performance.now()
     * @returns {void}
     */
    updateGameOverSequence(now) {
        if (!this.gameOver) return;
        const elapsed = now - this.goT0;

        if (!this.goSplashShown && elapsed >= this.SPLASH_DELAY_MS) {
            this.goSplashActive = true;
            this.goSplashShown  = true;
        }
        if (this.goSplashActive && elapsed >= (this.SPLASH_DELAY_MS + this.SPLASH_MS)) {
            this.goSplashActive = false;
        }

        if (!this.goOverlayShown && elapsed >= this.OVERLAY_AT_MS) {
            this.startGameOverOverlay();
            this.goOverlayShown = true;
        }

        if (!this.goButtonShown && elapsed >= this.BUTTON_AT_MS) {
            this.revealTryAgainButton();
            this.goButtonShown = true;
        }
    }

    /**
     * Draws the game over splash image on the canvas (full cover, no tint).
     *
     * @param {CanvasRenderingContext2D} ctx - canvas context
     * @param {HTMLCanvasElement} canvas - canvas element
     * @returns {void}
     */
    drawGameOverSplash(ctx, canvas) {
        if (!this.goSplashActive || !this.goSplashImg) return;

        const { width, height } = canvas;
        const img = this.goSplashImg;

        if (img.complete && (img.naturalWidth || 0) > 0) {
            const iw = img.naturalWidth;
            const ih = img.naturalHeight;

            const scale = Math.max(width / iw, height / ih);
            const drawW = iw * scale;
            const drawH = ih * scale;
            const dx = (width - drawW) / 2;
            const dy = (height - drawH) / 2;

            ctx.save();
            ctx.globalAlpha = 1;
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(img, dx, dy, drawW, drawH);
            ctx.restore();
        }
    }

    /**
     * Starts the game over overlay and the ambient audio loops.
     *
     * @returns {void}
     */
    startGameOverOverlay() {
        if (!this.gameOverScreen) return;

        this.gameOverScreen.show();

        if (this.goLoopsStarted) return;
        this.goLoopsStarted = true;

        try {
            if (this.goCryLoop) {
                this.goCryLoop.loop = true;
                this.goCryLoop.volume = 0.7;
                this.goCryLoop.currentTime = 0;
                this.playAudioSafe(this.goCryLoop);
            }
            if (this.goRainLoop) {
                this.goRainLoop.loop = true;
                this.goRainLoop.volume = 0.5;
                this.goRainLoop.currentTime = 0;
                this.playAudioSafe(this.goRainLoop);
            }
        } catch (e) {}
    }

    /**
     * Reveals the Try Again button on the game over screen.
     *
     * @returns {void}
     */
    revealTryAgainButton() {
        if (!this.gameOverScreen) return;
        this.gameOverScreen.showButton();
    }

    /**
     * Determines the color of the Endboss timer (white or blinking red).
     *
     * @param {number} now - current timestamp from performance.now()
     * @param {number} seconds - remaining seconds
     * @returns {string} CSS color string
     */
    getEndbossTimerColor(now, seconds) {
        if (seconds > 10) return '#ffffff';
        const blinkOn = (Math.floor(now / 250) % 2) === 0;
        return blinkOn ? '#ff3333' : '#ffffff';
    }

    /**
     * Determines the color for the portal countdown:
     * green when relaxed, blinking yellow/red during last 5 seconds.
     *
     * @param {number} now - current timestamp from performance.now()
     * @param {number} seconds - remaining seconds
     * @returns {string} CSS color string
     */
    getPortalTimerColor(now, seconds) {
        if (seconds > 5) return '#7CFC00';

        const blinkOn = (Math.floor(now / 250) % 2) === 0;
        return blinkOn ? '#ffcc33' : '#ff3333';
    }

    /**
     * Draws the Endboss and portal timer in the top center of the canvas.
     * Only one timer is active at a time.
     *
     * @param {CanvasRenderingContext2D} ctx - canvas context
     * @param {HTMLCanvasElement} canvas - canvas element
     * @param {number} now - timestamp from performance.now()
     * @returns {void}
     */
    drawEndbossTimer(ctx, canvas, now) {
        if (!canvas) return;

        let seconds = 0;
        let isBossPhase = false;
        let isPortalPhase = false;

        if (this.portalTimerActive && this.portalTimerSeconds > 0) {
            seconds = Math.max(0, this.portalTimerSeconds);
            isPortalPhase = true;
        } else if (this.endbossTimerActive && this.endbossTimerSeconds > 0) {
            seconds = Math.max(0, this.endbossTimerSeconds);
            isBossPhase = true;
        } else {
            return;
        }

        const cx = canvas.width / 2;
        const cy = 40;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '32px sans-serif';

        const w = 96;
        const h = 48;
        const x = cx - w / 2;
        const y = cy - h / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(x, y, w, h);

        if (isBossPhase) {
            ctx.fillStyle = this.getEndbossTimerColor(now, seconds);
        } else if (isPortalPhase) {
            ctx.fillStyle = this.getPortalTimerColor(now, seconds);
        }

        ctx.fillText(String(seconds), cx, cy);

        ctx.restore();
    }

    /**
     * Draws a blinking, pulsing arrow pointing to the right below the timer
     * while the portal countdown is active.
     *
     * @param {CanvasRenderingContext2D} ctx - canvas context
     * @param {number} now - timestamp from performance.now()
     * @returns {void}
     */
    drawPortalArrow(ctx, now) {
        if (!this.portalTimerActive || this.portalTimerSeconds <= 0) return;
        if (this.gameOver || this.gameWon) return;

        const canvas = this.canvas;
        if (!canvas) return;

        const blinkOn = (Math.floor(now / 200) % 2) === 0;
        if (!blinkOn) return;

        const cx = canvas.width / 2;
        const timerCy = 40;
        const timerH = 48;

        const arrowCy = timerCy + (timerH / 2) + 32;

        const t = now / 220;
        const scale = 1 + 0.2 * Math.sin(t);

        const w = 64 * scale;
        const h = 32 * scale;

        const baseX = cx - w / 2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(baseX,       arrowCy - h / 2);
        ctx.lineTo(baseX + w,   arrowCy);
        ctx.lineTo(baseX,       arrowCy + h / 2);
        ctx.closePath();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 255, 0, 0.9)';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
    }

    /**
     * Main render loop (per frame). Delegates to helper methods for clarity.
     *
     * @returns {void}
     */
    draw() {
        if (this.destroyed) return;

        this.clearCanvas();
        const now = performance.now();
        this.updateGameOverSequence(now);

        if (!this.paused) {
            this.updateFrameCollisions();
        }

        const camX = Math.round(this.camera_x);
        this.drawWorldLayers(camX);
        this.drawHudAndOverlays(now);

        requestAnimationFrame(() => this.draw());
    }

    /**
     * Clears the entire canvas for the next frame.
     *
     * @returns {void}
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Per-frame collision checks (projectiles and player ↔ enemies).
     *
     * @returns {void}
     */
    updateFrameCollisions() {
        this.checkProjectileCollisions();
        this.checkCollisions();
    }

    /**
     * Draws all world layers that move with the camera.
     *
     * @param {number} camX - camera offset on the x-axis
     * @returns {void}
     */
    drawWorldLayers(camX) {
        this.drawBackgroundLayer(camX);
        this.drawForegroundLayer(camX);
    }

    /**
     * Background tiles and parallax layers.
     *
     * @param {number} camX - camera offset on the x-axis
     * @returns {void}
     */
    drawBackgroundLayer(camX) {
        this.ctx.save();
        this.ctx.translate(camX, 0);
        this.addObjectsToMap(this.level.backgroundObjects);
        this.ctx.restore();
    }

    /**
     * Foreground: clouds, hut, story, pickups, player, enemies, projectiles and effects.
     *
     * @param {number} camX - camera offset on the x-axis
     * @returns {void}
     */
    drawForegroundLayer(camX) {
        this.ctx.save();
        this.ctx.translate(camX, 0);

        this.drawCloudsAndHut();
        this.drawPickupsLayer();
        this.drawPlayerAndActors();

        this.ctx.restore();
    }

    /**
     * Draws clouds plus hut gate and story billboard.
     *
     * @returns {void}
     */
    drawCloudsAndHut() {
        this.addObjectsToMap(this.level.clouds);

        if (this.hutGate) this.addToMap(this.hutGate);
        if (this.hutStory && this.hutStory.visible) this.addToMap(this.hutStory);
    }

    /**
     * Draws coins, whiskey and hearts inside the level.
     *
     * @returns {void}
     */
    drawPickupsLayer() {
        if (Array.isArray(this.level.coins)) {
            this.addObjectsToMap(this.level.coins);
        }
        if (Array.isArray(this.level.whiskeys)) {
            this.addObjectsToMap(this.level.whiskeys);
        }
        if (Array.isArray(this.level.hearts)) {
            this.addObjectsToMap(this.level.hearts);
        }
    }

    /**
     * Draws player or gravestone, enemies, bottles, projectiles and effects.
     *
     * @returns {void}
     */
    drawPlayerAndActors() {
        if (this.gameOver) {
            if (this.gravestone) {
                this.addToMap(this.gravestone);
            }
        } else {
            this.addToMap(this.character);
        }

        this.addObjectsToMap(this.level.bottles);
        if (!this.gameOver) this.addObjectsToMap(this.level.enemies);

        this.addObjectsToMap(this.throwableObjects);
        this.addObjectsToMap(this.effects);
    }

    /**
     * Fixed HUD on top of the world: status bars, timers, overlays and splash.
     *
     * @param {number} now - timestamp from performance.now()
     * @returns {void}
     */
    drawHudAndOverlays(now) {
        this.drawHudBarsAndTimers(now);
        this.drawWinnerAndGameOverOverlays();
        this.drawGameOverSplash(this.ctx, this.canvas);
    }

    /**
     * Draws status bars, counters, boss/portal timers and the portal arrow.
     *
     * @param {number} now - timestamp from performance.now()
     * @returns {void}
     */
    drawHudBarsAndTimers(now) {
        this.addToMap(this.statusBar);
        this.addToMap(this.bottleStatusBar);
        this.addToMap(this.coinStatusBar);
        this.addToMap(this.whiskeyCounter);

        if (this.endbossInSight) {
            this.addToMap(this.endbossStatusBar);
        }

        this.drawEndbossTimer(this.ctx, this.canvas, now);
        this.drawPortalArrow(this.ctx, now);
    }

    /**
     * Draws winner and game over overlays above the HUD.
     *
     * @returns {void}
     */
    drawWinnerAndGameOverOverlays() {
        if (this.winnerScreen && this.winnerScreen.visible) {
            this.winnerScreen.drawOverlay(this.ctx, this.canvas);
        }

        if (this.gameOverScreen && this.gameOverScreen.visible) {
            this.gameOverScreen.drawOverlay(this.ctx, this.canvas);
        }
    }

    /**
     * Returns true if Pepe hits the enemy from above (stomp).
     * Uses a generous foot zone and checks that the hit is within
     * the upper half of the enemy.
     *
     * @param {object} enemy - enemy instance
     * @returns {boolean} whether the stomp conditions are met
     */
    didStompEnemy(enemy) {
        if (!enemy) return false;

        const vy = this.character.speedY || 0;
        if (vy > -0.2) return false;

        const ca = this.character.getBounds();
        const eb = (typeof enemy.getBounds === 'function')
            ? enemy.getBounds()
            : {
                left:   enemy.x,
                top:    enemy.y,
                right:  enemy.x + enemy.width,
                bottom: enemy.y + enemy.height
            };

        const charH   = Math.max(1, ca.bottom - ca.top);
        const footH   = Math.max(32, Math.floor(charH * 0.52));
        const marginX = 6;

        const footL   = ca.left + marginX;
        const footR   = ca.right - marginX;
        const footTop = ca.bottom - footH;
        const footBot = ca.bottom;

        const overlapX = footL < eb.right && footR > eb.left;
        const overlapY = footTop < eb.bottom && footBot > eb.top;
        if (!overlapX || !overlapY) return false;

        const enemyMidY    = eb.top + (eb.bottom - eb.top) * 0.5;
        const hitAtTopHalf = footBot <= enemyMidY + 8;

        return hitAtTopHalf;
    }

    /**
     * Adds an array of drawable objects to the map.
     *
     * @param {DrawableObject[]} objects - array of objects to draw
     * @returns {void}
     */
    addObjectsToMap(objects) {
        if (!Array.isArray(objects) || objects.length === 0) return;
        for (let i = 0; i < objects.length; i++) {
            const o = objects[i];
            if (!o) continue;
            this.addToMap(o);
        }
    }

    /**
     * Draws a single object with optional flipped rendering and debug frames.
     *
     * @param {DrawableObject} mo - map object
     * @returns {void}
     */
    addToMap(mo) {
        if (mo.otherDirection) this.flipImage(mo);
        mo.draw(this.ctx);
        if (mo.otherDirection) this.flipImageBack(mo);

        if (this.DEBUG_FRAMES && typeof mo.drawFrame === 'function') {
            const show =
                (mo === this.character) ||
                (mo instanceof Chicken) ||
                (mo instanceof MiniChicken) ||
                (mo instanceof Endboss) ||
                (mo instanceof ThrowableObject) ||
                (mo instanceof Fireball) ||
                (mo instanceof Gravestone) ||
                (mo instanceof HutGate) ||
                (mo instanceof StoryBillboard) ||
                (mo instanceof Coin) ||
                (mo instanceof Bottle) ||
                (mo instanceof WhiskeyPickup) ||
                (mo instanceof HeartPickup);

            if (show) mo.drawFrame(this.ctx);
        }

        if (this.DEBUG_FRAMES && mo === this.character) {
            const ca = this.character.getBounds();
            const charH   = Math.max(1, ca.bottom - ca.top);
            const footH   = Math.max(32, Math.floor(charH * 0.52));
            const marginX = 6;

            const footRect = {
                x: ca.left + marginX,
                y: ca.bottom - footH,
                w: (ca.right - ca.left) - marginX * 2,
                h: footH
            };

            this.ctx.save();
            this.ctx.setLineDash([6, 4]);
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = 'lime';
            this.ctx.strokeRect(footRect.x, footRect.y, footRect.w, footRect.h);
            this.ctx.setLineDash([]);
            this.ctx.restore();
        }
    }

    /**
     * Flips an object's image horizontally.
     *
     * @param {DrawableObject} mo - map object
     * @returns {void}
     */
    flipImage(mo) {
        this.ctx.save();
        this.ctx.translate(mo.width, 0);
        this.ctx.scale(-1, 1);
        mo.x = mo.x * -1;
    }

    /**
     * Restores the flipped image to its original orientation.
     *
     * @param {DrawableObject} mo - map object
     * @returns {void}
     */
    flipImageBack(mo) {
        mo.x = mo.x * -1;
        this.ctx.restore();
    }

    /**
     * Handles generic bottle hit visuals and audio for any enemy.
     *
     * @param {ThrowableObject} bottle - bottle instance
     * @param {object} enemy - enemy instance
     * @returns {void}
     */
    onBottleHitsEnemy(bottle, enemy) {
        if (bottle && typeof bottle.onHit === 'function') {
            try {
                bottle.onHit(enemy);
            } catch (e) {}
        }

        try {
            const splashFrames = [
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/6_bottle_splash.png'
            ];
            const hitX = (bottle && typeof bottle.x === 'number')
                ? bottle.x + (bottle.width  || 0) * 0.5 - 45
                : (enemy?.x || 0) + (enemy?.width  || 0) * 0.5 - 45;
            const hitY = (bottle && typeof bottle.y === 'number')
                ? bottle.y + (bottle.height || 0) * 0.5 - 45
                : (enemy?.y || 0) + (enemy?.height || 0) * 0.5 - 45;
            const effect = new HitEffect(hitX, hitY, splashFrames, 320);
            effect.width = 100;
            effect.height = 100;
            this.effects.push(effect);
        } catch (e) {}

        try {
            if (this.hitAudio) {
                this.hitAudio.currentTime = 0;
                this.playAudioSafe(this.hitAudio);
            }
        } catch (e) {}
    }

    /**
     * Called from ThrowableObject.onGroundHit() to convert a missed projectile
     * back into a pickup bottle at its landing position.
     *
     * @param {ThrowableObject} projectile - projectile that hit the ground
     * @returns {void}
     */
    reuseBottleFromThrow(projectile) {
        if (!projectile || !this.level) return;

        const x = projectile.x;
        const y = projectile.y;

        try {
            this.throwableObjects = (this.throwableObjects || []).filter(p => p !== projectile);
        } catch (e) {}

        try {
            if (!Array.isArray(this.level.bottles)) {
                this.level.bottles = [];
            }

            this.level.bottles.push(new Bottle(x, y));
        } catch (e) {}
    }

    /**
     * Returns the current living Endboss (if any).
     *
     * @returns {Endboss|null} Endboss instance or null
     */
    getCurrentEndboss() {
        const enemies = this.level?.enemies || [];
        const boss = enemies.find(e => e instanceof Endboss && !e.dead);
        return boss || null;
    }

    /**
     * Returns all living mini chickens that were spawned by the Endboss.
     *
     * @returns {MiniChicken[]} active boss-spawned mini chickens
     */
    getActiveMiniChickens() {
        const enemies = this.level?.enemies || [];
        return enemies.filter(
            (e) => e instanceof MiniChicken && !e.dead && e.spawnedByBoss
        );
    }

    /**
     * Starts the mini-chicken swarm routine when the boss fight begins.
     * Only runs once per boss fight.
     *
     * @returns {void}
     */
    startMiniChickenSwarm() {
        if (this.miniSwarmActive || this.bossDefeated) return;

        const boss = this.getCurrentEndboss();
        if (!boss) return;

        if (this.miniSwarmOriginX == null) {
            this.miniSwarmOriginX =
                boss.startX || boss.spawnX || boss.homeX || boss.x;
        }

        this.miniSwarmActive = true;
        this.spawnMiniChickenGroup(boss);

        this.miniSwarmTimerId = setInterval(() => {
            this.tickMiniChickenSwarm();
        }, this.MINI_SWARM_INTERVAL_MS);
    }

    /**
     * Swarm tick: spawns new waves while the boss is alive and the game is running.
     *
     * @returns {void}
     */
    tickMiniChickenSwarm() {
        if (!this.miniSwarmActive || this.bossDefeated) return;
        if (this.paused || this.gameOver || this.gameWon) return;

        const boss = this.getCurrentEndboss();
        if (!boss) {
            this.stopMiniChickenSwarm();
            return;
        }

        const active = this.getActiveMiniChickens();
        if (active.length >= this.MINI_SWARM_MAX_COUNT) return;

        this.spawnMiniChickenGroup(boss);
    }

    /**
     * Spawns a small group of mini chickens near the Endboss.
     * They always spawn in front of the boss (to the left).
     *
     * @param {Endboss} boss - current boss instance
     * @returns {void}
     */
    spawnMiniChickenGroup(boss) {
        if (!boss) return;

        const active = this.getActiveMiniChickens();
        const freeSlots = this.MINI_SWARM_MAX_COUNT - active.length;
        if (freeSlots <= 0) return;

        const groupSize = Math.min(this.MINI_SWARM_GROUP_SIZE, freeSlots);
        const enemies = this.level?.enemies || [];

        const originX =
            this.miniSwarmOriginX ||
            boss.startX ||
            boss.spawnX ||
            boss.homeX ||
            boss.x;

        const baseX = originX - 100;

        for (let i = 0; i < groupSize; i++) {
            const offset = i * 70;
            const spawnX = baseX - offset;
            enemies.push(new MiniChicken(spawnX, true));
        }

        this.level.enemies = enemies;
    }

    /**
     * Stops the mini-chicken swarm timer and deactivates the swarm flag.
     *
     * @returns {void}
     */
    stopMiniChickenSwarm() {
        if (this.miniSwarmTimerId) {
            clearInterval(this.miniSwarmTimerId);
            this.miniSwarmTimerId = null;
        }
        this.miniSwarmActive = false;
    }

    /**
     * Clears all boss-spawned mini chickens from the level.
     *
     * @returns {void}
     */
    clearBossSpawnedMiniChickens() {
        const enemies = this.level?.enemies || [];
        this.level.enemies = enemies.filter(
            (e) => !(e instanceof MiniChicken && e.spawnedByBoss)
        );
    }

    /**
     * Starts the Endboss countdown when the fight begins.
     *
     * @returns {void}
     */
    startEndbossTimer() {
        if (this.endbossTimerActive) return;
        const boss = this.getCurrentEndboss();
        if (!boss) return;

        this.endbossTimerActive = true;
        this.endbossTimerSeconds = this.ENDBOSS_TIMEOUT_SECONDS;

        this.endbossTimerId = setInterval(() => {
            this.tickEndbossTimer();
        }, 1000);
    }

    /**
     * Processes a single tick of the Endboss timer.
     *
     * @returns {void}
     */
    tickEndbossTimer() {
        if (!this.endbossTimerActive) return;

        if (this.paused) return;

        if (this.gameOver || this.gameWon) {
            this.stopEndbossTimer();
            return;
        }

        const boss = this.getCurrentEndboss();
        if (!boss || boss.energy <= 0 || this.character.energy <= 0) {
            this.stopEndbossTimer();
            return;
        }

        this.endbossTimerSeconds -= 1;

        if (this.endbossTimerSeconds <= 0) {
            this.handleEndbossTimeout();
        }
    }

    /**
     * Stops the Endboss timer and clears its interval.
     *
     * @returns {void}
     */
    stopEndbossTimer() {
        if (this.endbossTimerId) {
            clearInterval(this.endbossTimerId);
            this.endbossTimerId = null;
        }

        this.endbossTimerActive = false;
        this.endbossTimerSeconds = 0;
    }

    /**
     * Triggers defeat when the Endboss time limit has expired.
     *
     * @returns {void}
     */
    handleEndbossTimeout() {
        this.stopEndbossTimer();

        if (this.gameOver || this.gameWon) return;

        this.character.energy = 0;
        this.statusBar.setPercentage(this.character.energy);
        this.onPlayerDeath();
    }

    /**
     * Starts the portal countdown once the Endboss is defeated
     * and the gate is open. The player has limited time to enter.
     *
     * @returns {void}
     */
    startPortalTimer() {
        this.stopPortalTimer();

        if (!this.hutGate) return;
        if (this.gameOver || this.gameWon) return;

        this.portalTimerActive  = true;
        this.portalTimerSeconds = this.PORTAL_TIMEOUT_SECONDS;

        this.playPortalTimerStartSound();

        this.portalTimerId = setInterval(() => {
            this.tickPortalTimer();
        }, 1000);
    }

    /**
     * Processes a single tick of the portal countdown.
     *
     * @returns {void}
     */
    tickPortalTimer() {
        if (!this.portalTimerActive) return;

        if (this.paused) return;

        if (this.gameOver || this.gameWon) {
            this.stopPortalTimer();
            return;
        }

        const bossAlive = (this.level?.enemies || [])
            .some(e => e instanceof Endboss && !e.dead);

        if (bossAlive && !this.bossDefeated) {
            this.stopPortalTimer();
            return;
        }

        this.portalTimerSeconds -= 1;

        if (this.portalTimerSeconds <= 0) {
            this.handlePortalTimeout();
        }
    }

    /**
     * Portal timeout missed → Pepe dies like in a normal game over.
     *
     * @returns {void}
     */
    handlePortalTimeout() {
        this.stopPortalTimer();

        if (this.gameOver || this.gameWon) return;

        this.character.energy = 0;
        if (this.statusBar && typeof this.statusBar.setPercentage === 'function') {
            this.statusBar.setPercentage(this.character.energy);
        }
        this.onPlayerDeath();
    }

    /**
     * Story billboard: activate once when the player is near the gate
     * and keep it visible while the boss is still alive.
     *
     * @returns {void}
     */
    checkHutProximityAndStory() {
        if (!this.hutGate || !this.hutStory) return;

        const bossAlive = (this.level?.enemies || []).some(e => e instanceof Endboss && !e.dead);
        if (!bossAlive) {
            this.hutStory.deactivate();
            this.storyLatched = false;
            return;
        }

        if (this.storyLatched) {
            if (!this.hutStory.visible) this.hutStory.activate();
            return;
        }

        const playerX = this.character?.x || 0;
        const gateCenterX = this.hutGate.x + this.hutGate.width / 2;
        const near = Math.abs(playerX - gateCenterX) < 220;

        if (near && !this.hutGate.isOpen) {
            this.hutStory.activate();
            this.storyLatched = true;
        }
    }

    /**
     * Portal entry: only allowed after boss death and with an open gate.
     *
     * @returns {void}
     */
    checkPortalEnter() {
        if (this.gameWon || !this.hutGate) return;
        const bossAlive = (this.level?.enemies || []).some(e => e instanceof Endboss && !e.dead);
        if (bossAlive) return;
        if (!this.hutGate.isOpen) return;

        if (this.hutGate.isCharacterInPortal(this.character)) {
            this.stopPortalTimer();
            this.showWinnerScreen();
        }
    }

    /**
     * Shows the winner screen, wires restart/back-to-start callbacks
     * and pauses background music.
     *
     * @returns {void}
     */
    showWinnerScreen() {
        this.gameWon = true;
        this.stopPortalTimer();

        try {
            this.stopAmbienceLoop();
        } catch (e) {}

        if (this.winnerScreen) {
            this.winnerScreen.show();

            if (typeof this.winnerScreen.onRestartNow === 'function') {
                this.winnerScreen.onRestartNow(() => {
                    if (window.restartNow) {
                        window.restartNow();
                    }
                });
            }

            if (typeof this.winnerScreen.onBackToStart === 'function') {
                this.winnerScreen.onBackToStart(() => {
                    if (window.backToStart) {
                        window.backToStart();
                    }
                });
            }
        }

        try {
            this.pauseBgMusic();
        } catch (e) {}
    }

    /**
     * Handles Endboss death: ensures death animation, stops boss systems,
     * opens the gate and starts the portal timer.
     *
     * @param {Endboss} endboss - boss instance that died
     * @returns {void}
     */
    onEndbossDeath(endboss) {
        if (this.bossDefeated) return;
        this.bossDefeated = true;

        this.endbossInSight = false;

        if (endboss) {
            endboss.isInSight   = false;
            endboss.inAggroMode = false;
            endboss.returning   = false;
            endboss.aiState     = 'IDLE';

            if (typeof endboss.die === 'function' &&
                !endboss.dead &&
                !endboss.isDying) {
                endboss.die();
            }
        }

        this.stopEndbossTimer();
        this.stopMiniChickenSwarm();
        this.clearBossSpawnedMiniChickens();

        try {
            this.stopAmbienceLoop();
        } catch (e) {}

        try {
            if (this.bossDeathAudio) {
                this.bossDeathAudio.currentTime = 0;
                this.playAudioSafe(this.bossDeathAudio);
            }
        } catch (e) {}

        try {
            this.hutGate?.open();
        } catch (e) {}

        try {
            this.hutStory?.deactivate();
        } catch (e) {}

        this.storyLatched = false;

        try {
            this.resumeBgMusic();
        } catch (e) {}

        this.startPortalTimer();
    }

    /**
     * Sets the paused state of the world.
     * Freezes and unfreezes all moving objects and handles audio pausing.
     *
     * @param {boolean} flag - true to pause, false to resume
     * @returns {void}
     */
    setPaused(flag) {
        if (flag === this.paused) return;
        this.paused = !!flag;

        try {
            if (this.hutStory && typeof this.hutStory.setWorldPaused === 'function') {
                this.hutStory.setWorldPaused(this.paused);
            }
        } catch (e) {}

        if (this.paused) {
            this.freezeWorld();
            try {
                this.getAllAudiosDeep().forEach(a => {
                    try {
                        a.pause();
                    } catch (e) {}
                });
            } catch (e) {}

        } else {
            this.unfreezeWorld();
            try {
                if (!this.endbossInSight &&
                    !this.gameOver &&
                    !this.gameWon &&
                    this.bgMusic &&
                    !this.bgMusic.muted) {
                    this.playAudioSafe(this.bgMusic);
                }
            } catch (e) {}

            try {
                if (this.portalTimerActive &&
                    this.portalTimerSeconds > 0 &&
                    this.portalTimerAudio &&
                    this.portalTimerAudio.paused &&
                    !this.portalTimerAudio.muted) {
                    this.playAudioSafe(this.portalTimerAudio);
                }
            } catch (e) {}
        }
    }

    /**
     * Freezes moving world objects by patching movement methods
     * and storing previous speeds.
     *
     * @returns {void}
     */
    freezeWorld() {
        const patchOne = (o) => {
            if (!o || o.__frozen) return;
            o.__frozen = true;

            if (typeof o.speed === 'number') {
                o.__prevSpeed = o.speed;
                o.speed = 0;
            }
            if (typeof o.baseSpeed === 'number') {
                o.__prevBaseSpeed = o.baseSpeed;
                o.baseSpeed = 0;
            }

            ['moveLeft', 'moveRight', 'updateAI', 'animate'].forEach(fn => {
                if (typeof o[fn] === 'function' && !o[`__orig_${fn}`]) {
                    o[`__orig_${fn}`] = o[fn];
                    o[fn] = function() {};
                }
            });
        };

        (this.level?.enemies || []).forEach(patchOne);
        (this.level?.clouds  || []).forEach(patchOne);
        (this.level?.backgroundObjects || []).forEach(patchOne);
        (this.throwableObjects || []).forEach(patchOne);
        (this.effects || []).forEach(patchOne);

        patchOne(this.character);
    }

    /**
     * Restores original methods and speeds for all frozen world objects.
     *
     * @returns {void}
     */
    unfreezeWorld() {
        const unpatchOne = (o) => {
            if (!o || !o.__frozen) return;
            o.__frozen = false;

            if ('__prevSpeed' in o) {
                o.speed = o.__prevSpeed;
                delete o.__prevSpeed;
            }
            if ('__prevBaseSpeed' in o) {
                o.baseSpeed = o.__prevBaseSpeed;
                delete o.__prevBaseSpeed;
            }

            ['moveLeft', 'moveRight', 'updateAI', 'animate'].forEach(fn => {
                const key = `__orig_${fn}`;
                if (typeof o[key] === 'function') {
                    o[fn] = o[key];
                    delete o[key];
                }
            });
        };

        (this.level?.enemies || []).forEach(unpatchOne);
        (this.level?.clouds  || []).forEach(unpatchOne);
        (this.level?.backgroundObjects || []).forEach(unpatchOne);
        (this.throwableObjects || []).forEach(unpatchOne);
        (this.effects || []).forEach(unpatchOne);
        unpatchOne(this.character);
    }
}
