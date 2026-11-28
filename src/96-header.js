/* ===== Top-right header group, the same in every Proview app =====
   (HEADER_BAR_STANDARD.md; copied from Proview Bookings topMe() and Proview Signage web/hub.js PVHub.accountMenu)
   - "Dashboard" button: back to dashboard.proviewcrm.co.uk. Cloud mode, for the Proview master and Admins (as Signage).
   - Blue avatar with the person's initials: opens the account menu (Signed in as <email>, Account, ..., Sign out).
   - No separate red sign-out button (owner, 26 Nov 2026): Sign out is the last line of the avatar's account menu and is
     also in the side menu. It runs A.signout, the app's own sign-out (sends unsaved changes, ends the person's session and,
     for an email login, signs out of the account). */
const PVACCT_SVG={user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',moon:'<path d="M20 14A8 8 0 0110 4a8 8 0 1010 10z"/>',kiosk:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',build:'<path d="M4 21V5l8-2v18M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>'};
let pvAcct=null;
function pvCloseAccount(){ if(!pvAcct)return; pvAcct.el.remove(); pvAcct.btn.setAttribute('aria-expanded','false'); document.removeEventListener('mousedown',pvAcct.out,true); document.removeEventListener('keydown',pvAcct.key,true); removeEventListener('hashchange',pvCloseAccount); pvAcct=null }
function pvAccountMenu(btn,o){ if(pvAcct){ const was=pvAcct.btn; pvCloseAccount(); if(was===btn||was.isConnected===false&&btn.classList.contains('top-av'))return }
  const m=document.createElement('div'); m.className='pv-acct'; m.setAttribute('role','menu'); m.setAttribute('aria-label','My account');
  m.innerHTML=`<div class="pv-acct-h"><span class="hub-av">${esc(o.initials||'?')}</span><span class="ct"><b>${esc(o.name||'')}</b>${o.email?`<small>${esc(o.email)}</small>`:''}${o.sub?`<small>${esc(o.sub)}</small>`:''}</span></div>`;
  (o.items||[]).forEach(it=>{ if(it.sep){ const d=document.createElement('div'); d.className='pv-acct-sep'; m.appendChild(d) }
    const el=document.createElement(it.href?'a':'button'); el.className='pv-acct-i'; el.setAttribute('role','menuitem'); if(it.href)el.href=it.href; else el.type='button';
    el.innerHTML=`<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${PVACCT_SVG[it.icon]||''}</svg><span>${esc(it.label)}</span>`;
    el.addEventListener('click',e=>{ pvCloseAccount(); if(it.run){ e.preventDefault(); it.run() } }); m.appendChild(el) });
  document.body.appendChild(m); const r=btn.getBoundingClientRect(); m.style.top=Math.round(r.bottom+8)+'px'; m.style.right=Math.max(8,Math.round(innerWidth-r.right))+'px';
  const items=()=>[...m.querySelectorAll('.pv-acct-i')];
  pvAcct={el:m,btn,out:e=>{ if(!m.contains(e.target)&&!btn.contains(e.target)&&!(e.target.closest&&e.target.closest('.top-av')))pvCloseAccount() },
    key:e=>{ if(e.key==='Escape'){ e.stopPropagation(); pvCloseAccount(); (btn.isConnected?btn:document.querySelector('#top .top-av'))?.focus(); return }
      if(e.key==='ArrowDown'||e.key==='ArrowUp'){ e.preventDefault(); const l=items(), i=l.indexOf(document.activeElement); l[(i+(e.key==='ArrowDown'?1:-1)+l.length)%l.length]?.focus() } }};
  btn.setAttribute('aria-expanded','true'); document.addEventListener('mousedown',pvAcct.out,true); document.addEventListener('keydown',pvAcct.key,true); addEventListener('hashchange',pvCloseAccount);
  if(o.focusFirst)items()[0]?.focus() }
// CL lives in 97-cloud.js; read it safely in case a render runs before that file
const hdrCL=()=>{ try{ return CL.site&&CL.who?CL:null }catch(e){ return null } };
const hdrSync=()=>{ try{ return !!(SYNC.priv&&SYNC.on) }catch(e){ return false } };
// someone signed in (cloud email login, or a personal PIN login on the shared server), so there is something to sign out of
const hdrSignedIn=()=>!!hdrCL()||hdrSync();
const hdrCanDash=m=>{ const c=hdrCL(); return !!c&&!!(c.who.is_master||c.site.role==='Admin')&&isAdmin(m) };
function hdrRight(m){ const c=hdrCL(), sub=roleName(m.role)+(S.org&&S.org.name?' · '+S.org.name:'');
  let h=`<span class="hdr-br" aria-hidden="true"></span>`;
  if(hdrCanDash(m))h+=`<a class="pv-dash" href="https://dashboard.proviewcrm.co.uk/" title="Proview dashboard: all your Proview apps" aria-label="Proview dashboard"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg><span>Dashboard</span></a>`;
  h+=`<div class="top-me"><button type="button" class="top-av" data-a="acct" title="${esc(m.name+' · '+sub)}" aria-label="My account" aria-haspopup="menu" aria-expanded="${pvAcct&&pvAcct.el.isConnected?'true':'false'}">${esc(ini(m.name))}</button>`;
  return h+'</div>' }
// the avatar's account menu: what the old drop-down had, in the standard menu
A.acct=(d,el,e)=>{ if(e)e.stopPropagation(); const m=me(), c=hdrCL(), items=[];
  items.push({label:'Account',icon:'user',run:()=>A.profile()});
  items.push({label:'My time clock',icon:'clock',run:()=>go('clock')});
  if(isAdmin(m)||feat(m,'people'))items.push({label:'Users & access',icon:'users',run:()=>go('s-users')});
  if(c&&(c.who.sites||[]).length>1)items.push({label:'Switch business',icon:'build',run:()=>A.cloudSwitch()});
  items.push({label:isDark()?'Light mode':'Dark mode',icon:isDark()?'sun':'moon',run:()=>A.theme()});
  if(kioskMay())items.push({label:'Open kiosk',icon:'kiosk',run:()=>A.kiosk()});
  items.push({label:hdrSignedIn()?'Sign out':'Sign out / switch person',icon:'logout',run:()=>A.signout(),sep:true});
  const email=c?c.who.email:(m.email||'');
  pvAccountMenu(el,{initials:ini(m.name),name:m.name,email:email?(hdrSignedIn()?'Signed in as '+email:email):'',sub:roleName(m.role)+(S.org&&S.org.name?' · '+S.org.name:''),focusFirst:!!e&&e.detail===0,items}) };
