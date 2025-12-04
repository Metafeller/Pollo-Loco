class StoryBillboard extends DrawableObject {
    /**
     * Story billboard that shows a short dialogue sequence near the hut gate.
     * Follows the gate position and plays a frame-based slideshow with audio.
     *
     * @param {number} x - Initial X position (world coordinates).
     * @param {number} y - Initial Y position (top).
     * @param {number} w - Initial width (will be adjusted by aspect ratio).
     * @param {number} h - Target height (aspect ratio will adjust width).
     * @param {HutGate|null} anchorGate - Optional gate to follow.
     */
    constructor(x = 5400, y = 120, w = 360, h = 180, anchorGate = null) {
        super();
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        /** @type {HutGate|null} Gate this billboard is anchored to. */
        this.anchorGate = anchorGate;

        this.offsetX = -24;
        this.offsetY = 72;

        this.visible = false;
        this._aspectFixed = false;

        this.FRAMES = [
            '/img/objects/story/talk_closed_f1.png',
            '/img/objects/story/talk_closed_f1.png',
            '/img/objects/story/talk_pepe_help_f2.png',
            '/img/objects/story/talk_farmer_f3.png',
            '/img/objects/story/talk_pepe_help_f4.png',
            '/img/objects/story/talk_farmer_f5.png',
            '/img/objects/story/talk_closed_f1.png'
        ];
        this.loadImages(this.FRAMES);
        this.img = this.imageCache[this.FRAMES[0]];

        /**
         * Map from frame index to one-shot audio.
         * Keys are frame indexes in the animation sequence.
         * @type {Record<number, HTMLAudioElement>}
         */
        this.audioMap = {
            1: new Audio('/audio/buttface.mp3'),
            2: new Audio('/audio/help-help.mp3'),
            3: new Audio('/audio/farmer-laugh.mp3'),
            4: new Audio('/audio/oh-my.mp3'),
            5: new Audio('/audio/farmer-smile.mp3'),
            6: new Audio('/audio/what-are-you-doing.mp3'),
            7: new Audio('/audio/muffled-cry.mp3')
        };

        this.atmo = new Audio('/audio/crying-4.mp3');
        this.atmo.loop = true;
        this.atmo.volume = 0.25;

        this._idx = 0;
        this._timer = null;
        this._delayMs = 1500;
        this._lastPlayedFrameIndex = -1;

        window.addEventListener('gate:opened', () => this.deactivate());

        this._worldPaused = false;
    }

    /**
     * Fixes the aspect ratio once the image has valid dimensions.
     * Ensures the billboard is not stretched.
     *
     * @private
     * @returns {void}
     */
    _applyAspectOnce() {
        if (this._aspectFixed) return;
        const img = this.img;
        if (img && img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalWidth / img.naturalHeight;
            this.width = Math.round(this.height * ratio);
            this._aspectFixed = true;
        }
    }

    /**
     * Follows the anchor gate position, including manual XY offsets.
     * Keeps the billboard horizontally centered on the gate and
     * vertically aligned above the gate's ground line.
     *
     * @private
     * @returns {void}
     */
    _followGate() {
        if (!this.anchorGate) return;
        const g = this.anchorGate;
        this.x = g.x + Math.floor((g.width - this.width) / 2) + this.offsetX;
        this.y = g.groundY - this.height - this.offsetY;
    }

    /**
     * Called by World whenever the game is paused or resumed.
     * While paused:
     * - Frame animation is frozen
     * - Story and atmosphere audio are paused
     *
     * @param {boolean} flag - True if world is paused.
     * @returns {void}
     */
    setWorldPaused(flag) {
        this._worldPaused = !!flag;

        if (this._worldPaused) {
            try {
                if (this.atmo) this.atmo.pause();
            } catch (e) {}

            try {
                Object.values(this.audioMap || {}).forEach(a => {
                    try { a.pause(); } catch (e) {}
                });
            } catch (e) {}
        }
    }

    /**
     * Activates the story billboard:
     * - Makes it visible
     * - Starts the atmosphere loop (if world is not paused)
     * - Resets frames and starts the frame/audio loop
     *
     * @returns {void}
     */
    activate() {
        if (this.visible) return;
        this.visible = true;

        try {
            if (!this._worldPaused && this.atmo && this.atmo.paused) {
                this.atmo.currentTime = 0;
                this.atmo.play();
            }
        } catch (e) {}

        this._idx = 0;
        this._aspectFixed = false;
        this._applyAspectOnce();

        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }

        this._timer = setInterval(() => {
            if (this._worldPaused) return;

            this._idx = (this._idx + 1) % this.FRAMES.length;
            this.img = this.imageCache[this.FRAMES[this._idx]];
            this._aspectFixed = false;
            this._applyAspectOnce();

            const oneShot = this.audioMap[this._idx];
            if (oneShot && this._lastPlayedFrameIndex !== this._idx) {
                try {
                    oneShot.currentTime = 0;
                    oneShot.play();
                } catch (e) {}
                this._lastPlayedFrameIndex = this._idx;
            }
        }, this._delayMs);
    }

    /**
     * Deactivates the billboard:
     * - Hides it
     * - Stops frame timer
     * - Stops and resets atmosphere audio
     *
     * @returns {void}
     */
    deactivate() {
        if (!this.visible) return;
        this.visible = false;

        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }

        try {
            if (!this.atmo.paused) {
                this.atmo.pause();
                this.atmo.currentTime = 0;
            }
        } catch (e) {}
    }

    /**
     * Updates the billboard each frame:
     * - Fix aspect ratio once images are available
     * - Follow the gate position if anchored
     *
     * Typically called from World.update().
     *
     * @returns {void}
     */
    update() {
        this._applyAspectOnce();
        this._followGate();
    }
}
