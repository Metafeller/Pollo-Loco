/**
 * World timers & countdown HUD helpers (Endboss + Portal).
 * Extends World.prototype without touching the constructor.
 *
 * Requires: world-core.class.js loaded before this file.
 */
(function () {
    if (typeof World === 'undefined') {
        return;
    }

    /**
     * Returns true if the Endboss timer tick should be skipped.
     *
     * @returns {boolean}
     */
    World.prototype._shouldSkipEndbossTick = function () {
        if (!this.endbossTimerActive || this.paused) return true;

        if (this.gameOver || this.gameWon) {
            this.stopEndbossTimer();
            return true;
        }

        const boss = this.getCurrentEndboss();
        const bossDead = !boss || boss.energy <= 0;
        const playerDead = this.character.energy <= 0;

        if (bossDead || playerDead) {
            this.stopEndbossTimer();
            return true;
        }

        return false;
    };

    /**
     * Returns true if the portal timer tick should be skipped.
     *
     * @returns {boolean}
     */
    World.prototype._shouldSkipPortalTick = function () {
        if (!this.portalTimerActive || this.paused) return true;

        if (this.gameOver || this.gameWon) {
            this.stopPortalTimer();
            return true;
        }

        const bossAlive = (this.level?.enemies || [])
            .some(e => e instanceof Endboss && !e.dead);

        if (bossAlive && !this.bossDefeated) {
            this.stopPortalTimer();
            return true;
        }

        return false;
    };

    Object.assign(World.prototype, {
        /**
         * Starts the Endboss countdown when the fight begins.
         *
         * @returns {void}
         */
        startEndbossTimer() {
            if (this.endbossTimerActive) return;

            const boss = this.getCurrentEndboss();
            if (!boss) return;

            this.endbossTimerActive = true;
            this.endbossTimerSeconds = this.ENDBOSS_TIMEOUT_SECONDS;

            this.endbossTimerId = setInterval(() => {
                this.tickEndbossTimer();
            }, 1000);
        },

        /**
         * Processes a single tick of the Endboss timer.
         *
         * @returns {void}
         */
        tickEndbossTimer() {
            if (this._shouldSkipEndbossTick()) return;

            this.endbossTimerSeconds -= 1;

            if (this.endbossTimerSeconds <= 0) {
                this.handleEndbossTimeout();
            }
        },

        /**
         * Stops the Endboss timer and clears its interval.
         *
         * @returns {void}
         */
        stopEndbossTimer() {
            if (this.endbossTimerId) {
                clearInterval(this.endbossTimerId);
                this.endbossTimerId = null;
            }

            this.endbossTimerActive = false;
            this.endbossTimerSeconds = 0;
        },

        /**
         * Triggers defeat when the Endboss time limit has expired.
         *
         * @returns {void}
         */
        handleEndbossTimeout() {
            this.stopEndbossTimer();

            if (this.gameOver || this.gameWon) return;

            this.character.energy = 0;
            this.statusBar.setPercentage(this.character.energy);
            this.onPlayerDeath();
        },

        /**
         * Starts the portal countdown once the Endboss is defeated
         * and the gate is open. The player has limited time to enter.
         *
         * @returns {void}
         */
        startPortalTimer() {
            this.stopPortalTimer();

            if (!this.hutGate) return;
            if (this.gameOver || this.gameWon) return;

            this.portalTimerActive = true;
            this.portalTimerSeconds = this.PORTAL_TIMEOUT_SECONDS;

            this.playPortalTimerStartSound();

            this.portalTimerId = setInterval(() => {
                this.tickPortalTimer();
            }, 1000);
        },

        /**
         * Processes a single tick of the portal countdown.
         *
         * @returns {void}
         */
        tickPortalTimer() {
            if (this._shouldSkipPortalTick()) return;

            this.portalTimerSeconds -= 1;

            if (this.portalTimerSeconds <= 0) {
                this.handlePortalTimeout();
            }
        },

        /**
         * Stops the portal timer and clears its interval.
         *
         * @returns {void}
         */
        stopPortalTimer() {
            if (this.portalTimerId) {
                clearInterval(this.portalTimerId);
                this.portalTimerId = null;
            }

            this.portalTimerActive = false;
            this.portalTimerSeconds = 0;

            this.stopPortalTimerSound();
        },

        /**
         * Portal timeout missed → Pepe dies like in a normal game over.
         *
         * @returns {void}
         */
        handlePortalTimeout() {
            this.stopPortalTimer();

            if (this.gameOver || this.gameWon) return;

            this.character.energy = 0;

            if (this.statusBar && typeof this.statusBar.setPercentage === 'function') {
                this.statusBar.setPercentage(this.character.energy);
            }

            this.onPlayerDeath();
        },

        /**
         * Determines the color of the Endboss timer (white or blinking red).
         *
         * @param {number} now - current timestamp from performance.now()
         * @param {number} seconds - remaining seconds
         * @returns {string} CSS color string
         */
        getEndbossTimerColor(now, seconds) {
            if (seconds > 10) return '#ffffff';

            const blinkOn = (Math.floor(now / 250) % 2) === 0;
            return blinkOn ? '#ff3333' : '#ffffff';
        },

        /**
         * Determines the color for the portal countdown:
         * green when relaxed, blinking yellow/red during last 5 seconds.
         *
         * @param {number} now - current timestamp from performance.now()
         * @param {number} seconds - remaining seconds
         * @returns {string} CSS color string
         */
        getPortalTimerColor(now, seconds) {
            if (seconds > 5) return '#7CFC00';

            const blinkOn = (Math.floor(now / 250) % 2) === 0;
            return blinkOn ? '#ffcc33' : '#ff3333';
        },

        /**
         * Returns the active timer state (seconds + phase flags).
         *
         * @returns {{seconds:number,isBossPhase:boolean,isPortalPhase:boolean}}
         */
        _getActiveTimerState() {
            const state = {
                seconds: 0,
                isBossPhase: false,
                isPortalPhase: false
            };

            if (this.portalTimerActive && this.portalTimerSeconds > 0) {
                state.seconds = Math.max(0, this.portalTimerSeconds);
                state.isPortalPhase = true;
                return state;
            }

            if (this.endbossTimerActive && this.endbossTimerSeconds > 0) {
                state.seconds = Math.max(0, this.endbossTimerSeconds);
                state.isBossPhase = true;
            }

            return state;
        },

        /**
         * Configures text style for timer rendering.
         *
         * @param {CanvasRenderingContext2D} ctx
         * @returns {void}
         */
        _setupTimerTextStyle(ctx) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '32px sans-serif';
        },

        /**
         * Returns color for the current timer based on phase.
         *
         * @param {number} now
         * @param {number} seconds
         * @param {boolean} isBossPhase
         * @param {boolean} isPortalPhase
         * @returns {string}
         */
        _getTimerPhaseColor(now, seconds, isBossPhase, isPortalPhase) {
            if (isBossPhase) {
                return this.getEndbossTimerColor(now, seconds);
            }

            if (isPortalPhase) {
                return this.getPortalTimerColor(now, seconds);
            }

            return '#ffffff';
        },

        /**
         * Draws the Endboss and portal timer in the top center of the canvas.
         * Only one timer is active at a time.
         *
         * @param {CanvasRenderingContext2D} ctx - canvas context
         * @param {HTMLCanvasElement} canvas - canvas element
         * @param {number} now - timestamp from performance.now()
         * @returns {void}
         */
        drawEndbossTimer(ctx, canvas, now) {
            if (!canvas) return;

            const { seconds, isBossPhase, isPortalPhase } = this._getActiveTimerState();
            if (seconds <= 0) return;

            const cx = canvas.width / 2;
            const cy = 40;
            const w = 96;
            const h = 48;
            const x = cx - w / 2;
            const y = cy - h / 2;

            ctx.save();
            this._setupTimerTextStyle(ctx);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(x, y, w, h);

            ctx.fillStyle = this._getTimerPhaseColor(now, seconds, isBossPhase, isPortalPhase);
            ctx.fillText(String(seconds), cx, cy);

            ctx.restore();
        },

        /**
         * Returns true if the portal arrow should be drawn.
         *
         * @param {number} now
         * @returns {boolean}
         */
        _shouldDrawPortalArrow(now) {
            if (!this.portalTimerActive || this.portalTimerSeconds <= 0) return false;
            if (this.gameOver || this.gameWon) return false;

            const blinkOn = (Math.floor(now / 200) % 2) === 0;
            return blinkOn;
        },

        /**
         * Draws a blinking, pulsing arrow pointing to the right below the timer
         * while the portal countdown is active.
         *
         * @param {CanvasRenderingContext2D} ctx - canvas context
         * @param {number} now - timestamp from performance.now()
         * @returns {void}
         */
        drawPortalArrow(ctx, now) {
            const canvas = this.canvas;
            if (!canvas) return;
            if (!this._shouldDrawPortalArrow(now)) return;

            const cx = canvas.width / 2;
            const timerCy = 40;
            const timerH = 48;
            const arrowCy = timerCy + (timerH / 2) + 32;

            const t = now / 220;
            const scale = 1 + 0.2 * Math.sin(t);

            const w = 64 * scale;
            const h = 32 * scale;
            const baseX = cx - w / 2;

            ctx.save();

            ctx.beginPath();
            ctx.moveTo(baseX, arrowCy - h / 2);
            ctx.lineTo(baseX + w, arrowCy);
            ctx.lineTo(baseX, arrowCy + h / 2);
            ctx.closePath();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.shadowColor = 'rgba(0, 255, 0, 0.9)';
            ctx.shadowBlur = 16;
            ctx.fill();

            ctx.restore();
        }
    });
})();
