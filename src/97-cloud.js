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

function clShow(){ const r=$('#login-root'); if(!r)return; const m=CL.scr, em=esc(CL.email||''); let b='';
  const msg=(CL.err?`<p class="plerr">${esc(CL.err)}</p>`:'')+(CL.note?`<p>${esc(CL.note)}</p>`:''), dis=CL.busy?'disabled':'';
  const out=`<button class="btn" data-a="clOut">Sign out</button>`;
  if(m==='wait')b=`<p class="mut">${esc(CL.note||'Loading...')}</p>`;
  else if(m==='in')b=`<div class="plbox"><h2>Sign in</h2><input id="clem" type="email" autocomplete="username" placeholder="Email" value="${em}"><input id="clpw" type="password" autocomplete="current-password" placeholder="Password">${msg}<button class="btn pri" data-a="clIn" ${dis}>Sign in</button>${CL.cfg.sso?`<button class="btn" data-a="clSso">Sign in with Proview account</button>`:''}<button class="btn" data-a="clScr" data-s="up">First time? Create your account</button><button class="btn" data-a="clScr" data-s="reset">Forgot password</button></div>`;
  else if(m==='up')b=`<div class="plbox"><h2>Create your account</h2><p>Use the email your manager put on your profile, or your own if you are setting up a new business.</p><input id="clem" type="email" autocomplete="username" placeholder="Email" value="${em}"><input id="clpw" type="password" autocomplete="new-password" placeholder="Choose a password (6 or more characters)">${msg}<button class="btn pri" data-a="clUp" ${dis}>Create account</button><button class="btn" data-a="clScr" data-s="in">Back to sign in</button></div>`;
  else if(m==='reset')b=`<div class="plbox"><h2>Forgot password</h2><p>We will email you a link to choose a new one.</p><input id="clem" type="email" autocomplete="username" placeholder="Email" value="${em}">${msg}<button class="btn pri" data-a="clReset" ${dis}>Send the link</button><button class="btn" data-a="clScr" data-s="in">Back to sign in</button></div>`;
  else if(m==='newpw')b=`<div class="plbox"><h2>Choose a new password</h2><input id="clpw" type="password" autocomplete="new-password" placeholder="New password (6 or more characters)">${msg}<button class="btn pri" data-a="clNewPw" ${dis}>Save and continue</button></div>`;
  else if(m==='setup')b=`<div class="plbox"><h2>Set up your business</h2><p>Signed in as ${esc(CL.who.email)}. This login is not part of a business yet.</p><p>Staff: ask your manager to put this email on your profile, then press Check again.</p><input id="clbn" type="text" maxlength="80" placeholder="Business name">${msg}<button class="btn pri" data-a="clMake" ${dis}>Create my business</button><button class="btn" data-a="clAgain">Check again</button>${out}</div>`;
  else if(m==='empty')b=`<div class="plbox"><h2>No businesses yet</h2><p>Add the first one in the licence portal (New business).</p><a class="btn pri" href="${CL_PORTAL}" target="_blank" rel="noopener">Open the licence portal</a><button class="btn" data-a="clAgain">Check again</button>${out}</div>`;
  else if(m==='pick'){ const ss=(CL.who.sites||[]); b=`<p class="mut" style="text-align:center;margin:0">Which business?</p><div class="lg2">${ss.map(s=>`<button data-a="clPick" data-id="${esc(s.id)}"><span class="who"><b>${esc(s.name)}</b><small>${esc(s.business&&s.business!==s.name?s.business+' · ':'')}${s.ok?esc(s.role||''):esc(clLic(s))}</small></span></button>`).join('')}</div>${out}` }
  else if(m==='lock'){ const s=CL.locked; b=`<div class="plbox"><h2>${esc(s.name)}</h2><p class="plerr">${esc(clLic(s))}</p><p>${s.suspended?'Call Proview on '+CL_PHONE+'.':'Buy or renew a licence in the licence portal, or call Proview on '+CL_PHONE+'.'}</p>${s.suspended?'':`<a class="btn pri" href="${CL_PORTAL}" target="_blank" rel="noopener">Open the licence portal</a>`}<button class="btn" data-a="clAgain">Check again</button>${(CL.who.sites||[]).length>1?`<button class="btn" data-a="clScr" data-s="pick">Another business</button>`:''}${out}</div>` }
  else if(m==='fail')b=`<div class="plbox"><h2>Cannot connect</h2><p>${esc(CL.err||'Check the internet and try again.')}</p><button class="btn pri" data-a="clReload">Try again</button>${CL.who?out:''}</div>`;
  r.innerHTML=`<div class="login"><div class="brand" style="color:var(--ink)"><span class="lg">${ic('clock')}</span><div>Proview Team<small style="color:var(--mut)">Staff app</small></div></div>${b}</div>`;
  const f=$('#clem')&&!$('#clem').value?$('#clem'):($('#clpw')||$('#clbn')||$('#clem')); if(f)setTimeout(()=>{ try{f.focus()}catch(e){} },50);
  r.querySelectorAll('input').forEach(i=>i.addEventListener('keydown',e=>{ if(e.key==='Enter'){ const k={in:'clIn',up:'clUp',reset:'clReset',newpw:'clNewPw',setup:'clMake'}[CL.scr]; if(k)A[k]() } })) }
function clScreen(s,o){ CL.scr=s; CL.err=(o&&o.err)||''; CL.note=(o&&o.note)||''; CL.busy=false; clShow() }
function clVals(){ const e=$('#clem'), p=$('#clpw'); if(e)CL.email=e.value.trim().toLowerCase(); return {email:CL.email,pw:p?p.value:''} }
async function clTry(fn){ if(CL.busy)return; CL.busy=true; CL.err=''; try{ await fn() }catch(e){ CL.busy=false; CL.err=clErr(e); clShow() } }

A.clScr=d=>{ clVals(); clScreen(d.s) };
A.clReload=()=>location.reload();
A.clIn=()=>clTry(async()=>{ const v=clVals(); if(!v.email||!v.pw)throw new Error('Enter your email and password.'); const r=await CL.sb.auth.signInWithPassword({email:v.email,password:v.pw}); if(r.error)throw r.error; await clAfter() });
A.clUp=()=>clTry(async()=>{ const v=clVals(); if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email))throw new Error('Enter a valid email address.'); if(v.pw.length<6)throw new Error('The password needs at least 6 characters.');
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
function clOpen(s){ if(!s.ok&&!CL.who.is_master){ CL.locked=s; clScreen('lock'); return } clSet('pt-site',s.id); CL.site=s; const r=$('#login-root'); if(r)r.innerHTML=''; if(CL.go){ const g=CL.go; CL.go=null; g(s) } }
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
