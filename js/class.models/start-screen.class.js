// js/class.models/start-screen.class.js
class StartScreen {
  constructor(img = '/img/9_intro_outro_screens/start/startscreen_3.png') {
    this.img = img;
    this.root = null;
    this._cb = null;
    this._onLang = this._onLang?.bind?.(this);
  }
  attachDom(containerSel = '.game-container') {
    const host = document.querySelector(containerSel);
    if (!host) return;
    const div = document.createElement('div');
    div.className = 'start-screen';
    div.style.backgroundImage = `url('${this.img}')`;

    const btn = document.createElement('button');
    btn.id = 'btn-startgame';
    btn.className = (document.querySelector('.go-btn')) ? 'go-btn' : 'game-primary-btn';
    btn.textContent = (window.I18N ? window.I18N.t('ui.startGame') : 'Start Game');
    btn.addEventListener('click', () => {
      this.hide();
      if (typeof this._cb === 'function') this._cb();
    });

    div.appendChild(btn);
    host.appendChild(div);
    this.root = div;

    window.addEventListener('i18n:changed', this._onLang);
  }
  _onLang() {
    const btn = this.root?.querySelector('#btn-startgame');
    if (btn && window.I18N) btn.textContent = window.I18N.t('ui.startGame');
  }
  onStart(cb) { this._cb = cb; }
  show() { if (this.root) this.root.style.display = 'flex'; }
  hide() { if (this.root) this.root.style.display = 'none'; }
}