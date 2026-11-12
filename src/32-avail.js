/* ===== Roles, availability, cover and talking to the rota (owner request 10 Nov) =====
   S.avail = [{id,pid,date,kind:'can'|'cant',note,ts}]  what staff have told their manager
   p.act = main role (an activity), p.act2 = optional second role. Only people with the same role cover each other. */
const rolesOf=p=>uniq([defaultAct(p),p.act2].filter(Boolean));
const canDo=(p,act)=>!act||rolesOf(p).includes(act);
const roleLabel=p=>rolesOf(p).map(i=>(ACT(i)||{}).name).filter(Boolean).join(' + ');
const roleNm=id=>(ACT(id)||{}).name||'';
const avList=()=>S.avail||(S.avail=[]);
/* ----- deadline for staff to tell the manager about a week (set by the manager) ----- */
const avCut=()=>S.availCut||{on:true,day:5,time:'00:00'};
function avCutAt(d){ const c=avCut(); const w=addD(wkStart(d),-7+(Number(c.day)||0)); const m=mins(c.time||'00:00')||0; const dt=pd(w); return new Date(dt.getFullYear(),dt.getMonth(),dt.getDate(),0,m).getTime() }
function avLocked(d){ const c=avCut(); return !!c.on&&Date.now()>=avCutAt(d) }
const avCutTxt=d=>{ const t=avCutAt(d); const x=new Date(t); return DN[(x.getDay()+6)%7]+' '+x.getDate()+' '+MN[x.getMonth()]+' at '+pad(x.getHours())+':'+pad(x.getMinutes()) };
const avOn=(pid,d,kind)=>avList().find(a=>a.pid===pid&&a.date===d&&a.kind===kind&&a.st!=='declined');
const mgrRota=()=>{ const m=me(); return isAdmin(m)||(m.role==='manager'&&feat(m,'rota')) };
const shiftRole=s=>{ const p=s.pid&&P(s.pid); return p?defaultAct(p):(s.act||'') };
function coverFor(d,role,exceptPid){ // people who could take a shift on day d, same role only; people who said they can come first
  return S.people.filter(p=>!p.archived&&!p.noTrack&&p.licensed&&p.id!==exceptPid&&canDo(p,role)&&!S.shifts.some(s=>s.pid===p.id&&s.date===d)&&!leaveOn(p.id,d,true)&&!avOn(p.id,d,'cant'))
    .map(p=>({p,vol:!!avOn(p.id,d,'can'),off:!p.flex&&isRest(p,d)}))
    .sort((a,b)=>(b.vol-a.vol)||(a.off-b.off)||(a.p.name<b.p.name?-1:1)) }
const covTag=x=>x.vol?'said they can':x.off?'usually off':'free';

/* ----- understanding a sentence ----- */
const MON3=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const WDX=[['mon','monday'],['tue','tues','tuesday'],['wed','weds','wednesday'],['thu','thur','thurs','thursday'],['fri','friday'],['sat','saturday'],['sun','sunday']];
const avNorm=t=>' '+String(t||'').toLowerCase().replace(/[‘’]/g,"'").replace(/[,.!?;]/g,' ')+' ';
function avDates(txt){ const s=avNorm(txt), t=today(), out=[]; const add=d=>{ if(d&&d>=t&&!out.includes(d))out.push(d) };
  const mk=(day,mo)=>{ if(mo<0||mo>11||day<1||day>31)return null; let y=Number(t.slice(0,4)); let d=new Date(y,mo,day); if(d.getDate()!==day)return null; if(ds(d)<t)d=new Date(y+1,mo,day); return ds(d) };
  let m; const mr='(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*';
  const r1=new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?'+mr+'\\b','g'); while((m=r1.exec(s)))add(mk(+m[1],MON3.indexOf(m[2])));
  const r2=new RegExp('\\b'+mr+'\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b','g'); while((m=r2.exec(s)))add(mk(+m[2],MON3.indexOf(m[1])));
  const r3=/\b(\d{1,2})\/(\d{1,2})\b/g; while((m=r3.exec(s)))add(mk(+m[1],+m[2]-1));
  if(/\btoday\b/.test(s))add(t); if(/\btomorrow\b/.test(s))add(addD(t,1));
  const nextWk=/\bnext week\b/.test(s), base=wkStart(t);
  const wdRe=new RegExp('\\b(next\\s+|this\\s+|on\\s+|every\\s+)?('+WDX.map(a=>a.slice().reverse().join('|')).join('|')+')\\b','g');
  const one=(i,nx)=>{ let d=addD(base,i); if(nx||nextWk)d=addD(d,7); else if(d<t)d=addD(d,7); add(d) };
  while((m=wdRe.exec(s))){ const i=WDX.findIndex(a=>a.includes(m[2])); if(i>=0)one(i,/next/.test(m[1]||'')) }
  if(/\bweekend\b/.test(s)){ one(5,false); one(6,false) }
  return out.sort() }
