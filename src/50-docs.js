/* ===== staff documents: welcome pack (e-sign), allergen chart, signed document ===== */
const WELCOME_TXT=`## Welcome to Brags and Brams
We are glad you are here. This pack explains how we work day to day. Please read it all, then sign at the bottom. Ask your manager if anything is unclear.

## Your hours and the rota
- The rota runs Monday to Sunday and is made every Sunday for the following week.
- Tell your manager which days you need off as early as you can. Requests made after the rota is published may not be possible.
- Be at your station, in uniform and ready, at your start time.

## Clocking in and out
- Clock in when you start and clock out when you finish, using the app or the shared tablet.
- Never clock in or out for someone else.
- If you forget, tell your manager the same day so your hours can be corrected.

## Breaks
- Take your break when your manager tells you. Unpaid breaks are taken off your hours.

## Being unwell
- If you cannot come in, phone your manager as early as you can, before your shift starts. A text message on its own is not enough.

## Food safety and hygiene
- Wash your hands before work, after the toilet, after handling raw food, bins or money, and whenever they are dirty.
- Tie long hair back, keep nails short and clean, and wear no jewellery on your hands.
- Tell your manager before you start work if you have had sickness or diarrhoea in the last 48 hours.
- Clean as you go and keep your area tidy.

## Allergens
- Customers rely on us to get this right. Never guess.
- If you are asked about allergens, check the allergen chart. If you are not sure, ask your manager before you answer.
- Keep allergen ingredients apart, and clean surfaces and equipment between orders.
- You must have your allergen chart or certificate on file with its expiry date. Your documents are reviewed once a year.

## Cash and the till
- Handle money at the till only, and tell your manager straight away about any mistake.

## Phones and social media
- Keep your phone away while serving. Do not post photos of customers or of private areas without permission.

## Respect and safety
- We treat each other and our customers with respect. Bullying, harassment and discrimination are never acceptable.
- Report accidents, near misses or anything unsafe to your manager straight away.

## Your trial shift
- Your first shift is a trial shift. It lets you and us see if the job is right for you.
- Your manager will tell you the day, start time and how the trial is paid before you start.
- During the trial you follow everything in this pack, the same as any member of the team.
- After the trial we will tell you whether we would like you to join the team, and you can tell us whether you would like to.

## Your onboarding
- On your first day: meet the team, put your things in the staff area, and learn where the fire exits, first aid kit and allergen chart are.
- You will be shown how to use the app to clock in and out, see your rota and ask for time off.
- You will work alongside an experienced team member until your manager is happy you can work on your own.
- Complete your three documents in the app: this signed pack, your allergen chart with its expiry date, and your signed document.
- Ask questions at any time. There is no such thing as a silly question about food safety or allergens.

## Your information
- We keep the documents you give us (your signed pack, allergen chart and signed document) only to run the business and to meet the law. Ask your manager if you want to see them.`;
const DOCSET_DEF=()=>({gate:false,reviewMonths:12,third:'Signed contract or ID',allergenLink:'',welcome:{title:'Welcome pack',ver:1,body:WELCOME_TXT}});
const FSA_LINK='https://allergytraining.food.gov.uk/';
const dset=()=>{ if(!S.docSet)S.docSet=DOCSET_DEF(); const w=S.docSet.welcome; if(w&&typeof w.body==='string'&&!/trial shift/i.test(w.body)){ const add=WELCOME_TXT.slice(WELCOME_TXT.indexOf('## Your trial shift'),WELCOME_TXT.indexOf('## Your information')); w.body=w.body.indexOf('## Your information')>-1?w.body.replace('## Your information',add+'## Your information'):w.body.trimEnd()+'\n\n'+add.trimEnd() } return S.docSet };
const dDiff=(a,b)=>Math.round((pd(a)-pd(b))/864e5);
const dAddM=(s,n)=>{ const d=pd(s); d.setMonth(d.getMonth()+n); return ds(d) };
const msDay=ms=>ds(new Date(ms));
const CERTS=[['fh','Food hygiene'],['fa','First aid'],['rtw','Right to work']];
function certChip(p,k){ const c=((p.docs||{}).certs||{})[k]; if(!c)return '<span class="mut">—</span>'; const n=dDiff(c,today()); const sd=fdm(c)+(c.slice(0,4)!==today().slice(0,4)?' '+c.slice(2,4):''); return n<0?'<span class="chip red" title="Expired">'+sd+'</span>':n<=30?'<span class="chip amber" title="Ends soon">'+sd+'</span>':'<span class="chip green" title="Valid">'+sd+'</span>' }
const mini=(cls,t,tip)=>'<span class="chip '+cls+' mini" title="'+esc(tip||t)+'">'+t+'</span>';
function reqChips(p){ const st=docSt(p), set=dset(), a=(p.docs||{}).allergen; const ok=(b,t,tip)=>mini(b?'green':'red',t,tip+(b?': on file':': missing'));
  let al; if(!st.allergen)al=mini('red','Allergen','Allergen chart: missing'); else { const n=dDiff(a.expires,today()); al=n<0?mini('red','Allergen','Allergen chart: expired'):n<=30?mini('amber','Allergen','Allergen chart: expires in '+n+' days'):mini('green','Allergen','Allergen chart: valid to '+fdate(a.expires)) }
  return '<div class="reqs">'+ok(st.welcome,'Pack',set.welcome.title)+(isTrial(p)?'<span class="mut" style="font-size:12px">others not needed</span>':al+ok(st.third,'ID',set.third))+'</div>' }
