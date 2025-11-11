// js/ui-frame.js
(function(){
  const $ = (id) => document.getElementById(id);
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);

  // One-Shot SFX (Default / CTA / Rules)
  const sfxDefault = new Audio('/audio/bottle.mp3');
  const sfxCTA     = new Audio('/audio/lets-go.mp3');
  const sfxRules   = new Audio('/audio/mitleid.mp3');
  const sfxLogo    = new Audio('/audio/chicken-noise.mp3');
  [sfxDefault,sfxCTA,sfxRules,sfxLogo].forEach(a => { try{ a.volume = 0.8; }catch(e){} });

  // Deep-Mute: registrieren
  window.__UI_AUDIOS = window.__UI_AUDIOS || [];
  window.__UI_AUDIOS.push(sfxDefault, sfxCTA, sfxRules, sfxLogo);

  let clickLock = false;
  function play(type){
    if (window.IS_MUTED) return;
    if (clickLock) return;
    clickLock = true; setTimeout(()=>clickLock=false, 220);
    try{
      const a = (type==='cta' ? sfxCTA : type==='rules' ? sfxRules : sfxDefault);
      a.currentTime = 0; a.play();
    }catch(e){}
  }

  function canvasRect(){
    const c = document.querySelector('#canvas');
    const gc = document.querySelector('.game-container');
    if (!c || !gc) return null;
    const r = c.getBoundingClientRect();
    const gr = gc.getBoundingClientRect();
    return { left: r.left - gr.left + gc.scrollLeft, top: r.top - gr.top + gc.scrollTop, w: r.width, h: r.height };
  }

  function placeOverlayCard(card){
    const r = canvasRect(); if (!r || !card) return;
    card.style.left = r.left + 'px';
    card.style.top  = r.top + 'px';
    card.style.width  = r.w + 'px';
    card.style.height = r.h + 'px';
  }

  // Fokus-Trapping + ESC
  function trap(overlay){
    const card = overlay.querySelector('.overlay-card');
    const focusables = () => Array.from(
      card.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')
    ).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    function onKey(e){
      if (e.key === 'Escape'){ e.preventDefault(); close(overlay.id); return; }
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
    if (overlay && overlay.__trap){ overlay.removeEventListener('keydown', overlay.__trap); delete overlay.__trap; }
  }

  function open(id){
    const ov = $(id); if (!ov) return;
    placeOverlayCard(ov.querySelector('.overlay-card'));
    ov.classList.add('show'); ov.removeAttribute('hidden');
    trap(ov);
    try{ window.world?.setPaused(true); }catch(e){}
  }
  function close(id){
    const ov = $(id); if (!ov) return;
    ov.classList.remove('show'); ov.setAttribute('hidden','');
    untrap(ov);
    // Resume bleibt Nutzerentscheidung über UI-Bar
  }

  function wireHeaderFooter(){
    on($('btn-rules'), 'click', (e)=>{ e.preventDefault(); play('rules'); open('rules-overlay'); });
    on($('btn-contact'),'click', ()=> play('cta'));
    on($('lnk-github'),'click', ()=> play());
    on($('lnk-linkedin'),'click', ()=> play());
    on($('lnk-instagram'),'click', ()=> play());

    on($('btn-imprint'),'click', ()=> { play(); open('imprint-overlay'); });
    on($('btn-privacy'),'click', ()=> { play(); open('privacy-overlay'); });

    // Close
    document.querySelectorAll('[data-close]').forEach(btn=>{
      btn.addEventListener('click', ()=>{ const ov = btn.closest('.overlay'); if (ov) close(ov.id); });
    });

    // Scroll-To-Top innerhalb Overlay
    [{btn:'rules-top', body:'rules-body'},{btn:'imprint-top',body:'imprint-body'},{btn:'privacy-top',body:'privacy-body'}].forEach(({btn,body})=>{
      const b = $(body), t = $(btn);
      if (!b || !t) return;
      b.addEventListener('scroll', ()=>{ t.classList.toggle('show', b.scrollTop > 320); });
      t.addEventListener('click', ()=>{ b.scrollTo({top:0, behavior:'smooth'}); });
    });
  }

  function hoverSwapIcons(){
    document.querySelectorAll('.icon-link img').forEach(img=>{
      const hv = img.getAttribute('data-hv');
      if (!hv) return;
      img.addEventListener('mouseenter', ()=>{ img.__orig = img.src; img.src = hv; });
      img.addEventListener('mouseleave', ()=>{ if (img.__orig) img.src = img.__orig; });
    });
  }

  // i18n: Fließtexte werden von i18n.js eingesetzt (Bodies via IDs)
  document.addEventListener('DOMContentLoaded', ()=>{
    wireHeaderFooter();
    hoverSwapIcons();
    const syncAll = () => { document.querySelectorAll('.overlay-card').forEach(placeOverlayCard); };
    window.addEventListener('resize', syncAll);
    window.addEventListener('scroll', syncAll, true);
  });
})();
