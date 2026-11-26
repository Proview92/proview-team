/* ===== Photos on tasks and checklists (owner, 26 Nov 2026) =====
   Staff add a photo to a task for the day (the phone camera opens); managers see it from anywhere on the Tasks page.
   Each photo is its own small record in S.tkPhotos ({id, tid, d, by, at, data}) so ticking a checklist never re-sends
   pictures. A photo is shrunk to 720px before it is kept, at most 4 for a task on one day, and cleared after 14 days.
   A task can also be set to need a photo before it can be marked done. */
const TKPH_MAX=4, TKPH_DAYS=14;
const tkPhotosOf=(t,d)=>by((S.tkPhotos||[]).filter(x=>x.tid===t.id&&x.d===d),x=>x.at);
const tkPhCan=x=>x.by===me().id||isMgr(me());
function tkPhShrink(f,cb){ if(!f||!/^image\//.test(f.type)){ cb(null,'Please take or choose a photo.'); return }
  const url=URL.createObjectURL(f), im=new Image();
  im.onload=()=>{ const sc=Math.min(1,720/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(im.width*sc)); c.height=Math.max(1,Math.round(im.height*sc)); const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(im,0,0,c.width,c.height); let data=c.toDataURL('image/jpeg',0.55); if(data.length>200000)data=c.toDataURL('image/jpeg',0.4); URL.revokeObjectURL(url); cb(data) };
  im.onerror=()=>{ URL.revokeObjectURL(url); cb(null,'Could not read that photo. Please try again.') }; im.src=url }
/* the block shown inside a task: the day's photos and the Add photo button */
function tkPhotoBlock(t,d,pid){ const L=tkPhotosOf(t,d), full=L.length>=TKPH_MAX, old=d<addD(today(),-TKPH_DAYS);
  return `<div class="tkph" id="tkph" data-pid="${pid||''}"><h3>Photos${t.needPh?' <span class="chip amber">Needed to finish</span>':''}</h3>${L.length?`<div class="tkph-g">${L.map(x=>`<button type="button" class="tkph-t" data-a="tkPhView" data-id="${x.id}" title="Open photo" aria-label="Open photo by ${esc((P(x.by)||{}).name||'someone')}"><img src="${x.data}" alt=""><small>${esc(((P(x.by)||{}).name||'').split(' ')[0])} · ${fT(new Date(x.at).getHours()*60+new Date(x.at).getMinutes())}</small></button>`).join('')}</div>`:`<p class="mut" style="margin:0 0 8px">${old?'Photos are kept for '+TKPH_DAYS+' days.':'No photo yet for '+esc(fdate(d))+'.'}</p>`}${old?'':full?`<p class="mut" style="margin:6px 0 0">That is the most for one day (${TKPH_MAX}).</p>`:`<label class="btn tkph-add">${ic('cam')}Add photo<input type="file" accept="image/*" capture="environment" data-i="tkPhoto" data-id="${t.id}" data-d="${d}" data-pid="${pid||''}" hidden></label>`}</div>` }
/* redraw the photo block of the task that is open, without touching anything typed in the form */
function tkPhRefresh(t,d){ const el=$('#tkph'); if(!el||!t)return; const pid=el.dataset.pid||''; el.outerHTML=tkPhotoBlock(t,d,pid) }
I.tkPhoto=el=>{ const f=el.files&&el.files[0]; if(!f||el._busy)return; el._busy=true; /* a file box fires twice (input and change): take the photo once */ const t=S.tasks.find(x=>x.id===el.dataset.id), d=el.dataset.d; if(!t)return;
  if(tkPhotosOf(t,d).length>=TKPH_MAX){ toast('That is the most photos for one day.'); return }
  toast('Adding the photo…');
  tkPhShrink(f,(data,err)=>{ if(!data){ toast(err||'Could not add the photo.'); return }
    S.tkPhotos.push({id:uid(),tid:t.id,d,by:me().id,at:Date.now(),data}); commit(); tkPhRefresh(t,d); toast('Photo added. Managers can see it now.') }) };
A.tkPhView=d=>{ const x=(S.tkPhotos||[]).find(y=>y.id===d.id); if(!x)return; const t=S.tasks.find(y=>y.id===x.tid); const when=new Date(x.at);
  modal(`<div class="tkph-v"><img src="${x.data}" alt="Photo for ${esc(t?t.title:'task')}"><p><b>${esc(t?t.title:'Task')}</b><br><span class="mut">${esc((P(x.by)||{}).name||'Someone')} · ${esc(fdate(x.d))} at ${fT(when.getHours()*60+when.getMinutes())}</span></p><div class="r">${tkPhCan(x)?`<button class="btn danger" data-a="tkPhDel" data-id="${x.id}">${ic('trash')}Remove photo</button>`:''}<button class="btn pri" data-a="mclose">Close</button></div></div>`,true) };
A.tkPhDel=d=>{ const x=(S.tkPhotos||[]).find(y=>y.id===d.id); if(!x||!tkPhCan(x))return; S.tkPhotos=S.tkPhotos.filter(y=>y.id!==x.id); $('#mdl-root').innerHTML=''; commit(); tkPhRefresh(S.tasks.find(y=>y.id===x.tid),x.d); toast('Photo removed') };
/* a small camera count for cards and rows */
const tkPhChip=(t,d)=>{ const n=tkPhotosOf(t,d).length; return n?`<span class="chip blue tkph-c" title="${plural(n,'photo')}">${ic('cam')}${n}</span>`:(t.needPh?`<span class="chip amber tkph-c" title="A photo is needed">${ic('cam')}0</span>`:'') };
/* Tasks page, Photos tab: every photo taken on the chosen day, task by task, plus tasks still waiting for one */
function tkPhotoDay(day){ const L=(S.tkPhotos||[]).filter(x=>x.d===day); const ids=uniq(L.map(x=>x.tid)); const wait=tasksOn(day).filter(t=>t.needPh&&!ids.includes(t.id));
  const tm=x=>{ const w=new Date(x.at); return fT(w.getHours()*60+w.getMinutes()) };
  const sec=ids.map(id=>{ const t=S.tasks.find(y=>y.id===id); const ph=by(L.filter(x=>x.tid===id),x=>x.at); const st=t&&taskOccurs(t,day)?taskState(t,day):''; return `<div class="card pad tkpd"><div class="row" style="margin-bottom:8px"><b style="flex:1;min-width:0">${esc(t?t.title:'Deleted task')}</b>${st==='done'?'<span class="chip green">Done</span>':st==='prog'?'<span class="chip blue">In progress</span>':st?'<span class="chip">To do</span>':''}</div><div class="tkph-g">${ph.map(x=>`<button type="button" class="tkph-t" data-a="tkPhView" data-id="${x.id}" aria-label="Open photo"><img src="${x.data}" alt=""><small>${esc(((P(x.by)||{}).name||'').split(' ')[0])} · ${tm(x)}</small></button>`).join('')}</div></div>` }).join('');
  const w=wait.length?`<div class="card pad tkpd"><b>Still waiting for a photo</b>${wait.map(t=>`<div class="tkc" style="padding:8px 0"><span class="chip amber tkph-c">${ic('cam')}0</span><span style="flex:1;min-width:0">${esc(t.title)}</span><button class="btn sm" data-a="taskEdit" data-id="${t.id}" data-d="${day}">Open</button></div>`).join('')}</div>`:'';
  return (sec+w)||`<div class="card">${empty('No photos on this day','Staff add them from a task with Add photo.')}</div>` }
