/**
 * World endgame flow: player death, GameOver overlay and gravestone.
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
                (this.level?.enemies || []).forEach(e => this._freezeEnemy(e));
            } catch (e) {}
        },

        /**
         * Freezes a single enemy: speed 0, no movement, no AI, boss AI reset.
         *
         * @param {any} enemy
         * @returns {void}
         */
        _freezeEnemy(enemy) {
            if (!enemy) return;

            enemy.speed = 0;
            enemy.baseSpeed = 0;

            this._disableEnemyMovement(enemy);
            this._resetBossAggroIfNeeded(enemy);
        },

        /**
         * Disables movement and AI methods on the enemy.
         *
         * @param {any} enemy
         * @returns {void}
         */
        _disableEnemyMovement(enemy) {
            if (typeof enemy.moveLeft === 'function') {
                enemy.moveLeft = function () {};
            }
            if (typeof enemy.moveRight === 'function') {
                enemy.moveRight = function () {};
            }
            if (typeof enemy.updateAI === 'function') {
                enemy.updateAI = function () {};
            }
        },

        /**
         * Resets Endboss AI/aggro flags if the enemy is a boss.
         *
         * @param {any} enemy
         * @returns {void}
         */
        _resetBossAggroIfNeeded(enemy) {
            if (!(enemy instanceof Endboss)) return;

            enemy.inAggroMode = false;
            enemy.aiState = 'IDLE';
            enemy.returning = false;
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
         * Per-frame game over sequencer (no timers to avoid restart races).
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
            if (!this.goSplashActive || !this.goSplashImg || !canvas) return;

            const img = this.goSplashImg;
            if (!img.complete || !(img.naturalWidth > 0)) return;

            const { width, height } = canvas;
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
        },

        // Internal: starts a looping Game Over ambience sound.
        _startGameOverLoop(audio, volume) {
            if (!audio) return;
            audio.loop = true;
            audio.volume = volume;
            audio.currentTime = 0;
            this.playAudioSafe(audio);
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
                this._startGameOverLoop(this.goCryLoop, 0.7);
                this._startGameOverLoop(this.goRainLoop, 0.5);
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
        }
    });
})();
