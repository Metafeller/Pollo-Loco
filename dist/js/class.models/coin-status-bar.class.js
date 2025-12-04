/**
 * Status bar that visualises the collected coin progress (0–100%).
 *
 * @extends StatusBar
 */
class CoinStatusBar extends StatusBar {
    /**
     * Coin status bar sprites for 0–100% in 20% steps.
     * @type {string[]}
     */
    IMAGES = [
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/0.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/20.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/40.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/60.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/80.png',
        '/img/7_statusbars/1_statusbar/1_statusbar_coin/blue/100.png'
    ];

    /**
     * Creates the coin status bar at the fixed HUD position.
     */
    constructor() {
        super();
        this.loadImages(this.IMAGES);
        this.setPercentage(0);
        this.x = 40;
        this.y = 112;
        this.width = 200;
        this.height = 60;
    }

    /**
     * Updates the stored percentage and selects the proper sprite.
     *
     * @param {number} percentage - Current coin progress (0–100).
     * @returns {void}
     */
    setPercentage(percentage) {
        this.percentage = Math.max(0, Math.min(100, percentage));
        let index = this.resolveImageIndex();
        let path = this.IMAGES[index];
        this.img = this.imageCache[path];
    }

    /**
     * Resolves the correct sprite index for the current percentage.
     *
     * @returns {number} Sprite index in the IMAGES array.
     */
    resolveImageIndex() {
        if (this.percentage >= 100) return 5;
        if (this.percentage >= 80)  return 4;
        if (this.percentage >= 60)  return 3;
        if (this.percentage >= 40)  return 2;
        if (this.percentage >= 20)  return 1;
        return 0;
    }
}