const dTrack=()=>S.people.filter(p=>!p.archived&&!p.noTrack);

function docSt(p){ const d=p.docs||{}, set=dset();
  const welcome=!!(d.welcome&&d.welcome.ver>=set.welcome.ver);
  const allergen=!!(d.allergen&&(d.allergen.file||d.allergen.link)&&d.allergen.expires);
  const third=!!(d.third&&d.third.file);
  return {welcome,allergen,third,n:(welcome?1:0)+(allergen?1:0)+(third?1:0)} }
const isTrial=p=>!!(p&&p.trial&&p.trial.date&&p.trial.date>=today());
const docsComplete=p=>isTrial(p)?docSt(p).welcome:docSt(p).n===3;
const ovrOn=p=>{ const o=p.docs&&p.docs.ovr; return !!o&&(!o.until||o.until>=today()) };
function canStart(p){ if(p&&!p.noTrack&&isTrial(p))return docSt(p).welcome||ovrOn(p); if(!p||!dset().gate||p.noTrack)return true; return docsComplete(p)||ovrOn(p) }
function docsTouch(p){ if(isTrial(p))return; const d=p.docs=p.docs||{}; if(docsComplete(p)&&!d.doneAt){ d.doneAt=Date.now(); S.people.filter(x=>!x.archived&&isAdmin(x)).forEach(a=>notify(a.id,p.name+' has all three documents on file','doc')) } }
function reviewDue(p){ const d=p.docs||{}; if(!docsComplete(p))return null; const base=d.reviewed||d.doneAt; if(!base)return null; return dAddM(msDay(base),dset().reviewMonths||12) }

function docAlertsFor(p){ const out=[]; if(!p||p.noTrack||p.archived)return out; const st=docSt(p), d=p.docs||{}, t=today(), set=dset();
  if(isTrial(p)){ if(!st.welcome)out.push({pid:p.id,k:'miss',sev:ovrOn(p)?'warn':'bad',trial:true,txt:'Trial: the '+set.welcome.title.toLowerCase()+' has not been confirmed yet.'+(ovrOn(p)?' Allowed to start for now.':' Cannot clock in until it is.')}); return out }
  if(st.n<3){ const miss=[!st.welcome&&'welcome pack',!st.allergen&&'allergen chart',!st.third&&set.third].filter(Boolean);
    out.push({pid:p.id,k:'miss',sev:(set.gate&&!ovrOn(p))?'bad':'warn',txt:`${st.n} of 3 documents on file. Missing: ${miss.join(', ')}.`+(set.gate?(ovrOn(p)?' Allowed to start for now.':' Cannot clock in yet.'):'')}) }
  const a=d.allergen; if(a&&a.expires){ const n=dDiff(a.expires,t); if(n<0)out.push({pid:p.id,k:'aexp',sev:'bad',txt:`Allergen chart expired on ${fdate(a.expires)}.`}); else if(n<=30)out.push({pid:p.id,k:'aexp',sev:'warn',txt:`Allergen chart expires in ${plural(n,'day')} (${fdate(a.expires)}).`}) }
  const nx=reviewDue(p); if(nx){ const n=dDiff(nx,t); if(n<=30)out.push({pid:p.id,k:'rev',sev:n<0?'bad':'warn',txt:n<0?`Yearly document review overdue since ${fdate(nx)}.`:`Yearly document review due ${fdate(nx)}.`}) }
  return out }
function docAlerts(){ const m=me(); if(!m||!isTop(m))return []; const ok=new Set(team({scope:'org'}).map(p=>p.id)); return dTrack().filter(p=>p.licensed&&(isAdmin(m)||ok.has(p.id))).flatMap(p=>docAlertsFor(p).map(a=>({...a,name:p.name}))) }

/* ----- file reading (photos are shrunk so everything fits in the browser) ----- */
function readDoc(f,cb){ if(!f){cb(null);return}
  const isImg=/^image\//.test(f.type), isPdf=f.type==='application/pdf'||/\.pdf$/i.test(f.name);
  if(isImg){ const url=URL.createObjectURL(f); const im=new Image(); im.onload=()=>{ const sc=Math.min(1,1000/Math.max(im.width,im.height)); const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(im.width*sc)); c.height=Math.max(1,Math.round(im.height*sc)); const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(im,0,0,c.width,c.height); const data=c.toDataURL('image/jpeg',0.6); URL.revokeObjectURL(url); cb({name:f.name.replace(/\.[^.]+$/,'')+'.jpg',type:'image/jpeg',size:Math.round(data.length*0.75),data}) }; im.onerror=()=>{URL.revokeObjectURL(url);cb(false,'Could not read that image.')}; im.src=url; return }
  if(isPdf){ if(f.size>250*1024){cb(false,'That PDF is over 250 KB. Take a photo of the page instead, or use a smaller PDF.');return} const r=new FileReader(); r.onload=()=>cb({name:f.name,type:'application/pdf',size:f.size,data:r.result}); r.onerror=()=>cb(false,'Could not read that file.'); r.readAsDataURL(f); return }
  cb(false,'Please choose a photo or a PDF.') }
