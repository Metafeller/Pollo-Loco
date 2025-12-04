/**
 * Main player character (Pepe).
 * Extends CharacterState with concrete sprite frames and audio setup.
 */
class Character extends CharacterState {

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

    snoreAudio = new Audio('/audio/snoring-man.mp3');
    wakeAudio  = new Audio('/audio/ave-maria-speech.mp3');

    /**
     * Creates a new character instance and prepares images and audio.
     */
    constructor() {
        super();

        this.loadImage('/img/2_character_pepe/2_walk/W-21.png');
        this.initAnimations();
        this.initAudio();
    }

    /**
     * Preloads all animation frames for the character.
     *
     * @returns {void}
     */
    initAnimations() {
        this.loadImages(this.IMAGES_IDLE);
        this.loadImages(this.IMAGES_LONG_IDLE);
        this.loadImages(this.IMAGES_WALKING);
        this.loadImages(this.IMAGES_JUMPING);
        this.loadImages(this.IMAGES_HURT);
        this.loadImages(this.IMAGES_DEAD);
    }

    /**
     * Configures snore and wake audio (loop, volume).
     *
     * @returns {void}
     */
    initAudio() {
        try {
            this.snoreAudio.loop = true;
            this.snoreAudio.volume = 0.55;
        } catch (e) {}

        try {
            this.wakeAudio.volume = 0.85;
        } catch (e) {}
    }

}
