class Chicken extends MovableObject {
    y = 340;
    height = 80;
    width = 80;
    IMAGES_WALKING = [
        '/img/3_enemies_chicken/chicken_normal/1_walk/1_w.png',
        '/img/3_enemies_chicken/chicken_normal/1_walk/2_w.png',
        '/img/3_enemies_chicken/chicken_normal/1_walk/3_w.png'
    ];

    IMAGES_DEAD = [
        '/img/3_enemies_chicken/chicken_normal/2_dead/dead.png'
    ];

    constructor() {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_DEAD);

        this.x = 4200 + Math.random() * 700;  // Zufällige Position
        this.speed = 0.15 + Math.random() * 0.5;
        this.animate();
    }


    die() {
        this.loadImage(this.IMAGES_DEAD[0]);  // Lässt das Huhn sterben
    }


    animate() {
        setInterval(() => {
            this.moveLeft();
        }, 1000 / 60);

        

        setInterval(() => {
            this.playAnimation(this.IMAGES_WALKING);
        }, 200);
    }

}