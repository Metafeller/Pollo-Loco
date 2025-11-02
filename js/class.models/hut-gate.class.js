class HutGate extends DrawableObject {
    /**
     * @param {number} x          linke Kante (Weltkoordinate)
     * @param {number} groundY    Bodenlinie (Bottom, z.B. 360 – wird später aus World kalibriert)
     * @param {number} targetH    Zielhöhe (kleiner gewählt, damit sicher im Bild)
     */
    constructor(x = 5400, groundY = 360, targetH = 260) {
        super();
        this.x = x;

        // --- Größe & Boden-Ausrichtung ---
        this.groundY = groundY;      // Unterkante (Bottom)
        this.height  = targetH;      // Zielhöhe (Breite folgt via Aspect)
        this.width   = 220;          // Platzhalter bis Aspect gesetzt ist
        this.y       = this.groundY - this.height; // top so, dass Bottom = groundY

        // --- Zustände ---
        this.isOpening = false;
        this.isOpen    = false;

        // --- Aspect-Fix (verhindert Verzerrungen) ---
        this._aspectFixed = false;

        // --- Frames ---
        this.FRAME_CLOSED = '/img/objects/gate_closed_01.png';
        this.FRAMES_OPENING = [
            '/img/objects/gate_open_2.png',
            '/img/objects/gate_open_3.png',
            '/img/objects/gate_open_4.png',
            '/img/objects/gate_open_5.png',
            '/img/objects/gate_open_6.png',
            '/img/objects/gate_open_7.png',
            '/img/objects/gate_open_8.png',
            '/img/objects/gate_open_9.png',
            '/img/objects/gate_open_10.png'
        ];
        this.loadImage(this.FRAME_CLOSED);
        this.loadImages([this.FRAME_CLOSED, ...this.FRAMES_OPENING]);

        // --- Öffnen (Smooth) ---
        this._openIdx    = 0;
        this._openTimer  = null;
        this._openStepMs = 160;

        // --- Portal-Zone (wird nach Aspect-Fix neu berechnet) ---
        this.portalInsetX = 70;
        this.portalWidth  = Math.max(60, this.width - this.portalInsetX * 2);
        this.portalHeight = Math.floor(this.height * 0.62);

        // === INSERT: Trigger-Feintuning ===
        // Pepe muss X Pixel tief im Portal sein (mehr = späterer Trigger)
        this.triggerDepthPx = 64;     // typ. 48–96 testen
        // Wir prüfen die "Füße" statt Kopf/Schulter, damit es natürlicher wirkt
        this.footMarginPx   = 14;     // wie weit über der Unterkante wir "Füße" messen
    }

    _applyAspectOnce() {
        if (this._aspectFixed) return;
        const img = this.img;
        if (img && img.naturalWidth && img.naturalHeight) {
            const ratio = img.naturalWidth / img.naturalHeight;
            // Breite aus Zielhöhe ableiten
            this.width = Math.round(this.height * ratio);
            // Top so setzen, dass Bottom sauber am Boden sitzt
            this.y = this.groundY - this.height;

            // Portal neu berechnen (mittig)
            this.portalWidth = Math.max(60, this.width - this.portalInsetX * 2);

            this._aspectFixed = true;
        }
    }

    open() {
        if (this.isOpen || this.isOpening) return;
        this.isOpening = true;
        this._openIdx = 0;
        this._openTimer = setInterval(() => {
            if (this._openIdx >= this.FRAMES_OPENING.length) {
                clearInterval(this._openTimer);
                this._openTimer = null;
                this.isOpening = false;
                this.isOpen = true;
                this.img = this.imageCache[this.FRAMES_OPENING[this.FRAMES_OPENING.length - 1]];
                this._aspectFixed = false;
                this._applyAspectOnce();
                return;
            }
            const path = this.FRAMES_OPENING[this._openIdx++];
            this.img = this.imageCache[path];
            this._aspectFixed = false;
            this._applyAspectOnce();
        }, this._openStepMs);
    }

    update() {
        // Falls Image erst später geladen ist → Aspect/Kanten am Boden korrigieren
        this._applyAspectOnce();
    }

    getPortalRect() {
        // Portal an den Boden legen: Unterkante = groundY
        return {
            x: this.x + this.portalInsetX,
            y: this.groundY - this.portalHeight,        // statt zentriert: auf den Boden setzen
            width: this.portalWidth,
            height: this.portalHeight
        };
    }

    // isCharacterInPortal(character) {
    //     if (!this.isOpen || !character) return false;
    //     const r = this.getPortalRect();
    //     return !(
    //         character.x + character.width  < r.x ||
    //         character.x > r.x + r.width ||
    //         character.y + character.height < r.y ||
    //         character.y > r.y + r.height
    //     );
    // }

    // === REPLACE: isCharacterInPortal(character) ===
    isCharacterInPortal(character) {
        if (!this.isOpen || !character) return false;

        const r = this.getPortalRect();

        // Spieler-"Messpunkte"
        const cx    = character.x + character.width * 0.5;              // Center X
        const feetY = character.y + character.height - (this.footMarginPx || 12); // "Füße"

        // Vertikal nur auslösen, wenn die Füße in der Portal-Höhe sind
        const insideY = feetY >= r.y && feetY <= (r.y + r.height);

        // Horizontal: Center muss im Portal liegen UND eine Mindesttiefe überschreiten
        const leftThreshold = r.x + (this.triggerDepthPx || 0); // „so weit reinlaufen“
        const insideX = cx >= leftThreshold && cx <= (r.x + r.width);

        return insideX && insideY;
    }
    // === /REPLACE ===

}
