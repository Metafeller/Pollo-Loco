class Gravestone extends DrawableObject {
    /**
     * @param {number} x Left
     * @param {number} y Top
     * @param {number} w Width  (initial; wird nach Bild-Ladeevent durch Ratio ersetzt)
     * @param {number} h Height (finale Zielhöhe)
     */
    constructor(x, y, w = 120, h = 160) { // vorher 120 x 160
        super();
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        this.FRAME = '/img/objects/1_gravestone-pepe.png';
        this.loadImage(this.FRAME);

        // Verzerrungen vermeiden: Breite nach natürlichem Ratio des Bildes setzen.
        // Warten, bis Image Maße hat:
        const fix = setInterval(() => {
            const img = this.img;
            if (img && img.naturalWidth && img.naturalHeight) {
                const ratio = img.naturalWidth / img.naturalHeight;
                this.width = Math.round(this.height * ratio);
                clearInterval(fix);
            }
        }, 30);
    }
}
