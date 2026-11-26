/* ===== engine: hours, overtime, leave, tasks, clocking ===== */
const otMode=()=>{ const m=S.tt&&S.tt.otMode; if(m==='off'||m==='rules')return m; return (S.tt&&S.tt.otOn===false)?'off':'policy' }; // 'off' | 'policy' (weekly above contract, or the person's overtime policy) | 'rules' (old: each schedule's rules)
const otPolOf=p=>(S.otPol||[]).find(x=>x.id===(p&&p.otp))||(S.otPol||[]).find(x=>x.def)||(S.otPol||[])[0]||{weekly:{mode:'contract',h:40,m:1.5},daily:{on:false,h:8,m:1.5},dbl:{on:false,h:12,m:2},eve:{on:false,from:'20:00',m:2},rest:{on:false,m:1.5},ph:{on:false,m:2}};
const otOn=()=>otMode()!=='off';
const OT_OFF={daily:{on:false,h:8,m:1},dbl:{on:false,h:12,m:1},weekly:{on:false,h:40,m:1},rest:{on:false,m:1},ph:{on:false,m:1}};
const defSched=()=>S.schedules.find(s=>s.isDef)||S.schedules[0];
const sched=p=>(p&&SC(p.sched))||defSched();
const unpaidBrk=sc=>sum((sc.brk||[]).filter(b=>!b.paid),b=>b.min||0);
function planned(p,d){ const sc=sched(p); if(!sc||p.noTrack)return null; const c=sc.days[dow(d)]; if(!c||!c.on)return null; if(!c.from)return {from:null,to:null,brk:0,flex:true}; const f=mins(c.from),e=mins(c.to); return {from:f,to:e<=f?e+1440:e,brk:(e-f>=360)?unpaidBrk(sc):0} }
function isRest(p,d){ const sc=sched(p); const c=sc&&sc.days[dow(d)]; return !(c&&c.on) }
function calOf(p){ return S.calendars.find(c=>c.members!=='all'&&(c.members||[]).includes(p.id))||S.calendars.find(c=>c.def)||S.calendars[0] }
function holName(d,p){ const c=calOf(p); const h=c&&c.dates.find(x=>x.d===d); return h?h.n:'' }
function leaveOn(pid,d,any){ return S.leave.find(l=>l.pid===pid&&(l.st==='approved'||(any&&l.st==='pending'))&&d>=l.from&&d<=l.to) }
function leaveDays(pid,from,to,half,polId){ const p=P(pid), pol=S.policies.find(x=>x.id===polId)||{}; let n=0; for(let d=from;d<=to;d=addD(d,1)){ if(pol.exclNon!==false&&isRest(p,d))continue; if(pol.exclHol&&holName(d,p))continue; n++ } if(half&&n>0)n=n-0.5; return n }
function holEarned(pid,polId,yr){ const p=P(pid), po=S.policies.find(x=>x.id===polId)||{}; const es=S.entries.filter(e=>e.pid===pid&&e.out!=null||e.pid===pid&&e.src==='hours').filter(e=>e.date.slice(0,4)===String(yr)); let mins=0; const days=new Set(); es.forEach(e=>{ const m=emin(e,p,false); mins+=m.worked||0; if(m.worked>0)days.add(e.date) });
  const worked=mins/60, earned=worked*(po.pct||12.07)/100, avg=days.size?worked/days.size:6; const takenD=leaveUsed(pid,polId,yr), takenH=takenD*avg; return {worked,earned,avg,takenD,takenH,leftH:earned-takenH,leftD:avg?(earned-takenH)/avg:0} }
