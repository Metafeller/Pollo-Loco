class WhiskeyPickup extends DrawableObject {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 40;   // leicht kleiner gerendert
        this.height = 52;
        this.loadImage('/img/objects/whiskey_bottle_on_ground.png');
    }
}
