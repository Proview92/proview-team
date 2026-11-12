from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':800},has_touch=True,is_mobile=True,device_scale_factor=2); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(400)
    pg.evaluate("""()=>{ const t=addD(today(),1); S.shifts=S.shifts.filter(s=>s.date!==t); S.shifts.push({id:'sd',pid:'u7',date:t,start:540,end:1020,ne:true,brk:0,act:'a1',loc:S.locations[0].id,note:'',pub:true}); S.ui.me='u7'; render(); go('home') }"""); pg.wait_for_timeout(300)
    print(pg.evaluate("[...document.querySelectorAll('.card h2')].map(e=>e.innerText).join(' | ')"))
    pg.screenshot(path='/tmp/cv-home.png')
    pg.click('[data-a=cantAttend]'); pg.wait_for_timeout(300); print(pg.inner_text('.pnl').replace('\n',' | '))
    pg.fill('.pnl [name=reason]','not feeling well'); pg.click('.pnl .pf .pri'); pg.wait_for_timeout(300); print('toast:',pg.evaluate("document.querySelector('#toast').innerText"))
    print('notified:',pg.evaluate("[...new Set(S.notifs.filter(n=>n.kind==='cover').map(n=>P(n.to).name))].join(', ')"))
    print(pg.evaluate("JSON.stringify(S.shifts.find(s=>s.id==='sd'))")[:300])
    # Nicole takes it
    pg.evaluate("S.ui.me='u6';render();go('home')"); pg.wait_for_timeout(300); print(pg.evaluate("document.body.innerText.includes('Cover needed')"))
    pg.screenshot(path='/tmp/cv-nic.png')
    pg.click('[data-a=coverTake]'); pg.wait_for_timeout(300); print('toast:',pg.evaluate("document.querySelector('#toast').innerText"), pg.evaluate("S.shifts.find(s=>s.id==='sd').pid"))
    # Kitchen person must not be alerted
    print('kitchen alerted:',pg.evaluate("S.notifs.some(n=>n.kind==='cover'&&['u9','u10','u11','u12'].includes(n.to))"))
    # second person tries after taken
    pg.evaluate("S.ui.me='u4';render();go('home')"); pg.wait_for_timeout(300); print('others still see cover:',pg.evaluate("document.body.innerText.includes('Take this shift')"))
    pg.evaluate("S.ui.me='u1';render();go('home')"); pg.wait_for_timeout(200); print('mgr notifs:',pg.evaluate("S.notifs.filter(n=>n.to==='u1').slice(0,3).map(n=>n.text).join(' // ')"))
    print(errs); b.close()
