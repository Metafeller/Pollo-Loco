/**
 * World endgame flow: player death, GameOver overlay,
 * winner screen and boss/hut/portal flow.
 *
 * Extends World.prototype without touching the constructor.
 */
(function () {
    if (typeof World === 'undefined') {
        return;
    }

    Object.assign(World.prototype, {
        /**
         * Final player death handler.
         * Stops all relevant systems, spawns the gravestone,
         * starts the game over audio sequence and initialises the GO sequencer.
         *
         * @returns {void}
         */
        onPlayerDeath() {
            if (this.gameOver) return;
            this.gameOver = true;

            this.stopBossAndPortalSystems();
            this.stopStepAndAmbienceSounds();
            this.freezeEnemiesAndCharacter();
            this.createGravestoneForCharacter();
            this.playDeathAudioSequence();
            this.setupGameOverScreenWithRestartHook();
            this.initGameOverSequencer();
        },

        /**
         * Stops all boss and portal related timers plus mini-chicken swarm.
         *
         * @returns {void}
         */
        stopBossAndPortalSystems() {
            this.stopEndbossTimer();
            this.stopPortalTimer();
            this.stopMiniChickenSwarm();
        },

        /**
         * Freezes all enemies and the player character.
         *
         * @returns {void}
         */
        freezeEnemiesAndCharacter() {
            this.freezeAllEnemies();
            this.freezeCharacter();
        },

        /**
         * Sets all enemies to a frozen state (no movement, no AI).
         *
         * @returns {void}
         */
        freezeAllEnemies() {
            try {
                (this.level?.enemies || []).forEach(e => {
                    if (!e) return;

                    e.speed = 0;
                    e.baseSpeed = 0;

                    if (typeof e.moveLeft === 'function') {
                        e.moveLeft = function () {};
                    }
                    if (typeof e.moveRight === 'function') {
                        e.moveRight = function () {};
                    }
                    if (typeof e.updateAI === 'function') {
                        e.updateAI = function () {};
                    }

                    if (e instanceof Endboss) {
                        e.inAggroMode = false;
                        e.aiState = 'IDLE';
                        e.returning = false;
                    }
                });
            } catch (e) {}
        },

        /**
         * Freezes the player character and marks him as dead.
         *
         * @returns {void}
         */
        freezeCharacter() {
            try {
                this.character.dead = true;
                this.character.speed = 0;
                this.character.speedY = 0;
            } catch (e) {}
        },

        /**
         * Places the gravestone at the player's feet with a slight sink.
         *
         * @returns {void}
         */
        createGravestoneForCharacter() {
            try {
                const SW = 120;
                const SH = 340;
                const gx = this.character.x + (this.character.width * 0.5) - (SW / 2);

                const SINK_PX = 64;
                const gy = this.character.y + this.character.height - SH + SINK_PX;

                this.gravestone = new Gravestone(gx, gy, SW, SH);
            } catch (e) {}
        },

        /**
         * Builds the GameOver screen overlay and wires the Try Again callback.
         *
         * @returns {void}
         */
        setupGameOverScreenWithRestartHook() {
            try {
                if (!this.gameOverScreen) {
                    this.gameOverScreen = new GameOverScreen();
                }
                this.gameOverScreen.attachDom('.stage');

                this.gameOverScreen.onTryAgain(() => {
                    try {
                        if (typeof this.resetAllAudios === 'function') {
                            this.resetAllAudios();
                        } else if (typeof this.stopAllGameOverAudio === 'function') {
                            this.stopAllGameOverAudio();
                        }
                    } catch (e) {}

                    if (window.restartNow) {
                        window.restartNow();
                    }
                });
            } catch (e) {}
        },

        /**
         * Resets GameOver sequencer timing flags and prepares the splash.
         *
         * @returns {void}
         */
        initGameOverSequencer() {
            this.goT0 = performance.now();
            this.goOverlayShown = false;
            this.goButtonShown = false;
            this.goLoopsStarted = false;
            this.goSplashShown = false;
            this.goSplashActive = false;

            try {
                if (this.goSplashImg && typeof this.goSplashImg.decode === 'function') {
                    this.goSplashImg.decode().catch(() => {});
                }
            } catch (e) {}

            try {
                this.pauseBgMusic();
            } catch (e) {}
        },

        /**
         * Per-frame game over sequencer.
         * No timers used to avoid race conditions with restart.
         *
         * @param {number} now - current timestamp from performance.now()
         * @returns {void}
         */
        updateGameOverSequence(now) {
            if (!this.gameOver) return;

            const elapsed = now - this.goT0;

            if (!this.goSplashShown && elapsed >= this.SPLASH_DELAY_MS) {
                this.goSplashActive = true;
                this.goSplashShown = true;
            }

            if (this.goSplashActive && elapsed >= (this.SPLASH_DELAY_MS + this.SPLASH_MS)) {
                this.goSplashActive = false;
            }

            if (!this.goOverlayShown && elapsed >= this.OVERLAY_AT_MS) {
                this.startGameOverOverlay();
                this.goOverlayShown = true;
            }

            if (!this.goButtonShown && elapsed >= this.BUTTON_AT_MS) {
                this.revealTryAgainButton();
                this.goButtonShown = true;
            }
        },

        /**
         * Draws the game over splash image on the canvas (full cover, no tint).
         *
         * @param {CanvasRenderingContext2D} ctx - canvas context
         * @param {HTMLCanvasElement} canvas - canvas element
         * @returns {void}
         */
        drawGameOverSplash(ctx, canvas) {
            if (!this.goSplashActive || !this.goSplashImg) return;

            const { width, height } = canvas;
            const img = this.goSplashImg;

            if (img.complete && (img.naturalWidth || 0) > 0) {
                const iw = img.naturalWidth;
                const ih = img.naturalHeight;

                const scale = Math.max(width / iw, height / ih);
                const drawW = iw * scale;
                const drawH = ih * scale;
                const dx = (width - drawW) / 2;
                const dy = (height - drawH) / 2;

                ctx.save();
                ctx.globalAlpha = 1;
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(img, dx, dy, drawW, drawH);
                ctx.restore();
            }
        },

        /**
         * Starts the game over overlay and the ambient audio loops.
         *
         * @returns {void}
         */
        startGameOverOverlay() {
            if (!this.gameOverScreen) return;

            this.gameOverScreen.show();

            if (this.goLoopsStarted) return;
            this.goLoopsStarted = true;

            try {
                if (this.goCryLoop) {
                    this.goCryLoop.loop = true;
                    this.goCryLoop.volume = 0.7;
                    this.goCryLoop.currentTime = 0;
                    this.playAudioSafe(this.goCryLoop);
                }
                if (this.goRainLoop) {
                    this.goRainLoop.loop = true;
                    this.goRainLoop.volume = 0.5;
                    this.goRainLoop.currentTime = 0;
                    this.playAudioSafe(this.goRainLoop);
                }
            } catch (e) {}
        },

        /**
         * Reveals the Try Again button on the game over screen.
         *
         * @returns {void}
         */
        revealTryAgainButton() {
            if (!this.gameOverScreen) return;
            this.gameOverScreen.showButton();
        },

        /**
         * Story billboard: activate once when the player is near the gate
         * and keep it visible while the boss is still alive.
         *
         * @returns {void}
         */
        checkHutProximityAndStory() {
            if (!this.hutGate || !this.hutStory) return;

            const bossAlive = (this.level?.enemies || [])
                .some(e => e instanceof Endboss && !e.dead);

            if (!bossAlive) {
                this.hutStory.deactivate();
                this.storyLatched = false;
                return;
            }

            if (this.storyLatched) {
                if (!this.hutStory.visible) {
                    this.hutStory.activate();
                }
                return;
            }

            const playerX = this.character?.x || 0;
            const gateCenterX = this.hutGate.x + this.hutGate.width / 2;
            const near = Math.abs(playerX - gateCenterX) < 220;

            if (near && !this.hutGate.isOpen) {
                this.hutStory.activate();
                this.storyLatched = true;
            }
        },

        /**
         * Portal entry: only allowed after boss death and with an open gate.
         *
         * @returns {void}
         */
        checkPortalEnter() {
            if (this.gameWon || !this.hutGate) return;

            const bossAlive = (this.level?.enemies || [])
                .some(e => e instanceof Endboss && !e.dead);

            if (bossAlive) return;
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

            try {
                this.stopAmbienceLoop();
            } catch (e) {}

            if (this.winnerScreen) {
                this.winnerScreen.show();

                if (typeof this.winnerScreen.onRestartNow === 'function') {
                    this.winnerScreen.onRestartNow(() => {
                        if (window.restartNow) {
                            window.restartNow();
                        }
                    });
                }

                if (typeof this.winnerScreen.onBackToStart === 'function') {
                    this.winnerScreen.onBackToStart(() => {
                        if (window.backToStart) {
                            window.backToStart();
                        }
                    });
                }
            }

            try {
                this.pauseBgMusic();
            } catch (e) {}
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
            this.bossDefeated = true;

            this.endbossInSight = false;

            if (endboss) {
                endboss.isInSight = false;
                endboss.inAggroMode = false;
                endboss.returning = false;
                endboss.aiState = 'IDLE';

                if (typeof endboss.die === 'function' &&
                    !endboss.dead &&
                    !endboss.isDying) {
                    endboss.die();
                }
            }

            this.stopEndbossTimer();
            this.stopMiniChickenSwarm();
            this.clearBossSpawnedMiniChickens();

            try {
                this.stopAmbienceLoop();
            } catch (e) {}

            try {
                if (this.bossDeathAudio) {
                    this.bossDeathAudio.currentTime = 0;
                    this.playAudioSafe(this.bossDeathAudio);
                }
            } catch (e) {}

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

            this.startPortalTimer();
        }
    });
})();