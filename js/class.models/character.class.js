class Character extends MovableObject {

    height = 280;
    y = 80;
    speed = 10;
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
        '/img/2_character_pepe/3_jump/J-39.png',
    ];


    world;
    walking_sound = new Audio('audio/stamping.mp3');
    walking_sound_back = new Audio('audio/fear-back.mp3');

    constructor() {
        super().loadImage('/img/2_character_pepe/2_walk/W-21.png');
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_JUMPING);
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
        
            if(this.isAboveGround()) {
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
}