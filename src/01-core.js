'use strict';
/* ===== Proview Team: core (utils, icons, store, roles, shell, panels) ===== */
const KEY='proview-employee-v2'; let CUR=KEY;
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const pad=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const pd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addD=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return ds(d)};
const today=()=>ds(new Date());
const dow=s=>(pd(s).getDay()+6)%7; // Monday=0
const wkStart=s=>{const sun=(typeof S!=='undefined'&&S&&S.org&&S.org.weekStart==='sun');const d=dow(s);return addD(s,sun?-((d+1)%7):-d)};
const weekDays=ws=>[0,1,2,3,4,5,6].map(i=>addD(ws,i));
const dnm=s=>DN[dow(s)];
const monthStart=s=>s.slice(0,8)+'01';
const monthEnd=s=>{const d=pd(s);return ds(new Date(d.getFullYear(),d.getMonth()+1,0))};
const diffD=(a,b)=>Math.round((pd(b)-pd(a))/864e5);
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const DN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], DNL=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], MNL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const fdate=s=>{const d=pd(s);return DN[dow(s)]+' '+d.getDate()+' '+MN[d.getMonth()]};
const fdl=s=>{const d=pd(s);return DNL[dow(s)]+' '+d.getDate()+' '+MNL[d.getMonth()]+' '+d.getFullYear()};
const fdm=s=>{const d=pd(s);return d.getDate()+' '+MN[d.getMonth()]};
const fdy=s=>{const d=pd(s);return d.getDate()+' '+MN[d.getMonth()]+' '+d.getFullYear()};
const mins=h=>{if(h==null||h==='')return null;const [a,b]=String(h).split(':').map(Number);return a*60+(b||0)};
function fT(m){ if(m==null)return '–'; m=((Math.round(m)%1440)+1440)%1440; const h=Math.floor(m/60), mm=m%60; if(S&&S.org&&S.org.timeFmt==='12'){const hh=h%12||12;return hh+':'+pad(mm)+(h<12?' am':' pm')} return pad(h)+':'+pad(mm) }
const tIn=m=>m==null?'':pad(Math.floor(((m%1440)+1440)%1440/60))+':'+pad(((m%1440)+1440)%1440%60); // for <input type=time>
function fd(m,force){ m=Math.round(m||0); if((S&&S.org&&S.org.durFmt==='dec'&&force!=='hm')||force==='dec')return (m/60).toFixed(2)+'h'; const h=Math.floor(m/60), mm=m%60; return h+'h '+pad(mm)+'m' }
const fh1=h=>(Math.round((h||0)*10)/10).toString();
const fh=m=>(Math.round(m||0)/60).toFixed(2);
const money=v=>{const c=(S&&S.org&&S.org.currency)||'GBP';const sym={GBP:'£',EUR:'€',USD:'$',AUD:'A$',CAD:'C$',TRY:'₺',AED:'AED '}[c]||c+' ';if(payHidden())return sym+'•••';return sym+(Math.round((v||0)*100)/100).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})};
const ini=n=>String(n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
const AVC=['#3f5fd0','#12874a','#b5651d','#a35bd6','#c62a1f','#0e8a9e','#7a6a00','#d1457d'];
const avc=id=>AVC[[...String(id)].reduce((a,c)=>a+c.charCodeAt(0),0)%AVC.length];
const av=(p,cls='')=>p?`<span class="av ${cls}" style="background:${avc(p.id)}" aria-hidden="true">${esc(ini(p.name))}</span>`:'';
const plural=(n,a,b)=>n+' '+(n===1?a:(b||a+'s'));
const sum=(a,f)=>a.reduce((s,x)=>s+(f?f(x):x),0);
const by=(a,f)=>a.slice().sort((x,y)=>{const p=f(x),q=f(y);return p<q?-1:p>q?1:0});
const uniq=a=>[...new Set(a)];

/* ---------- icons ---------- */
const IC={
cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',check:'<path d="M5 12l5 5 9-10"/>',
tasks:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 010 7M18 14.5c2.2.6 3.5 2.5 3.5 5.5"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/>',
pin:'<path d="M12 21s7-6.2 7-11.5A7 7 0 005 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
doc:'<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
chart:'<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
chat:'<path d="M4 5h16v11H9l-5 4z"/>',bell:'<path d="M6 17V11a6 6 0 0112 0v6l2 2H4z"/><path d="M10 21h4"/>',
inbox:'<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',chl:'<path d="M15 5l-7 7 7 7"/>',chr:'<path d="M9 5l7 7-7 7"/>',chd:'<path d="M5 9l7 7 7-7"/>',chu:'<path d="M5 15l7-7 7 7"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
dl:'<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',ul:'<path d="M12 16V5M7 9l5-5 5 5M4 20h16"/>',
print:'<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>',
moon:'<path d="M20 14A8 8 0 0110 4a8 8 0 1010 10z"/>',
sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
out:'<path d="M9 4H4v16h5M16 8l4 4-4 4M20 12H9"/>',
build:'<path d="M4 21V5l8-2v18M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2"/>',
brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>',
layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
sliders:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
key:'<circle cx="8" cy="14" r="4"/><path d="M11 11l9-8M17 6l3 3M15 8l2 2"/>',flag:'<path d="M5 21V4M5 4h12l-2 4 2 4H5"/>',
coffee:'<path d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5z"/><path d="M17 9h2a2 2 0 010 5h-2M8 3v2M12 3v2"/>',
play:'<path d="M7 4l13 8-13 8z"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="2"/>',
edit:'<path d="M4 20l1-5L16 4l4 4L9 19z"/><path d="M14 6l4 4"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3"/>',
filter:'<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',kiosk:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
qr:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3zM17 20h4M20 17v3"/>',
send:'<path d="M4 12l16-8-6 16-3-7z"/>',refresh:'<path d="M20 11A8 8 0 006 7L4 9M4 4v5h5M4 13a8 8 0 0014 4l2-2M20 20v-5h-5"/>',
alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z"/>',
repeat:'<path d="M17 3l4 4-4 4M3 11V9a2 2 0 012-2h16M7 21l-4-4 4-4M21 13v2a2 2 0 01-2 2H3"/>',
more:'<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
grid:'<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
list:'<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r=".6"/><circle cx="3.5" cy="12" r=".6"/><circle cx="3.5" cy="18" r=".6"/>',
menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',coll:'<path d="M11 5l-7 7 7 7M20 5l-7 7 7 7"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',eyeoff:'<path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 5c6 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s4 7 10 7a10 10 0 0 0 4-.9"/>',
cup:'<path d="M5 4h14v4a7 7 0 01-14 0z"/><path d="M12 15v5M8 20h8"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',wand:'<path d="M4 20L16 8M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 12l.7 1.3L21 14l-1.3.7L19 16l-.7-1.3L17 14l1.3-.7z"/>',
star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'};
const ic=(n,c='')=>`<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[n]||''}</svg>`;

/* ---------- tiny form helpers ---------- */
const lab=(l,h,c='')=>`<label class="lab ${c}"><span>${l}</span>${h}</label>`;
const inp=(n,v='',a='')=>`<input name="${n}" value="${esc(v)}" ${a}>`;
const sel=(n,o,v,a='')=>`<select name="${n}" ${a}>${o.map(x=>{const [k,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(k)}"${String(k)===String(v)?' selected':''}>${esc(l)}</option>`}).join('')}</select>`;
const tgl=(n,on,t,s='',a='')=>`<div class="tg"><div class="tx"><b>${t}</b>${s?`<small>${s}</small>`:''}</div><label class="sw2"><input type="checkbox" ${n.includes('.')?'data-bind':'name'}="${n}" ${on?'checked':''} ${a} aria-label="${esc(t)}"><i></i></label></div>`;
const cks=(n,items,vals)=>`<div class="cks">${items.map(([v,l])=>`<label class="ck"><input type="checkbox" name="${n}[]" value="${esc(v)}" ${(vals||[]).map(String).includes(String(v))?'checked':''}>${esc(l)}</label>`).join('')}</div>`;
function formVals(root){const o={};$$('[name]',root).forEach(e=>{const n=e.name;if(n.endsWith('[]')){const k=n.slice(0,-2);o[k]=o[k]||[];if(e.checked)o[k].push(e.value)}else if(e.type==='checkbox')o[n]=e.checked;else if(e.type==='radio'){if(e.checked)o[n]=e.value}else if(e.type==='number')o[n]=e.value===''?null:Number(e.value);else o[n]=e.value});return o}
const getPath=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
function setPath(o,p,v){const ks=p.split('.');let a=o;ks.slice(0,-1).forEach(k=>{if(a[k]==null||typeof a[k]!=='object')a[k]={};a=a[k]});a[ks[ks.length-1]]=v}

/* ---------- store ---------- */
let S=null; const U={page:'dash',t:{},scope:'org',loc:'all',date:null,pop:null,mo:false,login:false,kiosk:false,q:{}};
let saveT=null, saveBad=false;
function save(now){ const go=()=>{try{localStorage.setItem(CUR,JSON.stringify(S));saveBad=false;U.savedAt=Date.now()}catch(e){saveBad=true}; if(typeof SYNC!=='undefined'&&SYNC.on)SYNC.mark(); const el=$('#sv'); if(el){el.className='sv'+(saveBad?' bad':'');el.textContent=saveBad?'Not saved':'Saved'}}; if(now){clearTimeout(saveT);go()}else{clearTimeout(saveT);saveT=setTimeout(go,120)} }
function load(){ try{const r=localStorage.getItem(CUR); if(r){S=JSON.parse(r)}}catch(e){} if(!S||!S.v){S=seed();save(true)} migrate(); }
const clampRad=r=>{ r=Math.round(Number(r)); if(!r)return 50; return Math.min(100,Math.max(20,r)) };
function migrate(){ S.ui=S.ui||{}; if(S.tt&&!S.tt.fc)S.tt.fc={cut:'00:00',flagH:16,ask:true}; if(!Array.isArray(S.tkPhotos))S.tkPhotos=[]; /* task photos are kept for 14 days */ { const cut=addD(today(),-14); if(S.tkPhotos.some(x=>x.d<cut))S.tkPhotos=S.tkPhotos.filter(x=>x.d>=cut) } if(!S.availCut)S.availCut={on:true,day:5,time:'00:00'}; if(S.rotaRules&&S.rotaRules.noEnd==null)S.rotaRules.noEnd=true; (S.locations||[]).forEach(l=>{l.radius=clampRad(l.radius)}); (S.activities||[]).forEach(a=>{if(!Array.isArray(a.assign))a.assign=[]});  S.tt=S.tt||{}; if(S.tt.otMode!=='off')S.tt.otMode=(S.tt.otOn===false)?'off':'policy'; if(!S.otPol||!S.otPol.length)S.otPol=[{id:'op1',name:'Standard',def:true,weekly:{mode:'contract',h:40,m:(S.tt.round&&S.tt.round.otMult)||1.5},daily:{on:false,h:8,m:1.5},dbl:{on:false,h:12,m:2},eve:{on:false,from:'20:00',m:2},rest:{on:false,m:1.5},ph:{on:false,m:2}}]; if(S.org&&/brags/i.test(S.org.name||''))S.people.forEach(p=>{ if(p.contract==null)p.contract=0 }); S.perms=S.perms||{}; if(S.org&&/brags/i.test(S.org.name||'')&&!S.tt.ownEdOff){ S.tt.ownEdOff=true; S.tt.ent=S.tt.ent||{}; S.tt.ent.editOwn=false; S.perms.memEditOwn=false } if(S.org&&/brags/i.test(S.org.name||'')&&!S.tt.ceylanSet){ S.tt.ceylanSet=true; const cy=S.people.find(p=>/^ceylan/i.test(p.name)); if(cy&&cy.earliest==null)cy.earliest=540 } S.payMap=S.payMap||[]; S.chat=S.chat||[]; S.avail=(S.avail||[]).filter(a=>a.date>=addD(today(),-30)); if(S.activities&&!S.activities.some(a=>/bar/i.test(a.name+' '+(a.code||'')))&&S.org&&/brags/i.test(S.org.name||'')){ const fl=S.activities.find(a=>a.id==='a1'); S.activities.push({id:'a5',code:'BAR',name:'Bar',bill:false,rate:0,archived:false,assign:fl&&fl.assign?fl.assign.slice():[]}) } if(S.org&&/brags/i.test(S.org.name||'')&&!S.polHrs){ S.polHrs=true; if(!S.policies.some(x=>x.accrual==='hours'))S.policies.push({id:'po5',name:'Holiday (hours worked)',paid:true,units:'hours',accrual:'hours',pct:12.07,ent:0,exclHol:false,exclNon:false,carry:0,color:'#0e8a9e',members:'all',archived:false}) } S.tkLib=S.tkLib||[]; S.notifs=S.notifs||[]; S.exports=S.exports||[]; S.onb=S.onb||{done:{},dismissed:false}; if(!S.people.find(p=>p.id===S.ui.me))S.ui.me=S.people[0].id; }
const me=()=>S.people.find(p=>p.id===S.ui.me)||S.people[0];
const P=id=>S.people.find(p=>p.id===id);
const G=id=>S.groups.find(g=>g.id===id);
const L=id=>S.locations.find(l=>l.id===id);
const SC=id=>S.schedules.find(s=>s.id===id);
const ACT=id=>S.activities.find(a=>a.id===id);
const PRJ=id=>S.projects.find(a=>a.id===id);
const CLI=id=>S.clients.find(a=>a.id===id);
function commit(){ save(); render(); }

/* ---------- roles and features ---------- */
// Standard Proview roles (20 Nov 2026): Admin, Manager, Staff. The business's first person keeps the stored key 'owner'
// (they set up the first PIN and can't be archived) but is an Admin everywhere on screen.
const ROLES=[['admin','Admin'],['manager','Manager'],['member','Staff']];
const roleName=r=>({owner:'Admin',admin:'Admin',manager:'Manager',member:'Staff'}[r]||r);
const FEATS=[['timesheets','Timesheets','Team timesheets, live locations, clock-ins'],['approvals','Approvals','Approve or reopen timesheets'],['rota','Rota','Shifts, cover needs, rota settings'],['tasks','Tasks','Tasks and templates'],['timeoff','Time off','Team leave requests'],['reports','Reports','Reports and exported files'],['payslips','Payslips & P45s','Upload and manage documents'],['people','People','Edit team profiles and send invites'],['ai','Proview AI','Ask questions about the data'],['settings','Settings pages','View settings pages']];
const MGR_DEF=['timesheets','approvals','rota','tasks','timeoff','reports','payslips','people','ai','settings'];
function feat(p,k){ if(!p)return false; if(p.role==='owner'||p.role==='admin')return true; if(p.feats&&p.feats[k]!==undefined)return !!p.feats[k]; return p.role==='manager'&&MGR_DEF.includes(k) }
const isAdmin=p=>p&&(p.role==='owner'||p.role==='admin');
const isMgr=p=>p&&(isAdmin(p)||p.role==='manager');
const isTop=p=>p&&p.role!=='member'; // sees admin-style menu
function managedBy(p){ if(!p)return []; const gs=S.groups.filter(g=>g.mgr===p.id).map(g=>g.id); return S.people.filter(x=>!x.archived&&(gs.includes(x.g)||x.id===p.id)) }
function myLocs(p){ return (!p.locs||p.locs==='all')?S.locations.filter(l=>!l.archived):S.locations.filter(l=>!l.archived&&p.locs.includes(l.id)) }
function team(opts){ // people the viewer may see
  const m=me(); let list=S.people.filter(p=>!p.archived&&!p.noTrack);
  if(!isAdmin(m)){ if(!S.perms.mgrViewAllTimesheets) list=list.filter(p=>managedBy(m).some(x=>x.id===p.id)); }
  const sc=(opts&&opts.scope)||U.scope;
  if(sc==='mine') list=list.filter(p=>managedBy(m).some(x=>x.id===p.id));
  if(sc==='me') list=list.filter(p=>p.id===m.id);
  if(U.loc!=='all') list=list.filter(p=>!p.locs||p.locs==='all'||p.locs.includes(U.loc));
  return list;
}
function canPage(k){ const m=me(); if(!m)return false;
  const ft={timesheets:'timesheets',rota:'rota',tasks:'tasks',live:'timesheets',timeoff:'timeoff',reports:'reports',ai:'ai','s-people':'people','s-users':'people','s-payslips':'payslips','s-tracking':'settings','s-schedules':'settings','s-holidays':'settings','s-locations':'settings','s-projects':'settings','s-company':'settings'}[k];
  if(['locations'].includes(k))return isAdmin(m)&&bizList().length>1;
  if(k==='resolve')return isTop(m)&&(feat(m,'timesheets')||feat(m,'rota')||feat(m,'timeoff')||isAdmin(m));
  if(['start'].includes(k))return isAdmin(m);
  if(k==='start')return isAdmin(m)&&!S.onb.dismissed;
  if(k==='s-company'||k==='s-tracking'||k==='s-schedules')return isAdmin(m)||(m.role==='manager'&&feat(m,'settings'));
  if(['dash'].includes(k))return isTop(m)||feat(m,'timesheets');
  if(k==='timeoff')return true;
  if(k==='mydocs')return !m.noTrack;
  if(k==='docs')return isTop(m)&&(isAdmin(m)||feat(m,'people'));
  if(ft)return feat(m,ft);
  return true;
}
const defaultPage=()=>isTop(me())?'dash':'home';

/* ---------- navigation model ---------- */
const NAV=[
 {k:'locations',l:'Locations',i:'build'},
 {g:'Work'},{k:'start',l:'Get started',i:'flag',b:()=>onbDone()+'/5'},{k:'dash',l:'Dashboard',i:'home'},{k:'resolve',l:'To resolve',i:'alert',b:()=>{ const n=resolveCount(); return n?String(n):'' }},{k:'timesheets',l:'Timesheets',i:'clock'},{k:'rota',l:'Rota',i:'cal'},{k:'tasks',l:'Tasks',i:'tasks'},
 {g:'Team'},{k:'timeoff',l:'Time off',i:'sun',b:()=>lvBadge()},{k:'s-people',l:'People',i:'users'},
 {g:'More'},{k:'ai',l:'Proview AI',i:'spark'},{k:'reports',l:'Reports',i:'chart'},{k:'s-company',l:'Settings',i:'gear'}];
/* related pages are merged into one menu entry with tabs across the top */
const HUBS=[
 {id:'people',label:'People',icon:'users',pages:[['s-people','People'],['s-users','Logins and access']]},
 {id:'docs',label:'Documents',icon:'doc',pages:[['docs','Documents'],['s-payslips','Payslips and P45s']]},
 {id:'mydocs',label:'My documents',icon:'doc',pages:[['mydocs','My documents'],['mypay','Payslips and P45s']]},
 {id:'settings',label:'Settings',icon:'gear',pages:[['s-company','Company'],['s-tracking','Time tracking'],['s-schedules','Schedules'],['s-holidays','Holidays'],['s-locations','Locations'],['s-projects','Roles']]}];
const hubOf=k=>HUBS.find(h=>h.pages.some(x=>x[0]===k));
function hubPages(h){ return h.pages.filter(x=>canPage(x[0])) }
function mergeHubs(items){ const out=[]; const seen=new Set(); items.forEach(n=>{ const h=hubOf(n.k); if(!h){ out.push(n); return } if(seen.has(h.id))return; seen.add(h.id); const pg=hubPages(h); if(!pg.length)return; out.push({k:pg[0][0],l:h.label,i:h.icon,hub:h.id}) }); return out }
const navOn=n=>{ if(n.hub){ const h=hubOf(U.page); return !!h&&h.id===n.hub } return U.page===n.k };
function hubBar(){ const h=hubOf(U.page); if(!h)return ''; const pg=hubPages(h); if(pg.length<2)return ''; return `<div class="tabs hubtabs" role="tablist">${pg.map(([k,l])=>`<button role="tab" aria-selected="${U.page===k}" class="${U.page===k?'on':''}" data-a="go" data-k="${k}">${esc(l)}</button>`).join('')}</div>` }
const NAVS=[{k:'home',l:'Home',i:'home'},{k:'clock',l:'Time clock',i:'clock'},{k:'mytasks',l:'Tasks',i:'tasks'},{k:'mysheet',l:'Timesheets',i:'doc'}];
const TITLES={resolve:'To resolve',locations:'Locations',start:'Get started',dash:'Dashboard',timesheets:'Timesheets',rota:'Rota',tasks:'Tasks',live:'Live locations',timeoff:'Time off',reports:'Reports',ai:'Proview AI','s-people':'People','s-users':'Users','s-payslips':'Payslips and P45s','s-tracking':'Time tracking','s-schedules':'Schedules','s-holidays':'Holidays','s-locations':'Locations','s-projects':'Roles','s-company':'Company',home:'Home',clock:'Time clock',mytasks:'Tasks',mysheet:'Timesheets',mypay:'Payslips and P45s',inbox:'Inbox',notifs:'Notifications'};
function menuFor(m){
  if(isTop(m)){ const out=[]; let grp=null; NAV.forEach(n=>{ if(n.g){grp={g:n.g,c:n.c,items:[]};out.push(grp)} else if(n.k!=='resolve'&&canPage(n.k)){ if(!grp){grp={g:'',items:[]};out.push(grp)} grp.items.push(n)} }); out.forEach(g=>g.items=mergeHubs(g.items)); return out.filter(g=>g.items.length) }
  const items=NAVS.slice(); const g=[{g:'',items}];
  const extra=[]; if(feat(m,'rota'))extra.push({k:'rota',l:'Rota',i:'cal'}); if(feat(m,'timesheets'))extra.push({k:'timesheets',l:'Team timesheets',i:'users'}); if(feat(m,'timeoff')||true)extra.push({k:'timeoff',l:'Time off',i:'sun',b:()=>lvBadge()}); if(feat(m,'ai'))extra.push({k:'ai',l:'Proview AI',i:'spark'}); if(feat(m,'reports'))extra.push({k:'reports',l:'Reports',i:'chart'});
  if(feat(m,'payslips')||S.payslips.some(d=>d.pid===m.id))extra.push({k:'mypay',l:'Payslips',i:'doc'});
  if(feat(m,'people'))extra.push({k:'s-people',l:'People',i:'users'});
  if(!m.noTrack)extra.unshift({k:'mydocs',l:'My documents',i:'doc'});
  const ex=mergeHubs(extra); if(ex.length)g.push({g:'More',items:ex}); return g; }

/* ---------- shell ---------- */
const V={}; const A={}; const I={}; const AFTER=[];
function go(k,sub){ U.page=k; U.mo=false; U.pop=null; if(sub)Object.assign(U.t,sub); closePanel(); const c=$('#main'); if(c)c.scrollTop=0; render(); }
function sideHtml(){ const m=me(); const menu=menuFor(m); const col=S.ui.col&&window.innerWidth>860;
  let h=`<div class="brand"><span class="pvlogo" role="img" aria-label="Proview Team"></span><div><span class="pvword">PROVIEW<i>TEAM</i></span><small class="sub">${esc(S.org.name)}</small></div></div>`;
  menu.forEach(g=>{ const open=!g.c||S.ui.setOpen!==false; if(g.g)h+=g.c?`<button class="ng" data-a="setTog" aria-expanded="${open}"><span>${g.g}</span>${ic(open?'chd':'chr')}</button>`:`<div class="ng"><span>${g.g}</span></div>`; if(open)g.items.forEach(n=>{h+=`<button class="nv ${navOn(n)?'on':''}" data-a="go" data-k="${n.k}" title="${esc(n.l)}" ${U.page===n.k?'aria-current="page"':''}>${ic(n.i)}<span class="lbl">${esc(n.l)}</span>${n.b&&n.b()?`<span class="bdg">${n.b()}</span>`:''}</button>`}) });
  /* phone: Search, Inbox and the pay eye live here, so the header is one row (owner, 26 Nov 2026) */
  { const m=me(), inb=inboxItems().length; h+=`<div class="ng ph-only"><span>Tools</span></div><button class="nv ph-only" data-a="search" title="Search">${ic('search')}<span class="lbl">Search</span></button><button class="nv ph-only ${U.page==='inbox'?'on':''}" data-a="go" data-k="inbox" title="Inbox">${ic('inbox')}<span class="lbl">Inbox</span>${inb?`<span class="bdg">${inb}</span>`:''}</button>`; if(canSecret(m)&&secOn())h+=`<button class="nv ph-only" data-a="secTog" title="${payHidden()?'Show pay and PINs':'Hide pay and PINs'}">${ic(payHidden()?'eye':'eyeoff')}<span class="lbl">${payHidden()?'Show pay and PINs':'Hide pay and PINs'}</span></button>` }
  h+=`<div class="sp"></div>`;
  h+=`<button class="nv nvb" data-a="whoIn" title="Who's in/out">${ic('users')}<span class="lbl">Who's in/out</span></button>`;
  if(typeof SYNC==='undefined'||!SYNC.priv||feat(me(),'timesheets'))h+=`<button class="nv nvb" data-a="kiosk" title="Open kiosk">${ic('kiosk')}<span class="lbl">Open kiosk</span></button>`;
  h+=`<div class="nvrow"><button class="nv nvb" data-a="navPos" title="Menu at the bottom" aria-label="Menu at the bottom">${ic('menu')}</button><button class="nv nvb" data-a="dense" title="Compact view: ${denseOn()?'on':'off'}" aria-label="Compact view">${ic('list')}</button><button class="nv nvb" data-a="theme" title="${isDark()?'Light mode':'Dark mode'}" aria-label="${isDark()?'Light mode':'Dark mode'}">${ic(isDark()?'sun':'moon')}</button><button class="nv nvb" data-a="signout" title="Sign out" aria-label="Sign out">${ic('out')}</button><button class="nv nvb colbtn" data-a="col" title="Collapse menu" aria-label="Collapse menu">${ic('coll')}</button></div>`; return h }
