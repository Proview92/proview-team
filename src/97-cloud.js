/* ===== Cloud mode (Supabase), set up the same way as Proview Bookings =====
   cloud.json next to index.html holds { url, key } of the Supabase project. When it is there:
   1. people sign in with an email account (or "Sign in with Proview account"),
   2. pt_whoami says which businesses that login may open and whether each one is licensed,
   3. the data of the chosen business is shared through the team-api function (98-sync.js), which gives each
      person only what they may see.
   Without cloud.json the app works as before: on this device only, or with server-kit/server.js. */
const CL={cfg:null,sb:null,who:null,site:null,scr:'',err:'',note:'',email:'',busy:false,go:null,locked:null,kicked:false};
const CL_SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
const CL_PORTAL='https://license.proviewcrm.co.uk', CL_PHONE='020 8935 5495';
const TKEY=()=>CL.site?'pt-token-'+CL.site.id:'proview-token';
const MKEY=()=>CL.site?'pt-me-'+CL.site.id:'proview-me';
const clGet=k=>{ try{ return localStorage.getItem(k)||'' }catch(e){ return '' } };
const clSet=(k,v)=>{ try{ if(v)localStorage.setItem(k,v); else localStorage.removeItem(k) }catch(e){} };
const clSS=(k,v)=>{ try{ if(v===undefined)return sessionStorage.getItem(k)||''; if(v)sessionStorage.setItem(k,v); else sessionStorage.removeItem(k) }catch(e){ return '' } };
function clLoad(src){ return new Promise((ok,no)=>{ const s=document.createElement('script'); s.src=src; s.onload=ok; s.onerror=no; document.head.appendChild(s) }) }
async function clCfg(){ if(!/^https?:$/.test(location.protocol))return null;
  try{ const r=await fetch('cloud.json',{cache:'no-store'}); if(!r.ok)return null; const j=await r.json(); return j&&j.url&&j.key?j:null }catch(e){ return null } }
function clName(){ const u=CL.user||{}; const m=u.user_metadata||{}; if(m.full_name)return String(m.full_name).slice(0,80); const a=String(u.email||'Owner').split('@')[0].replace(/[._-]+/g,' ').trim(); return a?a[0].toUpperCase()+a.slice(1):'Owner' }
function clErr(e){ const m=String((e&&e.message)||e||''); if(/Invalid login/i.test(m))return 'Wrong email or password.'; if(/not confirmed/i.test(m))return 'Please confirm your email first: open the link we emailed you.'; if(/already registered/i.test(m))return 'This email already has an account. Sign in instead.'; if(/at least 6|password should/i.test(m))return 'The password needs at least 6 characters.'; if(/rate limit|too many/i.test(m))return 'Too many tries. Please wait a few minutes.'; if(/fetch|network/i.test(m))return 'Cannot reach the server. Check the internet.'; return m||'Something went wrong. Try again.' }
function clLic(s){ if(s.suspended)return 'This business is paused.'; if(!s.license_type)return 'This business has no licence yet.'; return (s.license_type==='trial'?'The free trial has ended.':'The licence has ended.') }

