class Endboss extends MovableObject {
    y = 60;
    height = 400;
    width = 300;
    speed = 0.3;
    isInSight = false;  // Status ob der Character im Sichtfeld ist
    movingForward = true; // Verfolgt, ob der Endboss sich vorwärts bewegt
    startPosition = 4500;  // Die Startposition des Endbosses


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
        // 'img/4_enemie_boss_chicken/1_walk/G4.png',
        // 'img/4_enemie_boss_chicken/1_walk/G4.png',
        'img/4_enemie_boss_chicken/1_walk/G4.png'
    ];


    constructor() {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.x = this.startPosition;  // Setze den Endboss an seine Startposition
        this.animate();
    }


    checkCharacterInSight(characterX) {
        // Überprüfen, ob der Charakter im Sichtfeld ist
        if (characterX > this.x - 500) {  // Wenn der Character 500px vor dem Endboss ist
            this.isInSight = true;
            this.movingForward = true;  // Endboss bewegt sich vorwärts
        } else {
            this.isInSight = false;
        }
    }


    animate() {
        setInterval(() => {
            if (this.isInSight) {
                this.moveLeft();  // Endboss bewegt sich immer vorwärts, wenn der Charakter im Sichtfeld ist
                this.otherDirection = false;
                this.playAnimation(this.IMAGES_WALKING);
            } else {
                // Bewege den Endboss zurück zu seiner Startposition, wenn er sich nicht im Sichtfeld befindet
                if (this.x < this.startPosition) {
                    this.moveRight();
                    this.otherDirection = true;
                }
                this.playAnimation(this.IMAGES_WALKING);
            }
        }, 1000 / 60);
    }


    // Richtung wechseln, wenn der Charakter aus dem Sichtfeld geht
    toggleDirection() {
        this.movingForward = !this.movingForward;
    }

    
}
