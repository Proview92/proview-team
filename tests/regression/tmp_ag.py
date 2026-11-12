from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':420,'height':900}).new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(400)
    ev=pg.evaluate
    print('Ceylan earliest:',ev("S.people.find(p=>/ceylan/i.test(p.name)).earliest"))
    r=ev("""(()=>{ const ws=wkStart(addD(today(),7)); const days=weekDays(ws); const nm=id=>(P(id)||{name:'OPEN'}).name;
      const dun=S.people.find(p=>p.name==='Duygu').id, kam=S.people.find(p=>p.name==='Kamilla').id, nic=S.people.find(p=>p.name==='Nicole').id;
      S.avail.push({id:uid(),pid:kam,date:days[2],kind:'cant',note:'',ts:1}); S.avail.push({id:uid(),pid:nic,date:days[3],kind:'can',note:'',ts:1});
      S.shifts=S.shifts.filter(s=>s.date<ws||s.date>addD(ws,6));
      const res=autoRota(ws); const out={res,days:{}};
      days.forEach(d=>{ out.days[DN[dow(d)]]=S.shifts.filter(s=>s.date===d).sort((a,b)=>a.start-b.start).map(s=>nm(s.pid)+' '+fT(s.start)).join(', ') });
      out.cover=S.cover.map(r=>[r.name,r.from,r.n,days.map(d=>covApplies(r,d)?covCount(r,d)+'/'+r.n:'-').join(' ')]);
      out.kamWedShift=S.shifts.some(s=>s.pid===kam&&s.date===days[2]); out.nicThuShift=S.shifts.some(s=>s.pid===nic&&s.date===days[3]);
      out.ceylan=S.shifts.filter(s=>P(s.pid)&&/ceylan/i.test(P(s.pid).name)).map(s=>DN[dow(s.date)]+' '+fT(s.start));
      return out })()""")
    print(json.dumps(r,indent=1))
    print(errs)