function topHtml(){ const m=me(); const unread=S.notifs.filter(n=>!n.read&&(!n.to||n.to===m.id)).length; const inb=inboxItems().length;
  let h=`<button class="ib mnu" data-a="menu" aria-label="Menu">${ic('menu')}</button><h1>${esc(TITLES[U.page]||'')}</h1>`;
  if(isTop(m)&&myLocs(m).length>1)h+=`<select id="locsel" data-i="loc" aria-label="Location">${[['all','All locations']].concat(myLocs(m).map(l=>[l.id,l.name])).map(([v,t])=>`<option value="${v}"${U.loc===v?' selected':''}>${esc(t)}</option>`).join('')}</select>`;
  h+=`<span class="sp"></span><span id="sv" class="sv${saveBad?' bad':''}">${saveBad?'Not saved':'Saved'}</span>`;
  if(canSecret(m)&&secOn())h+=`<button class="ib hd-x" data-a="secTog" title="${payHidden()?'Show pay and PINs':'Hide pay and PINs'}" aria-label="${payHidden()?'Show pay and PINs':'Hide pay and PINs'}">${ic(payHidden()?'eye':'eyeoff')}</button>`;
  h+=`<button class="ib hd-x" data-a="search" title="Search (Ctrl+K)" aria-label="Search">${ic('search')}</button>`;
  h+=`<button class="ib" data-a="chat" title="Team chat" aria-label="Team chat">${ic('chat')}</button>`;
  h+=`<button class="ib hd-x" data-a="go" data-k="inbox" title="Inbox" aria-label="Inbox">${ic('inbox')}${inb?`<span class="dot">${inb}</span>`:''}</button>`;
  h+=`<button class="ib" data-a="go" data-k="notifs" title="Notifications" aria-label="Notifications">${ic('bell')}${unread?`<span class="dot">${unread}</span>`:''}</button>`;
  return h+hdrRight(m) }