function leaveUsed(pid,polId,yr){ return sum(S.leave.filter(l=>l.pid===pid&&l.pol===polId&&l.st==='approved'&&l.from.slice(0,4)===String(yr)),l=>leaveDays(l.pid,l.from,l.to,l.half,l.pol)) }
function contractMin(p){ if(p.contract!=null&&p.contract!=='')return (Number(p.contract)||0)*60; const sc=sched(p); if(!sc)return 0; if(sc.type==='weekly')return (sc.hours||0)*60; if(sc.type==='flexible')return sum(sc.days,d=>(d.on?(d.hrs||0):0))*60; return sum(sc.days,d=>{ if(!d.on||!d.from)return 0; const f=mins(d.from),e=mins(d.to); return Math.max(0,(e<=f?e+1440:e)-f-unpaidBrk(sc)) }) }
const rd=(m,mode,step)=>{ if(!mode||mode==='none'||!step)return m; if(mode==='up')return Math.ceil(m/step)*step; if(mode==='down')return Math.floor(m/step)*step; return Math.round(m/step)*step };
function nowFor(e){ const n=nowMin(); return e.date===today()?Math.max(n,e.in):e.in+480 }
function emin(e,p,pay){ // one entry -> minutes
  if(e.src==='hours')return {gross:e.mins||0,brk:0,worked:e.mins||0,inR:null,outR:null,open:false,late:0,hours:true};
  let o=e.out, open=false; if(o==null){o=nowFor(e);open=true}
  const sc=sched(p), pl=planned(p,e.date); let a=e.in, b=o, brk=(e.brk||0)+(e.bs!=null?Math.max(0,nowMin()-e.bs):0);
  const gross=b-a;
  if(pay){ const r=S.tt.round; a=rd(a,r.inMode,r.inStep); b=rd(b,r.outMode,r.outStep); const g=r.grace||0;
    if(pl&&pl.from!=null){ if(a>pl.from&&a-pl.from<=g)a=pl.from; if(b<pl.to&&pl.to-b<=g&&!open)b=pl.to; if(sc&&!(sc.pay&&sc.pay.early)&&a<pl.from)a=pl.from }
    if(brk===0&&sc&&sc.auto&&(b-a)>=360)brk=unpaidBrk(sc) }
  const late=(pl&&pl.from!=null)?Math.max(0,e.in-pl.from):0;
  return {gross,brk,worked:Math.max(0,b-a-brk),inR:a,outR:b,open,late}
}
const entFilter=(pid,d)=>S.entries.filter(e=>e.pid===pid&&e.date===d&&(U.loc==='all'||e.loc===U.loc));
function dayCalc(p,d,pay){ const es=entFilter(p.id,d); let worked=0,brk=0,open=false,late=0,first=null,last=null,fin=1e9; es.forEach(e=>{const m=emin(e,p,pay); worked+=m.worked; brk+=m.brk; if(m.open)open=true; if(!m.hours&&m.inR!=null&&m.inR<fin){ fin=m.inR; late=m.late } if(!m.hours){ if(first==null||m.inR<first)first=m.inR; if(last==null||m.outR>last)last=m.outR }}); return {worked,brk,n:es.length,open,late,es,first,last} }
function otFor(p,sc){ const m=otMode(); if(m==='off')return OT_OFF; if(m==='rules')return (sc&&sc.ot)||defOT(); const o=otPolOf(p), w=o.weekly||{}, h=Number(p.contract)||0; const weekly=w.mode==='contract'?{on:h>0,h,m:w.m||1.5}:w.mode==='hours'?{on:true,h:w.h||40,m:w.m||1.5}:{on:false,h:40,m:1.5}; return {daily:o.daily||OT_OFF.daily,dbl:o.dbl||OT_OFF.dbl,weekly,rest:o.rest||OT_OFF.rest,ph:o.ph||OT_OFF.ph,eve:o.eve||{on:false,from:'20:00',m:2}} }
function eveMin(r,from){ let t=0; (r.es||[]).forEach(e=>{ if(e.src==='hours')return; const a=e.in; let b=e.out==null?nowFor(e):e.out; if(b<a)b+=1440; t+=Math.max(0,b-Math.max(a,from)) }); return t }
function weekCalc(p,ws,pay){
  const sc=sched(p), ot=otFor(p,sc), rate=p.rate||0;
  const rows=weekDays(ws).map(d=>{ const dc=dayCalc(p,d,pay); return {date:d,...dc,rest:isRest(p,d),hol:holName(d,p),leave:leaveOn(p.id,d),reg:0,prem:0,cw:0} });
  let regTot=0, premMin=0, wcost=0, eveTot=0;
  rows.forEach(r=>{ const w=r.worked; if(w<=0)return; let rg=w,pm=0,cw=0;
    if(r.hol&&ot.ph.on){rg=0;pm=w;cw=w*ot.ph.m}
    else if(r.rest&&ot.rest.on){rg=0;pm=w;cw=w*ot.rest.m}
    else if(ot.daily.on||ot.dbl.on){ const th=ot.daily.on?ot.daily.h*60:Infinity; let t2=ot.dbl.on?ot.dbl.h*60:Infinity; if(ot.daily.on&&ot.dbl.on)t2=Math.max(t2,th); const a=ot.daily.on?Math.max(0,Math.min(w,t2)-th):0, b2=ot.dbl.on?Math.max(0,w-t2):0; rg=w-a-b2; pm=a+b2; cw=a*ot.daily.m+b2*ot.dbl.m }
    if(ot.eve&&ot.eve.on&&rg>0){ const ev=Math.min(rg,eveMin(r,mins(ot.eve.from||'20:00'))); if(ev>0){ rg-=ev; cw+=ev*ot.eve.m; r.eve=ev; eveTot+=ev } }
    r.reg=rg; r.prem=pm; r.cw=cw; regTot+=rg; premMin+=pm; wcost+=cw });
  if(ot.weekly.on){ const th=ot.weekly.h*60; if(regTot>th){ let left=regTot-th; for(let i=rows.length-1;i>=0&&left>0;i--){ const take=Math.min(rows[i].reg,left); if(take){ rows[i].reg-=take; rows[i].prem+=take; rows[i].cw+=take*ot.weekly.m; left-=take; premMin+=take; wcost+=take*ot.weekly.m; regTot-=take } } } }
  return {rows,eve:eveTot,worked:sum(rows,r=>r.worked),brk:sum(rows,r=>r.brk),reg:regTot,ot:premMin,cost:rate*((regTot+wcost)/60),n:sum(rows,r=>r.n),rate}
}
function rangeCalc(people,from,to,pay){ // totals for a date range across people
  const out={worked:0,brk:0,ot:0,cost:0,n:0,byDay:{},byPerson:{}};
  for(let d=from;d<=to;d=addD(d,1))out.byDay[d]=0;
  people.forEach(p=>{ const pp={worked:0,brk:0,ot:0,cost:0,n:0,days:0}; const seen={}; for(let ws=wkStart(from);ws<=to;ws=addD(ws,7)){ const w=weekCalc(p,ws,pay); w.rows.forEach(r=>{ if(r.date<from||r.date>to)return; pp.worked+=r.worked; pp.brk+=r.brk; pp.ot+=r.prem; pp.n+=r.n; if(r.worked>0)pp.days++; out.byDay[r.date]+=r.worked; pp.cost+=(p.rate||0)*((r.reg+r.cw)/60) }) } out.byPerson[p.id]=pp; out.worked+=pp.worked; out.brk+=pp.brk; out.ot+=pp.ot; out.cost+=pp.cost; out.n+=pp.n });
  return out }
