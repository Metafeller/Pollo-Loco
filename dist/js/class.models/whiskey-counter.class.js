class WhiskeyCounter extends DrawableObject {
    constructor() {
        super();
        this.img = new Image();
        this.img.src = '/img/7_statusbars/3_icons/icon_whiskey.png';
        this.count = 0;

        // Links, direkt unter der Coin-Bar
        this.x = 38;
        this.y = 184;
        this.width = 48;   // Icons sind größer → etwas kleiner zeichnen
        this.height = 48;
    }

    setCount(n) { this.count = Math.max(0, n | 0); }

    draw(ctx) {
        if (!ctx) return;
        try { ctx.drawImage(this.img, this.x, this.y, this.width, this.height); } catch (e) {}
        ctx.save();
        ctx.fillStyle = '#000000ff';
        ctx.font = "40px 'zabars', Arial, Helvetica, sans-serif";
        ctx.textAlign = 'left';
        ctx.fillText('x ' + this.count, this.x + this.width + 8, this.y + this.height - 6);
        ctx.restore();
    }
}
