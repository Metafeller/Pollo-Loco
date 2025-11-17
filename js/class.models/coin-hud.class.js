// class CoinHUD extends DrawableObject {
//     constructor() {
//         super();
//         this.img = new Image();
//         this.img.src = '/img/7_statusbars/3_icons/icon_coin.png';
//         this.count = 0;
//         // kleine Anzeige links neben der Coin-Bar
//         this.x = 12;
//         this.y = 138;
//         this.width = 28;
//         this.height = 28;
//     }

//     setCount(n) { this.count = Math.max(0, n|0); }

//     draw(ctx) {
//         if (!ctx) return;
//         try { ctx.drawImage(this.img, this.x, this.y, this.width, this.height); } catch(e) {}
//         ctx.save();
//         ctx.fillStyle = '#fff';
//         ctx.font = "22px 'zabars', Arial, Helvetica, sans-serif";
//         ctx.textAlign = 'left';
//         ctx.fillText('x ' + this.count, this.x + this.width + 8, this.y + this.height - 6);
//         ctx.restore();
//     }
// }
