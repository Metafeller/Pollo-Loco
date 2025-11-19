// js/class.models/background-object.class.js
class BackgroundObject extends MovableObject {
  width  = 720;
  height = 480;

  constructor(imagePath, x) {
    super().loadImage(imagePath);
    this.x = x;
    this.y = 480 - this.height;
    this._pad = 1; // 1px Überlapp links/rechts gegen Seams
  }

  // Nur für Backgrounds: leicht überlappend und pixelgenau zeichnen
  draw(ctx) {
    // Ziel-Rect (pixelgenau) + Überlapp
    const dx = (this.x | 0) - this._pad;     // |0 = int
    const dy = (this.y | 0);
    const dw = this.width + this._pad * 2;   // links + rechts je 1px
    const dh = this.height;

    try {
      // Quelle = ganzes Bild
      ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height, dx, dy, dw, dh);
    } catch (e) {
      // Bild evtl. noch nicht geladen -> einfach auslassen
    }
  }
}
