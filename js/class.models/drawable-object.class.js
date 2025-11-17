class DrawableObject {
    x = 120;
    y = 280;
    img;
    height = 160; // vorher 150 pepe
    width = 100; // vorher 100 pepe
    imageCache = [];
    currentImage = 0;

    // loadImage('img/test.png');
    loadImage(path) {
        this.img = new Image(); // this.img = document.getElementById('image') <img id="image" src>
        this.img.src = path;
    }


        draw(ctx) {
        const img = this.img;
        // Guard: skip drawing until we have a real, decoded image
        if (!img || !(img instanceof Image) || !img.complete || img.naturalWidth === 0) {
            return;
        }
        try {
            ctx.drawImage(img, this.x, this.y, this.width, this.height);
        } catch (e) {
            // Skip this frame if the browser cannot draw the image yet.
        }
    }


    drawFrame(ctx) {
        if (this instanceof Character || this instanceof Chicken) {
            ctx.beginPath();
            ctx.lineWidth = '3';
            ctx.strokeStyle = 'blue';
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.stroke();
        }
    }


    /**
     * 
     * @param {Array} arr - ['img/image1.png', 'img/image2.png', ...] 
     */
    loadImages(arr) {
        arr.forEach((path) => {
            let img = new Image();
            img.src = path;
            this.imageCache[path] = img;
        });
    }

    
}