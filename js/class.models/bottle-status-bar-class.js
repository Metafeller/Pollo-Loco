class BottleStatusBar extends StatusBar {
    IMAGES = [
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/0.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/20.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/40.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/60.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/80.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/100.png'
    ];

    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.setPercentage(0); // Startet bei 0 gesammelten Flaschen
        this.x = 40; // Position der StatusBar
        this.y = 60; // y-Koordinate
    }

    /**
     * Setzt den Prozentsatz der Flaschen in der StatusBar
     * @param {number} percentage - Der aktuelle Prozentsatz der gesammelten Flaschen
     */
    setPercentage(percentage) {
        this.percentage = percentage; // Speichert den aktuellen Prozentwert
        let path = this.IMAGES[this.resolveImageIndex()]; // Bestimme das entsprechende Bild basierend auf dem Prozentsatz
        this.img = this.imageCache[path]; // Lade das entsprechende Bild
    }

    /**
     * Bestimmt das passende Bild basierend auf dem Prozentsatz
     * @returns {number} Der Index des Bildes im IMAGES-Array
     */
    resolveImageIndex() {
        if (this.percentage >= 100) {
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
            return 0; // Zeige das Bild für 0% an
        }
    }
}

