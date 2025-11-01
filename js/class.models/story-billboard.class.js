class StoryBillboard extends DrawableObject {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {HutGate|null} anchorGate
     */
    constructor(x = 5400, y = 120, w = 360, h = 180, anchorGate = null) {
        super();
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        this.anchorGate = anchorGate;

        // <<< NEU: manuelle Offsets relativ zum Gate >>>
        this.offsetX = 0;   // + nach rechts, - nach links
        this.offsetY = -72;  // + nach oben (Abstand vom Gate-Bottom)

        this.visible = false;
        this._aspectFixed = false;

        this.FRAMES = [
            '/img/objects/gate_closed_1.png',
            '/img/objects/story/talk_closed_f1.png',
            '/img/objects/story/talk_pepe_help_f2.png',
            '/img/objects/story/talk_farmer_f3.png',
            '/img/objects/story/talk_pepe_help_f2.png',
            '/img/objects/story/talk_farmer_f5.png',
            '/img/objects/story/talk_closed_f1.png'
        ];
        this.loadImages(this.FRAMES);
        this.img = this.imageCache[this.FRAMES[0]];

        this.audioMap = {
            1: new Audio('/audio/buttface.mp3'),
            2: new Audio('/audio/help-help.mp3'),
            3: new Audio('/audio/farmer-laugh.mp3'),
            4: new Audio('/audio/oh-my.mp3'),
            5: new Audio('/audio/farmer-smile.mp3'),
            6: new Audio('/audio/what-are-you-doing.mp3'),
            7: new Audio('/audio/muffled-cry.mp3')
        };

        this.atmo = new Audio('/audio/woman-cry-loop.mp3');
        this.atmo.loop = true;
        this.atmo.volume = 0.25;

        this._idx = 0;
        this._timer = null;
        this._delayMs = 1500; // langsamer
        this._lastPlayedFrameIndex = -1;
    }

    _applyAspectOnce() {
        if (this._aspectFixed) return;
        const img = this.img;
        if (img && img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalWidth / img.naturalHeight;
            this.width = Math.round(this.height * ratio);
            this._aspectFixed = true;
        }
    }

    _followGate() {
        if (!this.anchorGate) return;
        const g = this.anchorGate;
        // mittig am Gate ausrichten + Offsets
        this.x = g.x + Math.floor((g.width - this.width) / 2) + this.offsetX;
        // unteres Drittel des Gates (sichtbar über dem Boden) + offsetY nach oben
        this.y = g.y + g.height - this.height - this.offsetY;
    }

    activate() {
        if (this.visible) return;
        this.visible = true;
        try { if (this.atmo.paused) { this.atmo.currentTime = 0; this.atmo.play(); } } catch(e) {}
        this._idx = 0;
        this._aspectFixed = false;
        this._applyAspectOnce();
        this._timer = setInterval(() => {
            this._idx = (this._idx + 1) % this.FRAMES.length;
            this.img = this.imageCache[this.FRAMES[this._idx]];
            this._aspectFixed = false;
            this._applyAspectOnce();

            const oneShot = this.audioMap[this._idx];
            if (oneShot && this._lastPlayedFrameIndex !== this._idx) {
                try { oneShot.currentTime = 0; oneShot.play(); } catch(e) {}
                this._lastPlayedFrameIndex = this._idx;
            }
        }, this._delayMs);
    }

    deactivate() {
        if (!this.visible) return;
        this.visible = false;
        if (this._timer) { clearInterval(this._timer); this._timer = null; }
        try { if (!this.atmo.paused) { this.atmo.pause(); this.atmo.currentTime = 0; } } catch(e) {}
    }

    update() {
        this._applyAspectOnce();
        this._followGate();
    }
}
