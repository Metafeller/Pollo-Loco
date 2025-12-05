/**
 * World audio helpers.
 * Split out from world-core.class.js to keep the core file smaller and focused.
 * Handles background music, ambience, SFX and deep audio reset.
 */

/**
 * Safely plays an audio element and swallows AbortError /
 * autoplay rejections so they don't show up as console errors.
 *
 * Respects a global mute flag window.IS_MUTED (optional).
 *
 * @param {HTMLAudioElement|null|undefined} audio
 * @returns {void}
 */
World.prototype.playAudioSafe = function (audio) {
    if (!audio || typeof audio.play !== 'function') return;

    try {
        if (typeof window !== 'undefined' && typeof window.IS_MUTED !== 'undefined') {
            audio.muted = !!window.IS_MUTED;
        }

        const p = audio.play();
        if (p && typeof p.catch === 'function') {
            p.catch(() => {});
        }
    } catch (e) {}
};

/**
 * Starts the dramatic ambience loop during boss phases.
 * Keeps looping at a low volume until explicitly stopped.
 *
 * @returns {void}
 */
World.prototype.startAmbienceLoop = function () {
    try {
        if (this.dramaticAudio) {
            this.dramaticAudio.loop = true;
            this.dramaticAudio.volume = 0.5;
            if (this.dramaticAudio.paused) {
                this.dramaticAudio.currentTime = 0;
                this.playAudioSafe(this.dramaticAudio);
            }
        }
    } catch (e) {}
};

/**
 * Stops the dramatic ambience loop and resets its playback position.
 *
 * @returns {void}
 */
World.prototype.stopAmbienceLoop = function () {
    try {
        if (this.dramaticAudio && !this.dramaticAudio.paused) {
            this.dramaticAudio.pause();
            this.dramaticAudio.currentTime = 0;
        }
    } catch (e) {}
};

/**
 * Stops all game over related audio (death scream, death song, loops).
 *
 * @returns {void}
 */
World.prototype.stopAllGameOverAudio = function () {
    try {
        if (this.playerDeathAudio) {
            this.playerDeathAudio.pause();
            this.playerDeathAudio.currentTime = 0;
        }
        if (this.deathSong) {
            this.deathSong.pause();
            this.deathSong.currentTime = 0;
        }
    } catch (e) {}

    try {
        if (this.goCryLoop) {
            this.goCryLoop.pause();
            this.goCryLoop.currentTime = 0;
        }
        if (this.goRainLoop) {
            this.goRainLoop.pause();
            this.goRainLoop.currentTime = 0;
        }
    } catch (e) {}
};

/**
 * Starts the low volume background music and respects the global mute flag.
 *
 * @returns {void}
 */
World.prototype.startBgMusic = function () {
    try {
        if (!this.bgMusic) return;
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.28;
        this.bgMusic.muted = !!window.IS_MUTED;
        if (this.bgMusic.paused) {
            this.bgMusic.currentTime = 0;
            this.playAudioSafe(this.bgMusic);
        }
    } catch (e) {}
};

/**
 * Pauses background music if it is currently playing.
 *
 * @returns {void}
 */
World.prototype.pauseBgMusic = function () {
    try {
        if (this.bgMusic && !this.bgMusic.paused) {
            this.bgMusic.pause();
        }
    } catch (e) {}
};

/**
 * Resumes background music if allowed by game state.
 *
 * @returns {void}
 */
World.prototype.resumeBgMusic = function () {
    try {
        if (!this.bgMusic) return;
        if (this.bgMusic.paused && !this.gameOver && !this.gameWon && !this.endbossInSight) {
            this.playAudioSafe(this.bgMusic);
        }
    } catch (e) {}
};

/**
 * Plays the enemy death sound if available.
 *
 * @returns {void}
 */
World.prototype.playEnemyDeathSound = function () {
    this.playAudioSafe(this.enemyDeathAudio);
};

/**
 * Plays the pain sound one time with a short anti spam lock.
 *
 * @returns {void}
 */
World.prototype.playPainOnce = function () {
    if (this._painLock) return;
    this._painLock = true;
    try {
        if (this.painAudio) {
            this.painAudio.currentTime = 0;
            this.playAudioSafe(this.painAudio);
        }
    } catch (e) {}
    setTimeout(() => {
        this._painLock = false;
    }, 300);
};

/**
 * Plays a one-shot sound when the portal countdown starts.
 *
 * @returns {void}
 */
World.prototype.playPortalTimerStartSound = function () {
    try {
        if (!this.portalTimerAudio) return;
        this.portalTimerAudio.pause();
        this.portalTimerAudio.currentTime = 0;
        this.portalTimerAudio.volume = 0.9;
        this.portalTimerAudio.muted = !!window.IS_MUTED;
        this.playAudioSafe(this.portalTimerAudio);
    } catch (e) {}
};

