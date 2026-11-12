from playwright.sync_api import sync_playwright
import datetime
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':900,'height':950}); pg=ctx.new_page()
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.clock.install(time=datetime.datetime.fromisoformat('2026-11-11T10:00:00')); pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(900)
    pg.evaluate("()=>{ const d=S.people.find(x=>x.name==='Duygu'); S.shifts=S.shifts.filter(s=>s.pid!==d.id); S.ui.real=S.ui.me; S.ui.me=d.id; go('home')}");pg.wait_for_timeout(300)
    pg.evaluate("()=>A.avOpen({})");pg.wait_for_timeout(300)
    pg.fill("[name=swOff]","2026-11-16"); pg.fill("[name=swOn]","2026-11-18"); pg.screenshot(path='/tmp/sw1.png'); pg.click("text=Send"); pg.wait_for_timeout(400)
    print('toast:',pg.evaluate("()=>document.querySelector('#toast').textContent"))
    print(pg.evaluate("()=>JSON.stringify(S.avail.map(a=>[a.date,a.kind,a.st,a.note,!!a.sw]))"))
    print('mgr notif:',pg.evaluate("()=>S.notifs.filter(n=>/swap/.test(n.text||n.t||'')).map(n=>n.text||n.t)"))
    # manager approves
    pg.evaluate("()=>{ S.ui.me=S.ui.real; S.ui.real=undefined; render(); A.avYes({id:S.avail.find(a=>a.kind==='cant').id}) }");pg.wait_for_timeout(300)
    print(pg.evaluate("()=>JSON.stringify(S.avail.map(a=>[a.date,a.kind,a.st]))"))
    print('staff notif:',pg.evaluate("()=>S.notifs.filter(n=>/swap/.test(n.text||n.t||'')).map(n=>n.text||n.t)"))
    print(pg.evaluate("""()=>{ const d=S.people.find(x=>x.name==='Duygu'); const nw=addD(wkStart(today()),7); const days=weekDays(nw); S.shifts=S.shifts.filter(s=>!(s.date>=nw&&s.date<=addD(nw,6))); autoRota(nw); return days.map(x=>DN[dow(x)]+(S.shifts.some(s=>s.pid===d.id&&s.date===x)?'=WORK':'=off')).join(' ')}"""))
    print(errs); ctx.close(); b.close()
