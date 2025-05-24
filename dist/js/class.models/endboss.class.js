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
        clearTimeout(this.hurtTimeout);  // Timer beenden
        this.loadImage(this.IMAGES_DEAD[2]);  // Zeige das letzte Bild der Sterbeanimation
    }


    animate() {
        setInterval(() => {
            if (this.isInSight && !this.isHurtAnimation) {
                this.moveLeft();  // Endboss bewegt sich vorwärts
                this.otherDirection = false;  // Nach links schauen
                this.playAnimation(this.IMAGES_WALKING);
            } else if (!this.isInSight && !this.isHurtAnimation && this.x < this.startPosition) {
                this.returnToStart();  // Endboss kehrt zur Startposition zurück
            } else if (this.isHurtAnimation) {
                this.playAnimation(this.IMAGES_HURT);  // Hurt-Animation abspielen
            }
        }, 1000 / 60);
    }

    
    // Diese Methode beendet die Hurt-Animation und stellt die Y-Position wieder her
    endHurtAnimation() {
        this.isHurtAnimation = false;
        this.y = 60;  // Setze die Y-Position des Endbosses wieder auf die ursprüngliche Höhe zurück
    }
    

    returnToStart() {
        this.returning = true;  // Endboss kehrt zurück
        if (this.x < this.startPosition) {
            this.moveRight();  // Endboss läuft zurück
            this.otherDirection = true;  // Nach rechts schauen
            this.playAnimation(this.IMAGES_WALKING);  // Geh-Animation beim Zurücklaufen
        } else {
            this.returning = false;  // Erreicht die Startposition
        }
    }

       
}
