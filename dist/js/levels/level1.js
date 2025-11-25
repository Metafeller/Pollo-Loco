// js/levels/level1.js

// Bodenlinie: Character.y (80) + Character.height (280) = 360
const GROUND_BOTTOM = 480;

/** Baut ein frisches Level-Objekt mit allen Gegnern, Clouds, Backgrounds & Pickups. */
function buildLevel1() {
    // Hütte (bei x=500), Höhe frei einstellbar
    const gate = new HutGate(6000, 480, 500, 320);

    // Story an Gate verankern (erzwingt gleiche „Hütte“)
    const hutStory = new StoryBillboard(6000, 180, 100, 500, gate);

    hutStory.offsetX = 0;
    hutStory.offsetY = 0;

    // ADD: helper for distributed spawns with minimal spacing
    function spawnDistributed(factory/*(x)=>obj*/, count, xStart, xEnd, minSpacing=400) {
      const picks = [];
      const range = xEnd - xStart;
      const step = Math.max(minSpacing, Math.floor(range / Math.max(1, count)));
      let x = xStart + 200; 
      for (let i=0; i<count; i++) {
        const jitter = Math.floor(Math.random() * Math.min(step-50, 220));
        const px = Math.min(xEnd-50, x + jitter);
        picks.push(factory(px));
        x += step;
      }
      return picks;
    }

    const CHICKEN_COUNT = 9;
    const MINI_COUNT    = 8;

    const chickensDistributed = spawnDistributed((x)=>new Chicken(x), CHICKEN_COUNT, 600, 5900, 420);
    const minisDistributed    = spawnDistributed((x)=>new MiniChicken(x), MINI_COUNT,  900, 5800, 360);

    const level = new Level(
        [
            ...chickensDistributed,
            ...minisDistributed,
            new Endboss(6666)
        ],

        [
            new Cloud(  150,  60, 0.12),
            new Cloud(  900,  80, 0.10),
            new Cloud( 1600,  55, 0.14),
            new Cloud( 2300,  95, 0.12),
            new Cloud( 3000,  70, 0.10),
            new Cloud( 3700,  50, 0.13),
            new Cloud( 4400,  85, 0.11),
            new Cloud( 5100,  60, 0.15),
            new Cloud( 5800, 100, 0.12),
            new Cloud( 6500,  75, 0.10)
        ],

        [
            new BackgroundObject('/img/5_background/layers/air.png', -719),
            new BackgroundObject('/img/5_background/layers/3_third_layer/1.png', -719),
            new BackgroundObject('/img/5_background/layers/2_second_layer/1.png', -719),
            new BackgroundObject('/img/5_background/layers/1_first_layer/1.png', -719),
            new BackgroundObject('/img/5_background/layers/air.png', -719),
            new BackgroundObject('/img/5_background/layers/3_third_layer/2.png', -719),
            new BackgroundObject('/img/5_background/layers/2_second_layer/2.png', -719),
            new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', -719),

            new BackgroundObject('/img/5_background/layers/air.png', 0),
            new BackgroundObject('/img/5_background/layers/3_third_layer/1.png', 0),
            new BackgroundObject('/img/5_background/layers/2_second_layer/1.png', 0),
            new BackgroundObject('/img/5_background/layers/1_first_layer/1.png', 0),
            new BackgroundObject('/img/5_background/layers/air.png', 719),
            new BackgroundObject('/img/5_background/layers/3_third_layer/2.png', 719),
            new BackgroundObject('/img/5_background/layers/2_second_layer/2.png', 719),
            new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', 719),

            new BackgroundObject('/img/5_background/layers/air.png', 719*2),
            new BackgroundObject('/img/5_background/layers/3_third_layer/1.png', 719*2),
            new BackgroundObject('/img/5_background/layers/2_second_layer/1.png', 719*2),
            new BackgroundObject('/img/5_background/layers/1_first_layer/1.png', 719*2),
            new BackgroundObject('/img/5_background/layers/air.png', 719*3),
            new BackgroundObject('/img/5_background/layers/3_third_layer/2.png', 719*3),
            new BackgroundObject('/img/5_background/layers/2_second_layer/2.png', 719*3),
            new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', 719*3),

            new BackgroundObject('/img/5_background/layers/air.png', 719*4),
            new BackgroundObject('/img/5_background/layers/3_third_layer/1.png', 719*4),
            new BackgroundObject('/img/5_background/layers/2_second_layer/1.png', 719*4),
            new BackgroundObject('/img/5_background/layers/1_first_layer/1.png', 719*4),
            new BackgroundObject('/img/5_background/layers/air.png', 719*5),
            new BackgroundObject('/img/5_background/layers/3_third_layer/2.png', 719*5),
            new BackgroundObject('/img/5_background/layers/2_second_layer/2.png', 719*5),
            new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', 719*5),

            new BackgroundObject('/img/5_background/layers/air.png', 719*6),
            new BackgroundObject('/img/5_background/layers/3_third_layer/1.png', 719*6),
            new BackgroundObject('/img/5_background/layers/2_second_layer/1.png', 719*6),
            new BackgroundObject('/img/5_background/layers/1_first_layer/1.png', 719*6),
            new BackgroundObject('/img/5_background/layers/air.png', 719*7),
            new BackgroundObject('/img/5_background/layers/3_third_layer/2.png', 719*7),
            new BackgroundObject('/img/5_background/layers/2_second_layer/2.png', 719*7),
            new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', 719*7),

            new BackgroundObject('/img/5_background/layers/air.png', 719*8),
            new BackgroundObject('/img/5_background/layers/3_third_layer/1.png', 719*8),
            new BackgroundObject('/img/5_background/layers/2_second_layer/1.png', 719*8),
            new BackgroundObject('/img/5_background/layers/1_first_layer/1.png', 719*8),
            new BackgroundObject('/img/5_background/layers/air.png', 719*9),
            new BackgroundObject('/img/5_background/layers/3_third_layer/2.png', 719*9),
            new BackgroundObject('/img/5_background/layers/2_second_layer/2.png', 719*9),
            new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', 719*9),

            new BackgroundObject('/img/5_background/layers/air.png', 719*10),
            new BackgroundObject('/img/5_background/layers/3_third_layer/1.png', 719*10),
            new BackgroundObject('/img/5_background/layers/2_second_layer/1.png', 719*10),
            new BackgroundObject('/img/5_background/layers/1_first_layer/1.png', 719*10),
            new BackgroundObject('/img/5_background/layers/air.png', 719*11),
            new BackgroundObject('/img/5_background/layers/3_third_layer/2.png', 719*11),
            new BackgroundObject('/img/5_background/layers/2_second_layer/2.png', 719*11),
            new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', 719*11),
        ],

        [
            new Bottle(380, 350),
            new Bottle(1200, 380),
            new Bottle(1800, 300),
            new Bottle(2400, 400),
            new Bottle(3400, 350),
            new Bottle(4000, 390),
            new Bottle(4600, 390),
            new Bottle(5900, 320),
            new Bottle(6000, 360)
        ],

        gate,
        hutStory
    );

    // Coins, Whiskey & Hearts anhängen
    level.coins = [
        new Coin(1200, 280),  new Coin(1700, 240),  new Coin(1800, 200),
        new Coin(1900,160),   new Coin(2000,200),   new Coin(2100, 240),
        new Coin(3200,200),   new Coin(4200,200),   new Coin(5200, 200),
        new Coin(5400,200)
    ];

    level.whiskeys = [
        new WhiskeyPickup(3200, 340),
        new WhiskeyPickup(5250, 400)
    ];

    level.hearts = [
        new HeartPickup(5000, 140)
    ];

    return level;
}

// 🔁 globale Level-Instanz (wird von World verwendet)
let level1 = buildLevel1();
if (typeof window !== 'undefined') {
    window.level1 = level1;
}

/** Wird beim Restart/Back-To-Start aufgerufen, um ein frisches Level zu bekommen. */
function resetLevel1() {
    level1 = buildLevel1();
    if (typeof window !== 'undefined') {
        window.level1 = level1;
    }
}
