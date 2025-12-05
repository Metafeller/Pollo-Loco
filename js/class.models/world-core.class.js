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
     * Timer, GameOver and winner-screen logic
     * is implemented via world-timers.class.js and world-endgame.class.js
     * (prototype mixins on World.prototype).
     */

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
