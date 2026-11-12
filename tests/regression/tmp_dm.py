from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    for w,h in [(1400,760),(1180,820),(1024,768),(820,1100),(768,1000),(390,844)]:
        pg=b.new_context(viewport={'width':w,'height':h}).new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300)
        pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render();A.loginAs({id:'u1'});S.org.name='Brags and Brams';migrate();A.demoLoad()")
        pg.evaluate("go('docs')"); pg.wait_for_timeout(300)
        r=pg.evaluate("(()=>{const t=document.querySelector('.tw');return [t.scrollWidth,t.clientWidth]})()")
        print(w,r,errs); pg.screenshot(path=f'/tmp/dm-{w}.png')
