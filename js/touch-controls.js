// js/touch-controls.js
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);

  const Icons = {
    burger: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z"/></svg>`,
    fs:     `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h4v2H9v2H7V3zm10 0v4h-2V5h-2V3h4zM7 17v4h4v-2H9v-2H7zm10 0h-2v2h-2v2h4v-4z"/></svg>`,
    left:   `<svg viewBox="0 0 24 24"><path d="M14 7l-5 5 5 5V7z"/></svg>`,
    right:  `<svg viewBox="0 0 24 24"><path d="M10 17l5-5-5-5v10z"/></svg>`,
    jump:   `<svg viewBox="0 0 24 24"><path d="M12 3l3 6h-6l3-6zm-1 8h2v10h-2z"/></svg>`,
    bottle: `<svg viewBox="0 0 24 24"><path d="M10 2h4v3l2 2v15l-2 2h-4l-2-2V7l2-2V2z"/></svg>`,
    super:  `<svg viewBox="0 0 24 24"><path d="M12 2l2.4 6.8L22 9l-5 4 1.9 7L12 16l-6.9 4L7 13 2 9l7.6-.2z"/></svg>`
  };


  function clickSfx(){
    try{
      if (window.IS_MUTED) return;
      const a = new Audio('/audio/bottle.mp3');
      a.volume = 0.8;
      a.play();
    }catch(_){}
  }


  function setKey(flagName, on){
    const kb = window.KEYBOARD;
    if (!kb || !(flagName in kb)) return;

    // Exklusive Richtungslogik nur für das Mobile-D-Pad
    if (flagName === 'LEFT' && on) {
      kb.RIGHT = false;
    } else if (flagName === 'RIGHT' && on) {
      kb.LEFT = false;
    }

    kb[flagName] = !!on;
  }


  const touchDirTimers = { LEFT: null, RIGHT: null };


  function clearDir(flag){
    setKey(flag, false);
  }

  function cancelDirTimer(flag){
    const t = touchDirTimers[flag];
    if (t){
      clearTimeout(t);
      touchDirTimers[flag] = null;
    }
  }

  function activateDir(flag){
    cancelDirTimer(flag);
    setKey(flag, true);
  }

  /**
   * Smart-Tap für D-Pad:
   * - kurzer Tap: kurzer Sticky-Impulse (Pepe dreht sich & steppt kurz)
   * - Hold: klassisches gedrückt-halten
   */
  function wireDirectionButton(btn, flag){
    if (!btn) return;

    const TAP_MAX_MS = 170; // <= 170ms = Tap
    const STICK_MS   = 140; // wie lange der Impuls bleibt

    const downEv = (e)=>{
      e.preventDefault();
      btn.setAttribute('data-active','1');
      btn.__pressTs = performance.now();
      activateDir(flag); // sofortige Richtungsaktivierung
    };

    const upCore = (tapLike)=>{
      if (!tapLike){
        // normaler Hold -> direkt loslassen
        clearDir(flag);
        btn.removeAttribute('data-active');
        return;
      }

      // Tap -> kurzer Sticky-Impulse
      cancelDirTimer(flag);
      touchDirTimers[flag] = setTimeout(()=>{
        clearDir(flag);
        btn.removeAttribute('data-active');
        touchDirTimers[flag] = null;
      }, STICK_MS);
    };

    const upEv = (e)=>{
      e.preventDefault();
      const now = performance.now();
      const ts  = btn.__pressTs || now;
      btn.__pressTs = 0;
      const dt  = now - ts;
      const tapLike = dt <= TAP_MAX_MS;
      upCore(tapLike);
    };

    // Pointer (Touch / Stift)
    btn.addEventListener('pointerdown', downEv);
    btn.addEventListener('pointerup', upEv);
    btn.addEventListener('pointercancel', upEv);
    btn.addEventListener('pointerleave', (e)=>{
      if (!btn.hasAttribute('data-active')) return;
      upEv(e);
    });

    // Fallback für Maus (kleines Fenster am Desktop)
    btn.addEventListener('mousedown', downEv);
    ['mouseup','mouseleave'].forEach(ev => btn.addEventListener(ev, upEv));
  }


  function hold(btn, down, up){
    if (!btn) return;
    const downEv = (e)=>{ e.preventDefault(); down(); btn.setAttribute('data-active','1'); };
    const upEv   = (e)=>{ e.preventDefault(); up();   btn.removeAttribute('data-active'); };

    btn.addEventListener('pointerdown', downEv);
    btn.addEventListener('pointerup', upEv);
    btn.addEventListener('pointercancel', upEv);
    btn.addEventListener('pointerleave', (e)=>{ if (btn.hasAttribute('data-active')) upEv(e); });
    btn.addEventListener('mousedown', downEv);
    ['mouseup','mouseleave'].forEach(ev=>btn.addEventListener(ev, upEv));
  }


  function isFullscreen(){
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
  }


  async function toggleFullscreenForCanvas(){
    const stage = document.getElementById('stage') || document.getElementById('canvas');
    if (!stage) return;
    try{
      if (!isFullscreen()){
        const req = stage.requestFullscreen || stage.webkitRequestFullscreen || stage.msRequestFullscreen;
        if (req) await req.call(stage);
        if (screen.orientation?.lock){ try{ await screen.orientation.lock('landscape'); }catch(_){} }
      } else {
        const exit = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
        if (exit) await exit.call(document);
      }
    }catch(_){}
    setTimeout(applyVisibility, 50);
  }


  function togglePanel(){
    const panel = $('#mc-panel');
    if (!panel) return;
    panel.classList.toggle('open');
    clickSfx();
  }


  function ensureOverlay(){
    const root = document.getElementById('stage') || document.body;
    let host = root.querySelector('.canvas-ui');
    if (!host){
      host = document.createElement('div');
      host.className = 'canvas-ui';
      root.appendChild(host);            // <— nicht mehr document.body
    }
    if ($('#mc-burger')) return;

    host.innerHTML = `
      <button id="mc-burger" class="mc-btn mc-burger" aria-label="${t('mobile.menu','Menu')}" title="${t('mobile.menu','Menu')}">
        ${Icons.burger}
      </button>

      <div id="mc-panel" class="mc-panel" aria-label="${t('mobile.menu','Menu')}">
        <div class="mc-panel-head">${t('mobile.controls','Controls')}</div>
        <div class="mc-panel-body">
          <div id="mobile-ui-dock"></div>
        </div>
      </div>

      <div class="mc-dpad">
        <button id="mc-left"  class="mc-btn" aria-label="${t('mobile.left','Left')}" title="${t('mobile.left','Left')}">${Icons.left}</button>
        <button id="mc-right" class="mc-btn" aria-label="${t('mobile.right','Right')}" title="${t('mobile.right','Right')}">${Icons.right}</button>
      </div>

      <div class="mc-actions">
        <button id="mc-throw" class="mc-btn" aria-label="${t('mobile.throw','Bottle')}" title="${t('mobile.throw','Bottle')}">${Icons.bottle}</button>
        <button id="mc-jump"  class="mc-btn" aria-label="${t('mobile.jump','Jump')}"   title="${t('mobile.jump','Jump')}">${Icons.jump}</button>
        <button id="mc-super" class="mc-btn" aria-label="${t('mobile.super','Supernova')}" title="${t('mobile.super','Supernova')}">${Icons.super}</button>
      </div>

      <button id="mc-fs" class="mc-btn mc-fs" aria-label="${t('mobile.fullscreen','Fullscreen')}" title="${t('mobile.fullscreen','Fullscreen')}">
        ${Icons.fs}
      </button>
    `;

    $('#mc-burger')?.addEventListener('click', togglePanel);
    $('#mc-fs')?.addEventListener('click', toggleFullscreenForCanvas);

    wireDirectionButton($('#mc-left'),  'LEFT');
    wireDirectionButton($('#mc-right'), 'RIGHT');
    // hold($('#mc-left'),  ()=> setKey('LEFT', true),  ()=> setKey('LEFT', false));
    // hold($('#mc-right'), ()=> setKey('RIGHT', true), ()=> setKey('RIGHT', false));
    hold($('#mc-jump'),  ()=> setKey('SPACE', true), ()=> setKey('SPACE', false));
    hold($('#mc-throw'), ()=> setKey('D', true),     ()=> setKey('D', false));
    hold($('#mc-super'), ()=> setKey('F', true),     ()=> setKey('F', false));

    window.addEventListener('i18n:changed', ()=>{
      const b = $('#mc-burger'); if (b){ b.setAttribute('title', t('mobile.menu','Menu')); b.setAttribute('aria-label', t('mobile.menu','Menu')); }
      const fs = $('#mc-fs'); if (fs){ fs.setAttribute('title', t('mobile.fullscreen','Fullscreen')); fs.setAttribute('aria-label', t('mobile.fullscreen','Fullscreen')); }
      const head = $('#mc-panel .mc-panel-head'); if (head){ head.textContent = t('mobile.controls','Controls'); }
    });

    // Signal an responsive.js: Dock existiert jetzt
    window.dispatchEvent(new Event('mc:dock-ready'));
  }


  function t(key, fallback){
    try{
      return (window.I18N && typeof window.I18N.t === 'function')
        ? window.I18N.t(key) || fallback
        : fallback;
    }catch(_){ return fallback; }
  }


  function isVisible(el){
    return !!el && el.offsetParent !== null && getComputedStyle(el).display !== 'none';
  }


  function anyGameOverlayOpen(){
    if (document.querySelector('.overlay.show')) return true;
    if ([...document.querySelectorAll('.overlay')].some(el => !el.hasAttribute('hidden'))) return true;
    const ss = document.querySelector('.start-screen');
    if (ss && isVisible(ss)) return true;
    return false;
  }


  function showControlsGroup(on){
    const nodes = [
      '#mc-burger', '.mc-dpad', '.mc-actions', '#mc-fs', '#mc-panel'
    ].map(s => document.querySelector(s)).filter(Boolean);
    nodes.forEach(n => n.style.display = on ? '' : 'none');
    if (!on) document.getElementById('mc-panel')?.classList.remove('open');
    if (!on){ setKey('LEFT', false); setKey('RIGHT', false); setKey('SPACE', false); setKey('D', false); setKey('F', false); }
  }


  function applyVisibility(){
    const isMobileUI   = document.body.classList.contains('is-mobile-ui');
    const isLandscape  = document.body.classList.contains('is-landscape');
    const blockedByUI  = anyGameOverlayOpen();

    const host = document.querySelector('.canvas-ui');
    host.style.display = isMobileUI ? 'block' : 'none';

    const showControls = isMobileUI && isLandscape && !blockedByUI;
    showControlsGroup(showControls);
  }

  
  function syncBox(){
    const host = $('.canvas-ui');
    if (!host) return;
    host.style.left = '0';
    host.style.top  = '0';
    host.style.width  = '100%';
    host.style.height = '100%';
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    ensureOverlay();
    applyVisibility();
    syncBox();

    const obs = new MutationObserver(()=>{ applyVisibility(); syncBox(); });
    obs.observe(document.body, { attributes:true, attributeFilter:['class'] });

    ['fullscreenchange','webkitfullscreenchange','msfullscreenchange']
      .forEach(ev => document.addEventListener(ev, ()=>{ applyVisibility(); syncBox(); }));

    window.addEventListener('resize',  ()=>{ applyVisibility(); syncBox(); }, {passive:true});
    window.addEventListener('scroll',  ()=>{ syncBox(); }, true);
    window.addEventListener('orientationchange', ()=>{ applyVisibility(); setTimeout(syncBox, 80); });
  });


})();
