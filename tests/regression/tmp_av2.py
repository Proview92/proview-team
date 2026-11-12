from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':390,'height':800},has_touch=True,is_mobile=True,device_scale_factor=2); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(400)
    r=pg.evaluate("""()=>{ const ws=addD(wkStart(today()),14); U.t.rw=ws; const tue=addD(ws,1); const nic=S.people.find(p=>p.name==='Nicole'); avApply(nic,'can',[tue],'',false); avApply(S.people.find(p=>p.name==='Kamilla'),'cant',[tue],'',false);
      autoRota(ws); commit(); go('rota'); return S.shifts.filter(s=>s.date===tue).map(s=>(s.pid?P(s.pid).name:'OPEN')+' '+fT(s.start)).join(', ') }""")
    print(r); pg.wait_for_timeout(300); pg.screenshot(path='/tmp/av-rota.png',full_page=False)
    pg.evaluate("go('ai')"); pg.wait_for_timeout(200); pg.screenshot(path='/tmp/av-ai0.png')
    pg.evaluate("go('timeoff')"); pg.wait_for_timeout(200); pg.screenshot(path='/tmp/av-to.png')
    print(errs)
    b.close()
