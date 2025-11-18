class Coin extends DrawableObject {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.loadImage('/img/7_statusbars/3_icons/icon_coin.png');
    }
}
