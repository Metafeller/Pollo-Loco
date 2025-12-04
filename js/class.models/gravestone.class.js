/**
 * Static gravestone sprite that appears at the player's death position.
 * The width is adjusted once the image dimensions are known to avoid distortion.
 *
 * @extends DrawableObject
 */
class Gravestone extends DrawableObject {
    /**
     * Creates a gravestone aligned to the given position.
     *
     * @param {number} x - Left world coordinate.
     * @param {number} y - Top world coordinate.
     * @param {number} [w=120] - Initial width (before aspect correction).
     * @param {number} [h=160] - Target height (final height in pixels).
     */
    constructor(x, y, w = 120, h = 160) {
        super();
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        this.FRAME = '/img/objects/1_gravestone-pepe.png';
        this.loadImage(this.FRAME);

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
