class MiniChicken extends MovableObject {
    y = 370; // Die Y-Koordinate wird etwas niedriger sein, um das Mini-Chicken kleiner darzustellen
    height = 50;
    width = 70;
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

    die() {
        this.loadImage(this.IMAGES_DEAD[0]);  // Lässt das Huhn sterben
    }


    animate() {
        setInterval(() => {
            this.moveLeft();  // Die Mini-Chicken bewegen sich von rechts nach links
        }, 1000 / 60);

        setInterval(() => {
            this.playAnimation(this.IMAGES_WALKING);  // Spiele die Laufanimation ab
        }, 200);
    }

}