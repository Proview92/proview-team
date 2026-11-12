from playwright.sync_api import sync_playwright
import json
PDF=b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"
def f(n,size=None): return {'name':n,'mimeType':'application/pdf','buffer':PDF if size is None else PDF+b' '*size}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':420,'height':900}).new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300); pg.evaluate("localStorage.clear()"); pg.reload(); pg.wait_for_timeout(400)
    ev=pg.evaluate; toast=lambda: ev("document.querySelector('#toast').innerText")
    ev("A.loginAs({id:'u1'})")
    # setup people: Memo with payslip name, Yasin with payroll number, two Alis
    ev("""(()=>{ const by=n=>S.people.find(p=>p.name===n); by('Duygu').payName='Duygu Yilmaz'; by('Nicole').payName='Nicola Brown, N Brown'; by('Yasin').payNo='00123456';
      S.people.push({id:'x1',name:'Ali Demir',role:'member',g:'',sched:'',locs:'all',feats:{},archived:false,licensed:true,noTrack:false},{id:'x2',name:'Ali Kaya',role:'member',g:'',sched:'',locs:'all',feats:{},archived:false,licensed:true,noTrack:false});
      by('Dalia').name='Dalia'; S.payslips.push({id:'ex',pid:by('Kamilla').id,type:'payslip',period:'October 2026',name:'old.pdf',size:1,ts:1,data:'data:application/pdf;base64,AAAA'}); save(true) })()""")
    ev("go('s-payslips')"); pg.wait_for_timeout(250)
    ev("A.payBulk()"); pg.wait_for_timeout(250)
    print('notice:',ev("document.querySelector('#pnl-root .alert').innerText"))
    pg.fill('#pnl-body input[name=period]','October 2026')
    files=[f('Yılmaz Duygu - payslip Oct 2026.pdf'),f('nicola-brown.pdf'),f('Employee 123456 pay.pdf'),f('Ali-Demir.pdf'),f('ali.pdf'),f('Kamila Oct.pdf'),f('kamilla.pdf'),f('Dalia.pdf'),f('Dalia (2).pdf'),f('random-stranger.pdf'),f('big-scan.pdf',500*1024),f('notes.txt')]
    files[-1]['mimeType']='text/plain'
    pg.set_input_files('#pnl-body input[name=files]',files)
    pg.evaluate("document.querySelector('#pnl-root .btn.pri[data-a=psave]').click()"); pg.wait_for_timeout(1500)
    print(ev("document.querySelector('#pnl-root .pnl h2').innerText"))
    rows=ev("PB.rows.map(r=>[r.name,r.pid?P(r.pid).name:'-',r.how,r.send])")
    for r in rows: print('  ',r)
    print(ev("document.querySelector('#pbsum').innerText"))
    # chips for a few
    print(ev("[...document.querySelectorAll('.pbrow')].map(r=>r.querySelector('b').innerText.slice(0,22)+' => '+r.querySelector('.pbst').innerText.replace(/\\n/g,' / ')).join('\\n')"))
    # fix stranger -> Rodin; pick one of ali; uncheck dup Dalia(2)
    rid=ev("PB.rows.find(r=>r.name==='random-stranger.pdf').id"); pg.select_option('select[data-id="%s"]'%rid,label='Rodin'); pg.wait_for_timeout(100)
    aid=ev("PB.rows.find(r=>r.name==='ali.pdf').id"); pg.select_option('select[data-id="%s"]'%aid,label='Ali Kaya'); pg.wait_for_timeout(100)
    print('after fixes:',ev("document.querySelector('#pbsum').innerText"))
    print('dup chip Dalia:',ev("[...document.querySelectorAll('.pbrow')].filter(r=>/^Dalia/.test(r.querySelector('b').innerText)).map(r=>r.querySelector('.pbst').innerText.replace(/\\n/g,' / '))"))
    pg.evaluate("document.querySelector('#pnl-root .btn.pri[data-a=psave]').click()"); pg.wait_for_timeout(500)
    print('toast:',toast())
    print('stored:',ev("S.payslips.filter(d=>d.period==='October 2026'&&d.id!=='ex').map(d=>P(d.pid).name+' <- '+d.name)"))
    print('notifs:',ev("S.notifs.filter(n=>n.kind==='pay').slice(0,3).map(n=>n.text)"))
    print('learned:',ev("S.payMap.map(x=>x.k+' -> '+P(x.pid).name)"))
    # second batch: stranger remembered
    ev("A.payBulk()"); pg.wait_for_timeout(200); pg.fill('#pnl-body input[name=period]','November 2026')
    pg.set_input_files('#pnl-body input[name=files]',[f('Random-Stranger Nov.pdf')]); pg.evaluate("document.querySelector('#pnl-root .btn.pri[data-a=psave]').click()"); pg.wait_for_timeout(800)
    print('remembered:',ev("PB.rows.map(r=>[r.pid?P(r.pid).name:'-',r.how])"))
    ev("closePanel()")
    # storage refusal
    ev("S.payslips.push({id:'fat',pid:'u2',type:'payslip',period:'x',name:'fat',size:1,ts:1,data:'x'.repeat(4600000)})")
    ev("A.payBulk()"); pg.wait_for_timeout(200); pg.set_input_files('#pnl-body input[name=files]',[f('Dalia.pdf',300*1024)]); pg.evaluate("document.querySelector('#pnl-root .btn.pri[data-a=psave]').click()"); pg.wait_for_timeout(800)
    pg.evaluate("document.querySelector('#pnl-root .btn.pri[data-a=psave]').click()"); pg.wait_for_timeout(300); print('full storage ->',toast())
    print(errs)
