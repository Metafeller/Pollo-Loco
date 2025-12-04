/**
 * Generic status bar component used as base for:
 * - Health bar
 * - Bottle bar
 * - Coin bar
 *
 * Extends DrawableObject and swaps between images based on percentage.
 *
 * @extends DrawableObject
 */
class StatusBar extends DrawableObject {

    IMAGES = [
        '/img/7_statusbars/1_statusbar/2_statusbar_health/blue/0.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/orange/20.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/orange/40.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/blue/60.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/blue/80.png',
        '/img/7_statusbars/1_statusbar/2_statusbar_health/blue/100.png'
    ];

    /** @type {number} Current value in percent (0–100). */
    percentage = 100;

    /**
     * Creates the base status bar and sets it to 100%.
     */
    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.x = 40;
        this.y = 0;
        this.width = 200;
        this.height = 60;
        this.setPercentage(100);
    }

    /**
     * Updates the bar value and selects the correct sprite image.
     *
     * @param {number} percentage - New bar value in percent (0–100).
     * @returns {void}
     */
    setPercentage(percentage) {
        const clamped = Math.max(0, Math.min(percentage, 100));
        this.percentage = clamped;

        const path = this.IMAGES[this.resolveImageIndex()];
        this.img = this.imageCache[path];
    }

    /**
     * Maps the current percentage value to a sprite index.
     *
     * @returns {number} Index within the IMAGES array.
     */
    resolveImageIndex() {
        if (this.percentage >= 100) {
            return 5;
        } else if (this.percentage >= 80) {
            return 4;
        } else if (this.percentage >= 60) {
            return 3;
        } else if (this.percentage >= 40) {
            return 2;
        } else if (this.percentage >= 20) {
            return 1;
        } else {
            return 0;
        }
    }
}
