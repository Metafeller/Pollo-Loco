class EndbossStatusBar extends StatusBar {
    IMAGES = [
        '/img/7_statusbars/2_statusbar_endboss/orange/orange0.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange20.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange40.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange60.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange80.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange100.png'
    ];

    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.setPercentage(100);  // Der Endboss startet mit 100% Leben.
        this.x = 500;  // Platzierung rechts oben im Canvas.
        this.y = 5;
    }

    setPercentage(percentage) {
        this.percentage = percentage;  // Speichere den aktuellen Prozentwert
        let path = this.IMAGES[this.resolveImageIndex()];  // Wähle das passende Bild basierend auf dem Prozentsatz
        this.img = this.imageCache[path];  // Lade das Bild der StatusBar
    }

    resolveImageIndex() {
        if (this.percentage == 100) {
            return 5;
        } else if (this.percentage > 80) {
            return 4;
        } else if (this.percentage > 60) {
            return 3;
        } else if (this.percentage > 40) {
            return 2;
        } else if (this.percentage > 20) {
            return 1;
        } else {
            return 0;
        }
    }
}
