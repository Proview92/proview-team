/* forgotten clock-outs: a cut-off time the business chooses, a "still clocked in" flag on the dashboard,
   and the kiosk asking the person for their real finish time the next time they tap their name. */
function fcSet(){ const d={cut:'00:00',flagH:16,ask:true}; return Object.assign(d,(S.tt&&S.tt.fc)||{}) }
function fcCut(){ const c=mins(fcSet().cut); return c==null||c<720?0:c } /* 0 = midnight. Evening times cut off the same day. */
/* replaces the old rule (which only ran after midnight) */
closeStale=function(){ let ch=false; const t=today(), n=nowMin(), c=fcCut();
  S.entries.forEach(e=>{ if(e.out!=null||e.src==='hours')return; const old=e.date<t, late=c&&e.date===t&&n>=c&&e.in<c; if(!old&&!late)return;
    const p=P(e.pid), pl=p&&planned(p,e.date); let out=(pl&&pl.to)?Math.max(pl.to,e.in+1):e.in+480; if(late)out=(pl&&pl.to&&pl.to>e.in&&pl.to<=c)?pl.to:c;
    e.out=out; if(e.bs!=null){ e.brk=(e.brk||0)+Math.max(0,e.out-e.bs); e.bs=null }
    e.note=(e.note?e.note+' · ':'')+'Auto clock-out (forgot to clock out)'; e.needOut=true; ch=true });
  if(ch)save() };
/* dashboard flag: people on the clock longer than the chosen number of hours. A warning only. */
function fcLong(){ const h=Number(fcSet().flagH)||0; if(!h)return []; const t=today(), n=nowMin(); const ids=new Set(team().map(p=>p.id));
  return S.entries.filter(e=>e.out==null&&e.src!=='hours'&&ids.has(e.pid)&&e.date===t&&(n-e.in)>=h*60).map(e=>({e,p:P(e.pid),m:n-e.in})).filter(x=>x.p) }
function fcLine(){ if(!isMgr(me()))return ''; const L=fcLong(); if(!L.length)return ''; const h=fcSet().flagH; const names=L.map(x=>x.p.name.split(' ')[0]).join(', ');
  const label=(L.length===1?names+' has':names+' have')+' been clocked in for over '+h+' hours';
  return `<div class="alert dline fcl"><button type="button" class="dline-go" data-a="go" data-k="timesheets" title="Open Timesheets">${ic('clock')}<b><span class="dl-l">${esc(label)}</span><span class="dl-s">${esc('Clocked in over '+h+'h: '+names)}</span></b>${ic('chr')}</button></div>` }
{ const _d=V.dash; V.dash=()=>{ const h=_d(), b=fcLine(); if(!b)return h; const pb=(typeof previewBar==='function')?previewBar():''; return pb&&h.startsWith(pb)?pb+b+h.slice(pb.length):b+h } }
/* settings card */
function fcCard(){ const f=fcSet(); const c=fcCut(); const opts=[['00:00','Midnight']].concat([18,19,20,21,22,23].map(h=>[h+':00',h+':00'])); const cur=c?fT(c):'00:00';
  return `<div class="tg"><div class="tx"><b>Clock out anyone still clocked in at</b><small>They are clocked out and flagged for you under To resolve. Midnight suits most venues. Pick an earlier time if you close in the afternoon.</small></div><select data-bind="tt.fc.cut" aria-label="Cut-off time" style="width:130px">${opts.map(o=>`<option value="${o[0]}" ${mins(o[0])===mins(cur)?'selected':''}>${o[1]}</option>`).join('')}</select></div>`
   +`<div class="tg"><div class="tx"><b>Warn me when someone is clocked in longer than</b><small>Shows a warning on the Dashboard. It does not clock them out. 0 turns the warning off.</small></div>${NUM('tt.fc.flagH',f.flagH,'min="0" max="24" aria-label="Hours before the warning"')} hours</div>`
   +tgl('tt.fc.ask',f.ask,'Ask for the real finish time at the kiosk','The next time they tap their name they enter when they finished. You check it under To resolve.') }
/* kiosk: ask for the real finish time */
function kNeedFix(pid){ if(!fcSet().ask)return null; return by(S.entries.filter(e=>e.pid===pid&&e.needOut&&e.out!=null&&e.st!=='approved'),e=>e.date)[0]||null }
function kFixHtml(q){ const e=S.entries.find(x=>x.id===q.fix), p=P(q.pid); if(!e)return ''; const v=q.fixV!=null?q.fixV:'';
  return `<h2>${esc(p.name.split(' ')[0])}, you did not clock out on ${fdate(e.date)}</h2><p style="color:#c3cae0;font-size:17px;margin:8px 0 14px">You clocked in at <b style="color:#fff">${fT(e.in)}</b>. What time did you finish?</p><input id="kfix" class="kfix" type="time" value="${v}" data-i="kFixV" aria-label="Time you finished"><p style="color:#ff8a8a;min-height:22px;font-weight:700;margin:8px 0">${esc(q.err||'')}</p><div class="kfx-btns"><button class="btn pri lg" data-a="kFix">Save finish time</button><button class="btn lg" data-a="kFixSkip">I am not sure. A manager will fix it</button></div>` }
I.kFixV=el=>{ if(U.kq){ U.kq.fixV=el.value; U.kq.err=''; kClose(90000) } };
A.kFix=()=>{ const q=U.kq; if(!q)return; const e=S.entries.find(x=>x.id===q.fix); const el=$('#kfix'); const v=(el&&el.value)||q.fixV||''; const m=mins(v);
  if(!e){ q.step='act'; renderKiosk(); return } if(m==null||isNaN(m)){ q.err='Enter the time you finished.'; renderKiosk(); kClose(90000); return }
  if(m<=e.in){ q.err='That is before you clocked in at '+fT(e.in)+'.'; renderKiosk(); kClose(90000); return }
  e.out=m; delete e.needOut; e.note=(e.note||'').replace('Auto clock-out (forgot to clock out)','Auto clock-out: finish time entered by '+P(q.pid).name.split(' ')[0]);
  q.fixV=null; q.err=''; q.step='act'; commit(); renderKiosk(); kClose(30000); toast('Thank you. A manager will check it.') };
A.kFixSkip=()=>{ const q=U.kq; if(!q)return; q.skip=(q.skip||[]).concat(q.fix); q.fixV=null; q.err=''; q.step='act'; renderKiosk(); kClose(30000) };
function kFixGate(q){ if(!q||q.step!=='act'||!q.pid)return; const e=kNeedFix(q.pid); if(e&&!(q.skip||[]).includes(e.id)){ q.step='fix'; q.fix=e.id; q.fixV=null; q.err='' } }
