/**
 * Projectile & hit logic for the world (bottles + fireballs).
 * Mixed into World.prototype.
 */
const WorldProjectilesMixin = {
    /**
     * Throws a normal bottle if at least one is available.
     *
     * @returns {void}
     */
    throwBottle() {
        if (this.bottlesCollected > 0) {
            const bottle = new ThrowableObject(this.character.x + 100, this.character.y + 100);
            this.throwableObjects.push(bottle);
            this.bottlesCollected--;
            const pct = (this.bottlesCollected / this.maxBottles) * 100;
            this.bottleStatusBar.setPercentage(pct);
        }
    },

    /**
     * Handles throw input for bottles and fireballs, and cleans up finished projectiles.
     *
     * @returns {void}
     */
    checkThrowObjects() {
        if (this.keyboard.D && this.bottlesCollected > 0) {
            const facingRight = true;

            const bottle = new ThrowableObject(
                this.character.x + 100,
                this.character.y + 80,
                facingRight,
                this
            );

            this.throwableObjects.push(bottle);
            this.bottlesCollected--;

            const pct = (this.bottlesCollected / this.maxBottles) * 100;
            this.bottleStatusBar.setPercentage(pct);
        }

        if (this.keyboard.F && this.whiskeyCount > 0) {
            const facingRight = true;
            const fire = new Fireball(this.character.x + 110, this.character.y + 70, facingRight);
            this.throwableObjects.push(fire);
            this.whiskeyCount--;
            this.whiskeyCounter.setCount(this.whiskeyCount);
            try {
                this.supernovaAudio.currentTime = 0;
                this.playAudioSafe(this.supernovaAudio);
            } catch (e) {}
        }

        this.throwableObjects = this.throwableObjects.filter(p => !p.done);
    },

    /**
     * Checks all projectile ↔ enemy collisions in the current frame.
     *
     * @returns {void}
     */
    checkProjectileCollisions() {
        if (!this.canCheckProjectileCollisions()) return;

        this.throwableObjects.forEach((proj, idx) => {
            this.level.enemies.forEach((enemy) => {
                if (!proj.isColliding(enemy)) return;
                this.handleProjectileHitsEnemy(proj, enemy, idx);
            });
        });

        this.cleanupProjectiles();
    },

    /**
     * Returns true if projectile collision checks are safe to run.
     *
     * @returns {boolean} whether projectile checks can run
     */
    canCheckProjectileCollisions() {
        if (!Array.isArray(this.throwableObjects)) return false;
        if (!this.level) return false;
        if (!Array.isArray(this.level.enemies)) return false;
        return true;
    },

    /**
     * Dispatches projectile hits to specific handlers based on projectile type.
     *
     * @param {ThrowableObject|Fireball} proj - projectile object
     * @param {object} enemy - enemy that was hit
     * @param {number} idx - projectile index in the array
     * @returns {void}
     */
    handleProjectileHitsEnemy(proj, enemy, idx) {
        if (proj instanceof Fireball) {
            this.handleFireballHitEnemy(proj, enemy);
            return;
        }
        this.handleBottleHitEnemy(proj, enemy, idx);
    },

    /**
     * Fireball behaviour: ignores small ground enemies, hits boss or flying enemies.
     *
     * @param {Fireball} proj - fireball projectile
     * @param {object} enemy - enemy that was hit
     * @returns {void}
     */
    handleFireballHitEnemy(proj, enemy) {
        if (enemy instanceof Chicken || enemy instanceof MiniChicken) return;
        if (!(enemy instanceof Endboss || enemy.canBeHitByFireball === true)) return;

        if (typeof enemy.enterAggro === 'function') enemy.enterAggro();
        this.startAmbienceLoop();

        const dmg = 40;
        this.applyFireballDamage(enemy, dmg);

        this.endbossStatusBar.setPercentage(enemy.energy);
        if (enemy.energy === 0 && typeof this.onEndbossDeath === 'function') {
            this.onEndbossDeath(enemy);
        }

        proj.done = true;
    },

    /**
     * Applies fireball damage with the original fallback behaviour.
     *
     * @param {object} enemy - enemy to damage
     * @param {number} dmg - damage amount
     * @returns {void}
     */
    applyFireballDamage(enemy, dmg) {
        try {
            if (enemy.hit.length >= 1) {
                enemy.hit(dmg);
            } else {
                enemy.hit();
                if (typeof enemy.energy === 'number') {
                    enemy.energy = Math.max(0, enemy.energy - 20);
                }
            }
        } catch (e) {
            if (typeof enemy.energy === 'number') {
                enemy.energy = Math.max(0, enemy.energy - dmg);
            }
        }
    },

    /**
     * Standard bottle behaviour for all enemies.
     *
     * @param {ThrowableObject} proj - bottle projectile
     * @param {object} enemy - enemy that was hit
     * @param {number} idx - projectile index in the array
     * @returns {void}
     */
    handleBottleHitEnemy(proj, enemy, idx) {
        if (proj.hasHit === true) return;
        proj.hasHit = true;

        this.onBottleHitsEnemy(proj, enemy);

        if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
            this.handleBottleHitChicken(enemy);
        } else if (enemy instanceof Endboss) {
            this.handleBottleHitEndboss(enemy);
        }

        this.throwableObjects.splice(idx, 1);
    },

    /**
     * Bottle hit on small enemies: kill + delayed removal with sound.
     *
     * @param {object} enemy - chicken or mini-chicken
     * @returns {void}
     */
    handleBottleHitChicken(enemy) {
        if (typeof enemy.die === 'function') enemy.die();
        setTimeout(() => {
            try {
                this.playEnemyDeathSound();
            } catch (e) {}
            this.level.enemies = this.level.enemies.filter(e => e !== enemy);
        }, 320);
    },

    /**
     * Bottle hit on Endboss: aggro + damage + death check.
     *
     * @param {Endboss} enemy - boss instance
     * @returns {void}
     */
    handleBottleHitEndboss(enemy) {
        if (typeof enemy.enterAggro === 'function') enemy.enterAggro();
        this.startAmbienceLoop();

        const dmg = 20;
        this.applyBottleDamageToEndboss(enemy, dmg);

        this.endbossStatusBar.setPercentage(enemy.energy);
        if (enemy.energy === 0 && typeof this.onEndbossDeath === 'function') {
            this.onEndbossDeath(enemy);
        }
    },

    /**
     * Applies bottle damage to the Endboss with original fallback logic.
     *
     * @param {Endboss} enemy - boss instance
     * @param {number} dmg - damage amount
     * @returns {void}
     */
    applyBottleDamageToEndboss(enemy, dmg) {
        try {
            if (enemy.hit.length >= 1) {
                enemy.hit(dmg);
            } else {
                enemy.hit();
            }
        } catch (e) {
            if (typeof enemy.energy === 'number') {
                enemy.energy = Math.max(0, enemy.energy - dmg);
            }
        }
    },

    /**
     * Removes finished projectiles after processing collisions.
     *
     * @returns {void}
     */
    cleanupProjectiles() {
        this.throwableObjects = this.throwableObjects.filter(p => !p.done);
    },

    /**
     * Handles generic bottle hit visuals and audio for any enemy.
     *
     * @param {ThrowableObject} bottle - bottle instance
     * @param {object} enemy - enemy instance
     * @returns {void}
     */
    onBottleHitsEnemy(bottle, enemy) {
        if (bottle && typeof bottle.onHit === 'function') {
            try {
                bottle.onHit(enemy);
            } catch (e) {}
        }

        try {
            const splashFrames = [
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/1_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/2_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/3_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/4_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/5_bottle_splash.png',
                '/img/6_salsa_bottle/bottle_rotation/bottle_splash/6_bottle_splash.png'
            ];
            const hitX = (bottle && typeof bottle.x === 'number')
                ? bottle.x + (bottle.width  || 0) * 0.5 - 45
                : (enemy?.x || 0) + (enemy?.width  || 0) * 0.5 - 45;
            const hitY = (bottle && typeof bottle.y === 'number')
                ? bottle.y + (bottle.height || 0) * 0.5 - 45
                : (enemy?.y || 0) + (enemy?.height || 0) * 0.5 - 45;
            const effect = new HitEffect(hitX, hitY, splashFrames, 320);
            effect.width = 100;
            effect.height = 100;
            this.effects.push(effect);
        } catch (e) {}

        try {
            if (this.hitAudio) {
                this.hitAudio.currentTime = 0;
                this.playAudioSafe(this.hitAudio);
            }
        } catch (e) {}
    },

    /**
     * Called from ThrowableObject.onGroundHit() to convert a missed projectile
     * back into a pickup bottle at its landing position.
     *
     * @param {ThrowableObject} projectile - projectile that hit the ground
     * @returns {void}
     */
    reuseBottleFromThrow(projectile) {
        if (!projectile || !this.level) return;

        const x = projectile.x;
        const y = projectile.y;

        try {
            this.throwableObjects = (this.throwableObjects || []).filter(p => p !== projectile);
        } catch (e) {}

        try {
            if (!Array.isArray(this.level.bottles)) {
                this.level.bottles = [];
            }

            this.level.bottles.push(new Bottle(x, y));
        } catch (e) {}
    }
};

Object.assign(World.prototype, WorldProjectilesMixin);
