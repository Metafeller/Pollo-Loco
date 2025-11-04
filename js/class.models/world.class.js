class World {
    character = new Character();
    level = level1;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;

    statusBar = new StatusBar();
    bottleStatusBar = new BottleStatusBar();
    endbossStatusBar = new EndbossStatusBar();
    endbossInSight = false;

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
    goT0 = 0;               // performance.now() bei Tod
    SPLASH_MS = 4000;       // 0–4s: Splash sichtbar
    OVERLAY_AT_MS = 6000;   // ab 6s Overlay + Loops
    BUTTON_AT_MS  = 10000;  // ab 10s Try-Again-Button
    goOverlayShown = false; // Overlay schon aktiviert?
    goButtonShown = false;  // Button schon aktiviert?
    goLoopsStarted = false; // Audio-Loops schon gestartet?

    // One-Shots
    painAudio = new Audio('/audio/kung-fu-punch.mp3');
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

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.enemyDeathAudio = new Audio('/audio/chicken-noise.mp3');

        // Level-Objekte referenzieren
        this.hutGate = this.level.hutGate || null;
        this.hutStory = this.level.storyBillboard || null;
        if (this.hutStory && !this.hutStory.anchorGate && this.hutGate) {
            this.hutStory.anchorGate = this.hutGate;
        }

        // EIN Splash-Bild vorladen (robust, kein Zufall)
        this.preloadGoSplash();

        this.winnerScreen = new WinnerScreen();

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

    // ===== Sammeln / Werfen =====
    checkBottleCollection() {
        this.level.bottles.forEach((bottle) => {
            if (this.character.isColliding(bottle)) {
                if (this.bottlesCollected < this.maxBottles) {
                    const picked = bottle;
                    this.level.bottles = this.level.bottles.filter(b => b !== picked);
                    this.bottlesCollected++;
                    const pct = (this.bottlesCollected / this.maxBottles) * 100;
                    this.bottleStatusBar.setPercentage(pct);
                }
            }
        });
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

    run() {
        setInterval(() => {
            if (this.gameWon || this.gameOver) {
                if (this.hutStory) this.hutStory.deactivate();
                return;
            }

            this.checkCollisions();
            this.checkThrowObjects();
            this.checkBottleCollection();
            this.checkBottleCollisions();

            const endboss = (this.level?.enemies || []).find(e => e instanceof Endboss);
            if (endboss) {
                endboss.updateAI(this.character?.x || 0);
                this.endbossInSight = (endboss.aiState === 'CHASE');
            }

            if (this.hutGate)  this.hutGate.update();
            if (this.hutStory) this.hutStory.update();

            this.checkHutProximityAndStory();
            this.checkPortalEnter();

            this.effects = Array.isArray(this.effects) ? this.effects.filter(e => !e.done) : [];
        }, 200);
    }

    checkThrowObjects() {
        if (this.keyboard.D && this.bottlesCollected > 0) {
            let bottle = new ThrowableObject(this.character.x + 100, this.character.y + 100);
            this.throwableObjects.push(bottle);
            this.bottlesCollected--;
            const pct = (this.bottlesCollected / this.maxBottles) * 100;
            this.bottleStatusBar.setPercentage(pct);
        }
    }

    checkBottleCollisions() {
        if (!Array.isArray(this.throwableObjects) || !this.level || !Array.isArray(this.level.enemies)) return;

        this.throwableObjects.forEach((bottle, bottleIndex) => {
            this.level.enemies.forEach((enemy) => {
                if (bottle.isColliding(enemy)) {
                    if (bottle.hasHit === true) return;
                    bottle.hasHit = true;
                    this.onBottleHitsEnemy(bottle, enemy);

                    if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
                        if (typeof enemy.die === 'function') enemy.die();
                        setTimeout(() => {
                            try { this.playEnemyDeathSound(); } catch(e) {}
                            this.level.enemies = this.level.enemies.filter(e => e !== enemy);
                        }, 320);

                    } else if (enemy instanceof Endboss) {
                        if (typeof enemy.enterAggro === 'function') enemy.enterAggro();
                        this.startAmbienceLoop();

                        enemy.hit();
                        this.endbossStatusBar.setPercentage(enemy.energy);

                        if (enemy.energy === 0 && typeof this.onEndbossDeath === 'function') {
                            this.onEndbossDeath(enemy);
                        }
                    }

                    this.throwableObjects.splice(bottleIndex, 1);
                }
            });
        });
    }

    checkCollisions() {
        this.level.enemies.forEach((enemy) => {
            if (enemy && enemy.dead === true) return;

            if (this.character.isColliding(enemy)) {
                const jumpedOn = this.character.isAboveGround() && this.character.speedY < 0;

                if (jumpedOn) {
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

                } else if (!this.character.invulnerable) {
                    this.character.hit();
                    this.statusBar.setPercentage(this.character.energy);

                    this.playPainOnce();

                    if (this.character.energy <= 0) {
                        this.onPlayerDeath();
                    }
                }
            }
        });
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

    /** Endgültiger Spieler-Tod: Logik stoppen, Grabstein setzen + GO-Sequenz. */
    onPlayerDeath() {
        if (this.gameOver) return;
        this.gameOver = true;

        // Schritt-Sounds stoppen
        try {
            this.character.walking_sound.pause();
            this.character.walking_sound.currentTime = 0;
            this.character.walking_sound_back.pause();
            this.character.walking_sound_back.currentTime = 0;
        } catch (e) {}

        // Ambience stoppen
        try { this.stopAmbienceLoop(); } catch (e) {}

        // Enemies hart einfrieren
        try {
            (this.level?.enemies || []).forEach(e => {
                if (!e) return;
                e.speed = 0;
                e.baseSpeed = 0;
                if (typeof e.moveLeft  === 'function') e.moveLeft  = function() {};
                if (typeof e.moveRight === 'function') e.moveRight = function() {};
                if (typeof e.updateAI  === 'function') e.updateAI  = function() {};
                if (e instanceof Endboss) {
                    e.inAggroMode = false;
                    e.aiState = 'IDLE';
                    e.returning = false;
                }
            });
        } catch (e) {}

        // Charakter einfrieren
        try {
            this.character.dead = true;
            this.character.speed = 0;
            this.character.speedY = 0;
        } catch (e) {}

        // Grabstein an Pepes Füße
        try {
            const SW = 120, SH = 320;
            const gx = this.character.x + (this.character.width * 0.5) - (SW / 2);
            const gy = this.character.y + this.character.height - SH;
            this.gravestone = new Gravestone(gx, gy, SW, SH);
        } catch (e) {}

        // Pain-Sound stoppen, damit Death-Sound nicht überlappt
        try {
            if (this.painAudio) {
                this.painAudio.pause();
                this.painAudio.currentTime = 0;
            }
        } catch (e) {}

        // Sterbe-Sound einmalig
        try {
            if (this.playerDeathAudio) {
                this.playerDeathAudio.pause();
                this.playerDeathAudio.currentTime = 0;
                this.playerDeathAudio.volume = 0.85;
                this.playerDeathAudio.play();
            }
        } catch (e) {}

        // 0s: Death-Song
        try {
            if (this.deathSong) {
                this.deathSong.pause();
                this.deathSong.currentTime = 0;
                this.deathSong.volume = 0.75;
                this.deathSong.play();
            }
        } catch (e) {}

        // Overlay-Objekt + TryAgain Hook
        try {
            if (!this.gameOverScreen) this.gameOverScreen = new GameOverScreen();
            this.gameOverScreen.attachDom('.game-container');
            this.gameOverScreen.onTryAgain(() => {
                try { this.stopAllGameOverAudio(); } catch (e) {}
                window.location.reload();
            });
        } catch (e) {}

        // Sequencer starten
        this.goT0 = performance.now();
        this.goOverlayShown = false;
        this.goButtonShown = false;
        this.goLoopsStarted = false;

        // Splash scharf setzen (kein Filter, EIN Bild)
        try {
            const setImg = () => {
                this.goSplashActive = true;
            };
            if (this.goSplashImg && typeof this.goSplashImg.decode === 'function') {
                this.goSplashImg.decode().then(setImg).catch(setImg);
            } else {
                setImg();
            }
        } catch (e) { this.goSplashActive = true; }
    }

    /** Sequencer pro Frame – keine Timer-Races. */
    updateGameOverSequence(now) {
        if (!this.gameOver) return;
        const elapsed = now - this.goT0;

        // Splash beenden nach SPLASH_MS
        if (this.goSplashActive && elapsed >= this.SPLASH_MS) {
            this.goSplashActive = false;
        }

        // Overlay ab OVERLAY_AT_MS
        if (!this.goOverlayShown && elapsed >= this.OVERLAY_AT_MS) {
            this.startGameOverOverlay();
            this.goOverlayShown = true;
        }

        // Button ab BUTTON_AT_MS
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

    draw() {
        // Canvas löschen
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Sequencer tick
        const now = performance.now();
        this.updateGameOverSequence(now);

        // Kamera an
        this.ctx.translate(this.camera_x, 0);

        // Hintergrund
        this.addObjectsToMap(this.level.backgroundObjects);

        // Kamera aus
        this.ctx.translate(-this.camera_x, 0);

        // Fixe UI
        this.addToMap(this.statusBar);
        this.addToMap(this.bottleStatusBar);
        if (this.endbossInSight) this.addToMap(this.endbossStatusBar);

        // Kamera an
        this.ctx.translate(this.camera_x, 0);

        // Wolken
        this.addObjectsToMap(this.level.clouds);

        // Tor & Story
        if (this.hutGate) this.addToMap(this.hutGate);
        if (this.hutStory && this.hutStory.visible) this.addToMap(this.hutStory);

        // Spieler ODER Grabstein
        if (this.gameOver) {
            if (this.gravestone) this.addToMap(this.gravestone);
        } else {
            this.addToMap(this.character);
        }

        // Bottles, Enemies, Effekte
        this.addObjectsToMap(this.level.bottles);

        if (!this.gameOver) {
            this.addObjectsToMap(this.level.enemies);
        }

        this.addObjectsToMap(this.throwableObjects);
        this.addObjectsToMap(this.effects);

        // Kamera aus
        this.ctx.translate(-this.camera_x, 0);

        // Winner-Overlay
        if (this.winnerScreen && this.winnerScreen.visible) {
            this.winnerScreen.drawOverlay(this.ctx, this.canvas);
        }

        // Game-Over-Overlay (über allem)
        if (this.gameOverScreen && this.gameOverScreen.visible) {
            this.gameOverScreen.drawOverlay(this.ctx, this.canvas);
        }

        // 0–4s Game-Over-Splash (liegt über allem, solange aktiv)
        this.drawGameOverSplash(this.ctx, this.canvas);

        // Loop
        let self = this;
        requestAnimationFrame(function() { self.draw(); });
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
        mo.drawFrame(this.ctx);
        if (mo.otherDirection) this.flipImageBack(mo);
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
            this.showWinnerScreen();
        }
    }

    showWinnerScreen() {
        this.gameWon = true;
        try { this.stopAmbienceLoop(); } catch(e) {}
        if (this.winnerScreen) this.winnerScreen.show();
    }

    onEndbossDeath(endboss) {
        this.endbossInSight = false;
        if (endboss) endboss.isInSight = false;

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
    }
}