const navB=()=>{ try{return localStorage.getItem(KEY+'-nav')==='b'}catch(e){return false} };
const navBottom=()=>navB()&&window.innerWidth>860;
const denseOn=()=>{ try{return localStorage.getItem(KEY+'-dense')==='1'}catch(e){return false} };
function applyDense(){ document.documentElement.classList.toggle('dense',denseOn()) }
/* ----- hide pay and PINs until the eye is tapped (per device) ----- */
const SECKEY=KEY+'-secret'; let secT=null;
function secOn(){ try{ return localStorage.getItem(SECKEY)!=='0' }catch(e){ return true } }
function payHidden(){ try{ return secOn()&&!(U.secUntil>Date.now()) }catch(e){ return false } }
const canSecret=m=>isAdmin(m)||feat(m,'people');
function secVal(real,big){ if(real==null||real==='')return ''; if(!payHidden())return esc(real); return `<span class="secv"><b class="num sv2" data-real="${esc(real)}" data-mask="••••">••••</b> <button type="button" class="btn sm" data-a="secPeek">Show</button></span>` }
A.secPeek=(d,el)=>{ const v=el.parentNode.querySelector('.sv2'); if(!v)return; const on=v.textContent===v.dataset.mask; v.textContent=on?v.dataset.real:v.dataset.mask; el.textContent=on?'Hide':'Show'; clearTimeout(el._t); if(on)el._t=setTimeout(()=>{ if(v.isConnected){ v.textContent=v.dataset.mask; el.textContent='Show' } },10000) };
A.secTog=()=>{ clearTimeout(secT); if(payHidden()){ U.secUntil=Date.now()+60000; secT=setTimeout(()=>{ U.secUntil=0; try{ render() }catch(e){} },60000); toast('Pay and PINs shown for one minute') } else { U.secUntil=0; toast('Pay and PINs hidden') } render() };
A.secSet=()=>{ try{ localStorage.setItem(SECKEY,secOn()?'0':'1') }catch(e){} U.secUntil=0; render() };
A.secFld=(d,el)=>{ const b=$('#pnl-body'); if(!b)return; const pin=b.querySelector('[name=pin]'), rate=b.querySelector('[name=rate]'); const hide=pin&&pin.type!=='password'||rate&&rate.type!=='password'; if(pin)pin.type=hide?'password':'text'; if(rate)rate.type=hide?'password':'number'; el.textContent=hide?'Show PIN and pay':'Hide PIN and pay' };
A.dense=()=>{ try{localStorage.setItem(KEY+'-dense',denseOn()?'0':'1')}catch(e){} applyDense(); render() };
A.navPos=()=>{ try{localStorage.setItem(KEY+'-nav',navB()?'l':'b')}catch(e){} render(); toast(navB()?'Menu is at the bottom.':'Menu is on the left.') };
let _rzT, _rzW=window.innerWidth>=1100; window.addEventListener('resize',()=>{ const w=window.innerWidth>=1100; if(navB()||(w!==_rzW&&!PN)){ _rzW=w; clearTimeout(_rzT); _rzT=setTimeout(render,200) } });
function tabbarHtml(){ const m=me();
  if(navBottom()){ const flat=[]; menuFor(m).forEach(g=>g.items.forEach(n=>flat.push(n))); return flat.map(n=>`<button class="${navOn(n)?'on':''}" data-a="go" data-k="${n.k}" title="${esc(n.l)}">${ic(n.i)}${esc(n.l)}${n.b&&n.b()?`<span class="bdg2">${n.b()}</span>`:''}</button>`).join('')+`<button data-a="whoIn" title="Who's in/out">${ic('users')}Who's in</button><button data-a="navPos" title="Move the menu to the left">${ic('menu')}Menu left</button>` } const it=isTop(m)?[['dash','Home','home'],['timesheets','Timesheets','clock'],['rota','Rota','cal'],['tasks','Tasks','tasks']].filter(x=>canPage(x[0])):NAVS.map(n=>[n.k,n.l,n.i]);
  return it.map(([k,l,i])=>`<button class="${U.page===k?'on':''}" data-a="go" data-k="${k}">${ic(i)}${esc(l)}</button>`).join('')+`<button data-a="menu">${ic('menu')}Menu</button>` }
