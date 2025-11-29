class StatusBar extends DrawableObject {

    IMAGES = [
        '/img/7_statusbars/1_statusbar/2_statusbar_health/blue/0.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/orange/20.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/orange/40.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/blue/60.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/blue/80.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png' // Bild Nr. 5
    ];

    percentage = 100;

    constructor() {
        super(); // von dem übergeordneten Objekt initialisieren...
        this.loadImages(this.IMAGES);
        this.x = 40;
        this.y = 0;
        this.width = 200;
        this.height = 60;
        this.setPercentage(100);
    }

    // setPercentage(50);
    setPercentage(percentage) {
    let clamped = Math.max(0, Math.min(percentage, 100));
    this.percentage = clamped;

    let path = this.IMAGES[this.resolveImageIndex()];
    this.img = this.imageCache[path];
    }

        resolveImageIndex() {
            if (this.percentage >= 100) {
                return 5; // 100
            } else if (this.percentage >= 80) {
                return 4; // 80
            } else if (this.percentage >= 60) {
                return 3; // 60
            } else if (this.percentage >= 40) {
                return 2; // 40
            } else if (this.percentage >= 20) {
                return 1; // 20
            } else {
                return 0; // 0
            }
        }

}