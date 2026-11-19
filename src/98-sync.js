/* ===== Shared-data mode (only when the app is served by server.js) =====
   Without the server the app keeps working exactly as before, with data in this browser only.
   With the server, every phone sees the same data. Changes are sent as small patches (per item), and each
   phone checks for other people's changes every few seconds, so in-app notifications arrive on every device. */
const SYNC={on:false,rev:0,snap:null,busy:false,dirty:false,pendRender:false,err:false};
const SYNC_SKIP=new Set(['ui','v']);
const syncIdArr=v=>Array.isArray(v)&&v.every(x=>x&&typeof x==='object'&&!Array.isArray(x)&&x.id!=null);
function syncOne(v){ if(syncIdArr(v)){ const m={}; v.forEach(x=>{m[x.id]=JSON.stringify(x)}); return {arr:true,m} } return {arr:false,j:JSON.stringify(v)} }
function syncSnap(st){ const o={}; Object.keys(st).forEach(k=>{ if(!SYNC_SKIP.has(k))o[k]=syncOne(st[k]) }); return o }
function syncDiff(){ const ops=[], snap=SYNC.snap||{};
  Object.keys(S).forEach(k=>{ if(SYNC_SKIP.has(k))return; const v=S[k], old=snap[k];
    if(syncIdArr(v)){ if(!old||!old.arr){ ops.push({k,set:v}); return } const seen=new Set(), up=[]; v.forEach(x=>{ seen.add(String(x.id)); if(old.m[x.id]!==JSON.stringify(x))up.push(x) }); const del=Object.keys(old.m).filter(id=>!seen.has(id)); if(up.length||del.length)ops.push({k,up,del}) }
    else { const j=JSON.stringify(v); if(!old||old.arr||old.j!==j)ops.push({k,set:v}) } });
  Object.keys(snap).forEach(k=>{ if(!(k in S))ops.push({k,unset:true}) }); return ops }
function syncApply(ops,st,snap){ ops.forEach(o=>{ const k=o.k; if(o.unset){ delete st[k]; if(snap)delete snap[k]; return }
    if('set' in o){ st[k]=o.set; if(snap)snap[k]=syncOne(o.set); return }
    let arr=st[k]; if(!Array.isArray(arr))arr=st[k]=[]; const sm=snap&&snap[k]&&snap[k].arr?snap[k].m:null;
    (o.up||[]).forEach(x=>{ const i=arr.findIndex(y=>y&&y.id===x.id); if(i>=0)arr[i]=x; else arr.push(x); if(sm)sm[x.id]=JSON.stringify(x) });
    (o.del||[]).forEach(id=>{ const i=arr.findIndex(y=>y&&String(y.id)===String(id)); if(i>=0)arr.splice(i,1); if(sm)delete sm[id] }) }) }
const lsGet=k=>{ try{ return localStorage.getItem(k)||'' }catch(e){ return '' } };
const lsSet=(k,v)=>{ try{ if(v)localStorage.setItem(k,v); else localStorage.removeItem(k) }catch(e){} };
const syncUrl=p=>CL.site?CL.cfg.url+'/functions/v1/team-api/'+p:p;
async function syncHdr(){ const h={'content-type':'application/json'};
  if(CL.site){ const ss=(await CL.sb.auth.getSession()).data.session; if(!ss){ clKick('auth'); throw new Error('auth') } h.apikey=CL.cfg.key; h.authorization='Bearer '+ss.access_token; h['x-site']=CL.site.id }
  else { let code=''; try{code=localStorage.getItem('proview-code')||''}catch(e){} if(code)h['x-code']=code }
  const tk=lsGet(TKEY()); if(tk)h['x-token']=tk; return h }
// cloud mode: the login, the licence or the membership is no longer good
async function syncCloudErr(r){ if(!CL.site||![401,402,403].includes(r.status))return; let bj={}; try{ bj=await r.clone().json() }catch(e){}
  if(r.status===401&&bj.error==='token')throw new Error('token');
  if(r.status===401){ clKick('auth'); throw new Error('auth') }
  if(r.status===402){ clKick('licence'); throw new Error('licence') }
  if(bj.error==='site'){ clSet('pt-site',''); clKick('site'); throw new Error('site') } }
