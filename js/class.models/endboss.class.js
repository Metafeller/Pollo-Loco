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
        'img/4_enemie_boss_chicken/1_walk/G1.png',
        'img/4_enemie_boss_chicken/1_walk/G1.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G4.png'
    ];


    IMAGES_ALERT = [  // Bilder für den Aggro-Modus
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


    animate() {
        setInterval(() => {
            if (this.isInSight) {
                this.moveLeft();  // Endboss bewegt sich vorwärts
                this.otherDirection = false;  // Nach links schauen
                this.playAnimation(this.IMAGES_WALKING);
            } else if (!this.isInSight && this.x < this.startPosition) {
                this.returnToStart();  // Endboss kehrt zur Startposition zurück
            }
        }, 1000 / 60);
    }

    
    returnToStart() {
        this.returning = true;  // Endboss kehrt zurück
        if (this.x < this.startPosition) {
            this.moveRight();  // Endboss läuft zurück
            this.otherDirection = true;  // Nach rechts schauen
            this.playAnimation(this.IMAGES_WALKING);
        } else {
            this.returning = false;  // Erreicht die Startposition
        }
    }


    hit() {
        this.energy -= 20;  // Reduziere die Lebenspunkte um 20%
        if (this.energy < 0) {
            this.energy = 0;
        }
        // Wenn der Endboss stirbt, rufe die Methode "die()" auf
        if (this.energy == 0) {
            this.die();
        }
    }

    
    die() {
        // Hier kannst du eine Sterbeanimation oder Logik einfügen
        console.log('Endboss ist tot!');
        // Du kannst eine Animation hinzufügen, die zeigt, dass der Endboss stirbt
    }

       
}
