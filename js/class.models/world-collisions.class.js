/**
 * Collision logic between Pepe and enemies (stomp + body hit).
 * Mixin-style extension for the World prototype.
 */
(function () {
    'use strict';

    /**
     * Checks collisions between the player and all enemies,
     * including stomp detection and damage handling.
     *
     * @returns {void}
     */
    World.prototype.checkCollisions = function () {
        if (this.isInStartGrace()) return;

        (this.level?.enemies || []).forEach((enemy) => {
            this._handleEnemyCollision(enemy);
        });
    };

    /**
     * Handles collision logic for a single enemy.
     *
     * @param {any} enemy
     * @returns {void}
     */
    World.prototype._handleEnemyCollision = function (enemy) {
        if (!enemy || enemy.dead === true) return;

        const bodyHit  = this.character.isColliding(enemy);
        const stompHit = this.didStompEnemy(enemy);

        if (stompHit) {
            this._handleStompHit(enemy);
        } else if (bodyHit && !this.character.invulnerable) {
            this._handleBodyHit(enemy);
        }
    };

    /**
     * Handles stomp hits (Pepe from above).
     *
     * @param {any} enemy
     * @returns {void}
     */
    World.prototype._handleStompHit = function (enemy) {
        if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
            enemy.die();
            this.playEnemyDeathSound();

            setTimeout(() => {
                const victim = enemy;
                this.level.enemies = this.level.enemies.filter(e => e !== victim);
            }, 500);

            this.character.speedY = 15;
            this.character.makeInvulnerable();
            return;
        }

        if (enemy instanceof Endboss) {
            this.character.speedY = 18;
            this.character.makeInvulnerable();
        }
    };

    /**
     * Handles body collisions (Pepe gets damage).
     *
     * @param {any} enemy
     * @returns {void}
     */
    World.prototype._handleBodyHit = function (enemy) {
        this.character.hit(20);
        this.playPainOnce();

        this.character.makeInvulnerable();
        this.character.speedY = Math.max(this.character.speedY, 8);
    };

    /**
     * Returns true if Pepe hits the enemy from above (stomp).
     * Uses a generous foot zone and checks that the hit is within
     * the upper half of the enemy.
     *
     * @param {object} enemy - enemy instance
     * @returns {boolean} whether the stomp conditions are met
     */
    World.prototype.didStompEnemy = function (enemy) {
        if (!enemy) return false;

        const vy = this.character.speedY || 0;
        if (vy > -0.2) return false;

        const ca   = this.character.getBounds();
        const eb   = this._getEnemyBounds(enemy);
        const foot = this._getCharacterFootZone(ca);

        if (!this._footOverlapsEnemy(foot, eb)) return false;

        return this._isHitInTopHalf(foot, eb);
    };

    /**
     * Normalises enemy bounds to a {left, top, right, bottom} object.
     *
     * @param {any} enemy
     * @returns {{left:number, top:number, right:number, bottom:number}}
     */
    World.prototype._getEnemyBounds = function (enemy) {
        if (typeof enemy.getBounds === 'function') {
            return enemy.getBounds();
        }

        return {
            left:   enemy.x,
            top:    enemy.y,
            right:  enemy.x + enemy.width,
            bottom: enemy.y + enemy.height
        };
    };

    /**
     * Calculates Pepe's foot zone used for stomp detection.
     *
     * @param {{left:number, top:number, right:number, bottom:number}} ca
     * @returns {{left:number, right:number, top:number, bottom:number}}
     */
    World.prototype._getCharacterFootZone = function (ca) {
        const charH   = Math.max(1, ca.bottom - ca.top);
        const footH   = Math.max(32, Math.floor(charH * 0.52));
        const marginX = 6;

        const footL   = ca.left + marginX;
        const footR   = ca.right - marginX;
        const footTop = ca.bottom - footH;
        const footBot = ca.bottom;

        return { left: footL, right: footR, top: footTop, bottom: footBot };
    };

    /**
     * Returns true if Pepe's foot zone overlaps the enemy hitbox.
     *
     * @param {{left:number,right:number,top:number,bottom:number}} foot
     * @param {{left:number,right:number,top:number,bottom:number}} eb
     * @returns {boolean}
     */
    World.prototype._footOverlapsEnemy = function (foot, eb) {
        const overlapX = foot.left  < eb.right  && foot.right  > eb.left;
        const overlapY = foot.top   < eb.bottom && foot.bottom > eb.top;
        return overlapX && overlapY;
    };

    /**
     * Returns true if the hit is in the upper half of the enemy.
     *
     * @param {{bottom:number}} foot
     * @param {{top:number,bottom:number}} eb
     * @returns {boolean}
     */
    World.prototype._isHitInTopHalf = function (foot, eb) {
        const enemyMidY = eb.top + (eb.bottom - eb.top) * 0.5;
        return foot.bottom <= enemyMidY + 8;
    };
})();