function isDark(){ const t=document.documentElement.getAttribute('data-theme'); return t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches) }
function render(){
  const app=$('#app'); if(!app)return;
  if(U.login){ renderLogin(); return }
  const lg=$('#login-root'); if(lg)lg.innerHTML='';
  const FREE=['inbox','notifs','mypay','home','clock','mytasks','mysheet'];
  if(!FREE.includes(U.page)&&!canPage(U.page))U.page=defaultPage();
  if(isTop(me())&&['home','clock','mytasks','mysheet'].includes(U.page)&&false)U.page='dash';
  app.className='app'+(S.ui.col?' col':'')+(U.mo?' mo':'')+(navBottom()?' navb':'');
  $('#side').innerHTML=sideHtml(); $('#top').innerHTML=topHtml(); $('#tbar').innerHTML=tabbarHtml();
  const c=$('#main'); const st=c.scrollTop; let html='';
  try{ html=(V[U.page]||V.dash)() }catch(e){ console.error(e); html=`<div class="card pad"><b>Something went wrong on this page.</b><p class="mut">${esc(e.message)}</p></div>` }
  c.innerHTML=hubBar()+html; c.scrollTop=st;
  const bd=$('#bdrop'); if(bd)bd.style.display=(U.mo&&window.innerWidth<=860)?'block':'none';
  AFTER.forEach(f=>f());
  if(!U.kiosk&&!U.login&&typeof kFlag==='function'&&kFlag()&&me())U.kiosk=true;
  if(U.kiosk)renderKiosk();
}
function renderLogin(){ if(typeof SYNC!=='undefined'&&SYNC.priv){ renderPrivLogin(); return } const r=$('#login-root'); r.innerHTML=`<div class="login"><div class="brand" style="color:var(--ink)"><span class="pvlogo" role="img" aria-label="Proview Team" style="width:44px;height:44px"></span><div><span class="pvword" style="color:var(--ink);font-size:17px;letter-spacing:.14em">PROVIEW<i>TEAM</i></span><small style="color:var(--mut);max-width:none">${esc(S.org.name)} · choose who is signed in</small></div></div><p class="mut" style="max-width:560px;text-align:center">There are no passwords in this browser version. Pick a person to see exactly what they see. Real sign-ins need the shared online version.</p><div class="lg2">${S.people.filter(p=>!p.archived).map(p=>`<button data-a="loginAs" data-id="${p.id}">${av(p)}<span class="who"><b>${esc(p.name)}</b><small>${roleName(p.role)}${p.id===S.people[0].id?' · owner':''}</small></span></button>`).join('')}</div><button class="btn" data-a="kiosk">${ic('kiosk')}Open kiosk instead</button></div>`; }
A.loginAs=(d)=>{ S.ui.me=d.id; U.login=false; U.loc='all'; U.scope='org'; U.page=defaultPage(); save(); render() };
A.signout=()=>{ if(typeof SYNC!=='undefined'&&SYNC.priv&&SYNC.on){ U.pop=null; syncSignOut(); return } U.login=true; U.pop=null; render() };
A.go=(d)=>go(d.k); A.menu=()=>{U.mo=!U.mo;render()}; A.col=()=>{S.ui.col=!S.ui.col;save();render()}; A.setTog=()=>{S.ui.setOpen=S.ui.setOpen===false;save();render()};

