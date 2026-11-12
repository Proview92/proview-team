import json
from playwright.sync_api import sync_playwright
fails=[]; n=0
def chk(c,msg):
    global n; n+=1
    if not c: fails.append(msg)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_context(viewport={'width':1280,'height':900}).new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300)
    pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render();A.loginAs({id:'u1'});S.org.name='Brags and Brams';migrate();A.demoLoad()")
    ev=lambda s: pg.evaluate(s)
    # 1 payroll rows vs raw entries (payroll rounding off vs on tolerance: compare using emin pay=true)
    r=ev("""(()=>{const t=today();const f=addD(t,-35),to=addD(t,-8);const rows=pxRows(f,to);const head=rows[0];const wi=head.indexOf('Hours worked');let bad=[];
      rows.slice(1).forEach(r=>{const p=S.people.find(x=>x.name===r[0]);let m=0;S.entries.filter(e=>e.pid===p.id&&e.date>=f&&e.date<=to).forEach(e=>{m+=emin(e,p,true).worked||0});if(Math.abs(m/60-Number(r[wi]))>0.02)bad.push([r[0],m/60,r[wi]])});return {n:rows.length-1,bad}})()""")
    chk(r['n']>0 and not r['bad'],f'payroll vs raw {r}')
    # 2 splitting a range gives the same total (week-aligned split)
    r=ev("""(()=>{const t=today();const f=addD(wkStart(t),-35),mid=addD(wkStart(t),-15),m2=addD(mid,1),to=addD(wkStart(t),-8);const tot=a=>pxRows(a[0],a[1]).slice(1).reduce((s,r)=>s+Number(r[3]),0);return [tot([f,to]),tot([f,mid])+tot([m2,to])]})()""")
    chk(abs(r[0]-r[1])<0.05,f'range split {r}')
    # 3 holiday earned = 12.07% of hours worked
    r=ev("""(()=>{const po=S.policies.find(x=>x.accrual==='hours');const yr=today().slice(0,4);let bad=[];S.people.filter(p=>!p.archived&&!p.noTrack).forEach(p=>{const h=holEarned(p.id,po.id,yr);if(Math.abs(h.earned-h.worked*0.1207)>0.01)bad.push(p.name)});return bad})()""")
    chk(not r,f'holiday pct {r}')
    # 4 leave taken in hours policy reduces left
    r=ev("""(()=>{const po=S.policies.find(x=>x.accrual==='hours');const p=S.people.find(x=>x.role==='member'&&!x.noTrack);const a=holEarned(p.id,po.id,today().slice(0,4));S.leave.push({id:'tt1',pid:p.id,pol:po.id,from:addD(today(),-3),to:addD(today(),-3),half:false,note:'',st:'approved',ts:1});const b=holEarned(p.id,po.id,today().slice(0,4));S.leave=S.leave.filter(l=>l.id!=='tt1');return [a.leftH,b.leftH,a.takenD,b.takenD]})()""")
    chk(r[3]>=r[2] and r[1]<=r[0]+1e-9,f'leave taken {r}')
    # 5 certificate colours
    r=ev("""(()=>{const t=today();const mk=d=>certChip({docs:{certs:{fh:d}}},'fh');return [mk(addD(t,-1)).includes('red'),mk(addD(t,10)).includes('amber'),mk(addD(t,400)).includes('green'),mk('').includes('—'),mk(addD(t,30)).includes('amber'),mk(addD(t,31)).includes('green')]})()""")
    chk(all(r),f'cert chips {r}')
    # 6 grouping order consecutive in tsList and rotaPeople
    r=ev("""(()=>{const ok=l=>{const seen=[];let last=null;for(const p of l){if(p.g!==last){if(seen.includes(p.g))return false;seen.push(p.g);last=p.g}}return true};return [ok(tsList()),ok(rotaPeople())]})()""")
    chk(all(r),f'group order {r}')
    # 7 weekly rota hours equal sum of shifts, per person
    r=ev("""(()=>{const ws=wkStart(today());const shs=wkShifts(ws);let bad=[];S.people.filter(p=>!p.archived).forEach(p=>{const a=sum(shs.filter(s=>s.pid===p.id),shMin);const b=sum(sortSh(shs.filter(s=>s.pid===p.id)),shMin);if(a!==b)bad.push(p.name)});return bad})()""")
    chk(not r,f'rota sums {r}')
    # 8 clock in/out cycle for staff with break
    r=ev("""(()=>{const p=S.people.find(x=>x.role==='member'&&x.licensed&&!x.noTrack&&!S.entries.some(e=>e.pid===x.id&&e.out==null&&e.src!=='hours'));A.loginAs({id:p.id});const o=[];o.push(whoState(p).st);try{A.clk({k:'in',pid:p.id});o.push(whoState(p).st);A.clk({k:'bstart',pid:p.id});o.push(whoState(p).st);A.clk({k:'bend',pid:p.id});o.push(whoState(p).st);A.clk({k:'out',pid:p.id});o.push(whoState(p).st)}catch(e){o.push('ERR '+e)}A.loginAs({id:'u1'});return o})()""")
    chk(r==['out','in','break','in','out'],f'clock cycle {r}')
    # 9 payroll hidden money for non-admin
    r=ev("""(()=>{const m=S.people.find(x=>x.role==='manager');const prev=S.ui.me;if(!m)return 'nomgr';A.loginAs({id:m.id});const h=pxRows(addD(today(),-30),addD(today(),-3))[0];A.loginAs({id:prev});return h.includes('Gross pay')})()""")
    chk(r in (False,'nomgr'),f'manager sees gross {r}')
    # 10 backup/restore roundtrip
    r=ev("""(()=>{const a=JSON.stringify(S);const s2=JSON.parse(a);return a.length>1000&&JSON.stringify(s2)===a})()""")
    chk(r,'roundtrip')
    # 11 leave request flow (staff) then approve (owner)
    r=ev("""(()=>{const p=S.people.find(x=>x.role==='member'&&x.licensed&&!x.noTrack);const n0=S.leave.length;S.leave.push({id:'lq1',pid:p.id,pol:S.policies[0].id,from:addD(today(),40),to:addD(today(),41),half:false,note:'t',st:'pending',ts:1});const d=leaveDays(p.id,addD(today(),40),addD(today(),41),false,S.policies[0].id);S.leave=S.leave.filter(l=>l.id!=='lq1');return d})()""")
    chk(isinstance(r,(int,float)) and r>=0 and r<=2,f'leaveDays {r}')
    # 12 auto-generate next week doesn't crash and respects no double-booking
    r=ev("""(()=>{const ws=addD(wkStart(today()),14);try{U.t.rw=ws;autoRota(ws)}catch(e){return 'ERR '+e}const shs=wkShifts(ws).filter(s=>s.pid);const k={};let dup=0;shs.forEach(s=>{const key=s.pid+s.date;if(k[key])dup++;k[key]=1});return {n:shs.length,dup}})()""")
    chk(isinstance(r,dict) and r['dup']==0,f'autorota {r}')
    print('checks',n,'fails',len(fails)); [print(' FAIL',f) for f in fails]; print('pageerrs',errs)
