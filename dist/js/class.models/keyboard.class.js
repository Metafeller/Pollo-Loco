/**
 * Simple keyboard state holder.
 * Each property represents whether a key is currently pressed.
 */
class Keyboard {
    /** @type {boolean} Arrow left key */
    LEFT = false;

    /** @type {boolean} Arrow right key */
    RIGHT = false;

    /** @type {boolean} Arrow up key */
    UP = false;

    /** @type {boolean} Arrow down key */
    DOWN = false;

    /** @type {boolean} Space bar (jump) */
    SPACE = false;

    /** @type {boolean} D key (throw bottle) */
    D = false; // Throw = bottle

    /** @type {boolean} F key (special attack / supernova) */
    F = false; // Supernova
}
