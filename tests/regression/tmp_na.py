from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':1200,'height':800}).new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300)
    pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render();A.loginAs({id:'u1'});A.demoLoad()")
    T=lambda: pg.evaluate("document.body.innerText")
    pg.evaluate("go('s-projects')"); pg.wait_for_timeout(300); print(pg.evaluate("document.querySelector('#main').innerText.slice(0,400).replace(/\\n/g,' | ')")); pg.screenshot(path='/tmp/na-set.png')
    pg.evaluate("A.editAct({id:S.activities[0].id})"); pg.wait_for_timeout(300); print('panel',pg.evaluate("document.querySelector('#pnl-root').innerText.slice(0,300).replace(/\\n/g,' | ')")); pg.evaluate("closePanel()")
    for pgname in ['reports','dash','timesheets']:
        pg.evaluate(f"go('{pgname}')"); pg.wait_for_timeout(300); print(pgname,'Activit' in T())
    pg.evaluate("A.addEntry({d:today()})"); pg.wait_for_timeout(300); print('entry','Activit' in T()); pg.evaluate("closePanel()")
    pg.evaluate("go('clock')"); pg.wait_for_timeout(300); print('clock','Activit' in T())
    pg.evaluate("go('reports');"); 
    print(errs)
