class WhiskeyCounter extends DrawableObject {
    /**
     * Simple HUD element that shows:
     * - A whiskey icon
     * - The current amount as "x N" text
     * Drawn on the left side under the coin bar.
     */
    constructor() {
        super();
        this.img = new Image();
        this.img.src = '/img/7_statusbars/3_icons/icon_whiskey.png';

        /** @type {number} Current whiskey count. */
        this.count = 0;
        this.x = 38;
        this.y = 176;
        this.width = 48;
        this.height = 48;
    }

    /**
     * Updates the internal whiskey count.
     *
     * @param {number} n - New count value.
     * @returns {void}
     */
    setCount(n) {
        this.count = Math.max(0, n | 0);
    }

    /**
     * Draws the whiskey icon and its count.
     *
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context.
     * @returns {void}
     */
    draw(ctx) {
        if (!ctx) return;
        try {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } catch (e) {}

        ctx.save();
        ctx.fillStyle = '#000000ff';
        ctx.font = "40px 'zabars', Arial, Helvetica, sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText('x ' + this.count, this.x + this.width + 8, this.y + this.height - 6);
        ctx.restore();
    }
}
