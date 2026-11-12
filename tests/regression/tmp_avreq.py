from playwright.sync_api import sync_playwright
import re
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':844})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(700)
    pg.evaluate("()=>{A.demoLoad()}");pg.wait_for_timeout(300)
    # staff Duygu informs cannot work on a day she has a shift (tomorrow or later)
    r=pg.evaluate("""()=>{ const d=S.people.find(x=>x.name.startsWith('Duygu')); d.role='member'; const t=today(); const sh=S.shifts.filter(s=>s.pid===d.id&&s.date>t&&s.pub).sort((a,b)=>a.date<b.date?-1:1)[0]; S.ui.me=d.id; go('home');
      avApply(d,'cant',[sh.date],'unwell',false); startCover(sh,'unwell'); commit(); render();
      return {date:sh.date,sid:sh.id,pid:d.id} }""")
    print(r)
    # staff tries to delete pending
    pg.evaluate("id=>A.avDel({id})", pg.evaluate("()=>avList()[avList().length-1].id"))
    print('after staff delete: pending kept =',pg.evaluate("()=>avList().some(a=>a.st==='pending')"))
    print('staff card:',re.sub(r'\s+',' ',pg.evaluate("()=>myReqCard(me())").replace('<','\n<'))[:0], 'waiting' in pg.evaluate("()=>myReqCard(me())").lower(), 'avDel' in pg.evaluate("()=>myReqCard(me())"))
    # manager view
    pg.evaluate("()=>{const o=S.people.find(x=>x.role==='owner'); S.ui.me=o.id; go('rota')}"); pg.wait_for_timeout(300)
    html=pg.evaluate("()=>avCard(wkStart(today()),addD(wkStart(today()),21),'x')")
    print('mgr has Approve/Decline:','avYes' in html,'avNo' in html,' bin hidden for pending:','avDel' not in html)
    # decline -> restored
    pg.evaluate("()=>{ const a=avList().find(x=>x.st==='pending'); A.avNo({id:a.id}) }")
    print(pg.evaluate("()=>{const a=avList().find(x=>x.kind==='cant'&&x.st); const s=S.shifts.find(x=>x.id===a.sid); return {st:a.st,shiftPid:s.pid&&P(s.pid).name,note:s.note}}"))
    print(pg.evaluate("()=>S.notifs[0].text+' | to '+P(S.notifs[0].to).name"))
    # approve path
    pg.evaluate("()=>{ const d=S.people.find(x=>x.name.startsWith('Duygu')); const t=today(); const sh=S.shifts.filter(s=>s.pid===d.id&&s.date>t&&s.pub).sort((a,b)=>a.date<b.date?-1:1)[1]; S.ui.me=d.id; avApply(d,'cant',[sh.date],'',false); startCover(sh,''); S.ui.me=S.people.find(x=>x.role==='owner').id; const a=avList().find(x=>x.st==='pending'); A.avYes({id:a.id}); }")
    print(pg.evaluate("()=>S.notifs[0].text"), pg.evaluate("()=>avList().filter(x=>x.st==='approved').length"))
    pg.evaluate("()=>{S.ui.me=S.people.find(x=>x.name.startsWith('Duygu')).id; go('home')}");pg.wait_for_timeout(300)
    pg.screenshot(path='/tmp/avreq_staff.png')
    print(errs); b.close()