const CL_EYE='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const CL_BRAND='<div class="pvs-brand"><span class="pvlogo" role="img" aria-label="Proview logo"></span><span class="pvword">PROVIEW<i>TEAM</i></span></div>';
const CL_SPLASH='<div class="login pvs-root pvs-wait"><div class="pvs-splash" role="status" aria-label="Loading Proview Team"></div></div>';
const CL_ART='<div class="pvs-art">'+CL_BRAND+'<h2>Every shift, every payslip — one team.</h2><div class="pvs-mock" aria-hidden="true"><div class="hd"><b>This week · Front of house</b><span>4 on today</span></div><div class="rw"><b>09:00</b><em>Maya · Opening</em><span class="s">Clocked in</span></div><div class="rw"><b>12:00</b><em>Tom · Lunch</em><span class="r">On shift</span></div><div class="rw"><b>17:00</b><em>Priya · Evening</em><span class="r">Rota</span></div><div class="rw"><b>Fri</b><em>Sam · Holiday</em><span class="f">Time off</span></div></div><div class="sub">Rotas, clock-ins, time off, tasks and pay for your whole team, on any device.</div></div>';
// One page shell for every sign-in step: the dark panel only beside the email sign-in forms.
function clPage(body,split,wide){ return `<div class="login pvs-root"><div class="pvs-auth${split?'':' solo'}">${split?CL_ART:''}<div class="pvs-form"><form class="pvs-card${wide?' wide':''}" novalidate onsubmit="return false">${CL_BRAND}${body}</form></div></div></div>` }
function clShow(){ const r=$('#login-root'); if(!r)return; const m=CL.scr, em=esc(CL.email||'');
  if(m==='wait'){ r.innerHTML=CL_SPLASH; return }
  const msg=`<div>${CL.err?`<div class="notice bad">${esc(CL.err)}</div>`:''}${CL.note?`<div class="notice">${esc(CL.note)}</div>`:''}</div>`, dis=CL.busy?'disabled':'';
  const go=(act,t)=>`<button type="button" class="go" data-a="${act}" ${dis}>${t}</button>`, alt=(act,t,extra)=>`<button type="button" class="pv-sso" data-a="${act}" ${extra||''}>${t}</button>`, lnk=(act,t,extra)=>`<button type="button" data-a="${act}" ${extra||''}>${t}</button>`;
  const fEm=`<label class="af">Email<input id="clem" type="email" autocomplete="email" placeholder="you@company.com" value="${em}"></label>`;
  const fPw=(id,lab,ac,ph)=>`<label class="af">${lab}<div class="pw-wrap"><input id="${id}" type="password" autocomplete="${ac}" placeholder="${ph}"><button type="button" class="pw-eye" data-a="clEye" data-f="${id}" title="Show password" aria-label="Show password">${CL_EYE}</button></div></label>`;
  const portal=`<a class="go" href="${CL_PORTAL}" target="_blank" rel="noopener">Open the licence portal</a>`;
  const out=lnk('clOut','Sign out'), links=h=>`<div class="alinks">${h}</div>`;
  let b='', split=false, wide=false;
  if(m==='in'){ split=true; b=`<h1>Sign in</h1><p class="muted">Manage your rotas, timesheets and pay.</p>${msg}${fEm}${fPw('clpw','Password','current-password','••••••••')}${go('clIn','Sign in')}${CL.cfg.sso?`<div class="or-line">or</div>${alt('clSso','Sign in with Proview account')}`:''}${links(lnk('clScr','Create an account','data-s="up"')+lnk('clScr','Forgot password?','data-s="reset"'))}` }
  else if(m==='up'){ split=true; b=`<h1>Create your account</h1><p class="muted">Use the email address your manager put on your profile, or your own if you are setting up a new business. Choose a password of at least 6 characters.</p>${msg}${fEm}${fPw('clpw','Password','new-password','At least 6 characters')}${fPw('clpw2','Confirm password','new-password','Type it again')}${go('clUp','Create account')}${links(lnk('clScr','I already have an account','data-s="in"'))}` }
  else if(m==='reset'){ split=true; b=`<h1>Forgot password</h1><p class="muted">We will email you a link to choose a new one.</p>${msg}${fEm}${go('clReset','Send the link')}${links(lnk('clScr','Back to sign in','data-s="in"'))}` }
  else if(m==='newpw')b=`<h1>Choose a new password</h1><p class="muted">At least 6 characters.</p>${msg}${fPw('clpw','New password','new-password','At least 6 characters')}${go('clNewPw','Save and continue')}`;
  else if(m==='setup')b=`<h1>Set up your business</h1><p class="muted">Signed in as ${esc(CL.who.email)}. This login is not part of a business yet.</p><p class="muted">Staff: ask your manager to put this email on your profile, then press Check again.</p>${msg}<label class="af">Business name<input id="clbn" type="text" maxlength="80" placeholder="e.g. Bella Pizza" autocomplete="organization"></label>${go('clMake','Create my business')}${links(lnk('clAgain','Check again')+out)}`;
  else if(m==='empty')b=`<h1>No businesses yet</h1><p class="muted">Add the first one in the licence portal (New business).</p>${msg}${portal}${links(lnk('clAgain','Check again')+out)}`;
  else if(m==='pick'){ wide=true; const ss=(CL.who.sites||[]); b=`<h1>Which business?</h1><p class="muted">Signed in as ${esc(CL.who.email||'')}.</p>${msg}<div class="pvs-pick">${ss.map(s=>`<button type="button" data-a="clPick" data-id="${esc(s.id)}"><b>${esc(s.name)}</b><span>${esc(s.business&&s.business!==s.name?s.business+' · ':'')}${s.ok?esc(s.role||''):esc(clLic(s))}</span></button>`).join('')}</div>${links(out)}` }
  else if(m==='lock'){ const s=CL.locked; b=`<h1>${esc(s.name)}</h1><div class="notice bad">${esc(clLic(s))}</div><p class="muted">${s.suspended?'Call Proview on '+CL_PHONE+'.':'Buy or renew a licence in the licence portal, or call Proview on '+CL_PHONE+'.'}</p>${s.suspended?'':portal}${links(lnk('clAgain','Check again')+((CL.who.sites||[]).length>1?lnk('clScr','Another business','data-s="pick"'):'')+out)}` }
  else if(m==='fail')b=`<h1>Cannot connect</h1><p class="muted">${esc(CL.err||'Check the internet and try again.')}</p>${go('clReload','Try again').replace(' disabled','')}${CL.who?links(out):''}`;
  r.innerHTML=clPage(b,split,wide);
  const f=$('#clem')&&!$('#clem').value?$('#clem'):($('#clpw')||$('#clbn')||$('#clem')); if(f)setTimeout(()=>{ try{f.focus()}catch(e){} },50);
  r.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); const k={in:'clIn',up:'clUp',reset:'clReset',newpw:'clNewPw',setup:'clMake'}[CL.scr]; if(k)A[k]() } })) }
