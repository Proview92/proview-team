/* ===== Brags and Brams: the café's own starting data ===== */
const CAFE_FLOOR_ACTS=['u2','u3','u4','u5','u6','u7','u8'];
function seed(){
  const t=today(), base=seedDemo();
  const noOT=defOT();
  const brk=[{id:'b1',name:'Break',min:30,paid:false,from:'12:00',to:'14:00'}];
  // a person's usual week: day index 0=Mon..6=Sun -> [from,to,activity?]
  const wk=m=>[0,1,2,3,4,5,6].map(i=>{const c=m&&m[i]; return c?{on:true,from:c[0],to:c[1],hrs:0,...(c[2]?{act:c[2]}:{})}:{on:false,from:'',to:'',hrs:0}});
  const usual=(id,name,m)=>({id,name:name+"'s usual week",type:'fixed',days:wk(m),hours:0,brk:brk.map(b=>({...b,id:'b'+id})),auto:true,pay:{early:false,split:''},ot:defOT(),locs:'any'});
  const C='17:00'; // closing time: shifts run to close unless a finish time is given
  const sc=[
    {id:'sflex',name:'Flexible (days set each week)',type:'weekly',days:wk(null),hours:0,brk:[],auto:false,pay:{early:false,split:''},ot:defOT(),locs:'any',isDef:true},
    usual('sduygu','Duygu',{0:['07:00',C],1:['07:00',C],4:['07:00',C],5:['07:00',C],6:['07:00',C]}),
    usual('skamilla','Kamilla',{1:['09:00',C],2:['09:00',C],3:['09:00',C],4:['09:00',C],5:['09:00',C]}),
    usual('syasin','Yasin',{0:['10:00',C],2:['07:00',C],3:['07:00',C],4:['10:00',C],5:['10:00',C],6:['10:00',C]}),
    usual('sdalia','Dalia',{1:['10:00',C],4:['16:00','21:00','a4'],5:['09:00',C],6:['09:00',C]}),
    usual('snicole','Nicole',{6:['10:00',C]}),
    usual('srunner','Runner',{5:['10:00',C],6:['11:00',C]}),
    usual('sferide','Feride',{0:['08:00',C],2:['08:00',C],3:['08:00',C],4:['08:00',C],5:['08:00',C],6:['08:00',C]})];
  const mk=(id,name,g,sched,extra)=>({id,name,role:'member',g,sched,rate:0,email:'',phone:'',code:'BB-'+id.slice(1),pin:'',locs:'all',feats:{},licensed:true,archived:false,start:t,last:'',noTrack:false,...extra});
  const people=[
    mk('u1','Director','', 'sflex',{role:'owner',noTrack:true}),
    mk('u2','Duygu','g1','sduygu',{act:'a1'}), mk('u3','Ceylan','g1','sflex',{act:'a1',flex:true}),
    mk('u4','Kamilla','g1','skamilla',{act:'a1'}), mk('u5','Yasin','g1','syasin',{act:'a1'}),
    mk('u6','Nicole','g1','snicole',{act:'a1'}), mk('u7','Dalia','g1','sdalia',{act:'a1'}),
    mk('u8','Runner','g1','srunner',{act:'a1'}),
    mk('u9','Aysegul','g2','sflex',{act:'a2',flex:true}), mk('u10','Rodin','g2','sflex',{act:'a2',flex:true}), mk('u11','Sengul','g2','sflex',{act:'a2',flex:true}),
    mk('u12','Feride','g2','sferide',{act:'a3'})];
  const o={...base,
    org:{...base.org,name:'Brags and Brams',address:'Newington Green, London',email:'',seats:15},
    locations:[{id:'l1',name:'Brags and Brams',addr:'Newington Green, London',lat:51.5486,lng:-0.0884,radius:100,archived:false}],
    groups:[{id:'g1',name:'Floor',mgr:''},{id:'g2',name:'Kitchen',mgr:''}],
    schedules:sc, people, entries:[], shifts:[], tasks:[], chat:[], notifs:[], payslips:[], exports:[], clients:[], projects:[],
    activities:[
      {id:'a1',code:'FLOOR',name:'Floor',bill:false,rate:0,archived:false,assign:CAFE_FLOOR_ACTS},
      {id:'a2',code:'KITCHEN',name:'Kitchen',bill:false,rate:0,archived:false,assign:['u9','u10','u11']},
      {id:'a3',code:'KP',name:'Kitchen porter',bill:false,rate:0,archived:false,assign:['u12']},
      {id:'a4',code:'PARTY',name:'Pizza party (not paid by the café)',bill:false,rate:0,archived:false,assign:['u7']}],
    cover:[
      {id:'cv1',name:'Someone opens at 7',days:[0,1,2,3,4,5,6],from:'07:00',to:C,n:1,brkN:1,brkM:30,g:'g1',act:'a1',loc:'l1',hol:true},
      {id:'cv2',name:'Two on the floor from 9',days:[0,1,2,3,4],from:'09:00',to:C,n:2,brkN:1,brkM:30,g:'g1',act:'a1',loc:'l1',hol:true},
      {id:'cv3',name:'Three on the floor',days:[0,1,2,3,4],from:'11:00',to:C,n:3,brkN:1,brkM:30,g:'g1',act:'a1',loc:'l1',hol:true},
      {id:'cv4',name:'Weekend: full team',days:[5,6],from:'11:00',to:C,n:5,brkN:1,brkM:30,g:'g1',act:'a1',loc:'l1',hol:true}],
    rotaRules:{maxDays:6,minRest:11,avoidOT:true,fair:true,usual:true,fixed:true,noEnd:true},
    policies:[...base.policies,{id:'po4',name:'Day off (asked for)',paid:false,units:'days',accrual:'none',ent:0,exclHol:false,exclNon:true,carry:0,color:'#b86e00',members:'all',archived:false}],
    leave:[], docSet:{...DOCSET_DEF(),gate:true}};
  o.people.forEach(p=>{p.sched=p.sched||'sflex'});
  return o;
}
