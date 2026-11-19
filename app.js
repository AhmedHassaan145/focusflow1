'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const LS=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}},SS=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>{const x=new Date(d);return`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const today=()=>iso(new Date()),addDays=(s,n)=>{const d=new Date(s+'T00:00');d.setDate(d.getDate()+n);return iso(d)};
const wStart=s=>addDays(s,-((new Date(s+'T00:00').getDay()+6)%7)),wDays=s=>[0,1,2,3,4,5,6].map(i=>addDays(s,i));
const fmt=m=>Math.floor(m/60)+'h '+m%60+'m',sum=a=>a.reduce((x,y)=>x+y,0),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const hash=s=>{let h=5381;for(const c of s)h=(h*33^c.charCodeAt(0))>>>0;return h.toString(36)};
const lbl=s=>new Date(s+'T00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
let users=LS('ff_users')||{},me=LS('ff_me'),D,sel=today(),view='dashboard',range=0,calM=new Date(),mode='in',T={i:0,left:0,run:false,end:0};
const save=()=>SS('ff_d_'+me,D),saveU=()=>SS('ff_users',users);

function seed(){return{v:2,tasks:[],goals:[],focus:{},set:{f:25,b:5,l:10},n:[],theme:'light',nd:''}}

/* ---------- auth ---------- */
function authUI(){const i=mode=='in';$('#at').textContent=i?'Welcome back':'Create your account';$('#an').hidden=i;$('#ab').textContent=i?'Log in':'Sign up';$('#asw').innerHTML=i?'No account? <a href="#">Sign up</a>':'Already registered? <a href="#">Log in</a>';$('#ae').textContent=''}
$('#asw').onclick=e=>{e.preventDefault();if(e.target.tagName=='A'){mode=mode=='in'?'up':'in';authUI()}};
$('#af').onsubmit=e=>{e.preventDefault();const em=$('#ae1').value.trim().toLowerCase(),p=$('#ap').value,er=m=>$('#ae').textContent=m;
 if(mode=='in'){const u=users[em];if(!u||u.p!==hash(p))return er('Wrong email or password.')}
 else{const n=$('#an').value.trim();if(!n)return er('Enter your name.');if(p.length<6)return er('Password needs 6+ characters.');if(users[em])return er('This email is already registered. Log in instead.');
  users[em]={name:n,p:hash(p),av:''};saveU();SS('ff_d_'+em,seed())}
 me=em;SS('ff_me',me);$('#ap').value='';boot()};

function boot(){if(!me||!users[me]){me=null;$('#auth').hidden=false;$('#app').hidden=true;authUI();return}
 D=LS('ff_d_'+me)||seed();if(D.v!==2){const o=D;D=seed();D.set=o.set||D.set;D.theme=o.theme||'light'}sel=today();view='dashboard';$('#auth').hidden=true;$('#app').hidden=false;document.documentElement.dataset.theme=D.theme;
 T={i:0,left:D.set.f*60,run:false,end:0};
 if(D.nd!=today()){D.nd=today();const o=D.tasks.filter(t=>t.d==today()&&!t.x).length;if(o)note(`You have ${o} open task${o>1?'s':''} today.`)}
 save();render()}
function logout(){mode='in';me=null;localStorage.removeItem('ff_me');T.run=false;document.title='FocusFlow';boot()}

/* ---------- helpers ---------- */
function note(m){D.n.unshift({m,r:0});D.n=D.n.slice(0,20)}
function beep(){try{const a=new AudioContext(),o=a.createOscillator();o.connect(a.destination);o.frequency.value=880;o.start();o.stop(a.currentTime+.4)}catch{}}
function modal(title,fields,cb){const m=document.createElement('div');m.className='ov';
 m.innerHTML=`<form class="md"><h3>${title}</h3>${fields.map(f=>`<label>${f.l}${f.o?`<select name="${f.k}">${f.o.map(o=>`<option value="${o[0]}"${o[0]==f.v?' selected':''}>${o[1]}</option>`).join('')}</select>`:`<input name="${f.k}" type="${f.t||'text'}" value="${esc(f.v??'')}" required${f.t=='number'?' min="1"':''}>`}</label>`).join('')}<div class="ra"><button type="button" class="btn g">Cancel</button><button class="btn">Save</button></div></form>`;
 document.body.append(m);const c=()=>m.remove();m.querySelector('.g').onclick=c;m.onclick=e=>{if(e.target==m)c()};
 m.firstChild.onsubmit=e=>{e.preventDefault();e.stopPropagation();cb(Object.fromEntries(new FormData(e.target)));c();save();render()};m.querySelector('input,select').focus()}
function avatars(){const u=users[me];$$('.av').forEach(a=>{a.style.backgroundImage=u.av?`url(${u.av})`:'';a.textContent=u.av?'':u.name[0].toUpperCase()})}

/* ---------- timer ---------- */
const seq=()=>[['Focus',D.set.f],['Break',D.set.b],['Focus',D.set.f],['Break',D.set.b],['Long Break',D.set.l]];
function drawTimer(){const p=$('#pt');if(!p)return;const tot=seq()[T.i][1]*60,C=440;p.textContent=String(Math.floor(T.left/60)).padStart(2,'0')+':'+String(T.left%60).padStart(2,'0');
 $('#pr').style.strokeDashoffset=C*(1-T.left/tot);document.title=T.run?p.textContent+' · FocusFlow':'FocusFlow'}
function credit(){if(seq()[T.i][0]!='Focus')return;const m=Math.floor((seq()[T.i][1]*60-T.left)/60);if(m>0){D.focus[today()]=(D.focus[today()]||0)+m;save();render()}}
function done(){const[n,m]=seq()[T.i];if(n=='Focus'){D.focus[today()]=(D.focus[today()]||0)+m;note(`Focus session complete: +${m} min`)}else note(`${n} is over. Time to focus!`);
 beep();T.i=(T.i+1)%5;T.left=seq()[T.i][1]*60;T.run=false;save();render()}
setInterval(()=>{if(!T.run)return;T.left=Math.max(0,Math.ceil((T.end-Date.now())/1000));if(T.left<=0)done();else drawTimer()},300);
function rPomo(){const s=seq(),n=s[(T.i+1)%5];$('#pomo').innerHTML=`<div class="ch"><h3>⏱ Pomodoro Timer</h3><button class="ib" data-nav="settings" title="Timer settings">⚙️</button></div><div class="bd">
 <div class="tc"><div class="rg"><svg viewBox="0 0 160 160"><circle class="rb" cx="80" cy="80" r="70"/><circle id="pr" class="rf" cx="80" cy="80" r="70" stroke-dasharray="440"/></svg><div><b id="pt"></b><span>${s[T.i][0]} Time</span></div></div>
 <div><button class="btn" data-a="tp">${T.run?'❚❚ Pause':'▶ Start'}</button> <button class="btn g" data-a="tr">↺</button> <button class="btn g" data-a="tn">⏭</button></div><small>Next: ${n[1]} min ${n[0]}</small></div>
 <div class="tl">${s.map((x,i)=>`<div class="${i==T.i?'on':''}"><span>${x[1]} min<br>${x[0]}</span></div>`).join('')}</div></div>`;drawTimer()}

/* ---------- render ---------- */
function render(){document.body.dataset.view=view;document.documentElement.dataset.theme=D.theme;
 $$('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav==view));$$('[data-v]').forEach(e=>e.hidden=!e.dataset.v.split(' ').includes(view));
 avatars();$('#dl').textContent=lbl(sel);$('#dp').value=sel;$('#bd').hidden=!D.n.some(n=>!n.r);
 const t=today(),h=new Date().getHours(),u=users[me];
 $('#hi').innerHTML=`<span class="av big"></span><div><h1>Good ${h<12?'morning':h<18?'afternoon':'evening'}, ${esc(u.name.split(' ')[0])}!</h1><p>Let's make today count.</p><em>“Focus. Progress. Repeat.”</em></div>`;avatars();
 const ws=wStart(t),tw=wDays(ws),pw=wDays(addDays(ws,-7)),ft=sum(tw.map(d=>D.focus[d]||0)),fp=sum(pw.map(d=>D.focus[d]||0));
 const td=D.tasks.filter(x=>x.d==t).length,dy=td-D.tasks.filter(x=>x.d==addDays(t,-1)).length,gd=D.goals.filter(g=>g.cur>=g.tgt).length,gp=D.goals.length?gd/D.goals.length:0;
 const wt=D.tasks.filter(x=>tw.includes(x.d)),tr=wt.length?wt.filter(x=>x.x).length/wt.length:0,sc=Math.round(100*(.6*tr+.2*gp+.2*Math.min(1,ft/300))),dl=fp?Math.round((ft-fp)/fp*100):ft?100:0;
 const c=(i,v,l,x)=>`<div class="card sc"><span class="ic">${i}</span><div><b>${v}</b><p>${l}</p>${x}</div></div>`;
 $('#st').innerHTML=c('📋',td,'Tasks Today',`<small class="${dy>=0?'up':'dn'}">${dy>=0?'↑ +':'↓ '}${dy} vs yesterday</small>`)+c('🎯',`${gd} / ${D.goals.length}`,'Goals This Week',`<div class="pb"><i style="width:${gp*100}%"></i></div>`)+
  c('🕓',fmt(ft),'Focus Time This Week',`<small class="${dl>=0?'up':'dn'}">${dl>=0?'↑ +':'↓ '}${dl}%</small>`)+c('🔥',sc+'%','Productivity Score',`<small title="60% tasks done, 20% goals, 20% focus (5h/week)">ⓘ how it's calculated</small>`);
 rPomo();rGoals();rAna();rTasks();rCal();if(view=='settings')rSet()}
function rGoals(){$('#goals').innerHTML=`<div class="ch"><h3>🏆 My Goals</h3>${view=='goals'?'<button class="btn" data-a="ga">＋ Add Goal</button>':'<button class="lk" data-nav="goals">View All →</button>'}</div>`+
 (D.goals.length?D.goals:[]).slice(0,view=='goals'?99:3).map(g=>{const p=Math.min(100,g.cur/g.tgt*100),v=g.tgt==100?g.cur+'%':`${g.cur} / ${g.tgt}`;
 return`<div class="gr"><button class="ck${g.cur>=g.tgt?' on':''}" data-a="gt" data-id="${g.id}"></button><span class="gi">${g.i}</span><div class="gm"><div class="gt"><span data-a="ge" data-id="${g.id}">${esc(g.t)}</span><span class="ctl"><button data-a="gm" data-id="${g.id}">−</button><button data-a="gp" data-id="${g.id}">＋</button><button data-a="gd" data-id="${g.id}">🗑</button></span></div><div class="pb"><i style="width:${p}%"></i></div><small>${g.per}</small></div><b class="gv">${v}</b></div>`}).join('')||'<p><small>No goals yet. Add your first goal.</small></p>'}
function rAna(){const ws=addDays(wStart(today()),range?0:-7),ds=wDays(ws),fv=ds.map(d=>D.focus[d]||0),tot=sum(fv),pt=sum(wDays(addDays(ws,-7)).map(d=>D.focus[d]||0)),wt=D.tasks.filter(x=>ds.includes(x.d)),
 rate=wt.length?Math.round(wt.filter(x=>x.x).length/wt.length*100):0,dn=D.tasks.filter(x=>x.x&&ds.includes(x.x)).length,dl=pt?Math.round((tot-pt)/pt*100):tot?100:0,mx=Math.max(...fv,1),C=326.7;
 $('#ana').innerHTML=`<div class="ch"><h3>📊 Analytics</h3><select data-a="rg" style="width:auto"><option value="0"${range?'':' selected'}>Last Week</option><option value="1"${range?' selected':''}>This Week</option></select></div><div class="an">
 <div class="rg"><svg viewBox="0 0 120 120"><circle class="rb" cx="60" cy="60" r="52"/><circle class="rf" cx="60" cy="60" r="52" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-rate/100)}"/></svg><div><b>${rate}%</b><small>Productivity<br>Rate</small></div></div>
 <div class="tl"><div><span>🕓 ${fmt(tot)}<br><small>Total Focus Time</small></span></div><div><span>✅ ${dn}<br><small>Tasks Completed</small></span></div><div><span class="${dl>=0?'up':'dn'}">${dl>=0?'↗ +':'↘ '}${dl}%<br><small>vs previous week</small></span></div></div>
 <div class="bars">${fv.map((v,i)=>`<div title="${v} min"><i style="height:${v/mx*100}%"></i>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}</div>`).join('')}</div></div>`}
function rTasks(){const l=D.tasks.filter(x=>x.d==sel).sort((a,b)=>!!a.x-!!b.x||b.p-a.p);
 $('#tasks').innerHTML=`<div class="ch"><h3>☑️ ${sel==today()?"Today's Tasks":lbl(sel)}</h3><button class="btn" data-a="ta">＋ Add Task</button></div>`+
 (l.map(x=>`<div class="tk${x.x?' d':''}"><button class="ck${x.x?' on':''}" data-a="tt" data-id="${x.id}"></button><span class="t" data-a="te" data-id="${x.id}">${esc(x.t)}</span><span class="pd">${'●'.repeat(x.p).replace(/●/g,'<b>●</b>')}${'●'.repeat(3-x.p)}</span><button class="ctl" data-a="td" data-id="${x.id}">🗑</button></div>`).join('')||'<p><small>Nothing planned for this day. Add a task to get started.</small></p>')}
function rCal(){const y=calM.getFullYear(),m=calM.getMonth(),off=(new Date(y,m,1).getDay()+6)%7,n=new Date(y,m+1,0).getDate();
 let h=`<div class="ch"><button class="ib" data-a="cp">‹</button><h3>${calM.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</h3><button class="ib" data-a="cn">›</button></div><div class="cg">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<b>${d}</b>`).join('')}`;
 for(let i=0;i<off;i++)h+='<i></i>';for(let d=1;d<=n;d++){const s=iso(new Date(y,m,d)),c=D.tasks.filter(t=>t.d==s).length;h+=`<button class="cd${s==today()?' td':''}${s==sel?' on':''}" data-a="cday" data-d="${s}">${d}${c?`<small>${c}</small>`:''}</button>`}
 $('#cal').innerHTML=h+'</div><p><small>Click a day to see and plan its tasks.</small></p>'}
function rSet(){const u=users[me],s=D.set;$('#set').innerHTML=`<div class="ch"><h3>⚙️ Settings</h3></div>
 <form class="set" id="fp"><b>Profile</b><label>Name<input name="name" value="${esc(u.name)}" required></label><label>Email<input value="${esc(me)}" disabled></label><label>Photo<input type="file" id="fa" accept="image/*"></label><button class="btn g" type="button" data-a="rav">Remove photo</button><label>New password (optional)<input name="pw" type="password" placeholder="Leave empty to keep current"></label><button class="btn">Save profile</button></form>
 <form class="set" id="ft"><b>Pomodoro (minutes)</b><label>Focus<input name="f" type="number" min="1" max="120" value="${s.f}"></label><label>Break<input name="b" type="number" min="1" max="60" value="${s.b}"></label><label>Long break<input name="l" type="number" min="1" max="60" value="${s.l}"></label><button class="btn">Save timer</button></form>
 <div class="set"><b>App</b><button class="btn g" data-a="th">${D.theme=='dark'?'☀️ Light':'🌙 Dark'} mode</button><button class="btn g" data-a="ex">⬇ Export my data</button><button class="btn g" data-a="rs">Clear all my data</button><button class="btn" data-a="del">Delete account</button></div>`}

/* ---------- events ---------- */
document.addEventListener('submit',e=>{const f=e.target,v=Object.fromEntries(new FormData(f));
 if(f.id=='fp'){e.preventDefault();users[me].name=v.name.trim();if(v.pw){if(v.pw.length<6)return alert('Password needs 6+ characters.');users[me].p=hash(v.pw)}saveU();render();alert('Profile saved.')}
 if(f.id=='ft'){e.preventDefault();D.set={f:+v.f,b:+v.b,l:+v.l};T={i:0,left:D.set.f*60,run:false,end:0};save();render();alert('Timer saved.')}});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id=='dp'&&t.value){sel=t.value;calM=new Date(sel+'T00:00');render()}
 if(t.dataset.a=='rg'){range=+t.value;rAna()}
 if(t.id=='fa'&&t.files[0]){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const c=document.createElement('canvas');c.width=c.height=160;const s=Math.min(i.width,i.height);c.getContext('2d').drawImage(i,(i.width-s)/2,(i.height-s)/2,s,s,0,0,160,160);users[me].av=c.toDataURL('image/jpeg',.8);saveU();avatars()};i.src=r.result};r.readAsDataURL(t.files[0])}});
const dd=id=>{const e=$(id),o=e.hidden;$$('.dd').forEach(x=>x.hidden=true);e.hidden=!o};
const TF=[['t','Title'],['d','Date','date'],['p','Priority']];
document.addEventListener('click',e=>{
 if(!e.target.closest('.pw'))$$('.dd').forEach(x=>x.hidden=true);
 const b=e.target.closest('[data-a],[data-nav]');if(!b)return;
 if(b.dataset.nav){view=b.dataset.nav;$$('.dd').forEach(x=>x.hidden=true);return render()}
 const a=b.dataset.a,id=b.dataset.id,tk=D.tasks.find(x=>x.id==id),g=D.goals.find(x=>x.id==id),S=()=>{save();render()};
 const taskForm=(t,cb)=>modal(t?'Edit task':'New task',[{k:'t',l:'Title',v:t?.t||''},{k:'d',l:'Date',t:'date',v:t?.d||sel},{k:'p',l:'Priority',v:t?.p||1,o:[[1,'Low'],[2,'Medium'],[3,'High']]}],cb);
 const goalForm=(g,cb)=>modal(g?'Edit goal':'New goal',[{k:'t',l:'Goal',v:g?.t||''},{k:'i',l:'Icon',v:g?.i||'🎯',o:['🎯','💻','🏋️','📖','💧','🧘','💰','✍️'].map(x=>[x,x])},{k:'tgt',l:'Target (number)',t:'number',v:g?.tgt||5},{k:'per',l:'Period',v:g?.per||'This Week',o:[['This Week','This Week'],['This Month','This Month']]}],cb);
 ({out:logout,
  menu:()=>dd('#mn'),
  bell:()=>{const o=$('#nl').hidden;dd('#nl');if(o){$('#nl').innerHTML=D.n.map(n=>`<div>${n.r?'':'● '}${esc(n.m)}</div>`).join('')||'<div><small>No notifications</small></div>';D.n.forEach(n=>n.r=1);save();$('#bd').hidden=true}},
  dp:()=>{try{$('#dp').showPicker()}catch{}},
  tp:()=>{T.run=!T.run;if(T.run)T.end=Date.now()+T.left*1000;rPomo()},tr:()=>{credit();T.run=false;T.left=seq()[T.i][1]*60;rPomo()},tn:()=>{credit();T.run=false;T.i=(T.i+1)%5;T.left=seq()[T.i][1]*60;rPomo()},
  ta:()=>taskForm(null,v=>D.tasks.push({id:uid(),t:v.t.trim(),d:v.d,p:+v.p,x:null})),te:()=>taskForm(tk,v=>Object.assign(tk,{t:v.t.trim(),d:v.d,p:+v.p})),
  tt:()=>{tk.x=tk.x?null:today();if(tk.x)note(`Task done: ${tk.t}`);S()},td:()=>{if(confirm('Delete this task?')){D.tasks=D.tasks.filter(x=>x!=tk);S()}},
  ga:()=>goalForm(null,v=>D.goals.push({id:uid(),t:v.t.trim(),i:v.i,cur:0,tgt:+v.tgt,per:v.per})),ge:()=>goalForm(g,v=>Object.assign(g,{t:v.t.trim(),i:v.i,tgt:+v.tgt,per:v.per,cur:Math.min(g.cur,+v.tgt)})),
  gt:()=>{g.cur=g.cur>=g.tgt?0:g.tgt;if(g.cur)note(`Goal achieved: ${g.t} 🎉`);S()},gp:()=>{g.cur=Math.min(g.tgt,g.cur+1);if(g.cur==g.tgt)note(`Goal achieved: ${g.t} 🎉`);S()},gm:()=>{g.cur=Math.max(0,g.cur-1);S()},
  gd:()=>{if(confirm('Delete this goal?')){D.goals=D.goals.filter(x=>x!=g);S()}},
  cp:()=>{calM.setMonth(calM.getMonth()-1);rCal()},cn:()=>{calM.setMonth(calM.getMonth()+1);rCal()},cday:()=>{sel=b.dataset.d;view='tasks';render()},
  th:()=>{D.theme=D.theme=='dark'?'light':'dark';S()},rav:()=>{users[me].av='';saveU();render()},
  ex:()=>{const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([JSON.stringify({user:{email:me,name:users[me].name},...D},null,1)],{type:'application/json'}));l.download='focusflow-data.json';l.click()},
  rs:()=>{if(confirm('Erase all your tasks, goals and focus time? This cannot be undone.')){D=seed();T={i:0,left:1500,run:false,end:0};S()}},
  del:()=>{if(confirm('Delete your account and all data permanently?')){delete users[me];saveU();localStorage.removeItem('ff_d_'+me);logout()}}})[a]?.()});
/* search */
$('#q').oninput=e=>{const q=e.target.value.trim().toLowerCase(),r=$('#sr');if(!q)return r.hidden=true;
 const items=[...D.tasks.filter(t=>t.t.toLowerCase().includes(q)).map(t=>`<button data-sd="${t.d}">☑️ ${esc(t.t)}<small>${lbl(t.d)}</small></button>`),...D.goals.filter(g=>g.t.toLowerCase().includes(q)).map(g=>`<button data-nav="goals">🎯 ${esc(g.t)}<small>${g.per}</small></button>`)];
 r.innerHTML=items.join('')||'<div><small>No results</small></div>';r.hidden=false};
$('#sr').onclick=e=>{const b=e.target.closest('[data-sd]');if(b){sel=b.dataset.sd;view='tasks';render()}$('#sr').hidden=true;$('#q').value=''};
addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='k'&&!$('#app').hidden){e.preventDefault();$('#q').focus()}if(e.key=='Escape')$('.ov')?.remove()});
boot();