function weekStatus(p,ws){ const es=S.entries.filter(e=>e.pid===p.id&&e.date>=ws&&e.date<=addD(ws,6)&&(U.loc==='all'||e.loc===U.loc)); if(!es.length)return 'none'; if(es.some(e=>e.st==='rejected'))return 'rejected'; if(es.every(e=>e.st==='approved'))return 'approved'; return 'pending' }
function whoState(p){ const e=S.entries.find(x=>x.pid===p.id&&x.out==null&&x.src!=='hours'); if(!e)return {st:'out'}; return {st:e.bs!=null?'break':'in',e} }
const stChip=s=>s==='in'?'<span class="chip st-in">IN</span>':s==='break'?'<span class="chip st-br">BREAK</span>':'<span class="chip st-out">OUT</span>';
function closeStale(){ let ch=false; S.entries.forEach(e=>{ if(e.out==null&&e.src!=='hours'&&e.date<today()){ const p=P(e.pid); const pl=p&&planned(p,e.date); e.out=(pl&&pl.to)?Math.max(pl.to,e.in+1):e.in+480; if(e.bs!=null){e.brk=(e.brk||0)+Math.max(0,e.out-e.bs);e.bs=null} e.note=(e.note?e.note+' · ':'')+'Auto clock-out (forgot to clock out)'; ch=true } }); if(ch)save() }

