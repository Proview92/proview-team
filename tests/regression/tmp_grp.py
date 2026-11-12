from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w,h in [(1200,900),(390,844)]:
        pg=b.new_context(viewport={'width':w,'height':h}).new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300)
        pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render();A.loginAs({id:'u1'});A.demoLoad()")
        for pgname in ['rota','timesheets']:
            pg.evaluate(f"go('{pgname}')"); pg.wait_for_timeout(300); pg.screenshot(path=f'/tmp/grp-{pgname}-{w}.png')
            print(w,pgname,pg.evaluate("[...document.querySelectorAll('tr.grph')].map(x=>x.innerText.replace(/\\s+/g,' ')).join(' / ')"),errs)
        pg.evaluate("go('timesheets');U.t.tsv='day';render()"); pg.wait_for_timeout(200)
        print(w,'day',pg.evaluate("document.querySelectorAll('tr.grph').length"))
