class World {
    character = new Character();
    level = level1;
    canvas;
    ctx;
    keyboard;
    camera_x = 0;
    statusBar = new StatusBar();
    bottleStatusBar = new BottleStatusBar(); // Flaschen StatusBar hinzufügen
    throwableObjects = [];
    bottlesCollected = 0; // Anzahl gesammalter Flaschen
    maxBottles = 5; // Maximale Anzahl an Flaschen, die gesammelt werden können

    constructor(canvas, keyboard) {
        this.ctx = canvas.getContext('2d');
        this.canvas = canvas;
        this.keyboard = keyboard;
        this.draw();
        this.setWorld();
        this.run();
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


    run() {
        setInterval(() => {
            this.checkCollisions();
            this.checkThrowObjects();
            this.checkBottleCollection(); // Überprüft die Flaschenkollision
        }, 200); // vielleicht auf 100 oder 50 setzen?
    }

    // checkThrowObjects() {
    //     if (this.keyboard.D) {
    //         let bottle = new ThrowableObject(this.character.x + 100, this.character.y +100);
    //         this.throwableObjects.push(bottle);
    //     }
    // }

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

    checkCollisions() {
        this.level.enemies.forEach((enemy) => {
            if(this.character.isColliding(enemy)) {
               this.character.hit();
               this.statusBar.setPercentage(this.character.energy);
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