async function syncFetch(path,opt,ms){ const ctl=new AbortController(); const t=setTimeout(()=>ctl.abort(),CL.site?Math.max(ms||0,20000):(ms||8000));
  try{ const h=await syncHdr();
    let r=await fetch(syncUrl(path),{...(opt||{}),headers:h,signal:ctl.signal,cache:'no-store'});
    await syncCloudErr(r);
    if(r.status===401&&!CL.site){ let bj={}; try{ bj=await r.clone().json() }catch(e){} if(bj.error==='token')throw new Error('token'); const c=window.prompt('Enter the access code for this app'); if(c){ try{localStorage.setItem('proview-code',c)}catch(e){} h['x-code']=c; r=await fetch(path,{...(opt||{}),headers:h,signal:ctl.signal,cache:'no-store'}) } }
    if(r.status===401)throw new Error('code'); if(!r.ok){ const er=new Error('http '+r.status); er.status=r.status; try{ er.body=await r.json() }catch(e){} throw er } return await r.json() } finally{ clearTimeout(t) } }
function syncAdopt(state,rev){ const ui=S.ui||{}; S=state; S.ui=ui; SYNC.rev=rev; migrate(); SYNC.snap=syncSnap(S); try{ localStorage.setItem(CUR,JSON.stringify(S)) }catch(e){} }
function syncTimers(){ if(SYNC.tm)return; SYNC.tm=1; setInterval(syncPoll,CL.site?60000:3000); if(CL.site){ try{ CL.sb.channel('pt-'+CL.site.id).on('postgres_changes',{event:'*',schema:'public',table:'pt_site_ping',filter:'id=eq.'+CL.site.id},ev=>{ const rv=Number(ev&&ev.new&&ev.new.rev)||0; if(!rv||rv>SYNC.rev)syncPoll() }).subscribe() }catch(e){} } setInterval(syncChip,1500); document.addEventListener('visibilitychange',()=>{ if(!document.hidden)syncPoll() }); window.addEventListener('online',syncPoll) }
async function syncStart(){ const j=await syncFetch('api/state'); const id=lsGet(MKEY()); syncAdopt(j.state,j.rev); if(id&&P(id)&&!(S.ui.real&&S.ui.real!==S.ui.me))S.ui.me=id; SYNC.on=true; syncTimers() }
async function syncInit(){ const cfg=await clCfg(); if(cfg){ await cloudInit(cfg); return }
  try{ if(!/^https?:$/.test(location.protocol))return; const p=await syncFetch('api/ping',{},4000); if(!p||!p.proview)return;
    SYNC.priv=!!p.priv;
    if(SYNC.priv){
      if(!p.hasState){ const st={...S}; delete st.ui; await syncFetch('api/init',{method:'POST',body:JSON.stringify({state:st})},20000) }
      if(!lsGet(TKEY())){ U.login=true; return }
      try{ await syncStart() }catch(e){ if(e&&e.message==='token'){ lsSet(TKEY(),''); U.login=true; return } throw e }
      return }
    SYNC.on=true; let j=await syncFetch('api/state'); if(!j.state){ const st={...S}; delete st.ui; j=await syncFetch('api/init',{method:'POST',body:JSON.stringify({state:st})},20000) } syncAdopt(j.state,j.rev);
    syncTimers() }catch(e){ SYNC.on=false; if(e&&e.message==='code'){ syncLock(); throw e } } }
