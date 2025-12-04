/**
 * Status bar for the Endboss health, shown at the top-right of the HUD.
 *
 * @extends StatusBar
 */
class EndbossStatusBar extends StatusBar {
    /**
     * Endboss health sprites from empty to full.
     * @type {string[]}
     */
    IMAGES = [
        '/img/7_statusbars/2_statusbar_endboss/orange/orange0.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange20.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange40.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange60.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange80.png',
        '/img/7_statusbars/2_statusbar_endboss/orange/orange100.png'
    ];

    /**
     * Creates the Endboss status bar at the fixed HUD position.
     * The boss starts at 100% health.
     */
    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.setPercentage(100); 
        this.x = 500;
        this.y = 5;
    }

    /**
     * Updates the internal percentage and selects the matching health sprite.
     *
     * @param {number} percentage - Current Endboss health in percent (0–100).
     * @returns {void}
     */
    setPercentage(percentage) {
        this.percentage = percentage;
        const path = this.IMAGES[this.resolveImageIndex()];
        this.img = this.imageCache[path];
    }

    /**
     * Resolves the correct image index for the current percentage.
     *
     * @returns {number} Index of the sprite inside IMAGES.
     */
    resolveImageIndex() {
        if (this.percentage == 100) {
            return 5;
        } else if (this.percentage > 80) {
            return 5;
        } else if (this.percentage > 60) {
            return 4;
        } else if (this.percentage > 40) {
            return 3;
        } else if (this.percentage > 20) {
            return 2;
        } else if (this.percentage > 0) {
            return 1;
        } else {
            return 0;
        }
    }
}