A.docGet=async d=>{ const p=P(d.pid); const x=p&&p.docs&&p.docs[d.k]; const f=x&&x.file; if(!f){toast('No file to open');return} try{ const b=await (await fetch(f.data)).blob(); await saveFile(f.name,b,b.type) }catch(e){toast('Could not open the file')} };

/* ----- the welcome pack text ----- */
function packHtml(txt){ let h='',inUl=false; String(txt||'').split('\n').forEach(l=>{ if(l.startsWith('- ')){ if(!inUl){h+='<ul>';inUl=true} h+='<li>'+esc(l.slice(2))+'</li>'; return } if(inUl){h+='</ul>';inUl=false} if(l.startsWith('## '))h+='<h3 style="margin:16px 0 4px">'+esc(l.slice(3))+'</h3>'; else if(l.trim())h+='<p style="margin:4px 0">'+esc(l)+'</p>' }); return h+(inUl?'</ul>':'') }
const wfiles=()=>dset().welcome.files||[];
const kb=n=>Math.max(1,Math.round((n||0)/1024))+' KB';
function packFilesHtml(withCk){ const f=wfiles(); if(!f.length)return ''; return `<h3 style="margin:14px 0 6px">Documents to read (${f.length})</h3>${f.map(x=>`<div class="nowc" style="flex-wrap:wrap;gap:8px"><div style="flex:1;min-width:150px"><b>${esc(x.name)}</b><small style="display:block;color:var(--mut)">${/pdf/i.test(x.type||'')?'PDF':'Photo'} · ${kb(x.size)}</small></div><button class="btn sm" type="button" data-a="packFile" data-id="${x.id}">${ic('doc')}Open</button>${withCk?`<label class="ck" style="margin:0"><input type="checkbox" name="ck_${x.id}"> I have read it</label>`:''}</div>`).join('')}` }
A.packFile=d=>{ const f=wfiles().find(x=>x.id===d.id); if(!f){toast('No file to open');return} (async()=>{ try{ const b=await (await fetch(f.data)).blob(); await saveFile(f.name,b,b.type) }catch(e){toast('Could not open the file')} })() };
A.docSign=()=>{ const p=me(), set=dset(); openPanel({title:set.welcome.title,wide:true,saveLabel:'Confirm and sign',body:`<div class="card pad" style="max-height:44vh;overflow:auto;margin-bottom:12px">${packHtml(set.welcome.body)}</div>${packFilesHtml(true)}${lab('Type your full name to sign',inp('name',p.name,'autocomplete="name"'))}<label class="ck" style="margin-top:6px"><input type="checkbox" name="agree"> I have read and understood the ${esc(set.welcome.title.toLowerCase())}${wfiles().length?' and the documents above':''}, including the trial shift and onboarding sections</label><p class="mut" style="font-size:12px">Typing your name and ticking the box is your electronic signature. The date and time are saved with it.</p>`,
  save:v=>{ const miss=wfiles().filter(f=>!v['ck_'+f.id]); if(miss.length){toast('Open each document and tick "I have read it" ('+miss.length+' left)');return false} if(!v.agree){toast('Tick the box to say you have read it');return false} if(!v.name||v.name.trim().length<3){toast('Type your full name to sign');return false}
    p.docs=p.docs||{}; p.docs.welcome={at:Date.now(),name:v.name.trim(),ver:set.welcome.ver,files:wfiles().map(f=>f.id)}; docsTouch(p);
    if(isTrial(p))S.people.filter(x=>!x.archived&&isAdmin(x)).forEach(a=>notify(a.id,p.name+' confirmed the '+set.welcome.title.toLowerCase()+' for their trial','doc'));
    commit(); if(S.ui.handBack){ S.ui.handBack=null; save(); A.signout(); toast('Thank you. Please hand the phone back.'); return } toast('Signed. Thank you.') }}) };
