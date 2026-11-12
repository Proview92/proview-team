import sys,json
from playwright.sync_api import sync_playwright
vps=[('desktop',1280,800),('ipad',1024,768),('phone',390,844)]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    problems=[]; n=0
    for dark in (False,True):
      for vn,w,h in vps:
        ctx=b.new_context(viewport={'width':w,'height':h},color_scheme='dark' if dark else 'light',has_touch=(vn!='desktop'),is_mobile=(vn=='phone'))
        pg=ctx.new_page(); errs=[]
        pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
        pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        pg.goto('file:///home/claude/employee/index.html'); pg.wait_for_timeout(300)
        for who in ['u1','u2','u3']:
            pg.evaluate("id=>A.loginAs({id})",who); pg.wait_for_timeout(100)
            pages=pg.evaluate("[...new Set(menuFor(me()).flatMap(g=>g.items.map(i=>i.k)).concat(['inbox','notifs']))]")
            for k in pages:
                n+=1; errs.clear()
                pg.evaluate("k=>go(k)",k); pg.wait_for_timeout(120)
                info=pg.evaluate("""()=>({txt:document.querySelector('#main').innerText.length, ow:document.documentElement.scrollWidth-window.innerWidth, page:U.page})""")
                tag=f'{"dark" if dark else "light"}/{vn}/{who}/{k}'
                if errs: problems.append((tag,'ERR',errs[:2]))
                if info['txt']<20: problems.append((tag,'EMPTY',info))
                if info['ow']>2: problems.append((tag,'OVERFLOW',info['ow']))
                if info['page']!=k and k not in ('start',): problems.append((tag,'REDIRECT',info['page']))
        ctx.close()
    print('pages checked:',n)
    for x in problems: print(x)
    print('problems:',len(problems))
    b.close()
