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
        this.x = x;

        this.groundY = groundY;
        this.height = targetH;

        this.ASPECT = 1248 / 832;

        this.width = Math.round(this.height * this.ASPECT);
        this.y = this.groundY - this.height;

        this.isOpening = false;
        this.isOpen = false;

        this._aspectFixed = false;

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

        this._openIdx = 0;
        this._openTimer = null;
        this._openStepMs = 160;

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
        if (this.isOpen || this.isOpening) return;
        this.isOpening = true;
        this._openIdx = 0;

        this._openTimer = setInterval(() => {
            if (this._openIdx >= this.FRAMES_OPENING.length) {
                clearInterval(this._openTimer);
                this._openTimer = null;
                this.isOpening = false;
                this.isOpen = true;

                window.dispatchEvent(new CustomEvent('gate:opened'));

                this.img = this.imageCache[this.FRAMES_OPENING[this.FRAMES_OPENING.length - 1]];
                this._aspectFixed = false;
                this._applyAspectOnce();
                return;
            }

            const path = this.FRAMES_OPENING[this._openIdx++];
            this.img = this.imageCache[path];
            this._aspectFixed = false;
            this._applyAspectOnce();
        }, this._openStepMs);
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
