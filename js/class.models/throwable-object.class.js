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
   * A throwable salsa bottle:
   * - Has its own gravity and ground line
   * - Moves horizontally (left/right) based on facing direction
   * - Spins while flying
   * - Can be reused by the world when it misses and hits the ground
   *
   * @param {number} x - Start X (e.g. character.x + offset).
   * @param {number} y - Start Y (e.g. character.y + offset).
   * @param {boolean} [facingRight=true] - True = throw to the right.
   * @param {World|null} [worldRef=null] - Optional reference to the world for reuse.
   */
  constructor(x, y, facingRight = true, worldRef = null) {
    super().loadImage(this.IMAGES_SPIN[0]);
    this.loadImages(this.IMAGES_SPIN);

    this.x = x;
    this.y = y;
    this.facingRight = !!facingRight;
    this.world = worldRef;

    this.speedY = 6;
    this.throwSpeedX = 10;
    this.groundY = 360;
    this.hasHit = false;
    this.done = false;

    this.offset = {
        left:   10,
        right:  10,
        top:    8,
        bottom: 8
    };

    this.applyGravity();
    this.startThrow();
    this.startSpin();
  }

  /**
   * Ground logic for bottles:
   * Uses the bottle's own groundY instead of Character's ground position.
   *
   * @returns {boolean} True while bottle is above its ground line.
   */
  isAboveGround() {
    if (this.done) return false;
    return this.y < this.groundY;
  }

  /**
   * Starts the horizontal flight:
   * - Moves left/right depending on facingRight
   * - Stops once it reaches the ground or is marked as done/hasHit
   *
   * @returns {void}
   */
  startThrow() {
    this._throwTimer = setInterval(() => {
      if (this.done || this.hasHit) {
        clearInterval(this._throwTimer);
        return;
      }

      const dir = this.facingRight ? 1 : -1;
      this.x += this.throwSpeedX * dir;

      if (!this.isAboveGround()) {
        this.onGroundHit();
      }
    }, 1000 / 60);
  }

  /**
   * Starts the spinning animation while the bottle is in flight.
   *
   * @returns {void}
   */
  startSpin() {
    this._spinTimer = setInterval(() => {
      if (this.done || this.hasHit) {
        clearInterval(this._spinTimer);
        return;
      }
      this.playAnimation(this.IMAGES_SPIN);
    }, 50);
  }

  /**
   * Called when the bottle reaches the ground without a hit:
   * - Marks it as done
   * - Aligns it to groundY
   * - Optionally hands it back to the world for a "reuse" mechanic
   *
   * @returns {void}
   */
  onGroundHit() {
    if (this.done || this.hasHit) return;

    this.done = true;
    this.speedY = 0;
    this.y = this.groundY;

      try {
        if (this.world && typeof this.world.reuseBottleFromThrow === 'function') {
          this.world.reuseBottleFromThrow(this);
        }
      } catch (e) {

    }
  }
}