/* ----- clocking ----- */
const defaultLoc=p=>{ const l=myLocs(p); return U.loc!=='all'?U.loc:(l[0]&&l[0].id)||'' };
const actsFor=p=>S.activities.filter(a=>!a.archived&&(!a.assign||!a.assign.length||(p&&a.assign.includes(p.id))));
const defaultAct=p=>{ const al=actsFor(p); const ok=id=>al.some(a=>a.id===id); if(p.act&&ok(p.act))return p.act; const d=p.g==='g2'?'a2':'a1'; if(ok(d))return d; return al.length===1?al[0].id:'' };
function dist(a,b,c,d){ const R=6371000,t=x=>x*Math.PI/180; const dl=t(c-a),dn=t(d-b); const x=Math.sin(dl/2)**2+Math.cos(t(a))*Math.cos(t(c))*Math.sin(dn/2)**2; return 2*R*Math.asin(Math.sqrt(x)) }
function getPos(cb){ if(!navigator.geolocation){cb(null,'Location is not available on this device.');return} let done=false; const to=setTimeout(()=>{if(!done){done=true;cb(null,'Location did not answer in time.')}},8000); navigator.geolocation.getCurrentPosition(p=>{if(done)return;done=true;clearTimeout(to);cb({lat:p.coords.latitude,lng:p.coords.longitude})},()=>{if(done)return;done=true;clearTimeout(to);cb(null,'Location permission is switched off.')},{enableHighAccuracy:true,timeout:7000,maximumAge:30000}) }
function clockRules(p,kind,o){ // returns error text or ''
  if(!p.licensed)return 'This person has no licence, so they cannot clock in.';
  if(kind==='in'&&!canStart(p))return (p.id===(me()||{}).id?'You':p.name)+' cannot clock in until '+(isTrial(p)?'the welcome pack is confirmed':'all three documents are on file')+' (My documents). A manager can override this.';
  const via=o.src||'web'; if(via==='clock'&&!S.tt.dev.web)return 'Web clock-in is switched off in Time tracking.'; if(via==='kiosk'&&!S.tt.dev.kiosk)return 'The shared kiosk is switched off in Time tracking.';
  const tt=S.tt, n=nowMin(), pl=planned(p,today());
  if(tt.rs.on&&kind==='in'){ if(!pl||pl.from==null)return 'You have no shift today, and clocking in is limited to the schedule.'; if(n<pl.from-tt.rs.early)return 'Too early. You can clock in from '+fT(pl.from-tt.rs.early)+'.'; if(n>pl.to)return 'Your shift has ended, so clocking in is switched off.' }
  if(kind==='in'&&tt.ent.reqAct&&!o.act&&!defaultAct(p))return 'Choose an activity first.';
  return '' }
function doClock(pid,kind,o,done){ o=o||{}; const p=P(pid); const ws=whoState(p);
  const fail=m=>{toast(m);done&&done(false)};
  if(kind==='in'&&ws.st!=='out')return fail('Already clocked in.');
  if(kind!=='in'&&ws.st==='out')return fail('Not clocked in.');
  const er=clockRules(p,kind,o); if(er&&kind==='in')return fail(er);
  const fin=(pos)=>{ const nm=nowMin();
    if(kind==='in'){ const e={id:uid(),pid,date:today(),in:nm,out:null,brk:0,bs:null,act:o.act||defaultAct(p),proj:o.proj||'',loc:o.loc||defaultLoc(p),note:o.note||'',st:'pending',src:o.src||'clock',inAt:Date.now()}; if(S.tt.ent.reqAct&&!e.act)return fail('Choose an activity first.'); if(S.tt.ent.reqProj&&!e.proj)return fail('Choose a project first.'); if(pos){e.lat=pos.lat;e.lng=pos.lng} S.entries.push(e) }
    else if(kind==='out'){ const e=ws.e; if(e.bs!=null){e.brk=(e.brk||0)+Math.max(0,nm-e.bs);e.bs=null} e.out=nm<e.in?nm+1440:nm; if(o.note)e.note=o.note }
    else if(kind==='bstart'){ if(ws.st!=='in')return fail('Start a break while clocked in.'); ws.e.bs=nm }
    else if(kind==='bend'){ const e=ws.e; if(e.bs==null)return fail('No break running.'); e.brk=(e.brk||0)+Math.max(0,nm-e.bs); e.bs=null }
    save(); done&&done(true) };
  if(kind==='in'&&o.src!=='kiosk'&&(S.tt.loc.geo||S.tt.loc.req)){ getPos((pos,err)=>{ if(!pos){ if(S.tt.loc.req||S.tt.loc.geo)return fail(err+' Location is required to clock in.'); return fin(null) }
      if(S.tt.loc.geo){ const ls=myLocs(p).filter(l=>l.lat!=null&&(o.loc?l.id===o.loc:true)); if(ls.length){ const best=ls.map(l=>({l,d:dist(pos.lat,pos.lng,l.lat,l.lng)})).sort((a,b)=>a.d-b.d)[0]; if(best.d>best.l.radius)return fail('You are '+Math.round(best.d)+' m from '+best.l.name+'. Move within '+best.l.radius+' m to clock in.') } }
      fin(pos) }); return }
  fin(null) }

