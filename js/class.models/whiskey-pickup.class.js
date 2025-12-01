class WhiskeyPickup extends DrawableObject {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
        this.width = 40;   // leicht kleiner gerendert
        this.height = 52;
        this.loadImage('/img/objects/whiskey_bottle_on_ground.png');

        // Etwas enger, damit kein „Luft-Whiskey“ gesammelt wird.
        this.offset = { 
            left: 8, 
            right: 8, 
            top: 8, 
            bottom: 4 
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