function clScreen(s,o){ CL.scr=s; CL.err=(o&&o.err)||''; CL.note=(o&&o.note)||''; CL.busy=false; clShow() }
function clVals(){ const e=$('#clem'), p=$('#clpw'); if(e)CL.email=e.value.trim().toLowerCase(); return {email:CL.email,pw:p?p.value:''} }
async function clTry(fn){ if(CL.busy)return; CL.busy=true; CL.err=''; try{ await fn() }catch(e){ CL.busy=false; CL.err=clErr(e); clShow() } }

A.clScr=d=>{ clVals(); clScreen(d.s) };
A.clEye=d=>{ const i=document.getElementById(d.f), b=document.querySelector('.pw-eye[data-f="'+d.f+'"]'); if(!i)return; const on=i.type==='password'; i.type=on?'text':'password'; if(b){ b.classList.toggle('on',on); b.title=on?'Hide password':'Show password'; b.setAttribute('aria-label',b.title) } };
A.clReload=()=>location.reload();
A.clIn=()=>clTry(async()=>{ const v=clVals(); if(!v.email||!v.pw)throw new Error('Enter your email and password.'); const r=await CL.sb.auth.signInWithPassword({email:v.email,password:v.pw}); if(r.error)throw r.error; await clAfter() });
A.clUp=()=>clTry(async()=>{ const v=clVals(); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email))throw new Error('Enter a valid email address.'); if(v.pw.length<6)throw new Error('The password needs at least 6 characters.'); const p2=$('#clpw2'); if(p2&&p2.value!==v.pw)throw new Error('The two passwords do not match.');
  const r=await CL.sb.auth.signUp({email:v.email,password:v.pw,options:{emailRedirectTo:location.origin+location.pathname}}); if(r.error)throw r.error;
  if(r.data&&r.data.session){ await clAfter(); return } clScreen('in',{note:'Almost there: open the link we just emailed you, then sign in here.'}) });
A.clReset=()=>clTry(async()=>{ const v=clVals(); if(!v.email)throw new Error('Enter your email.'); const r=await CL.sb.auth.resetPasswordForEmail(v.email,{redirectTo:location.origin+location.pathname}); if(r.error)throw r.error; clScreen('in',{note:'If that email has an account, a link is on its way.'}) });
A.clNewPw=()=>clTry(async()=>{ const p=($('#clpw')||{}).value||''; if(p.length<6)throw new Error('The password needs at least 6 characters.'); const r=await CL.sb.auth.updateUser({password:p}); if(r.error)throw r.error; await clAfter() });
A.clSso=()=>{ location.href='https://dashboard.proviewcrm.co.uk/?app=team&return='+encodeURIComponent(location.origin+location.pathname) };
A.clOut=async()=>{ try{ await CL.sb.auth.signOut() }catch(e){} clSet('pt-site',''); location.reload() };
A.clAgain=()=>clTry(clAfter);
A.clMake=()=>clTry(async()=>{ const n=(($('#clbn')||{}).value||'').trim(); if(n.length<2)throw new Error('Enter your business name.'); const r=await CL.sb.rpc('pt_create_my_business',{p_business:n}); if(r.error)throw r.error; clSet('pt-site',r.data); await clAfter() });
A.clPick=d=>{ const s=(CL.who.sites||[]).find(x=>x.id===d.id); if(s)clOpen(s) };
A.cloudSwitch=()=>{ clSS('pt-pick','1'); location.reload() };