/* ----- theme colours (per device, like the Bookings app) ----- */
const CLR_DEF={main:'#3f5fd0',bg:'#f2f4f9'};
function getColors(){ try{ const c=JSON.parse(localStorage.getItem(KEY+'-colors')||'null'); if(c&&c.main)return {main:c.main,bg:c.bg||CLR_DEF.bg} }catch(e){} return {...CLR_DEF} }
function applyColors(){ const c=getColors(), r=document.documentElement.style; r.setProperty('--main',c.main); r.setProperty('--bgc',c.bg) }
function setColors(p){ const c={...getColors(),...p}; try{localStorage.setItem(KEY+'-colors',JSON.stringify(c))}catch(e){} applyColors() }
I.clrMain=el=>{ setColors({main:el.value}) }; I.clrBg=el=>{ setColors({bg:el.value}) };
A.clrSet=d=>{ setColors({main:d.c}); render() }; A.clrReset=()=>{ try{localStorage.removeItem(KEY+'-colors')}catch(e){} applyColors(); render(); toast('Colours reset') };
/* ----- settings boxes can be minimised ----- */
function enhSet(){ if(!/^s-/.test(U.page))return; const c=$('#main'); if(!c)return; const cards=[...c.querySelectorAll('.card.pad')].filter(x=>x.firstElementChild&&x.firstElementChild.tagName==='H2'); if(cards.length<2)return; S.ui.setc=S.ui.setc||{};
  cards.forEach(cd=>{ const h=cd.firstElementChild; const k=U.page+'|'+h.textContent.trim(); const cl=!!S.ui.setc[k]; h.classList.add('sh'); h.setAttribute('data-a','setc'); h.setAttribute('data-k',k); h.setAttribute('aria-expanded',String(!cl)); if(!h.querySelector('svg'))h.insertAdjacentHTML('beforeend',ic(cl?'chr':'chd')); cd.classList.toggle('cl',cl) });
  if(!c.querySelector('.setbar')){ const bar='<div class="setbar"><button class="btn sm" data-a="setall" data-v="1">Minimise all</button><button class="btn sm" data-a="setall" data-v="0">Expand all</button></div>'; const tb=[...c.children].filter(x=>x.classList.contains('tabs')); if(tb.length)tb[tb.length-1].insertAdjacentHTML('afterend',bar); else c.insertAdjacentHTML('afterbegin',bar) } }
