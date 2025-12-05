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
  let idx = Math.min(effect.frameIndex, frames.length - 1);
  let path = frames[idx];
  let nextImg = effect.imageCache[path];

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
  let frames = Array.isArray(effect.frames) ? effect.frames : [];
  if (frames.length === 0) {
    effect.done = true;
    return;
  }

  let frameCount = frames.length;
  let safeDuration = Math.max(16, totalDurationMs);
  let frameDelay = Math.max(16, Math.floor(safeDuration / frameCount));

  let firstPath = frames[0];
  effect.img = effect.imageCache[firstPath];

  effect._anim = setInterval(() => stepHitEffectFrame(effect, frames), frameDelay);
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
   * @param {number} [totalDurationMs=300] - Total animation duration in milliseconds.
   */
  constructor(x, y, frames = [], totalDurationMs = 300) {
    super();
    this.x = x;
    this.y = y;
    this.width = 90;
    this.height = 90;

    this.frames = frames;
    this.frameIndex = 0;
    this.done = false;
    this._anim = null;

    this.loadImages(this.frames);

    if (!Array.isArray(this.frames) || this.frames.length === 0) {
      this.done = true;
      return;
    }

    let firstPath = this.frames[0];
    let firstImg = this.imageCache[firstPath];

    if (firstImg && firstImg.complete && firstImg.naturalWidth > 0) {
      startHitEffectAnimation(this, totalDurationMs);
    } else if (firstImg) {
      firstImg.onload = () => startHitEffectAnimation(this, totalDurationMs);
      firstImg.onerror = () => {
        this.done = true;
      };
    } else {
      this.done = true;
    }
  }
}
