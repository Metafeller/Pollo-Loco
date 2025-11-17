class CoinStatusBar extends StatusBar {
    IMAGES = [
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/0.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/20.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/40.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/60.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/80.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/100.png'
    ];

    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.setPercentage(0);
        this.x = 40;
        this.y = 120;      // unter Bottle-Bar
        this.width = 200;
        this.height = 60;
    }

    setPercentage(percentage) {
        this.percentage = Math.max(0, Math.min(100, percentage));
        let index = this.resolveImageIndex();
        let path = this.IMAGES[index];
        this.img = this.imageCache[path];
    }

    resolveImageIndex() {
        if (this.percentage >= 100) return 5;
        if (this.percentage >= 80)  return 4;
        if (this.percentage >= 60)  return 3;
        if (this.percentage >= 40)  return 2;
        if (this.percentage >= 20)  return 1;
        return 0;
    }
}