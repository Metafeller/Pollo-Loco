class World {
    character = new Character();
    level = level1;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    destroyed = false; // wird bei Restart/BackToStart auf true gesetzt

    paused = false;   // Spiel Audio pausiert?

    // Kurzer Schutzzeitraum nach Spielstart, damit Pepe nicht direkt überrannt wird
    START_GRACE_MS = 3000; // Dauer in Millisekunden (3 Sekunden)
    gameStartedAt = 0;     // Zeitstempel des Spielstarts

    // ADD: Debug toggle
    DEBUG_FRAMES = false; // zum Testen true setzen, später false

    statusBar = new StatusBar();
    bottleStatusBar = new BottleStatusBar();
    endbossStatusBar = new EndbossStatusBar();
    endbossInSight = false;
    bossDefeated = false;   // <--- NEU: Endboss wurde endgültig besiegt

    // We're in the Endgame Now! Timer-Mechanik
    endbossTimerId = null;
    endbossTimerActive = false;
    endbossTimerSeconds = 0;
    ENDBOSS_TIMEOUT_SECONDS = 30;

    // Portal-Countdown nach Boss-Tod (Zeitfenster zum Tor)
    portalTimerId = null;
    portalTimerActive = false;
    portalTimerSeconds = 0;
    PORTAL_TIMEOUT_SECONDS = 11;

    // ADD: Background music (low volume ambience)
    bgMusic = new Audio('/audio/pixel-adventure.mp3'); // lege diese Datei ins /audio

    // === Mini-chicken swarm (Endboss fight) ===
    MINI_SWARM_INTERVAL_MS = 3000;   // every 7 seconds
    MINI_SWARM_GROUP_SIZE  = 5;      // how many per wave
    MINI_SWARM_MAX_COUNT   = 8;      // max boss-spawned minis alive

    miniSwarmTimerId = null;
    miniSwarmActive  = false;

    // NEU: fester Spawnpunkt für Boss-Minis
    miniSwarmOriginX = null;

    // === Coins & Superpower ===
    coinStatusBar = new CoinStatusBar();
    // coinHUD = new CoinHUD();
    coinsCollected = 0;
    totalCoins = 0;
    coinAudio = new Audio('/audio/game-bonus-coins.mp3');
    heartPickupAudio = new Audio('/audio/level-up-03.mp3');

    whiskeyCounter = new WhiskeyCounter();
    whiskeyCount = 0; // Anzahl gesammelter Whiskey-Flaschen

    // Wurf-/Pickup-Sounds
    supernovaAudio = new Audio('/audio/supernova.mp3');           // F-Feuerball
    bottlePickupAudio = new Audio('/audio/bottle.mp3');           // normale Flasche eingesammelt
    whiskeyPickupAudio = new Audio('/audio/man-says-amazing.mp3');// Whiskey eingesammelt

    // === Game Over / Audio / Overlays ===
    gameOver = false;
    gravestone = null;

    // === Game-Over-Splash (EIN Bild, kein Filter) ===
    goSplashImg = null;           // das tatsächliche Image-Objekt
    goSplashActive = false;       // wird aktuell gezeigt?
    goSplashPath = '/img/9_intro_outro_screens/game_over/1_game-over.png'; // nur dieses eine

    // === Game-Over-Overlay-Objekt ===
    gameOverScreen = null;

    // === Sequencer-Timings (frame-gesteuert, keine setTimeouts) ===
    goT0 = 0;              // performance.now() bei Tod
    SPLASH_DELAY_MS = 3000; // Splash startet nach 3s
    SPLASH_MS = 3000;       // 0–4s: Splash sichtbar
    OVERLAY_AT_MS = 7000;   // ab 6s Overlay + Loops
    BUTTON_AT_MS  = 12000;  // ab 10s Try-Again-Button

    goOverlayShown = false; // Overlay schon aktiviert?
    goButtonShown = false;  // Button schon aktiviert?
    goLoopsStarted = false; // Audio-Loops schon gestartet?
    goSplashShown   = false;     // NEU: Splash bereits gestartet?

    // One-Shots
    painAudio = new Audio('/audio/genervt.mp3');
    _painLock = false; // Anti-Spam
    // Sterbe-Sound (einmaliger One-Shot beim Spieler-Tod)
    playerDeathAudio = new Audio('/audio/man-screaming.mp3');

    // Death-Song (One-Shot bei 0s)
    deathSong = new Audio('/audio/spiel-mir-das-lied-vom-tod.mp3'); // ggf. Pfad anpassen

    // GO-Loops (laufen im Overlay)
    goCryLoop = new Audio('/audio/woman-cry-loop.mp3');
    goRainLoop = new Audio('/audio/raindrops.mp3');

    dramaticAudio = new Audio('/audio/dark-battle.mp3');
    bossDeathAudio = new Audio('/audio/cry-dead.mp3');
    hitAudio = new Audio('/audio/punch-3.mp3');

    // Einmal-Sound für Portal-Countdown (11s)
    portalTimerAudio = new Audio('/audio/10sec-countdown.mp3'); // 11s Sound

    throwableObjects = [];
    effects = [];
    bottlesCollected = 0;
    maxBottles = 5;

    // EPL-20: Hütte/Tor/Story/Winner
    hutGate = null;
    hutStory = null;
    winnerScreen = null;
    gameWon = false;

    // Story soll nach erstem Sichtkontakt sichtbar bleiben
    storyLatched = false;

    // ===== Ambience =====
    startAmbienceLoop() {
        try {
            if (this.dramaticAudio) {
                this.dramaticAudio.loop = true;
                this.dramaticAudio.volume = 0.5;
                if (this.dramaticAudio.paused) {
                    this.dramaticAudio.currentTime = 0;
                    this.dramaticAudio.play();
                }
            }
        } catch (e) {}
    }

    stopAmbienceLoop() {
        try {
            if (this.dramaticAudio && !this.dramaticAudio.paused) {
                this.dramaticAudio.pause();
                this.dramaticAudio.currentTime = 0;
            }
        } catch (e) {}
    }

    stopAllGameOverAudio() {
        try {
            if (this.playerDeathAudio) { this.playerDeathAudio.pause(); this.playerDeathAudio.currentTime = 0; }
            if (this.deathSong)        { this.deathSong.pause();        this.deathSong.currentTime = 0; }
        } catch (e) {}

        try {
            if (this.goCryLoop)  { this.goCryLoop.pause();  this.goCryLoop.currentTime = 0; }
            if (this.goRainLoop) { this.goRainLoop.pause(); this.goRainLoop.currentTime = 0; }
        } catch (e) {}
    }


    /**
     * Startet die leise Hintergrundmusik und respektiert den globalen Mute-Status.
     */
    startBgMusic() {
        try {
            if (!this.bgMusic) return;
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.28; // ~28%
            this.bgMusic.muted = !!window.IS_MUTED;
            if (this.bgMusic.paused) {
                this.bgMusic.currentTime = 0;
                this.bgMusic.play();
            }
        } catch (e) {}
    }

        pauseBgMusic() {
        try { if (this.bgMusic && !this.bgMusic.paused) this.bgMusic.pause(); } catch(e) {}
        }

        resumeBgMusic() {
        try {
            if (!this.bgMusic) return;
            if (this.bgMusic.paused && !this.gameOver && !this.gameWon && !this.endbossInSight) {
            this.bgMusic.play();
            }
        } catch(e) {}
    }

    /**
     * Prüft, ob wir uns noch im Start-Schutzfenster befinden.
     * Während dieser Zeit werden Gegner-Kollisionen ignoriert,
     * damit Pepe nicht direkt beim Spielstart überrannt wird.
     */
    isInStartGrace() {
        if (this.gameOver || this.gameWon) return false;
        if (!this.gameStartedAt || this.START_GRACE_MS <= 0) return false;

        const now = performance.now();
        return (now - this.gameStartedAt) < this.START_GRACE_MS;
    }

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.enemyDeathAudio = new Audio('/audio/chicken-wing.mp3');

        // Zeitpunkt des Spielstarts merken (für Start-Schutzfenster)
        this.gameStartedAt = performance.now();

        // Level-Objekte referenzieren
        this.hutGate = this.level.hutGate || null;
        this.hutStory = this.level.storyBillboard || null;
        if (this.hutStory && !this.hutStory.anchorGate && this.hutGate) {
            this.hutStory.anchorGate = this.hutGate;
        }

        // Totale Coins aus Level bestimmen
        this.totalCoins = Array.isArray(this.level.coins) ? this.level.coins.length : 0;

        // initiale UI-Werte
        this.coinStatusBar.setPercentage(this.totalCoins > 0 ? 0 : 100);
        // this.coinHUD.setCount(0);
        this.whiskeyCounter.setCount(0);

        // EIN Splash-Bild vorladen (robust, kein Zufall)
        this.preloadGoSplash();

        this.winnerScreen = new WinnerScreen();

        // ADD: starte die leise BG-Musik
        this.startBgMusic();

        this.draw();
        this.setWorld();
        this.run();
    }

    /** Preload nur des EINEN Splash-Bildes (keine Races). */
    preloadGoSplash() {
        try {
            const img = new Image();
            img.onload = () => { /* loaded ok */ };
            img.onerror = () => { /* notfalls wird es trotzdem gesetzt – Canvas zeigt Fallback-Text */ };
            img.src = this.goSplashPath;
            this.goSplashImg = img;
        } catch (e) {}
    }

    playEnemyDeathSound() { this.enemyDeathAudio.play(); }

    setWorld() { this.character.world = this; }

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
            try { this.bottlePickupAudio.currentTime = 0; this.bottlePickupAudio.play(); } catch(e) {}
        }
    }

    throwBottle() {
        if (this.bottlesCollected > 0) {
            let bottle = new ThrowableObject(this.character.x + 100, this.character.y + 100);
            this.throwableObjects.push(bottle);
            this.bottlesCollected--;
            const pct = (this.bottlesCollected / this.maxBottles) * 100;
            this.bottleStatusBar.setPercentage(pct);
        }
    }

    // === OPTIONAL: world.class.js -> checkEndbossSight() entschärfen ===
    checkEndbossSight() {
        const endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (!endboss) return;
        this.endbossInSight = (endboss.aiState === 'CHASE');
    }


    /**
     * Main world tick (200 ms): updates pickups, boss phase and portal logic.
     */
    run() {
        setInterval(() => {
            if (this.shouldSkipWorldTick()) return;
            this.handleWorldTick();
        }, 200);
    }

    /**
     * Returns true if the world tick should be skipped (pause or end state).
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
     */
    updatePickupsAndThrows() {
        this.checkThrowObjects();
        this.checkBottleCollection();
        this.checkCoinCollection();
        this.checkWhiskeyCollection();
        this.checkHeartCollection();
    }

    /**
     * Handles AI and state for the Endboss and mini-chicken swarm.
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
     */
    updateHutAndPortal() {
        if (this.hutGate) this.hutGate.update();
        if (this.hutStory) this.hutStory.update();

        this.checkHutProximityAndStory();
        this.checkPortalEnter();
    }

    /**
     * Removes finished visual effects from the effects list.
     */
    cleanupEffectsList() {
        if (!Array.isArray(this.effects)) {
            this.effects = [];
            return;
        }
        this.effects = this.effects.filter(e => !e.done);
    }


    checkThrowObjects() {
        // Normale Flasche (D)
        if (this.keyboard.D && this.bottlesCollected > 0) {
            const facingRight = true; // optional: this.character.otherDirection ? false : true;

            // let bottle = new ThrowableObject(this.character.x + 100, this.character.y + 80, facingRight);

            // NEU: World-Referenz mitgeben
            let bottle = new ThrowableObject(
                this.character.x + 100,
                this.character.y + 80,
                facingRight,
                this          // <--- World-Instanz
            );

            this.throwableObjects.push(bottle);
            this.bottlesCollected--;

            const pct = (this.bottlesCollected / this.maxBottles) * 100;
            this.bottleStatusBar.setPercentage(pct);
        }

        // Supernova (F) – nur wenn Whiskey vorhanden
        if (this.keyboard.F && this.whiskeyCount > 0) {
            const facingRight = true;
            let fire = new Fireball(this.character.x + 110, this.character.y + 70, facingRight);
            this.throwableObjects.push(fire);
            this.whiskeyCount--;
            this.whiskeyCounter.setCount(this.whiskeyCount);
            try { this.supernovaAudio.currentTime = 0; this.supernovaAudio.play(); } catch (e) {}
        }

        // Aufräumen: fertig geflogene Projektile entfernen
        this.throwableObjects = this.throwableObjects.filter(p => !p.done);
    }


    /**
     * Checks all projectile ↔ enemy collisions in the current frame.
     */
    checkProjectileCollisions() {
        // Zu Beginn: Projektile ignorieren, solange Start-Schutz aktiv ist
        // if (this.isInStartGrace()) return;

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
     */
    canCheckProjectileCollisions() {
        if (!Array.isArray(this.throwableObjects)) return false;
        if (!this.level) return false;
        if (!Array.isArray(this.level.enemies)) return false;
        return true;
    }

    /**
     * Dispatches projectile hits to fireball or bottle handlers.
     */
    handleProjectileHitsEnemy(proj, enemy, idx) {
        if (proj instanceof Fireball) {
            this.handleFireballHitEnemy(proj, enemy);
            return;
        }
        this.handleBottleHitEnemy(proj, enemy, idx);
    }

    /**
     * Fireball logic: ignores small ground enemies, hits boss / flying enemies.
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

        // Fireball is consumed after a valid hit (boss / flying enemy)
        proj.done = true;
    }

    /**
     * Applies fireball damage with the original fallback behaviour.
     */
    applyFireballDamage(enemy, dmg) {
        try {
            if (enemy.hit.length >= 1) enemy.hit(dmg);
            else {
                enemy.hit(); // classic 20%
                if (typeof enemy.energy === 'number') {
                    enemy.energy = Math.max(0, enemy.energy - 20); // top up to 40% total
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

        // Bottle disappears on first collision (unchanged behaviour)
        this.throwableObjects.splice(idx, 1);
    }

    /**
     * Bottle hit on small enemies: kill + delayed removal with sound.
     */
    handleBottleHitChicken(enemy) {
        if (typeof enemy.die === 'function') enemy.die();
        setTimeout(() => {
            try { this.playEnemyDeathSound(); } catch (e) {}
            this.level.enemies = this.level.enemies.filter(e => e !== enemy);
        }, 320);
    }

    /**
     * Bottle hit on Endboss: aggro + damage + death check.
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
     * Applies bottle damage to the Endboss with original fallback.
     */
    applyBottleDamageToEndboss(enemy, dmg) {
        try {
            if (enemy.hit.length >= 1) enemy.hit(dmg);
            else enemy.hit();
        } catch (e) {
            if (typeof enemy.energy === 'number') {
                enemy.energy = Math.max(0, enemy.energy - dmg);
            }
        }
    }

    /**
     * Removes finished projectiles after processing collisions.
     */
    cleanupProjectiles() {
        this.throwableObjects = this.throwableObjects.filter(p => !p.done);
    }


    checkCollisions() {
        // Während des Start-Schutzfensters keine Gegner-Kollisionen auswerten
        if (this.isInStartGrace()) return;

        this.level.enemies.forEach((enemy) => {
            if (!enemy || enemy.dead === true) return;

            const bodyHit  = this.character.isColliding(enemy);
            const stompHit = this.didStompEnemy(enemy); // präziser Fuß-Sensor

            if (stompHit) {
                // === Stomp von oben ===
                if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
                    enemy.die();
                    this.playEnemyDeathSound();
                    setTimeout(() => {
                        const victim = enemy;
                        this.level.enemies = this.level.enemies.filter(e => e !== victim);
                    }, 500);

                    // Bounce nach oben + kurze Unverwundbarkeit
                    this.character.speedY = 15; // vorher 15
                    this.character.makeInvulnerable();

                } else if (enemy instanceof Endboss) {
                    // Boss nur "abstoßen"
                    this.character.speedY = 18; // vorher 18
                    this.character.makeInvulnerable();
                }

            } else if (bodyHit && !this.character.invulnerable) {

                // Seitliche/untere Kollision → Schaden
                this.character.hit(20);
                this.playPainOnce();

                // Kurze Unverwundbarkeit (globaler Cooldown)
                this.character.makeInvulnerable();

                // Kleines Abstoßen, damit Pepe nicht „klebt“
                this.character.speedY = Math.max(this.character.speedY, 8);
            }

        });
    }

    checkCoinCollection() {
        if (!this.level || !Array.isArray(this.level.coins)) return;

        const remaining = [];
        let pickedAny = false;

        for (const coin of this.level.coins) {
            if (this.character.isColliding(coin)) {
                pickedAny = true;
                this.coinsCollected++;
                // Coin NICHT in remaining pushen => verschwindet
            } else {
                remaining.push(coin);
            }
        }

        // UI & Sound NACH dem Loop, ohne CoinHUD
        if (pickedAny) {
            try { this.coinAudio.currentTime = 0; this.coinAudio.play(); } catch(e) {}
            const pct = this.totalCoins > 0 ? (this.coinsCollected / this.totalCoins) * 100 : 100;
            this.coinStatusBar.setPercentage(pct);
        }

        // Coins-Liste IMMER aktualisieren (wichtig!)
        this.level.coins = remaining;
    }

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
            try { this.whiskeyPickupAudio.currentTime = 0; this.whiskeyPickupAudio.play(); } catch(e) {}
        }
        this.level.whiskeys = remaining;
    }

    checkHeartCollection() {
        if (!this.level || !Array.isArray(this.level.hearts)) return;

        const remaining = [];
        let picked = 0;
        const HEAL_PER_HEART = 40; // % pro Herz (für 2x20% → 20 setzen)

        for (const h of this.level.hearts) {
            if (this.character.isColliding(h)) picked++;
            else remaining.push(h);
        }

        if (picked > 0) {
            const heal = HEAL_PER_HEART * picked;
            this.character.energy = Math.min(100, (this.character.energy || 0) + heal);
            this.statusBar.setPercentage(this.character.energy);
            try { this.heartPickupAudio.currentTime = 0; this.heartPickupAudio.play(); } catch (e) {}
        }

        this.level.hearts = remaining;
    }

    /** Schmerz-Sound einmalig (Anti-Spam). */
    playPainOnce() {
        if (this._painLock) return;
        this._painLock = true;
        try {
            if (this.painAudio) {
                this.painAudio.currentTime = 0;
                this.painAudio.play();
            }
        } catch (e) {}
        setTimeout(() => this._painLock = false, 300);
    }


    /** Einmaliger Sound beim Start des Portal-Countdowns. */
    playPortalTimerStartSound() {
        try {
            if (!this.portalTimerAudio) return;
            this.portalTimerAudio.pause();
            this.portalTimerAudio.currentTime = 0;
            this.portalTimerAudio.volume = 0.9;
            this.portalTimerAudio.muted = !!window.IS_MUTED; // respektiert globalen Mute, falls gesetzt
            this.portalTimerAudio.play();
        } catch (e) {}
    }


    /** Stoppt den Portal-Countdown-Sound hart (sofort aus, auf Anfang). */
    stopPortalTimerSound() {
        try {
            if (!this.portalTimerAudio) return;
            this.portalTimerAudio.pause();
            this.portalTimerAudio.currentTime = 0;
        } catch (e) {}
    }


    /**
     * Stoppt den Portal-Timer und räumt das Interval auf.
     */
    stopPortalTimer() {
        if (this.portalTimerId) {
            clearInterval(this.portalTimerId);
            this.portalTimerId = null;
        }

        this.portalTimerActive = false;
        this.portalTimerSeconds = 0;

        // NEU: zugehörigen Countdown-Sound garantiert stoppen
        this.stopPortalTimerSound();
    }


    /** 
     * Final player death: stop logic, spawn gravestone and start GO sequence.
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
     * Stops all boss / portal related timers and mini-chicken swarm.
     */
    stopBossAndPortalSystems() {
        this.stopEndbossTimer();
        this.stopPortalTimer();
        this.stopMiniChickenSwarm();
    }

    /**
     * Stops walking sounds and ambience loop safely.
     */
    stopStepAndAmbienceSounds() {
        try {
            this.character.walking_sound.pause();
            this.character.walking_sound.currentTime = 0;
            this.character.walking_sound_back.pause();
            this.character.walking_sound_back.currentTime = 0;
        } catch (e) {}

        try { this.stopAmbienceLoop(); } catch (e) {}
    }

    /**
     * Freezes all enemies and the player character.
     */
    freezeEnemiesAndCharacter() {
        this.freezeAllEnemies();
        this.freezeCharacter();
    }

    /**
     * Sets all enemies to a frozen state (no movement, no AI).
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
     */
    freezeCharacter() {
        try {
            this.character.dead = true;
            this.character.speed = 0;
            this.character.speedY = 0;
        } catch (e) {}
    }

    /**
     * Places the gravestone at the player's feet.
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
     * Stops pain sound and plays death scream + death song.
     */
    playDeathAudioSequence() {
        // stop pain so the death-sound does not overlap
        try {
            if (this.painAudio) {
                this.painAudio.pause();
                this.painAudio.currentTime = 0;
            }
        } catch (e) {}

        // one-shot death scream
        try {
            if (this.playerDeathAudio) {
                this.playerDeathAudio.pause();
                this.playerDeathAudio.currentTime = 0;
                this.playerDeathAudio.volume = 0.85;
                this.playerDeathAudio.play();
            }
        } catch (e) {}

        // 0s: Death song
        try {
            if (this.deathSong) {
                this.deathSong.pause();
                this.deathSong.currentTime = 0;
                this.deathSong.volume = 0.75;
                this.deathSong.play();
            }
        } catch (e) {}
    }

    /**
     * Builds the GameOver screen and wires the TryAgain-callback.
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
     */
    initGameOverSequencer() {
        this.goT0 = performance.now();
        this.goOverlayShown = false;
        this.goButtonShown = false;
        this.goLoopsStarted = false;
        this.goSplashShown  = false;
        this.goSplashActive = false;

        // decode splash in advance for clean rendering
        try {
            if (this.goSplashImg && typeof this.goSplashImg.decode === 'function') {
                this.goSplashImg.decode().catch(() => {});
            }
        } catch (e) {}

        try { this.pauseBgMusic(); } catch (e) {}
    }


    /** Sequencer pro Frame – keine Timer-Races. */
    updateGameOverSequence(now) {
    if (!this.gameOver) return;
        const elapsed = now - this.goT0;

        // Splash verzögert starten (erst ab 3s) und nach insgesamt 3s wieder beenden
        if (!this.goSplashShown && elapsed >= this.SPLASH_DELAY_MS) {
            this.goSplashActive = true;   // jetzt erst zeigen
            this.goSplashShown  = true;
        }
        if (this.goSplashActive && elapsed >= (this.SPLASH_DELAY_MS + this.SPLASH_MS)) {
            this.goSplashActive = false;  // Splash aus nach Dauer
        }

        // Overlay nach dem Splash-Fenster
        if (!this.goOverlayShown && elapsed >= this.OVERLAY_AT_MS) {
            this.startGameOverOverlay();
            this.goOverlayShown = true;
        }

        // Button noch später
        if (!this.goButtonShown && elapsed >= this.BUTTON_AT_MS) {
            this.revealTryAgainButton();
            this.goButtonShown = true;
        }
    }

    /** Splash zeichnen – OHNE irgendeinen Filter. */
    drawGameOverSplash(ctx, canvas) {
        if (!this.goSplashActive || !this.goSplashImg) return;

        const { width, height } = canvas;
        const img = this.goSplashImg;

        // draw ONLY the splash image, full-canvas, no tint, no text, no overlay
        if (img.complete && (img.naturalWidth || 0) > 0) {
            const iw = img.naturalWidth;
            const ih = img.naturalHeight;

            // cover-fit to fill the entire canvas
            const scale = Math.max(width / iw, height / ih);
            const drawW = iw * scale;
            const drawH = ih * scale;
            const dx = (width - drawW) / 2;
            const dy = (height - drawH) / 2;

            ctx.save();
            ctx.globalAlpha = 1;                // ensure no inherited transparency
            ctx.imageSmoothingEnabled = true;   // crisp scaling
            ctx.drawImage(img, dx, dy, drawW, drawH);
            ctx.restore();
        }
        // if the image isn't ready yet, draw nothing (no fallback tint/text)
    }

    startGameOverOverlay() {
        if (!this.gameOverScreen) return;

        // Sichtbar machen
        this.gameOverScreen.show();

        // Loops einmalig starten
        if (this.goLoopsStarted) return;
        this.goLoopsStarted = true;

        try {
            if (this.goCryLoop) {
                this.goCryLoop.loop = true;
                this.goCryLoop.volume = 0.7;
                this.goCryLoop.currentTime = 0;
                this.goCryLoop.play();
            }
            if (this.goRainLoop) {
                this.goRainLoop.loop = true;
                this.goRainLoop.volume = 0.5;
                this.goRainLoop.currentTime = 0;
                this.goRainLoop.play();
            }
        } catch (e) {}
    }

    revealTryAgainButton() {
        if (!this.gameOverScreen) return;
        this.gameOverScreen.showButton();
    }


    /**
    * Bestimmt die Farbe des Endboss-Timers (weiß oder blinkend rot).
    */
    getEndbossTimerColor(now, seconds) {
        if (seconds > 10) return '#ffffff';
        const blinkOn = (Math.floor(now / 250) % 2) === 0;
        return blinkOn ? '#ff3333' : '#ffffff';
    }


    /**
     * Farbe für den Portal-Countdown:
     * Grün → entspannt, letzte 5s blinkend gelb/rot.
     */
    getPortalTimerColor(now, seconds) {
        if (seconds > 5) return '#7CFC00'; // hellgrün

        const blinkOn = (Math.floor(now / 250) % 2) === 0;
        return blinkOn ? '#ffcc33' : '#ff3333';
    }


    /**
     * Zeichnet den Endboss-Countdown mittig oben im Canvas.
     * Letzte 10 Sekunden blinken rot für mehr Dramatik.
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
     * Zeichnet einen blinkenden, pulsierenden Pfeil nach rechts
     * direkt unter dem Timer im HUD, solange der Portal-Countdown aktiv ist.
     */
    drawPortalArrow(ctx, now) {
        if (!this.portalTimerActive || this.portalTimerSeconds <= 0) return;
        if (this.gameOver || this.gameWon) return;

        const canvas = this.canvas;
        if (!canvas) return;

        // Blink: ein/aus alle ~200ms
        const blinkOn = (Math.floor(now / 200) % 2) === 0;
        if (!blinkOn) return;

        // Timer-Position wie in drawEndbossTimer()
        const cx = canvas.width / 2;
        const timerCy = 40;
        const timerH = 48;

        // Pfeil-Zentrum etwas unterhalb der Timer-Box
        const arrowCy = timerCy + (timerH / 2) + 32;

        // Pulsierende Größe
        const t = now / 220;
        const scale = 1 + 0.2 * Math.sin(t);

        const w = 64 * scale;
        const h = 32 * scale;

        const baseX = cx - w / 2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(baseX,       arrowCy - h / 2); // linker oberer Punkt
        ctx.lineTo(baseX + w,   arrowCy);        // Spitze (rechts)
        ctx.lineTo(baseX,       arrowCy + h / 2); // linker unterer Punkt
        ctx.closePath();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 255, 0, 0.9)';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();
    }


    /**
     * Main render loop (per frame). Keeps old behaviour, but delegates to helpers.
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
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Per-frame collision checks (projectiles + player ↔ enemies).
     */
    updateFrameCollisions() {
        this.checkProjectileCollisions();
        this.checkCollisions();
    }

    /**
     * Draws all world layers that move with the camera.
     */
    drawWorldLayers(camX) {
        this.drawBackgroundLayer(camX);
        this.drawForegroundLayer(camX);
    }

    /**
     * Background tiles (parallax etc.).
     */
    drawBackgroundLayer(camX) {
        this.ctx.save();
        this.ctx.translate(camX, 0);
        this.addObjectsToMap(this.level.backgroundObjects);
        this.ctx.restore();
    }

    /**
     * Foreground: clouds, hut, story, pickups, player, enemies, effects.
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
     * Clouds plus hut gate and story billboard.
     */
    drawCloudsAndHut() {
        this.addObjectsToMap(this.level.clouds);

        if (this.hutGate) this.addToMap(this.hutGate);
        if (this.hutStory && this.hutStory.visible) this.addToMap(this.hutStory);
    }

    /**
     * Coins, whiskey and hearts inside the level.
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
     * Player (or gravestone), enemies, bottles, projectiles and effects.
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
     * Fixed HUD on top of the world: bars, timers, overlays, splash.
     */
    drawHudAndOverlays(now) {
        this.drawHudBarsAndTimers(now);
        this.drawWinnerAndGameOverOverlays();
        this.drawGameOverSplash(this.ctx, this.canvas);
    }

    /**
     * Status bars, counters, boss/portal timers and portal arrow.
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
     * Winner and Game-Over overlays (UI on top of the HUD).
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
     * True, wenn Pepe den Gegner VON OBEN trifft (Stomp).
     * Großzügig: breite Fuß-Zone + Treffer in der oberen Gegnerhälfte.
     */
    didStompEnemy(enemy) {
        if (!enemy) return false;

        // Muss fallen (leichter negativer speedY reicht)
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
        const footH   = Math.max(32, Math.floor(charH * 0.52)); // großzügige Fuß-Zone
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


    addObjectsToMap(objects) {
        if (!Array.isArray(objects) || objects.length === 0) return;
        for (let i = 0; i < objects.length; i++) {
            const o = objects[i];
            if (!o) continue;
            this.addToMap(o);
        }
    }

    addToMap(mo) {
        if (mo.otherDirection) this.flipImage(mo);
        mo.draw(this.ctx);
        if (mo.otherDirection) this.flipImageBack(mo); // ← erst zurückflippen

        if (this.DEBUG_FRAMES && typeof mo.drawFrame === 'function') {
        // Nur Gameplay-Objekte debuggen (keine Backgrounds/Clouds)
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
            const footH   = Math.max(32, Math.floor(charH * 0.52)); // wie in didStompEnemy
            const marginX = 6;

            const footRect = {
                x: ca.left + marginX,
                y: ca.bottom - footH,
                w: (ca.right - ca.left) - marginX * 2,
                h: footH
            };

            this.ctx.save();
            this.ctx.setLineDash([6,4]);
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = 'lime';
            this.ctx.strokeRect(footRect.x, footRect.y, footRect.w, footRect.h);
            this.ctx.setLineDash([]);
            this.ctx.restore();
        }
    }

    flipImage(mo) {
        this.ctx.save();
        this.ctx.translate(mo.width, 0);
        this.ctx.scale(-1, 1);
        mo.x = mo.x * -1;
    }

    flipImageBack(mo) {
        mo.x = mo.x * -1;
        this.ctx.restore();
    }

    onBottleHitsEnemy(bottle, enemy) {
        if (bottle && typeof bottle.onHit === 'function') {
            try { bottle.onHit(enemy); } catch (e) {}
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
            const hitX = (bottle && typeof bottle.x === 'number') ? bottle.x + (bottle.width  || 0) * 0.5 - 45
                                                                  : (enemy?.x || 0) + (enemy?.width  || 0) * 0.5 - 45;
            const hitY = (bottle && typeof bottle.y === 'number') ? bottle.y + (bottle.height || 0) * 0.5 - 45
                                                                  : (enemy?.y || 0) + (enemy?.height || 0) * 0.5 - 45;
            const effect = new HitEffect(hitX, hitY, splashFrames, 320);
            effect.width = 100;
            effect.height = 100;
            this.effects.push(effect);
        } catch (e) {}

        try {
            if (this.hitAudio) {
                this.hitAudio.currentTime = 0;
                this.hitAudio.play();
            }
        } catch (e) {}
    }

    /**
     * Optional-Bonus:
     * Wird von ThrowableObject.onGroundHit() aufgerufen,
     * um verfehlte Flaschen wieder als "Pickup-Bottle" ins Level zu legen.
     */
    reuseBottleFromThrow(projectile) {
        if (!projectile || !this.level) return;

        const x = projectile.x;
        const y = projectile.y;

        try {
            // Wurf-Projektil aus der Liste entfernen
            this.throwableObjects = (this.throwableObjects || []).filter(p => p !== projectile);
        } catch (e) {}

        try {
            // Sicherstellen, dass die Level-Bottle-Liste existiert
            if (!Array.isArray(this.level.bottles)) {
            this.level.bottles = [];
            }

            // Neue "normale" Bottle am Landepunkt platzieren
            this.level.bottles.push(new Bottle(x, y));
        } catch (e) {}
    }


    /**
     * Liefert den aktuellen lebenden Endboss.
     * @returns {object|null} Endboss oder null.
     */
    getCurrentEndboss() {
        const enemies = this.level?.enemies || [];
        const boss = enemies.find(e => e instanceof Endboss && !e.dead);
        return boss || null;
    }


    /**
     * Returns all living mini chickens that were spawned by the Endboss.
     * @returns {MiniChicken[]} active boss-spawned mini chickens
     */
    getActiveMiniChickens() {
        let enemies = this.level?.enemies || [];
        return enemies.filter(
            (e) => e instanceof MiniChicken && !e.dead && e.spawnedByBoss
        );
    }


    /**
     * Starts the mini-chicken swarm routine when the boss fight begins.
     * Only runs once per boss fight.
     */
    startMiniChickenSwarm() {
        // Wenn Boss schon tot → nie wieder Schwarm
        if (this.miniSwarmActive || this.bossDefeated) return;

        const boss = this.getCurrentEndboss();
        if (!boss) return;

        // ⬇️ Nur einmal beim Start des Kampfes festlegen:
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
     */
    tickMiniChickenSwarm() {
        if (!this.miniSwarmActive || this.bossDefeated) return;
        if (this.paused || this.gameOver || this.gameWon) return;

        let boss = this.getCurrentEndboss();
        if (!boss) {
            this.stopMiniChickenSwarm();
            return;
        }

        let active = this.getActiveMiniChickens();
        if (active.length >= this.MINI_SWARM_MAX_COUNT) return;

        this.spawnMiniChickenGroup(boss);
    }


    /**
     * Spawns a small group of mini chickens near the Endboss.
     * They always spawn in front of the boss (to the left).
     */
    spawnMiniChickenGroup(boss) {
        if (!boss) return;

        const active = this.getActiveMiniChickens();
        const freeSlots = this.MINI_SWARM_MAX_COUNT - active.length;
        if (freeSlots <= 0) return;

        const groupSize = Math.min(this.MINI_SWARM_GROUP_SIZE, freeSlots);
        const enemies = this.level?.enemies || [];

        // ⬇️ immer dieselbe Start-Region: „wo der Endboss gestartet ist“
        const originX =
            this.miniSwarmOriginX ||
            boss.startX ||
            boss.spawnX ||
            boss.homeX ||
            boss.x;

        const baseX = originX - 100; // Mini-Chicken Final vorher 120

        for (let i = 0; i < groupSize; i++) {
            const offset = i * 70;
            const spawnX = baseX - offset;
            enemies.push(new MiniChicken(spawnX, true));
        }

        this.level.enemies = enemies;
    }


    /**
     * Stops the mini-chicken swarm timer.
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
     */
    clearBossSpawnedMiniChickens() {
        let enemies = this.level?.enemies || [];
        this.level.enemies = enemies.filter(
            (e) => !(e instanceof MiniChicken && e.spawnedByBoss)
        );
    }



    /**
     * Startet den Endboss-Countdown, wenn der Kampf beginnt.
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
     * Verarbeitet jeden Tick des Endboss-Timers.
     */
    tickEndbossTimer() {
        if (!this.endbossTimerActive) return;

        // NEU: während der Pause läuft der Timer nicht weiter
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
     * Stoppt den Endboss-Timer und räumt das Interval auf.
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
     * Löst die Niederlage aus, wenn die Boss-Zeit abgelaufen ist.
     */
    handleEndbossTimeout() {
        this.stopEndbossTimer();

        if (this.gameOver || this.gameWon) return;

        this.character.energy = 0;
        this.statusBar.setPercentage(this.character.energy);
        this.onPlayerDeath();
    }


    // ===== Portal-Timeout (nach Boss-Tod, Tor ist offen) =====

    /**
     * Startet den Portal-Countdown, sobald der Endboss besiegt
     * und das Tor geöffnet wurde. Spieler hat nur begrenzt Zeit,
     * durch das Portal zu laufen.
     */
    startPortalTimer() {
        // Immer mit sauberem Zustand starten (alter Timer + Sound weg)
        this.stopPortalTimer();

        if (!this.hutGate) return;
        if (this.gameOver || this.gameWon) return;

        this.portalTimerActive  = true;
        this.portalTimerSeconds = this.PORTAL_TIMEOUT_SECONDS;

        // Einmaliger Alarm bei Start des Timers
        this.playPortalTimerStartSound();

        this.portalTimerId = setInterval(() => {
            this.tickPortalTimer();
        }, 1000);
    }


    /**
     * Tick-Logik für den Portal-Countdown.
     */
    tickPortalTimer() {
        if (!this.portalTimerActive) return;

        // NEU: während der Pause läuft der Portal-Countdown nicht weiter
        if (this.paused) return;

        if (this.gameOver || this.gameWon) {
            this.stopPortalTimer();
            return;
        }

        // Falls aus irgendeinem Grund ein Portal-Timer läuft,
        // während der Boss NOCH lebt UND wir ihn nicht als besiegt markiert haben,
        // brechen wir den Timer ab.
        // Nach einem regulären Boss-Tod (bossDefeated === true)
        // darf dieser Block NICHT mehr feuern.
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
     * Timeout verpasst → Pepe stirbt wie bei einem normalen Game-Over.
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


    /** Story: einmalig aktivieren, danach bis Boss-Tod sichtbar lassen */
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

    /** Portal: nur nach Boss-Tod & offenem Tor */
    checkPortalEnter() {
        if (this.gameWon || !this.hutGate) return;
        const bossAlive = (this.level?.enemies || []).some(e => e instanceof Endboss && !e.dead);
        if (bossAlive) return;
        if (!this.hutGate.isOpen) return;

        if (this.hutGate.isCharacterInPortal(this.character)) {
            this.stopPortalTimer();   // ← NEU: Countdown stoppen
            this.showWinnerScreen();
        }
    }

   showWinnerScreen() {
    this.gameWon = true;
    this.stopPortalTimer(); // Safety, falls er genau im letzten Tick durchläuft

    try { this.stopAmbienceLoop(); } catch(e) {}
    if (this.winnerScreen) {
        this.winnerScreen.show(); // spielt One-Shot + Audio, zeigt Buttons erst danach
        // Buttons (nach One-Shot):

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
    try { this.pauseBgMusic(); } catch(e) {}
    }


    onEndbossDeath(endboss) {
        // Nur einmal ausführen, falls mehrfach getroffen o.Ä.
        if (this.bossDefeated) return;
        this.bossDefeated = true;

        this.endbossInSight = false;

        if (endboss) {
            endboss.isInSight   = false;
            endboss.inAggroMode = false;
            endboss.returning   = false;
            endboss.aiState     = 'IDLE';   // kein CHASE mehr

            // 🔒 Safety: Falls hit() die Death-Animation NICHT gestartet hat,
            // erzwingen wir sie hier ein einziges Mal.
            if (typeof endboss.die === 'function' &&
                !endboss.dead &&
                !endboss.isDying) {
                endboss.die();
            }
        }

        this.stopEndbossTimer();
        this.stopMiniChickenSwarm();
        this.clearBossSpawnedMiniChickens(); // alle Boss-Minis raus

        try { this.stopAmbienceLoop(); } catch (e) {}
        try {
            if (this.bossDeathAudio) {
                this.bossDeathAudio.currentTime = 0;
                this.bossDeathAudio.play();
            }
        } catch (e) {}

        try { this.hutGate?.open(); } catch (e) {}
        try { this.hutStory?.deactivate(); } catch (e) {}
        this.storyLatched = false;

        // Boss tot → dramatisch aus, ruhige BG wieder sanft an (bis zum Portal/Win)
        try { this.resumeBgMusic(); } catch(e) {}

        // Boss tot → Portal-Countdown starten (Spieler kann nicht endlos trödeln)
        this.startPortalTimer();
    }


    getAllAudios() {
    // alle bekannten Audio-Objekte sammeln (nur wenn vorhanden)
    const a = [
        this.bgMusic, 
        this.coinAudio, 
        this.heartPickupAudio, 
        this.whiskeyPickupAudio,
        this.supernovaAudio, 
        this.bottlePickupAudio,
        this.painAudio,
        this.wakeAudio,
        this.snoreAudio,
        this.playerDeathAudio, 
        this.deathSong, 
        this.goCryLoop, 
        this.goRainLoop,
        this.dramaticAudio, 
        this.bossDeathAudio, 
        this.hitAudio,
        this.portalTimerAudio,          // ← NEU
        this.character?.walking_sound, 
        this.character?.walking_sound_back,
        this.enemyDeathAudio
    ];
    return a.filter(Boolean);
    }

    /** Hilfsfunktion: beliebiges Objekt auf Audio-Instanzen prüfen (flach) */
    _collectAudiosShallow(obj, bag) {
    if (!obj) return;
    try {
        Object.values(obj).forEach(v => { if (v instanceof Audio) bag.add(v); });
    } catch(e){}
    }

    /** Alle Audios tief einsammeln: World, Character, Character-Audio, Enemies (flach), Loops */
    getAllAudiosDeep() {
        const bag = new Set();
        // World-eigene Audios
        this.getAllAudios().forEach(a => bag.add(a));

        // Character (bestehend)
        try {
            if (this.character) {
            this._collectAudiosShallow(this.character, bag);
            [this.character.snoreAudio, this.character.wakeAudio,
            this.character.walking_sound, this.character.walking_sound_back]
            .forEach(a => { if (a) bag.add(a); });
            }
        } catch(e){}

        // Enemies (bestehend)
        try { (this.level?.enemies || []).forEach(e => this._collectAudiosShallow(e, bag)); } catch(e){}

        // ✅ StoryBillboard: Atmo + alle One-Shots
        try {
            if (this.hutStory) {
            if (this.hutStory.atmo) bag.add(this.hutStory.atmo);
            Object.values(this.hutStory.audioMap || {}).forEach(a => { if (a) bag.add(a); });
            }
        } catch(e){}

        // ✅ WinnerScreen: Win-One-Shot
        try {
            if (this.winnerScreen?.winAudio) bag.add(this.winnerScreen.winAudio);
        } catch(e){}

        return Array.from(bag);
    }

    // === NEU: alle World-Audios hart stoppen (für Restart / BackToStart) ===
    resetAllAudios() {
        try {
            const audios = this.getAllAudiosDeep();
            audios.forEach((a) => {
                try {
                    a.pause();
                    a.currentTime = 0;
                } catch (e) {}
            });
        } catch (e) {}
    }

    
    /** Pause / Resume: frieren & auftauen */
    setPaused(flag) {
        if (flag === this.paused) return;
        this.paused = !!flag;

        // StoryBillboard informieren (für Dialog-/Atmo-Audios)
        try {
            if (this.hutStory && typeof this.hutStory.setWorldPaused === 'function') {
                this.hutStory.setWorldPaused(this.paused);
            }
        } catch (e) {}

        if (this.paused) {
            this.freezeWorld();

            // alle aktuell spielenden Audios pausieren (kein Stop -> kein currentTime Reset)
            try {
                this.getAllAudiosDeep().forEach(a => {
                    try { a.pause(); } catch (e) {}
                });
            } catch (e) {}

        } else {
            this.unfreezeWorld();

            // BG-Musik ggf. wieder anlaufen lassen
            try {
                if (!this.endbossInSight &&
                    !this.gameOver &&
                    !this.gameWon &&
                    this.bgMusic &&
                    !this.bgMusic.muted) {
                    this.bgMusic.play();
                }
            } catch (e) {}

            // falls Portal-Countdown aktiv ist, Countdown-Sound fortsetzen
            try {
                if (this.portalTimerActive &&
                    this.portalTimerSeconds > 0 &&
                    this.portalTimerAudio &&
                    this.portalTimerAudio.paused &&
                    !this.portalTimerAudio.muted) {

                    this.portalTimerAudio.play();
                }
            } catch (e) {}
        }
    }


    /** Methoden sichern & auf no-op patchen */
    freezeWorld() {
    // Gegner/Clouds/Background/Projectiles/Effekte: Methoden einfrieren
        const patchOne = (o) => {
            if (!o || o.__frozen) return;
            o.__frozen = true;

            // Speed merken und auf 0
            if (typeof o.speed === 'number') { o.__prevSpeed = o.speed; o.speed = 0; }
            if (typeof o.baseSpeed === 'number') { o.__prevBaseSpeed = o.baseSpeed; o.baseSpeed = 0; }

            // Bewegungsmethoden patchen
            ['moveLeft','moveRight','updateAI','animate'].forEach(fn => {
            if (typeof o[fn] === 'function' && !o[`__orig_${fn}`]) {
                o[`__orig_${fn}`] = o[fn];
                o[fn] = function() { /* frozen */ };
            }
            });
        };

        // alles patchen, was sich bewegt
        (this.level?.enemies || []).forEach(patchOne);
        (this.level?.clouds  || []).forEach(patchOne);
        (this.level?.backgroundObjects || []).forEach(patchOne);
        (this.throwableObjects || []).forEach(patchOne);
        (this.effects || []).forEach(patchOne);

        // Pepe selbst wird bereits in character.animate() über this.world.paused gestoppt,
        // aber sicherheitshalber auch hier patchen:
        patchOne(this.character);
    }

    /** Originalmethoden & Speeds wiederherstellen */
    unfreezeWorld() {
        const unpatchOne = (o) => {
            if (!o || !o.__frozen) return;
            o.__frozen = false;

            if ('__prevSpeed' in o) { o.speed = o.__prevSpeed; delete o.__prevSpeed; }
            if ('__prevBaseSpeed' in o) { o.baseSpeed = o.__prevBaseSpeed; delete o.__prevBaseSpeed; }

            ['moveLeft','moveRight','updateAI','animate'].forEach(fn => {
            const key = `__orig_${fn}`;
            if (typeof o[key] === 'function') { o[fn] = o[key]; delete o[key]; }
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
