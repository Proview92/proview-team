from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':1200,'height':900})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(700)
    pg.evaluate("()=>{go('s-people');A.addPerson()}");pg.wait_for_timeout(300)
    pg.fill("input[name=name]","Maria New"); pg.click("button:has-text('Save')"); pg.wait_for_timeout(600)
    print(pg.evaluate("()=>{const j=S.people.find(x=>x.name==='Maria New');return [j&&j.pin]}"), pg.evaluate("()=>document.querySelector('#toast')&&document.querySelector('#toast').textContent"))
    pg.evaluate("()=>{A.trialOpen()}");pg.wait_for_timeout(300)
    pg.fill("input[name=name]","Johnny Test"); pg.click("text=Add them"); pg.wait_for_timeout(600)
    pg.screenshot(path='/tmp/pin1.png')
    print(errs);b.close()
