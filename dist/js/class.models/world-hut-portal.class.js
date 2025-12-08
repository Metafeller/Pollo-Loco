/**
 * World hut, portal and winner screen flow.
 * Handles hut-story visibility, portal entry and boss death aftermath.
 *
 * Extends World.prototype without touching the constructor.
 */
(function () {
    if (typeof World === 'undefined') {
        return;
    }

    Object.assign(World.prototype, {
        /**
         * Story billboard: activate once when the player is near the gate
         * and keep it visible while the boss is still alive.
         *
         * @returns {void}
         */
        checkHutProximityAndStory() {
            if (!this.hutGate || !this.hutStory) return;

            if (!this._isBossAlive()) {
                this._resetHutStoryState();
                return;
            }

            if (this.storyLatched) {
                this._ensureHutStoryVisible();
                return;
            }

            if (this._isPlayerNearClosedGate()) {
                this._activateHutStoryAndLatch();
            }
        },

        /**
         * Returns true if a living Endboss is present in the level.
         *
         * @returns {boolean}
         */
        _isBossAlive() {
            return (this.level?.enemies || [])
                .some(e => e instanceof Endboss && !e.dead);
        },

        /**
         * Deactivates hut story and resets latch state.
         *
         * @returns {void}
         */
        _resetHutStoryState() {
            this.hutStory.deactivate();
            this.storyLatched = false;
        },

        /**
         * Ensures the hut story is visible while latched.
         *
         * @returns {void}
         */
        _ensureHutStoryVisible() {
            if (!this.hutStory.visible) {
                this.hutStory.activate();
            }
        },

        /**
         * Returns true if player is close to the closed gate.
         *
         * @returns {boolean}
         */
        _isPlayerNearClosedGate() {
            const playerX = this.character?.x || 0;
            const gateCenterX = this.hutGate.x + this.hutGate.width / 2;
            const near = Math.abs(playerX - gateCenterX) < 220;
            return near && !this.hutGate.isOpen;
        },

        /**
         * Activates hut story and latches the state.
         *
         * @returns {void}
         */
        _activateHutStoryAndLatch() {
            this.hutStory.activate();
            this.storyLatched = true;
        },

        /**
         * Portal entry: only allowed after boss death and with an open gate.
         *
         * @returns {void}
         */
        checkPortalEnter() {
            if (this.gameWon || !this.hutGate) return;

            if (this._isBossAlive()) return;
            if (!this.hutGate.isOpen) return;

            if (this.hutGate.isCharacterInPortal(this.character)) {
                this.stopPortalTimer();
                this.showWinnerScreen();
            }
        },

        /**
         * Shows the winner screen, wires restart/back-to-start callbacks
         * and pauses background music.
         *
         * @returns {void}
         */
        showWinnerScreen() {
            this.gameWon = true;
            this.stopPortalTimer();

            try { this.stopAmbienceLoop(); } catch (e) {}

            const screen = this.winnerScreen;
            if (screen) {
                screen.show();

                if (typeof screen.onRestartNow === 'function') {
                    screen.onRestartNow(() => {
                        if (window.restartNow) {
                            window.restartNow();
                        }
                    });
                }

                if (typeof screen.onBackToStart === 'function') {
                    screen.onBackToStart(() => {
                        if (window.backToStart) {
                            window.backToStart();
                        }
                    });
                }
            }

            try { this.pauseBgMusic(); } catch (e) {}
        },

        /**
         * Handles Endboss death: ensures death animation, stops boss systems,
         * opens the gate and starts the portal timer.
         *
         * @param {Endboss} endboss - boss instance that died
         * @returns {void}
         */
        onEndbossDeath(endboss) {
            if (this.bossDefeated) return;

            this._markBossDefeated();
            this._resetBossState(endboss);
            this._stopBossSystemsAfterDeath();
            this._handleBossDeathAudio();
            this._handleGateAndStoryAfterBossDeath();
            this.startPortalTimer();
        },

        /**
         * Marks boss as defeated and clears sight flag.
         *
         * @returns {void}
         */
        _markBossDefeated() {
            this.bossDefeated = true;
            this.endbossInSight = false;
        },

        /**
         * Resets boss flags and triggers death animation if needed.
         *
         * @param {Endboss} endboss
         * @returns {void}
         */
        _resetBossState(endboss) {
            if (!endboss) return;

            endboss.isInSight = false;
            endboss.inAggroMode = false;
            endboss.returning = false;
            endboss.aiState = 'IDLE';

            if (typeof endboss.die === 'function' &&
                !endboss.dead &&
                !endboss.isDying) {
                endboss.die();
            }
        },

        /**
         * Stops boss-related timers and swarm after death.
         *
         * @returns {void}
         */
        _stopBossSystemsAfterDeath() {
            this.stopEndbossTimer();
            this.stopMiniChickenSwarm();
            this.clearBossSpawnedMiniChickens();

            try {
                this.stopAmbienceLoop();
            } catch (e) {}
        },

        /**
         * Plays boss death audio once, if available.
         *
         * @returns {void}
         */
        _handleBossDeathAudio() {
            try {
                if (!this.bossDeathAudio) return;
                this.bossDeathAudio.currentTime = 0;
                this.playAudioSafe(this.bossDeathAudio);
            } catch (e) {}
        },

        /**
         * Opens the gate, hides story and resumes background music.
         *
         * @returns {void}
         */
        _handleGateAndStoryAfterBossDeath() {
            try {
                this.hutGate?.open();
            } catch (e) {}

            try {
                this.hutStory?.deactivate();
            } catch (e) {}

            this.storyLatched = false;

            try {
                this.resumeBgMusic();
            } catch (e) {}
        }
    });
})();
