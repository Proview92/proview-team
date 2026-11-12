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
