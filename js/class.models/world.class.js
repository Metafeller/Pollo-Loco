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
    maxBottles = 5; // Maximal zu sammelnde Flaschen

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
                this.level.bottles.splice(index, 1); // Entfernt die Flasche vom Spielfeld
                this.bottlesCollected++;
                // Berechnung des Prozentsatzes und Aktualisierung der StatusBar
                let percentage = (this.bottlesCollected / this.maxBottles) * 100;
                this.bottleStatusBar.setPercentage(percentage); // Setze den berechneten Prozentsatz
            }
        });
    }


    run() {
        setInterval(() => {
            this.checkCollisions();
            this.checkThrowObjects();
            this.checkBottleCollection(); // Überprüft die Flaschenkollision
        }, 200);
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
            this.bottleStatusBar.setPercentage(this.bottlesCollected); // Aktualisiert die StatusBar
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