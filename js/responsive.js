// js/responsive.js
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);

  let isMobile = false;
  let uiBar = null;
  let uiBarOrigParent = null;
  let uiBarOrigNext = null;

  function ensureCanvasOverlay(){
    let host = $('.canvas-ui');
    if (!host){
      host = document.createElement('div');
      host.className = 'canvas-ui';
      document.body.appendChild(host);
    }
    return host;
  }

  function ensureRotateOverlay(){
    const host = ensureCanvasOverlay();
    let ov = host.querySelector('#rotate-overlay');
    if (!ov){
      ov = document.createElement('div');
      ov.id = 'rotate-overlay';
      ov.innerHTML = `
        <div class="card">
          <h3>${t('mobile.rotateTitle','Landscape required')}</h3>
          <p>${t('mobile.rotateBody','Rotate your device to play.')}</p>
        </div>`;
      host.appendChild(ov);
    }
    return ov;
  }

  function t(key, fallback){
    try{
      return (window.I18N && typeof window.I18N.t === 'function')
        ? window.I18N.t(key) || fallback
        : fallback;
    }catch(_){ return fallback; }
  }

  function syncCanvasOverlayBox(){
    const canvas = $('#canvas');
    const host = ensureCanvasOverlay();
    if (!canvas || !host) return;
    const r = canvas.getBoundingClientRect();
    host.style.left = r.left + 'px';
    host.style.top  = r.top  + 'px';
    host.style.width  = r.width + 'px';
    host.style.height = r.height + 'px';
  }

  // WICHTIG: Im Fullscreen bleibt Mobile-UI aktiv (unabhängig von Touch)
  function detectMobile(){
    const fs = document.body.classList.contains('fs-active');
    return (window.innerWidth <= 1023) || fs;
  }

  function isPortrait(){
    const mq = window.matchMedia && window.matchMedia('(orientation: portrait)');
    if (mq && 'matches' in mq) return mq.matches;
    return window.innerHeight >= window.innerWidth;
  }

  function setBodyFlags(){
    document.body.classList.toggle('is-mobile-ui', isMobile);
    document.body.classList.toggle('is-desktop-ui', !isMobile);
    document.body.classList.toggle('is-portrait', isMobile && isPortrait());
    document.body.classList.toggle('is-landscape', isMobile && !isPortrait());
  }

  function applyRotateOverlay(){
    const ov = ensureRotateOverlay();
    const show = isMobile && isPortrait();
    ov.classList.toggle('show', show);
  }

  function dockUiBar(){
    uiBar = uiBar || $('#ui-bar');
    if (!uiBar) return;

    if (!uiBarOrigParent){
      uiBarOrigParent = uiBar.parentElement;
      uiBarOrigNext = uiBar.nextElementSibling;
    }

    if (isMobile){
      const dock = $('#mobile-ui-dock') || $('#mobile-ui-dock', ensureCanvasOverlay());
      if (dock && uiBar.parentElement !== dock){
        dock.appendChild(uiBar);
      }
    } else {
      if (uiBarOrigParent && uiBar.parentElement !== uiBarOrigParent){
        if (uiBarOrigNext && uiBarOrigNext.parentElement === uiBarOrigParent){
          uiBarOrigParent.insertBefore(uiBar, uiBarOrigNext);
        } else {
          uiBarOrigParent.appendChild(uiBar);
        }
      }
    }
  }

  function ensureHeaderBurger(){
    const header = $('.header-bar');
    const right  = header ? header.querySelector('.header-right') : null;
    if (!header || !right) return;

    let hb = $('#header-burger');
    let menu = $('#header-mobile-menu');

    if (isMobile){
      if (!hb){
        hb = document.createElement('button');
        hb.id = 'header-burger';
        hb.className = 'hdr-btn glass';
        hb.setAttribute('aria-haspopup','menu');
        hb.setAttribute('aria-expanded','false');
        hb.style.marginLeft = '8px';
        hb.innerHTML = '☰';
        header.insertBefore(hb, right);
        hb.addEventListener('click', ()=>{
          menu?.classList.toggle('open');
          hb.setAttribute('aria-expanded', menu?.classList.contains('open') ? 'true' : 'false');
          try{ if (!window.IS_MUTED){ const a=new Audio('/audio/bottle.mp3'); a.volume=.8; a.play(); }}catch(_){}
        });
      }
      if (!menu){
        menu = document.createElement('div');
        menu.id = 'header-mobile-menu';
        menu.style.position = 'absolute';
        menu.style.top = '70px';
        menu.style.right = '16px';
        menu.style.background = 'rgba(17,17,17,0.92)';
        menu.style.border = '1px solid rgba(242,212,162,0.35)';
        menu.style.borderRadius = '12px';
        menu.style.padding = '10px';
        menu.style.boxShadow = '0 10px 26px rgba(0,0,0,.55)';
        menu.style.display = 'none';
        menu.style.zIndex = '8';
        menu.classList.add('mini-dd');

        menu.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:8px;">
            <button id="hdr-rules-dd" class="hdr-btn glass">${$('#lbl-rules')?.textContent || 'Rules'}</button>
            <a class="hdr-btn cta" href="https://metafeller.com" target="_blank" rel="noopener">${$('#lbl-contact')?.textContent || 'Contact'}</a>
            <a class="icon-link" href="https://github.com/Metafeller" target="_blank" rel="noopener"><img src="img/icons/social/github_1.svg" alt="GitHub"></a>
            <a class="icon-link" href="https://www.linkedin.com/" target="_blank" rel="noopener"><img src="img/icons/social/linkedin_1.svg" alt="LinkedIn"></a>
            <a class="icon-link" href="https://www.instagram.com/savasboas/#" target="_blank" rel="noopener"><img src="img/icons/social/instagram_1.svg" alt="Instagram"></a>
          </div>`;
        header.appendChild(menu);

        const style = document.createElement('style');
        style.textContent = `
          #header-mobile-menu.open{ display:block; }
          @media (min-width: 1024px){ #header-burger, #header-mobile-menu{ display:none !important; } }`;
        document.head.appendChild(style);

        $('#hdr-rules-dd')?.addEventListener('click', ()=>{
          document.getElementById('btn-rules')?.click();
        });
      }
      right.style.display = 'none';
      hb.style.display = 'inline-flex';
    } else {
      if (menu){ menu.remove(); }
      if (hb){ hb.remove(); }
      right.style.display = '';
    }
  }

  function installFullscreenWatch(){
    ['fullscreenchange','webkitfullscreenchange','msfullscreenchange'].forEach(ev=>{
      document.addEventListener(ev, ()=>{
        const fs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
        document.body.classList.toggle('fs-active', !!fs);
        setTimeout(syncCanvasOverlayBox, 50);
        setTimeout(syncCanvasOverlayBox, 250);
      });
    });
  }

  function installPositionSync(){
    window.addEventListener('resize', onResizeOrient, {passive:true});
    window.addEventListener('scroll',  ()=>{ syncCanvasOverlayBox(); }, true);
    window.addEventListener('orientationchange', onResizeOrient);

    window.addEventListener('i18n:changed', ()=>{
      const ov = ensureRotateOverlay();
      ov.querySelector('h3').textContent = t('mobile.rotateTitle','Landscape required');
      ov.querySelector('p').textContent  = t('mobile.rotateBody','Rotate your device to play.');
    });

    // WICHTIG: wenn das Dock erst später existiert (Touch-Controls gebaut)
    window.addEventListener('mc:dock-ready', dockUiBar);
  }

  function onResizeOrient(){
    isMobile = detectMobile();
    setBodyFlags();
    applyRotateOverlay();
    dockUiBar();
    ensureHeaderBurger();
    syncCanvasOverlayBox();
  }

  window.addEventListener('load', onResizeOrient);

  document.addEventListener('DOMContentLoaded', ()=>{
  ensureCanvasOverlay();
  installFullscreenWatch();
  installPositionSync();
  onResizeOrient();
  setTimeout(syncCanvasOverlayBox, 50);
  setTimeout(syncCanvasOverlayBox, 250);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(()=>{
      syncCanvasOverlayBox();
      setTimeout(syncCanvasOverlayBox, 50);
    });
  }
});

  document.addEventListener('visibilitychange', ()=>{
    if (document.visibilityState === 'visible') {
      setTimeout(syncCanvasOverlayBox, 50);
      setTimeout(syncCanvasOverlayBox, 250);
    }
  });

})();
