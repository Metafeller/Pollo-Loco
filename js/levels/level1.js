const level1 = new Level([
    new Chicken(),
    new Chicken(),
    new MiniChicken(),
    new MiniChicken(),
    new Chicken(),
    new MiniChicken(),
    new Endboss()
],

[
    new Cloud()
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
    new BackgroundObject('/img/5_background/layers/1_first_layer/2.png', 719*5)
    // The Show must go on...
],

[
    new Bottle(380, 350),
    new Bottle(800, 330),
    new Bottle(1200, 380),
    new Bottle(1800, 300),
    new Bottle(2300, 400),
    new Bottle(3000, 370),
    new Bottle(3200, 390)
]

);