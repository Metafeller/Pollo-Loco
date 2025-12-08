/**
 * Pause / freeze mixin for World.
 * Handles pausing, freezing and unfreezing of all world entities and audio.
 */

/**
 * Sets the paused state of the world.
 * Freezes/unfreezes moving objects and handles audio pausing.
 *
 * @param {boolean} flag - true to pause, false to resume
 * @returns {void}
 */
World.prototype.setPaused = function (flag) {
    if (flag === this.paused) return;
    this.paused = !!flag;

    this._notifyHutStoryPause();

    if (this.paused) {
        this._applyPauseSideEffects();
    } else {
        this._applyResumeSideEffects();
    }
};

/**
 * Notifies hut story (if present) about world pause state.
 *
 * @returns {void}
 */
World.prototype._notifyHutStoryPause = function () {
    try {
        const story = this.hutStory;
        if (story && typeof story.setWorldPaused === 'function') {
            story.setWorldPaused(this.paused);
        }
    } catch (e) {}
};

/**
 * Applies side effects when the world is paused.
 *
 * @returns {void}
 */
World.prototype._applyPauseSideEffects = function () {
    this.freezeWorld();

    try {
        this.getAllAudiosDeep().forEach((a) => {
            try {
                a.pause();
            } catch (e) {}
        });
    } catch (e) {}
};

/**
 * Applies side effects when the world is resumed.
 *
 * @returns {void}
 */
World.prototype._applyResumeSideEffects = function () {
    this.unfreezeWorld();
    this._resumeBgMusicIfNeeded();
    this._resumePortalTimerAudioIfNeeded();
};

/**
 * Resumes background music if game state allows it.
 *
 * @returns {void}
 */
World.prototype._resumeBgMusicIfNeeded = function () {
    try {
        if (
            !this.endbossInSight &&
            !this.gameOver &&
            !this.gameWon &&
            this.bgMusic &&
            !this.bgMusic.muted
        ) {
            this.playAudioSafe(this.bgMusic);
        }
    } catch (e) {}
};

/**
 * Resumes portal timer audio if an active countdown is running.
 *
 * @returns {void}
 */
World.prototype._resumePortalTimerAudioIfNeeded = function () {
    try {
        if (
            this.portalTimerActive &&
            this.portalTimerSeconds > 0 &&
            this.portalTimerAudio &&
            this.portalTimerAudio.paused &&
            !this.portalTimerAudio.muted
        ) {
            this.playAudioSafe(this.portalTimerAudio);
        }
    } catch (e) {}
};

/**
 * Freezes moving world objects by patching movement methods
 * and storing previous speeds.
 *
 * @returns {void}
 */
World.prototype.freezeWorld = function () {
    const level = this.level || {};

    (level.enemies || []).forEach(o => this._freezeObject(o));
    (level.clouds || []).forEach(o => this._freezeObject(o));
    (level.backgroundObjects || []).forEach(o => this._freezeObject(o));
    (this.throwableObjects || []).forEach(o => this._freezeObject(o));
    (this.effects || []).forEach(o => this._freezeObject(o));

    this._freezeObject(this.character);
};

/**
 * Helper: freezes a single object (speed + movement/AI methods).
 *
 * @param {any} obj
 * @returns {void}
 */
World.prototype._freezeObject = function (obj) {
    if (!obj || obj.__frozen) return;
    obj.__frozen = true;

    if (typeof obj.speed === 'number') {
        obj.__prevSpeed = obj.speed;
        obj.speed = 0;
    }
    if (typeof obj.baseSpeed === 'number') {
        obj.__prevBaseSpeed = obj.baseSpeed;
        obj.baseSpeed = 0;
    }

    ['moveLeft', 'moveRight', 'updateAI', 'animate'].forEach((fn) => {
        if (typeof obj[fn] === 'function' && !obj[`__orig_${fn}`]) {
            obj[`__orig_${fn}`] = obj[fn];
            obj[fn] = function () {};
        }
    });
};

/**
 * Restores original methods and speeds for all frozen world objects.
 *
 * @returns {void}
 */
World.prototype.unfreezeWorld = function () {
    const level = this.level || {};

    (level.enemies || []).forEach(o => this._unfreezeObject(o));
    (level.clouds || []).forEach(o => this._unfreezeObject(o));
    (level.backgroundObjects || []).forEach(o => this._unfreezeObject(o));
    (this.throwableObjects || []).forEach(o => this._unfreezeObject(o));
    (this.effects || []).forEach(o => this._unfreezeObject(o));

    this._unfreezeObject(this.character);
};

/**
 * Helper: unfreezes a single object and restores methods/speeds.
 *
 * @param {any} obj
 * @returns {void}
 */
World.prototype._unfreezeObject = function (obj) {
    if (!obj || !obj.__frozen) return;
    obj.__frozen = false;

    if ('__prevSpeed' in obj) {
        obj.speed = obj.__prevSpeed;
        delete obj.__prevSpeed;
    }
    if ('__prevBaseSpeed' in obj) {
        obj.baseSpeed = obj.__prevBaseSpeed;
        delete obj.__prevBaseSpeed;
    }

    ['moveLeft', 'moveRight', 'updateAI', 'animate'].forEach((fn) => {
        const key = `__orig_${fn}`;
        if (typeof obj[key] === 'function') {
            obj[fn] = obj[key];
            delete obj[key];
        }
    });
};