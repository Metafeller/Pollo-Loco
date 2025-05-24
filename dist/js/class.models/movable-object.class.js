class MovableObject extends DrawableObject {
    speed = 0.15;
    otherDirection = false;
    speedY = 0;
    acceleration = 2.5;
    energy = 100;
    lastHit = 0;


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


    // character.isColliding(chicken);
    isColliding(mo) {
        return this.x + this.width > mo.x &&
               this.y + this.height > mo.y &&
               this.x < mo.x &&
               this.y < mo.y + mo.height;
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
    console.log('Moving right');
        this.x += this.speed;  
    }


    moveLeft() {
        this.x -= this.speed;
        this.x -= 0.15;
    }


    playAnimation(images) {
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