function avWho(txt,m){ const s=avNorm(txt); const hit=S.people.filter(p=>!p.archived&&p.name.trim()).filter(p=>{ const f=p.name.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g,''); return f.length>1&&new RegExp('\\b'+f+"(?:'s)?\\b").test(s) });
  if(!hit.length&&/\b(i|i'm|im|i've|me|my)\b/.test(s))return [m]; return hit }
const NEGRE=/\b(can'?t|cant|cannot|can not|unable|not able|unavailable|not available|won'?t be able|wont be able|isn'?t able|not coming|off sick|sick|ill|not in)\b/;
const POSRE=/\b(can|could|able|available|happy to|willing|free|volunteer|up for)\b/;
const avIntent=t=>{ const s=avNorm(t); return NEGRE.test(s)?'cant':POSRE.test(s)?'can':'' };
function avTime(txt,fallback){ const s=avNorm(txt); let m=s.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/); if(m){ let h=+m[1]%12; if(m[3]==='pm')h+=12; return h*60+(+m[2]||0) }
  m=s.match(/\b(?:at|from|@|starting|start)\s+(\d{1,2})(?:[:.](\d{2}))?\b(?!\s*(?:st|nd|rd|th|\/|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/); if(m){ let h=+m[1]; if(h>=1&&h<=5)h+=12; if(h<24)return h*60+(+m[2]||0) } return fallback }

/* ----- saving what people say ----- */
function avApply(p,kind,dates,note,self,sw){ const L=avList();
  dates.forEach(d=>{ for(let i=L.length-1;i>=0;i--)if(L[i].pid===p.id&&L[i].date===d)L.splice(i,1); L.push({id:uid(),pid:p.id,date:d,kind,note:note||'',ts:Date.now(),st:(p.id===me().id&&!mgrRota())?'pending':'approved',sw:sw||undefined}) });
  if(self){ const g=G(p.g); const to=uniq([g&&g.mgr].filter(Boolean).concat(S.people.filter(x=>x.role==='owner'||x.role==='admin').map(x=>x.id))).filter(i=>i!==p.id);
    to.forEach(i=>notify(i,p.name+(kind==='can'?' can work ':' cannot work ')+dates.map(fdate).join(', ')+(note?' ('+note+')':''),'leave')) } }
function avSnap(){ const id=uid(); U.aiUndo={id,shifts:JSON.stringify(S.shifts),avail:JSON.stringify(avList())}; return id }
const undoBtn=id=>`<button class="btn sm" data-a="aiUndo" data-id="${id}">Undo</button>`;
A.aiUndo=d=>{ if(!U.aiUndo||U.aiUndo.id!==d.id){toast('Only the latest change can be undone.');return} S.shifts=JSON.parse(U.aiUndo.shifts); S.avail=JSON.parse(U.aiUndo.avail); U.aiUndo=null; commit(); toast('Undone') };
const shT=s=>shRng(s,' to ');
function giveBtns(s,d,exc){ const role=shiftRole(s); const c=coverFor(d,role,exc).slice(0,6);
  return (c.length?`<div class="row" style="flex-wrap:wrap;gap:6px;margin:6px 0">${c.map(x=>`<button class="btn sm ${x.vol?'pri':''}" data-a="aiGive" data-sid="${s.id}" data-pid="${x.p.id}">${esc(x.p.name.split(' ')[0])} · ${covTag(x)}</button>`).join('')}</div>`:`<p class="mut" style="margin:6px 0">Nobody${role?' with the '+esc(roleNm(role))+' role':''} is free that day.</p>`)+`<button class="btn sm pri" data-a="aiAlert" data-sid="${s.id}">Alert the team to cover</button> <button class="btn sm" data-a="aiOpen" data-sid="${s.id}">Leave it open</button>` }
A.aiGive=d=>{ const s=S.shifts.find(x=>x.id===d.sid), p=P(d.pid); if(!s||!p)return; s.pid=p.id; s.pub=false; s.note=''; if(p.id!==me().id)notify(p.id,'You have been given a shift on '+fdate(s.date)+' ('+shRng(s,' to ')+'). It shows on your rota once it is published.','leave'); commit(); toast(p.name.split(' ')[0]+' is on the draft rota. Publish to tell them.') };
const mgrIds=p=>{ const g=G(p.g); return uniq([g&&g.mgr].filter(Boolean).concat(S.people.filter(x=>!x.archived&&(x.role==='owner'||x.role==='admin')).map(x=>x.id))).filter(i=>i!==p.id) };
function startCover(s,reason){ // someone cannot attend: the shift becomes open and everyone with the same role who is free is alerted
  const p=P(s.pid); if(!p)return 0; const role=defaultAct(p), d=s.date, first=p.name.split(' ')[0];
  const an=avOn(p.id,d,'cant'); if(an)an.sid=s.id;
  s.cover={from:p.id,reason:reason||'',ts:Date.now(),open:true}; s.pid=null; if(role)s.act=role; s.note='Cover needed: '+first+' cannot attend';
  const c=coverFor(d,role,p.id); const txt='Cover needed on '+fdate(d)+' ('+shRng(s,' to ')+(role?', '+roleNm(role):'')+'). '+first+' cannot attend. Can you take it? Open Home and tap Take this shift.';
  c.forEach(x=>notify(x.p.id,txt,'cover'));
  mgrIds(p).forEach(i=>notify(i,p.name+' cannot attend '+fdate(d)+' ('+shRng(s,' to ')+')'+(reason?': '+reason:'')+'. '+(c.length?plural(c.length,'teammate')+' alerted to cover it.':'Nobody with the same role is free, so it is an open shift.'),'cover'));
  return c.length }
A.cantAttend=d=>{ const s=S.shifts.find(x=>x.id===d.sid), p=me(); if(!s||s.pid!==p.id)return;
  openPanel({title:'I cannot attend',saveLabel:'Alert the team',small:true,body:`<p style="margin:0 0 10px"><b>${fdl(s.date)}</b><br><span class="mut">${shRng(s,' to ')}${roleNm(defaultAct(p))?' · '+esc(roleNm(defaultAct(p))):''}</span></p>${lab('Reason (optional)',inp('reason','','placeholder="e.g. not feeling well"'))}<p class="mut" style="margin:0">Your manager and teammates with the same role are alerted straight away. The first person to take the shift gets it.</p>`,
    save:v=>{ const sh=S.shifts.find(x=>x.id===s.id); if(!sh||sh.pid!==p.id){toast('That shift has changed.');return false} const r=(v.reason||'').trim(); avApply(p,'cant',[sh.date],r,false); const n=startCover(sh,r); commit(); toast(n?plural(n,'teammate')+' alerted. Your manager has been told.':'Your manager has been told. Nobody with your role is free, so it is an open shift.') }}) };
A.coverTake=async d=>{ if(typeof SYNC!=='undefined'&&SYNC.on){ SYNC.busy=false; await syncPoll() } const s=S.shifts.find(x=>x.id===d.sid), p=me(); if(!s||s.pid||!s.cover||!s.cover.open){toast('Someone has already taken this shift.');return}
  if(!canDo(p,s.act)){toast('This shift is for another role.');return} if(S.shifts.some(x=>x.pid===p.id&&x.date===s.date)){toast('You already have a shift that day.');return} if(leaveOn(p.id,s.date,true)){toast('You have time off that day.');return}
  s.pid=p.id; s.cover.open=false; s.cover.by=p.id; s.note=''; const from=P(s.cover.from); const first=p.name.split(' ')[0];
  if(from)notify(from.id,first+' is covering your shift on '+fdate(s.date)+'.','cover'); mgrIds(p).forEach(i=>notify(i,first+' is covering '+(from?from.name.split(' ')[0]+"'s":'the')+' shift on '+fdate(s.date)+' ('+shRng(s,' to ')+').','cover'));
  const live=typeof SYNC!=='undefined'&&SYNC.on; if(live)SYNC.cond=[{k:'shifts',id:s.id,f:'pid',v:null}];
  commit(); if(live){ save(true); clearTimeout(SYNC.t); let n=0; while(SYNC.busy&&n++<30)await new Promise(r=>setTimeout(r,100)); const res=await syncPush(); if(res==='conflict'){ toast('Someone else has just taken this shift.'); return } }
  toast('It is yours. Thank you!') };
A.aiAlert=d=>{ const s=S.shifts.find(x=>x.id===d.sid); if(!s||!s.pid)return; const n=startCover(s,''); commit(); toast(n?plural(n,'teammate')+' alerted to cover it.':'Nobody with the same role is free. It is an open shift.') };
A.aiOpen=d=>{ const s=S.shifts.find(x=>x.id===d.sid); if(!s)return; s.act=s.act||shiftRole(s); s.pid=null; s.pub=false; s.note='Needs cover'; commit(); toast('Now an open shift') };
A.aiTake=A.aiGive;
A.aiRota=()=>{ U.t.rw=addD(wkStart(today()),7); go('rota'); setTimeout(()=>A.rotaAuto(),250) };
A.aiOpenRota=d=>{ if(d.d)U.t.rw=wkStart(d.d); go('rota') };

/* ----- the assistant understands rota sentences ----- */
function aiAct(q){ const m=me(), s=avNorm(q); const names=avWho(q,m); const dates=avDates(q); const others=names.some(p=>p.id!==m.id);
  const need=()=>others&&!mgrRota()?'Only a manager can change other people\'s rota or availability.':'';
  const ask='Which day? For example: <i>Kamilla can work Sunday</i>.';
  // make a rota
  if(/\b(make|create|generate|build|prepare|draft|do)\b.*\brota\b/.test(s)&&!names.length){ if(!mgrRota())return 'Only a manager can make the rota.'; return `I can build next week's draft from everyone's usual week, time off and what the team has told you.<p style="margin:8px 0 0"><button class="btn pri sm" data-a="aiRota">Make next week's rota</button></p>` }
  // who can cover
  if(/\bwho (can|could|would|might|is (available|free|able))\b/.test(s)||(/\bwho has\b/.test(s)&&dates.length)||/\bcover(ing)? (for )?\w+/.test(s)&&/\bwho\b/.test(s)){
    if(!dates.length)return 'Which day should I look at? For example: <i>Who can cover Sunday?</i>';
    let h=''; dates.slice(0,3).forEach(d=>{ let role='', exc='', head=fdl(d); const subj=names.find(p=>p.id!==m.id)||null;
      if(subj){ const sh=S.shifts.find(x=>x.pid===subj.id&&x.date===d); role=sh?shiftRole(sh):defaultAct(subj); exc=subj.id; head='Cover for '+subj.name.split(' ')[0]+' on '+fdate(d)+(role?' ('+roleNm(role)+')':'') } else head='Free on '+fdate(d);
      const c=coverFor(d,role,exc); h+=`<b>${esc(head)}</b>`+(c.length?aiTbl(['Who','Role','Status'],c.slice(0,10).map(x=>[esc(x.p.name),esc(roleLabel(x.p)),covTag(x)])).replace(/ class="r num"/g,''):'<p class="mut" style="margin:6px 0">Nobody is free that day'+(role?' with that role':'')+'.</p>') });
    return h }
  // cannot work
  if(NEGRE.test(s)&&names.length){ if(!dates.length)return ask; const bad=need(); if(bad)return bad; const p=names[0]; const id=avSnap(); avApply(p,'cant',dates,'',p.id===m.id&&!mgrRota()); save();
    let h=`<b>Noted: ${esc(p.name.split(' ')[0])} cannot work ${dates.map(fdate).join(', ')}.</b> ${undoBtn(id)}`;
    dates.forEach(d=>{ const sh=S.shifts.filter(x=>x.pid===p.id&&x.date===d); sh.forEach(x=>{ h+=`<p style="margin:10px 0 0">${esc(p.name.split(' ')[0])} is on the rota on ${fdate(d)} (${shT(x)}). Who could cover${shiftRole(x)?' ('+esc(roleNm(shiftRole(x)))+')':''}:</p>`+giveBtns(x,d,p.id) }); if(!sh.length)h+=`<p class="mut" style="margin:6px 0 0">She is not on the rota on ${fdate(d)}, so nothing needs changing.</p>` });
    return h.replace(/She is not/g,esc(p.name.split(' ')[0])+' is not') }
  // remove a shift
  if(/\b(remove|delete|cancel|unschedule|drop|take)\b/.test(s)&&/\b(off|from|shift|rota)\b/.test(s)&&names.length&&dates.length){ if(!mgrRota())return 'Only a manager can change the rota.'; const p=names[0]; const id=avSnap(); let n=0; dates.forEach(d=>{ const k=S.shifts.length; S.shifts=S.shifts.filter(x=>!(x.pid===p.id&&x.date===d)); n+=k-S.shifts.length }); save();
    return n?`<b>Removed ${esc(p.name.split(' ')[0])} from ${plural(n,'shift')}</b> (${dates.map(fdate).join(', ')}). ${undoBtn(id)}`:`${esc(p.name.split(' ')[0])} has no shift on ${dates.map(fdate).join(', ')}.` }
  // put someone on a shift
  if(/\b(put|add|schedule|book|roster|assign|give)\b/.test(s)&&names.length&&dates.length&&!POSRE.test(s.replace(/\bcan you\b/,''))){ if(!mgrRota())return 'Only a manager can change the rota.'; const p=names[0]; const id=avSnap(); const done=[], skip=[];
    dates.forEach(d=>{ if(S.shifts.some(x=>x.pid===p.id&&x.date===d)){skip.push(fdate(d)+' (already on)');return} if(leaveOn(p.id,d,true)){skip.push(fdate(d)+' (time off)');return} if(avOn(p.id,d,'cant')){skip.push(fdate(d)+' (said they cannot)');return}
      const u=usualFor(p,d); const a=avTime(q,u?u.f:540); const open=S.shifts.find(x=>!x.pid&&x.date===d&&canDo(p,x.act)); 
      if(open&&avTime(q,-1)<0){ open.pid=p.id; open.pub=false; open.note=''; done.push(fdate(d)+' ('+shRng(open,' to ')+')') }
      else { S.shifts.push({id:uid(),pid:p.id,date:d,start:a,end:(a<1020)?1020:(a+480)%1440,ne:S.rotaRules.noEnd!==false,brk:0,act:defaultAct(p),loc:(myLocs(p)[0]||S.locations[0]||{}).id,note:'',pub:false}); done.push(fdate(d)+' from '+fT(a)) } });
    save(); return (done.length?`<b>${esc(p.name.split(' ')[0])} added on the draft rota:</b> ${esc(done.join(', '))}. ${undoBtn(id)}<p class="mut" style="margin:6px 0 0">Publish the rota when you are happy.</p>`:'')+(skip.length?`<p style="margin:6px 0 0">Skipped: ${esc(skip.join(', '))}.</p>`:'') }
  // can work
  if(POSRE.test(s)&&names.length&&dates.length&&!/\bwho\b/.test(s)){ const bad=need(); if(bad)return bad; const p=names[0]; const id=avSnap(); avApply(p,'can',dates,'',p.id===m.id&&!mgrRota()); save();
    let h=`<b>Noted: ${esc(p.name.split(' ')[0])} can work ${dates.map(fdate).join(', ')}.</b> ${undoBtn(id)}`;
    dates.forEach(d=>{ const mine=S.shifts.find(x=>x.pid===p.id&&x.date===d); if(mine){ h+=`<p class="mut" style="margin:8px 0 0">${esc(p.name.split(' ')[0])} is already on the rota on ${fdate(d)}.</p>`; return }
      const opens=S.shifts.filter(x=>!x.pid&&x.date===d&&canDo(p,x.act)); if(opens.length)h+=`<p style="margin:8px 0 0">There ${opens.length>1?'are open shifts':'is an open shift'} on ${fdate(d)}:</p><div class="row" style="flex-wrap:wrap;gap:6px;margin:6px 0">${opens.map(x=>`<button class="btn sm pri" data-a="aiTake" data-sid="${x.id}" data-pid="${p.id}">Put ${esc(p.name.split(' ')[0])} on (${shRng(x,' to ')})</button>`).join('')}</div>`; else h+=`<p class="mut" style="margin:8px 0 0">I will offer ${esc(p.name.split(' ')[0])} first when a ${esc(roleNm(defaultAct(p))||'')} gap needs filling on ${fdate(d)}.</p>` });
    return h }
  if(NEGRE.test(s)&&names.length&&!dates.length)return ask;
  return null }

/* ----- notes from the team (rota page, time off page) ----- */
function avCard(from,to,title,only){ const ids=new Set(only?[only]:lvPeople().map(p=>p.id)); const l=avList().filter(a=>ids.has(a.pid)&&a.date>=(from||today())&&(!to||a.date<=to)).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  if(!l.length)return ''; return `<div class="card" style="margin-bottom:14px"><div class="hd"><h2>${title||'What the team told you'}</h2></div>${l.map(a=>{ const p=P(a.pid)||{name:'?'}; const can=a.kind==='can'; return `<div class="nowc"><div class="who" style="flex:1">${av(p,'sm')}<div><b>${esc(p.name)}</b><small>${fdate(a.date)}${a.note?' · '+esc(a.note):''}</small></div></div><span class="chip ${can?'green':'red'}">${can?'Can work':'Cannot work'}</span>${a.st==='pending'?'<span class="chip amber">'+(mgrRota()?'Needs your answer':'Waiting for manager')+'</span>':a.st==='approved'&&a.by?'<span class="chip green">Approved</span>':a.st==='declined'?'<span class="chip">Declined</span>':''}${can&&mgrRota()?(()=>{ const o=S.shifts.find(x=>!x.pid&&x.date===a.date&&canDo(P(a.pid),x.act)); return o?`<button class="btn sm pri" data-a="aiGive" data-sid="${o.id}" data-pid="${a.pid}">Give shift</button>`:'' })():''}${a.st==='pending'?(mgrRota()?`<button class="btn sm pri" data-a="avYes" data-id="${a.id}">Approve</button><button class="btn sm" data-a="avNo" data-id="${a.id}">Decline</button>`:''):((mgrRota()||a.pid===me().id)?`<button class="btn sm" data-a="avDel" data-id="${a.id}" aria-label="Remove">${ic('trash')}</button>`:'')}</div>` }).join('')}</div>` }
A.avDel=d=>{ const a=avList().find(x=>x.id===d.id); if(!a)return; if(a.st==='pending'){ toast('This has not been answered yet, so it stays on the list until your manager responds.'); return } S.avail=avList().filter(x=>x.id!==d.id); commit() };
function avDecide(id,ok){ if(!mgrRota())return; const a=avList().find(x=>x.id===id); if(!a||a.st!=='pending')return; const p=P(a.pid); if(!p)return; const first=p.name.split(' ')[0], dl=fdate(a.date); let extra='';
  if(a.sw){ const grp=avList().filter(x=>x.sw===a.sw&&x.st==='pending'); const off=grp.find(x=>x.kind==='cant'), on=grp.find(x=>x.kind==='can'); grp.forEach(x=>{ x.st=ok?'approved':'declined'; x.by=me().id; x.at=Date.now() });
    if(!ok&&off){ const s=off.sid&&S.shifts.find(x=>x.id===off.sid); if(s&&!s.pid&&s.cover&&s.cover.open&&s.cover.from===p.id){ s.pid=p.id; s.cover=null; s.note='' } }
    notify(p.id,ok?'Your manager approved your swap: off '+(off?fdate(off.date):'')+', working '+(on?fdate(on.date):'')+' instead.':'Your manager did not approve your swap ('+(off?fdate(off.date):'')+' for '+(on?fdate(on.date):'')+').','cover'); commit(); toast(ok?first+' has been told the swap is approved.':first+' has been told the swap is declined.'); return }
  a.st=ok?'approved':'declined'; a.by=me().id; a.at=Date.now();
  if(!ok&&a.kind==='cant'){ const s=a.sid&&S.shifts.find(x=>x.id===a.sid); if(s){ if(!s.pid&&s.cover&&s.cover.open&&s.cover.from===p.id){ s.pid=p.id; s.cover=null; s.note=''; extra=' You are back on the shift ('+shRng(s,' to ')+').' } else if(s.cover&&s.cover.by){ const b=P(s.cover.by); extra=' '+(b?b.name.split(' ')[0]:'Someone')+' has already taken the shift, so speak to your manager.' } } }
  notify(p.id,ok?(a.kind==='can'?'Your manager accepted that you can work '+dl+'.':'Your manager approved that you cannot work '+dl+'.'):'Your manager did not approve your request for '+dl+'.'+extra,'cover');
  commit(); toast(ok?first+' has been told it is approved.':first+' has been told it is declined.') }
A.avYes=d=>avDecide(d.id,true); A.avNo=d=>avDecide(d.id,false);
function myReqCard(p){ const t=today(); const l=avList().filter(a=>a.pid===p.id&&a.date>=t).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0); if(!l.length)return ''; return `<div class="card" style="margin-top:14px"><div class="hd"><h2>What you told your manager</h2></div>${l.map(a=>{ const can=a.kind==='can'; return `<div class="nowc"><div style="flex:1"><b>${fdate(a.date)}</b><small style="display:block;color:var(--mut)">${can?'You can work':'You cannot work'}${a.note?' · '+esc(a.note):''}</small></div>${a.st==='pending'?'<span class="chip amber">Waiting for your manager</span>':a.st==='declined'?'<span class="chip">Declined</span>':'<span class="chip green">Approved</span>'}${a.st==='pending'?'':`<button class="btn sm" data-a="avDel" data-id="${a.id}" aria-label="Remove">${ic('trash')}</button>`}</div>` }).join('')}</div>` }

/* ----- "Inform manager" pop-up (everyone) ----- */
function listen(cb){ const SR=window.SpeechRecognition||window.webkitSpeechRecognition; const b=$('[data-a=micGo]');
  if(!SR){ toast('Tap the microphone on your phone keyboard to talk instead.'); return }
  try{ const r=new SR(); r.lang='en-GB'; r.interimResults=false; r.maxAlternatives=1; if(b)b.classList.add('on');
    r.onresult=e=>{ const t=Array.from(e.results).map(x=>x[0].transcript).join(' ').trim(); if(t)cb(t) };
    r.onerror=e=>{ toast(e.error==='not-allowed'||e.error==='service-not-allowed'?'The microphone is blocked here. Tap the microphone on your phone keyboard instead.':'Could not hear that. Try again, or use the keyboard microphone.') };
    r.onend=()=>{ if(b)b.classList.remove('on') }; r.start() }catch(e){ toast('Tap the microphone on your phone keyboard to talk instead.') } }
const micBtn=()=>`<button class="btn" type="button" data-a="micGo" aria-label="Speak">${ic('mic')}</button>`;
A.micGo=()=>{ const i=$('#aiq')||$('#pnl-body [name=say]'); if(!i)return; listen(t=>{ i.value=t; if(i.id==='aiq')A.aiGo() }) };
A.avOpen=d=>{ const m=me(), mg=mgrLeave(); const ps=lvPeople(); const day=(d&&d.d)||(avCut().on&&!mgrLeave()?addD(wkStart(today()),7):addD(today(),1));
  openPanel({title:'Inform manager',saveLabel:'Send',small:true,body:`${mg?lab('Who',sel('pid',ps.map(p=>[p.id,p.name]),m.id)):`<input type="hidden" name="pid" value="${m.id}">`}<div class="f2">${lab('I',sel('kind',[['can','can work'],['cant','cannot work']],'can'))}${lab('Day',`<input type="date" name="date" value="${day}" min="${today()}">`)}</div>${lab('Note (optional)',inp('note','','placeholder="e.g. any time after 10"'))}<div class="card" style="padding:10px 12px;margin:2px 0"><b style="display:block;margin-bottom:4px">Or swap a day off</b><p class="mut" style="margin:0 0 6px;font-size:13px">Off on one day, work another day instead. Leave empty if you do not need this.</p><div class="f2">${lab('I cannot work',`<input type="date" name="swOff" value="" min="${today()}">`)}${lab('I can work instead',`<input type="date" name="swOn" value="" min="${today()}">`)}</div></div>${(!mg&&avCut().on)?`<p class="mut" style="margin:0;font-size:13px">Deadline: tell your manager by <b>${esc(avCutTxt(addD(wkStart(today()),7)))}</b> for next week. After that the rota is set.</p>`:''}<div class="lab"><span>Or just say it</span><div class="row" style="flex-wrap:nowrap"><input name="say" placeholder="I can work Sunday" style="flex:1" autocomplete="off">${micBtn()}</div></div>`,
    save:v=>{ const p=P(v.pid||m.id)||m; const say=(v.say||'').trim(); let kind=v.kind, dates=[v.date].filter(Boolean);
      if(v.swOff||v.swOn){ if(!v.swOff||!v.swOn){toast('For a swap, choose both days.');return false} if(v.swOff===v.swOn){toast('Choose two different days.');return false} if(v.swOff<today()||v.swOn<today()){toast('Choose days from today.');return false}
        if(p.id===m.id&&!mgrLeave()){ const lk=[v.swOff,v.swOn].filter(avLocked); if(lk.length){ toast('Too late for '+lk.map(fdate).join(', ')+'. That rota closed on '+avCutTxt(lk[0])+'. Please phone your manager.'); return false } }
        const sw=uid(), nt=(v.note||'').trim(), mineS=S.shifts.filter(x=>x.pid===p.id&&x.date===v.swOff); avApply(p,'cant',[v.swOff],'Swap: working '+fdate(v.swOn)+' instead'+(nt?' ('+nt+')':''),false,sw); avApply(p,'can',[v.swOn],'Swap: off '+fdate(v.swOff)+' instead'+(nt?' ('+nt+')':''),false,sw);
        if(p.id===m.id&&!mgrRota()&&!mineS.length){ mgrIds(p).forEach(i=>notify(i,p.name+' asks to swap days: off '+fdate(v.swOff)+', works '+fdate(v.swOn)+' instead'+(nt?' ('+nt+')':'')+'.','leave')) }
        let al=0; mineS.forEach(x=>{ al+=startCover(x,'Swap') }); commit(); toast('Your manager has been told: off '+fdate(v.swOff)+', working '+fdate(v.swOn)+' instead.'); return }
      if(say){ const k=avIntent(say), dd=avDates(say); if(!dd.length){toast('Which day? For example: I can work Sunday.');return false} kind=k||kind; dates=dd }
      if(!dates.length||dates.some(x=>x<today())){toast('Choose a day from today.');return false}
      if(p.id===m.id&&!mgrLeave()){ const lk=dates.filter(avLocked); if(lk.length){ toast('Too late for '+lk.map(fdate).join(', ')+'. That rota closed on '+avCutTxt(lk[0])+'. Please phone your manager.'); return false } }
      const mine=kind==='cant'?S.shifts.filter(x=>x.pid===p.id&&dates.includes(x.date)):[]; avApply(p,kind,dates,(v.note||'').trim(),p.id===m.id&&!mine.length); let al=0; mine.forEach(x=>{ al+=startCover(x,(v.note||'').trim()) }); commit(); if(mine.length){ toast('Your manager has been told'+(al?' and '+plural(al,'teammate')+' alerted to cover your shift':'')+'.'); return } toast((kind==='can'?'Your manager has been told you can work ':'Your manager has been told you cannot work ')+dates.map(fdate).join(', ')) }}) };

/* ----- staff side: shifts you can pick up (Home) ----- */
function pickShifts(p){ const t=today(), end=addD(t,14); return S.shifts.filter(s=>!s.pid&&s.date>=t&&s.date<=end&&canDo(p,s.act)&&!S.shifts.some(x=>x.pid===p.id&&x.date===s.date)&&!leaveOn(p.id,s.date,true)&&!avOn(p.id,s.date,'cant')).sort((a,b)=>(!!b.cover-!!a.cover)||(a.date<b.date?-1:a.date>b.date?1:a.start-b.start)).slice(0,6) }
function myShiftsCard(p){ const t=today(); const l=S.shifts.filter(x=>x.pid===p.id&&x.pub&&x.date>=t&&x.date<=addD(t,7)).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.start-b.start).slice(0,4); if(!l.length)return ''; return `<div class="card" style="margin-top:14px"><div class="hd"><h2>Your next shifts</h2></div>${l.map(x=>`<div class="nowc"><div style="flex:1"><b>${x.date===t?'Today':fdate(x.date)}</b><small style="display:block;color:var(--mut)">${shRng(x,' to ')}</small></div><button class="btn sm" data-a="cantAttend" data-sid="${x.id}">I cannot attend</button></div>`).join('')}</div>` }
function routineCard(p){ const ws=wkStart(today()); const days=[0,1,2,3,4,5,6].map(i=>addD(ws,i)); const us=days.map(d=>({d,u:usualFor(p,d)})).filter(x=>x.u);
  let sum; if(p.flex)sum='You are flexible: your manager asks you when a hand is needed.'; else if(!us.length)sum='No usual days set yet. Tell your manager which days suit you.'; else { const am=us.filter(x=>x.u.f<720).length; const part=am>=us.length*0.6?'mostly mornings':am<=us.length*0.2?'mostly afternoons and evenings':'a mix of mornings and later shifts'; sum=plural(us.length,'day')+' a week, '+part+'.' }
  const chips=us.map(x=>`<span class="chip">${DN[dow(x.d)]} ${fT(x.u.f)}</span>`).join(' ');
  return `<div class="card pad" style="margin-top:14px"><div class="row"><div style="flex:1;min-width:200px"><h2 style="font-size:17px;margin:0">Your usual week</h2><p class="mut" style="margin:4px 0 ${us.length?8:0}px">${esc(sum)}</p>${chips?`<div class="row" style="gap:6px;flex-wrap:wrap">${chips}</div>`:''}<p class="mut" style="margin:8px 0 0">The rota is built from this. If you can work other days or times, or cannot make one, tell your manager and it is taken into account.</p></div><button class="btn pri" data-a="avOpen">${ic('mic')}Inform manager</button></div></div>` }
