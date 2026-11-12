import sys,json
from playwright.sync_api import sync_playwright
pages=sys.argv[1].split(',') if len(sys.argv)>1 else ['locations']
w=int(sys.argv[2]) if len(sys.argv)>2 else 1280
h=int(sys.argv[3]) if len(sys.argv)>3 else 800
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    pg=b.new_page(viewport={'width':w,'height':h})
    errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGEERR '+str(e)))
    pg.on('console',lambda m:errs.append('CONSOLE '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.goto('file:///home/claude/employee/index.html')
    pg.wait_for_timeout(400)
    for k in pages:
        pg.evaluate("k=>go(k)",k)
        pg.wait_for_timeout(250)
        txt=pg.evaluate("document.querySelector('#main').innerText.slice(0,150).replace(/\\n/g,' | ')")
        print(k,'->',txt)
        pg.screenshot(path=f'/tmp/shot-{k}-{w}.png')
    print('ERRORS:',errs[:10])
    b.close()
