/* kiosk extras for a shared tablet: after name and PIN a person can also open today's checklist
   (tick tasks, add photos) and look at the team rota. Nothing here can change the rota. */
const K_IDLE=60000;
function kTaskRows(pid,d){ const L=tasksOn(d).map(t=>{ const as=taskAssignees(t,d), mine=as.includes(pid), open=!as.length; return {t,as,mine,open,can:mine||open,done:mine?taskDoneBy(t,d,pid):taskState(t,d)==='done'} }); return by(L,x=>(x.can?'0':'1')+(x.t.time||'99:99')+x.t.title) }
function kTasksHtml(q){ const p=P(q.pid), d=today(), L=kTaskRows(p.id,d), left=L.filter(x=>x.can&&!x.done).length;
  const rows=L.map(x=>{ const t=x.t, ph=tkPhotosOf(t,d), full=ph.length>=TKPH_MAX;
    const who=x.mine?'':x.open?'Anyone':'For '+x.as.map(id=>esc(((P(id)||{}).name||'').split(' ')[0])).join(', ');
    return `<div class="kx-row ${x.done?'dn':''} ${x.can?'':'no'}"><button class="kx-ck" data-a="kTk" data-id="${t.id}" ${x.can?'':'disabled'} aria-label="${x.done?'Done. Tap to undo':'Mark done'}: ${esc(t.title)}">${x.done?ic('check'):''}</button><div class="kx-tx"><b>${esc(t.title||'Task')}</b>${t.notes?`<small>${esc(t.notes)}</small>`:''}<small>${[t.time?esc(t.time):'',who,t.needPh&&!ph.length?'<span class="kx-need">Photo needed</span>':''].filter(Boolean).join(' · ')}</small>${ph.length?`<div class="kx-ths">${ph.map(y=>`<img src="${y.data}" alt="Photo by ${esc(((P(y.by)||{}).name||'someone'))}">`).join('')}</div>`:''}</div>${full||!x.can?'':`<label class="btn kx-ph">${ic('cam')}<span>${ph.length?'Add another':'Add photo'}</span><input type="file" accept="image/*" capture="environment" data-i="kPhoto" data-id="${t.id}" hidden></label>`}</div>` }).join('');
  return `<div class="kx-hd"><div><h2>Today's checklist</h2><p>${esc(p.name)} · ${L.length?(left?left+' to do':'All done'):'Nothing today'}</p></div><button class="btn" data-a="kGo" data-k="act">Back</button><button class="btn pri" data-a="kcancel">Finish</button></div><div class="kx-body" id="kxb">${rows||'<p class="kx-empty">No tasks on the checklist today.</p>'}</div>` }
function kRotaHtml(q){ const p=P(q.pid), ws=q.ws||wkStart(today()), days=weekDays(ws), t=today();
  const shs=S.shifts.filter(s=>s.pid&&s.date>=ws&&s.date<=addD(ws,6)&&(s.pub||s.date<t));
  const ids=uniq(shs.map(s=>s.pid)); const ppl=by(S.people.filter(x=>!x.archived&&(ids.includes(x.id))),x=>(x.id===p.id?'0':'1')+x.name);
  const tbl=ppl.length?`<table class="kx-rt"><thead><tr><th></th>${days.map(d=>`<th class="${d===t?'tod':''}">${DN[dow(d)]}<small>${Number(d.slice(8))}</small></th>`).join('')}</tr></thead><tbody>${ppl.map(x=>`<tr class="${x.id===p.id?'me':''}"><th>${esc(x.name.split(' ')[0])}</th>${days.map(d=>{ const l=by(shs.filter(s=>s.pid===x.id&&s.date===d),s=>s.start); return `<td class="${d===t?'tod':''}">${l.map(s=>`<span>${fT(s.start)}${s.ne?'':'<br>'+fT(s.end)}</span>`).join('')||'<i>·</i>'}</td>` }).join('')}</tr>`).join('')}</tbody></table>`:'<p class="kx-empty">The rota for this week is not published yet.</p>';
  return `<div class="kx-hd"><div><h2>Team rota</h2><p>To look at only. Ask a manager for changes.</p></div><button class="btn" data-a="kGo" data-k="act">Back</button><button class="btn pri" data-a="kcancel">Finish</button></div><div class="kx-wk"><button class="btn" data-a="kRw" data-v="-1" aria-label="Week before">${ic('chl')}</button><b>${fdate(ws)} to ${fdate(addD(ws,6))}</b><button class="btn" data-a="kRw" data-v="1" aria-label="Week after">${ic('chr')}</button></div><div class="kx-body kx-scroll" id="kxb">${tbl}</div>` }
/* the two extra buttons under Clock in / Clock out */
function kMoreBtns(p){ const left=kTaskRows(p.id,today()).filter(x=>x.can&&!x.done).length;
  return `<button class="btn lg" data-a="kGo" data-k="tasks">${ic('tasks')}Today's checklist${left?` <span class="kx-n">${left}</span>`:''}</button><button class="btn lg" data-a="kGo" data-k="rota">${ic('cal')}Team rota</button>` }
A.kGo=d=>{ const q=U.kq; if(!q||!q.pid)return; q.step=d.k; U.kHold=0; renderKiosk(); kClose(d.k==='act'?30000:K_IDLE) };
A.kRw=d=>{ const q=U.kq; if(!q)return; q.ws=addD(q.ws||wkStart(today()),7*Number(d.v)); renderKiosk(); kClose(K_IDLE) };
A.kTk=d=>{ const q=U.kq; if(!q||!q.pid)return; const day=today(); const x=kTaskRows(q.pid,day).find(y=>y.t.id===d.id); if(!x||!x.can)return;
  if(!x.done&&x.t.needPh&&!tkPhotosOf(x.t,day).length){ toast('Add a photo first, then tick it.'); kClose(K_IDLE); return }
  taskCheck(x.t,day,x.mine?q.pid:null); commit(); renderKiosk(); kClose(K_IDLE) };
I.kPhoto=el=>{ const f=el.files&&el.files[0]; const q=U.kq; if(!f||el._busy||!q||!q.pid)return; el._busy=true; const t=S.tasks.find(x=>x.id===el.dataset.id), d=today(), pid=q.pid; if(!t)return;
  if(tkPhotosOf(t,d).length>=TKPH_MAX){ toast('That is the most photos for one day.'); return }
  toast('Adding the photo…'); U.kHold=Date.now();
  tkPhShrink(f,(data,err)=>{ U.kHold=0; if(!data){ toast(err||'Could not add the photo.'); kClose(K_IDLE); return }
    S.tkPhotos.push({id:uid(),tid:t.id,d,by:pid,at:Date.now(),data}); commit(); if(U.kiosk&&U.kq&&U.kq.pid===pid){ renderKiosk(); kClose(K_IDLE) } toast('Photo added. Managers can see it now.') }) };
/* keep the screen open while someone is using it or the camera is open; go back to the names when they stop */
document.addEventListener('pointerdown',e=>{ if(!U.kiosk||!U.kq||!e.target.closest)return; if(e.target.closest('.kx-ph'))U.kHold=Date.now(); if((U.kq.step==='tasks'||U.kq.step==='rota')&&e.target.closest('#kiosk-root'))kClose(K_IDLE) },true);
document.addEventListener('scroll',e=>{ if(U.kiosk&&U.kq&&(U.kq.step==='tasks'||U.kq.step==='rota'))kClose(K_IDLE) },true);
