/* ===== No pinch zoom (owner, 26 Nov 2026) =====
   The app is laid out to fit each screen, so pinching in only left people stuck half zoomed. This stops pinch and
   double-tap zoom on phones and tablets, and trackpad pinch (and Ctrl + wheel) on laptops. Scrolling is untouched.
   The browser's own zoom from the keyboard (Cmd or Ctrl with + and -) still works, for anyone who needs bigger text. */
(function(){
  const stop=e=>{ e.preventDefault() };
  ['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,stop,{passive:false}));      /* Safari: iPhone, iPad and Mac trackpad */
  document.addEventListener('wheel',e=>{ if(e.ctrlKey||e.metaKey)e.preventDefault() },{passive:false});               /* Chrome, Edge, Firefox trackpad pinch */
  document.addEventListener('touchmove',e=>{ if(e.touches&&e.touches.length>1)e.preventDefault() },{passive:false});   /* two fingers on a touch screen */
  /* double-tap zoom is switched off in the styles (touch-action), so quick repeated taps on buttons still all count */
})();
