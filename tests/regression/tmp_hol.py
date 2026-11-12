import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w,h in [(1100,800),(390,844)]:
        ctx=b.new_context(viewport={'width':w,'height':h}); pg=ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300)
        pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render()"); pg.wait_for_timeout(150)
        pg.evaluate("A.loginAs({id:'u1'})"); pg.evaluate("S.org.name='Brags and Brams';migrate();A.demoLoad&&A.demoLoad()"); pg.wait_for_timeout(300)
        print(pg.evaluate("S.policies.map(x=>x.name+':'+x.accrual).join(', ')"))
        pg.evaluate("go('timeoff')"); pg.wait_for_timeout(200)
        pg.evaluate("U.t.lv='bal';render()"); pg.wait_for_timeout(300)
        print(w,pg.evaluate("document.querySelector('#main').innerText.slice(0,900).replace(/\\n/g,' | ')"))
        pg.screenshot(path=f'/tmp/hol-bal-{w}.png')
        pg.evaluate("go('docs')"); pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/hol-docs-{w}.png')
        print(w,pg.evaluate("document.querySelector('#main').innerText.slice(0,700).replace(/\\n/g,' | ')"))
        pg.evaluate("A.docPerson({id:S.people.find(x=>!x.archived&&x.role==='member').id})"); pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/hol-pers-{w}.png')
        pg.evaluate("closePanel();go('settings')"); 
        pg.evaluate("A.editPol({id:'po5'})"); pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/hol-pol-{w}.png')
        print('errs',errs)
