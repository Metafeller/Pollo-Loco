class MovableObject extends DrawableObject {
    speed = 0.15;
    otherDirection = false;
    speedY = 0;
    acceleration = 2.5;
    energy = 100;
    lastHit = 0;
    dead = false;

    constructor() {
        super();
        // Standard-Hitbox-Offsets (pro Unterklasse anpassbar)
        this.offset = { left: 0, right: 0, top: 0, bottom: 0 };
    }

    // === Ground & Gravity (robust) ===
    isAboveGround() {
        // Wurfobjekte fallen immer (Parabel)
        if (this instanceof ThrowableObject) return true;

        // Wenn ein Objekt eine eigene Bodenlinie hat → daran messen
        if (typeof this.groundPosition === 'number') {
            return this.y < this.groundPosition;
        }

        // Fallback nur für alte Objekte ohne Definition
        return this.y < 150;
    }

    applyGravity() {
        setInterval(() => {

            // ADD: vorherige Y-Position speichern (wichtig für didStompEnemy)
            this.prevY = this.y;   // <-- NEU

            if (this.isAboveGround() || this.speedY > 0) {
                this.y -= this.speedY;
                this.speedY -= this.acceleration;
            }

            // WICHTIG: Nur clampen, WENN das Objekt wirklich eine Bodenlinie hat!
            if (typeof this.groundPosition === 'number' && this.y >= this.groundPosition) {
                this.y = this.groundPosition;
                this.speedY = 0;
            }
        }, 1000 / 25);
    }

    // Kollisions-Bounds MIT Offsets
    getBounds() {
        const x = typeof this.x === 'number' ? this.x : 0;
        const y = typeof this.y === 'number' ? this.y : 0;
        const w = typeof this.width === 'number' ? this.width : 0;
        const h = typeof this.height === 'number' ? this.height : 0;
        const off = this.offset || { left:0, right:0, top:0, bottom:0 };

        return {
            left:   x + (off.left   || 0),
            top:    y + (off.top    || 0),
            right:  x + w - (off.right  || 0),
            bottom: y + h - (off.bottom || 0)
        };
    }

    /**
     * Axis-aligned bounding box collision check (robust AABB).
     */
    isColliding(other) {
        if ((this && this.dead === true) || (other && other.dead === true)) return false;
        if (!other || other === this) return false;

        const a = this.getBounds();
        const b = (typeof other.getBounds === 'function')
            ? other.getBounds()
            : {
                left: other.x,
                top: other.y,
                right: (other.x || 0) + (other.width  || 0),
                bottom:(other.y || 0) + (other.height || 0)
            };

        const overlapX = a.left < b.right && a.right > b.left;
        const overlapY = a.top  < b.bottom && a.bottom > b.top;
        return overlapX && overlapY;
    }

    hit() {
        this.energy -= 5;
        if (this.energy < 0) this.energy = 0;
        else this.lastHit = new Date().getTime();
    }

    isHurt() {
        let timepassed = (new Date().getTime() - this.lastHit) / 1000;
        return timepassed < 1.2;
    }

    isDead() { return this.energy == 0; }

    moveRight() { if (!this.dead) this.x += this.speed; }
    moveLeft()  { if (!this.dead) { this.x -= this.speed; this.x -= 0.15; } }

    playAnimation(images) {
        if (this.dead) return;
        let i = this.currentImage % images.length;
        let path = images[i];
        this.img = this.imageCache[path];
        this.currentImage++;
    }

    jump() { /* this.speedY = 25; */ }
}