AFTER.push(enhSet);
A.setc=d=>{ S.ui.setc=S.ui.setc||{}; S.ui.setc[d.k]=!S.ui.setc[d.k]; save(); render() };
A.setall=d=>{ S.ui.setc=S.ui.setc||{}; const c=$('#main'); [...c.querySelectorAll('.card.pad')].filter(x=>x.firstElementChild&&x.firstElementChild.tagName==='H2').forEach(cd=>{ const h=cd.firstElementChild; S.ui.setc[h.getAttribute('data-k')||(U.page+'|'+h.textContent.trim())]=d.v==='1' }); save(); render() };
A.theme=()=>{ const t=isDark()?'light':'dark'; document.documentElement.setAttribute('data-theme',t); try{localStorage.setItem(KEY+'-theme',t)}catch(e){} render() };

I.loc=(el)=>{ U.loc=el.value; render() };

/* ---------- panels, modals, toast ---------- */
let PN=null;
function openPanel(o){ PN=o; $('#pnl-root').innerHTML=`<div class="pbd" data-a="pbd"></div><aside class="pnl ${o.wide?'wide':''} ${o.small?'sm':''} ${o.multi?'multi':''}" role="dialog" aria-modal="true" aria-label="${esc(o.title)}"><div class="ph"><h2>${esc(o.title)}</h2><button class="ib" data-a="pclose" aria-label="Close">${ic('x')}</button></div><div class="pb" id="pnl-body" tabindex="0">${o.body}</div>${o.nofoot?'':`<div class="pf">${o.left||''}<span class="sp"></span><button class="btn" data-a="pclose">${o.cancel||'Cancel'}</button>${o.save&&o.again?`<button class="btn pf-again" data-a="psave" data-again="1">${o.againLabel||'<span class="ag-l">Save and add another</span><span class="ag-s">Save and next</span>'}</button>`:''}${o.save?`<button class="btn pri" data-a="psave">${o.saveLabel||'Save'}</button>`:''}</div>`}</aside>`; requestAnimationFrame(()=>{const b=$('.pbd'),p=$('.pnl'); b&&b.classList.add('on'); p&&p.classList.add('on'); const f=$('#pnl-body input:not([type=checkbox]):not([type=hidden]),#pnl-body select,#pnl-body textarea'); if(f&&!o.nofocus&&window.innerWidth>860)f.focus()}); const pbx=$('#pnl-body'); if(pbx&&!(document.activeElement&&pbx.contains(document.activeElement))&&(o.nofocus||window.innerWidth<=860||!pbx.querySelector('input:not([type=checkbox]):not([type=hidden]),select,textarea')))pbx.focus({preventScroll:true}); fixInputs(document); o.onOpen&&o.onOpen($('#pnl-body')); pnlFit(o) }
/* Big screens (owner, 26 Nov 2026):
   - a long form gets two columns by itself, so there is little or no scrolling (Edit person has its own three);
   - on Time off, forms open at the side with the calendar still in view, as booking details do in Proview Reservations. */
