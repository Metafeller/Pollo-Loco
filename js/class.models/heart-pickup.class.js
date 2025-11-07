class HeartPickup extends DrawableObject {
    constructor(x, y, size = 80) {
        super();
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.loadImage('/img/7_statusbars/3_icons/icon_health.png');
        this.offset = { left: 6, right: 6, top: 6, bottom: 6 };
    }

    getBounds() {
        const off = this.offset || { left:0, right:0, top:0, bottom:0 };
        return {
            left:   this.x + off.left,
            top:    this.y + off.top,
            right:  this.x + this.width - off.right,
            bottom: this.y + this.height - off.bottom
        };
    }
}
