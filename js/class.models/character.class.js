class Character extends MovableObject {

    
    height = 280;
    y = 80;
    speed = 3; // vorher 5 → ruhigeres Tempo passend zum Laufsound


    // === Idle/Snore State ===
    idlePhase = 'active'; // 'active' | 'idle' | 'snore'
    lastActiveAt = (typeof performance !== 'undefined' ? performance.now() : Date.now()); 


    // Idle/Sleep-Timings (Inaktivität)
    IDLE_DELAY_MS  = 300;  // ~6,5s bis ruhiges Idle/Pre-Sleep
    SNORE_DELAY_MS = 9500;  // ~9,5s bis Schnarch-/Sleep-Phase


    // Zähler, um Idle-/Sleep-Frames zu verlangsamen
    idleAnimTick = 0;


    // Audios
    snoreAudio = new Audio('/audio/snoring-man.mp3');        // loop
    wakeAudio  = new Audio('/audio/ave-maria-speech.mp3');    // one-shot


    invulnerable = false;  // Unverwundbarkeits-Status
    invulnerabilityDuration = 900;  // Dauer der Unverwundbarkeit in Millisekunden / Vorher 1500


    // === Jump-Anim-State (einmal pro Sprung) ===
    jumpInProgress = false;
    jumpFrameIndex = 0;


    // === NEU: Idle Frames ===
    IMAGES_IDLE = [
        '/img/2_character_pepe/1_idle/idle/I-1.png',
        '/img/2_character_pepe/1_idle/idle/I-2.png',
        '/img/2_character_pepe/1_idle/idle/I-3.png',
        '/img/2_character_pepe/1_idle/idle/I-4.png',
        '/img/2_character_pepe/1_idle/idle/I-5.png',
        '/img/2_character_pepe/1_idle/idle/I-6.png',
        '/img/2_character_pepe/1_idle/idle/I-7.png',
        '/img/2_character_pepe/1_idle/idle/I-8.png',
        '/img/2_character_pepe/1_idle/idle/I-9.png',
        '/img/2_character_pepe/1_idle/idle/I-10.png'
    ];


    // === NEU: Long-Idle (Schnarch) Frames ===
    IMAGES_LONG_IDLE = [
        '/img/2_character_pepe/1_idle/long_idle/I-11.png',
        '/img/2_character_pepe/1_idle/long_idle/I-12.png',
        '/img/2_character_pepe/1_idle/long_idle/I-13.png',
        '/img/2_character_pepe/1_idle/long_idle/I-14.png',
        '/img/2_character_pepe/1_idle/long_idle/I-15.png',
        '/img/2_character_pepe/1_idle/long_idle/I-16.png',
        '/img/2_character_pepe/1_idle/long_idle/I-17.png',
        '/img/2_character_pepe/1_idle/long_idle/I-18.png',
        '/img/2_character_pepe/1_idle/long_idle/I-19.png',
        '/img/2_character_pepe/1_idle/long_idle/I-20.png'
    ];


    IMAGES_WALKING = [
        '/img/2_character_pepe/2_walk/W-21.png',
        '/img/2_character_pepe/2_walk/W-22.png',
        '/img/2_character_pepe/2_walk/W-23.png',
        '/img/2_character_pepe/2_walk/W-24.png',
        '/img/2_character_pepe/2_walk/W-25.png',
        '/img/2_character_pepe/2_walk/W-26.png'
    ];


    IMAGES_JUMPING = [
        '/img/2_character_pepe/3_jump/J-31.png',
        '/img/2_character_pepe/3_jump/J-32.png',
        '/img/2_character_pepe/3_jump/J-33.png',
        '/img/2_character_pepe/3_jump/J-34.png',
        '/img/2_character_pepe/3_jump/J-35.png',
        '/img/2_character_pepe/3_jump/J-36.png',
        '/img/2_character_pepe/3_jump/J-37.png',
        '/img/2_character_pepe/3_jump/J-38.png',
        '/img/2_character_pepe/3_jump/J-39.png'
    ];


    IMAGES_HURT = [
        '/img/2_character_pepe/4_hurt/H-41.png',
        '/img/2_character_pepe/4_hurt/H-42.png',
        '/img/2_character_pepe/4_hurt/H-43.png' 
    ];


    IMAGES_DEAD = [
        '/img/2_character_pepe/5_dead/D-51.png',
        '/img/2_character_pepe/5_dead/D-52.png',
        '/img/2_character_pepe/5_dead/D-53.png',
        '/img/2_character_pepe/5_dead/D-54.png',
        '/img/2_character_pepe/5_dead/D-55.png',
        '/img/2_character_pepe/5_dead/D-56.png',
        '/img/2_character_pepe/5_dead/D-57.png'
    ];


    world;
    walking_sound = new Audio('/audio/stamping.mp3');
    walking_sound_back = new Audio('/audio/stamping.mp3');


    constructor() {
        super().loadImage('/img/2_character_pepe/2_walk/W-21.png');
        // NEU: Idle-Bilder cachen
        this.loadImages(this.IMAGES_IDLE);
        this.loadImages(this.IMAGES_LONG_IDLE);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_JUMPING);
        this.loadImages(this.IMAGES_HURT);
        this.loadImages(this.IMAGES_DEAD);

        // Audios vorbereiten
        try { this.snoreAudio.loop = true; this.snoreAudio.volume = 0.55; } catch(e) {}
        try { this.wakeAudio.volume = 0.85; } catch(e) {}
        
        // Bodenlinie: Pepe steht exakt bei y=80
        this.groundPosition = 150;

        this.offset = {
            left:  18,
            right: 18,
            top:   64, // vorher 50
            bottom: 12 // vorher 10
        };

        this.applyGravity();
        this.animate();
    }


    animate() {
        this.startMovementLoop();
        this.startAnimationLoop();
    }


    /**
     * Starts the 60 FPS loop that handles movement and input.
     */
    startMovementLoop() {
        setInterval(() => {
            const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            this.tickMovement(now);
        }, 1000 / 60);
    }


    /**
     * Single movement tick: pause/end-checks, idle, input, camera.
     */
    tickMovement(now) {
        if (this.handlePauseAndEndStates()) return;

        // Idle/Snore state before movement
        this.updateIdleState(now);
        this.walking_sound.pause();

        this.handleHorizontalMovement();
        this.handleJumpInput();
        this.updateCameraPosition();
    }


    /**
     * Handles pause / gameOver / gameWon early exits.
     */
    handlePauseAndEndStates() {
        if (this.handlePausedState()) return true;
        if (this.handleGameOverState()) return true;
        if (this.handleGameWonState()) return true;
        return false;
    }


    /**
     * World is paused: stop walking sounds, keep camera following Pepe.
     */
    handlePausedState() {
        const world = this.world;
        if (!world || !world.paused) return false;

        this.walking_sound.pause();
        this.walking_sound_back.pause();
        world.camera_x = -this.x + 100;
        return true;
    }


    /**
     * Game over: stop snore + fully reset walking sounds.
     */
    handleGameOverState() {
        const world = this.world;
        if (!world || !world.gameOver) return false;

        this.stopSnore();

        this.walking_sound.pause();
        this.walking_sound.currentTime = 0;
        this.walking_sound_back.pause();
        this.walking_sound_back.currentTime = 0;
        return true;
    }


    /**
     * Game won: stop snore and walking sounds, but no full reset.
     */
    handleGameWonState() {
        const world = this.world;
        if (!world || !world.gameWon) return false;

        this.stopSnore();
        this.walking_sound.pause();
        this.walking_sound_back.pause();
        return true;
    }


    /**
     * Horizontal movement (right/left) including level bounds.
     */
    handleHorizontalMovement() {
        const world = this.world;
        if (!world || !world.keyboard || !world.level) return;

        this.handleRightMovement(world);
        this.handleLeftMovement(world);
    }


    /**
     * Handles movement to the right, clamped to level_end_x.
     */
    handleRightMovement(world) {
        if (!world.keyboard.RIGHT) return;

        if (this.x < world.level.level_end_x) {
            this.moveRight();
            this.otherDirection = false;
            this.walking_sound.play();
        } else if (this.x >= world.level.level_end_x) {
            // Charakter stoppt am Level-Ende
            this.x = world.level.level_end_x;
        }
    }


    /**
     * Handles movement to the left, clamped to x >= 0.
     */
    handleLeftMovement(world) {
        if (!world.keyboard.LEFT) return;
        if (this.x <= 0) return;

        this.moveLeft();
        this.otherDirection = true;
        this.walking_sound_back.play();
    }


    /**
     * Jump input (SPACE) – only when on the ground.
     */
    handleJumpInput() {
        const world = this.world;
        if (!world?.keyboard?.SPACE) return;
        if (this.isAboveGround()) return;

        this.jump();
    }


    /**
     * Camera follows character position.
     */
    updateCameraPosition() {
        if (!this.world) return;
        this.world.camera_x = -this.x + 100;
    }


    /**
     * Starts the 20 FPS loop that controls animation state.
     */
    startAnimationLoop() {
        setInterval(() => {
            this.tickStateAnimation();
        }, 50);
    }


    /**
     * Single animation tick: state priority handling.
     */
    tickStateAnimation() {
        if (this.shouldSkipStateAnimation()) return;
        if (this.handleHighPriorityStates()) return;

        const aboveGround = this.isAboveGround();
        this.syncJumpResetIfLanded(aboveGround);

        if (this.handleJumpIfAirborne(aboveGround)) return;
        if (this.handleIdleAnimations()) return;
        if (this.handleWalkingAnimation()) return;

        this.playFallbackIdleAnimation();
    }


    /**
     * Skips animation when game is not in a playable state.
     */
    shouldSkipStateAnimation() {
        const world = this.world;
        if (!world) return false;

        if (world.gameOver) return true;
        if (world.gameWon)  return true;
        if (world.paused)   return true;
        return false;
    }


    /**
     * Dead / hurt have the highest animation priority.
     */
    handleHighPriorityStates() {
        if (this.isDead()) {
            this.playAnimation(this.IMAGES_DEAD);
            return true;
        }

        if (this.isHurt()) {
            this.playAnimation(this.IMAGES_HURT);
            return true;
        }

        return false;
    }


    /**
     * Resets jump animation once Pepe lands again.
     */
    syncJumpResetIfLanded(aboveGround) {
        if (!aboveGround && this.jumpInProgress) {
            this.resetJumpAnimation();
        }
    }


    /**
     * While airborne, use jump animation once per jump.
     */
    handleJumpIfAirborne(aboveGround) {
        if (!aboveGround) return false;
        this.playJumpAnimation();
        return true;
    }


    /**
     * Idle / snore animations while standing on the ground.
     */
    handleIdleAnimations() {
        if (this.idlePhase === 'snore') {
            if (!this.shouldAdvanceIdleFrame()) return true;
            this.playAnimation(this.IMAGES_LONG_IDLE);
            return true;
        }

        if (this.idlePhase === 'idle') {
            if (!this.shouldAdvanceIdleFrame()) return true;
            this.playAnimation(this.IMAGES_IDLE);
            return true;
        }

        return false;
    }


    /**
     * Walking animation while movement keys are pressed.
     */
    handleWalkingAnimation() {
        const kb = this.world?.keyboard;
        if (!kb) return false;
        if (!kb.RIGHT && !kb.LEFT) return false;

        this.playAnimation(this.IMAGES_WALKING);
        return true;
    }


    /**
     * Fallback: classic idle animation with slowed frame advance.
     */
    playFallbackIdleAnimation() {
        this.playAnimation(this.IMAGES_IDLE);
        if (!this.shouldAdvanceIdleFrame()) return;
        this.playAnimation(this.IMAGES_IDLE);
    }

    
    /**
     * Verlangsamt die Idle-/Sleep-Animation:
     * Nur jedes zweite Tick (ca. 100ms) wird ein Frame weitergeschaltet.
     */
    shouldAdvanceIdleFrame() {
        this.idleAnimTick = (this.idleAnimTick || 0) + 1;
        return (this.idleAnimTick % 2) === 0;
    }


    // === Eingaben prüfen (welche Tasten zählen als "aktiv") ===
    isControlActive() {
        const kb = this.world?.keyboard || {};

        const hasBottles =
        this.world &&
        typeof this.world.bottlesCollected === 'number' &&
        this.world.bottlesCollected > 0;

        const hasWhiskey =
        this.world &&
        typeof this.world.whiskeyCount === 'number' &&
        this.world.whiskeyCount > 0;

        return !!(
            kb.RIGHT || 
            kb.LEFT || 
            kb.SPACE || 
            (kb.D && hasBottles) ||
            (kb.F && hasWhiskey)
        );
    }

    // === State-Wechsel ===
    enterIdle() {
        if (this.idlePhase === 'idle') return;
        // Schnarch-Sound sicher stoppen, falls wir aus snore kommen
        this.stopSnore();
        this.idlePhase = 'idle';
        this.currentImage = 0; // <- optional
    }

    enterSnore() {
        if (this.idlePhase === 'snore') return;
        this.idlePhase = 'snore';
        this.currentImage = 0; // <- optional
        // Schnarchen starten
        try {
            this.snoreAudio.currentTime = 0;
            this.snoreAudio.play();
        } catch(e) {}
    }

    stopSnore() {
        try {
            if (!this.snoreAudio.paused) {
                this.snoreAudio.pause();
                this.snoreAudio.currentTime = 0;
            }
        } catch(e) {}
    }

    onWakeFromSnore() {
        // Schnarchen stoppen & Wake-Line einmalig spielen
        this.stopSnore();
        try {
            this.wakeAudio.pause();
            this.wakeAudio.currentTime = 0;
            this.wakeAudio.play();
        } catch(e) {}
    }

    // === zentrale Logik: Idle/Snore nach Inaktivität ===
    updateIdleState(nowMs) {
        // Wenn Spiel out-of-play ist → alles stoppen
        if (this.world?.gameOver || this.world?.gameWon) {
            this.stopSnore();
            this.idlePhase = 'idle'; // neutrale Ruhe
            return;
        }

        const control = this.isControlActive();

        if (control || this.isAboveGround() || this.isHurt()) {
            // Aktiv → Timer zurücksetzen
            if (this.idlePhase === 'snore') this.onWakeFromSnore();
            this.idlePhase = 'active';
            this.lastActiveAt = nowMs;
            return;
        }

        // Keine Eingabe → Dauer berechnen
        const idleFor = nowMs - (this.lastActiveAt || nowMs);

        if (idleFor >= this.SNORE_DELAY_MS) {
           // Sleep/Schnarch nach ca. 9–10s
           this.enterSnore();
        } else if (idleFor >= this.IDLE_DELAY_MS) {
            // Ruhiges Idle nach ca. 6–7s Inaktivität
            this.enterIdle();
        } else {
            // Noch im "aktiven" Bereich
            if (this.idlePhase === 'snore') this.stopSnore();
            this.idlePhase = 'active';
        }
    }


    jump() {
        // Safety: kein Doppelsprung in der Luft
        if (this.isAboveGround()) return;

        this.speedY = 25;
        this.resetJumpAnimation();
        this.jumpInProgress = true;
    }


        resetJumpAnimation() {
        this.jumpInProgress = false;
        this.jumpFrameIndex = 0;
    }

    
    playJumpAnimation() {
        const frames = this.IMAGES_JUMPING;
        if (!Array.isArray(frames) || frames.length === 0) return;

        if (!this.jumpInProgress) {
            this.jumpInProgress = true;
            this.jumpFrameIndex = 0;
        }

        const idx = Math.min(this.jumpFrameIndex, frames.length - 1);
        const path = frames[idx];
        const img = this.imageCache[path];

        if (img) this.img = img;

        if (this.jumpFrameIndex < frames.length - 1) {
            this.jumpFrameIndex++;
        }
    }


    // Unverwundbarkeit kurz aktivieren
    makeInvulnerable() {
        this.invulnerable = true;
        setTimeout(() => {
            this.invulnerable = false;
        }, this.invulnerabilityDuration);
    }


    /**
     * Wendet Schaden an, clamped HP und triggert bei 0 HP sofort den Game-Over-Flow.
     * Holt außerdem den Hurt-State (lastHit) zurück, damit IMAGES_HURT wieder laufen.
     */
    hit(amount = 5) {
        if (this.world?.gameOver || this.world?.gameWon) return;

        const dmg = (typeof amount === 'number' && amount > 0) ? amount : 5;
        const current = (typeof this.energy === 'number') ? this.energy : 100;

        let next = current - dmg;
        if (next < 0) next = 0;
        if (next > 100) next = 100;
        this.energy = next;

        // 🔥 WICHTIG: Hurt-Flag wie früher setzen (ersetzt super.hit())
        if (this.energy > 0) {
            // entspricht der Logik aus MovableObject.hit()
            this.lastHit = Date.now ? Date.now() : new Date().getTime();
        }

        // Statusbar syncen
        if (this.world?.statusBar && typeof this.world.statusBar.setPercentage === 'function') {
            this.world.statusBar.setPercentage(this.energy);
        }

        // Sofort sterben, wenn HP 0 erreicht
        if (this.energy <= 0 && typeof this.world?.onPlayerDeath === 'function') {
            this.world.onPlayerDeath();
        }
    }



    // WICHTIG: KEINE lokale isAboveGround() hier!
    // checkIfJumpedOnEnemy benutzt die aus MovableObject
    checkIfJumpedOnEnemy(enemy) {
        return this.isAboveGround() && this.speedY < 0 && this.isColliding(enemy);
    }

}
