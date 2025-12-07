/**
 * World rendering mixin.
 * Handles render loop, canvas clearing, world layers, HUD and debug frames.
 *
 * Extends World.prototype without touching the constructor.
 */
(function () {
    if (typeof World === 'undefined') {
        return;
    }

    Object.assign(World.prototype, {
        /**
         * Main render loop (per frame). Delegates to helper methods for clarity.
         *
         * @returns {void}
         */
        draw() {
            if (this.destroyed) return;

            this.clearCanvas();
            const now = performance.now();
            this.updateGameOverSequence(now);

            if (!this.paused) {
                this.updateFrameCollisions();
            }

            const camX = Math.round(this.camera_x);
            this.drawWorldLayers(camX);
            this.drawHudAndOverlays(now);

            requestAnimationFrame(() => this.draw());
        },

        /**
         * Clears the entire canvas for the next frame.
         *
         * @returns {void}
         */
        clearCanvas() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },

        /**
         * Per-frame collision checks (projectiles and player ↔ enemies).
         *
         * @returns {void}
         */
        updateFrameCollisions() {
            this.checkProjectileCollisions();
            this.checkCollisions();
        },

        /**
         * Draws all world layers that move with the camera.
         *
         * @param {number} camX - camera offset on the x-axis
         * @returns {void}
         */
        drawWorldLayers(camX) {
            this.drawBackgroundLayer(camX);
            this.drawForegroundLayer(camX);
        },

        /**
         * Background tiles and parallax layers.
         *
         * @param {number} camX - camera offset on the x-axis
         * @returns {void}
         */
        drawBackgroundLayer(camX) {
            this.ctx.save();
            this.ctx.translate(camX, 0);
            this.addObjectsToMap(this.level.backgroundObjects);
            this.ctx.restore();
        },

        /**
         * Foreground: clouds, hut, story, pickups, player, enemies, projectiles and effects.
         *
         * @param {number} camX - camera offset on the x-axis
         * @returns {void}
         */
        drawForegroundLayer(camX) {
            this.ctx.save();
            this.ctx.translate(camX, 0);

            this.drawCloudsAndHut();
            this.drawPickupsLayer();
            this.drawPlayerAndActors();

            this.ctx.restore();
        },

        /**
         * Draws clouds plus hut gate and story billboard.
         *
         * @returns {void}
         */
        drawCloudsAndHut() {
            this.addObjectsToMap(this.level.clouds);

            if (this.hutGate) this.addToMap(this.hutGate);
            if (this.hutStory && this.hutStory.visible) this.addToMap(this.hutStory);
        },

        /**
         * Draws coins, whiskey and hearts inside the level.
         *
         * @returns {void}
         */
        drawPickupsLayer() {
            if (Array.isArray(this.level.coins)) {
                this.addObjectsToMap(this.level.coins);
            }
            if (Array.isArray(this.level.whiskeys)) {
                this.addObjectsToMap(this.level.whiskeys);
            }
            if (Array.isArray(this.level.hearts)) {
                this.addObjectsToMap(this.level.hearts);
            }
        },

        /**
         * Draws player or gravestone, enemies, bottles, projectiles and effects.
         *
         * @returns {void}
         */
        drawPlayerAndActors() {
            if (this.gameOver) {
                if (this.gravestone) {
                    this.addToMap(this.gravestone);
                }
            } else {
                this.addToMap(this.character);
            }

            this.addObjectsToMap(this.level.bottles);
            if (!this.gameOver) this.addObjectsToMap(this.level.enemies);

            this.addObjectsToMap(this.throwableObjects);
            this.addObjectsToMap(this.effects);
        },

        /**
         * Fixed HUD on top of the world: status bars, timers, overlays and splash.
         *
         * @param {number} now - timestamp from performance.now()
         * @returns {void}
         */
        drawHudAndOverlays(now) {
            this.drawHudBarsAndTimers(now);
            this.drawWinnerAndGameOverOverlays();
            this.drawGameOverSplash(this.ctx, this.canvas);
        },

        /**
         * Draws status bars, counters, boss/portal timers and the portal arrow.
         *
         * @param {number} now - timestamp from performance.now()
         * @returns {void}
         */
        drawHudBarsAndTimers(now) {
            this.addToMap(this.statusBar);
            this.addToMap(this.bottleStatusBar);
            this.addToMap(this.coinStatusBar);
            this.addToMap(this.whiskeyCounter);

            if (this.endbossInSight) {
                this.addToMap(this.endbossStatusBar);
            }

            this.drawEndbossTimer(this.ctx, this.canvas, now);
            this.drawPortalArrow(this.ctx, now);
        },

        /**
         * Draws winner and game over overlays above the HUD.
         *
         * @returns {void}
         */
        drawWinnerAndGameOverOverlays() {
            if (this.winnerScreen && this.winnerScreen.visible) {
                this.winnerScreen.drawOverlay(this.ctx, this.canvas);
            }

            if (this.gameOverScreen && this.gameOverScreen.visible) {
                this.gameOverScreen.drawOverlay(this.ctx, this.canvas);
            }
        },

        /**
         * Adds an array of drawable objects to the map.
         *
         * @param {DrawableObject[]} objects - array of objects to draw
         * @returns {void}
         */
        addObjectsToMap(objects) {
            if (!Array.isArray(objects) || objects.length === 0) return;

            for (let i = 0; i < objects.length; i++) {
                const o = objects[i];
                if (!o) continue;
                this.addToMap(o);
            }
        },

        /**
         * Draws a single object with optional flipped rendering and debug frames.
         *
         * @param {DrawableObject} mo - map object
         * @returns {void}
         */
        addToMap(mo) {
            if (!mo) return;

            this._drawMainObject(mo);

            if (this.DEBUG_FRAMES) {
                this._drawDebugForObject(mo);
            }
        },

        /**
         * Handles flipped/non-flipped draw of a single object.
         *
         * @param {DrawableObject} mo
         * @returns {void}
         */
        _drawMainObject(mo) {
            const flipped = !!mo.otherDirection;

            if (flipped) {
                this.flipImage(mo);
            }

            mo.draw(this.ctx);

            if (flipped) {
                this.flipImageBack(mo);
            }
        },

        /**
         * Draws debug frames and helper rectangles for an object if needed.
         *
         * @param {DrawableObject} mo
         * @returns {void}
         */
        _drawDebugForObject(mo) {
            if (this._shouldDrawDebugFrame(mo)) {
                mo.drawFrame(this.ctx);
            }

            if (mo === this.character) {
                this._drawCharacterFootDebugRect();
            }
        },

        /**
         * Returns true if debug frame should be drawn for this object.
         *
         * @param {DrawableObject} mo
         * @returns {boolean}
         */
        _shouldDrawDebugFrame(mo) {
            if (!mo || typeof mo.drawFrame !== 'function') return false;

            const important =
                mo === this.character ||
                mo instanceof Chicken || mo instanceof MiniChicken ||
                mo instanceof Endboss ||
                mo instanceof ThrowableObject || mo instanceof Fireball ||
                mo instanceof Gravestone || mo instanceof HutGate ||
                mo instanceof StoryBillboard ||
                mo instanceof Coin || mo instanceof Bottle ||
                mo instanceof WhiskeyPickup || mo instanceof HeartPickup;

            return important;
        },

        /**
         * Draws the stomp foot-zone debug rectangle for Pepe.
         *
         * @returns {void}
         */
        _drawCharacterFootDebugRect() {
            const ca = this.character.getBounds();
            const charH = Math.max(1, ca.bottom - ca.top);
            const footH = Math.max(32, Math.floor(charH * 0.52));
            const marginX = 6;

            const x = ca.left + marginX;
            const y = ca.bottom - footH;
            const w = (ca.right - ca.left) - marginX * 2;
            const h = footH;

            this.ctx.save();
            this.ctx.setLineDash([6, 4]);
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = 'lime';
            this.ctx.strokeRect(x, y, w, h);
            this.ctx.setLineDash([]);
            this.ctx.restore();
        },

        /**
         * Flips an object's image horizontally.
         *
         * @param {DrawableObject} mo - map object
         * @returns {void}
         */
        flipImage(mo) {
            this.ctx.save();
            this.ctx.translate(mo.width, 0);
            this.ctx.scale(-1, 1);
            mo.x = mo.x * -1;
        },

        /**
         * Restores the flipped image to its original orientation.
         *
         * @param {DrawableObject} mo - map object
         * @returns {void}
         */
        flipImageBack(mo) {
            mo.x = mo.x * -1;
            this.ctx.restore();
        }
    });
})();
