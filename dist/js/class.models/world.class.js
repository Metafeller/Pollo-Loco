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
    dramaticAudio = new Audio('/audio/fear-back.mp3');  // Audio für den Endboss
    throwableObjects = [];
    bottlesCollected = 0; // Anzahl gesammalter Flaschen
    maxBottles = 5; // Maximale Anzahl an Flaschen, die gesammelt werden können

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
                    this.level.bottles.splice(index, 1); // Entfernt die Flasche vom Spielfeld
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
        this.throwableObjects.forEach((bottle, bottleIndex) => {
            this.level.enemies.forEach((enemy, enemyIndex) => {
                if (bottle.isColliding(enemy)) {
                    if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
                        this.level.enemies.splice(enemyIndex, 1);  // Chicken oder MiniChicken entfernen
                        enemy.die();  // Sterbeanimation für Chicken/MiniChicken
                    } else if (enemy instanceof Endboss) {
                        enemy.hit();  // Endboss verliert Lebenspunkte
                        this.endbossStatusBar.setPercentage(enemy.energy);  // StatusBar des Endbosses aktualisieren
                    }
                    this.throwableObjects.splice(bottleIndex, 1);  // Flasche nach Kollision entfernen
                }
            });
        });
    }
    

    checkCollisions() {
        this.level.enemies.forEach((enemy, index) => {
            if (this.character.isColliding(enemy)) {
                if (this.character.isAboveGround() && this.character.speedY < 0) {
                    // Der Charakter springt von oben auf den Gegner -> Der Gegner stirbt
                    enemy.die();  // Gegner sterben lassen (Animation starten)
                    this.playEnemyDeathSound();  // Audio abspielen, wenn der Gegner stirbt
                    this.character.makeInvulnerable();  // Charakter unverwundbar machen
                    setTimeout(() => {
                        this.level.enemies.splice(index, 1);  // Gegner aus dem Array entfernen (nach kurzer Verzögerung)
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
        
        // Kamera wieder zurück verschieben
        this.ctx.translate(-this.camera_x, 0);

        // draw() wird immer wieder aufgerufen
        let self = this;
        requestAnimationFrame(function() {
            self.draw();
        });
    }

    addObjectsToMap(objects) {
        objects.forEach(o => {
            this.addToMap(o);
        });
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

}