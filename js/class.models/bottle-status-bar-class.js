class BottleStatusBar extends StatusBar {
    IMAGES = [
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/0.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/20.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/40.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/60.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/80.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/100.png'
    ];

    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.setPercentage(0); // Startet bei 0 gesammelten Flaschen
        this.x = 40;
        this.y = 60;
    }
}
