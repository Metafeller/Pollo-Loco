/**
 * Represents a single level configuration:
 * - Holds enemies, clouds, background objects, bottles
 * - Optionally exposes the hut gate and story billboard
 */
class Level {
    /** @type {MovableObject[]} */
    enemies;

    /** @type {Cloud[]} */
    clouds;

    /** @type {BackgroundObject[]} */
    backgroundObjects;

    /** @type {Bottle[]} */
    bottles;

    /** @type {number} X-position where the level ends */
    level_end_x = 6400;

    // New: collectibles
    /** @type {Coin[]} */
    coins = [];

    /** @type {Whiskey[]} */
    whiskeys = [];

    // Optional level objects (Gate & Story)
    /** @type {HutGate|null} */
    hutGate = null;

    /** @type {StoryBillboard|null} */
    storyBillboard = null;

    /**
     * Creates a new level configuration.
     *
     * @param {MovableObject[]} enemies - All enemies in the level.
     * @param {Cloud[]} clouds - Cloud objects used as parallax background.
     * @param {BackgroundObject[]} backgroundObjects - Static background layers.
     * @param {Bottle[]} bottles - Collectible bottles in the level.
     * @param {HutGate|null} [hutGate=null] - Optional hut gate object.
     * @param {StoryBillboard|null} [storyBillboard=null] - Optional story billboard.
     */
    constructor(enemies, clouds, backgroundObjects, bottles, hutGate = null, storyBillboard = null) {
        this.enemies = enemies;
        this.clouds = clouds;
        this.backgroundObjects = backgroundObjects;
        this.bottles = bottles;

        // Optional gate & story elements
        this.hutGate = hutGate;
        this.storyBillboard = storyBillboard;
    }
}
