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

        this.level.enemies.forEach((enemy) => {
            if (!enemy || enemy.dead === true) return;

            const bodyHit  = this.character.isColliding(enemy);
            const stompHit = this.didStompEnemy(enemy);

            if (stompHit) {
                if (enemy instanceof Chicken || enemy instanceof MiniChicken) {
                    enemy.die();
                    this.playEnemyDeathSound();

                    setTimeout(() => {
                        const victim = enemy;
                        this.level.enemies = this.level.enemies.filter(e => e !== victim);
                    }, 500);

                    this.character.speedY = 15;
                    this.character.makeInvulnerable();

                } else if (enemy instanceof Endboss) {
                    this.character.speedY = 18;
                    this.character.makeInvulnerable();
                }

            } else if (bodyHit && !this.character.invulnerable) {
                this.character.hit(20);
                this.playPainOnce();

                this.character.makeInvulnerable();
                this.character.speedY = Math.max(this.character.speedY, 8);
            }
        });
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

        const ca = this.character.getBounds();
        const eb = (typeof enemy.getBounds === 'function')
            ? enemy.getBounds()
            : {
                left:   enemy.x,
                top:    enemy.y,
                right:  enemy.x + enemy.width,
                bottom: enemy.y + enemy.height
            };

        const charH   = Math.max(1, ca.bottom - ca.top);
        const footH   = Math.max(32, Math.floor(charH * 0.52));
        const marginX = 6;

        const footL   = ca.left + marginX;
        const footR   = ca.right - marginX;
        const footTop = ca.bottom - footH;
        const footBot = ca.bottom;

        const overlapX = footL < eb.right && footR > eb.left;
        const overlapY = footTop < eb.bottom && footBot > eb.top;
        if (!overlapX || !overlapY) return false;

        const enemyMidY    = eb.top + (eb.bottom - eb.top) * 0.5;
        const hitAtTopHalf = footBot <= enemyMidY + 8;

        return hitAtTopHalf;
    };
})();
