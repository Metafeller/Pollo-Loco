class Endboss extends MovableObject {
    y = 60;
    height = 400;
    width = 300;
    speed = 0.3;
    isInSight = false;  // Status ob der Character im Sichtfeld ist
    movingForward = true; // Verfolgt, ob der Endboss sich vorwärts bewegt
    startPosition = 4500;  // Die Startposition des Endbosses
    returning = false;  // Flag um zu prüfen, ob der Endboss zurückkehrt
    sightRange = 400;  // Verkleinertes Sichtfeld
    energy = 100;  // Endboss startet mit 100% Lebensenergie

    // --- Bug-EPL-22: Spielfeld-Grenzen & Helfer ---
    minX = 0; // Linkes Level-Limit (bei Bedarf anpassen)

    /**
     * Hält den Boss immer innerhalb [minX, startPosition].
     * Verhindert, dass er rechts die Startposition überschreitet oder links das Spielfeld verlässt.
     */
    clampX() {
        if (this.x > this.startPosition) this.x = this.startPosition;
        if (this.x < this.minX) this.x = this.minX;
    }

    /**
     * Setzt den Boss sauber auf die Startposition und beendet den Rücklauf.
     */
    snapToStart() {
        this.x = this.startPosition;
        this.returning = false;
    }

    /**
     * Boss-Move-Left: nur um 'speed' verschieben und danach clampen.
     * (Kein zusätzliches -0.15 wie bei manchen anderen Entities.)
     */
    moveLeft() {
        this.x -= this.speed;
        this.clampX();
    }

    /**
     * Boss-Move-Right: nur um 'speed' verschieben und danach clampen.
     */
    moveRight() {
        this.x += this.speed;
        this.clampX();
    }


    // EPL-17: Aggro mode (on bottle hit)
    inAggroMode = false;
    baseSpeed = 0.3;  // Behalten Sie Ihre aktuelle Standardeinstellung bei.
    aggroSpeed = 0.6; // schneller während Aggro
    isDying = false;  // Blockiert KI und ermöglicht One-Shot-Todesanimation
    

    /**
     * Platzhalter für den Aggromode, wenn der Endboss von einer Flasche getroffen wird, 
     * dann wird er Aggro und nutzt die Image Bilder für die Animation von
     * inAggroMode = false;  // Flag für den Aggro-Modus
     * aggroAudioPlaying = false;  // Verhindert mehrfaches Abspielen des Aggro-Sounds
     * */ 
    

    IMAGES_WALKING = [
        'img/4_enemie_boss_chicken/1_walk/G1.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G4.png'
    ];


    IMAGES_ALERT = [  // Platzhalter Bilder für den Aggro-Modus
        '/img/4_enemie_boss_chicken/2_alert/G5.png',
        '/img/4_enemie_boss_chicken/2_alert/G6.png',
        '/img/4_enemie_boss_chicken/2_alert/G7.png',
        '/img/4_enemie_boss_chicken/2_alert/G8.png',
        '/img/4_enemie_boss_chicken/2_alert/G9.png',
        '/img/4_enemie_boss_chicken/2_alert/G10.png',
        '/img/4_enemie_boss_chicken/2_alert/G11.png',
        '/img/4_enemie_boss_chicken/2_alert/G12.png',
        '/img/4_enemie_boss_chicken/3_attack/G13.png',
        '/img/4_enemie_boss_chicken/3_attack/G14.png',
        '/img/4_enemie_boss_chicken/3_attack/G15.png',
        '/img/4_enemie_boss_chicken/3_attack/G16.png',
        '/img/4_enemie_boss_chicken/3_attack/G17.png',
        '/img/4_enemie_boss_chicken/3_attack/G18.png',
        '/img/4_enemie_boss_chicken/3_attack/G19.png',
        '/img/4_enemie_boss_chicken/3_attack/G20.png'
    ];


    IMAGES_HURT = [
        '/img/4_enemie_boss_chicken/4_hurt/G21.png',
        '/img/4_enemie_boss_chicken/4_hurt/G22.png',
        '/img/4_enemie_boss_chicken/4_hurt/G23.png'
    ];


    IMAGES_DEAD = [
        '/img/4_enemie_boss_chicken/5_dead/G24.png',
        '/img/4_enemie_boss_chicken/5_dead/G25.png',
        '/img/4_enemie_boss_chicken/5_dead/G26.png'
    ];


    enterAggro() {
        if (this.inAggroMode) return; // idempotent
        this.inAggroMode = true;
        this.speed = Math.max(this.speed, this.aggroSpeed);
        // Frames switch happens in animate() by choosing IMAGES_ALERT when aggro.
    }


    constructor() {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_ALERT); // Platzhalter für den Aggromode
        this.loadImages(this.IMAGES_DEAD); // Platzhalter für den Tod von Endboss
        this.loadImages(this.IMAGES_HURT); // Hurt-Bilder laden
        this.x = this.startPosition;  // Setze den Endboss an seine Startposition
        this.animate();
    }


    checkCharacterInSight(characterX) {
        // Überprüfen, ob der Charakter im Sichtfeld ist
        if (characterX > this.x - this.sightRange) {  // Sichtfeld auf 400px
            this.isInSight = true;
            this.movingForward = true;  // Endboss bewegt sich vorwärts
            this.returning = false;  // Setze das Rückwärts-Flag zurück
        } else {
            this.isInSight = false;  // Charakter verlässt das Sichtfeld
        }
    }


    hit() {
        this.energy -= 20;  // Reduziere die Lebenspunkte um 20%
        if (this.energy < 0) {
            this.energy = 0;
        }
    
        if (this.energy == 0) {
            this.die();  // Endboss stirbt, wenn Energie 0 ist
        } else {
            this.isHurtAnimation = true;
            this.speedY = 30;  // Sprung-Effekt nach oben
            this.applyGravity();  // Schwerkraft anwenden
    
            setTimeout(() => {
                this.endHurtAnimation();  // Hurt-Animation nach 1 Sekunde beenden
            }, 1500);
    
            // Sicherstellen, dass der Endboss auf seiner Bodenposition landet
            this.ensureCorrectLanding();
        }
    }
    

    ensureCorrectLanding() {
        setInterval(() => {
            // Wenn der Endboss unterhalb seiner eigentlichen Position ist, korrigieren wir ihn
            if (this.y > 60) {
                this.y = 60;  // Setze den Endboss auf die Bodenposition
                this.speedY = 0;  // Stoppe die Bewegung nach unten
            }
        }, 1000 / 60);
    }
    
    
    playAnimation(images, speedFactor = 4) {
        let i = Math.floor(this.currentImage / speedFactor) % images.length; 
        this.img = this.imageCache[images[i]];
        this.currentImage++;
    }
    

    activateHurtAnimation() {
        this.isHurtAnimation = true;
        this.loadImages(this.IMAGES_HURT);  // Hurt-Animation Bilder setzen
        this.speedY = -20; // Endboss springt in die Luft
        this.applyGravity(); // Gravitationslogik anwenden

        // Timer für die Dauer der Hurt-Animation (z.B. 1 Sekunde)
        this.hurtTimeout = setTimeout(() => {
            this.isHurtAnimation = false;
            this.loadImages(this.IMAGES_WALKING); // Zurück zur Geh-Animation
        }, 1000);
    }


    die() {
        clearTimeout(this.hurtTimeout);
        if (this.isDying || this.dead) return;

        // KI/Bewegung einfrieren, aber unsere One-Shot-Animation ausführen lassen
        this.isDying = true;
        this.isHurtAnimation = false;
        this.isInSight = false;
        this.returning = false;
        this.speed = 0;

        // Einmal durch 5_dead Frames schießen, dann letzten Frame halten und als tot markieren
        const frames = this.IMAGES_DEAD;
        let i = 0;
        if (frames && frames.length > 0) {
            this.img = this.imageCache[frames[0]];
        }

        this.deathTimer = setInterval(() => {
            i++;
            if (!frames || i >= frames.length) {
                clearInterval(this.deathTimer);
                this.isDying = false;
                this.dead = true;
                if (frames && frames.length > 0) {
                    this.img = this.imageCache[frames[frames.length - 1]];
                }
                return;
            }
            this.img = this.imageCache[frames[i]];
        }, 180); // ~540ms total bei 3 Frames; anpassbar
    }


    animate() {
        setInterval(() => {
            // Tod/Death: Bei 'dead' oder 'isDying' keinerlei Bewegung/Animation mehr ausführen
            if (this.dead === true || this.isDying === true) {
                return; // das letzte Dead-Bild bleibt stehen (Leiche)
            }

            if (this.isInSight && !this.isHurtAnimation) {
                if (this.isDying) {
                    // Während der Todesequenz: KI/Bewegung wird angehalten; Frames werden von die() verarbeitet.
                    return;  // Keine Bewegung, wenn der Endboss stirbt
                }

                this.moveLeft();  // Endboss bewegt sich vorwärts
                this.otherDirection = false;  // Nach links schauen
                const frames = this.inAggroMode ? this.IMAGES_ALERT : this.IMAGES_WALKING;
                this.playAnimation(frames);  // Entweder Aggro- oder Geh-Animation abspielen

            } else if (!this.isInSight && !this.isHurtAnimation && this.x < this.startPosition) {
                this.returnToStart();  // Endboss kehrt zur Startposition zurück
            } else if (this.isHurtAnimation) {
                this.playAnimation(this.IMAGES_HURT);  // Hurt-Animation abspielen
            }

            // >>> Bug-EPL-22: Failsafe, falls x extern verändert wurde
            this.clampX();

        }, 1000 / 60);

    }

    
    // Diese Methode beendet die Hurt-Animation und stellt die Y-Position wieder her
    endHurtAnimation() {
        this.isHurtAnimation = false;
        this.y = 60;  // Setze die Y-Position des Endbosses wieder auf die ursprüngliche Höhe zurück
    }
    

    returnToStart() {
        // Boss kehrt nur zurück, wenn er nicht stirbt/tot ist
        if (this.isDying || this.dead) { 
            this.returning = false; // Erreicht die Startposition
            return;
        }

        this.returning = true; // Endboss kehrt zurück

        // Schrittweise nach rechts, aber NIE an der Startposition vorbeischießen
        if (this.x + this.speed < this.startPosition) {
            this.moveRight(); // Endboss läuft zurück
        } else {
            // Snap exakt auf die Startposition & Retreat beenden
            this.snapToStart();
        }

        // Optional: Rücklauf-Animation beibehalten
        this.otherDirection = true; // Nach rechts schauen
        this.playAnimation(this.IMAGES_WALKING); // Geh-Animation beim Zurücklaufen
    }

       
}
