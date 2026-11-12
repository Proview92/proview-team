from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w,h in [(1100,800),(390,844)]:
        pg=b.new_context(viewport={'width':w,'height':h}).new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300)
        pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render();A.loginAs({id:'u1'});S.org.name='Brags and Brams';migrate();A.demoLoad()")
        pg.evaluate("go('timesheets');A.tsMore()"); pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/px-more-{w}.png')
        pg.evaluate("A.pxOpen()"); pg.wait_for_timeout(300)
        pg.evaluate("document.querySelector('#pnl-body [name=from]').value=addD(today(),-30);document.querySelector('#pnl-body [name=to]').value=addD(today(),-3)")
        pg.screenshot(path=f'/tmp/px-open-{w}.png')
        pg.click('[data-a=psave]'); pg.wait_for_timeout(500); pg.screenshot(path=f'/tmp/px-prev-{w}.png')
        print(w,pg.evaluate("document.querySelector('#pnl-root').innerText.slice(0,500).replace(/\\n/g,' | ')"),errs)
        print(pg.evaluate("JSON.stringify(pxRows(addD(today(),-30),addD(today(),-3)).slice(0,3))"))