async function clAfter(){ clScreen('wait');
  const s=(await CL.sb.auth.getSession()).data.session; if(!s){ clScreen('in'); return } CL.user=s.user;
  const r=await CL.sb.rpc('pt_whoami'); if(r.error||!r.data){ clScreen('fail',{err:'Could not load your account. Try again.'}); return }
  CL.who=r.data; const sites=r.data.sites||[];
  if(!sites.length){ clScreen(r.data.is_master?'empty':'setup'); return }
  const open=clSS('pt-open'), pick=clSS('pt-pick'); clSS('pt-pick','');
  let site=(open&&sites.find(x=>x.business_id===open))||sites.find(x=>x.id===clGet('pt-site'))||(sites.length===1?sites[0]:null);
  if(!site||(pick&&sites.length>1)){ clScreen('pick'); return }
  clOpen(site) }
function clOpen(s){ if(!s.ok&&!CL.who.is_master){ CL.locked=s; clScreen('lock'); return } clSet('pt-site',s.id); CL.site=s; const r=$('#login-root'); if(r)r.innerHTML=CL_SPLASH; if(CL.go){ const g=CL.go; CL.go=null; g(s) } }
// Something changed under us (signed out elsewhere, licence ended, removed from the business): start again cleanly.
function clKick(kind){ if(CL.kicked)return; CL.kicked=true; const fin=()=>setTimeout(()=>location.reload(),50);
  if(kind==='auth'){ CL.sb.auth.signOut().catch(()=>{}).then(fin); return } fin() }

// Resolves with the business to open, once someone is signed in and that business is licensed.
async function cloudGate(cfg){ CL.cfg=cfg; const rec=/[#&]type=recovery/.test(location.hash); clScreen('wait');
  try{ if(!window.supabase)await clLoad(CL_SDK) }catch(e){ clScreen('fail',{err:'Cannot reach the sign-in service. Check the internet.'}); return new Promise(()=>{}) }
  CL.sb=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true}});
  
  const gate=new Promise(res=>{ CL.go=res });
  try{
    const pv=location.hash.match(/[#&]pv_sso=([^&]+)/);
    if(pv){ history.replaceState(null,'',location.pathname+location.search);
      const r=await fetch(cfg.url+'/functions/v1/sso-login',{method:'POST',headers:{'content-type':'application/json',apikey:cfg.key},body:JSON.stringify({assertion:pv[1]})}); const j=await r.json().catch(()=>({}));
      if(!r.ok||!j.token_hash){ clScreen('in',{err:j.error||'Sign-in with your Proview account failed. Please try again.'}); return gate }
      clSS('pt-open',j.open||''); const cur=(await CL.sb.auth.getSession()).data.session; if(cur&&String(cur.user.email||'').toLowerCase()!==j.email)await CL.sb.auth.signOut();
      const v=await CL.sb.auth.verifyOtp({token_hash:j.token_hash,type:'magiclink'}); if(v.error){ clScreen('in',{err:clErr(v.error)}); return gate } }
    const s=(await CL.sb.auth.getSession()).data.session;
    if(rec&&s){ clScreen('newpw'); return gate }
    if(!s){ clScreen('in'); return gate }
    await clAfter()
  }catch(e){ clScreen('fail',{err:clErr(e)}) }
  return gate }

/* In cloud mode businesses live in the licence portal, not in this browser. */
(function(){ const add=A.addBiz, open=A.openBiz;
  A.addBiz=d=>{ if(!CL.site)return add(d); toast('Businesses are added in the licence portal.') };
  A.openBiz=d=>{ if(!CL.site)return open(d); if((CL.who.sites||[]).length>1)A.cloudSwitch() };
  AFTER.push(()=>{ if(!CL.site||!CL.who||(CL.who.sites||[]).length<2)return; const hd=document.querySelector('.pop[role=menu] .hd'); if(hd&&!document.getElementById('clsw'))hd.insertAdjacentHTML('afterend',`<button id="clsw" data-a="cloudSwitch">${ic('build')}Switch business</button>`) }) })();
