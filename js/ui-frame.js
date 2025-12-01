// js/ui-frame.js
(function(){
  const $  = (id) => document.getElementById(id);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn, {passive:false});

  // One-Shot SFX (Default / CTA / Rules / Logo)
  const sfxDefault = new Audio('/audio/bottle.mp3');
  const sfxCTA     = new Audio('/audio/lets-go.mp3');
  const sfxRules   = new Audio('/audio/rooster-cry.mp3');
  const sfxLogo    = new Audio('/audio/chicken-noise.mp3');
  [sfxDefault, sfxCTA, sfxRules, sfxLogo].forEach(a => { try{ a.volume = 0.8; }catch(e){} });

  // Deep-Mute registrieren
  window.__UI_AUDIOS = window.__UI_AUDIOS || [];
  window.__UI_AUDIOS.push(sfxDefault, sfxCTA, sfxRules, sfxLogo);

  let clickLock = false;
  function play(type){
    if (window.IS_MUTED) return;
    if (clickLock) return;
    clickLock = true; setTimeout(()=>clickLock = false, 220);

    try{
      const a =
        type === 'cta'   ? sfxCTA   :
        type === 'rules' ? sfxRules :
        type === 'logo'  ? sfxLogo  :
        sfxDefault;
      a.currentTime = 0;
      a.play();
    }catch(e){}
  }

  // Canvas-Koordinaten (Viewport-bezogen)
  // Canvas-Koordinaten (Viewport-bezogen)
  function canvasRect(){
    const c = document.querySelector('#canvas');
    if (!c) return null;
    const r = c.getBoundingClientRect();
    return { left: r.left, top: r.top, w: r.width, h: r.height };
  }

  // *** Robust: Startscreen immer exakt deckungsgleich zum Canvas ***
  function placeStartScreen(){
    const ss = document.querySelector('.start-screen');
    const stage = document.getElementById('stage');
    if (!ss || !stage) return;
    // füllt die Stage – keine Viewport-Koordinaten nötig
    ss.style.left = '0';
    ss.style.top  = '0';
    ss.style.width  = stage.clientWidth + 'px';
    ss.style.height = stage.clientHeight + 'px';
  }


  function overlaySafeBox(){
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    let top    = 0;
    let bottom = vh;

    const header = document.querySelector('.header-bar');
    const footer = document.querySelector('.footer-bar');

    if (header){
      const r = header.getBoundingClientRect();
      top = Math.max(top, r.bottom);
    }

    if (footer){
      const r = footer.getBoundingClientRect();
      bottom = Math.min(bottom, r.top);
    }

    const height = Math.max(0, bottom - top);
    return { top, bottom, height };
  }


  function sizeOverlayMobile(card){
    const marginX = 8;
    const marginY = 8;

    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const safe = overlaySafeBox();

    const width       = Math.max(0, vw - marginX * 2);
    const innerTop    = safe.top + marginY;
    const innerHeight = Math.max(0, safe.height - marginY * 2);

    card.style.left   = marginX + 'px';
    card.style.top    = innerTop + 'px';
    card.style.width  = width + 'px';
    card.style.height = innerHeight + 'px';
  }


  function sizeOverlayDesktop(card){
    const marginY = 16;

    const vw   = window.innerWidth || document.documentElement.clientWidth || 0;
    const safe = overlaySafeBox();
    const rect = canvasRect();

    let width = Math.min(720, vw);
    let left  = Math.max(0, (vw - width) / 2);

    if (rect){
      width = rect.w;
      left  = rect.left;
    }

    const innerTop    = safe.top + marginY;
    const innerHeight = Math.max(0, safe.height - marginY * 2);

    card.style.left   = left + 'px';
    card.style.top    = innerTop + 'px';
    card.style.width  = width + 'px';
    card.style.height = innerHeight + 'px';
  }


  // Overlay-Card (Rules / Imprint / Privacy) an Viewport anpassen
  // Desktop: Breite wie Canvas, Höhe ~ Viewport
  // Mobile: 8px Rand links/rechts, Höhe ~ Viewport
  function placeOverlayCard(card){
    if (!card) return;

    const body = document.body;
    const isMobileUi = body && body.classList.contains('is-mobile-ui');

    if (isMobileUi) {
      sizeOverlayMobile(card);
    } else {
      sizeOverlayDesktop(card);
    }
  }


  // Fokus-Trap + ESC
  function trap(overlay){
    const card = overlay.querySelector('.overlay-card');
    const focusables = () => Array.from(
      card.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));

    function onKey(e){
      if (e.key === 'Escape'){
        e.preventDefault();
        close(overlay.id);
        return;
      }
      if (e.key !== 'Tab') return;
      const f = focusables(); if (!f.length) return;
      const first = f[0], last = f[f.length-1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }

    overlay.__trap = onKey;
    overlay.addEventListener('keydown', onKey);
    setTimeout(()=>{ (focusables()[0] || card)?.focus(); }, 10);
  }

  function untrap(overlay){
    if (overlay && overlay.__trap){
      overlay.removeEventListener('keydown', overlay.__trap);
      delete overlay.__trap;
    }
  }

  function open(id){
    const ov = $(id); if (!ov) return;
    placeOverlayCard(ov.querySelector('.overlay-card'));
    ov.classList.add('show');
    ov.removeAttribute('hidden');
    trap(ov);
    try{ window.world?.setPaused(true); }catch(e){}
  }

  function close(id){
    const ov = $(id); if (!ov) return;
    ov.classList.remove('show');
    ov.setAttribute('hidden', '');
    untrap(ov);
    // Resume macht der User bewusst über UI-Bar
  }

  function wireHeaderFooter(){
    // Header-Buttons + One-Shot-Sounds
    on($('btn-rules'),   'click', (e)=>{ e.preventDefault(); play('rules'); open('rules-overlay'); });
    on($('btn-contact'), 'click', ()=> play('cta'));
    on($('lnk-github'),  'click', ()=> play());
    on($('lnk-linkedin'), 'click',()=> play());
    on($('lnk-instagram'),'click',()=> play());

    // Brand-Logo Sound
    const logo = document.querySelector('.brand-logo');
    on(logo, 'click', ()=> play('logo'));

    // Footer-Popups
    on($('btn-imprint'), 'click', ()=>{ play(); open('imprint-overlay'); });
    on($('btn-privacy'), 'click', ()=>{ play(); open('privacy-overlay'); });

    // Close-Buttons (X)
    document.querySelectorAll('[data-close]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const ov = btn.closest('.overlay');
        if (ov) close(ov.id);
      });
    });

    // Mask-Klick: Imprint & Privacy schließen (Rules bleibt bewusst „modal“)
    document.querySelectorAll('#imprint-overlay .overlay-mask, #privacy-overlay .overlay-mask')
      .forEach(mask => mask.addEventListener('click', ()=>{
        const ov = mask.closest('.overlay'); if (ov) close(ov.id);
      }));

    // Scroll-To-Top innerhalb der Overlays
    // [{btn:'rules-top', body:'rules-body'},
    //  {btn:'imprint-top', body:'imprint-body'},
    //  {btn:'privacy-top', body:'privacy-body'}].forEach(({btn,body})=>{
    //   const b = $(body), t = $(btn);
    //   if (!b || !t) return;
    //   b.addEventListener('scroll', ()=>{ t.classList.toggle('show', b.scrollTop > 320); });
    //   t.addEventListener('click', ()=>{ b.scrollTo({top:0, behavior:'smooth'}); });
    // });
  }

  // Icon-Hover Swap
  function hoverSwapIcons(){
    document.querySelectorAll('.icon-link img').forEach(img=>{
      const hv = img.getAttribute('data-hv');
      if (!hv) return;
      img.addEventListener('mouseenter', ()=>{ img.__orig = img.src; img.src = hv; });
      img.addEventListener('mouseleave', ()=>{ if (img.__orig) img.src = img.__orig; });
    });
  }

  // Re-Position bei Resize/Scroll
  function keepSynced(){
    const syncAll = () => { document.querySelectorAll('.overlay-card').forEach(placeOverlayCard); };
    window.addEventListener('resize', syncAll);
    window.addEventListener('scroll', syncAll, true);

    const syncStart = () => placeStartScreen();
    window.addEventListener('resize', syncStart);
    window.addEventListener('scroll', syncStart, true);
  }

  // NEW: global ESC fallback – schließt das oberste offene Overlay (inkl. Rules)
  function wireGlobalEsc(){
    document.addEventListener('keydown', (e)=>{
      if (e.key !== 'Escape') return;
      const openOverlays = Array.from(document.querySelectorAll('.overlay.show'));
      if (!openOverlays.length) return;
      const top = openOverlays[openOverlays.length - 1];
      e.preventDefault();
      close(top.id);
    });
  }

  // document.addEventListener('DOMContentLoaded', ()=>{
  //   wireHeaderFooter();
  //   hoverSwapIcons();
  //   keepSynced();
  //   wireGlobalEsc(); // aktiviert ESC-Fallback
  //   placeStartScreen();
  //   requestAnimationFrame(placeStartScreen);
  //   setTimeout(placeStartScreen, 120);
  // });

  function observeCanvasBox(){
  const c = document.querySelector('#canvas');
  if (!c || typeof ResizeObserver === 'undefined') return;
  const ro = new ResizeObserver(()=>{
    placeStartScreen();
    // responsive.js hört auf "resize" -> löst auch Canvas-UI Neupositionierung aus
    window.requestAnimationFrame(()=> window.dispatchEvent(new Event('resize')));
  });
  ro.observe(c);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    wireHeaderFooter();
    hoverSwapIcons();
    keepSynced();
    wireGlobalEsc();

    // *** NEU: robuste Erst-/Nach-Synchronisation ***
    placeStartScreen();
    requestAnimationFrame(placeStartScreen);
    setTimeout(placeStartScreen, 60);
    setTimeout(placeStartScreen, 160);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(()=>{
        placeStartScreen();
        setTimeout(placeStartScreen, 50);
      });
    }

    observeCanvasBox();   // <— beobachtet Laufzeit-Änderungen am Canvas
  });

  window.addEventListener('load', ()=>{
    placeStartScreen();
    setTimeout(placeStartScreen, 50);
  });

  window.addEventListener('orientationchange', ()=>{
    setTimeout(placeStartScreen, 80);
    setTimeout(placeStartScreen, 220);
  });


})();