function pnlFit(o){ const e=$('#pnl-root .pnl'), bd=$('#pnl-root .pbd'); if(!e)return; const pb=e.querySelector('.pb');
  if(window.innerWidth>=1100&&U.page==='timeoff'&&!o.wide&&!o.multi){ e.classList.add('dock'); bd&&bd.classList.add('dock'); document.body.classList.add('has-dock'); return }
  if(window.innerWidth<760||o.small||o.multi||!pb||pb.children.length<4||pb.querySelector('table,.tw,.chat,.msgs,canvas,.cal,.map,.paper,iframe,textarea[rows]')||[...pb.querySelectorAll('textarea')].some(t=>t.offsetHeight>120))return;
  if(pb.scrollHeight>pb.clientHeight+80)e.classList.add('multi','auto') }
function closePanel(){ PN=null; const r=$('#pnl-root'); if(r)r.innerHTML=''; document.body.classList.remove('has-dock') }
A.pclose=()=>closePanel();
A.pbd=()=>{ if(PN&&PN.save)return; closePanel() }; /* tapping the dim area never throws away a half-filled form */
A.psave=d=>{ if(!PN||!PN.save)return; const body=$('#pnl-body'); const ag=d&&d.again&&PN.again; let r; try{ r=PN.save(formVals(body),body) }catch(e){ toast('Could not save: '+(e&&e.message||e)); return } if(r!==false){closePanel(); if(ag)ag()} };
function modal(html,big){ $('#mdl-root').innerHTML=`<div class="mdl" data-mdl="1"><div class="sheet ${big?'big':''}" role="dialog" aria-modal="true">${html}</div></div>`; const f=$('#mdl-root input:not([type=checkbox])'); if(f&&window.innerWidth>860)f.focus() }
function closeModal(){ $('#mdl-root').innerHTML='' }
A.mclose=()=>closeModal();
let askFn=null;
function ask(msg,okLabel,fn,danger,sub){ askFn=fn; modal(`<h2>${esc(msg)}</h2>${sub?`<p class="mut">${sub}</p>`:''}<div class="r"><button class="btn" data-a="mclose">Cancel</button><button class="btn ${danger?'bad':'pri'}" data-a="askok">${esc(okLabel||'OK')}</button></div>`) }
A.askok=()=>{ const f=askFn; askFn=null; closeModal(); f&&f() };
let toastT=null;
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('on'),2600) }

/* ---------- search palette (Ctrl+K) ---------- */
let srchSel=0;
A.search=()=>{ modal(`<div class="srch"></div>`); $('#mdl-root .mdl').classList.add('srch'); $('#mdl-root .sheet').innerHTML=`<input id="sq" placeholder="Search pages and people" aria-label="Search" autocomplete="off"><div class="res" id="sres"></div>`; const q=$('#sq'); q.focus(); srchRender(''); };
function srchItems(q){ q=q.toLowerCase().trim(); const m=me(); const pages=[]; menuFor(m).forEach(g=>g.items.forEach(n=>pages.push({t:'p',k:n.k,l:n.l,i:n.i}))); if(!pages.find(x=>x.k==='inbox'))pages.push({t:'p',k:'inbox',l:'Inbox',i:'inbox'},{t:'p',k:'notifs',l:'Notifications',i:'bell'});
  const ppl=(isTop(m)||feat(m,'people')?S.people.filter(p=>!p.archived):[m]).map(p=>({t:'u',id:p.id,l:p.name,s:roleName(p.role)+(p.email?' · '+p.email:'')}));
  const f=x=>!q||(x.l+' '+(x.s||'')).toLowerCase().includes(q); return {pages:pages.filter(f),ppl:ppl.filter(f).slice(0,8)} }
function srchRender(q){ const r=srchItems(q); srchSel=0; let n=0; const row=(x,html)=>`<button data-a="srchgo" data-n="${n}" class="${n++===0?'on':''}" data-t="${x.t}" data-k="${x.k||''}" data-id="${x.id||''}">${html}</button>`; let h=''; if(r.pages.length)h+=`<div class="ghd">Pages</div>`+r.pages.map(x=>row(x,`${ic(x.i)}<span>${esc(x.l)}</span>`)).join(''); if(r.ppl.length)h+=`<div class="ghd">People</div>`+r.ppl.map(x=>row(x,`${av(P(x.id),'sm')}<span>${esc(x.l)}<br><small>${esc(x.s)}</small></span>`)).join(''); $('#sres').innerHTML=h||'<div class="empty">Nothing found</div>' }
I.sq=(el)=>srchRender(el.value);
A.srchgo=(d)=>{ closeModal(); if(d.t==='p')go(d.k); else A.editPerson({id:d.id}) };
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();A.search();return}
  if($('#sq')&&document.activeElement&&document.activeElement.id==='sq'){ const b=$$('#sres button'); if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();srchSel=(srchSel+(e.key==='ArrowDown'?1:-1)+b.length)%b.length;b.forEach((x,i)=>x.classList.toggle('on',i===srchSel));b[srchSel]&&b[srchSel].scrollIntoView({block:'nearest'})} else if(e.key==='Enter'){e.preventDefault();b[srchSel]&&b[srchSel].click()} }
  if(e.key==='Enter'&&!e.shiftKey&&e.target&&e.target.dataset&&e.target.dataset.enter&&A[e.target.dataset.enter]){ e.preventDefault(); A[e.target.dataset.enter](e.target.dataset,e.target,e); return }
  if(e.key==='Escape'){ if($('#mdl-root .mdl'))closeModal(); else if(PN)closePanel(); else if(U.pop){U.pop=null;render()} else if(U.mo){U.mo=false;render()} }
});


