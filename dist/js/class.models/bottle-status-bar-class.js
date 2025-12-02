/**
 * Status bar that visualises the number of collected bottles (0–100%).
 *
 * @extends StatusBar
 */
class BottleStatusBar extends StatusBar {
    /**
     * Sprite frames for bottle fill levels from 0 to 100 percent.
     * @type {string[]}
     */
    IMAGES = [
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/0.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/20.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/orange/40.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/60.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/80.png',
        '/img/7_statusbars/1_statusbar/3_statusbar_bottle/blue/100.png'
    ];

    /**
     * Creates a new bottle status bar at the fixed HUD position.
     */
    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.setPercentage(0); // start at 0 collected bottles
        this.x = 40;           // HUD x-position
        this.y = 60;           // HUD y-position
    }

    /**
     * Updates the bottle fill percentage and selects the matching sprite.
     *
     * @param {number} percentage - Current fill percentage (0–100).
     * @returns {void}
     */
    setPercentage(percentage) {
        this.percentage = percentage;
        let index = this.resolveImageIndex();
        let path = this.IMAGES[index];
        this.img = this.imageCache[path];
    }

    /**
     * Resolves the sprite index for the current percentage.
     *
     * @returns {number} Index of the selected image inside IMAGES.
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
            return 0; // show the "empty" sprite at 0%
        }
    }
}
