class Character extends MovableObject {

    height = 280;
    y = 80;
    speed = 5;

    // === Idle/Snore State ===
    idlePhase = 'idle';                              // 'active' | 'idle' | 'snore'
    lastActiveAt = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - 3000; 
    // ^ Start direkt in Idle (3s "vordatieren"), damit Punkt 1 erfüllt ist

    // Audios
    snoreAudio = new Audio('/audio/snoring-man.mp3');        // loop
    wakeAudio  = new Audio('/audio/ave-maria-speech.mp3');    // one-shot

    invulnerable = false;  // Unverwundbarkeits-Status
    invulnerabilityDuration = 900;  // Dauer der Unverwundbarkeit in Millisekunden / Vorher 1500

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

        setInterval(() => {
            const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

            if (this.world?.gameOver) {
                // NEU: Schnarchen sicher stoppen
                this.stopSnore();

                this.walking_sound.pause();
                this.walking_sound.currentTime = 0;
                this.walking_sound_back.pause();
                this.walking_sound_back.currentTime = 0;
                return; // NICHTS mehr bewegen oder drehen
            }

            // Spiel gewonnen → Eingaben ignorieren
            if (this.world?.gameWon) {  
                // NEU: Schnarchen sicher stoppen
                this.stopSnore();

                this.walking_sound.pause();
                this.walking_sound_back.pause();
                return;
            }

            // === NEU: vor Bewegung erst den Idle/Snore-State pflegen ===
            this.updateIdleState(now);

            this.walking_sound.pause();

            // Bewegung nach rechts, aber nur bis zum Level-Ende
            if (this.world.keyboard.RIGHT && this.x < this.world.level.level_end_x) {
                this.moveRight();
                this.otherDirection = false;
                this.walking_sound.play();

            } else if (this.x >= this.world.level.level_end_x) {
                // Charakter stoppt am Level-Ende
                this.x = this.world.level.level_end_x;
            }

            // Bewegung nach links, aber nur bis zur Position 0
            if (this.world.keyboard.LEFT && this.x > 0) {
                this.moveLeft();
                this.otherDirection = true;
                this.walking_sound_back.play();
            }

            if (this.world.keyboard.SPACE && !this.isAboveGround()) {
                this.jump();
            }

            // Kamera-Bewegung basierend auf der Charakter-Position
            this.world.camera_x = -this.x + 100;
        }, 1000 / 60);


        setInterval(() => {
            // Spielzustände zuerst
            if (this.world?.gameOver) return;
            if (this.world?.gameWon)  return;

            // Prioritäten: Dead > Hurt > Jump > Snore > Idle > Walk > Fallback
            if (this.isDead()) {
                this.playAnimation(this.IMAGES_DEAD);
                return;
            }

            if (this.isHurt()) {
                this.playAnimation(this.IMAGES_HURT);
                return;
            }

            if (this.isAboveGround()) {
                this.playAnimation(this.IMAGES_JUMPING);
                return;
            }

            // --- Idle-State (am Boden) ---
            if (this.idlePhase === 'snore') {
                this.playAnimation(this.IMAGES_LONG_IDLE);
                return;
            }

            if (this.idlePhase === 'idle') {
                this.playAnimation(this.IMAGES_IDLE);
                return;
            }

            // --- Aktiv, aber keine Sprünge/Hits → ggf. Walking ---
            if (this.world.keyboard.RIGHT || this.world.keyboard.LEFT) {
                this.x += this.speed; // wie gehabt
                this.playAnimation(this.IMAGES_WALKING);
                return;
            }

            // --- Fallback ---
            this.playAnimation(this.IMAGES_IDLE);
        }, 50);


    }

    // === Eingaben prüfen (welche Tasten zählen als "aktiv") ===
    isControlActive() {
        const kb = this.world?.keyboard || {};
        return !!(kb.RIGHT || kb.LEFT || kb.SPACE || kb.D || kb.F);
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

        if (idleFor >= 5000) {
            this.enterSnore();      // 3s + 2s = 5s → Schnarch
        } else if (idleFor >= 3000) {
            this.enterIdle();       // ab 3s → Standard-Idle
        } else {
            // < 3s: noch aktiv
            if (this.idlePhase === 'snore') this.stopSnore();
            this.idlePhase = 'active';
        }
    }


    jump() {
        this.speedY = 25;
    }

    // Unverwundbarkeit kurz aktivieren
    makeInvulnerable() {
        this.invulnerable = true;
        setTimeout(() => {
            this.invulnerable = false;
        }, this.invulnerabilityDuration);
    }

    // WICHTIG: KEINE lokale isAboveGround() hier!
    // checkIfJumpedOnEnemy benutzt die aus MovableObject
    checkIfJumpedOnEnemy(enemy) {
        return this.isAboveGround() && this.speedY < 0 && this.isColliding(enemy);
    }

}
