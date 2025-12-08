/**
 * Advances a single animation step for the hit effect
 * and marks it as done on the last frame.
 *
 * @param {HitEffect} effect
 * @param {string[]} frames
 * @returns {void}
 */
function stepHitEffectFrame(effect, frames) {
  effect.frameIndex++;
  const idx = Math.min(effect.frameIndex, frames.length - 1);
  const path = frames[idx];
  const nextImg = effect.imageCache[path];

  if (nextImg && nextImg.complete && nextImg.naturalWidth > 0) {
    effect.img = nextImg;
  }

  if (effect.frameIndex >= frames.length - 1) {
    effect.done = true;
    clearInterval(effect._anim);
  }
}

/**
 * Starts the frame animation once the first image is ready.
 * Advances frames in equal time slices until the end is reached.
 *
 * @param {HitEffect} effect
 * @param {number} totalDurationMs
 * @returns {void}
 */
function startHitEffectAnimation(effect, totalDurationMs) {
  const frames = Array.isArray(effect.frames) ? effect.frames : [];
  if (frames.length === 0) {
    effect.done = true;
    return;
  }

  const frameCount = frames.length;
  const safeDuration = Math.max(16, totalDurationMs);
  const frameDelay = Math.max(16, Math.floor(safeDuration / frameCount));

  const firstPath = frames[0];
  effect.img = effect.imageCache[firstPath];

  effect._anim = setInterval(
    () => stepHitEffectFrame(effect, frames),
    frameDelay
  );
}

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
   * @param {number} [totalDurationMs=300] - Total animation duration in ms.
   */
  constructor(x, y, frames = [], totalDurationMs = 300) {
    super();

    this.initPosition(x, y);
    this.initAnimationState(frames);

    this.loadImages(this.frames);
    this.setupAnimationStart(totalDurationMs);
  }

  /**
   * Initialises position and default size of the effect.
   *
   * @param {number} x
   * @param {number} y
   * @returns {void}
   */
  initPosition(x, y) {
    this.x = x;
    this.y = y;
    this.width = 90;
    this.height = 90;
  }

  /**
   * Initialises animation state for the hit effect.
   *
   * @param {string[]} frames
   * @returns {void}
   */
  initAnimationState(frames) {
    this.frames = Array.isArray(frames) ? frames : [];
    this.frameIndex = 0;
    this.done = false;
    this._anim = null;
  }

  /**
   * Decides whether to start the animation or mark the effect as done.
   *
   * @param {number} totalDurationMs
   * @returns {void}
   */
  setupAnimationStart(totalDurationMs) {
    if (!this.frames.length) {
      this.markDone();
      return;
    }

    const firstPath = this.frames[0];
    const firstImg = this.imageCache[firstPath];

    if (!firstImg) {
      this.markDone();
      return;
    }

    if (this.isImageReady(firstImg)) {
      this.startAnimation(totalDurationMs);
      return;
    }

    this.attachImageHandlers(firstImg, totalDurationMs);
  }

  /**
   * Returns true if the image is loaded and ready to render.
   *
   * @param {HTMLImageElement} img
   * @returns {boolean}
   */
  isImageReady(img) {
    return !!(img && img.complete && img.naturalWidth > 0);
  }

  /**
   * Starts the hit effect animation using the helper function.
   *
   * @param {number} totalDurationMs
   * @returns {void}
   */
  startAnimation(totalDurationMs) {
    startHitEffectAnimation(this, totalDurationMs);
  }

  /**
   * Attaches load/error handlers to the first frame image.
   *
   * @param {HTMLImageElement} img
   * @param {number} totalDurationMs
   * @returns {void}
   */
  attachImageHandlers(img, totalDurationMs) {
    img.onload = () => this.startAnimation(totalDurationMs);
    img.onerror = () => this.markDone();
  }

  /**
   * Marks the effect as finished and clears any running animation interval.
   *
   * @returns {void}
   */
  markDone() {
    this.done = true;
    if (this._anim) {
      clearInterval(this._anim);
      this._anim = null;
    }
  }
}
