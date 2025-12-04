/**
 * Base drawable object for all visual entities.
 * Provides image loading, cached sprite handling and generic drawing helpers.
 */
class DrawableObject {
    /**
     * Default X-position.
     * @type {number}
     */
    x = 120;

    /**
     * Default Y-position.
     * @type {number}
     */
    y = 280;

    /**
     * Currently active image.
     * @type {HTMLImageElement|undefined}
     */
    img;

    /**
     * Default object height (Pepe default).
     * @type {number}
     */
    height = 160;

    /**
     * Default object width (Pepe default).
     * @type {number}
     */
    width = 100;

    /**
     * Simple image cache indexed by image path.
     * @type {Object.<string, HTMLImageElement>}
     */
    imageCache = [];

    /**
     * Current animation frame index.
     * @type {number}
     */
    currentImage = 0;

    /**
     * Loads a single image into this.img.
     *
     * @param {string} path - Image path.
     * @returns {void}
     */
    loadImage(path) {
        const img = new Image();
        img.src = path;
        this.img = img;
    }

    /**
     * Draws the current image on the canvas if it is fully loaded and valid.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context.
     * @returns {void}
     */
    draw(ctx) {
        const img = this.img;

        if (!img || !(img instanceof Image) || !img.complete || img.naturalWidth === 0) {
            return;
        }

        try {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        } catch (e) {

        }
    }

    /**
     * Optional debug frame drawing for selected object types.
     * Currently enabled for Character and Chicken.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context.
     * @returns {void}
     */
    drawFrame(ctx) {
        if (this instanceof Character || this instanceof Chicken) {
            ctx.beginPath();
            ctx.lineWidth = '3';
            ctx.strokeStyle = 'blue';
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.stroke();
        }
    }

    /**
     * Preloads a list of images into the imageCache.
     *
     * @param {string[]} arr - List of image paths.
     * @returns {void}
     */
    loadImages(arr) {
        arr.forEach((path) => {
            const img = new Image();
            img.src = path;
            this.imageCache[path] = img;
        });
    }
}
