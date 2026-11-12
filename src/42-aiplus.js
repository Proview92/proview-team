/* ===== Proview AI: wider questions (people, days, periods) + made-up test data ===== */
const aiRange=(f,t,label)=>({from:f,to:t,label:label||(f===t?fdate(f):fdm(f)+' – '+fdm(t)),one:f===t});
function aiWhen(s,past){
  const t=today(), ws=wkStart(t); let m;
  if(/\byesterday\b/.test(s))return aiRange(addD(t,-1),addD(t,-1),'yesterday');
  if(/\bday after tomorrow\b/.test(s))return aiRange(addD(t,2),addD(t,2));
  if(/\btomorrow\b/.test(s))return aiRange(addD(t,1),addD(t,1),'tomorrow');
  if((m=s.match(/\b(\d+|one|two|three|four|five|six|a)\s+(week|month)s?\s+ago\b/))){ const n={a:1,one:1,two:2,three:3,four:4,five:5,six:6}[m[1]]||+m[1]; if(m[2]==='week')return aiRange(addD(ws,-7*n),addD(ws,-7*n+6),n+' weeks ago'); const f=ds(new Date(pd(t).getFullYear(),pd(t).getMonth()-n,1)); return aiRange(f,monthEnd(f),n+' months ago') }
  if(/\b(today|tonight|this (morning|afternoon|evening))\b/.test(s))return aiRange(t,t,'today');
  { const wk=/\b(this|last|previous|next|past) weekend\b/.exec(s); if(wk){ const o=wk[1]==='this'?0:wk[1]==='next'?7:-7; return aiRange(addD(ws,o+5),addD(ws,o+6),wk[1]==='previous'||wk[1]==='past'?'last weekend':wk[1]+' weekend') } }
  if(/\b(last|previous|past) week\b/.test(s))return aiRange(addD(ws,-7),addD(ws,-1),'last week');
  if(/\bnext week\b/.test(s))return aiRange(addD(ws,7),addD(ws,13),'next week');
  if(/\b(this week|the week|so far this week)\b/.test(s))return aiRange(ws,addD(ws,6),'this week');
  if(/\b(last|previous) month\b/.test(s)){ const f=ds(new Date(pd(t).getFullYear(),pd(t).getMonth()-1,1)); return aiRange(f,monthEnd(f),'last month') }
  if(/\bthis month\b/.test(s)){ const f=t.slice(0,8)+'01'; return aiRange(f,monthEnd(f),'this month') }
  if((m=s.match(/\b(?:last|past) (\d{1,2}) days\b/)))return aiRange(addD(t,-(+m[1]-1)),t,'the last '+m[1]+' days');
  const mr='(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*', yr=Number(t.slice(0,4));
  const mk=(d,mo)=>{ if(mo<0||mo>11||d<1||d>31)return null; const x=new Date(yr,mo,d); return x.getDate()===d?ds(x):null };
  let d1=null; if((m=s.match(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?'+mr+'\\b'))))d1=mk(+m[1],MON3.indexOf(m[2])); else if((m=s.match(new RegExp('\\b'+mr+'\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b'))))d1=mk(+m[2],MON3.indexOf(m[1]));
  if(d1){ const ntok=(re=>{ const o=[]; let z; while((z=re.exec(s)))o.push(z); return o })(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?'+mr+'\\b','g')); if(ntok.length>=2&&/\b(between|from|to|until|through|and)\b/.test(s)){ const a=mk(+ntok[0][1],MON3.indexOf(ntok[0][2])), b=mk(+ntok[1][1],MON3.indexOf(ntok[1][2])); if(a&&b)return aiRange(a<b?a:b,a<b?b:a) } return aiRange(d1,d1) }
  { const MF=['january','february','march','april','may','june','july','august','september','october','november','december'];
    const ntok=(re=>{ const o=[]; let z; while((z=re.exec(s)))o.push(z); return o })(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:of\\s+)?'+mr+'\\b','g'));
    const mkd=z=>mk(+z[1],MON3.indexOf(z[2]));
    if(ntok.length>=2&&/\b(between|from|to|until|through|and)\b/.test(s)){ const a=mkd(ntok[0]), b=mkd(ntok[1]); if(a&&b)return aiRange(a<b?a:b,a<b?b:a) }
    if((m=s.match(/\b(?:last|past|previous)\s+(\d+|two|three|four|five|six|eight|twelve|fourteen)\s+(weeks?|months?)\b/))){ const n={two:2,three:3,four:4,five:5,six:6,eight:8,twelve:12,fourteen:14}[m[1]]||+m[1]; if(/^week/.test(m[2]))return aiRange(addD(t,-(7*n-1)),t,'the last '+n+' weeks'); const f=ds(new Date(pd(t).getFullYear(),pd(t).getMonth()-n,pd(t).getDate()+1)); return aiRange(f,t,'the last '+n+' months') }
    if(/\b(last|past) fortnight\b/.test(s))return aiRange(addD(t,-13),t,'the last 2 weeks');
    if(/\bnext month\b/.test(s)){ const f=ds(new Date(pd(t).getFullYear(),pd(t).getMonth()+1,1)); return aiRange(f,monthEnd(f),'next month') }
    if(/\b(this year|year to date|so far this year)\b/.test(s))return aiRange(t.slice(0,4)+'-01-01',t.slice(0,4)+'-12-31','this year');
    if(/\blast year\b/.test(s)){ const y=Number(t.slice(0,4))-1; return aiRange(y+'-01-01',y+'-12-31','last year') }
    const mm=s.match(new RegExp('\\b(?:in|during|for|of|and|vs|versus|from|to|between|compare|than)?\\s*\\b('+MF.map(x=>x==='may'?'may':x).join('|')+'|sept)\\b'));
    if(mm){ const nm=mm[1]==='sept'?'september':mm[1]; const idx=MF.indexOf(nm); if(nm!=='may'||/\b(in|during|for|of|and|vs|versus|from|to|between|than)\s+may\b/.test(s)){ const cm=pd(t).getMonth(); const y=Number(t.slice(0,4))-(idx>cm?1:0); const f=ds(new Date(y,idx,1)); return aiRange(f,monthEnd(f),idx===cm?'this month':MF[idx][0].toUpperCase()+MF[idx].slice(1)) } } }
  const wdRe=new RegExp('\\b(next\\s+|last\\s+|this\\s+|on\\s+)?('+WDX.map(a=>a.slice().reverse().join('|')).join('|')+')\\b'); m=s.match(wdRe);
  if(m){ const i=WDX.findIndex(a=>a.includes(m[2])); const pre=(m[1]||'').trim(); let d=addD(ws,i);
    if(pre==='last'){ if(d>=t)d=addD(d,-7) } else if(pre==='next'){ d=addD(d,7) } else if(past){ if(d>t)d=addD(d,-7) } else { if(d<t)d=addD(d,7) }
    return aiRange(d,d) }
  return null }
const aiDays=(f,t)=>{ const o=[]; for(let d=f;d<=t;d=addD(d,1))o.push(d); return o };
const aiFirst=p=>p.name.split(' ')[0];
const aiPast=s=>/\b(did|was|were|had|worked|been|last|yesterday|missed|came|arrived)\b/.test(s);
const aiTn=(t)=>t.length?aiTbl(t[0],t.slice(1)):'';

const aiGroups=s=>S.groups.filter(g=>g.name.trim()&&new RegExp('\\b'+g.name.toLowerCase().replace(/[^a-z0-9 ]/g,'')+'\\b').test(s));
function aiInfo(q){
  const s=avNorm(q); { const lv=aiLive(q,s); if(lv)return lv }
  if(/\bright now\b|\bcurrently\b|\bclocked in\b/.test(s)&&!/\blate\b|\bnot clocked|\bhasn.?t clocked|\bhas not clocked|\bforgot|\bearly\b/.test(s))return null;
  if((/\bwho (can|could|would|might)\b|\bwho is (available|free|able)\b|\bwho.?s (available|free)\b|\bcover(ing)?\b/.test(s))&&!/\bneeds? cover\b|\bcover (is )?needed\b/.test(s))return null;
  const m=me(), all=team(), ids0=new Set(all.map(p=>p.id)), t=today(), nowM=nowMin();
  const q2=q.replace(/\b(give|show|tell|let|get|send|help) me\b/ig,' '); let names=avWho(q2,m); if(names.length===1&&names[0].id===m.id&&!ids0.has(m.id))names=[];
  const hidden=names.find(p=>!ids0.has(p.id)); if(hidden)return `I cannot show you ${esc(hidden.name)}'s details.`;
  const gsel=aiGroups(s); let ppl=all; if(gsel.length===1&&!names.length&&!/\b(by group|per group)\b/.test(s))ppl=all.filter(p=>p.g===gsel[0].id); const ids=new Set(ppl.map(p=>p.id));
  const per=names.length?names:null; let W=aiWhen(s,(aiPast(s)||/\b(hours?|worked|late|cost|overtime|clocked|missed)\b/.test(s))&&!/\b(scheduled|planned|rota|rostered|will|going to|upcoming|forecast)\b/.test(s)); if(!W&&/\b(right now|at the moment|just now)\b/.test(s))W=aiRange(t,t,'today');
  const who=p=>esc(p.name), shOf=(p,d)=>S.shifts.filter(x=>x.pid===p.id&&x.date===d).sort((a,b)=>a.start-b.start);
  const rng=(dflt)=>W||dflt;
  { const mx=aiMore(q,s,{m,ppl,ids,t,per,W,all,gsel}); if(mx)return mx }
  const rcOf=(list,r)=>rangeCalc(list,r.from,r.to,false);
  // ---- overview / briefing
  if(/\b(summary|summarise|summarize|overview|brief|briefing|recap|anything (i|to) (need|know)|what.?s (happening|going on|new)|how (was|is|did|has) (the )?(week|today|business|cafe|team))\b/.test(s)){
    const r=rng(aiRange(t,t,'today')); return aiBrief(r,ppl) }
  // ---- forgot to clock out
  if(/\b(forgot|forget|not clocked out|no clock.?out|still clocked|never clocked out|didn.?t clock out|missing clock|open (time )?entr(y|ies))\b/.test(s)){
    const o=S.entries.filter(e=>ids.has(e.pid)&&e.out==null&&e.src!=='hours'&&e.date<t&&(!W||(e.date>=W.from&&e.date<=W.to))).sort((a,b)=>a.date<b.date?-1:1);
    return o.length?`<b>${plural(o.length,'person day')} with no clock-out${W?' ('+esc(W.label)+')':''}.</b>`+aiTbl(['Member','Day','Clocked in'],o.map(e=>[who(P(e.pid)),fdate(e.date),fT(e.in)]))+'<p style="margin:8px 0 0">Fix these on the Timesheets page before approving.</p>':'Nobody has a missing clock-out.' }
  // ---- no-shows / not arrived
  if(/\b(no.?shows?|didn.?t (turn up|show|come|clock)|did not (turn up|show|come|clock)|missed (a |their |the |his |her )?shift|absent|absentee|not (turned|shown) up|not arrived|hasn.?t (arrived|clocked|turned|shown)|not in yet|not here)\b/.test(s)){
    const r=rng(aiRange(t,t,'today')); const out=[];
    S.shifts.filter(x=>x.pid&&ids.has(x.pid)&&x.date>=r.from&&x.date<=r.to&&x.date<=t&&(!per||per.some(p=>p.id===x.pid))).forEach(x=>{ const p=P(x.pid); if(S.entries.some(e=>e.pid===p.id&&e.date===x.date))return; if(leaveOn(p.id,x.date,true))return; if(x.date===t&&nowM<x.start+LATE_GRACE)return; out.push([who(p),fdate(x.date),shT(x)]) });
    return out.length?`<b>${plural(out.length,'shift')} with no clock-in (${esc(r.label)}).</b>`+aiTbl(['Member','Day','Shift'],out):`Everyone who was on the rota clocked in (${esc(r.label)}).` }
  // ---- late
  if(/\b(late|lateness|punctual|punctuality|on time|arrived late)\b/.test(s)){
    const r=rng(aiRange(wkStart(t),addD(wkStart(t),6),'this week')); const out=[]; const list=per||ppl;
    list.forEach(p=>aiDays(r.from,r.to).forEach(d=>{ if(d>t)return; const dc=dayCalc(p,d,false); if(dc.late>LATE_GRACE)out.push([who(p),fdate(d),dc.late+' min']) }));
    if(r.from<=t&&t<=r.to)list.forEach(p=>shOf(p,t).forEach(x=>{ if(nowM>x.start+LATE_GRACE&&nowM<x.end&&!S.entries.some(e=>e.pid===p.id&&e.date===t)&&!leaveOn(p.id,t,true))out.push([who(p),'Today','not in yet (due '+fT(x.start)+')']) }));
    return out.length?`<b>${plural(out.length,'late arrival')} (${esc(r.label)}).</b>`+aiTbl(['Member','Day','Late by'],out):`${per?esc(aiFirst(per[0]))+' was not':'Nobody was'} late (${esc(r.label)}).` }
  // ---- busiest / quietest / ranking
  if(/\b(busiest|quietest|slowest|peak|most hours|least hours|worked the most|worked the least|longest|hardest)\b/.test(s)){
    const r=rng(aiRange(wkStart(t),addD(wkStart(t),6),'this week')); const rc=rcOf(ppl,r);
    if(/\b(busiest|quietest|slowest|peak)\b/.test(s)&&/\bday\b/.test(s)||/\b(busiest|quietest)\b/.test(s)){ const a=aiDays(r.from,r.to).map(d=>[d,rc.byDay[d]||0]).filter(x=>x[0]<=t); if(!a.length)return 'No days yet.'; const hi=a.slice().sort((x,y)=>y[1]-x[1])[0], lo=a.slice().sort((x,y)=>x[1]-y[1])[0]; return `<b>Busiest day: ${fdate(hi[0])} with ${fd(hi[1])}. Quietest: ${fdate(lo[0])} with ${fd(lo[1])} (${esc(r.label)}).</b>`+aiTbl(['Day','Hours'],a.map(x=>[fdate(x[0]),fd(x[1])])) }
    const a=ppl.map(p=>({p,w:rc.byPerson[p.id].worked})).filter(x=>x.w>0).sort((x,y)=>/least|worked the least/.test(s)?x.w-y.w:y.w-x.w).slice(0,8); return a.length?`<b>${/least/.test(s)?'Fewest':'Most'} hours (${esc(r.label)}): ${who(a[0].p)}, ${fd(a[0].w)}.</b>`+aiTbl(['Member','Hours'],a.map(x=>[who(x.p),fd(x.w)])):'Nobody has worked hours in that period.' }
  // ---- cost
  if(/\b(cost|wage|wages|payroll|spend|spent|labou?r)\b/.test(s)){
    if(!isAdmin(m))return 'Only owners and admins can see labour cost.';
    const r=rng(aiRange(t.slice(0,8)+'01',monthEnd(t),'this month')); const list=per||ppl; const rc=rcOf(list,r); const a=list.map(p=>({p,c:rc.byPerson[p.id].cost,w:rc.byPerson[p.id].worked})).filter(x=>x.c>0).sort((x,y)=>y.c-x.c).slice(0,10);
    return `<b>Labour cost ${esc(r.label)}${gsel.length===1&&!per?' ('+esc(gsel[0].name)+')':''}: ${money(rc.cost)}</b> for ${fd(rc.worked)} worked.${rc.cost===0&&rc.worked>0?' <span class="mut">(Cost shows £0 because no hourly rates are set on the People page yet.)</span>':''}`+aiTbl(['Member','Hours','Cost'],a.map(x=>[who(x.p),fd(x.w),money(x.c)])) }
  // ---- overtime
  if(/\b(overtime|extra hours|over time)\b/.test(s)){
    if(!otOn())return 'Overtime is switched off, so none is counted. Turn it on in Settings, Time tracking.';
    const r=rng(aiRange(t.slice(0,8)+'01',monthEnd(t),'this month')); const list=per||ppl; const rc=rcOf(list,r); const a=list.map(p=>({p,ot:rc.byPerson[p.id].ot})).filter(x=>x.ot>0).sort((x,y)=>y.ot-x.ot).slice(0,8);
    return a.length?`<b>${fd(rc.ot)} of overtime (${esc(r.label)}).</b>`+aiTbl(['Member','Overtime'],a.map(x=>[who(x.p),fd(x.ot)])):`There is no overtime (${esc(r.label)}).` }
  // ---- time off / sick
  if(/\b(holiday|holidays|leave|time off|vacation|annual|off sick|sick|sickness|unwell|away|absence|days off|who.?s off|who is off|is off|off (on|this|next|tomorrow|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|requests?)\b/.test(s)&&!/\bday off (rota|shift)\b/.test(s)&&!/\b(shift|shifts|rota)\b.*\brequests?\b/.test(s)){
    const pendOnly=/\b(pending|waiting|awaiting|unapproved|to approve|need(s)? (approval|approving|a decision)|outstanding)\b/.test(s), sickOnly=/\b(sick|sickness|unwell|ill)\b/.test(s);
    const now=!W&&!pendOnly&&/\b(who.?s|who is|anyone|anybody|is anyone)\b/.test(s); const r=W||(pendOnly?aiRange(t,addD(t,60),'from today'):now?aiRange(t,addD(t,13),'the next two weeks'):aiRange(t.slice(0,8)+'01',monthEnd(t),'this month')); const list=per?new Set(per.map(p=>p.id)):ids;
    const pn=x=>((S.policies.find(z=>z.id===x.pol)||{}).name||'');
    const l=S.leave.filter(x=>list.has(x.pid)&&x.st!=='rejected'&&(!pendOnly||x.st==='pending')&&(!sickOnly||/sick/i.test(pn(x))||/sick|unwell|ill\b/i.test(x.note||''))&&x.to>=r.from&&x.from<=r.to).sort((a,b)=>a.from<b.from?-1:1);
    const pend=S.leave.filter(x=>x.st==='pending'&&ids.has(x.pid)).length;
    return (l.length?`<b>${plural(l.length,pendOnly?'pending request':sickOnly?'sick day booking':'time off booking')} (${esc(r.label)}).</b>`+aiTbl(['Member','Dates','Status'],l.map(x=>[who(P(x.pid)),lvRange(x),x.st==='pending'?'Pending':'Approved'])):`${pendOnly?'No requests are waiting':sickOnly?'Nobody is off sick':'Nobody has time off booked'} (${esc(r.label)}).`)+(pend&&!pendOnly?`<p style="margin:8px 0 0">${plural(pend,'request')} waiting for a decision.</p>`:'') }
  // ---- open / uncovered shifts
  if(/\b(open shifts?|unfilled|uncovered|not covered|needs? (cover|someone)|gaps?|unassigned|(no ?one|nobody) (assigned|on it|has)|not assigned|assigned to (no ?one|nobody)|needs? covering|nobody (on|for)|shifts? (are |is )?(still )?(open|unfilled|uncovered|empty|free|unassigned))\b/.test(s)){
    const r=rng(aiRange(t,addD(t,13),'the next two weeks')); const o=S.shifts.filter(x=>!x.pid&&x.date>=r.from&&x.date<=r.to).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:a.start-b.start);
    const cov=S.shifts.filter(x=>x.pid&&x.cover&&x.cover.open&&x.date>=r.from&&x.date<=r.to);
    return (o.length||cov.length)?`<b>${plural(o.length+cov.length,'shift')} still need someone (${esc(r.label)}).</b>`+aiTbl(['Day','Shift','Note'],o.map(x=>[fdate(x.date),shT(x),'Open']).concat(cov.map(x=>[fdate(x.date),shT(x),esc((P(x.pid)||{}).name||'')+' needs cover']))):`Every shift is covered (${esc(r.label)}).` }
  // ---- documents
  if(/\b(documents?|welcome pack|allergen|id check|right to work|haven.?t signed|not signed|confirmed the)\b/.test(s)){
    if(!(isAdmin(m)||feat(m,'people')))return 'Only managers with People access can see documents.';
    const o=ppl.filter(p=>!p.noTrack&&!docsComplete(p)); return o.length?`<b>${plural(o.length,'person','people')} still need documents.</b>`+aiTbl(['Member','Missing'],o.map(p=>{ const d=docSt(p); return [who(p),[!d.welcome&&'Welcome pack',d.allergen===false&&'Allergen',d.id===false&&'ID'].filter(Boolean).join(', ')||'Some documents'] })):'Everyone has confirmed their documents.' }
  // ---- payslips
  if(/\b(payslips?|p45s?)\b/.test(s)){
    if(!(isAdmin(m)||feat(m,'payslips')))return 'Only managers with Payslips access can see those.';
    const month=MN[pd(t).getMonth()], o=ppl.filter(p=>!S.payslips.some(x=>x.pid===p.id)); return `<b>${plural(S.payslips.length,'payslip/P45 file')} uploaded.</b> ${o.length?`${plural(o.length,'person','people')} have none yet: ${o.slice(0,12).map(p=>esc(aiFirst(p))).join(', ')}.`:'Everyone has at least one.'}` }
  // ---- headcount
  if(/\b(how many (staff|people|employees|team|members|workers)|headcount|list (the )?(staff|team|people)|who works here|staff list|all staff)\b/.test(s)){
    const gs=S.groups.map(g=>[g.name,ppl.filter(p=>p.g===g.id).length]).filter(x=>x[1]); const other=ppl.filter(p=>!S.groups.some(g=>g.id===p.g)).length; if(other)gs.push(['Other',other]);
    return `<b>${plural(ppl.length,'person','people')} on the team.</b>`+aiTbl(['Group','People'],gs) }
  // ---- tasks on a day
  if(/\b(tasks?|checklist|to.?do)\b/.test(s)){
    const r=rng(aiRange(t,t,'today')); if(!r.one)return null; const all=tasksOn(r.from); const nd=all.filter(x=>taskState(x,r.from)!=='done'), dn=all.length-nd.length;
    return all.length?`<b>${dn} of ${all.length} tasks done (${esc(r.label)}).</b>`+(nd.length?aiTbl(['Not done','Due'],nd.map(x=>[esc(x.title),x.time?fT(mins(x.time)):'Anytime'])):'<p style="margin:6px 0 0">Everything is done.</p>'):`No tasks for ${esc(r.label)}.` }
  // ---- hours
  if(/\b(hours?|worked|work(ed)? (so far|this|last)|how long|how much|total|clocked)\b/.test(s)&&!/\bwho (is|are) (working|in)\b/.test(s)){
    const r=rng(aiRange(wkStart(t),addD(wkStart(t),6),'this week')); const list=per||ppl; const rc=rcOf(list,r);
    if(/\b(compare|comparison|versus|vs|than last week|more than|less than)\b/.test(s)){ const cr=/\bthis week\b/.test(s)?aiRange(wkStart(t),addD(wkStart(t),6),'this week'):r; r.from=cr.from; r.to=cr.to; r.label=cr.label; const pr=aiRange(addD(r.from,-7),addD(r.to,-7),'last week'); const rc2=rcOf(list,r); rc.worked=rc2.worked; const pc=rcOf(list,pr); const diff=rc.worked-pc.worked; return `<b>${esc(r.label)}: ${fd(rc.worked)}, against ${fd(pc.worked)} ${esc(pr.label)} (${diff>=0?'+':'-'}${fd(Math.abs(diff))}).</b>` }
    if(per&&per.length===1){ const p=per[0], pp=rc.byPerson[p.id]; const rows=aiDays(r.from,r.to).filter(d=>d<=t).map(d=>{ const dc=dayCalc(p,d,false); return [fdate(d),dc.worked?fd(dc.worked):(leaveOn(p.id,d,true)?'Time off':isRest(p,d)?'Rest day':'–'),dc.first!=null?fT(dc.first)+' to '+fT(dc.last):''] });
      return `<b>${who(p)}: ${fd(pp.worked)} over ${plural(pp.days,'day')} (${esc(r.label)}).</b>`+(rows.length>1?aiTbl(['Day','Hours','Times'],rows):'') }
    const a=list.map(p=>({p,w:rc.byPerson[p.id].worked})).filter(x=>x.w>0).sort((x,y)=>y.w-x.w).slice(0,12);
    return a.length?`<b>${per?'These people':gsel.length===1?esc(gsel[0].name):'The team'} worked ${fd(rc.worked)} (${esc(r.label)}).</b>`+aiTbl(['Member','Hours'],a.map(x=>[who(x.p),fd(x.w)])):`No hours recorded (${esc(r.label)}).` }
  // ---- rota / who is working a day / when is X working
  if(/\b(rota|shift|shifts|schedule|roster|working|work|on (today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|starts?|finish(es)?|ends?|who.?s on|in on)\b/.test(s)){
    const r=rng(per?aiRange(t,addD(t,6),'the next 7 days'):aiRange(t,t,'today')); const days=aiDays(r.from,r.to).slice(0,14); const rows=[];
    days.forEach(d=>S.shifts.filter(x=>x.date===d&&x.pid&&ids.has(x.pid)&&(!per||per.some(p=>p.id===x.pid))).sort((a,b)=>a.start-b.start).forEach(x=>rows.push([r.one?who(P(x.pid)):fdate(d),r.one?shT(x)+(x.pub?'':' (draft)'):who(P(x.pid))+' '+shT(x)])));
    const open=S.shifts.filter(x=>!x.pid&&x.date>=r.from&&x.date<=r.to).length;
    return rows.length?`<b>${plural(rows.length,'shift')} (${esc(r.label)}${per?', '+esc(per.map(aiFirst).join(' and ')):''}).</b>`+aiTbl(r.one?['Member','Shift']:['Day','Shift'],rows)+(open?`<p style="margin:8px 0 0">${plural(open,'open shift')} still need someone.</p>`:''):`No shifts found (${esc(r.label)}${per?', '+esc(aiFirst(per[0])):''}).` }
  return null }

function aiPrev(r){ if(/month/.test(r.label||'')){ const d=pd(r.from), f=ds(new Date(d.getFullYear(),d.getMonth()-1,1)); return aiRange(f,monthEnd(f),'the month before') } const n=aiDays(r.from,r.to).length; return aiRange(addD(r.from,-n),addD(r.from,-1),r.one?'the day before':'the period before') }
function aiBrief(r,ppl){
  const t=today(), ids=new Set(ppl.map(p=>p.id)), m=me(); let h=`<b>Summary: ${esc(r.label)}</b><ul style="margin:6px 0 0;padding-left:18px">`;
  const li=x=>{ h+=`<li>${x}</li>` }, adm=isAdmin(m);
  if(r.one&&r.from===t){ const a=ppl.map(p=>({p,w:whoState(p)})).filter(x=>x.w.st!=='out'); li(a.length?`${plural(a.length,'person','people')} on the clock now: ${a.map(x=>esc(aiFirst(x.p))).join(', ')}.`:'Nobody is clocked in right now.');
    const sh=S.shifts.filter(x=>x.date===t&&x.pid&&ids.has(x.pid)); li(`${plural(sh.length,'shift')} on today's rota.`);
    const nIn=sh.filter(x=>nowMin()>x.start+LATE_GRACE&&nowMin()<x.end&&!S.entries.some(e=>e.pid===x.pid&&e.date===t)&&!leaveOn(x.pid,t,true)); if(nIn.length)li(`Not clocked in yet: ${nIn.map(x=>esc(aiFirst(P(x.pid)))).join(', ')}.`);
    const v=aiVals(ppl,r); const w=sum(ppl,p=>v[p.id].worked); if(w)li(`${fd(w)} worked so far today.`); const lt=ppl.filter(p=>v[p.id].late); if(lt.length)li(`Arrived late today: ${lt.map(p=>esc(aiFirst(p))+' ('+(v[p.id].latemin<60?v[p.id].latemin+' min':fd(v[p.id].latemin))+' after the shift start)').join(', ')}.`) }
  else if(r.from>t){ const v=aiVals(ppl,r); const sh=S.shifts.filter(x=>x.date>=r.from&&x.date<=r.to); const mine=sh.filter(x=>x.pid&&ids.has(x.pid));
    li(mine.length?`${plural(mine.length,'shift')} on the rota for ${plural(new Set(mine.map(x=>x.pid)).size,'person','people')}, ${fd(sum(ppl,p=>v[p.id].rota))} planned.`:'Nothing is on the rota yet.');
    if(adm&&mine.length)li(`Planned cost ${money(sum(ppl,p=>v[p.id].rotacost))}.`);
    const dr=mine.filter(x=>!x.pub).length; if(dr)li(`${plural(dr,'shift')} still draft (not published).`); const op=sh.filter(x=>!x.pid).length; if(op)li(`${plural(op,'shift')} in this period ${op===1?'has':'have'} nobody assigned yet.`);
    const lv=S.leave.filter(x=>ids.has(x.pid)&&x.st!=='rejected'&&x.to>=r.from&&x.from<=r.to).length; if(lv)li(`${plural(lv,'time off booking')}.`) }
  else { const v=aiVals(ppl,r), tot=k=>sum(ppl,p=>AIMET[k].f(v[p.id])); let pr=aiPrev(r); if(r.to>t){ const n=aiDays(r.from,t).length; pr=aiRange(pr.from,addD(pr.from,n-1),/month/.test(r.label||'')?'the same days last month':'the same days last week') } const pv=aiVals(ppl,pr), tp=k=>sum(ppl,p=>AIMET[k].f(pv[p.id])); const part=r.to>t?' so far':'';
    const dw=tot('worked')-tp('worked'); li(`<b>${fd(tot('worked'))}</b> worked${part}${tp('worked')?` (${dw>=0?'+':'-'}${fd(Math.abs(dw))} against ${esc(pr.label)})`:''}.`);
    if(tot('rota'))li(`${fd(tot('rota'))} planned on the rota.`);
    if(tot('ot'))li(`${fd(tot('ot'))} overtime.`); if(adm&&tot('cost'))li(`Labour cost ${money(tot('cost'))}.`);
    const ds2=aiDays(r.from,r.to).filter(d=>d<=t&&sum(ppl,p=>dayCalc(p,d,false).n)>0); if(tot('brk')&&tot('days'))li(`Breaks: ${fd(tot('brk'))} in total, about ${Math.round(tot('brk')/tot('days'))} min per day worked.`);
    li(tot('late')?`${plural(tot('late'),'late arrival')} (${tot('latemin')} min in total).`:'Nobody was late.'); if(tot('noshow'))li(`${plural(tot('noshow'),'shift')} with no clock-in.`);
    const rc=rangeCalc(ppl,r.from,r.to<t?r.to:t,false); const dd=aiDays(r.from,r.to).filter(d=>d<=t).map(d=>[d,rc.byDay[d]||0]).filter(x=>x[1]>0); if(dd.length>1){ const hi=dd.slice().sort((x,y)=>y[1]-x[1])[0]; li(`Busiest day: ${fdate(hi[0])} (${fd(hi[1])}).`) }
    const top=ppl.map(p=>({p,w:v[p.id].worked})).sort((x,y)=>y.w-x.w)[0]; if(top&&top.w)li(`Most hours: ${esc(aiFirst(top.p))} (${fd(top.w)}).`) }
  const pend=ppl.filter(p=>weekStatus(p,wkStart(t))==='pending'||weekStatus(p,addD(wkStart(t),-7))==='pending').length; if(pend)li(`${plural(pend,'timesheet')} waiting for approval.`);
  const lp=S.leave.filter(x=>x.st==='pending'&&ids.has(x.pid)).length; if(lp)li(`${plural(lp,'time off request')} waiting.`);
  const op2=S.shifts.filter(x=>!x.pid&&x.date>=t&&x.date<=addD(t,13)).length; if(op2&&r.from<=t)li(`${plural(op2,'shift')} in the next two weeks ${op2===1?'has':'have'} nobody assigned yet (fill them on the Rota).`);
  const mo=S.entries.filter(e=>ids.has(e.pid)&&e.out==null&&e.src!=='hours'&&e.date<t).length; if(mo)li(`${plural(mo,'missing clock-out')}.`);
  const tk=tasksOn(t).filter(x=>taskState(x,t)!=='done').length; if(r.from<=t&&t<=r.to&&tk)li(`${plural(tk,'task')} not done today.`);
  return h+'</ul>' }

/* ----- made-up data to try things out (every item is marked demo and can be removed) ----- */
function demoRng(seed){ let x=seed>>>0||1; return ()=>{ x^=x<<13; x>>>=0; x^=x>>>17; x^=x<<5; x>>>=0; return x/4294967296 } }
A.demoLoad=()=>{ if(!isAdmin(me()))return; S.shifts=S.shifts.filter(x=>!x.demo); S.entries=S.entries.filter(x=>!x.demo); S.leave=S.leave.filter(x=>!x.demo); S.tasks=S.tasks.filter(x=>!x.demo); S.people.forEach(p=>{ if(p.demoRate){ p.rate=0; delete p.demoRate } });
  const rnd=demoRng(20261110), t=today(), w0=wkStart(t), base=addD(w0,-42), nowM=nowMin(); const loc=(S.locations.find(l=>!l.archived)||{}).id; const people=S.people.filter(p=>!p.archived&&p.licensed!==false&&!p.noTrack&&!p.trial&&p.role!=='owner'); const R=(a,b)=>Math.round(a+rnd()*(b-a));
  const pol=S.policies[0]; const lv=[]; const add=(i,off,len,st,note)=>{ const p=people[i]; if(p&&pol)lv.push({id:uid(),pid:p.id,pol:pol.id,from:addD(base,off),to:addD(base,off+len-1),half:false,note:note||'',st,ts:Date.now(),demo:true}) };
  [[2,3,2,'approved','Family event'],[1,8,1,'approved','Unwell'],[5,15,2,'approved','Holiday'],[3,19,5,'approved','Holiday'],[0,27,1,'approved','Unwell'],[6,31,2,'approved','Appointment'],[4,38,2,'approved','Holiday'],[2,45,1,'approved','Unwell'],[7,49,1,'pending','Holiday'],[4,51,2,'pending','Holiday'],[5,56,2,'approved','Holiday']].forEach(a=>add(...a));
  S.leave.push(...lv); let ns=0,ne=0;
  people.forEach((p,i)=>{ p.docs=p.docs||{}; if(!p.docs.certs||p.docs.demoCerts){ p.docs.demoCerts=true; p.docs.certs={}; if(i%5!==4)p.docs.certs.fh=addD(t,[420,25,-12,300,610,180,22,500][i%8]); if(i%3!==2)p.docs.certs.fa=addD(t,[700,90,-40,365][i%4]); if(i%2===0)p.docs.certs.rtw=addD(t,[900,400,28][i%3]) } });
  people.forEach((p,i)=>{ if(!p.rate){ p.rate=Math.round((11.44+(i%4)*0.8)*100)/100; p.demoRate=true } });
  const flexDays={}; people.filter(p=>p.flex).forEach(p=>{ flexDays[p.id]=[R(0,6),R(0,6),R(0,6)] });
  const late0=people.map((p,i)=>i%4===1?0.4:i%5===2?0.22:0.06); const noShow=new Set(); for(let k=0;k<5;k++)noShow.add(R(0,people.length-1)+'|'+R(1,38));
  const wkSt={}; const stOf=(p,d)=>{ const w=wkStart(d), k=p.id+w; if(!(k in wkSt)){ wkSt[k]=w<addD(w0,-7)?(rnd()<0.9?'approved':'pending'):w<w0?(rnd()<0.4?'approved':'pending'):'pending' } return wkSt[k] };
  let forgot=0, rejDone=false;
  people.forEach((p,pi)=>aiDays(base,addD(w0,13)).forEach(d=>{ if(leaveOn(p.id,d,true))return; let u=usualFor(p,d); if(!u&&flexDays[p.id]&&flexDays[p.id].includes(dow(d)))u={f:600,e:1020,brk:30,act:''}; if(!u)return;
    const sh={id:uid(),pid:p.id,date:d,start:u.f,end:u.e,ne:false,brk:u.brk||0,act:u.act||defaultAct(p),loc,note:'',pub:d<addD(w0,7),demo:true}; S.shifts.push(sh); ns++;
    if(d>t||(d===t&&nowM<u.f))return; const di=Math.round((pd(d)-pd(base))/864e5); if(noShow.has(pi+'|'+di)&&d<t)return;
    const late=rnd()<late0[pi]?R(7,28):R(-4,4); const inn=u.f+late; if(d===t&&nowM<inn)return;
    const ended=d<t||nowM>u.e; let out=null; if(ended){ out=u.e+(rnd()<0.1?R(30,75):R(-3,12)); if(rnd()<0.05)out=u.e-R(20,40) }
    if(ended&&d<t&&forgot<2&&(d===addD(t,-1)||d===addD(t,-6))&&!S.entries.some(e=>e.demo&&e.date===d&&e.out==null)){ forgot++; out=null }
    let brk=u.brk||0; if(brk){ const r=rnd(); brk=r<0.12?0:r<0.2?45:r<0.26?15:brk }
    let st=stOf(p,d); if(st==='approved'&&out==null)st='pending'; const e={id:uid(),pid:p.id,date:d,in:inn,out,brk,bs:null,act:sh.act,proj:'',loc,note:'',st,demo:true};
    if(!rejDone&&d<addD(w0,-14)&&pi===4&&dow(d)===2){ rejDone=true; e.st='rejected'; e.rej='Hours look wrong - please check the clock-out' }
    S.entries.push(e); ne++ }));
  { let nc=0; S.entries.filter(e=>e.demo&&e.brk===0&&e.out!=null&&e.date<t&&e.date>=addD(w0,-7)&&e.st==='pending').forEach(e=>{ if(nc<3&&rnd()<0.5){ e.bc={m:30,note:'Forgot to log it',ts:Date.now(),st:'pending'}; nc++ } }) }
  const hdr=people[0]; S.shifts.push({id:uid(),pid:null,date:addD(t,3),start:600,end:1020,ne:false,brk:30,act:defaultAct(hdr),loc,note:'',pub:true,demo:true},{id:uid(),pid:null,date:addD(t,4),start:420,end:900,ne:false,brk:30,act:defaultAct(hdr),loc,note:'',pub:true,demo:true},{id:uid(),pid:null,date:addD(w0,10),start:480,end:960,ne:false,brk:30,act:defaultAct(hdr),loc,note:'',pub:false,demo:true},{id:uid(),pid:null,date:addD(w0,12),start:600,end:1080,ne:false,brk:30,act:defaultAct(hdr),loc,note:'',pub:false,demo:true}); ns+=4;
  const tk=[['Opening checklist','daily','07:00',0],['Clean the coffee machine','daily','16:00',1],['Stock take: dry goods','weekly','11:00',2],['Wipe fridges and check dates','weekdays','15:00',3],['Order milk and bread','weekdays','09:00',4]]; let nt=0;
  tk.forEach(([title,rep,time,i])=>{ const p=people[i]; if(!p)return; const dn={}; aiDays(addD(t,-30),addD(t,-1)).forEach(d=>{ if(rnd()<0.82)dn[d+'|'+p.id]=true }); S.tasks.push({id:uid(),title,notes:'',date:addD(t,-30),time,pri:'normal',loc,rep,list:[],asg:{mode:'person',pid:p.id,shift:'any'},dn,ip:{},demo:true}); nt++ });
  commit(); toast(`Test data added: ${ns} shifts, ${ne} clock records, ${lv.length} time off bookings, ${nt} tasks.`) };
A.demoClear=()=>{ if(!isAdmin(me()))return; ask('Remove the test data?','Remove',()=>{ const n=S.shifts.filter(x=>x.demo).length+S.entries.filter(x=>x.demo).length+S.leave.filter(x=>x.demo).length+S.tasks.filter(x=>x.demo).length; S.shifts=S.shifts.filter(x=>!x.demo); S.entries=S.entries.filter(x=>!x.demo); S.leave=S.leave.filter(x=>!x.demo); S.tasks=S.tasks.filter(x=>!x.demo); S.people.forEach(p=>{ if(p.demoRate){ p.rate=0; delete p.demoRate } if(p.docs&&p.docs.demoCerts){ delete p.docs.certs; delete p.docs.demoCerts } }); commit(); toast(`Removed ${n} test items.`) },true,'This removes only the made-up shifts, hours, time off and tasks. Your real data stays.') };
