import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=2)
    pg=ctx.new_page(); pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300); pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render()"); pg.wait_for_timeout(150)
    for who,k in [('u3','home'),('u3','clock'),('u1','timesheets'),('u1','rota'),('u1','dash'),('u1','reports')]:
        pg.evaluate("id=>A.loginAs({id})",who); pg.evaluate("k=>go(k)",k); pg.wait_for_timeout(250)
        pg.screenshot(path=f'/tmp/ph-{who}-{k}.png')
    b.close()
