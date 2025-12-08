class StoryBillboard extends DrawableObject {
    /**
     * Story billboard that shows a short dialogue sequence near the hut gate.
     * Follows the gate position and plays a frame-based slideshow with audio.
     *
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {HutGate|null} anchorGate
     */
    constructor(x = 5400, y = 120, w = 360, h = 180, anchorGate = null) {
        super();
        this.initPositionAndSize(x, y, w, h);
        this.initAnchor(anchorGate);
        this.initVisibilityState();
        this.initFramesAndImage();
        this.initAudio();
        this.initAnimationState();
        this.initWorldPausedFlag();
        this.initGateOpenedListener();
    }


    initPositionAndSize(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }


    initAnchor(anchorGate) {
        /** @type {HutGate|null} Gate this billboard is anchored to. */
        this.anchorGate = anchorGate;
        this.offsetX = -24;
        this.offsetY = 72;
    }


    initVisibilityState() {
        this.visible = false;
        this._aspectFixed = false;
    }


    initFramesAndImage() {
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
    }


    initAudio() {
        /**
         * Map from frame index to one-shot audio.
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
    }


    initAnimationState() {
        this._idx = 0;
        this._timer = null;
        this._delayMs = 1500;
        this._lastPlayedFrameIndex = -1;
    }


    initWorldPausedFlag() {
        this._worldPaused = false;
    }


    initGateOpenedListener() {
        window.addEventListener('gate:opened', () => this.deactivate());
    }


    /**
     * Fixes the aspect ratio once the image has valid dimensions.
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
     *
     * @param {boolean} flag
     * @returns {void}
     */
    setWorldPaused(flag) {
        this._worldPaused = !!flag;
        if (!this._worldPaused) return;
        this._pauseAtmoAndStoryAudio();
    }


    _pauseAtmoAndStoryAudio() {
        try {
            if (this.atmo) this.atmo.pause();
        } catch (e) {}

        try {
            Object.values(this.audioMap || {}).forEach(a => {
                try { a.pause(); } catch (e) {}
            });
        } catch (e) {}
    }


    /**
     * Activates the story billboard.
     *
     * @returns {void}
     */
    activate() {
        if (this.visible) return;

        this.visible = true;
        this._startAtmoIfNeeded();
        this._resetAnimationFlags();
        this._restartFrameTimer();
    }


    _startAtmoIfNeeded() {
        try {
            if (!this._worldPaused && this.atmo && this.atmo.paused) {
                this.atmo.currentTime = 0;
                this.atmo.play();
            }
        } catch (e) {}
    }


    _resetAnimationFlags() {
        this._idx = 0;
        this._aspectFixed = false;
        this._applyAspectOnce();
    }


    _restartFrameTimer() {
        this._stopFrameTimer();
        this._timer = setInterval(() => this._tickFrame(), this._delayMs);
    }


    _stopFrameTimer() {
        if (!this._timer) return;
        clearInterval(this._timer);
        this._timer = null;
    }


    _tickFrame() {
        if (this._worldPaused) return;

        this._advanceFrameIndex();
        this._updateCurrentFrameImage();
        this._playFrameAudioOnce();
    }


    _advanceFrameIndex() {
        const len = this.FRAMES.length || 1;
        this._idx = (this._idx + 1) % len;
    }


    _updateCurrentFrameImage() {
        this.img = this.imageCache[this.FRAMES[this._idx]];
        this._aspectFixed = false;
        this._applyAspectOnce();
    }


    _playFrameAudioOnce() {
        const oneShot = this.audioMap[this._idx];
        if (!oneShot || this._lastPlayedFrameIndex === this._idx) return;

        try {
            oneShot.currentTime = 0;
            oneShot.play();
        } catch (e) {}

        this._lastPlayedFrameIndex = this._idx;
    }


    /**
     * Deactivates the billboard and stops audio/timer.
     *
     * @returns {void}
     */
    deactivate() {
        if (!this.visible) return;

        this.visible = false;
        this._stopFrameTimer();
        this._stopAtmo();
    }


    _stopAtmo() {
        try {
            if (!this.atmo || this.atmo.paused) return;
            this.atmo.pause();
            this.atmo.currentTime = 0;
        } catch (e) {}
    }


    /**
     * Updates the billboard each frame.
     *
     * @returns {void}
     */
    update() {
        this._applyAspectOnce();
        this._followGate();
    }
}
