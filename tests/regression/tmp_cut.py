from playwright.sync_api import sync_playwright
import datetime
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for label,when in (('wed','2026-11-11T10:00:00'),('sun','2026-11-15T10:00:00')):
        ctx=b.new_context(viewport={'width':1000,'height':900}); pg=ctx.new_page()
        errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.clock.install(time=datetime.datetime.fromisoformat(when)); pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(900)
        r=pg.evaluate("""()=>{ const d=S.people.find(x=>x.name==='Dalia'); d.role='member'; S.ui.me=d.id; S.ui.real=undefined; render();
          const mon=addD(wkStart(today()),7);
          const out={locked:avLocked(mon),cut:avCutTxt(mon),thisWeekLocked:avLocked(addD(wkStart(today()),2))};
          return JSON.stringify(out)}""")
        print(label,r)
        pg.evaluate("()=>{go('home')}");pg.wait_for_timeout(300)
        pg.evaluate("()=>A.avOpen({d:addD(wkStart(today()),7)})");pg.wait_for_timeout(300)
        pg.fill("[name=note]","test"); pg.click("text=Send"); pg.wait_for_timeout(400)
        print(' toast:',pg.evaluate("()=>document.querySelector('#toast').textContent"),' saved:',pg.evaluate("()=>S.avail.filter(a=>a.note==='test').length"))
        if label=='wed': pg.screenshot(path='/tmp/cut1.png')
        print(errs); ctx.close()
    pg=b.new_page(viewport={'width':1100,'height':900});pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(700)
    pg.evaluate("()=>{go('rota');A.rotaRules()}");pg.wait_for_timeout(400);pg.evaluate("()=>document.querySelector('#pnl-body').scrollTo(0,500)");pg.wait_for_timeout(200);pg.screenshot(path='/tmp/cut2.png')
    b.close()
