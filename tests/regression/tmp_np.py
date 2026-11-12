from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':1200,'height':800}).new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300)
    pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render();A.loginAs({id:'u1'});A.demoLoad()")
    pg.evaluate("go('s-projects')"); pg.wait_for_timeout(300); print(pg.evaluate("document.querySelector('#main').innerText.slice(0,200).replace(/\\n/g,' | ')")); pg.screenshot(path='/tmp/np-set.png')
    pg.evaluate("go('s-tracking')"); pg.wait_for_timeout(300); print('reqProj' , 'Require project' in pg.evaluate("document.body.innerText"))
    pg.evaluate("go('reports')"); pg.wait_for_timeout(300); print(pg.evaluate("document.body.innerText.includes('Project')"))
    pg.evaluate("go('dash')"); pg.wait_for_timeout(300); print('dash',pg.evaluate("document.body.innerText.includes('Project')"))
    pg.evaluate("go('timesheets');A.addEntry({d:today()})"); pg.wait_for_timeout(300); print('entry',pg.evaluate("document.body.innerText.includes('Project')")); pg.screenshot(path='/tmp/np-entry.png')
    pg.evaluate("closePanel();go('clock')"); pg.wait_for_timeout(300); print('clock',pg.evaluate("document.body.innerText.includes('Project')"))
    print(errs)
