class MiniChicken extends MovableObject {
    y = 370; // Die Y-Koordinate wird etwas niedriger sein, um das Mini-Chicken kleiner darzustellen
    height = 50;
    width = 70;
    IMAGES_WALKING = [
        '/img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
        '/img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
        '/img/3_enemies_chicken/chicken_small/1_walk/3_w.png'
    ];


    constructor() {
        super().loadImage('/img/3_enemies_chicken/chicken_small/1_walk/1_w.png')
        this.loadImages(this.IMAGES_WALKING);

        this.x = 5000 + Math.random() * 500;
        this.speed = 0.2 + Math.random() * 0.3; // Mini-Chicken haben eine etwas schnellere Geschwindigkeit

        this.animate();
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