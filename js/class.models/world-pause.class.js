/**
 * Pause / freeze mixin for World.
 * Handles pausing, freezing and unfreezing of all world entities and audio.
 */

/**
 * Sets the paused state of the world.
 * Freezes and unfreezes all moving objects and handles audio pausing.
 *
 * @param {boolean} flag - true to pause, false to resume
 * @returns {void}
 */
World.prototype.setPaused = function (flag) {
    if (flag === this.paused) return;
    this.paused = !!flag;

    try {
        if (this.hutStory && typeof this.hutStory.setWorldPaused === 'function') {
            this.hutStory.setWorldPaused(this.paused);
        }
    } catch (e) {}

    if (this.paused) {
        this.freezeWorld();
        try {
            this.getAllAudiosDeep().forEach(a => {
                try {
                    a.pause();
                } catch (e) {}
            });
        } catch (e) {}

    } else {
        this.unfreezeWorld();
        try {
            if (!this.endbossInSight &&
                !this.gameOver &&
                !this.gameWon &&
                this.bgMusic &&
                !this.bgMusic.muted) {
                this.playAudioSafe(this.bgMusic);
            }
        } catch (e) {}

        try {
            if (this.portalTimerActive &&
                this.portalTimerSeconds > 0 &&
                this.portalTimerAudio &&
                this.portalTimerAudio.paused &&
                !this.portalTimerAudio.muted) {
                this.playAudioSafe(this.portalTimerAudio);
            }
        } catch (e) {}
    }
};

/**
 * Freezes moving world objects by patching movement methods
 * and storing previous speeds.
 *
 * @returns {void}
 */
World.prototype.freezeWorld = function () {
    const patchOne = (o) => {
        if (!o || o.__frozen) return;
        o.__frozen = true;

        if (typeof o.speed === 'number') {
            o.__prevSpeed = o.speed;
            o.speed = 0;
        }
        if (typeof o.baseSpeed === 'number') {
            o.__prevBaseSpeed = o.baseSpeed;
            o.baseSpeed = 0;
        }

        ['moveLeft', 'moveRight', 'updateAI', 'animate'].forEach(fn => {
            if (typeof o[fn] === 'function' && !o[`__orig_${fn}`]) {
                o[`__orig_${fn}`] = o[fn];
                o[fn] = function () {};
            }
        });
    };

    (this.level?.enemies || []).forEach(patchOne);
    (this.level?.clouds  || []).forEach(patchOne);
    (this.level?.backgroundObjects || []).forEach(patchOne);
    (this.throwableObjects || []).forEach(patchOne);
    (this.effects || []).forEach(patchOne);

    patchOne(this.character);
};

/**
 * Restores original methods and speeds for all frozen world objects.
 *
 * @returns {void}
 */
World.prototype.unfreezeWorld = function () {
    const unpatchOne = (o) => {
        if (!o || !o.__frozen) return;
        o.__frozen = false;

        if ('__prevSpeed' in o) {
            o.speed = o.__prevSpeed;
            delete o.__prevSpeed;
        }
        if ('__prevBaseSpeed' in o) {
            o.baseSpeed = o.__prevBaseSpeed;
            delete o.__prevBaseSpeed;
        }

        ['moveLeft', 'moveRight', 'updateAI', 'animate'].forEach(fn => {
            const key = `__orig_${fn}`;
            if (typeof o[key] === 'function') {
                o[fn] = o[key];
                delete o[key];
            }
        });
    };

    (this.level?.enemies || []).forEach(unpatchOne);
    (this.level?.clouds  || []).forEach(unpatchOne);
    (this.level?.backgroundObjects || []).forEach(unpatchOne);
    (this.throwableObjects || []).forEach(unpatchOne);
    (this.effects || []).forEach(unpatchOne);
    unpatchOne(this.character);
};
