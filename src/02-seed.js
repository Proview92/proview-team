/* ===== demo data ===== */
function rng(seed){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}}
const UK_HOL=[['2026-01-01',"New Year's Day"],['2026-04-03','Good Friday'],['2026-04-06','Easter Monday'],['2026-05-04','Early May bank holiday'],['2026-05-25','Spring bank holiday'],['2026-08-31','Summer bank holiday'],['2026-12-25','Christmas Day'],['2026-12-28','Boxing Day (substitute)'],['2027-01-01',"New Year's Day"],['2027-03-26','Good Friday'],['2027-03-29','Easter Monday'],['2027-05-03','Early May bank holiday'],['2027-05-31','Spring bank holiday'],['2027-08-30','Summer bank holiday'],['2027-12-27','Christmas Day (substitute)'],['2027-12-28','Boxing Day (substitute)']];
const defOT=()=>({daily:{on:true,h:8,m:1.5},dbl:{on:false,h:12,m:2},weekly:{on:false,h:40,m:1.5},rest:{on:false,m:1.5},ph:{on:false,m:2}});
function mkDays(on,from,to,hrs){return [0,1,2,3,4,5,6].map(i=>({on:on.includes(i),from:on.includes(i)?from:'',to:on.includes(i)?to:'',hrs:on.includes(i)?(hrs||0):0}))}
function seedDemo(){
  const R=rng(20261109), t=today(), mon=wkStart(t);
  const o={v:1,
    org:{name:'Demo Café',address:'12 High Street, London',email:'accounts@example.com',vat:'',currency:'GBP',weekStart:'mon',country:'GB',tz:'Europe/London',startMonth:1,timeFmt:'24',durFmt:'hm',radiusUnit:'m',seats:10},
    ui:{}, perms:{mgrEditProfiles:true,mgrViewAll:true,mgrViewAllTimesheets:false,mgrEditLocs:true,mgrEditEntries:true,mgrClockFor:true,memWho:false,memEditOwn:true},
    locations:[{id:'l1',name:'Main café',addr:'12 High Street, London',lat:51.5205,lng:-0.1534,radius:100,archived:false},{id:'l2',name:'Market stall',addr:'Covent Garden Market, London',lat:51.5136,lng:-0.1213,radius:300,archived:false}],
    groups:[{id:'g1',name:'Front of house',mgr:'u2'},{id:'g2',name:'Kitchen',mgr:'u2'}],
    schedules:[
      {id:'s1',name:'Opening shift',type:'fixed',days:mkDays([0,1,2,3,4],'07:30','15:30'),hours:40,brk:[{id:'b1',name:'Lunch',min:30,paid:false,from:'11:30',to:'13:30'}],auto:true,pay:{early:false,split:''},ot:defOT(),locs:'any',isDef:true},
      {id:'s2',name:'Closing shift',type:'fixed',days:mkDays([0,1,2,3,4],'10:30','18:30'),hours:40,brk:[{id:'b2',name:'Lunch',min:30,paid:false,from:'13:00',to:'15:00'}],auto:true,pay:{early:false,split:''},ot:defOT(),locs:'any'},
      {id:'s3',name:'Weekend team',type:'fixed',days:mkDays([5,6],'09:00','17:00'),hours:16,brk:[{id:'b3',name:'Lunch',min:30,paid:false,from:'12:00',to:'14:00'}],auto:true,pay:{early:false,split:''},ot:{...defOT(),rest:{on:false,m:1.5}},locs:'any'},
      {id:'s4',name:'Kitchen flexible',type:'weekly',days:[0,1,2,3,4,5,6].map(i=>({on:true,from:i>=1&&i<=5?'09:00':'',to:i>=1&&i<=5?'15:00':'',hrs:0})),hours:30,brk:[],auto:false,pay:{early:false,split:''},ot:{...defOT(),daily:{on:false,h:8,m:1.5},weekly:{on:true,h:30,m:1.5}},locs:'any'}],
    activities:[{id:'a1',code:'BAR',name:'Barista and counter',bill:false,rate:0,archived:false},{id:'a2',code:'KIT',name:'Kitchen prep',bill:false,rate:0,archived:false},{id:'a3',code:'CLN',name:'Cleaning',bill:false,rate:0,archived:false},{id:'a4',code:'STK',name:'Stock and deliveries',bill:false,rate:0,archived:false},{id:'a5',code:'CAT',name:'Catering job',bill:true,rate:28,archived:false}],
    clients:[],
    projects:[],
    people:[], entries:[], shifts:[], cover:[
      {id:'cv1',name:'Weekday opening',days:[0,1,2,3,4],from:'07:30',to:'15:30',n:2,brkN:1,brkM:30,g:'g1',act:'a1',loc:'l1',hol:false},
      {id:'cv2',name:'Weekend',days:[5,6],from:'09:00',to:'17:00',n:2,brkN:1,brkM:30,g:'',act:'a1',loc:'l1',hol:true}],
    rotaRules:{maxDays:5,minRest:11,avoidOT:true,fair:true},
    tasks:[], policies:[
      {id:'po1',name:'Annual leave',paid:true,units:'days',accrual:'none',ent:28,exclHol:true,exclNon:true,carry:5,color:'#3f5fd0',members:'all',archived:false},
      {id:'po2',name:'Sick leave',paid:true,units:'days',accrual:'none',ent:0,exclHol:false,exclNon:true,carry:0,color:'#c62a1f',members:'all',archived:false},
      {id:'po3',name:'Unpaid leave',paid:false,units:'days',accrual:'none',ent:0,exclHol:false,exclNon:true,carry:0,color:'#7a6a00',members:'all',archived:false}],
    leave:[], calendars:[{id:'h1',name:'England and Wales',def:true,country:'GB',region:'England and Wales',dates:UK_HOL.map(([d,n])=>({d,n})),members:'all'}],
    payslips:[], chat:[], notifs:[], exports:[],
    tt:{dev:{mobile:true,kiosk:true,web:true,desktop:true,offline:true},ver:{face:false,selfie:false},loc:{live:false,req:false,geo:false,autoIn:false,autoOut:false},ent:{reqAct:false,reqProj:false,editOwn:true,editLoc:false},rs:{on:false,early:15,late:30},kpin:false,
        appr:{on:true,period:'week',lock:true,remind:true},round:{inMode:'none',inStep:15,outMode:'none',outStep:15,grace:5,otMult:1.5}},
    onb:{done:{sched:true,locs:true,team:true},dismissed:false}};
  const mk=(id,name,role,g,sc,rate,extra)=>({id,name,role,g,sched:sc,rate,email:name.toLowerCase().replace(/[^a-z ]/g,'').replace(/ /g,'.')+'@example.com',phone:'',code:'DC-'+id.slice(1),pin:'',locs:'all',feats:{},licensed:true,archived:false,start:addD(t,-200-Math.floor(R()*500)),last:'',noTrack:false,...extra});
  o.people=[mk('u1','Jordan Hale','owner','', 's1',0,{noTrack:true}),mk('u2','Priya Nair','manager','g1','s1',16.5),mk('u3','Tom Becker','member','g1','s1',13.2),mk('u4','Amara Okafor','member','g2','s1',13.8),mk('u5','Luca Ferrari','member','g2','s2',14.5),mk('u6','Mia Chen','member','g1','s2',13.2),mk('u7','Dan Whitaker','member','g1','s3',13),mk('u8','Sofia Reyes','member','g1','s3',13),mk('u9','Ibrahim Yusuf','member','g2','s4',15)];
  o.people[1].feats={people:true};
  // leave
  o.leave=[{id:'lv1',pid:'u3',pol:'po1',from:addD(mon,7),to:addD(mon,9),half:false,note:'Family trip',st:'approved',ts:Date.now()-864e5*3},
    {id:'lv2',pid:'u6',pol:'po1',from:addD(mon,11),to:addD(mon,11),half:false,note:'Appointment',st:'pending',ts:Date.now()-36e5*5},
    {id:'lv3',pid:'u7',pol:'po2',from:addD(t,-9),to:addD(t,-8),half:false,note:'Unwell',st:'approved',ts:Date.now()-864e5*9},
    {id:'lv4',pid:'u4',pol:'po1',from:addD(mon,-14),to:addD(mon,-12),half:false,note:'',st:'approved',ts:Date.now()-864e5*30}];
  const onLeave=(pid,d)=>o.leave.some(l=>l.pid===pid&&l.st==='approved'&&d>=l.from&&d<=l.to);
  // shifts for 3 past weeks + this + next
  const planned=(p,d)=>{const sc=o.schedules.find(s=>s.id===p.sched); if(!sc||p.noTrack)return null; const c=sc.days[dow(d)]; if(!c||!c.on||!c.from)return null; const f=mins(c.from),e=mins(c.to); return {from:f,to:e,brk:(e-f>=360)?sum(sc.brk.filter(b=>!b.paid),b=>b.min):0}};
  const nowM=nowMin();
  for(let i=-21;i<14;i++){ const d=addD(mon,i); o.people.forEach(p=>{ const pl=planned(p,d); if(!pl||onLeave(p.id,d)||(d>=addD(t,-0)&&false))return;
      const sh={id:uid(),pid:p.id,date:d,start:pl.from,end:pl.to,brk:pl.brk,act:p.g==='g2'?'a2':'a1',loc:'l1',note:'',pub:d<addD(mon,7)};
      o.shifts.push(sh);
      if(d<t||(d===t&&pl.from<=nowM)){
        if(R()<0.05&&d!==t)return; // absent
        const late=R()<0.12; const inM=pl.from+(late?10+Math.floor(R()*16):-3+Math.floor(R()*8));
        const ot=R()<0.14; const outM=pl.to+(ot?30+Math.floor(R()*50):-5+Math.floor(R()*14));
        const open=(d===t&&pl.to>nowM);
        const en={id:uid(),pid:p.id,date:d,in:Math.min(inM,d===t?nowM-1:9999),out:open?null:outM,brk:(pl.brk&&R()<0.7)?pl.brk:0,bs:null,act:sh.act,proj:'',loc:'l1',note:'',st:d<mon?'approved':'pending',src:R()<0.75?'clock':'kiosk',lat:o.locations[0].lat+(R()-0.5)*0.0006,lng:o.locations[0].lng+(R()-0.5)*0.0006};
        if(open&&en.in<0)en.in=0; if(!open&&en.out<=en.in)en.out=en.in+60; o.entries.push(en); }
  }) }
  // open shifts next week (draft) so the rota shows gaps
  o.shifts.push({id:uid(),pid:null,date:addD(mon,7),start:450,end:930,brk:30,act:'a1',loc:'l1',note:'Covering for leave',pub:false},{id:uid(),pid:null,date:addD(mon,12),start:540,end:1020,brk:30,act:'a1',loc:'l1',note:'',pub:false});
  // tasks
  const tk=(title,date,time,pri,asg,extra)=>({id:uid(),title,notes:'',date,time,loc:'l1',pri,act:'',asg,rep:'none',list:[],dn:{},ip:{},...extra});
  o.tasks=[tk('Opening checklist',t,'07:30','high',{mode:'shiftAll',pid:'',shift:'any'},{rep:'weekdays',list:[{id:uid(),t:'Switch on machines and grinder'},{id:uid(),t:'Stock fridges and display'},{id:uid(),t:'Wipe tables and set chairs'}]}),
    tk('Check allergen folder is up to date',t,'10:00','normal',{mode:'person',pid:'u3',shift:'any'}),
    tk('Deep clean the espresso machine',t,'14:00','normal',{mode:'shiftOne',pid:'',shift:'any'},{rep:'weekly'}),
    tk('Count the till float',t,'',"low",{mode:'person',pid:'u2',shift:'any'}),
    tk('Place Friday milk order',addD(t,1),'11:00','high',{mode:'person',pid:'u2',shift:'any'}),
    tk('Closing checklist',t,'17:30','high',{mode:'shiftAll',pid:'',shift:'any'},{rep:'daily',list:[{id:uid(),t:'Clean machines'},{id:uid(),t:'Empty bins'},{id:uid(),t:'Lock up and set alarm'}]})];
  // chat and notifications
  const ts=Date.now();
  o.chat=[{id:uid(),from:'u2',to:'all',text:'Morning all. New autumn menu goes live on Thursday, please read the allergen sheet.',ts:ts-36e5*5},{id:uid(),from:'u3',to:'all',text:'Got it, thanks Priya.',ts:ts-36e5*4}];
  o.notifs=[{id:uid(),to:'u1',text:'Mia Chen requested time off for '+fdate(addD(mon,11)),ts:ts-36e5*5,read:false,kind:'leave'},{id:uid(),to:'u2',text:'Mia Chen requested time off for '+fdate(addD(mon,11)),ts:ts-36e5*5,read:false,kind:'leave'},{id:uid(),to:'u3',text:'Your annual leave was approved',ts:ts-864e5*3,read:true,kind:'leave'},{id:uid(),to:'u1',text:'Next week\'s rota is still a draft',ts:ts-36e5*8,read:false,kind:'rota'},{id:uid(),to:'u2',text:'Next week\'s rota is still a draft',ts:ts-36e5*8,read:false,kind:'rota'}];
  o.payslips=[{id:uid(),pid:'u3',type:'payslip',period:'October 2026',name:'payslip-oct-2026.pdf',size:0,ts:ts-864e5*8},{id:uid(),pid:'u2',type:'payslip',period:'October 2026',name:'payslip-oct-2026.pdf',size:0,ts:ts-864e5*8}];
  return o;
}
