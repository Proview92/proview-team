/* ===== Self-update (28 Nov 2026) =====
   A tablet left open all day never reloads the page, so it kept running an old copy of the app
   (the kiosk refused fresh QR codes because it still used the first version's timing).
   The app now checks a small version file and reloads itself when nobody is in the middle of something. */
const BUILD='__BUILD__';
let updNew=false, updAt=0;
function updBusy(){ const a=document.activeElement; if(a&&/INPUT|SELECT|TEXTAREA/.test(a.tagName))return true; if(PN||$('#mdl-root .mdl'))return true; if(U.kiosk&&U.kq)return true; if(typeof SYNC!=='undefined'&&(SYNC.busy||SYNC.dirty))return true; return false }
function updGo(){ try{ sessionStorage.setItem('pv-upd',String(Date.now())) }catch(e){} location.reload() }
function updApply(){ if(!updNew)return; if(U.kiosk||document.hidden){ if(!updBusy())updGo(); return } if(!$('#updbar')){ const b=document.createElement('div'); b.id='updbar'; b.innerHTML='<span>A new version of Proview Team is ready.</span><button class="btn pri" id="updbtn">Update now</button>'; document.body.appendChild(b); $('#updbtn').onclick=updGo } }
async function updCheck(){ if(BUILD.indexOf('__')===0||!/^https?:/.test(location.protocol))return; if(Date.now()-updAt<60000){ updApply(); return } updAt=Date.now();
  try{ const r=await fetch('version.txt?t='+Date.now(),{cache:'no-store'}); if(!r.ok)return; const v=(await r.text()).trim(); if(/^[0-9a-f]{8,40}$/.test(v)&&v!==BUILD){ let last=0; try{ last=Number(sessionStorage.getItem('pv-upd'))||0 }catch(e){} if(Date.now()-last<120000)return; /* just reloaded and still old: the new copy is not out yet, try later */ updNew=true } }catch(e){}
  updApply() }
setInterval(updCheck,120000); setTimeout(updCheck,20000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden)updCheck() });
/* the kiosk goes back to the name tiles after each person: that is the moment to reload */
setInterval(()=>{ if(updNew)updApply() },5000);