/**
 * Immediately stops the portal countdown sound and resets its position.
 *
 * @returns {void}
 */
World.prototype.stopPortalTimerSound = function () {
    try {
        if (!this.portalTimerAudio) return;
        this.portalTimerAudio.pause();
        this.portalTimerAudio.currentTime = 0;
    } catch (e) {}
};

/**
 * Stops walking sounds and ambience loop safely.
 *
 * @returns {void}
 */
World.prototype.stopStepAndAmbienceSounds = function () {
    try {
        this.character.walking_sound.pause();
        this.character.walking_sound.currentTime = 0;
        this.character.walking_sound_back.pause();
        this.character.walking_sound_back.currentTime = 0;
    } catch (e) {}

    try {
        this.stopAmbienceLoop();
    } catch (e) {}
};

/**
 * Stops pain sound and plays death scream plus the death song.
 *
 * @returns {void}
 */
World.prototype.playDeathAudioSequence = function () {
    try {
        if (this.painAudio) {
            this.painAudio.pause();
            this.painAudio.currentTime = 0;
        }
    } catch (e) {}

    try {
        if (this.playerDeathAudio) {
            this.playerDeathAudio.pause();
            this.playerDeathAudio.currentTime = 0;
            this.playerDeathAudio.volume = 0.85;
            this.playAudioSafe(this.playerDeathAudio);
        }
    } catch (e) {}

    try {
        if (this.deathSong) {
            this.deathSong.pause();
            this.deathSong.currentTime = 0;
            this.deathSong.volume = 0.75;
            this.playAudioSafe(this.deathSong);
        }
    } catch (e) {}
};

/**
 * Collects all known audio objects on the world level.
 *
 * @returns {HTMLAudioElement[]} list of known audio instances
 */
World.prototype.getAllAudios = function () {
    const a = [
        this.bgMusic,
        this.coinAudio,
        this.heartPickupAudio,
        this.whiskeyPickupAudio,
        this.supernovaAudio,
        this.bottlePickupAudio,
        this.painAudio,
        this.wakeAudio,
        this.snoreAudio,
        this.playerDeathAudio,
        this.deathSong,
        this.goCryLoop,
        this.goRainLoop,
        this.dramaticAudio,
        this.bossDeathAudio,
        this.hitAudio,
        this.portalTimerAudio,
        this.character?.walking_sound,
        this.character?.walking_sound_back,
        this.enemyDeathAudio
    ];
    return a.filter(Boolean);
};

/**
 * Helper: adds shallow audio references from a flat object to the bag.
 *
 * @param {object} obj - source object
 * @param {Set<HTMLAudioElement>} bag - set collecting audios
 * @returns {void}
 */
World.prototype._collectAudiosShallow = function (obj, bag) {
    if (!obj) return;
    try {
        Object.values(obj).forEach(v => {
            if (v instanceof Audio) bag.add(v);
        });
    } catch (e) {}
};

/**
 * Collects all audios deeply: world, character, enemies,
 * story billboard and winner screen.
 *
 * @returns {HTMLAudioElement[]} list of unique audio instances
 */
World.prototype.getAllAudiosDeep = function () {
    const bag = new Set();
    this.getAllAudios().forEach(a => bag.add(a));

    try {
        if (this.character) {
            this._collectAudiosShallow(this.character, bag);
            [
                this.character.snoreAudio,
                this.character.wakeAudio,
                this.character.walking_sound,
                this.character.walking_sound_back
            ].forEach(a => {
                if (a) bag.add(a);
            });
        }
    } catch (e) {}

    try {
        (this.level?.enemies || []).forEach(e => this._collectAudiosShallow(e, bag));
    } catch (e) {}

    try {
        if (this.hutStory) {
            if (this.hutStory.atmo) bag.add(this.hutStory.atmo);
            Object.values(this.hutStory.audioMap || {}).forEach(a => {
                if (a) bag.add(a);
            });
        }
    } catch (e) {}

    try {
        if (this.winnerScreen?.winAudio) bag.add(this.winnerScreen.winAudio);
    } catch (e) {}

    return Array.from(bag);
};

/**
 * Hard stops all audio instances owned by the world
 * and resets their playback position (used for restart / backToStart).
 *
 * @returns {void}
 */
World.prototype.resetAllAudios = function () {
    try {
        const audios = this.getAllAudiosDeep();
        audios.forEach((a) => {
            try {
                a.pause();
                a.currentTime = 0;
            } catch (e) {}
        });
    } catch (e) {}
};
