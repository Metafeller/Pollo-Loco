class Level {
    enemies;
    clouds;
    backgroundObjects;
    bottles;
    level_end_x = 6400;

    // NEU: optionale Level-Objekte (Tor & Story)
    hutGate = null;          // wird im Level initialisiert
    storyBillboard = null;   // wird im Level initialisiert

    constructor(enemies, clouds, backgroundObjects, bottles, hutGate = null, storyBillboard = null) {
        this.enemies = enemies;
        this.clouds = clouds;
        this.backgroundObjects = backgroundObjects;
        this.bottles = bottles; // Flaschen initialisieren

        // Neu
        this.hutGate = hutGate;
        this.storyBillboard = storyBillboard;
    }
}