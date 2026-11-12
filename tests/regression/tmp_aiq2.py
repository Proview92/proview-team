import re,sys,json
from playwright.sync_api import sync_playwright
Q=[
# comparisons / periods
"Compare last month's rota hours to this month's","Compare last month's hours to this month's","How do this month's hours compare with last month?","Compare this week with last week","Compare hours this week, last week and 2 weeks ago",
"How much break was given this week compared to last week and 2 weeks ago?","How much break did the team take this week?","How much break was taken last week?","Break taken by Duygu last week","Who took the longest breaks last week?","Who didn't take a break last week?","Which days over 6 hours had no break?","Compare late arrivals this week and last week","Who was late this week compared to last week?","How many minutes late were people last week?","Was the team more punctual last week than 2 weeks ago?",
"Compare overtime this month and last month","Compare labour cost this month with last month","Compare labour cost this week and last week","What is the forecast cost of next week's rota?","What is the planned cost of this week's rota?",
"Rota hours this week","Rota hours next week","Rota hours versus worked hours this week","How many rota hours did Duygu have last week?","Were people scheduled for more hours than they worked last week?","Planned hours next week by person","Scheduled hours this month","Scheduled hours last month vs this month",
"How many shifts did Duygu do last week?","How many shifts are on the rota next week?","How many shifts this month?","How many days did Kamilla work last week?","How many days has Yasin worked this month?","Days worked last week by everyone",
"Who worked the most weekend hours last month?","Weekend hours this month","Who worked this weekend?","Who is working this weekend?","Who works weekends?",
"Average hours per day last week","Average shift length last week","What is Dalia's average day?","Longest shift last week","Who had the longest day this week?",
"Kitchen vs floor hours last week","Compare kitchen and floor hours this month","Hours by group this week","How many hours did the kitchen work last week?","How many hours did the floor team work last week?","Floor team late last week","Kitchen overtime this month","Cost by group this month",
# per person
"How many hours did Duygu work this month?","Hours worked by Kamilla this week","What did Yasin work last week?","Duygu's hours last month vs this month","Compare Duygu's hours this week and last week","Is Nicole working today?","Is Dalia working tomorrow?","When is Duygu next working?","When does Ceylan next work?","When is Kamilla's next shift?","What shifts does Yasin have next week?","What is Feride's rota this week?","Is Sengul in on Friday?","What time does Duygu start tomorrow?","What time does Duygu finish today?","Was Duygu late last week?","How late was Duygu on Saturday?","Did Dalia work on Saturday?","Did Yasin clock in on Monday?","Hours for Feride last week","How many hours has Runner done this month?","Total hours for Nicole last month","How much holiday does Duygu have left?","Holiday balance for everyone","Who has used the most holiday?",
# who/when/time-based
"Who is opening tomorrow?","Who is closing tonight?","Who is closing on Friday?","Who opens on Saturday?","Who is working at 2pm today?","Who is in at 5pm tomorrow?","Who is on at 8am on Friday?","Who is working this afternoon?","Who is working tonight?","Who is on today?","Who is on tomorrow?","Who is on Sunday?","Who is working on the 14th of November?","Who is off today?","Who is off this week?","Who is off next week?","Who is on holiday?","Who is sick?","Who called in sick last week?","Pending time off requests","How many people are working tomorrow?","How many staff on Saturday?","Staffing levels this week","How many people are on the rota each day next week?",
# lateness etc
"Who was late yesterday?","Who is late today?","Who has not clocked in yet?","Who is not in yet?","Who hasn't turned up?","Who was the most late last week?","Who is always late?","Who was on time every day last week?","Late arrivals this month","How many late arrivals this month?","Total minutes late this month","Who missed a shift this month?","Who didn't show up last week?","Any no shows this week?","Who forgot to clock out last week?","Missing clock outs","Open time entries","Who is still clocked in?","Who is on break?","Who is on a break right now?",
# overtime/cost/payroll
"Overtime last week","Overtime by person this month","Who worked overtime last week?","Total labour cost last week","What will next week's wages be?","Cost per hour this month","What did the kitchen cost last week?","Who cost the most this month?","Payroll for last month","Wages this month so far","Are we over budget on labour?","Labour percentage",
# approvals/admin
"Timesheets waiting approval","Which timesheets are pending for last week?","How many timesheets are approved?","Who has pending timesheets?","Any rejected timesheets?","Who hasn't submitted hours?","Unapproved hours last week","Open shifts next week","Which shifts have no one assigned?","Which shifts need cover?","Any gaps in the rota this week?","Is the rota published?","Which shifts are still drafts?","How many shifts are draft?","What hasn't been published?",
# staff/docs/people
"How many staff do we have?","How many people work in the kitchen?","Who is in the kitchen?","Who is on the floor team?","List all staff","Who is on trial?","Who has no PIN?","Who hasn't signed the welcome pack?","Which documents are missing?","Who has no payslip?","Who has not confirmed allergen training?","Who has no email?","Who works the most hours on average?","Who works the fewest hours?","Who has no shifts next week?","Who has no shifts this week?","Who is working 6 days this week?","Who has no day off this week?","Who is under their contracted hours?","Contracted hours versus worked",
# tasks
"Which tasks are not done today?","How many tasks were completed this week?","What tasks are due tomorrow?","Which tasks are overdue?",
# summaries
"Summary of this week","Summary of yesterday","Summary for tomorrow","Anything I need to know?","What's happening today?","How was last week?","How did the team do last week?","Give me a briefing","Weekly report","Month summary","How is this month going?","Last month recap",
# misc / edge
"hours last week","late last week","breaks last week","cost last week","overtime","rota","holiday","who","hello","thanks","What can you do?","help","What's the weather like?","Who is the best employee?","Show me everything",
]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':800})
    errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto('file:///home/claude/employee/index.html');pg.wait_for_timeout(800)
    pg.evaluate("()=>{A.demoLoad()}"); pg.wait_for_timeout(300)
    res=[]
    for q in Q:
        h=pg.evaluate("q=>{try{return aiAnswer(q)}catch(e){return 'EXC '+e.message}}",q)
        t=re.sub(r'<[^>]+>',' ',h); t=re.sub(r'\s+',' ',t).strip()
        tag='FALLBACK' if t.startswith('I can answer questions') else ('ERR' if t.startswith('EXC') or t.startswith('Sorry') else 'ok')
        res.append((tag,q,t))
    json.dump(res,open('/tmp/aiq2.json','w'))
    from collections import Counter
    print(Counter(r[0] for r in res),len(Q))
    for r in res:
        if r[0]!='ok': print(r[0],'|',r[1],'|',r[2][:100])
    print(errs)
    b.close()
