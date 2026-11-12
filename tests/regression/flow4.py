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
    def mdl(): return pg.evaluate("(document.querySelector('#mdl-root')||{innerText:''}).innerText.replace(/\\n/g,' | ')")
    pg.evaluate("A.loginAs({id:'u1'})"); pg.evaluate("go('tasks')"); pg.wait_for_timeout(250)
    pg.screenshot(path=f'/tmp/flow4-board-{w}.png')
    # start a card, done a card
    pg.click('[data-a=tkMove][data-to=prog] >> nth=0'); pg.wait_for_timeout(200); print('after start:',main(200))
    pg.click('[data-a=tkMove][data-to=done] >> nth=0'); pg.wait_for_timeout(200)
    print('counts:',pg.evaluate("[...document.querySelectorAll('.colm h3')].map(h=>h.innerText.replace(/\\n/g,' '))"))
    # new task
    pg.click('[data-a=taskEdit][data-id=""]'); pg.wait_for_timeout(250)
    pg.fill('#pnl-body input[name=title]','Wipe down terrace tables'); pg.select_option('#pnl-body select[name=mode]','shiftAll'); pg.wait_for_timeout(100)
    print('shift visible:',pg.evaluate("!document.querySelector('.tk-shift').hidden"),'person hidden:',pg.evaluate("document.querySelector('.tk-person').hidden"))
    pg.fill('#pnl-body textarea[name=list]','Spray tables\nDry chairs'); pg.select_option('#pnl-body select[name=rep]','daily')
    pg.click('[data-a=psave]'); pg.wait_for_timeout(300); print('toast:',toast(),'| tasks:',pg.evaluate("S.tasks.length"))
    # task without person -> validation
    pg.click('[data-a=taskEdit][data-id=""]'); pg.wait_for_timeout(200); pg.fill('#pnl-body input[name=title]','x'); pg.click('[data-a=psave]'); pg.wait_for_timeout(200); print('valid toast:',toast()); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    # list tab
    pg.evaluate("U.t.tk='list';render()"); pg.wait_for_timeout(150); print('list:',main(250)); pg.fill('[data-i=tkq]','wipe'); pg.wait_for_timeout(200); print('filtered rows:',pg.evaluate("document.querySelectorAll('#tkbody tbody tr').length"))
    # delete newest
    pg.click('#tkbody tbody tr >> nth=0'); pg.wait_for_timeout(200); pg.click('[data-a=taskDel]'); pg.wait_for_timeout(200); pg.click('[data-a=askok]'); pg.wait_for_timeout(200); print('after del:',pg.evaluate("S.tasks.length"))
    # staff tasks
    pg.evaluate("A.loginAs({id:'u3'})"); pg.evaluate("go('mytasks')"); pg.wait_for_timeout(250)
    pg.click('[data-a=tkOpen] >> nth=0'); pg.wait_for_timeout(250); print('staff task panel:',pnl(250))
    pg.click('#pnl-body input[type=checkbox] >> nth=0'); pg.wait_for_timeout(200); print('item toggled:',pg.evaluate("S.tasks.find(t=>t.title==='Opening checklist').cl"))
    pg.click('#pnl-root [data-a=tkTog]'); pg.wait_for_timeout(250); print('done now:',pg.evaluate("taskDoneBy(S.tasks.find(t=>t.title==='Opening checklist'),today(),'u3')"))
    # staff time off request
    pg.evaluate("go('timeoff')"); pg.wait_for_timeout(250); print('staff timeoff:',main(200))
    pg.click('[data-a=lvAdd]'); pg.wait_for_timeout(250); print('req panel:',pnl(200)); print('calc:',pg.evaluate("document.querySelector('#lvcalc').innerText"))
    pg.fill('#pnl-body input[name=from]',pg.evaluate("addD(today(),20)")); pg.fill('#pnl-body input[name=to]',pg.evaluate("addD(today(),22)")); pg.dispatch_event('#pnl-body input[name=to]','change'); pg.wait_for_timeout(150)
    print('calc2:',pg.evaluate("document.querySelector('#lvcalc').innerText"))
    pg.click('[data-a=psave]'); pg.wait_for_timeout(300); print('toast:',toast(),'| leave:',pg.evaluate("S.leave.length")); 
    # overlap
    pg.click('[data-a=lvAdd]'); pg.wait_for_timeout(200); pg.fill('#pnl-body input[name=from]',pg.evaluate("addD(today(),21)")); pg.fill('#pnl-body input[name=to]',pg.evaluate("addD(today(),21)")); pg.click('[data-a=psave]'); pg.wait_for_timeout(200); print('overlap toast:',toast()); pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    # manager approves
    pg.evaluate("A.loginAs({id:'u2'})"); pg.evaluate("go('timeoff')"); pg.wait_for_timeout(200)
    pg.evaluate("U.t.lv='over';U.t.lvf='pending';render()"); pg.wait_for_timeout(200); print('pending list:',main(300)); pg.screenshot(path=f'/tmp/flow4-over-{w}.png')
    pg.click('[data-a=lvReview] >> nth=0'); pg.wait_for_timeout(250); pg.click('#pnl-root .pf .pri'); pg.wait_for_timeout(250); print('toast:',toast())
    pg.evaluate("U.t.lv='bal';render()"); pg.wait_for_timeout(200); print('bal:',main(400)); pg.screenshot(path=f'/tmp/flow4-bal-{w}.png')
    pg.evaluate("U.t.lv='cal';render()"); pg.wait_for_timeout(200); pg.click('[data-a=lmNext]'); pg.wait_for_timeout(200); print('cal:',main(120)); pg.screenshot(path=f'/tmp/flow4-cal-{w}.png')
    pg.click('.cal .ev >> nth=0'); pg.wait_for_timeout(200); print('day panel:',pnl(200))
    print('ERRORS:',errs[:10]); b.close()
