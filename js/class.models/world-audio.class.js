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
 * Stops an audio element and resets its playback position.
 *
 * @param {HTMLAudioElement|null|undefined} audio
 * @returns {void}
 */
World.prototype._stopAndResetAudio = function (audio) {
    if (!audio) return;

    try {
        audio.pause();
        audio.currentTime = 0;
    } catch (e) {}
};

/**
 * Pauses, rewinds and plays an audio element at the given volume.
 *
 * @param {HTMLAudioElement|null|undefined} audio
 * @param {number} volume
 * @returns {void}
 */
World.prototype._playFromStartWithVolume = function (audio, volume) {
    if (!audio) return;

    try {
        audio.pause();
        audio.currentTime = 0;
        if (typeof volume === 'number') {
            audio.volume = volume;
        }
        this.playAudioSafe(audio);
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
        if (!this.dramaticAudio) return;

        this.dramaticAudio.loop = true;
        this.dramaticAudio.volume = 0.5;

        if (this.dramaticAudio.paused) {
            this.dramaticAudio.currentTime = 0;
            this.playAudioSafe(this.dramaticAudio);
        }
    } catch (e) {}
};

/**
 * Stops the dramatic ambience loop and resets its playback position.
 *
 * @returns {void}
 */
World.prototype.stopAmbienceLoop = function () {
    this._stopAndResetAudio(this.dramaticAudio);
};

/**
 * Stops all game over related audio (death scream, death song, loops).
 *
 * @returns {void}
 */
World.prototype.stopAllGameOverAudio = function () {
    [
        'playerDeathAudio',
        'deathSong',
        'goCryLoop',
        'goRainLoop'
    ].forEach((key) => {
        this._stopAndResetAudio(this[key]);
    });
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

        if (typeof window !== 'undefined') {
            this.bgMusic.muted = !!window.IS_MUTED;
        }

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

        const canPlay =
            this.bgMusic.paused &&
            !this.gameOver &&
            !this.gameWon &&
            !this.endbossInSight;

        if (canPlay) {
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
    if (!this.portalTimerAudio) return;

    try {
        this._stopAndResetAudio(this.portalTimerAudio);

        if (typeof window !== 'undefined') {
            this.portalTimerAudio.muted = !!window.IS_MUTED;
        }

        this.portalTimerAudio.volume = 0.9;
        this.playAudioSafe(this.portalTimerAudio);
    } catch (e) {}
};

/**
 * Immediately stops the portal countdown sound and resets its position.
 *
 * @returns {void}
 */
World.prototype.stopPortalTimerSound = function () {
    this._stopAndResetAudio(this.portalTimerAudio);
};

/**
 * Stops walking sounds and ambience loop safely.
 *
 * @returns {void}
 */
World.prototype.stopStepAndAmbienceSounds = function () {
    this._stopAndResetAudio(this.character && this.character.walking_sound);
    this._stopAndResetAudio(this.character && this.character.walking_sound_back);

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
    this._stopAndResetAudio(this.painAudio);
    this._playFromStartWithVolume(this.playerDeathAudio, 0.85);
    this._playFromStartWithVolume(this.deathSong, 0.75);
};

/**
 * Collects all known audio objects on the world level.
 *
 * @returns {HTMLAudioElement[]} list of known audio instances
 */
World.prototype.getAllAudios = function () {
    const base = [
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

    return base.filter(Boolean);
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
        Object.values(obj).forEach((v) => {
            if (v instanceof Audio) {
                bag.add(v);
            }
        });
    } catch (e) {}
};

/**
 * Collects character-related audios into the bag.
 *
 * @param {Set<HTMLAudioElement>} bag
 * @returns {void}
 */
World.prototype._collectCharacterAudios = function (bag) {
    const c = this.character;
    if (!c) return;

    try {
        this._collectAudiosShallow(c, bag);

        [
            c.snoreAudio,
            c.wakeAudio,
            c.walking_sound,
            c.walking_sound_back
        ].forEach((a) => {
            if (a) bag.add(a);
        });
    } catch (e) {}
};

/**
 * Collects enemy audios into the bag.
 *
 * @param {Set<HTMLAudioElement>} bag
 * @returns {void}
 */
World.prototype._collectEnemyAudios = function (bag) {
    try {
        (this.level?.enemies || []).forEach((e) => {
            this._collectAudiosShallow(e, bag);
        });
    } catch (e) {}
};

/**
 * Collects hut story audios into the bag.
 *
 * @param {Set<HTMLAudioElement>} bag
 * @returns {void}
 */
World.prototype._collectHutStoryAudios = function (bag) {
    const story = this.hutStory;
    if (!story) return;

    try {
        if (story.atmo) {
            bag.add(story.atmo);
        }

        Object.values(story.audioMap || {}).forEach((a) => {
            if (a) bag.add(a);
        });
    } catch (e) {}
};

/**
 * Collects winner screen audios into the bag.
 *
 * @param {Set<HTMLAudioElement>} bag
 * @returns {void}
 */
World.prototype._collectWinnerAudios = function (bag) {
    try {
        if (this.winnerScreen?.winAudio) {
            bag.add(this.winnerScreen.winAudio);
        }
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

    this.getAllAudios().forEach((a) => bag.add(a));
    this._collectCharacterAudios(bag);
    this._collectEnemyAudios(bag);
    this._collectHutStoryAudios(bag);
    this._collectWinnerAudios(bag);

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
        this.getAllAudiosDeep().forEach((a) => {
            this._stopAndResetAudio(a);
        });
    } catch (e) {}
};
