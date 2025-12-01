class MiniChicken extends MovableObject {
    y = 340;
    height = 80;
    width = 80;
    energy = 10;  // Lebenspunkte

    spawnedByBoss = false; // true if spawned during Endboss fight

    IMAGES_WALKING = [
        '/img/3_enemies_chicken/chicken_small/1_walk/1_w.png',
        '/img/3_enemies_chicken/chicken_small/1_walk/2_w.png',
        '/img/3_enemies_chicken/chicken_small/1_walk/3_w.png'
    ]; 

    IMAGES_DEAD = [
        '/img/3_enemies_chicken/chicken_small/2_dead/dead.png'
    ];

    constructor(x = null, fromBoss = false) {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_DEAD);

        // ✅ sauber: Minis vom Endboss markieren
        this.spawnedByBoss = !!fromBoss;

        // injected x, sonst Fallback (falls du später normale Minis irgendwo spawnst)
        this.x = (typeof x === 'number') ? x : (3000 + Math.random() * 500);
        this.speed = 1.15 + Math.random() * 0.5; // vorher this.speed = 0.15

        this.offset = {
            left:   20,
            right:  20,
            top:    24,
            bottom: 10
        };

        this.animate();
    }

    hit() {
        this.energy = 0;
        this.die();
    }

    die() {
        this.dead = true;
        this.speed = 0;
        this.loadImage(this.IMAGES_DEAD[0]);
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