/* ----- tasks ----- */
function taskOccurs(t,d){ if(t.rep==='none')return t.date===d; if(d<t.date)return false; const w=dow(d); if(t.rep==='daily')return true; if(t.rep==='weekdays')return w<5; if(t.rep==='weekly')return dow(t.date)===w; if(t.rep==='days')return (t.days||[]).map(Number).includes(w); /* chosen days of the week (26 Nov 2026) */ return false }
function taskAssignees(t,d){ const a=t.asg||{}; if(a.mode==='person')return a.pid?[a.pid]:[]; const ids=uniq(S.shifts.filter(s=>s.date===d&&s.pid&&(!a.shift||a.shift==='any'||a.shift===s.start+'-'+s.end)).map(s=>s.pid)); if(a.mode==='shiftAll')return ids; if(!ids.length)return []; const load=id=>S.tasks.filter(x=>x.id!==t.id&&x.asg.mode==='person'&&x.asg.pid===id&&taskOccurs(x,d)).length; return [by(ids,id=>String(load(id)).padStart(3,'0')+id)[0]] }
const tasksOn=d=>S.tasks.filter(t=>taskOccurs(t,d)&&(U.loc==='all'||!t.loc||t.loc===U.loc));
function taskState(t,d){ const as=taskAssignees(t,d); const done=as.length?(t.asg.mode==='shiftAll'?as.every(id=>t.dn[d+'|'+id]):as.some(id=>t.dn[d+'|'+id])):!!t.dn[d+'|*']; if(done)return 'done'; return t.ip&&t.ip[d]?'prog':'todo' }
function taskDoneBy(t,d,pid){ return !!t.dn[d+'|'+pid] }
function taskCheck(t,d,pid){ const k=d+'|'+(pid||'*'); if(t.dn[k])delete t.dn[k]; else {t.dn[k]=Date.now(); if(t.ip)delete t.ip[d]} }
const myTasks=(pid,d)=>tasksOn(d).filter(t=>taskAssignees(t,d).includes(pid));

/* ----- inbox / onboarding ----- */
function inboxItems(){ const m=me(); const out=[];
  if(feat(m,'timeoff')&&isTop(m)||feat(m,'approvals')){ const ok=new Set(team({scope:'org'}).map(p=>p.id)); S.leave.filter(l=>l.st==='pending'&&(isAdmin(m)||ok.has(l.pid))).forEach(l=>out.push({t:'leave',id:l.id,ts:l.ts,l})) }
  S.payslips.filter(d=>d.pid===m.id&&Date.now()-d.ts<45*864e5).forEach(d=>out.push({t:'pay',id:d.id,ts:d.ts,d}));
  return out.sort((a,b)=>b.ts-a.ts) }
const ONB=[['sched','Create a work schedule','3 min','s-schedules','Set the working days, hours, breaks and overtime rules.'],['rules','Define rules for time tracking','5 min','s-tracking','Choose approvals, rounding and clock-in rules.'],['acts','Check roles','3 min','s-projects','Roles like bar or kitchen decide who can cover which shifts.'],['locs','List work locations','2 min','s-locations','Add your sites and the clock-in radius.'],['team','Invite your team','5 min','s-people','Add people and send sign-in invites.']];
const onbDone=()=>ONB.filter(s=>S.onb.done[s[0]]).length;

