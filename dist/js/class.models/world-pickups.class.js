/**
 * Pickup handling mixin for World.
 * Handles coins, bottles, whiskey and heart pickups including HUD and audio.
 */

/**
 * Handles collection of normal bottles by the character.
 *
 * @returns {void}
 */
World.prototype.checkBottleCollection = function () {
    if (!this.level || !Array.isArray(this.level.bottles)) return;

    const remaining = [];
    let picked = 0;

    for (const bottle of this.level.bottles) {
        if (this._tryCollectBottle(bottle)) picked++;
        else remaining.push(bottle);
    }

    this.level.bottles = remaining;
    if (picked > 0) this._onBottlePickup();
};

/**
 * Tries to collect a single bottle and update HUD.
 *
 * @param {Bottle} bottle
 * @returns {boolean} true if collected
 */
World.prototype._tryCollectBottle = function (bottle) {
    if (!this.character.isColliding(bottle)) return false;
    if (this.bottlesCollected >= this.maxBottles) return false;

    this.bottlesCollected++;
    const pct = (this.bottlesCollected / this.maxBottles) * 100;
    this.bottleStatusBar.setPercentage(pct);
    return true;
};

/**
 * Plays bottle pickup sound once after any bottle was collected.
 *
 * @returns {void}
 */
World.prototype._onBottlePickup = function () {
    try {
        if (!this.bottlePickupAudio) return;
        this.bottlePickupAudio.currentTime = 0;
        this.playAudioSafe(this.bottlePickupAudio);
    } catch (e) {}
};

/**
 * Handles coin pickup logic and updates the coin status bar and sound.
 *
 * @returns {void}
 */
World.prototype.checkCoinCollection = function () {
    if (!this.level || !Array.isArray(this.level.coins)) return;

    const remaining = [];
    let picked = 0;

    for (const coin of this.level.coins) {
        if (this.character.isColliding(coin)) picked++;
        else remaining.push(coin);
    }

    this.level.coins = remaining;
    if (picked > 0) this._onCoinsPicked(picked);
};

/**
 * Updates coin count, HUD and audio after picking coins.
 *
 * @param {number} pickedCount
 * @returns {void}
 */
World.prototype._onCoinsPicked = function (pickedCount) {
    this.coinsCollected += pickedCount;

    const pct = this.totalCoins > 0
        ? (this.coinsCollected / this.totalCoins) * 100
        : 100;

    this.coinStatusBar.setPercentage(pct);

    try {
        if (!this.coinAudio) return;
        this.coinAudio.currentTime = 0;
        this.playAudioSafe(this.coinAudio);
    } catch (e) {}
};

/**
 * Handles whiskey pickup logic and updates the counter and sound.
 *
 * @returns {void}
 */
World.prototype.checkWhiskeyCollection = function () {
    if (!this.level || !Array.isArray(this.level.whiskeys)) return;

    const remaining = [];
    let gained = 0;

    for (const w of this.level.whiskeys) {
        if (this.character.isColliding(w)) gained++;
        else remaining.push(w);
    }

    this.level.whiskeys = remaining;
    if (gained > 0) this._onWhiskeyPicked(gained);
};

/**
 * Updates whiskey counter and plays pickup sound.
 *
 * @param {number} gained
 * @returns {void}
 */
World.prototype._onWhiskeyPicked = function (gained) {
    this.whiskeyCount += gained;
    this.whiskeyCounter.setCount(this.whiskeyCount);

    try {
        if (!this.whiskeyPickupAudio) return;
        this.whiskeyPickupAudio.currentTime = 0;
        this.playAudioSafe(this.whiskeyPickupAudio);
    } catch (e) {}
};

/**
 * Handles heart pickup logic and heals the player accordingly.
 *
 * @returns {void}
 */
World.prototype.checkHeartCollection = function () {
    if (!this.level || !Array.isArray(this.level.hearts)) return;

    const remaining = [];
    let picked = 0;

    for (const h of this.level.hearts) {
        if (this.character.isColliding(h)) picked++;
        else remaining.push(h);
    }

    this.level.hearts = remaining;
    if (picked > 0) this._onHeartsPicked(picked);
};

/**
 * Heals the player and plays heart pickup sound.
 *
 * @param {number} picked
 * @returns {void}
 */
World.prototype._onHeartsPicked = function (picked) {
    const HEAL_PER_HEART = 40;
    const energy = this.character.energy || 0;
    const heal = HEAL_PER_HEART * picked;

    this.character.energy = Math.min(100, energy + heal);
    this.statusBar.setPercentage(this.character.energy);

    try {
        if (!this.heartPickupAudio) return;
        this.heartPickupAudio.currentTime = 0;
        this.playAudioSafe(this.heartPickupAudio);
    } catch (e) {}
};
