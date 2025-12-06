/**
 * World boss & mini-chicken logic (Endboss phase, swarm & boss music).
 * Mixin for World.prototype.
 */
const WorldBossMixin = {
    /**
     * Checks whether the Endboss is currently in chase state and updates
     * the world flag used for HUD and audio decisions.
     *
     * @returns {void}
     */
    checkEndbossSight() {
        const endboss = this.level.enemies.find(e => e instanceof Endboss);
        if (!endboss) return;
        this.endbossInSight = (endboss.aiState === 'CHASE');
    },


    /**
     * Handles AI and state for the Endboss and the mini-chicken swarm.
     *
     * @returns {void}
     */
    updateEndbossPhase() {
        const endboss = this.getCurrentEndboss();
        if (endboss && !this.bossDefeated) {
            endboss.updateAI(this.character?.x || 0);
            this.endbossInSight = (endboss.aiState === 'CHASE');

            if (this.endbossInSight) {
                this.startEndbossTimer();
                this.startMiniChickenSwarm();
            } else {
                this.stopMiniChickenSwarm();
            }
            return;
        }

        this.endbossInSight = false;
        this.stopMiniChickenSwarm();
    },


    /**
     * Pauses or resumes background music depending on boss visibility.
     *
     * @returns {void}
     */
    updateBossMusicState() {
        if (this.endbossInSight) {
            this.pauseBgMusic();
        } else {
            this.resumeBgMusic();
        }
    },


    /**
     * Returns the current living Endboss (if any).
     *
     * @returns {Endboss|null} Endboss instance or null
     */
    getCurrentEndboss() {
        const enemies = this.level?.enemies || [];
        const boss = enemies.find(e => e instanceof Endboss && !e.dead);
        return boss || null;
    },


    /**
     * Returns all living mini chickens that were spawned by the Endboss.
     *
     * @returns {MiniChicken[]} active boss-spawned mini chickens
     */
    getActiveMiniChickens() {
        const enemies = this.level?.enemies || [];
        return enemies.filter(
            (e) => e instanceof MiniChicken && !e.dead && e.spawnedByBoss
        );
    },


    /**
     * Starts the mini-chicken swarm routine when the boss fight begins.
     * Only runs once per boss fight.
     *
     * @returns {void}
     */
    startMiniChickenSwarm() {
        if (this.miniSwarmActive || this.bossDefeated) return;

        const boss = this.getCurrentEndboss();
        if (!boss) return;

        if (this.miniSwarmOriginX == null) {
            this.miniSwarmOriginX =
                boss.startX || boss.spawnX || boss.homeX || boss.x;
        }

        this.miniSwarmActive = true;
        this.spawnMiniChickenGroup(boss);

        this.miniSwarmTimerId = setInterval(() => {
            this.tickMiniChickenSwarm();
        }, this.MINI_SWARM_INTERVAL_MS);
    },


    /**
     * Swarm tick: spawns new waves while the boss is alive and the game is running.
     *
     * @returns {void}
     */
    tickMiniChickenSwarm() {
        if (!this.miniSwarmActive || this.bossDefeated) return;
        if (this.paused || this.gameOver || this.gameWon) return;

        const boss = this.getCurrentEndboss();
        if (!boss) {
            this.stopMiniChickenSwarm();
            return;
        }

        const active = this.getActiveMiniChickens();
        if (active.length >= this.MINI_SWARM_MAX_COUNT) return;

        this.spawnMiniChickenGroup(boss);
    },


    /**
     * Spawns a small group of mini chickens near the Endboss.
     * They always spawn in front of the boss (to the left).
     *
     * @param {Endboss} boss - current boss instance
     * @returns {void}
     */
    spawnMiniChickenGroup(boss) {
        if (!boss) return;

        const active = this.getActiveMiniChickens();
        const freeSlots = this.MINI_SWARM_MAX_COUNT - active.length;
        if (freeSlots <= 0) return;

        const groupSize = Math.min(this.MINI_SWARM_GROUP_SIZE, freeSlots);
        const enemies = this.level?.enemies || [];

        const originX =
            this.miniSwarmOriginX ||
            boss.startX ||
            boss.spawnX ||
            boss.homeX ||
            boss.x;

        const baseX = originX - 100;

        for (let i = 0; i < groupSize; i++) {
            const offset = i * 70;
            const spawnX = baseX - offset;
            enemies.push(new MiniChicken(spawnX, true));
        }

        this.level.enemies = enemies;
    },


    /**
     * Stops the mini-chicken swarm timer and deactivates the swarm flag.
     *
     * @returns {void}
     */
    stopMiniChickenSwarm() {
        if (this.miniSwarmTimerId) {
            clearInterval(this.miniSwarmTimerId);
            this.miniSwarmTimerId = null;
        }
        this.miniSwarmActive = false;
    },


    /**
     * Clears all boss-spawned mini chickens from the level.
     *
     * @returns {void}
     */
    clearBossSpawnedMiniChickens() {
        const enemies = this.level?.enemies || [];
        this.level.enemies = enemies.filter(
            (e) => !(e instanceof MiniChicken && e.spawnedByBoss)
        );
    }
};

Object.assign(World.prototype, WorldBossMixin);
