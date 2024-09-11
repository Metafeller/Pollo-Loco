class Character extends MovableObject {

    height = 280;
    y = 80;
    speed = 5;

    invulnerable = false;  // Unverwundbarkeits-Status
    invulnerabilityDuration = 1500;  // Dauer der Unverwundbarkeit in Millisekunden

    IMAGES_WALKING = [
        '/img/2_character_pepe/2_walk/W-21.png',
        '/img/2_character_pepe/2_walk/W-22.png',
        '/img/2_character_pepe/2_walk/W-23.png',
        '/img/2_character_pepe/2_walk/W-24.png',
        '/img/2_character_pepe/2_walk/W-25.png',
        '/img/2_character_pepe/2_walk/W-26.png'
    ];

    IMAGES_JUMPING = [
        '/img/2_character_pepe/3_jump/J-31.png',
        '/img/2_character_pepe/3_jump/J-32.png',
        '/img/2_character_pepe/3_jump/J-33.png',
        '/img/2_character_pepe/3_jump/J-34.png',
        '/img/2_character_pepe/3_jump/J-35.png',
        '/img/2_character_pepe/3_jump/J-36.png',
        '/img/2_character_pepe/3_jump/J-37.png',
        '/img/2_character_pepe/3_jump/J-38.png',
        '/img/2_character_pepe/3_jump/J-39.png'
    ];

    IMAGES_DEAD = [
        '/img/2_character_pepe/5_dead/D-51.png',
        '/img/2_character_pepe/5_dead/D-52.png',
        '/img/2_character_pepe/5_dead/D-53.png',
        '/img/2_character_pepe/5_dead/D-54.png',
        '/img/2_character_pepe/5_dead/D-55.png',
        '/img/2_character_pepe/5_dead/D-56.png',
        '/img/2_character_pepe/5_dead/D-57.png'
    ];

    IMAGES_HURT = [
        '/img/2_character_pepe/4_hurt/H-41.png',
        '/img/2_character_pepe/4_hurt/H-42.png',
        '/img/2_character_pepe/4_hurt/H-43.png'
    ];

    world;
    walking_sound = new Audio('/audio/stamping.mp3');
    walking_sound_back = new Audio('/audio/stamping.mp3');

    constructor() {
        super().loadImage('/img/2_character_pepe/2_walk/W-21.png');
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_JUMPING);
        this.loadImages(this.IMAGES_DEAD);
        this.loadImages(this.IMAGES_HURT);
        this.applyGravity();
        this.animate();
    }

    animate() {

        setInterval(() => {
            this.walking_sound.pause();
            // Bewegung nach rechts, aber nur bis zum Level-Ende
            if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
                this.moveRight();
                this.otherDirection = false;
                this.walking_sound.play();

            }   else if (this.x >= this.world.level.level_end_x) {
                // Charakter soll am Ende stoppen und nicht weiter bewegen! Siehe unter level.class.js bei level_end_x = 3500;
                this.x = this.world.level.level_end_x;
            }

            // Bewegung nach links, aber nur bis zur Position 0
            if (this.world.keyboard.LEFT && this.x > 0) {
                this.moveLeft();
                this.otherDirection = true;
                this.walking_sound_back.play();
            }

            if(this.world.keyboard.SPACE && !this.isAboveGround()) {
                this.jump();
            }

            // Kamera-Bewegung basierend auf der Charakter-Position
            this.world.camera_x = -this.x + 100;
        }, 1000 / 60);


        setInterval(() => {
        
            if (this.isDead()) {
                this.playAnimation(this.IMAGES_DEAD);

            } else if (this.isHurt()) {
                this.playAnimation(this.IMAGES_HURT);

            } else if (this.isAboveGround()) {
                this.playAnimation(this.IMAGES_JUMPING);
            } else {
                if (this.world.keyboard.RIGHT || this.world.keyboard.LEFT) {
                    this.x += this.speed;

                    // walk animation
                    this.playAnimation(this.IMAGES_WALKING);
                }
            }   
        }, 50);
    }

    jump() {
        this.speedY = 25;
    }

    // Methode, um den Charakter für eine bestimmte Zeit unverwundbar zu machen
    makeInvulnerable() {
        this.invulnerable = true;
        setTimeout(() => {
            this.invulnerable = false;  // Nach Ablauf der Zeit wird der Charakter wieder verwundbar
        }, this.invulnerabilityDuration);
    }

    isAboveGround() {
        return this.y < 150;  // Überprüft, ob der Charakter sich über dem Boden befindet (Grenze kann angepasst werden)
    }

    checkIfJumpedOnEnemy(enemy) {
        return this.isAboveGround() && this.speedY < 0 && this.isColliding(enemy);  
    }

}