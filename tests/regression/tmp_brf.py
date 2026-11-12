from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':1300,'height':900})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(700)
    pg.evaluate("()=>{A.demoLoad();go('dash')}");pg.wait_for_timeout(500);pg.screenshot(path='/tmp/b1.png')
    pg.click(".brfbar");pg.wait_for_timeout(400);pg.screenshot(path='/tmp/b2.png')
    pg.click("text=To resolve (");pg.wait_for_timeout(400);print(pg.evaluate("()=>U.page"))
    print(errs);b.close()
