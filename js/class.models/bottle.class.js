class Bottle extends MovableObject {
    constructor(x, y) {
        super().loadImage('/img/6_salsa_bottle/1_salsa_bottle_on_ground.png');
        this.x = x;
        this.y = y;
        this.width = 70;
        this.height = 60;

         // Pickup-Hitbox etwas enger, damit die Flasche nicht „aus der Luft“ eingesammelt wird.
        this.offset = {
            left:   40, // vorher 10
            right:  40, // vorher 10
            top:    8,
            bottom: 6
        };
    }
}