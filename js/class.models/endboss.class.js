class Endboss extends MovableObject {
    y = 60;
    height = 400;
    width = 300;
    speed = 0.5; // vorher 0.3

    // KI-State
    aiState = 'IDLE'; // IDLE | CHASE | RETURN
    isInSight = false;

    startPosition = 5140; // vor der Hütte (Gate ~5400)
    returning = false;
    leashRadius = 500;    // Wie weit er maximal nach links jagt, bevor er RETURN macht / vorher 360
    sightRange = 520; // Wie früh er dich sieht (startet CHASE) / vorher 400
    energy = 150;

    // === INSERT: Rücklauf-Feintuning ===
    useRetreatOffset = true;   // true = nicht ganz bis startPosition zurück
    retreatOffset    = 200;    // wie viele Pixel LINKS von startPosition stehen bleiben
    // Beispiel: startPosition = 6400 → Rücklaufziel = 6260

    minX = 0;

    inAggroMode = false;
    baseSpeed = 0.5;          // Basis-Speed, wenn nicht im Kampf
    aggroSpeed = 3.0;         // Aggro-Speed: spürbar schneller als Pepe (bei Bedarf feinjustieren)
    permanentChase = true;    // true = Boss verfolgt dauerhaft, kein automatisches RETURN
    targetX = null;           // letzte bekannte X-Position von Pepe
    isDying = false;

    IMAGES_WALKING = [
        'img/4_enemie_boss_chicken/1_walk/G1.png',
        'img/4_enemie_boss_chicken/1_walk/G2.png',
        'img/4_enemie_boss_chicken/1_walk/G3.png',
        'img/4_enemie_boss_chicken/1_walk/G4.png'
    ];
    IMAGES_ALERT = [
        '/img/4_enemie_boss_chicken/2_alert/G5.png',
        '/img/4_enemie_boss_chicken/2_alert/G6.png',
        '/img/4_enemie_boss_chicken/2_alert/G7.png',
        '/img/4_enemie_boss_chicken/2_alert/G8.png',
        '/img/4_enemie_boss_chicken/2_alert/G9.png',
        '/img/4_enemie_boss_chicken/2_alert/G10.png',
        '/img/4_enemie_boss_chicken/2_alert/G11.png',
        '/img/4_enemie_boss_chicken/2_alert/G12.png',
        '/img/4_enemie_boss_chicken/3_attack/G13.png',
        '/img/4_enemie_boss_chicken/3_attack/G14.png',
        '/img/4_enemie_boss_chicken/3_attack/G15.png',
        '/img/4_enemie_boss_chicken/3_attack/G16.png',
        '/img/4_enemie_boss_chicken/3_attack/G17.png',
        '/img/4_enemie_boss_chicken/3_attack/G18.png',
        '/img/4_enemie_boss_chicken/3_attack/G19.png',
        '/img/4_enemie_boss_chicken/3_attack/G20.png'
    ];
    IMAGES_HURT = [
        '/img/4_enemie_boss_chicken/4_hurt/G21.png',
        '/img/4_enemie_boss_chicken/4_hurt/G22.png',
        '/img/4_enemie_boss_chicken/4_hurt/G23.png'
    ];
    IMAGES_DEAD = [
        '/img/4_enemie_boss_chicken/5_dead/G24.png',
        '/img/4_enemie_boss_chicken/5_dead/G25.png',
        '/img/4_enemie_boss_chicken/5_dead/G26.png'
    ];

    constructor(startX = 5140 /* vor dem Tor */) {
        super().loadImage(this.IMAGES_WALKING[0]);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_ALERT);
        this.loadImages(this.IMAGES_DEAD);
        this.loadImages(this.IMAGES_HURT);

        // Start exakt setzen UND als Startposition merken (wichtig fürs Zurücklaufen)
        this.startPosition = startX;
        // this.x = this.startPosition;
        this.x = startX;
        this.minX = 0;

        // Treff-Hitbox etwas kleiner als das Bild, damit kein „Luftschaden“ entsteht.
        this.offset = {
            left:   50,
            right:  50,
            top:    20,
            bottom: 8
        };

        this.animate();
    }


    clampX() {
        // Failsafe: falls x kein Zahlwert ist (z.B. durch Bug), auf 0 u/o Ziel setzen
        if (!Number.isFinite(this.x)) {
            this.x = this.getReturnTargetX();
        }
        
        if (this.x > this.startPosition) this.x = this.startPosition;
        if (this.x < this.minX) this.x = this.minX;
    }


    // === INSERT: Ziel für den RETURN-State berechnen ===
    getReturnTargetX() {
        const target = this.useRetreatOffset
            ? (this.startPosition - this.retreatOffset)
            : this.startPosition;
        return Math.max(this.minX, target);
    }


    // === REPLACE: snapToStart() ===
    snapToStart() {
        this.x = this.getReturnTargetX();
        this.returning = false;
        this.aiState = 'IDLE';
    }


    moveLeft()  { this.x -= this.speed; this.clampX(); }
    moveRight() { this.x += this.speed; this.clampX(); }


    enterAggro() {
        if (this.inAggroMode) return;
        this.inAggroMode = true;
        this.speed = Math.max(this.speed, this.aggroSpeed);
    }


    /**
     * Aktualisiert den KI-State in Abhängigkeit von Pepes X-Position.
     * Wird von world.run() mehrmals pro Sekunde aufgerufen.
     */
    updateAI(characterX) {
        if (this.dead || this.isDying) return;

        this.targetX = characterX;

        const inSight = (characterX > this.x - this.sightRange);
        if (this.aiState === 'IDLE' && inSight) {
            this.aiState = 'CHASE';
            this.enterAggro(); // sofort in Aggro-Speed wechseln
        }

        if (!this.permanentChase) {
            this.applyLeash();
        }

        this.isInSight = (this.aiState === 'CHASE'); // für StatusBar
    }


    /**
     * Begrenzt die Verfolgung nach links, falls permanentChase deaktiviert ist.
     */
    applyLeash() {
        if (this.aiState !== 'CHASE') return;

        const leftLimit = this.startPosition - this.leashRadius;
        if (this.x <= leftLimit) {
            this.aiState = 'RETURN';
            this.returning = true;
        }
    }


    hit() {
        this.energy -= 20;
        if (this.energy < 0) this.energy = 0;
        if (this.energy === 0) {
            this.die();
        } else {
            this.isHurtAnimation = true;
            this.speedY = 30;
            this.applyGravity();
            setTimeout(() => this.endHurtAnimation(), 1500);
            this.ensureCorrectLanding();
        }
    }


    ensureCorrectLanding() {
        setInterval(() => {
            if (this.y > 60) {
                this.y = 60;
                this.speedY = 0;
            }
        }, 1000 / 60);
    }


    playAnimation(images, speedFactor = 4) {
        let i = Math.floor(this.currentImage / speedFactor) % images.length;
        this.img = this.imageCache[images[i]];
        this.currentImage++;
    }


    activateHurtAnimation() {
        this.isHurtAnimation = true;
        this.loadImages(this.IMAGES_HURT);
        this.speedY = -20;
        this.applyGravity();
        this.hurtTimeout = setTimeout(() => {
            this.isHurtAnimation = false;
            this.loadImages(this.IMAGES_WALKING);
        }, 1000);
    }


    die() {
        clearTimeout(this.hurtTimeout);
        if (this.isDying || this.dead) return;
        this.isDying = true;
        this.isHurtAnimation = false;
        this.isInSight = false;
        this.returning = false;
        this.speed = 0;

        const frames = this.IMAGES_DEAD;
        let i = 0;
        if (frames && frames.length > 0) this.img = this.imageCache[frames[0]];

        this.deathTimer = setInterval(() => {
            i++;
            if (!frames || i >= frames.length) {
                clearInterval(this.deathTimer);
                this.isDying = false;
                this.dead = true;
                if (frames && frames.length > 0) {
                    this.img = this.imageCache[frames[frames.length - 1]];
                }
                return;
            }
            this.img = this.imageCache[frames[i]];
        }, 180);
    }


    endHurtAnimation() {
        this.isHurtAnimation = false;
        this.y = 60;
    }


    // === REPLACE: returnToStart() ===
    returnToStart() {
        if (this.isDying || this.dead) { 
            this.returning = false; 
            this.aiState = 'IDLE'; 
            return; 
        }
        this.returning = true;
        this.aiState = 'RETURN';

        const target = this.getReturnTargetX();
        const EPSILON = this.speed * 1.5; // Toleranzbereich zum Snappen


        if (this.x < target - EPSILON) {
            this.moveRight(); // nach rechts bis zum Ziel
        } else {
            this.snapToStart(); // auf Ziel snappen + IDLE
        }

        this.otherDirection = true; // schaut nach rechts beim Zurücklaufen
        this.playAnimation(this.IMAGES_WALKING);
    }

    
    animate() {
        setInterval(() => {
            if (this.dead || this.isDying) return;

            if (this.aiState === 'CHASE' && !this.isHurtAnimation) {
                const target = (typeof this.targetX === 'number') ? this.targetX : this.x;
                const dx = target - this.x;
                const absDx = Math.abs(dx);

                // Nur bewegen, wenn noch Abstand vorhanden ist (kein Jitter bei minimaler Distanz)
                if (absDx > 5) {
                    if (dx < 0) {
                        this.moveLeft();
                        this.otherDirection = false; // Blick nach links
                    } else {
                        this.moveRight();
                        this.otherDirection = true;  // Blick nach rechts
                    }
                }

                const frames = this.inAggroMode ? this.IMAGES_ALERT : this.IMAGES_WALKING;
                this.playAnimation(frames);

            } else if (this.aiState === 'RETURN' && !this.isHurtAnimation) {
                this.returnToStart();

            } else if (this.isHurtAnimation) {
                this.playAnimation(this.IMAGES_HURT);
            }

            this.clampX();
        }, 1000 / 60);
    }

}