A.docRead=()=>{ const set=dset(); openPanel({title:set.welcome.title,wide:true,nofoot:true,body:`<div class="card pad">${packHtml(set.welcome.body)}${packFilesHtml(false)}</div><div class="row" style="margin-top:12px"><button class="btn" data-a="pclose">Close</button></div>`}) };
A.docPack=d=>{ const p=P(d.pid); const w=p&&p.docs&&p.docs.welcome; if(!w)return; const set=dset(); const t=new Date(w.at); saveFile('welcome-pack-'+p.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.txt',set.welcome.title+' (version '+w.ver+')\n\n'+set.welcome.body.replace(/^## /gm,'').replace(/^- /gm,'* ')+(w.files&&w.files.length?'\n\nDocuments confirmed: '+w.files.map(id=>((wfiles().find(f=>f.id===id)||{}).name||'file')).join(', '):'')+'\n\n---\nSigned electronically by '+w.name+' ('+p.name+') on '+fdate(msDay(w.at))+' at '+pad(t.getHours())+':'+pad(t.getMinutes())+'.','text/plain') };

/* ----- allergen chart and signed document uploads (members, or a manager for them) ----- */
function linksBlock(){ const set=dset(); return `<div class="card pad" style="margin-bottom:12px"><b>Do not have an allergen chart yet?</b><p class="mut" style="margin:4px 0 8px">Do the free allergen training, save your certificate, then add it here.</p><div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn sm" href="${FSA_LINK}" target="_blank" rel="noopener">Free allergen training (Food Standards Agency)</a>${set.allergenLink?`<a class="btn sm" href="${esc(set.allergenLink)}" target="_blank" rel="noopener">Our allergen chart</a>`:''}</div></div>` }
A.docUp=d=>{ const p=P(d.pid); if(!p)return; const k=d.k; const x=(p.docs&&p.docs[k])||{}; const set=dset(); const self=p.id===me().id;
  const body=k==='allergen'
   ?`${linksBlock()}${lab('Photo or PDF of your allergen chart or certificate',`<input type="file" name="file" accept="image/*,application/pdf">`)}${x.file?`<p class="mut" style="margin:-4px 0 8px">On file now: ${esc(x.file.name)}. Choose a new file only to replace it.</p>`:''}${lab('Or a link to it (optional)',inp('link',x.link||'','type="url" placeholder="https://"'))}${lab('Expiry date',`<input type="date" name="expires" value="${x.expires||''}">`)}<p class="mut" style="font-size:12px">We cannot read the date from the file, so please type the expiry date shown on the certificate. If it has no expiry date, enter one year from the date it was issued.</p>`
   :`${lab(set.third+' (photo or PDF)',`<input type="file" name="file" accept="image/*,application/pdf">`)}${x.file?`<p class="mut" style="margin:-4px 0 8px">On file now: ${esc(x.file.name)}. Choose a new file only to replace it.</p>`:''}<p class="mut" style="font-size:12px">Photos are shrunk to fit. PDFs must be under 250 KB.</p>`;
  openPanel({title:(k==='allergen'?'Allergen chart':set.third)+(self?'':' for '+p.name),saveLabel:'Save',body,save:(v,b)=>{
    const f=$('[name=file]',b).files[0];
    if(k==='allergen'){ if(!f&&!x.file&&!(v.link||'').trim()){toast('Add a photo, a PDF or a link');return false} if(!v.expires){toast('Type the expiry date from the certificate');return false} if((v.link||'').trim()&&!/^https?:\/\//i.test(v.link.trim())){toast('The link must start with https://');return false} }
    else if(!f&&!x.file){toast('Choose a file');return false}
    const fin=file=>{ p.docs=p.docs||{}; const n={...x,at:Date.now(),by:me().id}; if(file)n.file=file; if(k==='allergen'){n.link=(v.link||'').trim();n.expires=v.expires}
      p.docs[k]=n; docsTouch(p); commit(); toast(k==='allergen'?(v.expires<today()?'Saved, but that date has already passed.':'Allergen chart saved'):'Saved') };
    if(f){ readDoc(f,(r,msg)=>{ if(r===false){toast(msg||'Could not read the file');return} fin(r) }); return true }
    fin(null); return true }}) };

/* ----- My documents (each member) ----- */
const dTag=(ok,yes,no,warn)=>`<span class="chip ${ok?'green':warn?'amber':'red'}">${ok?yes:no}</span>`;
function fileLine(p,k){ const x=(p.docs||{})[k]; if(!x||!x.file)return ''; const img=/^data:image/.test(x.file.data||''); return `<div class="row" style="gap:10px;margin:8px 0">${img?`<img src="${x.file.data}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid var(--line)">`:`<span class="av sm" style="background:var(--pri)">${ic('doc')}</span>`}<div style="flex:1;min-width:0"><b style="word-break:break-all">${esc(x.file.name)}</b><small style="display:block;color:var(--mut)">Added ${fdate(msDay(x.at))}</small></div><button class="btn sm" data-a="docGet" data-pid="${p.id}" data-k="${k}">${ic('dl')}Open</button></div>` }
function allergenChip(p){ const a=(p.docs||{}).allergen; if(!docSt(p).allergen)return dTag(false,'','Missing'); const n=dDiff(a.expires,today()); return n<0?dTag(false,'','Expired'):n<=30?dTag(false,'','Expires in '+n+' d',true):dTag(true,'Valid to '+fdate(a.expires)) }
V.mydocs=()=>{ const p=me(); const d=p.docs||{}; const st=docSt(p); const set=dset(); const al=docAlertsFor(p);
  const card=(t,chip,body,btns)=>`<div class="card pad" style="margin-bottom:12px"><div class="row" style="gap:10px;align-items:center;flex-wrap:wrap"><h2 style="margin:0;flex:1;font-size:17px">${t}</h2>${chip}</div>${body}<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${btns}</div></div>`;
  const w=d.welcome&&d.welcome.ver>=set.welcome.ver;
  if(isTrial(p))return `<div class="card pad" style="margin-bottom:14px"><b>Your trial on ${fdate(p.trial.date)}</b><p class="mut" style="margin:6px 0 0">Welcome. Read the ${esc(set.welcome.title.toLowerCase())}${wfiles().length?', open each document':''} and confirm it. That is all you need for your trial.</p></div>
   ${card('Welcome pack',dTag(w,'Confirmed','Not confirmed'),w?`<p class="mut" style="margin:8px 0 0">Confirmed by ${esc(d.welcome.name)} on ${fdate(msDay(d.welcome.at))}.</p>`:`<p class="mut" style="margin:8px 0 0">${wfiles().length?plural(wfiles().length,'document')+' to read, then ':''}tick and type your name.</p>`,w?`<button class="btn" data-a="docRead">Read again</button>`:`<button class="btn pri" data-a="docSign">Read and confirm</button>`)}`;
  return `${st.n<3&&set.gate&&!ovrOn(p)?`<div class="alert" style="margin-bottom:14px">${ic('lock')}<div style="flex:1"><b>You cannot clock in until all three documents are on file.</b></div></div>`:''}
   <div class="card pad" style="margin-bottom:14px"><b>${st.n} of 3 documents on file</b><div class="prog" style="margin-top:8px"><i style="width:${Math.round(st.n/3*100)}%"></i></div>${al.filter(a=>a.k!=='miss').map(a=>`<p style="margin:8px 0 0;color:var(--${a.sev==='bad'?'bad':'warn'})">${esc(a.txt)}</p>`).join('')}</div>
   ${card('1. '+esc(set.welcome.title),dTag(w,'Signed','Not signed'),w?`<p class="mut" style="margin:8px 0 0">Signed by ${esc(d.welcome.name)} on ${fdate(msDay(d.welcome.at))}.</p>`:(d.welcome?`<p class="mut" style="margin:8px 0 0">The pack was updated. Please read it and sign again.</p>`:`<p class="mut" style="margin:8px 0 0">Read the pack and sign it with your name.</p>`),w?`<button class="btn" data-a="docRead">Read again</button>`:`<button class="btn pri" data-a="docSign">Read and sign</button>`)}
   ${card('2. Allergen chart',allergenChip(p),fileLine(p,'allergen')+(d.allergen&&d.allergen.link?`<p style="margin:6px 0"><a href="${esc(d.allergen.link)}" target="_blank" rel="noopener">Open your link</a></p>`:'')+(st.allergen?`<p class="mut" style="margin:6px 0 0">Expiry date: <b>${fdate(d.allergen.expires)}</b></p>`:linksBlock()),`<button class="btn ${st.allergen?'':'pri'}" data-a="docUp" data-pid="${p.id}" data-k="allergen">${st.allergen?'Replace or change expiry':'Add my allergen chart'}</button>`)}
   ${card('3. '+esc(set.third),dTag(st.third,'On file','Missing'),fileLine(p,'third')||`<p class="mut" style="margin:8px 0 0">Take a photo or choose a file and upload it here.</p>`,`<button class="btn ${st.third?'':'pri'}" data-a="docUp" data-pid="${p.id}" data-k="third">${st.third?'Replace':'Upload'}</button>`)}` };

/* ----- Documents (managers) ----- */
function staffDocRow(p){ const st=docSt(p), d=p.docs||{}, nx=reviewDue(p), set=dset();
  const rv=nx?(()=>{ const n=dDiff(nx,today()); return dTag(n>30,fdm(nx),n<0?'Overdue':fdm(nx),n>=0) })():'<span class="mut">—</span>';
  const go=!set.gate?'<span class="chip">Open</span>':docsComplete(p)?'<span class="chip green">Yes</span>':ovrOn(p)?'<span class="chip purple">Override</span>':'<span class="chip red">Blocked</span>';
  return `<tr class="clk" data-a="docPerson" data-id="${p.id}"><td><div class="who">${av(p,'sm')}<b>${esc(p.name)}</b>${isTrial(p)?' <span class="chip blue">Trial '+fdate(p.trial.date)+'</span>':''}</div></td><td>${reqChips(p)}</td><td>${rv}</td>${CERTS.map(c=>'<td>'+certChip(p,c[0])+'</td>').join('')}<td>${isTrial(p)?(docsComplete(p)?'<span class="chip green">Yes</span>':ovrOn(p)?'<span class="chip purple">Override</span>':'<span class="chip red">Blocked</span>'):go}</td></tr>` }
V.docs=()=>{ const set=dset(); const ok=new Set(team({scope:'org'}).map(p=>p.id)); let ppl=by(dTrack().filter(p=>p.licensed&&(isAdmin(me())||ok.has(p.id))),p=>p.name); const f=U.t.docf||'all'; const al=docAlerts(); const need=new Set(al.map(a=>a.pid));
  const all=ppl.length; if(f==='need')ppl=ppl.filter(p=>need.has(p.id));
  return `<div class="bar"><select data-i="docf" aria-label="Filter"><option value="all"${f==='all'?' selected':''}>Everyone (${all})</option><option value="need"${f==='need'?' selected':''}>Needs attention (${need.size})</option></select><span class="sp"></span><button class="btn pri" data-a="trialOpen">${ic('plus')}Start a trial</button><button class="btn" data-a="docRemindAll">${ic('bell')}Remind those missing</button><button class="btn" data-a="docOvrAll">Let everyone start for now</button><button class="btn" data-a="docSettings">${ic('gear')}Settings</button></div>
  <p class="mut" style="margin-top:0">${set.gate?'People cannot clock in until all three documents are on file, unless you override.':'Clock-in is not blocked. Switch it on under Settings.'} Each member needs: the ${esc(set.welcome.title.toLowerCase())} signed, an allergen chart with its expiry date, and: ${esc(set.third)}.</p>
  <div class="card tw"><table class="t doct"><thead><tr><th>Member</th><th>Required documents</th><th>Review</th>${CERTS.map(c=>'<th>'+c[1]+'</th>').join('')}<th>Clock-in</th></tr></thead><tbody>${ppl.map(staffDocRow).join('')||`<tr><td colspan="6">${empty(f==='need'?'Nothing needs attention':'Nobody to show')}</td></tr>`}</tbody></table></div><div class="doctnote"><span><i style="background:#12874a"></i>Valid</span><span><i style="background:#b86e00"></i>Ends within 30 days</span><span><i style="background:#c62a1f"></i>Expired or missing</span><span>Dates are when the certificate runs out.</span></div>` }
I.docf=el=>{ U.t.docf=el.value; render() };
A.docPerson=d=>{ const p=P(d.id); if(!p)return; const dd=p.docs||{}, st=docSt(p), set=dset(); const o=dd.ovr||{}; const nx=reviewDue(p);
  openPanel({title:p.name+' · documents',wide:true,saveLabel:'Save',body:`${p.trial?trialBanner(p):''}<div class="card pad" style="margin-bottom:10px"><div class="row" style="gap:8px;align-items:center"><b style="flex:1">${esc(set.welcome.title)}</b>${dTag(st.welcome,'Signed','Not signed')}</div>${st.welcome?`<p class="mut" style="margin:6px 0">Signed by ${esc(dd.welcome.name)} on ${fdate(msDay(dd.welcome.at))}.</p><button class="btn sm" type="button" data-a="docPack" data-pid="${p.id}">${ic('dl')}Download signed copy</button>`:`<p class="mut" style="margin:6px 0">Only ${esc(p.name.split(' ')[0])} can sign it. Send a reminder if needed.</p><button class="btn sm" type="button" data-a="docRemind" data-pid="${p.id}">${ic('bell')}Remind</button>`}</div>
   <div class="card pad" style="margin-bottom:10px"><div class="row" style="gap:8px;align-items:center"><b style="flex:1">Allergen chart</b>${allergenChip(p)}</div>${fileLine(p,'allergen')}${dd.allergen&&dd.allergen.link?`<p style="margin:6px 0"><a href="${esc(dd.allergen.link)}" target="_blank" rel="noopener">Open link</a></p>`:''}<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px"><button class="btn sm" type="button" data-a="docUp" data-pid="${p.id}" data-k="allergen">${st.allergen?'Replace or change expiry':'Add for '+esc(p.name.split(' ')[0])}</button></div></div>
   <div class="card pad" style="margin-bottom:10px"><div class="row" style="gap:8px;align-items:center"><b style="flex:1">${esc(set.third)}</b>${dTag(st.third,'On file','Missing')}</div>${fileLine(p,'third')}<div class="row" style="gap:8px;margin-top:6px"><button class="btn sm" type="button" data-a="docUp" data-pid="${p.id}" data-k="third">${st.third?'Replace':'Add for '+esc(p.name.split(' ')[0])}</button></div></div>
   <div class="card pad" style="margin-bottom:10px"><div class="row" style="gap:8px;align-items:center"><b style="flex:1">Yearly review</b>${nx?dTag(dDiff(nx,today())>30,'Due '+fdate(nx),dDiff(nx,today())<0?'Overdue':'Due '+fdate(nx),dDiff(nx,today())>=0):'<span class="mut">Starts when all three are on file</span>'}</div>${nx?`<p class="mut" style="margin:6px 0">${dd.reviewed?'Last reviewed '+fdate(msDay(dd.reviewed))+'.':'All three were filed on '+fdate(msDay(dd.doneAt))+'.'}</p><button class="btn sm" type="button" data-a="docReviewed" data-pid="${p.id}">${ic('check')}Mark reviewed today</button>`:''}</div>
   <div class="card pad" style="margin-bottom:10px"><b>Other certificates</b><p class="mut" style="margin:4px 0 8px;font-size:12px">Type the date each one runs out. Leave blank if they do not have it.</p><div class="f2">${CERTS.map(c=>lab(c[1]+' valid to','<input type="date" name="c_'+c[0]+'" value="'+(((dd.certs||{})[c[0]])||'')+'">')).join('')}</div></div>
   <div class="card pad"><b>Allow to start without all documents</b>${tgl('ovr',!!dd.ovr,'Override','They can clock in even though documents are missing.')}${lab('Note',inp('note',o.note||'','placeholder="For example: existing staff, documents to follow"'))}${lab('Until (optional)',`<input type="date" name="until" value="${o.until||''}">`)}</div>`,
  save:v=>{ p.docs=p.docs||{}; p.docs.certs=p.docs.certs||{}; CERTS.forEach(c=>{ if(v['c_'+c[0]])p.docs.certs[c[0]]=v['c_'+c[0]]; else delete p.docs.certs[c[0]] }); p.docs.ovr=v.ovr?{at:(p.docs.ovr&&p.docs.ovr.at)||Date.now(),by:me().id,note:(v.note||'').trim(),until:v.until||''}:null; commit(); toast('Saved') }}) };
A.docReviewed=d=>{ const p=P(d.pid); if(!p)return; ask('Mark '+p.name+"'s documents as reviewed?",'Mark reviewed',()=>{ p.docs.reviewed=Date.now(); commit(); A.docPerson({id:p.id}); toast('Next review '+fdate(reviewDue(p))) },false,'Check the allergen chart is still valid and the files are still correct. The next yearly review is set from today.') };
A.docRemind=d=>{ const p=P(d.pid); if(!p)return; notify(p.id,'Please finish your documents in My documents','doc'); commit(); toast('Reminder sent to '+p.name) };
A.docRemindAll=()=>{ const ppl=dTrack().filter(p=>p.licensed&&!docsComplete(p)); if(!ppl.length){toast('Everyone has all three on file');return} ppl.forEach(p=>notify(p.id,'Please finish your documents in My documents','doc')); commit(); toast('Reminded '+plural(ppl.length,'person','people')) };
A.docOvrAll=()=>{ const ppl=dTrack().filter(p=>p.licensed&&!docsComplete(p)&&!ovrOn(p)); if(!ppl.length){toast('Nobody is blocked');return} ask('Let everyone start for now?','Allow everyone',()=>{ ppl.forEach(p=>{ p.docs=p.docs||{}; p.docs.ovr={at:Date.now(),by:me().id,note:'Documents to follow',until:''} }); commit(); toast(plural(ppl.length,'person','people')+' can clock in') },false,plural(ppl.length,'person','people')+' with missing documents will be allowed to clock in. You can switch this off for each person later.') };
A.docSettings=()=>{ const s=dset(); openPanel({title:'Document settings',wide:true,saveLabel:'Save',body:`${tgl('gate',s.gate,'Block clock-in until all three are on file','Members cannot start until the welcome pack is signed, the allergen chart has an expiry date and the third document is uploaded. You can override anyone.')}<div class="f2">${lab('Third document is called',inp('third',s.third))}${lab('Yearly review every',sel('months',[[6,'6 months'],[12,'12 months'],[24,'24 months']],s.reviewMonths||12))}</div>${lab('Link to your own allergen chart (optional)',inp('alink',s.allergenLink||'','type="url" placeholder="https://"'))}<p class="mut" style="font-size:12px;margin-top:-4px">Members without an allergen chart are shown this link and the free Food Standards Agency training.</p><h3 style="margin-top:14px">Welcome pack</h3><p class="mut" style="margin-top:0">This is the standard pack every member signs. It is a starting template: edit it to match your own rules. Lines starting with ## are headings and lines starting with - are bullet points.</p>${lab('Title',inp('wtitle',s.welcome.title))}${lab('Text',`<textarea name="wbody" rows="14" style="width:100%">${esc(s.welcome.body)}</textarea>`)}<div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn sm" type="button" data-a="docTplReset">Use the standard pack again</button></div><h3 style="margin-top:14px">Attachments</h3><p class="mut" style="margin-top:0">Add the documents staff must read, such as fire safety, food hygiene or your handbook (up to 6 files). Staff open each one and tick that they have read it before they sign.</p>${(s.welcome.files||[]).map(f=>`<div class="nowc" style="gap:8px"><div style="flex:1"><b>${esc(f.name)}</b><small style="display:block;color:var(--mut)">${kb(f.size)}</small></div><label class="ck" style="margin:0"><input type="checkbox" name="rm_${f.id}"> Remove</label></div>`).join('')}${lab('Add PDFs or photos',`<input type="file" name="pfiles" accept="image/*,application/pdf" multiple>`)}<p class="mut" style="font-size:12px;margin-top:-4px">PDFs must be under 250 KB each. Photos are shrunk to fit. Use "Ask everyone to sign again" below after you add or change files.</p>${tgl('resign',false,'Ask everyone to sign again','Turn on after changing the text.')}`,
  save:(v,b)=>{ if(!(v.wtitle||'').trim()||!(v.wbody||'').trim()){toast('The welcome pack needs a title and text');return false} if((v.alink||'').trim()&&!/^https?:\/\//i.test(v.alink.trim())){toast('The link must start with https://');return false}
    s.gate=!!v.gate; s.third=(v.third||'').trim()||'Signed document'; s.reviewMonths=Number(v.months)||12; s.allergenLink=(v.alink||'').trim(); s.welcome.title=v.wtitle.trim(); s.welcome.body=v.wbody; if(v.resign)s.welcome.ver++;
    s.welcome.files=(s.welcome.files||[]).filter(f=>!v['rm_'+f.id]); const nf=Array.from($('[name=pfiles]',b).files||[]); if(!nf.length){ commit(); toast('Saved'); return true }
    if(s.welcome.files.length+nf.length>6){toast('You can attach up to 6 files. Remove some first.');return false}
    const rd=f=>new Promise(res=>readDoc(f,(r,m)=>res({r,m,n:f.name}))); (async()=>{ let ok=0,bad=[]; for(const f of nf){ const x=await rd(f); if(x.r===false)bad.push(x.n+': '+(x.m||'could not read')); else { s.welcome.files.push({id:uid(),name:x.r.name,type:x.r.type,size:x.r.size,data:x.r.data}); ok++ } } commit(); toast(bad.length?(ok?'Saved '+plural(ok,'file')+'. ':'')+bad[0]:'Saved'+(ok?' with '+plural(ok,'file'):'')) })(); return true }}) };
A.docTplReset=()=>{ const t=$('[name=wbody]'); if(t)t.value=WELCOME_TXT };

/* ----- show it everywhere it matters ----- */
const _vHome=V.home, _vClock=V.clock, _vDash=V.dash, _vInbox=V.inbox;
function withBanner(h,b){ if(!b)return h; const pb=(typeof previewBar==='function')?previewBar():''; return pb&&h.startsWith(pb)?pb+b+h.slice(pb.length):b+h }
function docBox(blocked,label,html,btn){ const mn=!!S.ui.docMin; if(mn)return `<button class="chip ${blocked?'red':'amber'}" style="margin:0 0 12px;cursor:pointer;border:0;font:inherit" data-a="docMin" aria-expanded="false">${ic(blocked?'lock':'alert')} ${esc(label)} ${ic('chd')}</button>`;
  return `<div class="alert" style="margin-bottom:14px">${ic(blocked?'lock':'alert')}<div style="flex:1">${html}</div>${btn}<button class="btn sm" data-a="docMin" aria-expanded="true" title="Minimise">Minimise ${ic('chu')}</button></div>` }
A.docMin=()=>{ S.ui.docMin=!S.ui.docMin; save(); render() };
function docBanner(p){ if(!p||p.noTrack)return ''; const al=docAlertsFor(p); if(!al.length)return ''; const blocked=!canStart(p)&&(dset().gate||isTrial(p)); const miss=al.filter(a=>a.k==='miss').length;
  return docBox(blocked,isTrial(p)?'Confirm the welcome pack':blocked?'Finish your documents':'Documents need attention',(isTrial(p)?'<b>Confirm the welcome pack to start your trial.</b> ':blocked?'<b>Finish your documents before you can clock in.</b> ':'<b>Documents:</b> ')+(isTrial(p)?'':al.map(a=>esc(a.txt)).join(' ')),`<button class="btn sm pri" data-a="go" data-k="mydocs">My documents</button>`) }
V.home=()=>withBanner(_vHome(),docBanner(me()));
V.clock=()=>withBanner(_vClock(),docBanner(me()));
V.dash=()=>{ const al=docAlerts(); const n=new Set(al.map(a=>a.pid)).size; const blocked=dset().gate&&al.some(a=>a.sev==='bad'); const b=al.length?docBox(blocked,plural(n,'person','people')+' with documents to sort',`<b>${plural(n,'person','people')} with documents to sort.</b> Details are on the Documents page.`,`<button class="btn sm pri" data-a="go" data-k="docs">Documents</button>`):''; return withBanner(_vDash(),b) };
/* Inbox: no extra documents card (alerts live on the Documents page, the Dashboard and the menu badge) */

/* menu and page rules */
(function(){ const i=NAV.findIndex(n=>n.k==='timeoff'); NAV.splice(i+1,0,{k:'docs',l:'Documents',i:'doc',b:()=>{ const n=docAlerts().length; return n?String(n):'' }},{k:'mydocs',l:'My documents',i:'doc'});
  Object.assign(TITLES,{docs:'Documents',mydocs:'My documents'}); })();
