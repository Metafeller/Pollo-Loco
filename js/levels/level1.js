// Bodenlinie: Character.y (80) + Character.height (280) = 360
const GROUND_BOTTOM = 480;

// Hütte (bei x=500), Höhe frei einstellbar
const gate = new HutGate(6000, 480, 500, 320);

// Story an Gate verankern (erzwingt gleiche „Hütte“), Offsets kannst du im Code der Story setzen
const hutStory = new StoryBillboard(6000, 180, 100, 500, gate);

// Optional Feintuning (hier oder später im Code):
hutStory.offsetX = 256;
hutStory.offsetY = -12;

// ADD: helper for distributed spawns with minimal spacing
function spawnDistributed(factory/*(x)=>obj*/, count, xStart, xEnd, minSpacing=400) {
  const picks = [];
  const range = xEnd - xStart;
  // naive stratified sampling: split into buckets and jitter
  const step = Math.max(minSpacing, Math.floor(range / Math.max(1, count)));
  let x = xStart + 200; // small margin
  for (let i=0; i<count; i++) {
    const jitter = Math.floor(Math.random() * Math.min(step-50, 220));
    const px = Math.min(xEnd-50, x + jitter);
    picks.push(factory(px));
    x += step;
  }
  return picks;
}

// Decide how many you want:
const CHICKEN_COUNT = 9;
const MINI_COUNT    = 8;

const chickensDistributed = spawnDistributed((x)=>new Chicken(x), CHICKEN_COUNT, 600, 5900, 420);
const minisDistributed    = spawnDistributed((x)=>new MiniChicken(x), MINI_COUNT,  900, 5800, 360);

const level1 = new Level([
    // new Chicken(),
    // new MiniChicken(),
    // new Chicken(),
    // new MiniChicken(),
    // new Chicken(),
    // new Chicken(),
    // new MiniChicken(),
    // new Chicken(),
    // new Chicken(),
    // new MiniChicken(),
    // new MiniChicken(),
    ...chickensDistributed,
    ...minisDistributed,
    new Endboss(6300) // Start direkt bei der Hütte (und Rücklaufziel = 500)
],

[
    // deine funktionierenden Wolken
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
    // (Hintergründe unverändert)
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
    new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', 719*9)
],

[
    // Bottles – egal
    new Bottle(380, 350),
    // new Bottle(800, 330),
    new Bottle(1200, 380),
    new Bottle(1800, 300),
    new Bottle(2400, 400),
    // new Bottle(3000, 370),
    new Bottle(3400, 350),
    // new Bottle(3600, 350),
    // new Bottle(3600, 350),
    // new Bottle(3700, 450),
    // new Bottle(3800, 350),
    // new Bottle(3900, 350),
    new Bottle(4000, 390),
    // new Bottle(4500, 350),
    new Bottle(4600, 390),
    // new Bottle(4700, 350),
    // new Bottle(4800, 390),
    new Bottle(5900, 320),
    new Bottle(6000, 360)
],

gate,
hutStory
);

// 2) DANACH Coins & Whiskeys anhängen:
level1.coins = [
    new Coin(1200, 240),  new Coin(1700, 200),  new Coin(1800, 160),
    new Coin(1900,120),  new Coin(2000,160),  new Coin(2100, 200),
    new Coin(3200,160),  new Coin(4200,160),  new Coin(5200, 160),
    new Coin(5400,160)
];

level1.whiskeys = [
    // new WhiskeyPickup(940, 290),
    new WhiskeyPickup(3200, 340),
    new WhiskeyPickup(5250, 400)
];

level1.hearts = [
    // Ein Herz pro Level (40% Heal)
    new HeartPickup(5000, 140)
];

// Als Alternative kann ich (2x 20%)
// level1.hearts = [
//     new HeartPickup(3600, 240),
//     new HeartPickup(6100, 240)
// ];
