class HitEffect extends DrawableObject {
  /**
   * @param {number} x      - canvas x position
   * @param {number} y      - canvas y position
   * @param {string[]} frames - image paths for the splash frames
   * @param {number} totalDurationMs - total duration for the animation
   */
  constructor(x, y, frames = [], totalDurationMs = 300) {
    super();
    this.x = x;
    this.y = y;
    this.width = 90;   // tune if needed
    this.height = 90;  // tune if needed

    this.frames = frames;
    this.frameIndex = 0;
    this.done = false;
    

    // Preload all frames
    this.loadImages(this.frames);

    // Helper: start animation only when first frame is ready
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
        // Start when first image is ready (or immediately if already cached)
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
