class MovableObject extends DrawableObject {
    speed = 0.15;
    otherDirection = false;
    speedY = 0;
    acceleration = 2.5;
    energy = 100;
    lastHit = 0;

    // Marks entity as visually dead (freezes animations & collisions)
    dead = false;


    applyGravity() {
        setInterval(() => {
            if (this.isAboveGround() || this.speedY > 0) {
                this.y -= this.speedY;
                this.speedY -= this.acceleration;
            }
            // Sicherstellen, dass das Objekt nicht unter den Boden fällt
            if (this.y >= this.groundPosition) {
                this.y = this.groundPosition;
                this.speedY = 0;
            }
        }, 1000 / 25);
    }

    isAboveGround() {
        return this.y < this.groundPosition;
    }


    isAboveGround() {
        if (this instanceof ThrowableObject) { // Throwable object should always fall
            return true;
        } else {
            return this.y < 150;
        }
        
    }


      /**
   * Returns the axis-aligned bounds of this object.
   */
    getBounds() {
        // Guards: ensure numeric coordinates to avoid NaN issues
        const x = typeof this.x === 'number' ? this.x : 0;
        const y = typeof this.y === 'number' ? this.y : 0;
        const w = typeof this.width === 'number' ? this.width : 0;
        const h = typeof this.height === 'number' ? this.height : 0;

        return {
        left: x,
        top: y,
        right: x + w,
        bottom: y + h
        };
    }


      /**
   * Axis-aligned bounding box collision check (robust AABB).
   * @param {Object} other - any object with x, y, width, height
   * @returns {boolean}
   */
    isColliding(other) {
        // Guards

        // Ignore collisions if this or the other is already dead
        if ((this && this.dead === true) || (other && other.dead === true)) {
            return false;
        }

        if (!other || other === this) return false;
        if (typeof other.x !== 'number' || typeof other.y !== 'number' ||
            typeof other.width !== 'number' || typeof other.height !== 'number') {
        return false;
        }

        const a = this.getBounds();
        const b = {
        left: other.x,
        top: other.y,
        right: other.x + other.width,
        bottom: other.y + other.height
        };

        // AABB overlap
        const overlapX = a.left < b.right && a.right > b.left;
        const overlapY = a.top < b.bottom && a.bottom > b.top;

        return overlapX && overlapY;
    }



    // Bessere Formel zur Kollisionsberechnung mit den Chicken (Genauer)
    // isColliding (obj) {
    //     return  (this.x + this.width) >= obj.x && this.x <= (obj.y + obj.width) && 
    //             (this.y + this.offsetY + this.height) >= obj.y &&
    //             (this.y + this.offsetY) <= (obj.y + obj.height) && 
    //             obj.onCollisionCourse; // Optional: hiermit könnten wir schauen, ob ein Objekt sich in die richtige Richtung bewegt. Nur dann kollidieren wir. Nützlich bei Gegenständen, auf denen man stehen kann.
    // }


    hit() {
        this.energy -= 5;
        if (this.energy < 0) {
            this.energy = 0;
        } else {
            this.lastHit = new Date().getTime();
        }
    }


    isHurt() {
        let timepassed = new Date().getTime() - this.lastHit; // Difference in ms
        timepassed = timepassed / 1000; // Difference in s
        // console.log(timepassed);
        return timepassed < 1.2;
     }


    isDead() {
        return this.energy == 0;
    }


    moveRight() {
        if (this.dead === true) {
            return;
        }
        // console.log('Moving right');
        this.x += this.speed;
    }



    moveLeft() {
        // Stop horizontal movement for dead entities
        if (this.dead === true) {
            return;
        }
        this.x -= this.speed;
        this.x -= 0.15; // keep your original extra drift for living entities
    }


    playAnimation(images) {
        // Freeze any animation when the entity is dead (keeps dead.png visible)
        if (this.dead === true) {
            return;
        }
        let i = this.currentImage % images.length; // let i = 7 % "7 geteilt durch 6 ist Eins" 6; => (1, Rest 1)
        // i = 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0...
        let path = images[i];
        this.img = this.imageCache[path];
        this.currentImage++;
    }


    jump() {
        // this.speedY = 25;
    }    

}
