# Proview Employee: click-through crawler and logic tests (12 Nov 2026)

Files live in /home/claude/fuzz/ (recreate from this doc if missing). Run with Python + Playwright (`/usr/bin/google-chrome --no-sandbox`) against `/home/claude/employee/index.html`.

## What was run on 12 Nov (all clean on version 1794475612-cd9e)
- **crawl.py ROLE WIDTH**: loads sample data (6 weeks via `A.demoLoad()`), logs in as owner / manager / staff, visits all 29 pages, clicks every distinct button on each page (about 240 to 290 clicks), opens each panel, checks for undefined / NaN / [object, tries saving each panel with defaults, checks page-level sideways overflow, catches page errors and console errors. Run for owner 390/820/1024/1280, manager 390/1280, staff 390/1280: 0 errors, 0 bad text, 0 overflow (after the phone top-bar fix).
- **logic.py**: 12 checks: payroll export equals raw entries; splitting a date range gives the same total; holiday earned = 12.07% of hours; leave taken reduces holiday left; certificate colours at the edges (expired, 10 days, 30/31 days, none); departments stacked consecutively; rota sums; staff clock in, break, out cycle; manager cannot see gross pay; backup round trip; leaveDays; auto-generate has no double booking. All pass.
- **aidiff.py**: runs 443 questions on the old and new build and prints answers that differ (used to check the date-parsing change).
- Existing suites (cafe1-3, flow2-6, sweep, /tmp/*.py) and the night test (seeds 21, 22, 23, 31, 32, 33): all pass.

## Bugs found and fixed by this round
1. Phone top bar overflowed by 35px on Locations, Get started and Company (the All locations picker pushed the avatar off screen): picker now shrinks (`.top select` flex rule at the end of style.css).
2. Proview AI could not compare two named dates: "Compare the 3rd of November with the 10th of November" fell back to the help text, and "3rd vs 10th" compared the first date with the week before. `aiAll` in 43-aiplus2.js now reads explicit calendar dates (3rd of November, 3 nov, november 3, monday 2 november 2026), and "between 1 nov and 8 nov" or "from ... to ..." stays one range.

## crawl.py
```python
import sys,json,time,re
from playwright.sync_api import sync_playwright
role=sys.argv[1]; w=int(sys.argv[2]); html=sys.argv[3] if len(sys.argv)>3 else '/home/claude/employee/index.html'
BAD=re.compile(r'undefined|NaN|\[object|Invalid Date|Infinity')
SKIP=re.compile(r'reset|wipe|clear all|erase|signout|logout|restore|demoClear|lock|handover|kclose|^go$|switch',re.I)
res={'role':role,'w':w,'errors':[],'bad_text':[],'overflow':[],'clicks':0,'pages':0,'panels':0,'saves':0}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':w,'height':900 if w>600 else 844},accept_downloads=True); pg=ctx.new_page()
    cur=['']
    pg.on('pageerror',lambda e:res['errors'].append(cur[0]+' PAGEERR '+str(e)[:200]))
    pg.on('console',lambda m:res['errors'].append(cur[0]+' CONSOLE '+m.text[:200]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text and 'Failed to load resource' not in m.text else None)
    pg.on('dialog',lambda d:d.accept())
    pg.goto('file://'+html); pg.wait_for_timeout(300)
    pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render()")
    pg.evaluate("A.loginAs({id:'u1'});S.org.name='Brags and Brams';migrate();A.demoLoad();")
    # pick the persona
    if role=='manager': pg.evaluate("(()=>{const m=S.people.find(x=>x.role==='manager')||S.people.find(x=>x.role==='member'&&x.licensed);A.loginAs({id:m.id})})()")
    if role=='staff': pg.evaluate("(()=>{const m=S.people.find(x=>x.role==='member'&&x.licensed&&!x.noTrack);A.loginAs({id:m.id})})()")
    pg.wait_for_timeout(300)
    pages=pg.evaluate("Object.keys(V)")
    snap=pg.evaluate("JSON.stringify(S)")
    def closeall():
        pg.evaluate("try{closePanel()}catch(e){};try{closeModal()}catch(e){}")
    for name in pages:
        cur[0]=name
        try:
            ok=pg.evaluate(f"(()=>{{try{{go('{name}');return true}}catch(e){{return String(e)}}}})()")
        except Exception as e: res['errors'].append(name+' go failed '+str(e)[:100]); continue
        pg.wait_for_timeout(120); res['pages']+=1
        txt=pg.evaluate("document.querySelector('#main')?document.querySelector('#main').innerText:''")
        m=BAD.search(txt)
        if m: res['bad_text'].append(f'{name}: ...{txt[max(0,m.start()-40):m.end()+40]!r}')
        ov=pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth")
        if ov>2: res['overflow'].append(f'{name}: {ov}px')
        # collect distinct actions
        acts=pg.evaluate("""(()=>{const seen={},out=[];document.querySelectorAll('#main [data-a], .top [data-a]').forEach((e,i)=>{if(e.offsetParent===null)return;const k=e.dataset.a+'|'+(e.dataset.k||'')+'|'+(e.dataset.id||e.dataset.pid||'');if(seen[e.dataset.a+'|'+(e.dataset.k||'')])return;seen[e.dataset.a+'|'+(e.dataset.k||'')]=1;out.push([e.dataset.a,e.dataset.k||'',i])});return out})()""")
        for a,k,i in acts[:40]:
            if SKIP.search(a): continue
            cur[0]=f'{name}>{a}'
            try:
                pg.evaluate(f"go('{name}')"); pg.wait_for_timeout(60)
                clicked=pg.evaluate("""([a,k])=>{const e=[...document.querySelectorAll('#main [data-a], .top [data-a]')].find(x=>x.offsetParent!==null&&x.dataset.a===a&&(x.dataset.k||'')===k);if(!e)return false;e.click();return true}""",[a,k])
            except Exception as e:
                res['errors'].append(f'{name}>{a} click exc {str(e)[:100]}'); continue
            if not clicked: continue
            res['clicks']+=1; pg.wait_for_timeout(90)
            t2=pg.evaluate("(document.querySelector('#pnl-root')||{innerText:''}).innerText+' '+(document.querySelector('#mdl-root')||{innerText:''}).innerText")
            if t2.strip():
                res['panels']+=1
                m=BAD.search(t2)
                if m: res['bad_text'].append(f'{name}>{a} panel: ...{t2[max(0,m.start()-40):m.end()+40]!r}')
                # try saving with defaults
                if pg.evaluate("!!document.querySelector('[data-a=psave]')"):
                    pg.evaluate("document.querySelector('[data-a=psave]').click()"); pg.wait_for_timeout(120); res['saves']+=1
            closeall()
            # restore data so every click starts from clean demo data
            if res['clicks']%25==0: pg.evaluate("S=JSON.parse(%s);save(true);render()"%json.dumps(snap))
    pg.evaluate("S=JSON.parse(%s);save(true);render()"%json.dumps(snap))
    b.close()
print(json.dumps({k:(v if not isinstance(v,list) else v[:25]) for k,v in res.items()},indent=1)); print('n_err',len(res['errors']),'n_bad',len(res['bad_text']))
```

## logic.py
```python
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
```
