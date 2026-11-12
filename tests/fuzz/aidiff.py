import re,sys,json
from playwright.sync_api import sync_playwright
Q=[]
for f in ['/tmp/aiq2.py','/tmp/aiq3.py','/tmp/aiq.py']:
    try:
        src=open(f).read(); m=re.search(r"Q=\[(.*?)\n\]",src,re.S)
        if m: Q+=re.findall(r'"((?:[^"\\]|\\.)*)"',m.group(1))
    except Exception as e: print(f,e)
Q+=["Compare the 3rd of November with the 10th of November","compare 3 nov with 10 nov","hours on 4 november","who worked on november 3rd","compare hours on monday 2 november with monday 9 november","how many hours on the 3rd of November compared with the 10th of November","who was late on 5 nov","hours on 12 november 2026","what did we pay on 3 nov vs 10 nov","rota on 20 november","who is working on 14th November","breaks on 3 november and 10 november","was anyone late on the 2nd of november or the 9th of november","compare 1 november to 8 november overtime","hours on 3 nov","show me 10 november"]
Q=list(dict.fromkeys(Q)); print(len(Q),'questions')
def run(html):
    out={}
    with sync_playwright() as p:
        b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        pg=b.new_context().new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        pg.goto('file://'+html); pg.wait_for_timeout(300)
        pg.evaluate("S=seedDemo();S.ui={};migrate();save(true);render();A.loginAs({id:'u1'});A.demoLoad()")
        for q in Q:
            try: out[q]=pg.evaluate("q=>aiAnswer(q).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ').slice(0,300)",q)
            except Exception as e: out[q]='ERR '+str(e)[:80]
    return out,errs
old,e1=run('/home/claude/nighttest/app/index.html'); new,e2=run('/home/claude/employee/index.html')
print('errs',e1[:2],e2[:2])
diff=[q for q in Q if old[q]!=new[q]]
print('differences',len(diff))
for q in diff[:40]: print('\nQ:',q,'\n OLD:',old[q][:170],'\n NEW:',new[q][:170])