function pickCard(){ const p=me(); if(!p||p.noTrack||!p.licensed||isMgr(p))return ''; const l=pickShifts(p);
  return routineCard(p)+myReqCard(p)+`<div class="card" style="margin-top:14px"><div class="hd"><h2>Shifts you can pick up</h2></div>${l.length?l.map(s=>{ const sent=avOn(p.id,s.date,'can'); return `<div class="nowc"><div style="flex:1"><b>${fdate(s.date)}</b><small style="display:block;color:var(--mut)">${shRng(s,' to ')}${roleNm(s.act)?' · '+esc(roleNm(s.act)):''}</small></div>${s.cover&&s.cover.open?`<span class="chip red">Cover needed</span><button class="btn sm pri" data-a="coverTake" data-sid="${s.id}">Take this shift</button>`:sent?'<span class="chip green">Sent to manager</span>':`<button class="btn sm pri" data-a="pickUp" data-sid="${s.id}">I can do this</button>`}</div>` }).join(''):`<div class="nowc"><span class="mut">No open shifts right now. Use Inform manager to say which days you can or cannot work.</span></div>`}</div>`+avCard(today(),'','What you have told your manager',p.id) }
A.pickUp=d=>{ const s=S.shifts.find(x=>x.id===d.sid), p=me(); if(!s||s.pid)return toast('That shift has gone.'); avApply(p,'can',[s.date],'Offered for the open shift ('+shRng(s,' to ')+')',true); commit(); toast('Sent. Your manager can give you the shift.') };
const _vHome32=V.home; V.home=()=>_vHome32()+pickCard();
