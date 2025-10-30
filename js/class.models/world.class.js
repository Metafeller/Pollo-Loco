class World {
    character = new Character();
    level = level1;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar();
    bottleStatusBar = new BottleStatusBar(); // Flaschen StatusBar hinzufügen
    endbossStatusBar = new EndbossStatusBar();  // Endboss StatusBar hinzufügen
    endbossInSight = false;  // Flag für das Sichtfeld des Endbosses
    dramaticAudio = new Audio('/audio/spanish-guitar-thing.mp3');  // Audio für den Endboss
    hitAudio = new Audio('/audio/punch-3.mp3'); // Treffer-SFX (anpassbar)
    throwableObjects = [];
    effects = []; // VFX Visuelle Effekte (splash etc.)
    bottlesCollected = 0; // Anzahl gesammalter Flaschen
    maxBottles = 5; // Maximale Anzahl an Flaschen, die gesammelt werden können

    
    // EPL-17: ambience loop helpers
    startAmbienceLoop() {
        try {
            if (this.dramaticAudio) {
                this.dramaticAudio.loop = true;
                this.dramaticAudio.volume = 0.5; // tune if needed
                if (this.dramaticAudio.paused) {
                    this.dramaticAudio.currentTime = 0;
                    this.dramaticAudio.play();
                }
            }
        } catch (e) { /* keep game loop stable */ }
    }

    stopAmbienceLoop() {
        try {
            if (this.dramaticAudio && !this.dramaticAudio.paused) {
                this.dramaticAudio.pause();
                this.dramaticAudio.currentTime = 0;
            }
        } catch (e) { /* keep game loop stable */ }
    }


    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.enemyDeathAudio = new Audio('/audio/punch-1.mp3');  // Soundeffekt für den Tod eines Gegners
        this.draw();
        this.setWorld();
        this.run();
    }


    playEnemyDeathSound() {
        this.enemyDeathAudio.play();  // Spielt den Sound ab, wenn ein Gegner stirbt
    }

    
    setWorld() {
        this.character.world = this;
    }


    checkBottleCollection() {
        this.level.bottles.forEach((bottle, index) => {
            if (this.character.isColliding(bottle)) {
                if (this.bottlesCollected < this.maxBottles) { // Überprüfen, ob die maximale Anzahl erreicht ist
                    const picked = bottle;
                    this.level.bottles = this.level.bottles.filter(b => b !== picked); // Entfernt die Flasche vom Spielfeld
                    this.bottlesCollected++;
                    let percentage = (this.bottlesCollected / this.maxBottles) * 100; // Berechne den Prozentsatz
                    this.bottleStatusBar.setPercentage(percentage); // Aktualisiere die StatusBar
                }
            }
        });
    }


    throwBottle() {
        if (this.bottlesCollected > 0) {  // Nur Flaschen werfen, wenn welche vorhanden sind
            let bottle = new ThrowableObject(this.character.x + 100, this.character.y + 100);
            this.throwableObjects.push(bottle);
            this.bottlesCollected--;  // Anzahl der Flaschen verringern

            // Berechnet den neuen Prozentsatz basierend auf den verbleibenden Flaschen
            let percentage = (this.bottlesCollected / this.maxBottles) * 100;  // Berechne den neuen Prozentsatz
            this.bottleStatusBar.setPercentage(percentage);  // Aktualisiere die StatusBar
        }
    }

    checkEndbossSight() {
        let sightRange = 400; // Sichtbereich des Endbosses
        let endboss = this.level.enemies.find(enemy => enemy instanceof Endboss);  // Finde den Endboss
    
        if (endboss) {
            // Überprüfen, ob der Charakter im Sichtbereich des Endbosses ist
            if (this.character.x > endboss.x - sightRange) {
                if (!endboss.isInSight) {
                    endboss.isInSight = true;
                    this.endbossInSight = true; // Zeige den Lebensbalken des Endbosses an
                    this.dramaticAudio.play();  // Dramatische Musik abspielen
                }
            } else if (this.character.x < endboss.x - sightRange && endboss.isInSight) {
                endboss.isInSight = false;
                endboss.returning = true;  // Flag setzen, dass er zurückläuft
                this.endbossInSight = false;
            }
        }
    }
    

    run() {
        setInterval(() => {
            this.checkCollisions();
            this.checkThrowObjects();
            this.checkBottleCollection(); // Überprüft die Flaschenkollision
            this.checkBottleCollisions();  // Neue Methode zur Kollisionserkennung
            this.checkEndbossSight();  // Überprüft, ob der Endboss im Sichtfeld ist
            
            // auto-clean finished effects
            this.effects = Array.isArray(this.effects) ? this.effects.filter(e => !e.done) : [];

        }, 200); // vielleicht auf 200, 100 oder 50 setzen?
    }


    checkThrowObjects() {
        // Überprüfen, ob der Spieler genügend Flaschen gesammelt hat
        if (this.keyboard.D && this.bottlesCollected > 0) {
            let bottle = new ThrowableObject(this.character.x + 100, this.character.y + 100);
            this.throwableObjects.push(bottle);
            this.bottlesCollected--; // Anzahl der Flaschen verringern
    
            // Berechnet den neuen Prozentsatz
            let percentage = (this.bottlesCollected / this.maxBottles) * 100; 
            this.bottleStatusBar.setPercentage(percentage); // Aktualisiert die StatusBar
        }
    }
    

    checkBottleCollisions() {
        // Guards to avoid crashes with missing arrays
        if (!Array.isArray(this.throwableObjects) || !this.level || !Array.isArray(this.level.enemies)) {
            return;
        }


        this.throwableObjects.forEach((bottle, bottleIndex) => {
            this.level.enemies.forEach((enemy, enemyIndex) => {
                if (bottle.isColliding(enemy)) {
                    if (bottle.hasHit === true) return; // prevent double-processing
                        bottle.hasHit = true;               // mark as consumed
                        this.onBottleHitsEnemy(bottle, enemy); // fire hook (no damage here)

                    if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
                        // 1) mark visually dead (shows dead sprite if still drawn this frame)
                        if (typeof enemy.die === 'function') {
                            enemy.die();
                        }
                        // 2) after splash (~320ms), play death sound and remove from simulation
                        setTimeout(() => {
                            try { this.playEnemyDeathSound(); } catch(e) {}
                            // remove by identity to avoid stale index
                            this.level.enemies = this.level.enemies.filter(e => e !== enemy);
                        }, 320);
                        
                    } else if (enemy instanceof Endboss) {
                        // EPL-17: Aggro eingeben und Ambience-Loop beim ersten Treffer starten
                        if (typeof enemy.enterAggro === 'function') {
                            enemy.enterAggro();
                        }
                        this.startAmbienceLoop();

                        enemy.hit();
                        this.endbossStatusBar.setPercentage(enemy.energy);
                    }


                    this.throwableObjects.splice(bottleIndex, 1);  // Flasche nach Kollision entfernen
                }
            });
        });
    }
    

    checkCollisions() {
        this.level.enemies.forEach((enemy, index) => {
            // Skip already-dead enemies to avoid repeated handling
            if (enemy && enemy.dead === true) {
                return;
            }

            if (this.character.isColliding(enemy)) {
                if (this.character.isAboveGround() && this.character.speedY < 0) {
                    // Der Charakter springt von oben auf den Gegner -> Der Gegner stirbt
                    enemy.die();  // Gegner sterben lassen (Animation starten)
                    this.playEnemyDeathSound();  // Audio abspielen, wenn der Gegner stirbt
                    this.character.makeInvulnerable();  // Charakter unverwundbar machen
                    setTimeout(() => {
                        const victim = enemy;
                        this.level.enemies = this.level.enemies.filter(e => e !== victim);  // Gegner aus dem Array entfernen (nach kurzer Verzögerung)
                    }, 500);  // Gegner bleibt für 0.5 Sekunden sichtbar, bevor er entfernt wird
                } else if (!this.character.invulnerable) {
                    // Wenn der Charakter nicht unverwundbar ist und frontal kollidiert -> Schaden für den Charakter
                    // Der Charakter kollidiert seitlich oder frontal mit dem Gegner -> Der Charakter erleidet Schaden
                    this.character.hit();
                    this.statusBar.setPercentage(this.character.energy); // Lebensanzeige aktualisieren
                }
            }
        });
    }

    draw() {
         // Canvas löschen
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Kamera verschieben
        this.ctx.translate(this.camera_x, 0);

        // Hintergrundobjekte zeichnen
        this.addObjectsToMap(this.level.backgroundObjects);

        // Kamera wieder zurück verschieben
        this.ctx.translate(-this.camera_x, 0);

        // ------- space for fixed objects -------

        // StatusBars (Lebensenergie, Flaschen) zeichnen
        this.addToMap(this.statusBar); // Lebens-StatusBar
        this.addToMap(this.bottleStatusBar); // Flaschen StatusBar wird gezeichnet

        // Endboss StatusBar wird nur gezeichnet, wenn er im Sichtfeld ist
        if (this.endbossInSight) {
            this.addToMap(this.endbossStatusBar); // Endboss StatusBar
        }

        // this.addToMap(this.endbossStatusBar);  

        // Kamera verschieben, um die restlichen Objekte zu zeichnen
        this.ctx.translate(this.camera_x, 0);

        // Wolken und Charakter zeichnen
        this.addObjectsToMap(this.level.clouds);
        this.addToMap(this.character);
        
        // Flaschen und Gegner zeichnen
        this.addObjectsToMap(this.level.bottles); // Flaschen zeichnen
        this.addObjectsToMap(this.level.enemies);
        
        this.addObjectsToMap(this.throwableObjects);

        // VFX: draw transient hit effects on top
        this.addObjectsToMap(this.effects);
        
        // Kamera wieder zurück verschieben
        this.ctx.translate(-this.camera_x, 0);

        // draw() wird immer wieder aufgerufen
        let self = this;
        requestAnimationFrame(function() {
            self.draw();
        });
    }

    addObjectsToMap(objects) {
    if (!Array.isArray(objects) || objects.length === 0) {
        return; // safe no-op
    }
        for (let i = 0; i < objects.length; i++) {
            const o = objects[i];
            if (!o) continue;
            this.addToMap(o);
        }
    }


    addToMap(mo) {
        if (mo.otherDirection) {
            this.flipImage(mo);
        }

        mo.draw(this.ctx);
        mo.drawFrame(this.ctx);

        if (mo.otherDirection) {
            this.flipImageBack(mo);
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

    /**
     * Hook for bottle hit events (EPL-14: add VFX/SFX; no damage logic here).
     * Allows bottles to trigger custom behavior on hit.
     */
    onBottleHitsEnemy(bottle, enemy) {
        // Bottle-specific callback (keine Änderungen)
        if (bottle && typeof bottle.onHit === 'function') {
            try {
                bottle.onHit(enemy);
            } catch (e) {
                // Keep loop stable; swallow errors
            }
        }

        // --- VFX: splash frames (paths based on your repo structure) ---
        try {
            const splashFrames = [
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/6_bottle_splash.png'
            ];


            // Spawn near the impact point (prefer bottle position, fallback to enemy)
            const hitX = (bottle && typeof bottle.x === 'number') ? bottle.x + (bottle.width  || 0) * 0.5 - 45
                                                                  : (enemy?.x || 0) + (enemy?.width  || 0) * 0.5 - 45;
            const hitY = (bottle && typeof bottle.y === 'number') ? bottle.y + (bottle.height || 0) * 0.5 - 45
                                                                  : (enemy?.y || 0) + (enemy?.height || 0) * 0.5 - 45;

            const effect = new HitEffect(hitX, hitY, splashFrames, 320); // ~320ms total
            effect.width = 100;  // feel free to tune
            effect.height = 100;
            this.effects.push(effect);
        } catch (e) {
            // ignore VFX errors to keep loop stable
        }

        // --- SFX: play short impact sound ---
        try {
            if (this.hitAudio) {
                this.hitAudio.currentTime = 0;
                this.hitAudio.play();
            }
        } catch (e) {
            // ignore SFX errors
        }
    }


}