/* ===== Proview AI: comparisons across periods, breaks, rota hours, and more ===== */
const AIMN={one:1,two:2,three:3,four:4,five:5,six:6};
function aiAll(s){ // every period named in the question, in the order written
  const t=today(), ws=wkStart(t), out=[]; const add=(i,r)=>out.push({i,r});
  const mo=n=>{ const d=pd(t), f=ds(new Date(d.getFullYear(),d.getMonth()-n,1)); return aiRange(f,monthEnd(f)) };
  const wk=n=>aiRange(addD(ws,-7*n),addD(ws,-7*n+6));
  const num=x=>/^\d+$/.test(x)?+x:(AIMN[x]||0);
  let m, re;
  re=/\bthis week\b/g; while((m=re.exec(s)))add(m.index,Object.assign(wk(0),{label:'this week'}));
  re=/\b(last|previous) week\b/g; while((m=re.exec(s)))add(m.index,Object.assign(wk(1),{label:'last week'}));
  re=/\bweek before last\b/g; while((m=re.exec(s)))add(m.index,Object.assign(wk(2),{label:'2 weeks ago'}));
  re=/\b(\d+|two|three|four|five|six) weeks? ago\b/g; while((m=re.exec(s)))add(m.index,Object.assign(wk(num(m[1])),{label:num(m[1])+' weeks ago'}));
  re=/\bthis month\b/g; while((m=re.exec(s)))add(m.index,Object.assign(mo(0),{label:'this month'}));
  re=/\b(last|previous) month\b/g; while((m=re.exec(s)))add(m.index,Object.assign(mo(1),{label:'last month'}));
  re=/\bmonth before last\b/g; while((m=re.exec(s)))add(m.index,Object.assign(mo(2),{label:'2 months ago'}));
  re=/\b(\d+|two|three|four|five|six) months? ago\b/g; while((m=re.exec(s)))add(m.index,Object.assign(mo(num(m[1])),{label:num(m[1])+' months ago'}));
  re=/\bnext week\b/g; while((m=re.exec(s)))add(m.index,Object.assign(aiRange(addD(ws,7),addD(ws,13)),{label:'next week'}));
  re=/\bnext month\b/g; while((m=re.exec(s)))add(m.index,Object.assign(mo(-1),{label:'next month'}));
  re=/\b(this|last|previous|next) weekend\b/g; while((m=re.exec(s))){ const o=m[1]==='this'?0:m[1]==='next'?7:-7; add(m.index,Object.assign(aiRange(addD(ws,o+5),addD(ws,o+6)),{label:(m[1]==='previous'?'last':m[1])+' weekend'})) }
  { const MF=['january','february','march','april','may','june','july','august','september','october','november','december']; re=/\b(january|february|march|april|june|july|august|september|october|november|december|sept|may)\b/g; while((m=re.exec(s))){ if(m[1]==='may'&&!/\b(in|during|for|of|and|vs|versus|from|to|between|than)\s+$/.test(s.slice(0,m.index)))continue; if(/\d(st|nd|rd|th)?\s*(of\s+)?$/.test(s.slice(0,m.index))||/^\s*\d/.test(s.slice(m.index+m[0].length)))continue; const nm=m[1]==='sept'?'september':m[1]; const idx=MF.indexOf(nm), cm=pd(t).getMonth(), y=Number(t.slice(0,4))-(idx>cm?1:0), f=ds(new Date(y,idx,1)); add(m.index,Object.assign(aiRange(f,monthEnd(f)),{label:idx===cm&&y===Number(t.slice(0,4))?'this month':MF[idx][0].toUpperCase()+MF[idx].slice(1)})) } }
  re=/\bthis year\b/g; while((m=re.exec(s)))add(m.index,Object.assign(aiRange(t.slice(0,4)+'-01-01',t.slice(0,4)+'-12-31'),{label:'this year'}));
  re=/\blast year\b/g; while((m=re.exec(s)))add(m.index,Object.assign(aiRange((Number(t.slice(0,4))-1)+'-01-01',(Number(t.slice(0,4))-1)+'-12-31'),{label:'last year'}));
  { const base=(aiPast(s)||/\b(hours?|worked|late|cost|overtime|clocked|missed|break)\b/.test(s))&&!/\b(scheduled|planned|rota|rostered|will|going to|upcoming|forecast)\b/.test(s); const dayAdd=(i,d,l)=>add(i,Object.assign(aiRange(d,d),{label:l}));
    re=/\bday before yesterday\b/g; while((m=re.exec(s)))dayAdd(m.index,addD(t,-2),'the day before yesterday');
    re=/\byesterday\b/g; while((m=re.exec(s))){ if(/day before\s+$/.test(s.slice(0,m.index)))continue; dayAdd(m.index,addD(t,-1),'yesterday') }
    re=/\btoday\b/g; while((m=re.exec(s)))dayAdd(m.index,t,'today');
    re=/\btomorrow\b/g; while((m=re.exec(s)))dayAdd(m.index,addD(t,1),'tomorrow');
    re=/\bthe day before\b(?! yesterday)/g; while((m=re.exec(s))){ const first=out.filter(x=>x.r.one).sort((a,b)=>a.i-b.i)[0]; if(first)dayAdd(m.index+1,addD(first.r.from,-1),'the day before') }
    const wre=new RegExp('\\b(next\\s+|last\\s+|this\\s+|on\\s+)?('+WDX.map(a=>a.slice().reverse().join('|')).join('|')+')\\b','g'); const wk=/\b(this|last|previous|next) week\b/.exec(s); let wdn=0;
    while((m=wre.exec(s))){ const idx=WDX.findIndex(a=>a.includes(m[2])); const pre=(m[1]||'').trim(); let d; wdn++;
      if(wk&&!pre){ const o=wk[1]==='this'?0:wk[1]==='next'?7:-7; d=addD(addD(ws,o),idx) } else { d=addD(ws,idx); if(pre==='last'){ if(d>=t)d=addD(d,-7) } else if(pre==='next'){ d=addD(d,7) } else if(base){ if(d>t)d=addD(d,-7) } else { if(d<t)d=addD(d,7) } }
      dayAdd(m.index,d,fdate(d)) }
    if(wdn&&wk)for(let k=out.length-1;k>=0;k--)if(out[k].i===wk.index)out.splice(k,1) }
  { // explicit calendar dates: "3rd of November", "3 nov", "november 3", "monday 2 november 2026"; "between 1 nov and 8 nov" is one range
    const MN3=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']; const MR='(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
    const mk=(day,mon,yr)=>{ const idx=MN3.indexOf(mon.slice(0,3)); if(idx<0||day<1||day>31)return null; const y=yr?Number(yr):Number(t.slice(0,4)); const d=new Date(y,idx,day); if(d.getMonth()!==idx)return null; let k=ds(d); if(!yr&&k>addD(t,200))k=ds(new Date(y-1,idx,day)); return k };
    const found=[]; let m2,r2;
    r2=new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?'+MR+'\\b(?:\\s+(20\\d\\d))?','g'); while((m2=r2.exec(s))){ const k=mk(+m2[1],m2[2],m2[3]); if(k)found.push({i:m2.index,e:m2.index+m2[0].length,k}) }
    r2=new RegExp('\\b'+MR+'\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!\\s*(?:20\\d\\d|:|h\\b|hours?|people|staff|shifts?))(?:,?\\s+(20\\d\\d))?','g'); while((m2=r2.exec(s))){ const k=mk(+m2[2],m2[1],m2[3]); if(k&&!found.some(x=>m2.index<x.e&&x.i<m2.index+m2[0].length))found.push({i:m2.index,e:m2.index+m2[0].length,k}) }
    found.sort((a,b)=>a.i-b.i);
    const dropWd=i=>{ for(let j=out.length-1;j>=0;j--){ const x=out[j]; if(x.i<i&&/^(on\s+)?(mon|tue|tues|wed|weds|thu|thur|thurs|fri|sat|sun)[a-z]*,?\s*$/.test(s.slice(x.i,i)))out.splice(j,1) } };
    for(let n=0;n<found.length;n++){ const a2=found[n], b2=found[n+1];
      if(b2&&/^\s*(and|to|until|till|through|-|–|—)\s*$/.test(s.slice(a2.e,b2.i))&&/\b(between|from)\s+(?:(?:on\s+)?(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s*)?$/.test(s.slice(0,a2.i))){ dropWd(a2.i); dropWd(b2.i); const f0=a2.k<=b2.k?a2.k:b2.k, t0=a2.k<=b2.k?b2.k:a2.k; add(a2.i,Object.assign(aiRange(f0,t0),{label:fdm(f0)+' – '+fdm(t0)})); n++; continue }
      dropWd(a2.i); add(a2.i,Object.assign(aiRange(a2.k,a2.k),{label:fdate(a2.k)})) } }
  const seen={}; return out.sort((a,b)=>a.i-b.i).map(x=>x.r).filter(r=>{ const k=r.from+r.to; if(seen[k])return false; seen[k]=1; return true }) }

function aiVals(list,r){ const t=today(), nm=nowMin(); const out={};
  list.forEach(p=>{ const v={worked:0,rota:0,rotacost:0,brk:0,late:0,latemin:0,shifts:0,days:0,noshow:0,weekend:0,longest:0,longestr:0,ot:0,cost:0,nobrk:0,_wk:Math.max(1,aiDays(r.from,r.to<t?r.to:t).length/7)};
    aiDays(r.from,r.to).forEach(d=>{ const sh=S.shifts.filter(x=>x.pid===p.id&&x.date===d); sh.forEach(x=>{ const mn=Math.max(0,((x.end<=x.start?x.end+1440:x.end)-x.start)-(x.brk||0)); v.shifts++; v.longestr=Math.max(v.longestr,mn); v.rota+=mn; v.rotacost+=mn/60*(p.rate||0) });
      if(d>t)return; const dc=dayCalc(p,d,false); v.worked+=dc.worked; v.brk+=dc.brk; if(dc.worked>0){ v.days++; if(dow(d)>=5)v.weekend+=dc.worked; v.longest=Math.max(v.longest,dc.worked); if(dc.worked>=360&&dc.brk===0&&!dc.open)v.nobrk++ }
      if(dc.late>LATE_GRACE){ v.late++; v.latemin+=dc.late }
      if(sh.length&&!dc.n&&!leaveOn(p.id,d,true)&&!(d===t&&nm<sh[0].start+LATE_GRACE))v.noshow++ });
    if(r.from<=t){ const rc=rangeCalc([p],r.from,r.to<t?r.to:t,false).byPerson[p.id]; v.ot=rc.ot; v.cost=rc.cost }
    out[p.id]=v });
  return out }
const AIMET={
  worked:{n:'Hours worked',f:v=>v.worked,u:'min'}, rota:{n:'Rota hours (planned)',f:v=>v.rota,u:'min'}, brk:{n:'Break taken',f:v=>v.brk,u:'min'},
  late:{n:'Late arrivals',f:v=>v.late,u:'n'}, latemin:{n:'Minutes late',f:v=>v.latemin,u:'m'}, ot:{n:'Overtime',f:v=>v.ot,u:'min'}, cost:{n:'Labour cost',f:v=>v.cost,u:'£',admin:1},
  rotacost:{n:'Planned cost of the rota',f:v=>v.rotacost,u:'£',admin:1}, shifts:{n:'Shifts on the rota',f:v=>v.shifts,u:'n'}, days:{n:'Days worked',f:v=>v.days,u:'n'},
  noshow:{n:'Missed shifts',f:v=>v.noshow,u:'n'}, weekend:{n:'Weekend hours',f:v=>v.weekend,u:'min'}, longest:{n:'Longest day',f:v=>v.longest,u:'min'},
  longestr:{n:'Longest planned shift',f:v=>v.longestr,u:'min'}, perweek:{n:'Average hours per week',f:v=>v.worked/(v._wk||1),u:'min'},
  avg:{n:'Average per day worked',f:v=>v.days?v.worked/v.days:0,u:'min'}, brkavg:{n:'Average break per day worked',f:v=>v.days?v.brk/v.days:0,u:'min'}, costph:{n:'Labour cost per hour worked',f:v=>v.worked?v.cost/(v.worked/60):0,u:'£',admin:1}, nobrk:{n:'Days over 6h with no break recorded',f:v=>v.nobrk,u:'n'} };
const aiAgg=(k,ps,v)=>{ const g=f=>sum(ps,p=>f(v[p.id]||{})); if(k==='avg')return g(x=>x.worked)/Math.max(1,g(x=>x.days)); if(k==='brkavg')return g(x=>x.brk)/Math.max(1,g(x=>x.days)); if(k==='costph')return g(x=>x.cost)/Math.max(0.01,g(x=>x.worked)/60); if(k==='longest')return Math.max(0,...ps.map(p=>(v[p.id]||{}).longest||0)); if(k==='longestr')return Math.max(0,...ps.map(p=>(v[p.id]||{}).longestr||0)); if(k==='perweek'){ const a=ps.filter(p=>(v[p.id]||{}).worked>0); return a.length?sum(a,p=>v[p.id].worked/(v[p.id]._wk||1))/a.length:0 } return g(AIMET[k].f) };
const aiFmtM=(k,x)=>{ const u=AIMET[k].u; return u==='min'?fd(x):u==='£'?money(x):u==='m'?Math.round(x)+' min':String(Math.round(x*10)/10) };
function aiMetrics(s){ const k=[]; const add=x=>{ if(!k.includes(x))k.push(x) }; const s2=s.replace(/time off/g,' ');
  if(/\bbreaks?\b/.test(s)&&!/\bbreakfast\b/.test(s))add('brk');
  if(/\b(rota|rotas?|scheduled|planned|rostered|roster)\b.*\bhours?\b|\bhours?\b.*\b(rota|scheduled|planned|rostered)\b|\brota hours\b/.test(s))add('rota');
  if(/\b(forecast|projected|rota cost|planned cost|estimated cost|will be)\b/.test(s)&&/\b(cost|wages?|payroll|labou?r)\b/.test(s))add('rotacost');
  if(/\b(late|lateness|punctual|punctuality|on time)\b/.test(s)){ add('late'); if(/\b(minutes|mins|how late|how long)\b/.test(s))add('latemin') }
  if(/\bovertime\b/.test(s))add('ot');
  if(/\bper hour\b|\bhourly (cost|rate)\b/.test(s)&&/\b(cost|wages?|labou?r)\b/.test(s))add('costph'); else if(/\b(cost|wages?|payroll|labou?r|spend|spent|cost(s|ed)?)\b/.test(s)&&!k.includes('rotacost'))add('cost');
  if(/\b(no.?show|missed (a )?shifts?|absent|absence|didn.?t (turn up|show))\b/.test(s))add('noshow');
  if(/\bhow many shifts\b|\bnumber of shifts\b|\bshifts (on|per|each)\b|\b(most|fewest|least|more|fewer) shifts\b|\b(on|in) the rota the (most|least|fewest)\b|\brostered the (most|least)\b/.test(s))add('shifts');
  if(/\b(days worked|how many days|days did|days has|days have|days (a|per) week)\b/.test(s))add('days');
  if(/\bweekends?\b/.test(s)&&/\b(hours?|worked|work|most|fewest|least)\b/.test(s))add('weekend');
  if(/\b(busiest|hardest)\b/.test(s)&&/\bwho\b/.test(s))add('worked');
  if(/\blongest\b/.test(s)&&!k.includes('brk'))add('longest');
  if(/\b(average|avg|per day|a day|each day|typical)\b/.test(s)&&k.includes('brk')){ k.splice(k.indexOf('brk'),1,'brkavg') }
  else if(/\b(average|avg|per day|a day|each day)\b/.test(s)&&/\b(hours?|shift|day|worked)\b/.test(s)&&!k.length)add('avg');
  if(/\b(hours?|worked|work|clocked|time)\b/.test(s2)&&!/\brota hours\b/.test(s)&&(!k.length||(/\b(worked|actual|clocked|actually)\b/.test(s)&&!k.some(x=>['days','shifts','noshow','late','latemin','brkavg','brk'].includes(x)))))add('worked');
  if(/\b(per week|a week|each week|weekly)\b/.test(s)&&/\bhours?\b/.test(s)&&/\b(average|avg|per person|each|typical|usually)\b/.test(s)){ k.length=0; add('perweek') }
  if(/\bwithout a break|no break|skipped (a |their )?break\b/.test(s)){ k.length=0; add('nobrk') }
  return k }
const AIHELP=()=>`<b>Ask me about your team and your rota. A few ideas:</b><ul style="margin:6px 0 0;padding-left:18px"><li><b>Compare:</b> <i>Compare last month's rota hours to this month's</i></li><li><b>Breaks:</b> <i>How much break was given this week, last week and 2 weeks ago?</i></li><li><b>Lateness:</b> <i>Who was late the most last month?</i></li><li><b>Hours:</b> <i>Kitchen vs floor hours last week</i></li><li><b>Rota:</b> <i>Who is working this weekend? Which shifts are still drafts?</i></li><li><b>Admin:</b> <i>Which timesheets are pending? Who has no PIN?</i></li><li><b>Summaries:</b> <i>How was last week?</i></li></ul>`;
function aiLive(q,s){ const t=today(), nm=nowMin(), ppl=team(), gs=aiGroups(s); const L=gs.length===1?ppl.filter(p=>p.g===gs[0].id):ppl;
  if(/\bon (a )?break\b|\btaking (a )?break\b|\bbreak right now\b/.test(s)){ const a=L.map(p=>({p,w:whoState(p)})).filter(x=>x.w.st==='break'); const inn=L.filter(p=>whoState(p).st==='in').length;
    return a.length?`<b>${plural(a.length,'person','people')} on break:</b> ${a.map(x=>esc(aiFirst(x.p))+(x.w.e.bs!=null?' (since '+fT(x.w.e.bs)+')':'')).join(', ')}.`:`Nobody is on a break right now.${inn?' '+plural(inn,'person','people')+' clocked in.':''}` }
  if(/\b(not clocked in|hasn.?t clocked in|has not clocked in|have not clocked in|haven.?t clocked in|yet to clock in|not in yet|hasn.?t (arrived|turned up|shown up)|has not (arrived|turned up)|not arrived|not turned up)\b/.test(s)&&!/\b(yesterday|last|week|month|ago)\b/.test(s)){
    const out=[]; S.shifts.filter(x=>x.date===t&&x.pid&&L.some(p=>p.id===x.pid)).sort((a,b)=>a.start-b.start).forEach(x=>{ if(S.entries.some(e=>e.pid===x.pid&&e.date===t))return; if(leaveOn(x.pid,t,true))return; if(nm<x.start)return; out.push([esc(P(x.pid).name),shT(x),nm>x.start+LATE_GRACE?(nm-x.start)+' min overdue':'due now']) });
    return out.length?`<b>${plural(out.length,'person','people')} due in but not clocked in.</b>`+aiTbl(['Member','Shift','Status'],out):'Everyone who should be in by now has clocked in.' }
  if(/\b(who|how many|which)\b.*\b(clocked in|have clocked|has clocked|came in|arrived|got in|turned up)\b/.test(s)&&!/\bnot\b|n.?t\b|\byet\b|\bstill\b|\bright now\b|\bcurrently\b|\b(yesterday|last|week|month|ago|late)\b/.test(s)){
    const rows=[]; L.forEach(p=>{ const dc=dayCalc(p,t,false); if(dc.n)rows.push([esc(p.name),fT(dc.first),dc.late>LATE_GRACE?dc.late+' min late':'On time']) });
    return rows.length?`<b>${plural(rows.length,'person','people')} clocked in today.</b>`+aiTbl(['Member','Clocked in','Status'],rows):'Nobody has clocked in yet today.' }
  if(/\bwhat time\b.*\bclock(ed)? in\b|\bclock(ed)? in times?\b/.test(s)&&!/\b(yesterday|last|week|month|ago)\b/.test(s)){ const rows=[]; L.forEach(p=>{ const dc=dayCalc(p,t,false); if(dc.n)rows.push([esc(p.name),fT(dc.first),dc.late>LATE_GRACE?dc.late+' min late':'On time']) }); return rows.length?`<b>Clock-in times today.</b>`+aiTbl(['Member','Clocked in','Status'],rows):'Nobody has clocked in yet today.' }
  if(/\b(on the clock|in the building|in the cafe|on site|in work|at work|here right now|in right now|in now|is in|are in)\b/.test(s)&&/\b(who|how many|anyone|anybody)\b/.test(s)&&!/\b(yesterday|last|week|month|ago|tomorrow)\b/.test(s)&&!/\b(on|working) (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(s)&&/\b(building|cafe|site|work|right now|now)\b/.test(s)){ const a=L.map(p=>({p,w:whoState(p)})).filter(x=>x.w.st!=='out'); const hq=/\bhow many\b/.test(s);
    return a.length?`<b>${plural(a.length,'person','people')} in right now${hq?'':':'}</b>`+aiTbl(['Member','Since','Status'],a.map(x=>[esc(x.p.name),fT(x.w.e.in),x.w.st==='break'?'On break':'Working'])):'Nobody is clocked in right now.' }
  if(/\bwho.?s? (is )?(next|up next|coming in|due in next|due next|on next)\b/.test(s)||/\bwho is next on\b/.test(s)){ let d=t, on=S.shifts.filter(x=>x.date===d&&x.pid&&L.some(p=>p.id===x.pid)&&x.start>nm).sort((a,b)=>a.start-b.start); if(!on.length){ d=addD(t,1); on=S.shifts.filter(x=>x.date===d&&x.pid&&L.some(p=>p.id===x.pid)).sort((a,b)=>a.start-b.start) } if(!on.length)return 'Nobody else is due in today or tomorrow.'; const st=on[0].start; const same=on.filter(x=>x.start===st);
    return `<b>Next on: ${same.map(x=>esc(aiFirst(P(x.pid)))).join(', ')} at ${fT(st)} ${d===t?'today':'tomorrow'}.</b>`+(on.length>same.length?` After that: ${on.filter(x=>x.start>st).slice(0,4).map(x=>esc(aiFirst(P(x.pid)))+' '+fT(x.start)).join(', ')}.`:'') }
  return null }

function aiMore(q,s,c){
  const {m,ppl,ids,t,per,W,gsel}=c; const who=p=>esc(p.name), grpNames=S.groups.map(g=>g.name.toLowerCase());
  const per2=per, lab=r=>r.label||(r.one?fdate(r.from):fdm(r.from)+' – '+fdm(r.to)), WK=wkStart(t), gOneG=gsel&&gsel.length===1?gsel[0]:null, adm=isAdmin(m);
  const hasMetricWord=/\b(hours?|worked|late|lateness|cost|wages?|payroll|breaks?|overtime|shifts?|paid|minutes|no.?show|absent)\b/.test(s);
  // ---- greetings and help
  if(/^\s*(hello|hi|hey|hiya|good (morning|afternoon|evening)|thanks|thank you|cheers|ta|ok|okay|great|perfect)\s*$/.test(s))return /thank|cheers|\bta\b|ok|great|perfect/.test(s)?'Any time. Ask me anything else about the team.':`Hello ${esc(aiFirst(m))}. What would you like to know about the team?`;
  if(/^\s*(help|what can you (do|answer|tell me)|what can i ask( you)?|what do you know|show me everything|everything|options|menu|who|what|\?|how)\s*$/.test(s))return AIHELP();
  // ---- timesheet status
  if(/\btimesheets?\b|\bunapproved\b|\bnot approved\b|\bapproved hours\b|\bsubmitted\b|\bsubmit\b|\bpending hours\b|\bwaiting (for )?approval\b|\bawaiting approval\b|\bneed(s)? approv|\brejected\b/.test(s)&&!/\b(compare|versus|vs)\b/.test(s)){
    const r=W||aiRange(addD(WK,-35),addD(WK,6),'the last 6 weeks'); const want=/\brejected\b/.test(s)?'rejected':(/\bunapproved\b|\bnot approved\b|\b(pending|waiting|awaiting|outstanding|need(s)? approv)/.test(s)?'pending':/\bapproved\b/.test(s)?'approved':/\b(submit|submitted|missing)\b/.test(s)?'none':'all');
    const counts={pending:0,approved:0,rejected:0,none:0}, rows=[], byWeek=[];
    for(let w=wkStart(r.from);w<=r.to;w=addD(w,7)){ const c0={pending:0,approved:0,rejected:0,none:0};
      ppl.forEach(p=>{ if(per2&&!per2.some(x=>x.id===p.id))return; let st=weekStatus(p,w); if(st==='none'){ if(!S.shifts.some(x=>x.pid===p.id&&x.date>=w&&x.date<=addD(w,6)&&x.date<t))return }
        c0[st]++; counts[st]++; if(want!=='all'&&st!==want)return; if(want==='all'&&st==='approved')return; const hrs=rangeCalc([p],w,addD(w,6)<t?addD(w,6):t,false).worked; const rj=st==='rejected'?(S.entries.find(e=>e.pid===p.id&&e.date>=w&&e.date<=addD(w,6)&&e.st==='rejected')||{}).rej:''; rows.push([who(p),'Week of '+fdm(w),fd(hrs),({pending:'Pending',approved:'Approved',rejected:'Rejected'+(rj?' ('+esc(rj)+')':''),none:'No hours sent'})[st]]) });
      if(c0.pending+c0.approved+c0.rejected+c0.none)byWeek.push(['Week of '+fdm(w),c0.approved,c0.pending,c0.rejected]) }
    const tot=counts.pending+counts.approved+counts.rejected; const head=`<b>${counts.pending} pending, ${counts.approved} approved, ${counts.rejected} rejected${counts.none?', '+counts.none+' with no hours sent':''} (${esc(lab(r))}).</b>`;
    if(want==='approved'||(/\bhow many\b/.test(s)&&byWeek.length>1))return head+aiTbl(['Week','Approved','Pending','Rejected'],byWeek);
    if(!rows.length)return want==='all'?head:`No ${want==='none'?'missing':want} timesheets (${esc(lab(r))}). ${tot?counts.approved+' approved.':''}`;
    return head+aiTbl(['Member','Week','Hours','Status'],rows.slice(0,25))+(rows.length>25?`<p class="mut" style="margin:6px 0 0">…and ${rows.length-25} more. Open Timesheets, Approvals.</p>`:'') }
  // ---- rota published or draft
  if(/\b(drafts?|unpublished|published|publish|not published|live)\b/.test(s)&&/\b(rota|shifts?|schedule|week|draft|published|unpublished)\b/.test(s)){
    const r=W||aiRange(WK,addD(WK,20),'the next 3 weeks'); const sh=S.shifts.filter(x=>x.date>=r.from&&x.date<=r.to&&(!x.pid||ids.has(x.pid))); const rows=[]; let dr=0,pb=0,op=0;
    for(let w=wkStart(r.from);w<=r.to;w=addD(w,7)){ const a=sh.filter(x=>x.date>=w&&x.date<=addD(w,6)); if(!a.length)continue; const d1=a.filter(x=>x.pid&&!x.pub).length, p1=a.filter(x=>x.pid&&x.pub).length, o1=a.filter(x=>!x.pid).length; dr+=d1; pb+=p1; op+=o1; rows.push(['Week of '+fdm(w),p1,d1,o1]) }
    if(!rows.length)return `Nothing is on the rota yet (${esc(lab(r))}).`;
    const head=dr?`<b>${plural(dr,'shift')} still draft (not published), ${pb} published (${esc(lab(r))}).</b>`:`<b>Everything is published</b> (${pb} shifts, ${esc(lab(r))}).`+(op?` ${plural(op,'open shift')} still need someone.`:'');
    const list=dr&&dr<=14&&/\bwhich\b|\bwhat\b|\blist\b/.test(s)?aiTbl(['Day','Who','Shift'],sh.filter(x=>x.pid&&!x.pub).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.start-b.start).map(x=>[fdate(x.date),who(P(x.pid)),shT(x)])):'';
    return head+aiTbl(['Week','Published','Draft','Open'],rows)+list }
  // ---- a group on its own (kitchen, floor)
  if(gOneG&&!hasMetricWord&&!/\b(open|clos)/.test(s)&&!/\b(tasks?|checklist|to.?do)\b/.test(s)&&/\b(who|how many|list|members?|staff|people|team|working|on)\b/.test(s)){
    const working=/\b(working|on shift|scheduled|rota|rostered)\b/.test(s)||W; const r=W||aiRange(t,t,'today');
    if(working){ const rows=[]; aiDays(r.from,r.to).slice(0,7).forEach(d=>S.shifts.filter(x=>x.date===d&&x.pid&&ids.has(x.pid)).sort((a,b)=>a.start-b.start).forEach(x=>rows.push([r.one?who(P(x.pid)):fdate(d),r.one?shT(x):who(P(x.pid))+' '+shT(x)])));
      return rows.length?`<b>${esc(gOneG.name)} on the rota (${esc(lab(r))}): ${plural(rows.length,'shift')}.</b>`+aiTbl(r.one?['Member','Shift']:['Day','Shift'],rows):`Nobody from ${esc(gOneG.name)} is on the rota (${esc(lab(r))}).` }
    return `<b>${esc(gOneG.name)}: ${plural(ppl.length,'person','people')}.</b>`+aiTbl(['Member','Role','Today'],ppl.map(p=>{ const sh=S.shifts.filter(x=>x.pid===p.id&&x.date===t); return [who(p),esc(roleLabel(p)),sh.length?sh.map(shT).join(', '):leaveOn(p.id,t,true)?'Time off':'Off'] })) }
  // ---- weekends on the rota
  if(/\bweekends?\b/.test(s)&&!/\b(hours?|late|cost|wages?|overtime|breaks?|paid|minutes|how long|most|fewest|least|busiest)\b/.test(s)){
    const days=W?aiDays(W.from,W.to).filter(d=>dow(d)>=5):[addD(WK,5),addD(WK,6),addD(WK,12),addD(WK,13)]; const rows=[]; const wl=per2||ppl;
    days.forEach(d=>{ const on=wl.filter(p=>S.shifts.some(x=>x.pid===p.id&&x.date===d)||(d<=t&&dayCalc(p,d,false).worked>0)); rows.push([fdate(d),on.length?on.map(p=>{ const x=S.shifts.find(z=>z.pid===p.id&&z.date===d); return esc(aiFirst(p))+(x?' '+shT(x):'') }).join(', '):'Nobody'+(S.shifts.some(x=>x.date===d&&!x.pid)?' (open shift)':'')]) });
    const yes=rows.some(r=>r[1]!==('Nobody'+(r[1].includes('open shift')?' (open shift)':'')))&&per2; if(per2)return `<b>${yes?'Yes':'No'}. ${per2.map(p=>esc(aiFirst(p))).join(' and ')} ${yes?'is':'is not'} on the rota ${W?esc(lab(W)):'this and next weekend'}.</b>`+(yes?aiTbl(['Day','Who'],rows.filter(r=>!/^Nobody/.test(r[1]))).replace(/ class="r num"/g,''):'');
    return `<b>${W?esc(lab(W)):'Weekend rota'}${gOneG?' – '+esc(gOneG.name):''}</b>`+aiTbl(['Day','Who'],rows).replace(/ class="r num"/g,'') }
  // ---- days with no break
  if(/\b(no|without|skipped|skip|missed|never)\b.*\bbreaks?\b|\b(didn.?t|did not|haven.?t|hasn.?t|not)\b.*\b(take|taken|have|had|get|got|given)\b.*\bbreaks?\b|\bbreaks?\b.*\b(skipped|missed|not taken)\b/.test(s)&&!/\bbreakfast\b/.test(s)&&!/\b(compare|versus|vs)\b/.test(s)){
    const r=W||aiRange(WK,addD(WK,6),'this week'); const mm=s.match(/\b(?:over|more than|longer than|above|at least)\s+(\d+)\s*(?:hours?|hrs?|h)\b/); const th=mm?+mm[1]*60:360; const list=per2||ppl; const rows=[];
    aiDays(r.from,r.to).filter(d=>d<=t).forEach(d=>list.forEach(p=>{ const dc=dayCalc(p,d,false); if(dc.n&&!dc.open&&dc.worked>=th&&dc.brk===0)rows.push([who(p),fdate(d),fd(dc.worked)]) }));
    return rows.length?`<b>${plural(rows.length,'shift')} over ${th/60} hours with no break recorded (${esc(lab(r))}).</b>`+aiTbl(['Member','Day','Worked'],rows.slice(0,30)):`Everyone who worked over ${th/60} hours has a break recorded (${esc(lab(r))}).` }
  // ---- budget / sales
  if(/\b(budget|labou?r (percent|%|percentage|ratio|pct)|percent(age)? of (sales|turnover|revenue|takings)|% of (sales|turnover)|sales|turnover|takings|revenue)\b/.test(s)){
    if(!adm)return 'Only owners and admins can see labour cost.'; const r=W||aiRange(t.slice(0,8)+'01',monthEnd(t),'this month'); const rc=rangeCalc(ppl,r.from,r.to<t?r.to:t,false);
    return `Proview does not hold your sales or a labour budget, so I cannot give a percentage. Labour cost ${esc(lab(r))}${r.to>t?' so far':''}: <b>${money(rc.cost)}</b> for ${fd(rc.worked)} worked. Divide that by your sales for the same period to get your labour percentage.` }
  // ---- tasks (any period)
  if(/\b(tasks?|checklists?|to.?do|chores?)\b/.test(s)){
    const od=/\b(overdue|missed|not done|undone|incomplete|outstanding|still to do|left to do|not completed|not finished|not do|didn.?t do|did not do|haven.?t done|hasn.?t done|forgot)\b/.test(s); let r=W||(od?aiRange(addD(t,-14),t,'the last 14 days'):aiRange(t,t,'today'));
    const days=aiDays(r.from,r.to).slice(0,31); let all=0,done=0; const nd=[], list=[];
    days.forEach(d=>tasksOn(d).forEach(x=>{ const as=taskAssignees(x,d); if(per2&&!as.some(id=>per2.some(p=>p.id===id)))return; if(gOneG&&as.length&&!as.some(id=>(P(id)||{}).g===gOneG.id))return; const st=taskState(x,d); list.push({x,d,as,st}); if(d<=t){ all++; if(st==='done')done++; else nd.push({x,d,as}) } }));
    const who2=as=>as.length?as.map(id=>esc(aiFirst(P(id)||{name:'?'}))).join(', '):'Anyone';
    if(!list.length)return `No tasks for ${esc(lab(r))}.`;
    if(r.from>t)return `<b>${plural(list.length,'task')} (${esc(lab(r))}).</b>`+aiTbl(['Task','Due','Who'],list.slice(0,20).map(z=>[esc(z.x.title),(r.one?'':fdate(z.d)+' ')+(z.x.time?fT(mins(z.x.time)):'Anytime'),who2(z.as)]));
    if(/\b(completed|finished|done)\b/.test(s)&&!od&&!/\bnot done\b/.test(s))return `<b>${done} of ${all} tasks completed (${esc(lab(r))}).</b>`+(all?` That is ${Math.round(done/all*100)}%.`:'')+(nd.length?aiTbl(['Not done','Day','Who'],nd.slice(0,15).map(z=>[esc(z.x.title),fdate(z.d),who2(z.as)])):'');
    const show=od&&!W?nd.filter(z=>z.d<t):nd; if(od&&!W)return show.length?`<b>${plural(show.length,'overdue task')} (${esc(lab(r))}).</b>`+aiTbl(['Task','Day','Who'],show.slice(0,20).map(z=>[esc(z.x.title),fdate(z.d),who2(z.as)])):`Nothing is overdue (${esc(lab(r))}).`;
    return `<b>${done} of ${all} tasks done (${esc(lab(r))}).</b>`+(nd.length?aiTbl(['Not done',r.one?'Due':'Day','Who'],nd.slice(0,20).map(z=>[esc(z.x.title),r.one?(z.x.time?fT(mins(z.x.time)):'Anytime'):fdate(z.d),who2(z.as)])):'<p style="margin:6px 0 0">Everything is done.</p>') }
  // ---- missing details
  { const mm=s.match(/\b(?:no|without|missing|hasn.?t (?:got|set|been given)|haven.?t (?:got|set)|has not (?:got|set|been given)|have not (?:got|set)|not got|not (?:been )?given)\s+(?:an?\s+|their\s+)?(e-?mail|phone|mobile|number|hourly rate|rate|contract(?:ed)? hours|photo)\b/);
    if(mm){ if(!adm&&!feat(m,'people'))return 'Only managers with People access can see that.'; const k=mm[1].replace('-',''); const f=/mail/.test(k)?p=>!p.email:/phone|mobile|number/.test(k)?p=>!p.phone:/rate/.test(k)?p=>!p.rate:/contract/.test(k)?p=>!contractMin(p):p=>!p.photo; const o=ppl.filter(p=>!p.noTrack&&f(p));
      return o.length?`<b>${plural(o.length,'person','people')} with no ${esc(mm[1])} on file.</b> ${o.map(p=>esc(p.name)).join(', ')}.`:`Everyone has ${esc(mm[1])} on file.` } }
  // ---- what needs attention / problems
  if(!per2&&/\b(unusual|attention|problems?|issues?|wrong|worry|worried|concerns?|needs? (my )?(attention|action|doing|looking)|look at|anything (else|wrong|odd|strange)|everything (ok|fine|okay)|all (ok|fine|okay)|on track|quick update|update me|what.?s (up|new)|where are we|to do list|my to.?do)\b/.test(s)&&!/\b(tasks?|checklist)\b/.test(s)){
    const rotaOnly=/\brota\b/.test(s), r=W||aiRange(addD(t,-6),t,'the last 7 days'); const items=[]; const add=x=>items.push(x);
    if(!rotaOnly){ const mo=S.entries.filter(e=>ids.has(e.pid)&&e.out==null&&e.src!=='hours'&&e.date<t); if(mo.length)add(`<b>${plural(mo.length,'missing clock-out')}</b>: ${mo.slice(0,4).map(e=>esc(aiFirst(P(e.pid)))+' '+fdate(e.date)).join(', ')}.`);
      const v=aiVals(ppl,r); const ns=sum(ppl,p=>v[p.id].noshow); if(ns)add(`<b>${plural(ns,'shift')} with no clock-in</b> (${esc(lab(r))}).`); const lt=sum(ppl,p=>v[p.id].late); if(lt)add(`<b>${plural(lt,'late arrival')}</b> (${esc(lab(r))}): ${ppl.filter(p=>v[p.id].late).map(p=>esc(aiFirst(p))+' '+v[p.id].late).join(', ')}.`);
      const nb=sum(ppl,p=>v[p.id].nobrk); if(nb)add(`<b>${plural(nb,'day')} over 6 hours with no break</b> (${esc(lab(r))}).`);
      const pend=ppl.filter(p=>[0,1,2,3].some(i=>weekStatus(p,addD(WK,-7*i))==='pending')).length; if(pend)add(`<b>${plural(pend,'person','people')} with timesheets waiting for approval.</b>`);
      const lp=S.leave.filter(x=>x.st==='pending'&&ids.has(x.pid)).length; if(lp)add(`<b>${plural(lp,'time off request')} waiting for a decision.</b>`);
      const dc=ppl.filter(p=>!p.noTrack&&!docsComplete(p)).length; if(dc&&(adm||feat(m,'people')))add(`${plural(dc,'person','people')} still need documents.`) }
    const op=S.shifts.filter(x=>!x.pid&&x.date>=t&&x.date<=addD(t,13)); if(op.length)add(`<b>${plural(op.length,'open shift')}</b> in the next two weeks: ${op.slice(0,4).map(x=>fdate(x.date)).join(', ')}.`);
    const dr=S.shifts.filter(x=>x.pid&&ids.has(x.pid)&&!x.pub&&x.date>=t).length; if(dr)add(`<b>${plural(dr,'shift')} still draft</b> (not published).`);
    const six=ppl.filter(p=>{ for(let w=WK;w<=addD(WK,7);w=addD(w,7)){ if(new Set(aiDays(w,addD(w,6)).filter(d=>S.shifts.some(x=>x.pid===p.id&&x.date===d))).size>=6)return true } return false }); if(six.length)add(`${six.map(p=>esc(aiFirst(p))).join(', ')} ${six.length>1?'are':'is'} on the rota 6 or more days in a week.`);
    return items.length?`<b>Things to look at:</b><ul style="margin:6px 0 0;padding-left:18px">${items.map(x=>'<li>'+x+'</li>').join('')}</ul>`:'<b>Nothing needs attention right now.</b> No missing clock-outs, no late arrivals or missed shifts, nothing waiting for approval and no open shifts.' }
  // ---- reliability
  if(!per2&&/\b(reliable|reliability|dependable|best (employee|worker|member|person)|worst (employee|worker|member|person)|top performer|good employee|bad employee)\b/.test(s)){
    const r=W||aiRange(addD(WK,-21),t,'the last 4 weeks'); const v=aiVals(ppl,r); const rows=ppl.filter(p=>v[p.id].days+v[p.id].noshow>0).map(p=>({p,v:v[p.id],pc:v[p.id].days?Math.round((v[p.id].days-v[p.id].late)/v[p.id].days*100):0})).sort((a,b)=>a.v.noshow-b.v.noshow||b.pc-a.pc||b.v.days-a.v.days);
    return rows.length?`<b>I cannot judge quality of work, but here is punctuality and attendance (${esc(lab(r))}).</b> Fewest missed shifts and most on-time days first.`+aiTbl(['Member','Days worked','Late','Missed','On time'],rows.map(x=>[who(x.p),x.v.days,x.v.late,x.v.noshow,x.pc+'%'])):'No hours recorded in that period.' }
  // ---- pay rates
  if(/\b(earns?|earning|paid|pay rates?|hourly rates?|rates? of pay|highest paid|lowest paid|best paid|wage rates?)\b/.test(s)&&/\b(who|average|highest|lowest|most|least|list|everyone|each)\b/.test(s)&&!/\b(no|without|missing)\b/.test(s)&&!/\b(cost|total|bill)\b/.test(s)){
    if(!adm)return 'Only owners and admins can see pay rates.'; const rows=ppl.filter(p=>p.rate).sort((a,b)=>/\b(lowest|least)\b/.test(s)?a.rate-b.rate:b.rate-a.rate); if(!rows.length)return 'No hourly rates are set yet. You can set them on the People page.'; const avg=sum(rows,p=>p.rate)/rows.length;
    return `<b>${/\b(lowest|least)\b/.test(s)?'Lowest':'Highest'} rate: ${who(rows[0])} (${money(rows[0].rate)} an hour). Average ${money(avg)} an hour.</b>`+aiTbl(['Member','Hourly rate'],rows.map(p=>[who(p),money(p.rate)])) }
  // ---- most expensive shift / day
  if(/\bmost expensive\b|\bcostliest\b|\bhighest cost\b/.test(s)&&/\b(shift|day|person|member)\b/.test(s)){ if(!adm)return 'Only owners and admins can see labour cost.'; const r=W||aiRange(addD(WK,-7),addD(WK,-1),'last week'); const rate=id=>(P(id)||{}).rate||0, mn=x=>Math.max(0,(x.end<=x.start?x.end+1440:x.end)-x.start-(x.brk||0));
    if(/\bday\b/.test(s)){ const rows=aiDays(r.from,r.to).map(d=>[d,sum(S.shifts.filter(x=>x.date===d&&x.pid&&ids.has(x.pid)),x=>mn(x)/60*rate(x.pid))]).sort((a,b)=>b[1]-a[1]); return rows.length?`<b>Most expensive day: ${fdate(rows[0][0])} (${money(rows[0][1])}, planned) – ${esc(lab(r))}.</b>`+aiTbl(['Day','Planned cost'],rows.map(x=>[fdate(x[0]),money(x[1])])):'No shifts found.' }
    const rows=S.shifts.filter(x=>x.pid&&ids.has(x.pid)&&x.date>=r.from&&x.date<=r.to).map(x=>({x,c:mn(x)/60*rate(x.pid)})).sort((a,b)=>b.c-a.c).slice(0,6); return rows.length?`<b>Most expensive shift: ${who(P(rows[0].x.pid))}, ${fdate(rows[0].x.date)} (${money(rows[0].c)}, planned) – ${esc(lab(r))}.</b>`+aiTbl(['Member','Day','Shift','Cost'],rows.map(z=>[who(P(z.x.pid)),fdate(z.x.date),shT(z.x),money(z.c)])):'No shifts found.' }
  // ---- people by role
  if(/\b(who|list|show|which)\b.*\b(managers?|admins?|owners?|supervisors?|staff members|team leaders?)\b/.test(s)&&!/\b(working|on|today|tomorrow|rota|shift|late|hours)\b/.test(s)){ const want=/\bmanagers?\b/.test(s)?['manager']:/\badmins?\b/.test(s)?['admin']:/\bowners?\b/.test(s)?['owner']:['manager','admin','owner']; const o=ppl.filter(p=>want.includes(p.role)); return o.length?`<b>${plural(o.length,want.length===1?roleName(want[0]).toLowerCase():'manager/admin','')}.</b> ${o.map(p=>esc(p.name)+' ('+roleName(p.role)+')').join(', ')}.`.replace(/(\d+) (\w+)\./,'$1 $2.'):`Nobody has the ${want.join('/')} role on this list.` }
  // ---- early / late shift rosters
  if(/\bwho\b/.test(s)&&/\b(works?|working|does|do|on)\b/.test(s)&&/\b(mornings?|evenings?|early shifts?|late shifts?|opening shifts?|closing shifts?|nights?)\b/.test(s)&&!/\b(this|tonight|tomorrow|today|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(s.replace(/\bworks? (the )?/,''))){
    const early=/\b(mornings?|early|opening)\b/.test(s); const r=W||aiRange(t,addD(t,13),'the next two weeks'); const cnt={}; S.shifts.filter(x=>x.pid&&ids.has(x.pid)&&x.date>=r.from&&x.date<=r.to&&(early?x.start<=600:(x.end>=1080||x.end<=x.start))).forEach(x=>{ cnt[x.pid]=(cnt[x.pid]||0)+1 });
    const rows=Object.keys(cnt).map(id=>[P(id),cnt[id]]).filter(x=>x[0]).sort((a,b)=>b[1]-a[1]); return rows.length?`<b>${early?'Mornings (starting by 10:00)':'Evenings (finishing 18:00 or later)'} – ${esc(lab(r))}.</b>`+aiTbl(['Member','Shifts'],rows.map(x=>[who(x[0]),x[1]])):`Nobody has ${early?'a morning':'an evening'} shift (${esc(lab(r))}).` }
  // ---- busiest time of day
  if(/\b(busiest|quietest|peak|slowest)\b.*\b(time|hour)s?\b|\b(time|hour)s? of (the )?day\b.*\b(busiest|quietest|most|fewest)\b|\bwhen (are|is) we (busiest|quietest)\b/.test(s)){ const r=W||aiRange(WK,addD(WK,6),'this week'); const days=aiDays(r.from,r.to); const hrs=[]; for(let h=6;h<24;h++){ let n=0; days.forEach(d=>S.shifts.filter(x=>x.date===d&&x.pid&&ids.has(x.pid)).forEach(x=>{ const en=x.end<=x.start?x.end+1440:x.end; if(x.start<=h*60+30&&en>h*60+30)n++ })); hrs.push([h,n/days.length]) }
    const hi=hrs.slice().sort((a,b)=>b[1]-a[1])[0], lo=hrs.filter(x=>x[1]>0).sort((a,b)=>a[1]-b[1])[0]; if(!hi||!hi[1])return `Nobody is on the rota (${esc(lab(r))}).`;
    return `<b>Busiest on the rota: ${fT(hi[0]*60)} with ${Math.round(hi[1]*10)/10} people on average. Quietest while open: ${fT(lo[0]*60)} (${Math.round(lo[1]*10)/10}) – ${esc(lab(r))}.</b>`+aiTbl(['Time','People on average'],hrs.filter(x=>x[1]>0).map(x=>[fT(x[0]*60),Math.round(x[1]*10)/10])) }
  // ---- which weekday is busiest / quietest / latest
  if(/\b(day of the week|weekdays?|each day|every day of the week)\b/.test(s)&&/\b(most|least|fewest|busiest|quietest|worst|best|late|biggest)\b/.test(s)||(/\bwhich day\b.*\blate\b/.test(s))){
    const r=(W&&!/\bof the week\b/.test(s))?W:aiRange(addD(WK,-35),addD(WK,-1),'the last 5 weeks'); const late=/\blate\b/.test(s); const rows=[0,1,2,3,4,5,6].map(i=>{ let h=0,l=0,n=0,pp=0; aiDays(r.from,r.to).filter(d=>dow(d)===i&&d<=t).forEach(d=>{ n++; ppl.forEach(p=>{ const dc=dayCalc(p,d,false); h+=dc.worked; if(dc.n)pp++; if(dc.late>LATE_GRACE)l++ }) }); return {i,n,h:n?h/n:0,l,pp:n?pp/n:0} }).filter(x=>x.n);
    const key=late?'l':'h', asc=/\b(least|fewest|quietest)\b/.test(s), best=rows.slice().sort((a,b)=>asc?a[key]-b[key]:b[key]-a[key])[0]; if(!best)return 'No history yet.'; const dn=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    return late?`<b>Most late arrivals: ${dn[best.i]}s (${best.l} in ${esc(lab(r))}).</b>`+aiTbl(['Weekday','Late arrivals'],rows.map(x=>[dn[x.i],x.l])):`<b>${asc?'Quietest':'Busiest'} weekday: ${dn[best.i]} (about ${fd(best.h)} on average, ${esc(lab(r))}).</b>`+aiTbl(['Weekday','Average hours','Average people'],rows.map(x=>[dn[x.i],fd(x.h),Math.round(x.pp*10)/10])) }
  // ---- breaks over / under N minutes, longest and shortest break
  { const mb=s.match(/\bbreaks?\b.*?\b(over|longer than|more than|above|under|shorter than|less than|below)\s+(\d+)\s*(?:min|mins|minutes)\b/);
    if(mb&&!/\b(compare|versus|vs)\b/.test(s)){ const hi=/over|longer|more|above/.test(mb[1]), lim=+mb[2]; const r=W||aiRange(WK,addD(WK,6),'this week'); const rows=[]; (per2||ppl).forEach(p=>aiDays(r.from,r.to).filter(d=>d<=t).forEach(d=>{ const dc=dayCalc(p,d,false); if(dc.n&&!dc.open&&(hi?dc.brk>lim:dc.brk>0&&dc.brk<lim))rows.push([who(p),fdate(d),dc.brk+' min']) }));
      return rows.length?`<b>${plural(rows.length,'break')} ${hi?'over':'under'} ${lim} minutes (${esc(lab(r))}).</b>`+aiTbl(['Member','Day','Break'],rows.slice(0,30)):`No breaks ${hi?'over':'under'} ${lim} minutes (${esc(lab(r))}).` }
    if(/\b(longest|shortest|biggest)\b.*\bbreaks?\b|\bbreaks?\b.*\b(longest|shortest)\b/.test(s)&&/\b(how long|what|which|when|was|is)\b/.test(s)&&!/\bwho\b/.test(s)){ const r=W||aiRange(addD(WK,-7),addD(WK,-1),'last week'); const sh=/shortest/.test(s); let best=null; (per2||ppl).forEach(p=>aiDays(r.from,r.to).filter(d=>d<=t).forEach(d=>{ const dc=dayCalc(p,d,false); if(dc.n&&!dc.open&&dc.brk>0&&(!best||(sh?dc.brk<best.b:dc.brk>best.b)))best={p,d,b:dc.brk} }));
      return best?`<b>${sh?'Shortest':'Longest'} break: ${best.b} min, ${who(best.p)} on ${fdate(best.d)} (${esc(lab(r))}).</b>`:`No breaks recorded (${esc(lab(r))}).` } }
  // ---- late every week
  if(!per2&&/\b(every|each|every single) week\b|\bweek after week\b/.test(s)&&/\blate\b/.test(s)){ const wks=[1,2,3,4].map(i=>aiRange(addD(WK,-7*i),addD(WK,-7*i+6))); const vs=wks.map(r=>aiVals(ppl,r)); const o=ppl.filter(p=>vs.every(v=>v[p.id].late>0)); const some=ppl.filter(p=>vs.filter(v=>v[p.id].late>0).length>=2&&!o.includes(p));
    return (o.length?`<b>${plural(o.length,'person','people')} late in each of the last 4 weeks:</b> ${o.map(p=>esc(aiFirst(p))).join(', ')}.`:'<b>Nobody was late in every one of the last 4 weeks.</b>')+(some.length?` Late in 2 or 3 of them: ${some.map(p=>esc(aiFirst(p))).join(', ')}.`:'') }
  // ---- newest / longest serving
  if(/\b(newest|latest|most recent|recently)\b.*\b(member|starter|hire|person|staff|joined|started)\b|\bwho (joined|started)\b.*\b(recently|last)\b|\b(longest serving|longest.?standing|been here (the )?longest|oldest member|who has been here longest)\b/.test(s)&&!per2){ const old=/\b(longest|oldest)\b/.test(s); const rows=ppl.filter(p=>p.start).sort((a,b)=>old?(a.start<b.start?-1:1):(a.start<b.start?1:-1)); return rows.length?`<b>${old?'Longest serving':'Newest'}: ${who(rows[0])}, started ${fdate(rows[0].start)} ${rows[0].start.slice(0,4)}.</b>`+aiTbl(['Member','Started'],rows.slice(0,10).map(p=>[who(p),fdate(p.start)+' '+p.start.slice(0,4)])):'No start dates are on file.' }
  // ---- next shift of someone
  if(per2&&per2.length&&/\b(next (shift|time|day)|when (is|does|will|are)\b.*\b(next|back|working|work|start|in)\b|when.?s .* (next|working)|next working)\b/.test(s)&&!W){
    return per2.map(p=>{ const nm=nowMin(); const x=S.shifts.filter(z=>z.pid===p.id&&(z.date>t||(z.date===t&&z.end>nm))).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.start-b.start)[0]; return x?`<b>${who(p)}'s next shift: ${x.date===t?'today':fdate(x.date)}, ${shT(x)}.</b>`:`${who(p)} has no shift on the rota yet.` }).join('<br>') }
  // ---- morning / afternoon / evening
  { const win=/\bmorning\b/.test(s)?[360,720,'morning']:/\bafternoon\b/.test(s)?[720,1020,'afternoon']:/\b(evening|tonight|night)\b/.test(s)?[1020,1440,'evening']:null;
    if(win&&/\bwho\b/.test(s)&&/\b(working|on|in|here|there|scheduled|rota|coming)\b/.test(s)&&!/\b(open|clos)/.test(s)){ const r=W||aiRange(t,t,'today'); const rows=[];
      aiDays(r.from,r.to).slice(0,7).forEach(d=>{ const on=S.shifts.filter(x=>x.date===d&&x.pid&&ids.has(x.pid)&&x.start<win[1]&&(x.end>win[0]||x.end<=x.start)).sort((a,b)=>a.start-b.start); rows.push([fdate(d),on.length?on.map(x=>esc(aiFirst(P(x.pid)))+' ('+fT(x.start)+')').join(', '):'Nobody']) });
      return `<b>${esc(lab(r))}, ${win[2]} (${fT(win[0])}–${(win[1]>=1440?'24:00':fT(win[1]))}).</b>`+aiTbl(['Day','Who'],rows).replace(/ class="r num"/g,'') } }
  // ---- what time does someone start / finish
  if(per2&&per2.length===1&&/\bwhat time\b|\bwhen\b.*\b(start|finish|end|leave|come in)\b/.test(s)&&/\b(start|starts|begin|begins|finish|finishes|end|ends|leave|leaves|clock|come in|in|off)\b/.test(s)&&(!W||W.one)&&!/\bnext\b/.test(s)){
    const p=per2[0], d=W?W.from:t, f=esc(aiFirst(p)), dd=d===t?'today':fdate(d); const x=S.shifts.filter(z=>z.pid===p.id&&z.date===d).sort((a,b)=>a.start-b.start)[0]; if(!x)return `${f} has no shift ${dd}.`;
    return /\b(finish|finishes|end|ends|leave|leaves|off)\b/.test(s)?(x.ne?`${f} starts at ${fT(x.start)} ${dd} and has no fixed finish time.`:`${f} finishes at ${fT(x.end)} ${dd}.`):`${f} starts at ${fT(x.start)} ${dd}.` }
  // ---- time-based: opening, closing, who is in at a time
  const tm=s.match(/\b(?:at|around|by|from)\s+(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\b/);
  if(/\b(who (is |are |will be )?(opening|closing|opens|closes)|opener|closer|who opens|who closes|first in|last out|earliest|latest)\b/.test(s)||(tm&&/\bwho\b/.test(s)&&/\b(in|working|on|here|there)\b/.test(s))){
    const r=W||aiRange(t,t,'today'); const rows=[];
    aiDays(r.from,r.to).slice(0,7).forEach(d=>{ const sh=S.shifts.filter(x=>x.date===d&&x.pid&&ids.has(x.pid)); if(!sh.length)return;
      if(tm&&!/\b(open|clos|earliest|latest|first|last)/.test(s)){ let h=+tm[1]; const ap=tm[3]; if(ap==='pm'&&h<12)h+=12; if(ap==='am'&&h===12)h=0; if(!ap&&h>=1&&h<=6)h+=12; const mm=h*60+(+tm[2]||0); const on=sh.filter(x=>x.start<=mm&&(x.end>mm||x.end<x.start)); rows.push([fdate(d)+' '+fT(mm),on.length?on.map(x=>esc(aiFirst(P(x.pid)))).join(', '):'Nobody']) }
      else { const e=sh.slice().sort((a,b)=>a.start-b.start)[0], l=sh.slice().sort((a,b)=>b.end-a.end)[0]; rows.push([fdate(d),`Opens: ${esc(aiFirst(P(e.pid)))} (${fT(e.start)}). Closes: ${esc(aiFirst(P(l.pid)))} (${fT(l.end)})`]) } });
    return rows.length?`<b>${esc(lab(r))}</b>`+aiTbl(['Day','Who'],rows).replace(/ class="r num"/g,''):'No shifts found for that day.' }
  // ---- how many people on a day / per day
  if(!/\b(average|avg)\b/.test(s)&&/\bhow many (people|staff|members|workers|bodies)\b.*\b(working|on|in|scheduled|rota|covering|are)\b|\bheadcount (on|for)\b|\bstaffing\b|\bstaff levels?\b|\bcover levels?\b/.test(s)){
    const r=W||aiRange(t,addD(t,6),'the next 7 days'); const rows=aiDays(r.from,r.to).slice(0,14).map(d=>{ const sh=S.shifts.filter(x=>x.date===d&&x.pid&&ids.has(x.pid)); return [fdate(d),String(new Set(sh.map(x=>x.pid)).size)+' people'+(S.shifts.some(x=>x.date===d&&!x.pid)?' + open shift':'')] });
    return `<b>People on the rota (${esc(lab(r))}).</b>`+aiTbl(['Day','Staff'],rows) }
  // ---- who is on time every day
  if(/\bon time (every|all|each)|never (been )?late|always on time|never late|punctual every\b/.test(s)&&!per2){ const r=W||aiRange(addD(WK,-7),addD(WK,-1),'last week'); const v=aiVals(ppl,r); const o=ppl.filter(p=>v[p.id].days>0&&v[p.id].late===0);
    return o.length?`<b>${plural(o.length,'person','people')} on time every day they worked (${esc(lab(r))}).</b> ${o.map(p=>esc(aiFirst(p))+' ('+plural(v[p.id].days,'day')+')').join(', ')}.`:`Nobody was on time every day (${esc(lab(r))}).` }
  // ---- holiday balance
  if(/\b(holiday|annual leave|leave|time off)\b.*\b(left|remaining|balance|allowance|entitle|used|taken|booked so far)\b|\b(most|least|fewest)\b.*\b(holiday|leave|days off)\b|\bhow (much|many) (holiday|leave|days off)\b|\bdays (left|remaining)\b/.test(s)){
    const pol=S.policies.find(x=>/annual|holiday/i.test(x.name))||S.policies[0]; const yr=t.slice(0,4); const list=per2||ppl; if(!pol)return 'No leave policy is set up.';
    const lf=/\b(left|remaining)\b/.test(s), rk=/\b(most|least|fewest)\b/.test(s), asc=lf?/\bmost\b/.test(s):/\b(least|fewest)\b/.test(s); const rowsH=list.map(p=>({p,u:leaveUsed(p.id,pol.id,yr)})); if(rk)rowsH.sort((a,b)=>asc?a.u-b.u:b.u-a.u);
    return `<b>${esc(pol.name)} ${yr}: ${pol.ent} days a year.</b>`+(rk&&rowsH.length?`<p style="margin:4px 0">${lf?(asc?'Most left: ':'Least left: '):(asc?'Fewest used: ':'Most used: ')}${who(rowsH[0].p)} (${lf?(Number(pol.ent||0)-rowsH[0].u)+' days left':rowsH[0].u+' days used'}).</p>`:'')+aiTbl(['Member','Used','Left'],rowsH.map(x=>[who(x.p),plural(x.u,'day'),plural(Number(pol.ent||0)-x.u,'day')])) }
  // ---- no shifts / no day off / contract
  if(/\b(no shifts?|without (a )?shifts?|not (on|been given|got) (the )?(rota|a shift|any shifts?)|nothing (booked|scheduled|on)|unscheduled|not rostered)\b|\bwho (has|have|hasn.?t|haven.?t) (got |any |a )?(shifts?|rota)\b/.test(s)&&/\bno\b|\bwithout\b|\bnot\b|\bn.?t\b|nothing|unscheduled/.test(s)){
    const r=W||aiRange(addD(wkStart(t),7),addD(wkStart(t),13),'next week'); const o=ppl.filter(p=>!S.shifts.some(x=>x.pid===p.id&&x.date>=r.from&&x.date<=r.to)&&!p.trial);
    return o.length?`<b>${plural(o.length,'person','people')} with no shifts (${esc(lab(r))}).</b> ${o.map(p=>esc(p.name)).join(', ')}.`:`Everyone has at least one shift (${esc(lab(r))}).` }
  if(/\b(no day off|day off|rest day|days? in a row|seven days|7 days|six days|6 days|every day|no rest)\b/.test(s)&&/\bwho\b|\bany(one|body)\b/.test(s)&&!/\bleave|holiday|time off|\bdays? off (on|tomorrow|today)\b/.test(s)){
    const r=W||aiRange(wkStart(t),addD(wkStart(t),6),'this week'); const th=/\b(no day off|seven days|7 days|no rest|every day)\b/.test(s)?7:6; const all=ppl.map(p=>({p,n:new Set(aiDays(r.from,r.to).filter(d=>S.shifts.some(x=>x.pid===p.id&&x.date===d)||(d<=t&&dayCalc(p,d,false).worked>0))).size})).sort((a,b)=>b.n-a.n); const o=all.filter(x=>x.n>=th);
    return o.length?`<b>${plural(o.length,'person','people')} working ${th===7?'all 7 days':'6 or more days'} (${esc(lab(r))}).</b>`+aiTbl(['Member','Days'],o.map(x=>[who(x.p),x.n])):`Nobody works ${th===7?'all 7 days':'6 or more days'} (${esc(lab(r))}).${all.length&&all[0].n?` The most is ${all[0].n} days (${all.filter(x=>x.n===all[0].n).map(x=>esc(aiFirst(x.p))).join(', ')}).`:''}` }
  if(/\bcontract(ed)?\b/.test(s)){ const r=W||aiRange(wkStart(t),addD(wkStart(t),6),'this week'); const rc=rangeCalc(ppl,r.from,r.to<t?r.to:t,false); const c=ppl.filter(p=>contractMin(p)>0); if(!c.length)return 'Nobody has contracted hours set (everyone is zero-hour), so there is nothing to compare. You can set them on the People page.'; return `<b>Worked against contracted hours (${esc(lab(r))}).</b>`+aiTbl(['Member','Contract','Worked','Difference'],c.map(p=>{ const w=rc.byPerson[p.id].worked, k=contractMin(p)*(r.one?1:Math.max(1,Math.round(aiDays(r.from,r.to).length/7))); return [who(p),fd(k),fd(w),(w>=k?'+':'-')+fd(Math.abs(w-k))] })) }
  // ---- trial / admin lists
  if(/\b(trial|trials|on trial)\b/.test(s)){ const o=ppl.filter(p=>p.trial); return o.length?`<b>${plural(o.length,'person','people')} on trial.</b>`+aiTbl(['Member','Trial day'],o.map(p=>[who(p),fdate(p.trial.date)])):'Nobody is on a trial right now.' }
  if(/\b(no pin|without a pin|pin (not|isn.?t) set|haven.?t (got|set) a pin|(not|n.?t) (been )?(given|got|set|have) (a )?pin)\b/.test(s)){ if(!isAdmin(m)&&!feat(m,'people'))return 'Only managers with People access can see that.'; const o=ppl.filter(p=>!p.pin&&p.role!=='owner'); return o.length?`<b>${plural(o.length,'person','people')} without a PIN.</b> ${o.map(p=>esc(p.name)).join(', ')}. Settings, Users, Give everyone a PIN.`:'Everyone has a PIN.' }
  // ---- over / under a number of hours, or a number of times
  { const NW={once:1,twice:2,'three times':3,'four times':4,'five times':5,thrice:3};
    const mc=s.match(/\b(more than|over|at least|fewer than|less than|under|exactly|at most)\s+(\d+|once|twice|thrice|three times|four times|five times)(?:\s*times?)?\b(?!\s*(?:hours?|hrs?|h|minutes?|mins?|days?|weeks?))/);
    if(mc&&!per2&&/\bwho\b|\bhow many (people|staff)\b/.test(s)&&/\b(late|missed|no.?shows?|absent|worked weekends?|weekends?)\b/.test(s)){ const n=NW[mc[2]]||+mc[2], op=mc[1]; const r=W||aiRange(t.slice(0,8)+'01',monthEnd(t),'this month'); const v=aiVals(ppl,r); const key=/\blate\b/.test(s)?'late':/\bweekend/.test(s)?'weekend':'noshow'; const ok=x=>/more than|over/.test(op)?x>n:/at least/.test(op)?x>=n:/at most/.test(op)?x<=n:/exactly/.test(op)?x===n:x<n;
      const rows=ppl.filter(p=>ok(v[p.id][key])&&(key!=='late'||/fewer|less|under|at most|exactly/.test(op)?true:true)).filter(p=>/more than|over|at least|exactly/.test(op)?v[p.id][key]>0||n===0:v[p.id].days>0).sort((a,b)=>v[b.id][key]-v[a.id][key]);
      return rows.length?`<b>${plural(rows.length,'person','people')} ${key==='late'?'late':'with missed shifts'} ${esc(op)} ${esc(mc[2])}${/\d$/.test(mc[2])?' times':''} (${esc(lab(r))}${r.to>t?', so far':''}).</b>`+aiTbl(['Member',key==='late'?'Late arrivals':'Count'],rows.map(p=>[who(p),v[p.id][key]])):`Nobody (${esc(lab(r))}).` }
    const mt=s.match(/\b(over|more than|above|exceed(?:ed|ing|s)?|at least|under|less than|below|fewer than|close to|near|nearly|approaching|almost)\s+(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?)\b/)||(/\b(close to|near|nearing|approaching) overtime\b/.test(s)?['','close to','35','hours']:null);
    if(mt&&/\b(who|which|any(one|body)|how many)\b/.test(s)&&!/\bbreak\b/.test(s)&&!/\bno break\b/.test(s)&&!per2){ const lim=+mt[2]*(/^m/.test(mt[3])?1:60), near=/close|near|approach|almost/.test(mt[1]), hi=/over|more|above|exceed|at least/.test(mt[1]); const day=/\b(in a day|one day|a day|single day|per day|in one shift|a shift|one shift|shift|day)\b/.test(s)&&!/\bweek|month\b/.test(s.replace(/\b(last|this) (week|month)\b/g,' '));
      const r=W||aiRange(addD(WK,-7),addD(WK,-1),'last week');
      if(day){ const rows=[]; aiDays(r.from,r.to).filter(d=>d<=t).forEach(d=>ppl.forEach(p=>{ const dc=dayCalc(p,d,false); if(dc.n&&!dc.open&&(hi?dc.worked>=lim:(near?dc.worked>=lim*0.85&&dc.worked<=lim:dc.worked<=lim)))rows.push([who(p),fdate(d),fd(dc.worked)]) }));
        return rows.length?`<b>${plural(rows.length,'shift')} ${near?'close to':hi?'over':'under'} ${esc(mt[2])} ${esc(mt[3])} (${esc(lab(r))}).</b>`+aiTbl(['Member','Day','Worked'],rows.slice(0,30)):`No shifts ${near?'close to':hi?'over':'under'} ${esc(mt[2])} ${esc(mt[3])} (${esc(lab(r))}).` }
      const W2=near&&!W?aiRange(WK,addD(WK,6),'this week'):r; const v=aiVals(ppl,W2); const rows=ppl.filter(p=>near?(v[p.id].worked>=lim*0.85&&v[p.id].worked<lim):hi?v[p.id].worked>=lim:(v[p.id].worked>0&&v[p.id].worked<=lim)).sort((a,b)=>near||hi?v[b.id].worked-v[a.id].worked:v[a.id].worked-v[b.id].worked);
      return rows.length?`<b>${plural(rows.length,'person','people')} ${near?'close to':hi?'over':'under'} ${esc(mt[2])} ${esc(mt[3])} (${esc(lab(W2))}${W2.to>t?', so far':''}).</b>`+aiTbl(['Member','Worked'],rows.map(p=>[who(p),fd(v[p.id].worked)])):`Nobody is ${near?'close to':hi?'over':'under'} ${esc(mt[2])} ${esc(mt[3])} (${esc(lab(W2))}).` } }
  // ---- how late / on time was someone
  if(per2&&per2.length===1&&/\b(how late|on time|punctual|late)\b/.test(s)&&!/\b(times|many|total|most|compare|vs|versus|ever|always|often|last time|minutes)\b/.test(s)&&(!W||W.one)){ const p=per2[0], d=W?W.from:t, f=esc(aiFirst(p)), dc=dayCalc(p,d,false), sh=S.shifts.filter(x=>x.pid===p.id&&x.date===d).sort((a,b)=>a.start-b.start)[0], dd=d===t?'today':fdate(d);
    if(!dc.n)return sh?(d===t&&nowMin()<sh.start+LATE_GRACE?`${f} is not due until ${fT(sh.start)} ${dd}.`:`<b>${f} did not clock in ${dd}</b> (shift ${shT(sh)}).`):`${f} had no shift and no hours ${dd}.`;
    return dc.late>LATE_GRACE?`<b>${/\bon time|punctual|\bwas .* late\b|\bis .* late\b/.test(s)&&!/how late/.test(s)?'Yes, ':''}${f} was ${dc.late} min late ${dd}.</b> Clocked in at ${fT(dc.first)}${sh?' for a '+fT(sh.start)+' start':''}.`:`<b>${f} was on time ${dd}.</b> Clocked in at ${fT(dc.first)}${sh?' for a '+fT(sh.start)+' start':''}.` }
  // ---- when was someone last ...
  if(per2&&per2.length===1&&(/\bwhen\b.*\blast\b|\blast time\b/.test(s))&&/\b(late|work|worked|working|in|clocked|off|holiday|leave|sick|away|missed|break)\b/.test(s)){ const p=per2[0], f=esc(aiFirst(p));
    if(/\blate\b/.test(s)){ for(let d=t;d>=addD(t,-150);d=addD(d,-1)){ const dc=dayCalc(p,d,false); if(dc.late>LATE_GRACE)return `<b>${f} was last late on ${fdate(d)}</b> (${dc.late} min).` } return `${f} has not been late in the last 150 days.` }
    if(/\b(off|holiday|leave|sick|away)\b/.test(s)){ const l=S.leave.filter(x=>x.pid===p.id&&x.st!=='rejected'&&x.from<=t).sort((a,b)=>a.to<b.to?1:-1)[0]; return l?`<b>${f} was last off ${lvRange(l)}.</b>`:`${f} has no time off on record.` }
    for(let d=t;d>=addD(t,-150);d=addD(d,-1)){ if(dayCalc(p,d,false).n)return `<b>${f} last worked on ${d===t?'today':fdate(d)}.</b>` } return `${f} has no hours in the last 150 days.` }
  // ---- left early / stayed late / came in early
  if(/\b(left early|clocked out early|finished early|early finish|stayed late|worked late|clocked out late|finished late|went over|past (their|the) shift|after (their|the) shift|clocked in early|arrived early|came in early|early arrival|in early)\b/.test(s)){
    const r=W||aiRange(WK,addD(WK,6),'this week'); const kind=/\b(clocked in early|arrived early|came in early|early arrival|in early)\b/.test(s)?'in':/\b(stayed late|worked late|clocked out late|finished late|went over|past|after)\b/.test(s)?'over':'early'; const rows=[];
    (per2||ppl).forEach(p=>aiDays(r.from,r.to).filter(d=>d<=t).forEach(d=>{ const sh=S.shifts.find(x=>x.pid===p.id&&x.date===d); if(!sh)return; const dc=dayCalc(p,d,false); if(!dc.n||dc.open||dc.last==null)return;
      if(kind==='in'&&dc.first!=null&&dc.first<sh.start-10)rows.push([who(p),fdate(d),fT(sh.start),fT(dc.first),(sh.start-dc.first)+' min early']);
      if(kind==='early'&&dc.last<sh.end-15)rows.push([who(p),fdate(d),fT(sh.end),fT(dc.last),(sh.end-dc.last)+' min early']);
      if(kind==='over'&&dc.last>sh.end+15)rows.push([who(p),fdate(d),fT(sh.end),fT(dc.last),(dc.last-sh.end)+' min over']) }));
    const nm=kind==='in'?'arrived early':kind==='early'?'left early':'stayed past their shift';
    return rows.length?`<b>${plural(rows.length,'time')} someone ${nm} (${esc(lab(r))}).</b>`+aiTbl(['Member','Day',kind==='in'?'Shift start':'Shift end',kind==='in'?'Clocked in':'Clocked out','Difference'],rows.slice(0,30)):`Nobody ${nm} by more than ${kind==='in'?10:15} minutes (${esc(lab(r))}).` }
  // ---- who is working with someone
  if(per2&&per2.length===1&&/\bwho\b.*\b(with|alongside|same (time|shift)|overlap\w*)\b/.test(s)&&!/\bwho (is|are) working with\b.*\b(hours|rota)\b/.test(s)){ const p=per2[0], f=esc(aiFirst(p)); const r=W||aiRange(t,t,'today'); const rows=[];
    aiDays(r.from,r.to).slice(0,7).forEach(d=>{ const mine=S.shifts.filter(x=>x.pid===p.id&&x.date===d); if(!mine.length)return; const en=a=>a.end<=a.start?a.end+1440:a.end; const oth=S.shifts.filter(x=>x.date===d&&x.pid&&x.pid!==p.id&&ids.has(x.pid)&&mine.some(a=>x.start<en(a)&&(en(x)>a.start))); rows.push([fdate(d)+' ('+mine.map(shT).join(', ')+')',oth.length?oth.map(x=>esc(aiFirst(P(x.pid)))+' '+fT(x.start)).join(', '):'Nobody else']) });
    return rows.length?`<b>Working with ${f} (${esc(lab(r))}).</b>`+aiTbl(['Day','Who'],rows).replace(/ class="r num"/g,''):`${f} is not on the rota (${esc(lab(r))}).` }
  // ---- staffing by day: busiest, quietest, short
  if(/\b(which|what) days?\b.*\b(most|fewest|least|busiest|quietest|understaffed|short|thin|overstaffed|best covered|well covered|worst)\b|\bunderstaffed|\boverstaffed|\bare we short|\benough (staff|people|cover)|\bshort.?staffed|\bshort on (staff|people)|\bquietest day|\bbusiest day on the rota|\b(average|avg)\b.*\b(team size|staff|people)\b.*\b(per|a|each) day\b|\bstaff on average\b/.test(s)){
    const r=W||aiRange(WK,addD(WK,6),'this week'); const rows=aiDays(r.from,r.to).slice(0,14).map(d=>{ const sh=S.shifts.filter(x=>x.date===d&&x.pid&&ids.has(x.pid)); const op=S.shifts.filter(x=>x.date===d&&!x.pid).length; return {d,n:new Set(sh.map(x=>x.pid)).size,mn:sum(sh,x=>Math.max(0,(x.end<=x.start?x.end+1440:x.end)-x.start-(x.brk||0))),op} });
    if(/\b(average|avg|on average)\b/.test(s)){ const av=sum(rows,x=>x.n)/Math.max(1,rows.length); return `<b>On average ${Math.round(av*10)/10} people a day on the rota (${esc(lab(r))}).</b> Most: ${Math.max(...rows.map(x=>x.n))}, fewest: ${Math.min(...rows.map(x=>x.n))}.` }
    const tb=aiTbl(['Day','People','Rota hours','Open shifts'],rows.map(x=>[fdate(x.d),x.n,fd(x.mn),x.op||'–'])); if(!rows.length)return 'No days found.';
    if(rows.length===1){ const x=rows[0]; return `<b>${x.n} ${x.n===1?'person':'people'} on the rota ${esc(lab(r))}${x.op?`, with ${plural(x.op,'open shift')} still to fill`:', and no open shifts'}.</b> ${fd(x.mn)} planned.` }
    const hi=rows.slice().sort((a,b)=>b.n-a.n||b.mn-a.mn)[0], lo=rows.slice().sort((a,b)=>a.n-b.n||a.mn-b.mn)[0];
    if(/\b(short|understaffed|thin|worst|enough)\b/.test(s)){ const o=rows.filter(x=>x.op); return (o.length?`<b>${plural(o.length,'day')} with open shifts (${esc(lab(r))}):</b> ${o.map(x=>fdate(x.d)+' ('+x.op+')').join(', ')}. Quietest day: ${fdate(lo.d)} with ${lo.n} people.`:`<b>No open shifts (${esc(lab(r))}).</b> Fewest people: ${fdate(lo.d)} with ${lo.n}.`)+tb }
    return `<b>${/\b(fewest|least|quietest)\b/.test(s)?'Quietest':'Busiest'} day: ${fdate((/\b(fewest|least|quietest)\b/.test(s)?lo:hi).d)} with ${(/\b(fewest|least|quietest)\b/.test(s)?lo:hi).n} people (${esc(lab(r))}).</b>`+tb }
  // ---- one person: how are they doing
  if(per2&&per2.length===1&&/\b(how is|how.?s|how has|how was|how did|summary|summarise|summarize|tell me about|overview|profile|stats|statistics|report on|everything about|details)\b/.test(s)&&!/\b(hours?|late|breaks?|overtime|cost|shifts?|rota|when|next)\b/.test(s)){
    const p=per2[0], f=esc(aiFirst(p)); const r=W||aiRange(addD(WK,-21),t,'the last 4 weeks'); const v=aiVals([p],r)[p.id], wk=Math.max(1,aiDays(r.from,r.to<t?r.to:t).length/7); let h=`<b>${esc(p.name)} (${esc(lab(r))}).</b><ul style="margin:6px 0 0;padding-left:18px">`; const li=x=>{ h+=`<li>${x}</li>` };
    li(`${fd(v.worked)} worked over ${plural(v.days,'day')}${wk>1?', about '+fd(v.worked/wk)+' a week':''}.`); if(v.rota)li(`${fd(v.rota)} planned on the rota.`); if(v.brk&&v.days)li(`Average break ${Math.round(v.brk/v.days)} min a day.`);
    li(v.late?`Late ${plural(v.late,'time')} (${v.latemin} min in total).`:'Not late once.'); if(v.noshow)li(`${plural(v.noshow,'missed shift')}.`); if(v.longest)li(`Longest day ${fd(v.longest)}.`); if(v.weekend)li(`${fd(v.weekend)} on weekends.`); if(adm&&v.cost)li(`Labour cost ${money(v.cost)}.`);
    const nx=S.shifts.filter(z=>z.pid===p.id&&(z.date>t||(z.date===t&&z.end>nowMin()))).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.start-b.start)[0]; if(nx)li(`Next shift: ${nx.date===t?'today':fdate(nx.date)}, ${shT(nx)}.`);
    const pol=S.policies.find(x=>/annual|holiday/i.test(x.name))||S.policies[0]; if(pol)li(`Holiday: ${plural(Number(pol.ent||0)-leaveUsed(p.id,pol.id,t.slice(0,4)),'day')} left this year.`);
    const pw=[0,1,2,3].filter(i=>weekStatus(p,addD(WK,-7*i))==='pending').length; if(pw)li(`${plural(pw,'timesheet')} waiting for approval.`);
    return h+'</ul>' }
  // ---- yes / no questions about one person
  if(per2&&per2.length===1&&/^\s*(is|are|was|were|did|does|do|will|has|have)\b/.test(s)&&/\b(working|work|worked|in|on|off|scheduled|rota|rostered|clock(ed)? in|come in|turn(ed)? up|here|shift)\b/.test(s)&&!/\b(late|hours?|breaks?|overtime|cost|how much)\b/.test(s)&&(!W||W.one)){
    const p=per2[0], f=esc(aiFirst(p)), d=W?W.from:t, past=d<t||(d===t&&/\b(did|was|clock|worked)\b/.test(s)); const shs=S.shifts.filter(x=>x.pid===p.id&&x.date===d).sort((a,b)=>a.start-b.start), lv=leaveOn(p.id,d,true), dd=d===t?'today':fdate(d);
    if(!past)return shs.length?`<b>Yes.</b> ${f} is on ${dd}: ${shs.map(x=>shT(x)+(x.pub?'':' (draft)')).join(', ')}.`:lv?`<b>No.</b> ${f} has time off ${dd}.`:`<b>No.</b> ${f} has no shift ${dd}.`;
    const dc=dayCalc(p,d,false); if(dc.n){ const late=dc.late>LATE_GRACE?`, ${dc.late} min late`:', on time'; return `<b>Yes.</b> ${f} clocked in at ${fT(dc.first)}${dc.last!=null?' and out at '+fT(dc.last):' and is still in'} (${fd(dc.worked)}${shs.length?late:''}) on ${dd}.` }
    return shs.length?`<b>No.</b> ${f} was on the rota (${shT(shs[0])}) ${dd} but did not clock in.`:lv?`<b>No.</b> ${f} had time off ${dd}.`:`<b>No.</b> ${f} had no shift and no hours ${dd}.` }
  // ---- summaries and reports
  if(!per2&&(/\b(how (was|is|did|has|have|are)|how.?s)\b.*\b(week|month|yesterday|today|team|business|cafe|going|doing|we|everything)\b|\b(weekly|monthly|daily|week|month)\s+(report|summary|recap|review)\b|\b(report|review)\b.*\b(week|month|yesterday)\b|\bsummary\b|\brecap\b|\bbriefing\b|\bin numbers\b|\bto date\b|\bhow (was|went)\b.*\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(st|nd|rd|th)?)\b|\bhow .*\b(go|went|going)\b|\bthe numbers\b|\bon track\b/.test(s))&&!/\b(compare|versus|vs)\b/.test(s)&&(!aiMetrics(s).length||/\b(summary|recap|briefing|report|in numbers|the numbers)\b/.test(s))&&!/\b(hours?|late|breaks?|cost|overtime|shifts?|rota|timesheets?)\b.*\b(last|this|next)\b/.test(s.replace(/\b(last|this|next) (week|month)\b/g,' '))){
    const r=W||(/\bmonth/.test(s)?aiRange(t.slice(0,8)+'01',monthEnd(t),'this month'):/\bweekly report|\breport\b/.test(s)?aiRange(addD(WK,-7),addD(WK,-1),'last week'):/\bweek/.test(s)?aiRange(WK,addD(WK,6),'this week'):aiRange(t,t,'today')); return aiBrief(r,ppl) }
  // ---- metric engine: comparisons, breaks, rota hours, counts, groups, rankings
  const ps=aiAll(s), mets0=aiMetrics(s), cmp=/\b(compare|compared|comparison|versus|vs|against|difference|differ|change|changed|trend|than|more or less|up or down|better|worse|improve)\b/.test(s);
  const byGroup=/\b(by group|per group|each group|every group)\b/.test(s)||(gsel&&gsel.length>=2);
  const rankQ=/\b(who|which (person|member|staff|one|employee)|whose)\b/.test(s)&&!per2&&ps.length<2&&!cmp&&/\b(most|least|fewest|highest|lowest|biggest|largest|smallest|longest|shortest|top|worst|best|always|often|average|on average|busiest|hardest)\b/.test(s);
  const mets=mets0.slice(); const sbj=/\b(rota|scheduled|planned|rostered)\b.*\b(more|less|than|versus|vs|against)\b.*\b(worked|actual|clocked)\b|\b(worked|actual|clocked)\b.*\b(more|less|than|versus|vs|against)\b.*\b(rota|scheduled|planned|rostered)\b|\bover ?(staffed|scheduled)\b|\bunder ?(staffed|scheduled)\b/.test(s);
  if(sbj)['rota','worked'].forEach(k=>{ if(!mets.includes(k))mets.push(k) });
  const score=cmp&&!mets0.length&&!sbj&&!rankQ&&!/\b(who|which)\b/.test(s)&&ps.length>=1;
  const wantMetric=score||(mets.length&&(ps.length>=2||cmp||rankQ||sbj||/\bbreaks?\b|\brota hours\b|\b(scheduled|planned) hours\b|how many shifts|days worked|how many days|weekend|average|avg|longest|forecast|projected|no break|without a break|missed shifts?|minutes late|per hour|planned cost|rota cost|estimated cost|will be/.test(s)))||(mets.length&&(byGroup||(per2&&per2.length>=2)))||mets.includes('rota')||mets.includes('rotacost')||(mets.includes('cost')&&ps.length>0&&ps.every(r=>r.from>t));
  if(wantMetric||(ps.length>=2&&hasMetricWord)){
    const defP=/\b(always|often|on average|usually|typically|works?|average|avg|per week|a week|weekly)\b/.test(s)?aiRange(addD(WK,-28),addD(WK,-1),'the last 4 weeks'):aiRange(WK,addD(WK,6),'this week');
    let periods=ps.length?ps:[W||defP];
    if(periods.length===1&&cmp&&!rankQ&&!byGroup&&!(mets.includes('rota')&&mets.includes('worked'))&&!sbj&&!(per2&&per2.length>=2)&&/^last /.test(periods[0].label||'')){ const r=periods[0]; const cur=/month/.test(r.label)?aiRange(t.slice(0,8)+'01',monthEnd(t),'this month'):/weekend/.test(r.label)?aiRange(addD(WK,5),addD(WK,6),'this weekend'):aiRange(WK,addD(WK,6),'this week'); periods=[cur,r] }
    else if(periods.length===1&&cmp&&!rankQ&&!byGroup&&!(mets.includes('rota')&&mets.includes('worked'))&&!sbj&&!(per2&&per2.length>=2)){ const r=periods[0]; periods=[r,Object.assign(aiPrev(r),{label:/month/.test(r.label||'')?'the month before':/weekend/.test(r.label||'')?'the weekend before':'the week before'})]; if(/weekend/.test(r.label||''))periods[1]=Object.assign(aiRange(addD(r.from,-7),addD(r.to,-7)),{label:'the weekend before'}) }
    periods=periods.slice(0,4); let list=per2||ppl; const pls=periods.map(r=>esc(lab(r))); const psf=(k,r)=>r.to>t&&k!=='rota'&&k!=='rotacost'&&k!=='shifts'&&k!=='longestr'?' (so far)':'';
    const vals=periods.map(r=>aiVals(list,r)); const gtag=gOneG&&!byGroup?` (${esc(gOneG.name)})`:'';
    if(score){ const ks=['worked','rota','brk','late','noshow','ot','cost'].filter(k=>!(AIMET[k].admin&&!adm)); const rows=ks.map(k=>{ const tt=vals.map(v=>aiAgg(k,list,v)); const row=[AIMET[k].n].concat(tt.map(x=>aiFmtM(k,x))); if(periods.length===2){ const d=tt[0]-tt[1]; row.push((d>=0?'+':'-')+aiFmtM(k,Math.abs(d))+(tt[1]?' ('+(d>=0?'+':'-')+Math.abs(Math.round(d/tt[1]*100))+'%)':'')) } return row }).filter(r=>r.slice(1,1+periods.length).some(c=>!/^(0h 00m|0|£0\.00|0 min)$/.test(c)));
      return `<b>Comparison${per2?': '+per2.map(p=>esc(aiFirst(p))).join(', '):''}${gtag}.</b>`+aiTbl(['Measure'].concat(pls.map((x,i)=>x+psf('worked',periods[i]))).concat(periods.length===2?['Change']:[]),rows)+(()=>{ if(periods.length!==2)return ''; const ri=periods[0].from>=periods[1].from?0:1, oi=1-ri, pr=periods[ri]; if(!(pr.to>t&&pr.from<=t))return (periods.some(r=>r.to>t)?'<p class="mut" style="margin:6px 0 0;font-size:13px">Periods that are still running only count up to today.</p>':''); const n=aiDays(pr.from,t).length; const a2=aiAgg('worked',list,aiVals(list,aiRange(pr.from,t))), b2=aiAgg('worked',list,aiVals(list,aiRange(periods[oi].from,addD(periods[oi].from,n-1)))); return `<p style="margin:8px 0 0">Like for like (first ${plural(n,'day')} of each): ${fd(a2)} against ${fd(b2)}${b2?` (${a2>=b2?'+':'-'}${Math.abs(Math.round((a2-b2)/b2*100))}%)`:''}. The ${esc(lab(pr))} figures are only up to today.</p>` })() }
    let keys=(mets.length?mets:['worked']).filter(k=>!(AIMET[k].admin&&!adm)); if(!keys.length)return 'Only owners and admins can see labour cost.';
    keys=keys.map(k=>k==='cost'&&periods.every(r=>r.from>t)?'rotacost':k===('longest')&&periods.every(r=>r.from>t)?'longestr':k); if(keys.includes('latemin'))keys=keys.filter(k=>k!=='late'); if(keys.every(k=>k==='ot')&&!otOn())return 'Overtime is switched off, so none is counted. Turn it on in Settings, Time tracking.';
    // rota against worked, side by side
    if(keys.includes('rota')&&keys.includes('worked')&&periods.length===1){ const r=periods[0], v=vals[0]; const rows=list.map(p=>({p,a:v[p.id].rota,b:v[p.id].worked})).filter(x=>x.a||x.b).sort((x,y)=>y.a-x.a);
      const A=sum(rows,x=>x.a), B=sum(rows,x=>x.b), d=B-A;
      return `<b>Rota ${fd(A)}, worked ${fd(B)} (${esc(lab(r))}${r.to>t?', worked so far':''}): ${fd(Math.abs(d))} ${d>=0?'more':'less'} than planned.</b>`+aiTbl(['Member','Rota','Worked','Difference'],rows.map(x=>[who(x.p),fd(x.a),fd(x.b),(x.b>=x.a?'+':'-')+fd(Math.abs(x.b-x.a))]))+(r.to>t?'<p class="mut" style="margin:6px 0 0;font-size:13px">The rota counts the whole period; worked counts up to today.</p>':'') }
    // who ... the most / least
    if(rankQ&&periods.length===1){ let k=keys.find(x=>x!=='avg')||keys[0]; if(k==='avg'&&/\bhours\b/.test(s))k='worked'; const M=AIMET[k], r=periods[0], v=vals[0]; const asc=/\b(least|fewest|lowest|smallest|shortest)\b/.test(s)&&!(k==='late'&&/\bleast late\b/.test(s)===false&&false);
      const act=p=>v[p.id].worked>0||v[p.id].rota>0||v[p.id].shifts>0; const rows=list.filter(p=>asc?act(p):M.f(v[p.id])>0).map(p=>({p,x:M.f(v[p.id]),y:v[p.id]})).sort((a,b)=>asc?a.x-b.x:b.x-a.x);
      if(!rows.length)return `Nobody has any ${M.n.toLowerCase()} (${esc(lab(r))}).`; const wk=Math.max(1,aiDays(r.from,r.to).length/7); const avgW=/\b(on average|average|usually|typically)\b/.test(s)&&M.u==='min'&&wk>1;
      const extra=k==='late'?['Minutes late',x=>x.y.latemin+' min']:avgW?['Per week',x=>fd(x.x/wk)]:null;
      return `<b>${asc?'Lowest':'Highest'} ${esc(M.n.toLowerCase())}: ${who(rows[0].p)} (${aiFmtM(k,rows[0].x)}) – ${esc(lab(r))}${psf(k,r)}.</b>`+aiTbl(['Member',M.n].concat(extra?[extra[0]]:[]),rows.slice(0,10).map(x=>[who(x.p),aiFmtM(k,x.x)].concat(extra?[extra[1](x)]:[]))) }
    let html='';
    keys.slice(0,3).forEach(k=>{ const M=AIMET[k]; const tot=vals.map(v=>aiAgg(k,list,v)); const pl=pls.map((x,i)=>x+psf(k,periods[i]));
      if(tot.every(x=>!x)){ html+=['rota','rotacost','shifts','longestr'].includes(k)?`Nothing is planned on the rota for ${pls.join(' or ')} yet.`:`No ${M.n.toLowerCase()} in ${pls.join(' or ')}.<p style="margin:10px 0 0"></p>`; return }
      const rowsOf=byGroup?S.groups.map(g=>({name:g.name,ps:list.filter(p=>p.g===g.id)})).concat([{name:'Other',ps:list.filter(p=>!S.groups.some(g=>g.id===p.g))}]).filter(x=>x.ps.length):list.map(p=>({name:p.name,ps:[p]}));
      const body=rowsOf.map(x=>[esc(x.name)].concat(vals.map(v=>aiFmtM(k,aiAgg(k,x.ps,v))))).filter(r=>r.slice(1).some(c=>!/^(0h 00m|0|£0\.00|0 min|0 min)$/.test(c)));
      let head=`<b>${M.n}${per2?': '+per2.map(p=>esc(aiFirst(p))).join(', '):gtag}.</b> `;
      if(periods.length===1&&per2&&per2.length>=2&&!byGroup){ const rr=list.map(p=>({p,x:aiAgg(k,[p],vals[0])})).sort((a,b)=>b.x-a.x); const d=rr[0].x-rr[1].x; head=`<b>${M.n} (${esc(lab(periods[0]))}${psf(k,periods[0])}): ${rr.map(x=>esc(aiFirst(x.p))+' '+aiFmtM(k,x.x)).join(' · ')}.</b> ${d?esc(aiFirst(rr[0].p))+' is ahead by '+aiFmtM(k,d)+'.':'They are level.'}` }
      else if(byGroup&&periods.length===1)head=`<b>${M.n}.</b> ${rowsOf.map(x=>esc(x.name)+' '+aiFmtM(k,aiAgg(k,x.ps,vals[0]))).join(' · ')} (${esc(lab(periods[0]))}${psf(k,periods[0])}).`;
      else if(periods.length===1)head+=`${aiFmtM(k,tot[0])} in ${esc(lab(periods[0]))}${psf(k,periods[0])}.`;
      else if(periods.length===2){ const ri=periods[0].from>=periods[1].from?0:1, oi=1-ri; const d=tot[ri]-tot[oi]; head+=periods.map((r,i)=>`${esc(lab(r))}: ${aiFmtM(k,tot[i])}`).join(' · ')+`. <b>${esc(lab(periods[ri])).replace(/^./,x=>x.toUpperCase())} is ${d>=0?'up':'down'} ${aiFmtM(k,Math.abs(d))}${tot[oi]?' ('+Math.abs(Math.round(d/tot[oi]*100))+'%)':''} on ${esc(lab(periods[oi]))}.</b>`;
        const pr=periods[ri]; if(pr.to>t&&!['rota','rotacost','shifts'].includes(k)&&pr.from<=t){ const n=aiDays(pr.from,t).length; const a2=aiAgg(k,list,aiVals(list,aiRange(pr.from,t))), b2=aiAgg(k,list,aiVals(list,aiRange(periods[oi].from,addD(periods[oi].from,n-1)))); head+=`<br>Like for like (first ${plural(n,'day')} of each): ${aiFmtM(k,a2)} against ${aiFmtM(k,b2)}${b2?` (${a2>=b2?'+':'-'}${Math.abs(Math.round((a2-b2)/b2*100))}%)`:''}.` } }
      else head+=periods.map((r,i)=>`${esc(lab(r))}: ${aiFmtM(k,tot[i])}`).join(' · ')+'.';
      const mxD=S.shifts.reduce((a,x)=>x.date>a?x.date:a,'0'); const partial=periods.some(r=>r.to>t&&k!=='rota'&&k!=='rotacost'&&k!=='shifts')?'<p class="mut" style="margin:6px 0 0;font-size:13px">Periods that are still running only count up to today.</p>':(['rota','rotacost','shifts'].includes(k)&&periods.some(r=>r.to>mxD)?`<p class="mut" style="margin:6px 0 0;font-size:13px">The rota is only planned up to ${fdate(mxD)}.</p>`:'');
      html+=head+(body.length>1&&(body.length<=14)?aiTbl([byGroup?'Group':'Member'].concat(pl),body):'')+partial+'<p style="margin:10px 0 0"></p>' });
    return html }
  return null }