/* ----- export ----- */
async function exportCSV(name,rows,kind){
  const csv=rows.map(r=>r.map(c=>{c=c==null?'':String(c);return /[",\n\r]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(',')).join('\r\n');
  S.exports.unshift({id:uid(),name,kind:kind||'Report',ts:Date.now(),rows:Math.max(0,rows.length-1),csv:csv.length<200000?csv:''}); S.exports=S.exports.slice(0,20); save();
  await saveFile(name,csv,'text/csv');
}
/* Check the numbers first, then download. Totals per person are worked out from the rows themselves. */
function previewCSV(name,rows,kind){
  const nr=rows.length-1, head=rows[0]||[]; const hi=head.findIndex(h=>/^hours?\b/i.test(String(h))), si=head.findIndex(h=>/^status$/i.test(String(h))), oi=head.findIndex(h=>/^clock out$/i.test(String(h))), ii=head.findIndex(h=>/^clock in$/i.test(String(h)));
  const ni=Math.max(0,head.findIndex(h=>/^(member|person|name)$/i.test(String(h)))); let sum='', warn='';
  if(hi>=0&&nr>0){ const m={}, order=[]; let tot=0; rows.slice(1).forEach(r=>{ const k=String(r[ni]||''); const h=parseFloat(r[hi]); if(!(k in m)){ m[k]={h:0,n:0}; order.push(k) } if(!isNaN(h)){ m[k].h+=h; tot+=h } m[k].n++ });
    const hm=h=>fd(Math.round(h*60));
    sum=`<div class="card tw" style="margin-bottom:12px"><table class="t"><thead><tr><th>${esc(head[ni])}</th><th class="r">Lines</th><th class="r">Hours</th><th class="r">Decimal</th></tr></thead><tbody>${order.map(k=>`<tr><td><b>${esc(k)}</b></td><td class="r num">${m[k].n}</td><td class="r num">${hm(m[k].h)}</td><td class="r num">${m[k].h.toFixed(2)}</td></tr>`).join('')}</tbody><tfoot><tr><td>Total</td><td class="r num">${nr}</td><td class="r num">${hm(tot)}</td><td class="r num">${tot.toFixed(2)}</td></tr></tfoot></table></div>`;
    const pend=si>=0?rows.slice(1).filter(r=>r[si]==='pending').length:0, open=(oi>=0&&ii>=0)?rows.slice(1).filter(r=>r[ii]&&!r[oi]).length:0;
    if(pend)warn+=`<div class="alert warn" style="margin-bottom:8px"><span>${plural(pend,'line')} still waiting for approval.</span></div>`;
    if(open)warn+=`<div class="alert warn" style="margin-bottom:8px"><span>${plural(open,'line')} with no clock-out yet (still working), so those hours may change.</span></div>`; }
  const show=rows.slice(0,121);
  const tbl=`<details${sum?'':' open'}><summary style="cursor:pointer;margin:4px 0 8px"><b>${sum?'See every line':'Preview'}</b> (${plural(nr,'row')}${nr>120?', first 120 shown':''})</summary><div class="card tw" style="max-height:320px;overflow:auto"><table class="t"><thead><tr>${show[0].map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${show.slice(1).map(r=>`<tr>${r.map(c=>`<td>${esc(c==null?'':c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
  openPanel({title:'Check before you download',wide:true,saveLabel:'Download',body:`<p class="mut" style="margin-top:0">${esc(name)}. Check the totals first, so you only download once.</p>${warn}${sum}${tbl}`,save:()=>{ exportCSV(name,rows,kind); return true }}) }
async function saveFile(name,data,type){
  let ok=false;
  try{ const d=(window.claude&&claude.use)?await claude.use('downloads'):null; if(d){ await d.save({filename:name,data}); ok=true } }catch(e){ if(e&&(e.code==='declined'||/declin/i.test(String(e.message||e)))){toast('Download cancelled');return} }
  if(!ok){ try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:type||'text/plain'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{a.remove()},500); ok=true }catch(e){} }
  toast(ok?'Saved '+name:'Could not download. Use Reports, Exported files.'); }
