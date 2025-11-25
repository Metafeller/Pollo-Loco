// class ThrowableObject extends MovableObject {

//     constructor(x, y, facingRight = true) {
//         super().loadImage('/img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png');
//         this.x = x;
//         this.y = y;
//         this.width = 60;
//         this.height = 70;

//         this.facingRight = facingRight;
//         this.spawnX = x;
//         this.maxDistance = 420;   // kürzer, bleibt im Sichtfeld
//         this.done = false;

//         this.throw();
//     }

//     throw() {
//         // flacherer Wurf
//         this.speedY = 10;         // weniger Steigflug
//         this.acceleration = 1.9;  // sanftere Kurve
//         this.applyGravity();

//         // horizontale Bewegung etwas langsamer -> bessere Trefferchance
//         this._interval = setInterval(() => {
//             this.x += (this.facingRight ? 8 : -8); // vorher 12
//             if (Math.abs(this.x - this.spawnX) > this.maxDistance) {
//                 this.done = true;
//                 clearInterval(this._interval);
//             }
//         }, 1000 / 60);
//     }
// }

class ThrowableObject extends MovableObject {
  width = 60;
  height = 60;

  IMAGES_SPIN = [
    '/img/6_salsa_bottle/bottle_rotation/1_bottle_rotation.png',
    '/img/6_salsa_bottle/bottle_rotation/2_bottle_rotation.png',
    '/img/6_salsa_bottle/bottle_rotation/3_bottle_rotation.png',
    '/img/6_salsa_bottle/bottle_rotation/4_bottle_rotation.png'
  ];

  /**
   * @param {number} x         Start-X (z.B. character.x + 100)
   * @param {number} y         Start-Y (z.B. character.y + 80)
   * @param {boolean} facingRight  true = Wurf nach rechts
   * @param {World|null} worldRef  optionale World-Referenz (für Reuse-Feature)
   */
  constructor(x, y, facingRight = true, worldRef = null) {
    super().loadImage(this.IMAGES_SPIN[0]);
    this.loadImages(this.IMAGES_SPIN);

    this.x = x;
    this.y = y;
    this.facingRight = !!facingRight;
    this.world = worldRef;

    this.speedY = 6;          // Wurfhöhe // vorher 18
    this.throwSpeedX = 10;    // horizontale Fluggeschwindigkeit // vorher 12
    this.groundY = 360;       // <--- bei Bedarf optisch feinjustieren
    this.hasHit = false;      // Kollision mit Gegner?
    this.done = false;        // World benutzt das, um aufzuräumen

    this.applyGravity();
    this.startThrow();
    this.startSpin();
  }

  /** Boden-Logik nur für Flaschen */
  isAboveGround() {
    if (this.done) return false;
    return this.y < this.groundY;
  }

  /** horizontale Flugbahn */
  startThrow() {
    this._throwTimer = setInterval(() => {
      if (this.done || this.hasHit) {
        clearInterval(this._throwTimer);
        return;
      }

      const dir = this.facingRight ? 1 : -1;
      this.x += this.throwSpeedX * dir;

      // Boden erreicht?
      if (!this.isAboveGround()) {
        this.onGroundHit();
      }
    }, 1000 / 60);
  }

  /** Spin-Animation während des Flugs */
  startSpin() {
    this._spinTimer = setInterval(() => {
      if (this.done || this.hasHit) {
        clearInterval(this._spinTimer);
        return;
      }
      this.playAnimation(this.IMAGES_SPIN);
    }, 50);
  }

  /** Wird aufgerufen, wenn die Flasche den Boden erreicht */
  onGroundHit() {
    if (this.done || this.hasHit) return;

    this.done = true;
    this.speedY = 0;
    this.y = this.groundY;

    // Optional-Bonus: verfehlte Flasche wiederverwendbar machen
    try {
      if (this.world && typeof this.world.reuseBottleFromThrow === 'function') {
        this.world.reuseBottleFromThrow(this);
      }
    } catch (e) {
      // bewusst leer – keine harten Crashes
    }
  }
}
