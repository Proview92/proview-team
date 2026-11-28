/* ===== QR clock-in (28 Nov 2026) =====
   Each person has "My QR code" in their own login. It changes every 2 seconds, so a screenshot is no use.
   The kiosk tablet reads it with its camera and opens that person, the same as name and PIN.
   The code is signed with the person's kiosk code, which other staff cannot see. */
const QR_STEP=2;   /* seconds a code stays on the phone's screen */
const QR_SLACK=5;  /* codes this many steps old or new are still accepted (10 seconds), because two devices' clocks are never exactly the same */
function loadLib(src,test){ return new Promise((res,rej)=>{ if(test())return res(); const s=document.createElement('script'); s.src=src; s.onload=()=>test()?res():rej(new Error('lib')); s.onerror=()=>rej(new Error('load')); document.head.appendChild(s) }) }
async function qrSig(secret,msg){ const enc=new TextEncoder(); const key=await crypto.subtle.importKey('raw',enc.encode('pvq1|'+secret),{name:'HMAC',hash:'SHA-256'},false,['sign']); const b=new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(msg))); return [...b.slice(0,6)].map(x=>x.toString(16).padStart(2,'0')).join('') }
const qrWin=()=>Math.floor(Date.now()/1000/QR_STEP);
const qrSecret=p=>String(p.code||'')+'|'+p.id;
async function qrMake(p){ const w=qrWin(); return 'PVQ1.'+p.id+'.'+w+'.'+await qrSig(qrSecret(p),p.id+'.'+w) }
async function qrCheck(txt){ const m=/^PVQ1\.([A-Za-z0-9_-]+)\.(\d+)\.([0-9a-f]{12})$/.exec(String(txt||'').trim()); if(!m)return {err:'other'}; const p=P(m[1]); if(!p||p.archived)return {err:'who'}; const w=+m[2]; if(Math.abs(qrWin()-w)>QR_SLACK)return {err:'old',p}; if(await qrSig(qrSecret(p),p.id+'.'+w)!==m[3])return {err:'bad',p}; return {p} }
/* ---- my code, on the person's own phone ---- */
function qrCard(){ const m=me(); if(!m||m.noTrack)return ''; return `<div class="card pad qr-card"><div class="tx"><b>My QR code</b><small>Hold it up to the tablet at work to clock in or out without typing a PIN.</small></div><button class="btn pri" data-a="qrMine">${ic('qr')}Show my QR code</button></div>` }
{ const _c=V.clock; V.clock=()=>_c()+qrCard() }
let qrT=null;
async function qrDraw(){ const box=$('#qrbox'); if(!box){ clearInterval(qrT); qrT=null; return } const m=me(); const w=qrWin(); const c=$('#qrleft'); if(c&&!c.textContent)c.textContent='The code changes every '+QR_STEP+' seconds';
  if(box.dataset.w===String(w))return; box.dataset.w=String(w);
  try{ const txt=await qrMake(m); const q=qrcode(0,'M'); q.addData(txt); q.make(); box.innerHTML=q.createSvgTag({cellSize:8,margin:4,scalable:true}) }catch(e){ box.innerHTML='<p style="color:#b00020;padding:20px">Could not make the code on this device.</p>' } }
A.qrMine=async()=>{ const m=me(); if(!m)return; modal(`<h2>${esc(m.name)}</h2><p class="mut" style="margin:0 0 10px">Hold this up to the tablet's camera.</p><div id="qrbox" class="qrbox" aria-label="Your QR code"><p style="padding:30px;color:#333">Making your code…</p></div><p id="qrleft" class="mut" style="text-align:center;margin:8px 0 0;font-variant-numeric:tabular-nums"></p><div class="r"><button class="btn pri" data-a="mclose">Close</button></div>`);
  try{ await loadLib('vendor/qrgen.min.js',()=>typeof qrcode==='function') }catch(e){ const b=$('#qrbox'); if(b)b.innerHTML='<p style="color:#b00020;padding:20px">Could not load the QR code. Check the internet connection and try again.</p>'; return }
  clearInterval(qrT); qrT=setInterval(qrDraw,250); qrDraw() };
