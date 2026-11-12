import sys,json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1280,'height':900}); errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(400)
    print('org',pg.evaluate("S.org.name"),'people',pg.evaluate("S.people.length"),'today',pg.evaluate("today()"))
    out=pg.evaluate("""()=>{ const ws=addD(wkStart(today()),7); U.t.rw=ws; const r=autoRota(ws); commit();
      const days=weekDays(ws); const rows=days.map(d=>DN[dow(d)]+' '+d.slice(5)+': '+S.shifts.filter(s=>s.date===d).sort((a,b)=>a.start-b.start).map(s=>(s.pid?P(s.pid).name:'OPEN')+' '+fT(s.start)+'-'+fT(s.end)+(s.note?' ['+s.note+']':'')).join(' | '));
      const cov=S.cover.map(rr=>rr.name+': '+days.map(d=>covApplies(rr,d)?covCount(rr,d)+'/'+rr.n:'-').join(' '));
      const hrs=S.people.filter(p=>!p.noTrack).map(p=>p.name+' '+(sum(S.shifts.filter(s=>s.pid===p.id&&s.date>=ws&&s.date<=addD(ws,6)),shMin)/60).toFixed(1)+'h');
      return {r,rows,cov,hrs} }""")
    print(json.dumps(out,indent=1))
    pg.evaluate("go('rota')"); pg.wait_for_timeout(300)
    pg.screenshot(path='/tmp/rota-next.png')
    print('ERRORS',errs)
    b.close()
