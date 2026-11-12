from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':900})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(800)
    pg.evaluate("()=>go('ai')"); pg.wait_for_timeout(300)
    pg.click('[data-a=demoLoad]'); pg.wait_for_timeout(500)
    pg.fill('#aiq','How many hours did Duygu work last week?'); pg.click('[data-a=aiGo]'); pg.wait_for_timeout(500)
    pg.screenshot(path='/tmp/ai1.png')
    n=pg.evaluate("()=>S.shifts.filter(x=>x.demo).length"); print('demo shifts',n)
    pg.click('[data-a=demoClear]'); pg.wait_for_timeout(300); pg.click('[data-a=askok]'); pg.wait_for_timeout(400)
    print('after clear',pg.evaluate("()=>[S.shifts.filter(x=>x.demo).length,S.entries.filter(x=>x.demo).length,S.leave.filter(x=>x.demo).length]"),errs)
    b.close()
