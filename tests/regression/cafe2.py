import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':1280,'height':900}); errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(400)
    # next week rota generated via the real UI buttons
    pg.evaluate("go('timeoff')"); pg.wait_for_timeout(200)
    pg.click('[data-a=daysOffOpen]'); pg.wait_for_timeout(300)
    pg.screenshot(path='/tmp/daysoff.png')
    # Kamilla Wed off and Ceylan Wed off (Wed = 3rd column)
    ws=pg.evaluate("U.t.rw"); wed=pg.evaluate("addD(U.t.dow||U.t.rw,2)")
    pg.click(f'[data-a=dayoff][data-pid=u4][data-d="{wed}"]'); pg.wait_for_timeout(250)
    pg.click(f'[data-a=dayoff][data-pid=u3][data-d="{wed}"]'); pg.wait_for_timeout(250)
    print('leave rows',pg.evaluate("S.leave.map(l=>P(l.pid).name+' '+l.from+' '+l.st)"))
    pg.click('[data-a=daysOffGo]'); pg.wait_for_timeout(300)
    print('confirm text:',pg.evaluate("document.body.innerText.match(/Auto-generate this week[\s\S]{0,420}/)?.[0]"))
    pg.click('[data-a=askok]'); pg.wait_for_timeout(400)
    print('toast:',pg.evaluate("document.querySelector('#toast')?.innerText"))
    rows=pg.evaluate("""()=>{ const ws=U.t.rw; return weekDays(ws).map(d=>DN[dow(d)]+' '+d.slice(5)+': '+S.shifts.filter(s=>s.date===d).sort((a,b)=>a.start-b.start).map(s=>(s.pid?P(s.pid).name:'OPEN')+' '+fT(s.start)+'-'+fT(s.end)+(s.note?' ['+s.note+']':'')).join(' | ')) }""")
    print('\n'.join(rows))
    pg.screenshot(path='/tmp/rota-gap.png',full_page=True)
    # publish, then mark another person off on a published day -> open shift
    pg.evaluate("A.rotaPublish()"); pg.wait_for_timeout(200); pg.click('[data-a=askok]'); pg.wait_for_timeout(300)
    pg.evaluate("A.daysOff()"); pg.wait_for_timeout(200)
    fri=pg.evaluate("addD(U.t.dow||U.t.rw,4)")
    pg.click(f'[data-a=dayoff][data-pid=u2][data-d="{fri}"]'); pg.wait_for_timeout(250)
    print('Fri after Duygu off:',pg.evaluate("S.shifts.filter(s=>s.date==='%s').map(s=>(s.pid?P(s.pid).name:'OPEN')+' '+fT(s.start)+(s.note?' ['+s.note+']':''))"%fri))
    pg.keyboard.press('Escape')
    # activities per person
    for who in ['u7','u12','u2','u9']:
        pg.evaluate("id=>A.loginAs({id})",who); pg.evaluate("go('clock')"); pg.wait_for_timeout(200)
        print(who,pg.evaluate("P('%s').name"%who),'->',pg.evaluate("[...document.querySelectorAll('#clkopts select[name=act] option')].map(o=>o.textContent)"),'default',pg.evaluate("defaultAct(P('%s'))"%who))
    pg.evaluate("id=>A.loginAs({id})",'u1'); pg.evaluate("go('s-projects')"); pg.wait_for_timeout(200)
    print('acts table:',pg.evaluate("document.querySelector('#main').innerText.slice(0,500).replace(/\\n/g,' | ')"))
    pg.click('[data-a=editAct][data-id=a4]'); pg.wait_for_timeout(250); pg.screenshot(path='/tmp/actpanel.png')
    pg.keyboard.press('Escape')
    pg.evaluate("go('s-locations')"); pg.wait_for_timeout(200)
    print('radius opts:',pg.evaluate("[...document.querySelectorAll('select')].map(s=>[...s.options].map(o=>o.textContent).join(','))"))
    print('ERRORS',errs)
    b.close()
