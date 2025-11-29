class Coin extends DrawableObject {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.loadImage('/img/7_statusbars/3_icons/icon_coin.png');

        // Runde Coin-Hitbox leicht verkleinern → Einsammeln nur bei sichtbarem Kontakt.
        this.offset = { 
            left: 20, // vorher 8
            right: 20, // vorher 8             
            top: 8,
            bottom: 50  // vorher 8
        };
    }

    getBounds() {
        const off = this.offset || { left: 0, right: 0, top: 0, bottom: 0 };
        return {
            left:   this.x + off.left,
            top:    this.y + off.top,
            right:  this.x + this.width  - off.right,
            bottom: this.y + this.height - off.bottom
        };
    }
}