/* ---- the tablet reads it ---- */
const QRS={stream:null,timer:null,busy:false,last:'',lastAt:0,cv:null};
function qrStop(){ clearInterval(QRS.timer); QRS.timer=null; if(QRS.stream){ try{ QRS.stream.getTracks().forEach(t=>t.stop()) }catch(e){} QRS.stream=null } }
function qrMsg(t,bad){ if(U.kq&&U.kq.step==='qr'){ U.kq.msg=t; U.kq.bad=!!bad } const el=$('#kqm'); if(el){ el.textContent=t; el.className=bad?'kq-bad':'' } }
function kQrHtml(q){ return `<div class="kx-hd"><div><h2>Hold your QR code up to the camera</h2><p>On your phone: Time clock, then Show my QR code.</p></div><button class="btn" data-a="kQrFlip">${ic('refresh')}<span>Other camera</span></button><button class="btn pri" data-a="kcancel">Cancel</button></div><p id="kqm" class="${q.bad?'kq-bad':''}">${esc(q.msg||'')}</p><div class="kq-box ${U.kCam==='environment'?'':'mir'}"><video id="kqv" playsinline muted autoplay></video><div class="kq-frame" aria-hidden="true"></div></div>` }
async function qrStart(){ qrStop(); qrMsg('Starting the camera…');
  try{ if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia)throw new Error('nocam'); await loadLib('vendor/jsqr.min.js',()=>typeof jsQR==='function');
    const st=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:U.kCam||'user',width:{ideal:1280},height:{ideal:720}}});
    if(!U.kiosk||!U.kq||U.kq.step!=='qr'){ st.getTracks().forEach(t=>t.stop()); return }
    QRS.stream=st; const v=$('#kqv'); if(!v){ qrStop(); return } v.srcObject=st; try{ await v.play() }catch(e){}
    qrMsg('Looking for a code…'); QRS.timer=setInterval(qrTick,220) }
  catch(e){ qrStop(); const n=e&&e.name; U.kq={step:'msg',msg:n==='NotAllowedError'?'The camera is blocked on this tablet. Allow the camera for this site in the browser settings, or tap your name instead.':n==='NotFoundError'||(e&&e.message==='nocam')?'No camera was found on this device. Tap your name instead.':'The camera could not start. Tap your name instead.'}; U.kForce=true; renderKiosk(); kClose(7000) } }
async function qrTick(){ if(!U.kiosk||!U.kq||U.kq.step!=='qr'){ qrStop(); return } const v=$('#kqv'); if(!v||QRS.busy||v.readyState<2||!v.videoWidth)return; QRS.busy=true;
  try{ const sc=Math.min(1,720/Math.max(v.videoWidth,v.videoHeight)); const w=Math.round(v.videoWidth*sc), h=Math.round(v.videoHeight*sc); const cv=QRS.cv||(QRS.cv=document.createElement('canvas')); cv.width=w; cv.height=h; const cx=cv.getContext('2d',{willReadFrequently:true}); cx.drawImage(v,0,0,w,h);
    const r=jsQR(cx.getImageData(0,0,w,h).data,w,h,{inversionAttempts:'dontInvert'});
    if(r&&r.data){ if(r.data===QRS.last&&Date.now()-QRS.lastAt<2500){ QRS.busy=false; return } QRS.last=r.data; QRS.lastAt=Date.now(); const c=await qrCheck(r.data);
      if(!U.kq||U.kq.step!=='qr'){ QRS.busy=false; return }
      if(c.p&&!c.err){ qrStop(); const p=c.p; if(!p.licensed){ U.kq={pid:p.id,step:'msg',msg:'No licence for '+p.name+'. Ask a manager.'}; U.kForce=true; renderKiosk(); kClose(4000) } else { U.kq={pid:p.id,step:'act',pin:'',qr:true}; U.kForce=true; renderKiosk(); kClose(30000) } }
      else qrMsg(c.err==='old'?'That code has run out. Hold the live code on your phone up to the camera, not a photo of it.':c.err==='other'?'That is not a Proview Team code.':'That code was not recognised. Ask a manager.',true) } }
  catch(e){}
  QRS.busy=false }
A.kqr=()=>{ U.kq={step:'qr',msg:'Starting the camera…'}; U.kForce=true; renderKiosk(); kClose(45000); qrStart() };
A.kQrFlip=()=>{ U.kCam=U.kCam==='environment'?'user':'environment'; U.kForce=true; renderKiosk(); kClose(45000); qrStart() };
/* everyone needs a kiosk code for their QR to be signed with; an admin's device fills in any that are missing */
function qrEnsureCodes(){ const m=me(); if(!m||!isAdmin(m))return; let ch=false; S.people.forEach(p=>{ if(!p.archived&&!p.code){ p.code=uid().slice(0,6).toUpperCase(); ch=true } }); if(ch)save() }
