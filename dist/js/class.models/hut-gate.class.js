/**
 * Hut gate object in front of the portal:
 * - Plays an opening animation sequence
 * - Exposes a portal rectangle the player can enter
 * - Uses foot-based checks and penetration depth for natural triggering
 *
 * @extends DrawableObject
 */
class HutGate extends DrawableObject {
  /**
   * Creates the hut gate with aspect-correct sizing and portal configuration.
   *
   * @param {number} [x=5400] - Left world coordinate of the gate.
   * @param {number} [groundY=360] - Ground line (bottom), later aligned with world.
   * @param {number} [targetH=260] - Target height; width is derived from the aspect ratio.
   */
  constructor(x = 5400, groundY = 360, targetH = 260) {
    super();
    this._initBaseTransform(x, groundY, targetH);
    this._initStateFlags();
    this._initFrameAssets();
    this._initAnimationTimers();
    this._initPortalMetrics();
  }

  /**
   * Sets base position, size and aspect ratio related values.
   *
   * @private
   * @param {number} x
   * @param {number} groundY
   * @param {number} targetH
   * @returns {void}
   */
  _initBaseTransform(x, groundY, targetH) {
    this.x = x;
    this.groundY = groundY;
    this.height = targetH;

    this.ASPECT = 1248 / 832;
    this.width = Math.round(this.height * this.ASPECT);
    this.y = this.groundY - this.height;
  }

  /**
   * Initialises simple state flags for the gate.
   *
   * @private
   * @returns {void}
   */
  _initStateFlags() {
    this.isOpening = false;
    this.isOpen = false;
    this._aspectFixed = false;
  }

  /**
   * Defines closed/opening frame paths and preloads images.
   *
   * @private
   * @returns {void}
   */
  _initFrameAssets() {
    this.FRAME_CLOSED = '/img/objects/gate_closed_1.png';
    this.FRAMES_OPENING = [
      '/img/objects/gate_open_2.png',
      '/img/objects/gate_open_3.png',
      '/img/objects/gate_open_4.png',
      '/img/objects/gate_open_5.png',
      '/img/objects/gate_open_6.png',
      '/img/objects/gate_open_7.png',
      '/img/objects/gate_open_8.png',
      '/img/objects/gate_open_9.png',
      '/img/objects/gate_open_10.png'
    ];

    this.loadImage(this.FRAME_CLOSED);
    this.loadImages([this.FRAME_CLOSED, ...this.FRAMES_OPENING]);
  }

  /**
   * Sets up animation indices and timer configuration.
   *
   * @private
   * @returns {void}
   */
  _initAnimationTimers() {
    this._openIdx = 0;
    this._openTimer = null;
    this._openStepMs = 160;
  }

  /**
   * Configures portal hitbox and trigger parameters.
   *
   * @private
   * @returns {void}
   */
  _initPortalMetrics() {
    this.portalInsetX = 70;
    this.portalWidth = Math.max(60, this.width - this.portalInsetX * 2);
    this.portalHeight = Math.floor(this.height * 0.62);

    this.triggerDepthPx = 64;
    this.footMarginPx = 14;
  }

  /**
   * Applies aspect-dependent properties once, after image loading.
   * Avoids repeated recalculations every frame.
   *
   * @returns {void}
   * @private
   */
  _applyAspectOnce() {
    if (this._aspectFixed) return;
    this.portalWidth = Math.max(60, this.width - this.portalInsetX * 2);
    this._aspectFixed = true;
  }

  /**
   * Starts the smooth opening animation and fires a global "gate:opened" event
   * once the final frame has been reached.
   *
   * @returns {void}
   */
  open() {
    if (!this._canStartOpening()) return;

    this._beginOpening();
    this._startOpeningTimer();
  }

  /**
   * Returns true if the gate is allowed to start opening.
   *
   * @private
   * @returns {boolean}
   */
  _canStartOpening() {
    return !this.isOpen && !this.isOpening;
  }

  /**
   * Marks internal state as "opening" and resets index.
   *
   * @private
   * @returns {void}
   */
  _beginOpening() {
    this.isOpening = true;
    this._openIdx = 0;
  }

  /**
   * Sets up the interval timer that advances opening frames.
   *
   * @private
   * @returns {void}
   */
  _startOpeningTimer() {
    if (this._openTimer) {
      clearInterval(this._openTimer);
    }

    this._openTimer = setInterval(() => {
      this._handleOpeningTick();
    }, this._openStepMs);
  }

  /**
   * Handles a single tick of the opening animation.
   *
   * @private
   * @returns {void}
   */
  _handleOpeningTick() {
    if (this._openIdx >= this.FRAMES_OPENING.length) {
      this._finishOpening();
      return;
    }

    const path = this.FRAMES_OPENING[this._openIdx++];
    this._setOpeningFrame(path);
  }

  /**
   * Finalises gate opening, fires event and sets final frame.
   *
   * @private
   * @returns {void}
   */
  _finishOpening() {
    if (this._openTimer) {
      clearInterval(this._openTimer);
      this._openTimer = null;
    }

    this.isOpening = false;
    this.isOpen = true;

    window.dispatchEvent(new CustomEvent('gate:opened'));

    const lastPath = this.FRAMES_OPENING[this.FRAMES_OPENING.length - 1];
    this._setOpeningFrame(lastPath);
  }

  /**
   * Updates the current gate sprite and reapplies aspect metrics.
   *
   * @private
   * @param {string} path
   * @returns {void}
   */
  _setOpeningFrame(path) {
    this.img = this.imageCache[path];
    this._aspectFixed = false;
    this._applyAspectOnce();
  }

  /**
   * Called from the world tick to ensure aspect and portal metrics
   * are correctly applied once the images are ready.
   *
   * @returns {void}
   */
  update() {
    this._applyAspectOnce();
  }

  /**
   * Returns the current portal rectangle aligned to the ground line.
   *
   * @returns {{x:number, y:number, width:number, height:number}} Portal hitbox.
   */
  getPortalRect() {
    return {
      x: this.x + this.portalInsetX,
      y: this.groundY - this.portalHeight,
      width: this.portalWidth,
      height: this.portalHeight
    };
  }

  /**
   * Checks if the player character is far enough inside the portal to trigger it.
   * Uses the character's feet position and a configurable penetration depth.
   *
   * @param {Character} character - Player character instance.
   * @returns {boolean} True if the character stands inside the portal area.
   */
  isCharacterInPortal(character) {
    if (!this.isOpen || !character) return false;

    const r = this.getPortalRect();
    const cx = character.x + character.width * 0.5;
    const feetY = character.y + character.height - (this.footMarginPx || 12);

    const insideY = feetY >= r.y && feetY <= (r.y + r.height);
    const leftThreshold = r.x + (this.triggerDepthPx || 0);
    const insideX = cx >= leftThreshold && cx <= (r.x + r.width);

    return insideX && insideY;
  }
}
