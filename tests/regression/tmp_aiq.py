import re,sys
from playwright.sync_api import sync_playwright
Q=["Give me a summary of today","Give me a summary of last week","How is the week going","Who is working right now?","Who is working today?","Who is working tomorrow?","Who works on Friday?","What is Duygu working this week?","When is Ceylan working next week?","How many hours did Duygu work last week?","How many hours did the team work last week?","How many hours did the team work this week?","Compare this week with last week hours","Who was late last week?","Who was late today?","Who missed a shift last week?","Who didn't turn up yesterday?","Who forgot to clock out?","Who is off this month?","Who is off tomorrow?","Is Dalia off next week?","Who has the most hours this week?","Who worked the least last week?","Which day was busiest last week?","What does labour cost this month?","How much did we spend on wages last week?","What did Aysegul cost last week?","Who has the most overtime this month?","Which timesheets need approval?","Which shifts are still open?","Which tasks are not done today?","Which tasks were not done yesterday?","Who has not confirmed their documents?","Who hasn't got a payslip?","How many staff do we have?","Who can work on Sunday?","What time does Nicole start tomorrow?","Hours for Kamilla on Monday","What's the weather"]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(800)
    pg.evaluate("()=>{A.demoLoad()}"); pg.wait_for_timeout(300)
    print(pg.evaluate("()=>[S.shifts.filter(x=>x.demo).length,S.entries.filter(x=>x.demo).length,S.leave.filter(x=>x.demo).length,new Date().toString().slice(0,24)]"))
    for q in Q:
        h=pg.evaluate("q=>aiAnswer(q)",q)
        t=re.sub(r'<[^>]+>',' ',h); t=re.sub(r'\s+',' ',t)
        print('Q:',q,'\n   ',t[:260])
    print(errs)
    b.close()
