import sys
from playwright.sync_api import sync_playwright
w=int(sys.argv[1]) if len(sys.argv)>1 else 1280
h=int(sys.argv[2]) if len(sys.argv)>2 else 800
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':w,'height':h})
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300); pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render()"); pg.wait_for_timeout(150)
    def main(n=300): return pg.evaluate("document.querySelector('#main').innerText.slice(0,%d).replace(/\\n/g,' | ')"%n)
    def pnl(n=400): return pg.evaluate("(document.querySelector('#pnl-root')||{innerText:''}).innerText.slice(0,%d).replace(/\\n/g,' | ')"%n)
    def toast(): return pg.evaluate("document.querySelector('#toast').innerText")
    pg.evaluate("A.loginAs({id:'u1'})"); pg.evaluate("go('dash')"); pg.wait_for_timeout(300)
    print('dash week:',main(700)); pg.screenshot(path=f'/tmp/flow5-dash-{w}.png',full_page=True)
    for v in ['day','month']:
        pg.evaluate(f"U.t.dp='{v}';render()"); pg.wait_for_timeout(200); print(v,':',main(160))
        pg.screenshot(path=f'/tmp/flow5-dash-{v}-{w}.png')
    pg.click('[data-a=ddPrev]'); pg.wait_for_timeout(150); print('prev:',main(80))
    pg.evaluate("go('inbox')"); pg.wait_for_timeout(200); print('inbox:',main(300))
    pg.evaluate("go('notifs')"); pg.wait_for_timeout(200); print('notifs:',main(300))
    pg.click('[data-a=notifGo] >> nth=0'); pg.wait_for_timeout(250); print('after notif click page:',pg.evaluate("U.page"))
    pg.evaluate("go('notifs')"); pg.click('[data-a=notifAll]'); pg.wait_for_timeout(200); print('after mark all:',main(120))
    # chat
    pg.click('[data-a=chat]'); pg.wait_for_timeout(250); print('chat:',pnl(300))
    pg.fill('#chatin','Test message from owner'); pg.press('#chatin','Enter'); pg.wait_for_timeout(250); print('chat after:',pnl(400))
    pg.select_option('#pnl-body select[name=ct]','u3'); pg.wait_for_timeout(200); print('dm:',pnl(160))
    pg.fill('#chatin','Hi Tom'); pg.click('[data-a=chatSend]'); pg.wait_for_timeout(200)
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    # profile
    pg.evaluate("A.loginAs({id:'u3'})"); pg.evaluate("A.profile()"); pg.wait_for_timeout(250); print('profile:',pnl(220))
    pg.fill('#pnl-body input[name=pin]','12'); pg.click('[data-a=psave]'); pg.wait_for_timeout(200); print('pin toast:',toast())
    pg.fill('#pnl-body input[name=pin]','1234'); pg.click('[data-a=psave]'); pg.wait_for_timeout(250); print('saved:',toast(), pg.evaluate("me().pin"))
    pg.evaluate("go('notifs')"); pg.wait_for_timeout(200); print('staff notifs:',main(200))
    print('ERRORS:',errs[:10]); b.close()
