// js/game.js
(function(){
  // EIN gemeinsames Keyboard für die ganze App
  const kb = window.KEYBOARD || new Keyboard();
  window.KEYBOARD = kb;

  window.addEventListener("keydown", (e) => {
    // console.log(e.keyCode);
    if (e.keyCode === 39) kb.RIGHT = true;
    if (e.keyCode === 37) kb.LEFT  = true;
    if (e.keyCode === 38) kb.UP    = true;
    if (e.keyCode === 40) kb.DOWN  = true;
    if (e.keyCode === 32) kb.SPACE = true;
    if (e.keyCode === 68) kb.D     = true; // D
    if (e.keyCode === 70) kb.F     = true; // F
  });

  window.addEventListener("keyup", (e) => {
    if (e.keyCode === 39) kb.RIGHT = false;
    if (e.keyCode === 37) kb.LEFT  = false;
    if (e.keyCode === 38) kb.UP    = false;
    if (e.keyCode === 40) kb.DOWN  = false;
    if (e.keyCode === 32) kb.SPACE = false;
    if (e.keyCode === 68) kb.D     = false;
    if (e.keyCode === 70) kb.F     = false;
  });
})();
