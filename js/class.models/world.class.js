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

    dramaticAudio = new Audio('/audio/superhero-theme.mp3');
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

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.enemyDeathAudio = new Audio('/audio/punch-1.mp3');

        // Level-Objekte referenzieren
        this.hutGate = this.level.hutGate || null;
        this.hutStory = this.level.storyBillboard || null;
        if (this.hutStory && !this.hutStory.anchorGate && this.hutGate) {
            // falls im Level nicht übergeben wurde
            this.hutStory.anchorGate = this.hutGate;
        }

        this.winnerScreen = new WinnerScreen();

        this.draw();
        this.setWorld();
        this.run();
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

    // ===== Boss-Sicht =====
    // checkEndbossSight() {
    //     const sightRange = 400;
    //     const endboss = this.level.enemies.find(e => e instanceof Endboss);

    //     if (!endboss) return;

    //     if (endboss.dead === true || endboss.isDying === true) {
    //         this.endbossInSight = false;
    //         return;
    //     }

    //     if (this.character.x > endboss.x - sightRange) {
    //         if (!endboss.isInSight) {
    //             endboss.isInSight = true;
    //             this.endbossInSight = true;
    //         }
    //     } else if (this.character.x < endboss.x - sightRange && endboss.isInSight) {
    //         endboss.isInSight = false;
    //         endboss.returning = true;
    //         this.endbossInSight = false;
    //     }
    // }

    // === OPTIONAL: world.class.js -> checkEndbossSight() entschärfen ===
    checkEndbossSight() {
        // AI wird ausschließlich in endboss.updateAI() gesteuert.
        // Hier höchstens die HP-Bar nachziehen, falls gewünscht:
        const endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (!endboss) return;
        this.endbossInSight = (endboss.aiState === 'CHASE');
    }
    // === /OPTIONAL ===


   // === REPLACE: world.class.js -> run() ===
    run() {
        setInterval(() => {
            // Gewinn-Zustand: Logik drosseln
            if (this.gameWon) {
                if (this.hutStory) this.hutStory.deactivate();
                return;
            }

            // Core-Logic
            this.checkCollisions();
            this.checkThrowObjects();
            this.checkBottleCollection();
            this.checkBottleCollisions();

            // >>> WICHTIG: Boss-AI updaten (treibt CHASE/RETURN an)
            const endboss = (this.level?.enemies || []).find(e => e instanceof Endboss);
            if (endboss) {
                endboss.updateAI(this.character?.x || 0);

                // HP-Bar nur zeigen, wenn Boss aktiv jagt
                this.endbossInSight = (endboss.aiState === 'CHASE');
            }

            // Tor/Story updaten
            if (this.hutGate)  this.hutGate.update();
            if (this.hutStory) this.hutStory.update();

            // Story einmal "einfangen" & Portal-Eintritt prüfen
            this.checkHutProximityAndStory();
            this.checkPortalEnter();

            // Effekte aufräumen
            this.effects = Array.isArray(this.effects) ? this.effects.filter(e => !e.done) : [];
        }, 200);
    }
    // === /REPLACE ===


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
                        // kein Boss-Schaden durch Draufspringen
                        this.character.speedY = 18;
                        this.character.makeInvulnerable();
                    }

                } else if (!this.character.invulnerable) {
                    this.character.hit();
                    this.statusBar.setPercentage(this.character.energy);
                }
            }
        });
    }

    draw() {
        // Canvas löschen
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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

        // Tor & Story (Story nur, wenn sichtbar)
        if (this.hutGate) this.addToMap(this.hutGate);
        if (this.hutStory && this.hutStory.visible) this.addToMap(this.hutStory);

        // Spieler
        this.addToMap(this.character);

        // Bottles, Enemies, Effekte
        this.addObjectsToMap(this.level.bottles);
        this.addObjectsToMap(this.level.enemies);
        this.addObjectsToMap(this.throwableObjects);
        this.addObjectsToMap(this.effects);

        // Kamera aus
        this.ctx.translate(-this.camera_x, 0);

        // Winner-Overlay
        if (this.winnerScreen && this.winnerScreen.visible) {
            this.winnerScreen.drawOverlay(this.ctx, this.canvas);
        }

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

        // Boss lebt?
        const bossAlive = (this.level?.enemies || []).some(e => e instanceof Endboss && !e.dead);
        if (!bossAlive) {
            // Boss tot → Story aus
            this.hutStory.deactivate();
            this.storyLatched = false;
            return;
        }

        // Wenn bereits "gelatched": sichtbar halten und weiterlaufen lassen
        if (this.storyLatched) {
            if (!this.hutStory.visible) this.hutStory.activate();
            return;
        }

        // Noch nicht gelatched → Nähe prüfen & nur EINMAL aktivieren
        const playerX = this.character?.x || 0;
        const gateCenterX = this.hutGate.x + this.hutGate.width / 2;
        const near = Math.abs(playerX - gateCenterX) < 220;

        if (near && !this.hutGate.isOpen) {
            this.hutStory.activate();
            this.storyLatched = true; // ab jetzt bleibt sie an (bis Boss stirbt)
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

        // Tor öffnen & Story stoppen
        try { this.hutGate?.open(); } catch (e) {}
        try { this.hutStory?.deactivate(); } catch (e) {}
        this.storyLatched = false;
    }
}
