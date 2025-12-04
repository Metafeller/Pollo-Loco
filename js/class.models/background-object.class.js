/**
 * Background tile that fills the horizon behind the world.
 * Uses a small horizontal overlap to hide seams between tiles.
 *
 * @extends MovableObject
 */
class BackgroundObject extends MovableObject {
  width = 720;
  height = 480;

  /**
   * Creates a new background object at a given X-position.
   *
   * @param {string} imagePath - Path to the background image.
   * @param {number} x - X position where the tile starts.
   */
  constructor(imagePath, x) {
    super().loadImage(imagePath);
    this.x = x;
    this.y = 480 - this.height;
    this._pad = 1;
  }

  /**
   * Draws the background tile with a small horizontal overlap
   * to avoid visible seams between adjacent tiles.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas 2D rendering context.
   * @returns {void}
   */
  draw(ctx) {
    
    let dx = (this.x | 0) - this._pad;
    let dy = (this.y | 0);
    let dw = this.width + this._pad * 2;
    let dh = this.height;

    try {

      ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height, dx, dy, dw, dh);
    } catch (e) {
      
    }
  }
}