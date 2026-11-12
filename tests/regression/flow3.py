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
    def mdl(): return pg.evaluate("(document.querySelector('#mdl-root')||{innerText:''}).innerText.replace(/\\n/g,' | ')")
    pg.evaluate("A.loginAs({id:'u1'})"); pg.evaluate("go('rota')"); pg.wait_for_timeout(250)
    pg.screenshot(path=f'/tmp/flow3-rota-{w}.png')
    print('this week shifts',pg.evaluate("wkShifts(wkStart(today())).length"))
    # next week
    pg.click('[data-a=rwNext]'); pg.wait_for_timeout(200); print('next:',main(250))
    print('drafts nextweek', pg.evaluate("wkShifts(U.t.rw).filter(s=>!s.pub).length"))
    pg.click('[data-a=rotaAuto]'); pg.wait_for_timeout(200); print('ask:',mdl()[:300]); pg.click('[data-a=askok]'); pg.wait_for_timeout(300); print('toast:',toast())
    print('cover:',pg.evaluate("S.cover.map(r=>weekDays(U.t.rw).filter(d=>covApplies(r,d)).map(d=>covCount(r,d)+'/'+r.n).join(' '))"))
    pg.screenshot(path=f'/tmp/flow3-rota2-{w}.png', full_page=True)
    # validate rules
    print('violations:',pg.evaluate("""(()=>{const ws=U.t.rw,R=S.rotaRules,out=[]; S.people.forEach(p=>{const l=S.shifts.filter(s=>s.pid===p.id&&s.date>=ws&&s.date<=addD(ws,6)); const ds=new Set(l.map(s=>s.date)); if(ds.size>R.maxDays)out.push(p.name+' days '+ds.size); if(l.length!==ds.size)out.push(p.name+' double '+l.length+'/'+ds.size); if(sum(l,shMin)>otLimit(p))out.push(p.name+' OT '+sum(l,shMin)); S.shifts.filter(s=>s.pid===p.id).forEach(s=>{const n=S.shifts.find(x=>x.pid===p.id&&x.date===addD(s.date,1)); if(n&&n.start+1440-shEnd(s)<R.minRest*60)out.push(p.name+' rest '+s.date)})}); return out})()"""))
    print('weekend counts:',pg.evaluate("S.people.map(p=>p.name.split(' ')[0]+':'+S.shifts.filter(s=>s.pid===p.id&&s.date>=U.t.rw&&s.date<=addD(U.t.rw,6)&&dow(s.date)>=5).length).join(' ')"))
    # publish
    pg.click('[data-a=rotaPublish]'); pg.wait_for_timeout(200); print('pub ask:',mdl()[:250]); pg.click('[data-a=askok]'); pg.wait_for_timeout(300); print('toast:',toast())
    # add shift with conflict
    pg.click('[data-a=shiftNew] >> nth=0'); pg.wait_for_timeout(200); print('panel:',pnl(150))
    pg.select_option('#pnl-body select[name=pid]','u3'); pg.fill('#pnl-body input[name=date]',pg.evaluate("addD(U.t.rw,0)")); pg.click('[data-a=psave]'); pg.wait_for_timeout(300); print('save ->',mdl()[:300] or toast()); pg.click('[data-a=askok]'); pg.wait_for_timeout(300); print('saved anyway:',toast())
    # csv / copy / clear
    pg.click('[data-a=rotaMore]'); pg.click('[data-a=rotaMoreGo][data-k=rotaCsv]'); pg.wait_for_timeout(300)
    with pg.expect_download(timeout=4000) as dl: pg.click('[data-a=rotaCsvGo]')
    print('csv:',dl.value.suggested_filename, open(dl.value.path()).read()[:200].replace('\n',' / '))
    pg.evaluate("U.t.rw=addD(wkStart(today()),14);render()"); pg.click('[data-a=rotaMore]'); pg.click('[data-a=rotaMoreGo][data-k=rotaCopy]'); pg.wait_for_timeout(300); print('copy toast:',toast())  # copies from week+1
    print('drafts:',pg.evaluate("wkShifts(U.t.rw).filter(s=>!s.pub).length"))
    pg.click('[data-a=rotaMore]'); pg.click('[data-a=rotaMoreGo][data-k=rotaClear]'); pg.wait_for_timeout(200); pg.click('[data-a=askok]'); pg.wait_for_timeout(300); print('clear toast:',toast(), pg.evaluate("wkShifts(U.t.rw).length"))
    # rules panel
    pg.click('[data-a=rotaMore]'); pg.click('[data-a=rotaMoreGo][data-k=rotaRules]'); pg.wait_for_timeout(250); print('rules:',pnl(300)); pg.screenshot(path=f'/tmp/flow3-rules-{w}.png')
    pg.click('#pnl-root [data-a=coverEdit] >> nth=0'); pg.wait_for_timeout(200); print('cover edit:',pnl(120)); pg.click('[data-a=psave]'); pg.wait_for_timeout(300); print('after cover save:',pnl(80))
    print('ERRORS:',errs[:10]); b.close()