/* Cloud mode start: sign in, pick the business, then load its shared data. */
async function cloudInit(cfg){ const site=await cloudGate(cfg);
  CUR=KEY+'-c-'+site.id; let c=null; try{ c=JSON.parse(localStorage.getItem(CUR)||'null') }catch(e){}
  S=c&&c.v?c:blankData(site.name,'',clName()); S.ui=S.ui||{}; migrate(); SYNC.priv=true;
  try{
    const p=await syncFetch('api/ping');
    if(!p.hasState){
      if(!(p.master||p.role==='Admin')){ clScreen('fail',{err:'This business has not been set up yet. Ask your business admin to sign in first.'}); return new Promise(()=>{}) }
      const st=blankData(site.name,'',clName()); st.people[0].email=CL.who.email; st.org.email=CL.who.email; delete st.ui;
      await syncFetch('api/init',{method:'POST',body:JSON.stringify({state:st})},30000) }
    if(new URLSearchParams(location.search).get('shared')==='1')clSet('pt-noauto-'+site.id,'1');
    for(let i=0;i<2;i++){
      if(!lsGet(TKEY())&&clGet('pt-noauto-'+site.id)!=='1'){ const r=await syncPost('api/auto',{}); if(r.s===200&&r.j.token){ lsSet(TKEY(),r.j.token); lsSet(MKEY(),r.j.id); clSet('pt-how-'+site.id,'auto') } }
      if(!lsGet(TKEY())){ U.login=true; return }
      try{ await syncStart(); return }catch(e){ if(e&&e.message==='token'&&!i){ lsSet(TKEY(),''); lsSet(MKEY(),''); continue } throw e } }
  }catch(e){ if(CL.kicked)return new Promise(()=>{}); clScreen('fail',{err:'Could not load the data. Check the internet and try again.'}); return new Promise(()=>{}) } }
function syncChip(){ const el=document.getElementById('sv'); if(!el||!SYNC.on)return; if(SYNC.err){ el.className='sv bad'; el.textContent='Offline: not shared' } else if(el.textContent==='Offline: not shared'){ el.className='sv'; el.textContent='Saved' } }
SYNC.mark=function(){ if(!SYNC.on)return; clearTimeout(SYNC.t); SYNC.t=setTimeout(syncPush,350) };
function syncLock(){ SYNC.on=false; SYNC.locked=true; document.body.innerHTML='<div style="font:16px system-ui;padding:32px;max-width:420px;margin:auto"><h2>Access code needed</h2><p>This app is protected. Reload the page and enter the access code when asked.</p><button onclick="try{localStorage.removeItem(\'proview-code\')}catch(e){};location.reload()" style="font:inherit;padding:10px 16px">Reload</button></div>' }
async function syncPush(){ if(!SYNC.on)return; if(SYNC.busy){ SYNC.dirty=true; return } const ops=syncDiff(); if(!ops.length&&!SYNC.cond)return; SYNC.busy=true; const after=syncSnap(S); let res='ok'; const cond=SYNC.cond;
  try{ const r=await syncFetch('api/ops',{method:'POST',body:JSON.stringify({base:SYNC.rev,ops,cond:cond||undefined})},20000); SYNC.snap=after; SYNC.rev=r.rev; SYNC.err=false; SYNC.cond=null; if(r.missed&&r.missed.length)syncRemote(r.missed);
    if(r.dropped)syncResync() }
  catch(e){ if(e&&e.message==='token'){ syncTokenLost(); return } if(e&&e.message==='code'){ syncLock(); return }
    if(e&&e.status===409&&e.body&&e.body.conflict){ SYNC.cond=null; res='conflict'; SYNC.busy=false; await syncResync(true); return res }
    SYNC.err=true; res='err'; setTimeout(()=>SYNC.mark(),4000) }
  SYNC.busy=false; if(SYNC.dirty){ SYNC.dirty=false; SYNC.mark() } return res }
async function syncResync(force){ if(!SYNC.on)return; if(!force&&Date.now()-(SYNC.lastRs||0)<8000)return; SYNC.lastRs=Date.now();
  try{ const j=await syncFetch('api/state'); const ui=S.ui; syncAdopt(j.state,j.rev); S.ui=ui; SYNC.pendRender=true; if(force){ const ae=document.activeElement; if(ae&&ae.blur&&!(ae.closest&&ae.closest('#pnl-root')))ae.blur() } syncRender() }catch(e){ if(e&&e.message==='token')syncTokenLost() } }
