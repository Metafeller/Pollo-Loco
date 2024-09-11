class MiniChicken extends MovableObject {
    y = 340;
    height = 80;
    width = 80;
    energy = 10;  // Lebenspunkte

    IMAGES_WALKING = [
        '/img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
        '/img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
        '/img/3_enemies_chicken/chicken_small/1_walk/3_w.png'
    ];

    IMAGES_DEAD = [
        '/img/3_enemies_chicken/chicken_small/2_dead/dead.png'
    ];

    constructor() {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_DEAD);
        this.x = 3000 + Math.random() * 500;  // Zufällige Position
        this.speed = 0.15 + Math.random() * 0.5;
        this.animate();
    }

    hit() {
        this.energy = 0;  // Setze die Lebensenergie auf 0
        this.die();  // Lasse das MiniChicken sterben
    }

    die() {
        this.loadImage(this.IMAGES_DEAD[0]);  // Zeige das Bild des toten Mini-Chickens
        this.speed = 0;  // Stoppe die Bewegung
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