/* ---------- keyboard types and keyboard scrolling ---------- */
function fixInputs(root){ (root||document).querySelectorAll('input:not([data-im]),textarea:not([data-im])').forEach(el=>{ el.dataset.im='1'; const ty=(el.getAttribute('type')||'text').toLowerCase(); const k=((el.name||'')+' '+(el.id||'')+' '+(el.dataset.bind||'')+' '+(el.getAttribute('placeholder')||'')).toLowerCase();
    if(el.tagName==='TEXTAREA'){ if(!el.hasAttribute('autocapitalize'))el.setAttribute('autocapitalize','sentences'); return }
    if(['checkbox','radio','file','hidden','date','time','range','color','button','submit','datetime-local','month'].includes(ty))return;
    if(ty==='number'){ if(!el.hasAttribute('inputmode')){ const dec=/\./.test(el.getAttribute('step')||'')||/rate|pay|price|amount|cost|factor|multi|hours|hrs|percent|pct|balance|allow/.test(k); el.setAttribute('inputmode',dec?'decimal':'numeric') } return }
    if(ty==='email'||/e-?mail/.test(k)){ el.setAttribute('inputmode','email'); el.setAttribute('autocapitalize','none'); el.setAttribute('autocorrect','off'); el.setAttribute('spellcheck','false'); return }
    if(ty==='tel'||/phone|mobile|\btel\b/.test(k)){ el.setAttribute('inputmode','tel'); el.setAttribute('autocomplete',el.getAttribute('autocomplete')||'tel'); return }
    if(ty==='url'||/link|url|https?:/.test(k)){ el.setAttribute('inputmode','url'); el.setAttribute('autocapitalize','none'); el.setAttribute('autocorrect','off'); return }
    if(/(^|[^a-z])pin([^a-z]|$)|passcode/.test(k)){ el.setAttribute('inputmode','numeric'); el.setAttribute('autocomplete','off'); return }
    if(ty==='search'){ el.setAttribute('enterkeyhint','search'); return }
    if(!el.hasAttribute('autocapitalize'))el.setAttribute('autocapitalize',/name|title|who/.test(k)?'words':'sentences') }) }
new MutationObserver(()=>{ if(fixInputs.t)return; fixInputs.t=requestAnimationFrame(()=>{ fixInputs.t=0; fixInputs(document) }) }).observe(document.documentElement,{childList:true,subtree:true});
(function(){ const vv=window.visualViewport; const set=()=>{ const r=document.documentElement.style; r.setProperty('--vvh',(vv?vv.height:innerHeight)+'px'); r.setProperty('--vvt',(vv?vv.offsetTop:0)+'px') }; set(); if(vv){ vv.addEventListener('resize',set); vv.addEventListener('scroll',set) } addEventListener('resize',set) })();
document.addEventListener('focusin',e=>{ const t=e.target; if(PN&&t&&t.closest&&t.closest('#pnl-body')&&/INPUT|TEXTAREA|SELECT/.test(t.tagName))setTimeout(()=>{ try{ t.scrollIntoView({block:'nearest',behavior:'smooth'}) }catch(_){} },250) });
document.addEventListener('keydown',e=>{ if(!PN)return; const pb=$('#pnl-body'); if(!pb)return; const t=e.target; const tag=t.tagName, ty=(t.type||'').toLowerCase(); const typing=(tag==='TEXTAREA')||(tag==='SELECT')||(tag==='INPUT'&&!['checkbox','radio','button','submit','file','range'].includes(ty));
  if(e.key==='PageDown'||e.key==='PageUp'){ pb.scrollBy({top:(e.key==='PageDown'?1:-1)*pb.clientHeight*.85}); e.preventDefault(); return }
  if(e.key==='Home'&&!typing&&e.target===pb){ pb.scrollTo({top:0}); e.preventDefault(); return } if(e.key==='End'&&!typing&&e.target===pb){ pb.scrollTo({top:pb.scrollHeight}); e.preventDefault(); return }
  if((e.key==='ArrowDown'||e.key==='ArrowUp')&&!typing){ pb.scrollBy({top:(e.key==='ArrowDown'?1:-1)*70}); e.preventDefault(); return }
  if(e.key==='Enter'&&PN.save&&tag==='INPUT'&&!['checkbox','radio','button','submit','file','date','time'].includes(ty)&&!t.dataset.enter){ e.preventDefault(); A.psave(PN.again?{again:1}:null) } });

/* ---------- global events ---------- */
document.addEventListener('click',e=>{
  const mdl=e.target.closest&&e.target.closest('[data-mdl]'); if(mdl&&e.target===mdl){closeModal();return}
  const t=e.target.closest('[data-a]');
  if(U.pop&&!e.target.closest('.rel')){U.pop=null;render()}
  if(!t)return; const f=A[t.dataset.a]; if(f){ if(t.tagName==='A'&&t.getAttribute('href')==null)e.preventDefault(); f(t.dataset,t,e) }
});
document.addEventListener('input',e=>{ const t=e.target; const k=t.dataset&&t.dataset.i; if(k&&I[k]&&t.type!=='checkbox'&&t.tagName!=='SELECT')I[k](t,e); if(t.id==='sq')I.sq(t); });
document.addEventListener('change',e=>{ const t=e.target; const k=t.dataset&&t.dataset.i; if(k&&I[k]&&(t.type==='checkbox'||t.type==='radio'||t.tagName==='SELECT'||t.type==='date'||t.type==='time'||t.type==='file'))I[k](t,e);
  if(t.dataset&&t.dataset.bind){ const v=t.type==='checkbox'?t.checked:(t.type==='number'?Number(t.value):t.value); setPath(S,t.dataset.bind,v); if(t.dataset.after&&I[t.dataset.after])I[t.dataset.after](t); save(); toast('Saved'); if(t.dataset.rr!=='0')render() } });
window.addEventListener('resize',()=>{ if(U.mo&&window.innerWidth>860){U.mo=false;render()} });

/* ---------- live clock tick ---------- */
function tick(){ const d=new Date(); $$('[data-live="clock"]').forEach(e=>{e.textContent=pad(d.getHours())+':'+pad(d.getMinutes())+(e.dataset.sec?':'+pad(d.getSeconds()):'')});
  $$('[data-live="date"]').forEach(e=>{e.textContent=fdl(today())});
  $$('[data-live="since"]').forEach(e=>{ const s=Number(e.dataset.since); const m=Math.max(0,Math.floor((Date.now()-s)/1000)); e.textContent=pad(Math.floor(m/3600))+':'+pad(Math.floor(m/60)%60)+':'+pad(m%60) });
  if(d.getSeconds()===0){ closeStale(); if(['dash','home','clock','live','timesheets'].includes(U.page)&&!PN&&!$('#mdl-root .mdl')&&!U.kiosk){ const a=document.activeElement; if(!a||!/INPUT|SELECT|TEXTAREA/.test(a.tagName))render() } if(U.kiosk&&!$('#kpin'))renderKiosk() } }
setInterval(tick,1000);
