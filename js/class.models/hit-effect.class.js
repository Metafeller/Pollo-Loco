/**
 * Short-lived hit effect (e.g. bottle splash) that plays
 * through a series of frames and then marks itself as done.
 *
 * @extends DrawableObject
 */
class HitEffect extends DrawableObject {
  /**
   * Creates a new hit effect at the given canvas position.
   *
   * @param {number} x - X-position on the canvas.
   * @param {number} y - Y-position on the canvas.
   * @param {string[]} [frames=[]] - Image paths for the splash frames.
   * @param {number} [totalDurationMs=300] - Total animation duration in milliseconds.
   */
  constructor(x, y, frames = [], totalDurationMs = 300) {
    super();
    this.x = x;
    this.y = y;
    this.width = 90;  // tune if needed
    this.height = 90; // tune if needed

    this.frames = frames;
    this.frameIndex = 0;
    this.done = false;

    // Preload all frames
    this.loadImages(this.frames);

    /**
     * Starts the frame animation once the first image is ready.
     * Advances frames in equal time slices until the end is reached.
     */
    const startAnimation = () => {
        const frameCount = Math.max(1, this.frames.length);
        const frameDelay = Math.max(16, Math.floor(totalDurationMs / Math.max(1, frameCount)));

        // Set initial image (safe)
        if (this.frames.length > 0) {
            const firstPath = this.frames[0];
            this.img = this.imageCache[firstPath];
        }

        this._anim = setInterval(() => {
            this.frameIndex++;
            const idx = Math.min(this.frameIndex, this.frames.length - 1);
            const path = this.frames[idx];
            const nextImg = this.imageCache[path];

            if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
                this.img = nextImg;
            }

            if (this.frameIndex >= this.frames.length - 1) {
                this.done = true;
                clearInterval(this._anim);
            }
        }, frameDelay);
    };

    // If there are no frames, finish immediately
    if (!Array.isArray(this.frames) || this.frames.length === 0) {
        this.done = true;
    } else {
        const firstPath = this.frames[0];
        const firstImg = this.imageCache[firstPath];

        // Start when the first image is ready (or immediately if cached)
        if (firstImg && firstImg.complete && firstImg.naturalWidth > 0) {
            startAnimation();
        } else if (firstImg) {
            firstImg.onload = () => startAnimation();
            firstImg.onerror = () => { this.done = true; };
        } else {
            this.done = true;
        }
    }
  }
}
