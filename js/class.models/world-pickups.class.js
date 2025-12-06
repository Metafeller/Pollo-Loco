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
    let picked = false;
    this.level.bottles.forEach((bottle) => {
        if (this.character.isColliding(bottle)) {
            if (this.bottlesCollected < this.maxBottles) {
                const pickedBottle = bottle;
                this.level.bottles = this.level.bottles.filter(b => b !== pickedBottle);
                this.bottlesCollected++;
                picked = true;
                const pct = (this.bottlesCollected / this.maxBottles) * 100;
                this.bottleStatusBar.setPercentage(pct);
            }
        }
    });

    if (picked) {
        try {
            this.bottlePickupAudio.currentTime = 0;
            this.playAudioSafe(this.bottlePickupAudio);
        } catch (e) {}
    }
};

/**
 * Handles coin pickup logic and updates the coin status bar and sound.
 *
 * @returns {void}
 */
World.prototype.checkCoinCollection = function () {
    if (!this.level || !Array.isArray(this.level.coins)) return;

    const remaining = [];
    let pickedAny = false;

    for (const coin of this.level.coins) {
        if (this.character.isColliding(coin)) {
            pickedAny = true;
            this.coinsCollected++;
        } else {
            remaining.push(coin);
        }
    }

    if (pickedAny) {
        try {
            this.coinAudio.currentTime = 0;
            this.playAudioSafe(this.coinAudio);
        } catch (e) {}
        const pct = this.totalCoins > 0 ? (this.coinsCollected / this.totalCoins) * 100 : 100;
        this.coinStatusBar.setPercentage(pct);
    }

    this.level.coins = remaining;
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
        if (this.character.isColliding(w)) {
            gained++;
        } else {
            remaining.push(w);
        }
    }

    if (gained > 0) {
        this.whiskeyCount += gained;
        this.whiskeyCounter.setCount(this.whiskeyCount);
        try {
            this.whiskeyPickupAudio.currentTime = 0;
            this.playAudioSafe(this.whiskeyPickupAudio);
        } catch (e) {}
    }

    this.level.whiskeys = remaining;
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
    const HEAL_PER_HEART = 40;

    for (const h of this.level.hearts) {
        if (this.character.isColliding(h)) picked++;
        else remaining.push(h);
    }

    if (picked > 0) {
        const heal = HEAL_PER_HEART * picked;
        this.character.energy = Math.min(100, (this.character.energy || 0) + heal);
        this.statusBar.setPercentage(this.character.energy);
        try {
            this.heartPickupAudio.currentTime = 0;
            this.playAudioSafe(this.heartPickupAudio);
        } catch (e) {}
    }

    this.level.hearts = remaining;
};
