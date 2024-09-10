class Endboss extends MovableObject {
    y = 60;
    height = 400;
    width = 300;
    speed = 0.3;
    isInSight = false;  // Status ob der Character im Sichtfeld ist
    movingForward = true; // Verfolgt, ob der Endboss sich vorwärts bewegt


    IMAGES_WALKING = [
        'img/4_enemie_boss_chicken/1_walk/G1.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G4.png'
    ];


    constructor() {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.x = 4500;  // Platzierung des Endbosses
        this.animate();
    }


    checkCharacterInSight(characterX) {
        // Überprüfen, ob der Charakter im Sichtfeld ist
        if (characterX > this.x - 500) {  // Wenn der Character 500px vor dem Endboss ist
            this.isInSight = true;
        } else {
            this.isInSight = false;
        }
    }


    animate() {
        setInterval(() => {
            if (this.isInSight) {
                if (this.movingForward) {
                    this.moveLeft();  // Vorwärts bewegen
                    this.otherDirection = false;
                } else {
                    this.moveRight();  // Rückwärts bewegen
                    this.otherDirection = true;
                }
                this.playAnimation(this.IMAGES_WALKING);  // Abspielen der Geh-Animation
            }
        }, 1000 / 60);
    }


    // Richtung wechseln, wenn der Charakter aus dem Sichtfeld geht
    toggleDirection() {
        this.movingForward = !this.movingForward;
    }

    
}
