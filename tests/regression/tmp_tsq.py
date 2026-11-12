from playwright.sync_api import sync_playwright
import re
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':1440,'height':900})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(700)
    pg.evaluate("()=>{A.demoLoad();U.t.tsw=addD(wkStart(today()),-7);go('timesheets')}");pg.wait_for_timeout(600)
    pg.screenshot(path='/tmp/ts_week.png')
    pg.evaluate("()=>{U.t.ts='appr';U.t.apw=addD(wkStart(today()),-7);render()}");pg.wait_for_timeout(400)
    pg.screenshot(path='/tmp/ts_appr.png')
    print(pg.evaluate("()=>S.entries.filter(e=>e.bc).map(e=>P(e.pid).name+' '+e.date+' '+e.bc.st)"))
    # staff flow
    pg.evaluate("()=>{const d=S.people.find(x=>x.name.startsWith('Duygu')); S.ui.me=d.id; U.t.msw=addD(wkStart(today()),-7); go('mysheet')}");pg.wait_for_timeout(300)
    print('Took a break btn:', pg.evaluate("()=>document.body.innerText.includes('Took a break')"))
    d=pg.evaluate("()=>{const d=S.people.find(x=>x.name.startsWith('Duygu')); const e=S.entries.find(x=>x.pid===d.id&&x.date===addD(wkStart(today()),-6)&&x.st!=='approved')||S.entries.find(x=>x.pid===d.id&&x.date>=addD(wkStart(today()),-7)&&x.date<today()&&x.out!=null); e.st='pending'; delete e.bc; return [e.id,e.date]}")
    pg.evaluate("d=>{A.breakSay({pid:S.ui.me,d:d})}",d[1]); pg.wait_for_timeout(300)
    pg.evaluate("()=>{document.querySelector('#pnl-body [name=m]').value='25'; document.querySelector('#pnl-body [name=note]').value='forgot'; }")
    pg.evaluate("()=>{const b=[...document.querySelectorAll('#pnl button, .panel button, button')].find(x=>/Tell my manager/.test(x.textContent)); b&&b.click()}"); pg.wait_for_timeout(300)
    e=pg.evaluate("id=>{const e=S.entries.find(x=>x.id===id);return e.bc}",d[0]); print('claim',e)
    print(pg.evaluate("()=>S.notifs[0].text+' | to '+P(S.notifs[0].to).name"))
    # manager accepts
    pg.evaluate("id=>{S.ui.me=S.people.find(x=>x.role==='owner').id; A.bcAdd({id})}",d[0])
    print(pg.evaluate("id=>{const e=S.entries.find(x=>x.id===id);return [e.brk,e.bc.st]}",d[0]), pg.evaluate("()=>S.notifs[0].text"))
    print(errs); b.close()
