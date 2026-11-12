import sys
from playwright.sync_api import sync_playwright
w=int(sys.argv[1]) if len(sys.argv)>1 else 1280
h=int(sys.argv[2]) if len(sys.argv)>2 else 800
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':w,'height':h},accept_downloads=True)
    pg=ctx.new_page()
    errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300); pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render()"); pg.wait_for_timeout(150)
    def main(n=300): return pg.evaluate("document.querySelector('#main').innerText.slice(0,%d).replace(/\\n/g,' | ')"%n)
    def pnl(n=400): return pg.evaluate("(document.querySelector('#pnl-root')||{innerText:''}).innerText.slice(0,%d).replace(/\\n/g,' | ')"%n)
    pg.evaluate("A.loginAs({id:'u1'})"); pg.evaluate("go('timesheets')"); pg.wait_for_timeout(250)
    print('week:',main(600)); pg.screenshot(path=f'/tmp/flow2-week-{w}.png')
    # click a cell with hours
    pg.click('.cell b >> nth=0'); pg.wait_for_timeout(250); print('cell panel:',pnl(500)); pg.screenshot(path=f'/tmp/flow2-cell-{w}.png')
    pg.click('#pnl-root [data-a=editEntry] >> nth=0'); pg.wait_for_timeout(250); print('edit:',pnl(300))
    pg.fill('#pnl-body input[name=note]','fixed by test'); pg.click('[data-a=psave]'); pg.wait_for_timeout(300); print('after save:',pnl(200))
    pg.click('[data-a=pclose]>>nth=0') if pg.query_selector('[data-a=pclose]') else None; pg.wait_for_timeout(200)
    # add entry (time)
    pg.click('[data-a=addEntry]:visible >> nth=0'); pg.wait_for_timeout(250); print('add:',pnl(250))
    pg.select_option('#pnl-body select[name=type]','hours'); pg.wait_for_timeout(100)
    print('hours visible:',pg.evaluate("!document.querySelector('.ehours').hidden"), 'time hidden:',pg.evaluate("document.querySelector('.etime').hidden"))
    pg.click('[data-a=psave]'); pg.wait_for_timeout(300); print('toast:',pg.evaluate("document.querySelector('#toast').innerText"))
    # daily
    pg.evaluate("U.t.tsv='day';render()"); pg.wait_for_timeout(200); print('day:',main(500)); pg.screenshot(path=f'/tmp/flow2-day-{w}.png')
    pg.evaluate("U.t.tsv='week';render()")
    # export
    with pg.expect_download(timeout=4000) as dl:
        pg.click('[data-a=tsMore]:visible'); pg.click('[data-a=tsExportGo]'); pg.wait_for_timeout(300); print('PREVIEW:',pg.inner_text('#pnl-root')[:200].replace('\n',' | ')); pg.click('#pnl-root .btn.pri')
    d=dl.value; print('download:',d.suggested_filename); print(open(d.path()).read()[:300])
    # approvals
    pg.evaluate("U.t.ts='appr';render()"); pg.wait_for_timeout(200); print('appr:',main(500)); pg.screenshot(path=f'/tmp/flow2-appr-{w}.png')
    pg.click('[data-a=apprv][data-to=approved] >> nth=0'); pg.wait_for_timeout(300); print('toast:',pg.evaluate("document.querySelector('#toast').innerText"))
    pg.click('[data-a=rejAsk] >> nth=0'); pg.wait_for_timeout(200); pg.fill('#rejnote','too long break'); pg.click('[data-a=rejok]'); pg.wait_for_timeout(300); print('toast:',pg.evaluate("document.querySelector('#toast').innerText"))
    pg.click('[data-a=apprvAll]'); pg.wait_for_timeout(300); print('toast:',pg.evaluate("document.querySelector('#toast').innerText")); print('appr2:',main(300))
    # manager view
    pg.evaluate("A.loginAs({id:'u2'})"); pg.evaluate("go('timesheets')"); pg.wait_for_timeout(250); print('mgr:',main(200))
    # staff view of rejected
    print('notifs:',pg.evaluate("S.notifs.slice(0,3).map(n=>n.text)"))
    print('ERRORS:',errs[:10])
    b.close()