function syncTokenLost(){ if(CL.kicked)return; lsSet(TKEY(),''); lsSet(MKEY(),''); try{ localStorage.removeItem(CUR) }catch(e){} location.reload() }
function syncRemote(opsList){ const mid=(me()||{}).id; const had=new Set(S.notifs.map(n=>n.id)); opsList.forEach(ops=>syncApply(ops,S,SYNC.snap)); if(!P(S.ui.me))S.ui.me=S.people[0].id; try{ localStorage.setItem(CUR,JSON.stringify(S)) }catch(e){}
  const fresh=S.notifs.filter(n=>!had.has(n.id)&&!n.read&&(!n.to||n.to===mid)); if(fresh.length){ toast(fresh[0].text.length>90?fresh[0].text.slice(0,88)+'...':fresh[0].text); try{ navigator.vibrate&&navigator.vibrate(120) }catch(e){} }
  SYNC.pendRender=true; syncRender() }
function syncRender(){ if(!SYNC.pendRender)return; const ae=document.activeElement; const typing=ae&&/INPUT|TEXTAREA|SELECT/.test(ae.tagName)&&!(ae.closest&&ae.closest('#pnl-root')); if(PN||typing)return; SYNC.pendRender=false; render(); syncTitle() }
function syncTitle(){ const n=S.notifs.filter(x=>!x.read&&(!x.to||x.to===(me()||{}).id)).length; document.title=(n?'('+n+') ':'')+(S.org&&S.org.name?S.org.name+' staff':'Staff') }
async function syncPoll(){ if(!SYNC.on||SYNC.busy)return; if(SYNC.pendRender){ syncRender() }
  try{ const r=await syncFetch('api/changes?since='+SYNC.rev,{},6000); SYNC.err=false;
    if(r.snapshot){ const mid=(me()||{}).id; const had=new Set(S.notifs.map(n=>n.id)); syncAdopt(r.snapshot,r.rev); const fresh=S.notifs.filter(n=>!had.has(n.id)&&!n.read&&n.to===mid); if(fresh.length)toast(fresh[0].text); SYNC.pendRender=true; syncRender(); return }
    if(r.ops&&r.ops.length){ SYNC.rev=r.rev; syncRemote(r.ops) } else SYNC.rev=Math.max(SYNC.rev,r.rev) }catch(e){ if(e&&e.message==='token'){ syncTokenLost(); return } if(e&&e.message==='code'){ syncLock(); return } SYNC.err=true } }

/* ===== Personal sign-in (shared mode) ===== */
const LG={step:'list',list:null,org:'',id:'',err:'',busy:false};
async function syncPost(path,body){ try{ const h=await syncHdr(); const r=await fetch(syncUrl(path),{method:'POST',headers:h,body:JSON.stringify(body||{})}); let j={}; try{ j=await r.json() }catch(e){} return {s:r.status,j} }catch(e){ return {s:0,j:{}} } }
async function lgLoad(){ try{ const j=await syncFetch('api/people'); LG.list=j.people||[]; LG.org=j.org||''; LG.err='' }catch(e){ if(e&&e.message==='code'){ syncLock(); return } LG.list=[]; LG.err='Cannot reach the server. Check the internet and reload.' } renderLogin() }
function renderPrivLogin(){ const r=$('#login-root'); if(!LG.list){ r.innerHTML=CL_SPLASH; lgLoad(); return }
  const per=LG.list.find(x=>x.id===LG.id); const org=esc(LG.org||S.org.name||'');
  const err=LG.err?`<div class="notice bad">${esc(LG.err)}</div>`:'', back=`<div class="alinks"><button type="button" data-a="plBack">Back</button></div>`, go=t=>`<button type="button" class="go" data-a="plGo" ${LG.busy?'disabled':''}>${t}</button>`;
  let body='', wide=false;
  if(LG.step==='list'){ wide=true; body=`<h1>Who is signing in?</h1><p class="muted">${org}</p>${err}<div class="pvs-pick">${LG.list.map(p=>`<button type="button" data-a="plPick" data-id="${esc(p.id)}"><b>${esc(p.name)}</b><span>${roleName(p.role)}${p.trial?' · trial':''}</span></button>`).join('')}</div>${CL.site?`<div class="alinks"><button type="button" data-a="clOut">Sign out of this device (${esc(CL.who.email)})</button></div>`:''}` }
  else if(LG.step==='nopin'){ body=`<h1>${esc(per?per.name:'')}</h1><p class="muted">You do not have a PIN yet. Ask your manager to set one for you, then come back.</p>${back}` }
  else if(LG.step==='setup'){ body=`<h1>Welcome, ${esc(per?per.name.split(' ')[0]:'')}</h1><p class="muted">Choose your PIN: 3 to 6 numbers. You will use it every time you sign in.</p>${err}<input id="plpin" class="plin" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" placeholder="New PIN" aria-label="New PIN"><input id="plpin2" class="plin" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" placeholder="Same PIN again" aria-label="Same PIN again">${go('Save and sign in')}${back}` }
  else { body=`<h1>${esc(per?per.name:'')}</h1><p class="muted">Enter your PIN</p>${err}<input id="plpin" class="plin" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" placeholder="PIN" aria-label="PIN">${go('Sign in')}${back}` }
  r.innerHTML=clPage(body,false,wide);
  const pi=$('#plpin'); if(pi){ pi.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); A.plGo() } }); setTimeout(()=>pi.focus(),50) } const p2=$('#plpin2'); if(p2)p2.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); A.plGo() } }) }
