import sys
from playwright.sync_api import sync_playwright
w=int(sys.argv[1]) if len(sys.argv)>1 else 1280
h=int(sys.argv[2]) if len(sys.argv)>2 else 800
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':w,'height':h},accept_downloads=True)
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300); pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render()"); pg.wait_for_timeout(150)
    def main(n=300): return pg.evaluate("document.querySelector('#main').innerText.slice(0,%d).replace(/\\n/g,' | ')"%n)
    def pnl(n=400): return pg.evaluate("(document.querySelector('#pnl-root')||{innerText:''}).innerText.slice(0,%d).replace(/\\n/g,' | ')"%n)
    def toast(): return pg.evaluate("document.querySelector('#toast').innerText")
    pg.evaluate("A.loginAs({id:'u1'})"); pg.evaluate("go('reports')"); pg.wait_for_timeout(300)
    print('time:',main(700)); pg.screenshot(path=f'/tmp/flow6-rep-{w}.png',full_page=True)
    pg.select_option('[data-i=rpp]','month'); pg.wait_for_timeout(200); print('month:',main(200))
    pg.click('[data-a=tab][data-v=mem]') ; pg.wait_for_timeout(150); print('by member:',pg.evaluate("document.querySelector('.card table.t')?.innerText.slice(0,200).replace(/\\n/g,' | ')"))
    pg.click('[data-a=rpFilters]'); pg.wait_for_timeout(200); pg.select_option('#pnl-body select[name=pid]',index=1); pg.click('[data-a=psave]'); pg.wait_for_timeout(250); print('filtered:',main(260))
    with pg.expect_download(timeout=4000) as dl:
        pg.click('[data-a=rpExport]'); pg.wait_for_timeout(300); pg.click('#pnl-root .btn.pri')
    print('csv:',dl.value.suggested_filename, open(dl.value.path()).read()[:160].replace('\n',' / '))
    pg.evaluate("U.t.rf={};U.t.rp='att';render()"); pg.wait_for_timeout(200); print('att:',main(700)); pg.screenshot(path=f'/tmp/flow6-att-{w}.png')
    pg.evaluate("U.t.rp='files';render()"); pg.wait_for_timeout(200); print('files:',main(300))
    with pg.expect_download(timeout=4000) as dl: pg.click('[data-a=expAgain] >> nth=0')
    print('again:',dl.value.suggested_filename)
    pg.evaluate("go('ai')"); pg.wait_for_timeout(250); print('ai:',main(300))
    for q in ['Who is working right now?','Who was late this week?','How many hours did the team work this week?','Who is off this month?','Who has the most overtime this month?','Which timesheets need approval?','What does labour cost this month?','Who is working tomorrow?','Which tasks are not done today?']:
        pg.evaluate("q=>aiAnswer(q)",q)
        print(q,'->',pg.evaluate("q=>aiAnswer(q).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').slice(0,150)",q))
    pg.fill('#aiq','what is the weather'); pg.press('#aiq','Enter'); pg.wait_for_timeout(300); print('free:',pg.evaluate("[...document.querySelectorAll('.aib')].pop().innerText.slice(0,160)"))
    pg.click('[data-a=aiHow]'); pg.wait_for_timeout(150); print('how:',pg.evaluate("document.querySelector('.alert.info')?.innerText.slice(0,80)"))
    pg.screenshot(path=f'/tmp/flow6-ai-{w}.png',full_page=True)
    pg.evaluate("A.loginAs({id:'u2'})"); pg.evaluate("go('ai')"); pg.wait_for_timeout(200); print('mgr cost:',pg.evaluate("aiAnswer('what does labour cost')"))
    print('ERRORS:',errs[:10]); b.close()