A.plPick=d=>{ const p=LG.list.find(x=>x.id===d.id); if(!p)return; LG.id=p.id; LG.err=''; LG.step=p.pin?'pin':(p.role==='owner'?'setup':'nopin'); renderLogin() };
A.plBack=()=>{ LG.step='list'; LG.id=''; LG.err=''; renderLogin() };
A.plGo=async()=>{ if(LG.busy)return; const pin=($('#plpin')||{}).value||''; if(!/^\d{3,6}$/.test(pin)){ LG.err='Enter 3 to 6 numbers.'; renderLogin(); return }
  let r; LG.busy=true;
  if(LG.step==='setup'){ if(pin!==(($('#plpin2')||{}).value||'')){ LG.busy=false; LG.err='The two PINs are different.'; renderLogin(); return } r=await syncPost('api/setpin',{id:LG.id,pin}) }
  else r=await syncPost('api/login',{id:LG.id,pin});
  LG.busy=false;
  if(r.s===200&&r.j.token){ lsSet(TKEY(),r.j.token); lsSet(MKEY(),r.j.id); if(CL.site)clSet('pt-how-'+CL.site.id,'pin'); try{ S.ui.me=r.j.id; delete S.ui.real; await syncStart(); S.ui.me=r.j.id; U.login=false; U.loc='all'; U.scope='org'; U.page=defaultPage(); U.pop=null; LG.list=null; LG.step='list'; render(); syncTitle() }catch(e){ lsSet(TKEY(),''); LG.err='Could not load your data. Try again.'; renderLogin() } return }
  if(r.s===200&&r.j.setup){ LG.step='setup'; LG.err=''; renderLogin(); return }
  LG.err=r.s===401?'Wrong PIN. Try again.':r.s===429?'Too many tries. Please wait ten minutes.':r.s===403?'Ask your manager to set your PIN.':'Could not sign in. Check the internet.'; renderLogin() };
async function syncSignOut(){ try{ clearTimeout(SYNC.t); let n=0; while(SYNC.busy&&n++<30)await new Promise(r=>setTimeout(r,100)); await syncPush() }catch(e){}
  await syncPost('api/logout',{}); const bk=(()=>{ try{ return JSON.parse(sessionStorage.getItem('proview-back')||'null') }catch(e){ return null } })();
  try{ sessionStorage.removeItem('proview-back') }catch(e){}
  try{ localStorage.removeItem(CUR) }catch(e){}
  if(bk&&bk.t){ lsSet(TKEY(),bk.t); lsSet(MKEY(),bk.id) } else { lsSet(TKEY(),''); lsSet(MKEY(),'');
    if(CL.site){ if(clGet('pt-how-'+CL.site.id)==='pin')clSet('pt-noauto-'+CL.site.id,'1'); else { clSet('pt-site',''); try{ await CL.sb.auth.signOut() }catch(e){} } } }
  setTimeout(()=>location.reload(),bk?1600:50) }
