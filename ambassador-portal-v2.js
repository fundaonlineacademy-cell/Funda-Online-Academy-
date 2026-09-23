(()=>{
'use strict';
const $=s=>document.querySelector(s), money=n=>'R'+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:0,maximumFractionDigits:2}), low=v=>String(v||'').toLowerCase(), esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const ranks=[{n:'Ambassador',min:0,max:10000,pay:0},{n:'Bronze',min:10000,max:25000,pay:0},{n:'Silver',min:25000,max:50000,pay:0},{n:'Gold',min:50000,max:100000,pay:5000},{n:'Platinum',min:100000,max:250000,pay:8000},{n:'Diamond',min:250000,max:500000,pay:12000},{n:'Executive',min:500000,max:1000000,pay:18000},{n:'Elite',min:1000000,max:Infinity,pay:25000}];
// One canonical navigation entry per Ambassador destination.
const navGroups=[
 {label:'MAIN',items:[['dashboard','⌂','My Dashboard'],['guide','◈','Programme Guide'],['referrals','◎','My Referrals'],['rank','◒','Rank Progress'],['compensation','▣','Compensation Plan']]},
 {label:'FINANCE',items:[['earnings','R','My Earnings'],['payments','▤','Payment History'],['banking','▧','My Banking']]},
 {label:'RESOURCES',items:[['marketing','◆','Marketing Resources'],['announcements','◉','Announcements'],['support','?','Help & Support'],['programme','▥','Programme Rules']]},
 {label:'ACCOUNT',items:[['referral-link','↗','My Referral Link'],['profile','♙','My Profile']]},
 {label:'YOUR VOICE',items:[['voice','✦','Your Voice']]}
];
const saBanks=[
 {name:'Absa Bank',code:'632005'},
 {name:'African Bank',code:'430000'},
 {name:'Bank Zero',code:'888000'},
 {name:'Bidvest Bank',code:'462005'},
 {name:'Capitec Bank',code:'470010'},
 {name:'Capitec Business',code:'450105'},
 {name:'Discovery Bank',code:'679000'},
 {name:'First National Bank (FNB)',code:'250655'},
 {name:'Investec Bank',code:'580105'},
 {name:'Nedbank',code:'198765'},
 {name:'Rand Merchant Bank (RMB)',code:'250655'},
 {name:'Standard Bank',code:'051001'},
 {name:'TymeBank',code:'678910'},
 {name:'Other South African Bank',code:''}
];
function installBankOptions(){
 const s=$('#bankName'),b=$('#branchCode'),h=$('#branchHelp');if(!s||!b)return;
 if(s.options.length<=1)s.insertAdjacentHTML('beforeend',saBanks.map(x=>'<option value="'+esc(x.name)+'" data-code="'+esc(x.code)+'">'+esc(x.name)+'</option>').join(''));
 const apply=()=>{let o=s.selectedOptions?.[0],code=o?.dataset?.code||'',other=s.value==='Other South African Bank',manual=$('#otherBankName');if(manual){manual.classList.toggle('hide',!other);manual.required=other;if(!other)manual.value=''}b.readOnly=!!code&&!other;b.value=code;if(h)h.textContent=other?'Enter the bank name and branch code exactly as shown on the bank statement or banking app.':code?'Universal branch code for '+s.value+': '+code:'Select a bank to continue.';if(other||!code)b.readOnly=false};
 s.onchange=apply;apply();
}
let db,user,app,currentAgreement=null,ledger=[],referrals=[],payouts=[],bank=null,resources=[],notifications=[],supportTickets=[],supportMessages=[];
let dashboardTrendDays=30,dashboardTrendMetric='referrals',dashboardCalendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
let referralPage=1;
const REFERRALS_PER_PAGE=10;
let marketingPage=1;
const MARKETING_RESOURCES_PER_PAGE=6;

let ambassadorLiveChannel=null,ambassadorLiveStarted=false,ambassadorRefreshTimer=null,ambassadorRefreshDebounce=null,ambassadorRefreshInFlight=false,ambassadorRefreshPending=false,ambassadorLastRefreshAt=0;
const AMBASSADOR_AUTO_REFRESH_MS=300000;
const AMBASSADOR_READ_ONLY_SECTIONS=new Set(['dashboard','guide','referrals','earnings','rank','compensation','payments','marketing','announcements','support','referral-link']);

function rank(rev){return [...ranks].reverse().find(r=>rev>=r.min)||ranks[0]}
function fmt(v){if(!v)return '—';try{return new Date(v).toLocaleDateString('en-ZA',{day:'2-digit',month:'short',year:'numeric'})}catch{return '—'}}
function badgeStatus(v){let s=low(v),cls=['active','approved','paid','verified','completed','introductory'].some(x=>s.includes(x))?'ok':['declined','rejected','failed','terminated','reversed','suspended'].some(x=>s.includes(x))?'bad':'warn';return '<span class="badge '+cls+'">'+esc(String(v||'pending').replaceAll('_',' ').toUpperCase())+'</span>'}
function closeSide(){document.body.classList.remove('amb-nav-open')}
function showSection(name){document.querySelectorAll('.section').forEach(x=>x.classList.toggle('on',x.dataset.section===name));document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('on',x.dataset.go===name));if(name==='voice')window.FundaAmbassadorVoice?.show?.();closeSide();scrollTo({top:0,behavior:'auto'});if(ambassadorRefreshPending)scheduleAmbassadorRefresh('section-change')}

function buildAmbassadorSearchIndex(){
 const items=[],seen=new Set();
 const add=(title,section,detail,terms='')=>{
   const key=section+'|'+title;
   if(seen.has(key))return;
   seen.add(key);
   items.push({title,section,detail,haystack:low([title,detail,terms].filter(Boolean).join(' '))});
 };
 const aliases={
   dashboard:'home overview snapshot calendar payday holiday performance graph trend academy identity',
   guide:'how it works getting started steps programme guide',
   referrals:'referral referred student course referral status',
   earnings:'earnings commission income approved paid breakdown ledger',
   rank:'rank progress bronze silver gold platinum diamond executive elite qualifying revenue',
   compensation:'compensation plan commission rate bonus monthly performance level',
   payments:'payment history payout paid reference payday',
   banking:'bank banking bank details account branch code',
   marketing:'marketing resources posters flyers social media approved resources',
   announcements:'announcements notifications news notices updates',
   support:'help support ticket query assistance',
   programme:'programme rules agreement policy rules conduct',
   'referral-link':'referral link code account creation invite student tracked link',
   profile:'profile personal details phone email province',
   voice:'your voice suggestion complaint compliment feedback'
 };
 navGroups.forEach(group=>group.items.forEach(([section,_icon,title])=>add(title,section,group.label,aliases[section]||'')));
 [
   ['Ambassador Calendar','dashboard','My Dashboard','calendar payday public holiday month today'],
   ['Performance Overview','dashboard','My Dashboard','earnings overview referral growth my performance'],
   ['Referral & Revenue Performance','dashboard','My Dashboard','line graph chart 7 days 30 days 90 days revenue'],
   ['My Ambassador Snapshot','dashboard','My Dashboard','eligible referrals approved paid earnings awaiting approval direct commission'],
   ['Academy Identity','dashboard','My Dashboard','vision mission purpose values objectives commitment']
 ].forEach(x=>add(...x));

 referrals.slice(0,20).forEach(x=>add(
   'Referral: '+(x.student_display||'Referred student'),
   'referrals',
   x.course_title||'Referral record',
   [x.referral_status,x.earning_status].join(' ')
 ));
 confirmedLedger().slice(0,20).forEach(x=>add(
   'Earning: '+String(x.earning_type||'earning').replaceAll('_',' '),
   'earnings',
   money(x.commission_amount)+' · '+String(x.earning_status||'approved').replaceAll('_',' '),
   [x.notes,x.earning_month].join(' ')
 ));
 payouts.slice(0,20).forEach(x=>add(
   'Payment: '+money(x.amount),
   'payments',
   String(x.status||'recorded').replaceAll('_',' ')+(x.payment_reference?' · '+x.payment_reference:''),
   [x.payment_date,x.notes].join(' ')
 ));
 resources.slice(0,20).forEach(x=>add(
   'Resource: '+(x.title||'Marketing resource'),
   'marketing',
   x.resource_type||'Approved resource',
   [x.description,x.approved_caption].join(' ')
 ));
 notifications.slice(0,20).forEach(x=>add(
   'Announcement: '+(x.title||'Announcement'),
   'announcements',
   'Ambassador announcement',
   [x.message,x.body,x.content].join(' ')
 ));
 supportTickets.slice(0,20).forEach(x=>add(
   'Support: '+(x.subject||'Support ticket'),
   'support',
   String(x.status||'open').replaceAll('_',' '),
   [x.category,x.priority,x.notes].join(' ')
 ));
 return items;
}

function installHeaderSearch(){
 const input=$('#ambassadorGlobalSearch'),box=$('#ambassadorSearchResults');
 if(!input||!box||input.dataset.ready==='1')return;
 input.dataset.ready='1';
 let current=[];
 const close=()=>{box.classList.remove('open');box.innerHTML='';input.setAttribute('aria-expanded','false');current=[]};
 const openItem=item=>{
   if(!item)return;
   showSection(item.section);
   input.value='';
   close();
   setTimeout(()=>input.blur(),0);
 };
 const render=()=>{
   const q=low(input.value).trim();
   if(!q){close();return}
   const terms=q.split(/\s+/).filter(Boolean);
   current=buildAmbassadorSearchIndex().filter(item=>terms.every(term=>item.haystack.includes(term))).slice(0,8);
   if(!current.length){
     box.innerHTML='<div class="ambassadorSearchEmpty">No matching Ambassador Portal item found.</div>';
   }else{
     box.innerHTML=current.map((item,i)=>'<button class="ambassadorSearchResult" type="button" role="option" data-search-index="'+i+'"><b>'+esc(item.title)+'</b><span>'+esc(item.detail||'Ambassador Portal')+'</span></button>').join('');
     box.querySelectorAll('[data-search-index]').forEach(btn=>btn.onclick=()=>openItem(current[Number(btn.dataset.searchIndex)]));
   }
   box.classList.add('open');
   input.setAttribute('aria-expanded','true');
 };
 input.addEventListener('input',render);
 input.addEventListener('focus',()=>{if(input.value.trim())render()});
 input.addEventListener('keydown',event=>{
   if(event.key==='Enter'){
     event.preventDefault();
     if(current[0])openItem(current[0]);else render();
   }else if(event.key==='Escape')close();
 });
 document.addEventListener('click',event=>{if(!event.target.closest('.ambassadorSearchWrap'))close()});
}

function installNav(){
 const html=navGroups.map(g=>'<div class="navGroup"><div class="navGroupLabel">'+g.label+'</div>'+g.items.map(([k,i,t],idx)=>'<button class="navbtn '+(k==='dashboard'&&g.label==='MAIN'&&idx===0?'on':'')+'" data-go="'+k+'"><span class="navIcon">'+i+'</span><span>'+t+'</span></button>').join('')+'</div>').join('');
 $('#sideNav').innerHTML=html;
 if($('#mobileNav'))$('#mobileNav').innerHTML='';
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showSection(b.dataset.go));
 if($('#profileTop'))$('#profileTop').onclick=()=>showSection('profile');
 const toggle=$('#sideToggle'),overlay=$('#sideOverlay'),close=$('#sideClose');
 if(toggle)toggle.onclick=()=>document.body.classList.toggle('amb-nav-open');
 if(overlay)overlay.onclick=closeSide;
 if(close)close.onclick=closeSide;
 installHeaderSearch();
}
function fail(msg){$('#loading')?.classList.add('hide');$('#notFound')?.classList.remove('hide');if(msg){const el=$('#notFound .accessLead')||$('#notFound .muted');if(el)el.textContent=msg}}
function sum(type,statuses){return ledger.filter(x=>(!type||x.earning_type===type)&&(!statuses||statuses.includes(x.earning_status))).reduce((s,x)=>s+Number(x.commission_amount||0),0)}
function confirmedLedger(){return ledger.filter(x=>['approved','paid'].includes(low(x.earning_status)))}
function awaitingReferralCount(){return referrals.filter(x=>!['confirmed','disqualified'].includes(low(x.earning_status))).length}
function referralLink(){if(!app?.referral_code)return '';return location.origin+'/create-account.html?ref='+encodeURIComponent(app.referral_code)}
function localDateKey(v){
 if(!v)return '';
 const d=new Date(v);if(Number.isNaN(d.getTime()))return '';
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function eligibleReferrals(){return referrals.filter(x=>low(x.earning_status)!=='disqualified')}
function arrangeDashboard(){
 const perf=document.getElementById('ambassadorPerformanceOverview'),ceo=document.getElementById('ambassador-ceo-message');
 if(perf&&ceo&&perf.parentNode===ceo.parentNode&&ceo.nextElementSibling!==perf)perf.parentNode.insertBefore(ceo,perf);
}
function renderPerformanceOverview(total,commission,bonus,performance,life,current,next,awaiting){
 const eligible=eligibleReferrals(),paidOut=payouts.filter(x=>low(x.status)==='paid').reduce((s,x)=>s+Number(x.amount||0),0);
 const now=new Date(),thisMonth=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
 const prev=new Date(now.getFullYear(),now.getMonth()-1,1),prevMonth=prev.getFullYear()+'-'+String(prev.getMonth()+1).padStart(2,'0');
 const monthOf=v=>{const k=localDateKey(v);return k?k.slice(0,7):''};
 const currentMonthCount=eligible.filter(x=>monthOf(x.referral_date)===thisMonth).length;
 const previousMonthCount=eligible.filter(x=>monthOf(x.referral_date)===prevMonth).length;
 const confirmed=referrals.filter(x=>low(x.earning_status)==='confirmed').length;
 const delta=currentMonthCount-previousMonthCount;
 const remain=next?Math.max(0,next.min-life):0;
 if($('#overviewEarnings'))$('#overviewEarnings').textContent=money(total);
 if($('#overviewEarningsMeta'))$('#overviewEarningsMeta').textContent=money(commission)+' direct commission · '+money(bonus+performance)+' bonuses / performance';
 if($('#overviewEarningsFoot'))$('#overviewEarningsFoot').textContent=money(paidOut)+' paid out to date';
 if($('#overviewReferralGrowth'))$('#overviewReferralGrowth').textContent=eligible.length;
 if($('#overviewReferralMeta'))$('#overviewReferralMeta').textContent=currentMonthCount+' recorded this month · '+confirmed+' confirmed';
 if($('#overviewReferralFoot'))$('#overviewReferralFoot').textContent=previousMonthCount?((delta>=0?'+':'')+delta+' vs previous month'):(currentMonthCount?'First recorded activity in this comparison period':'No referral activity this month yet');
 if($('#overviewPerformance'))$('#overviewPerformance').textContent=current.n;
 if($('#overviewPerformanceMeta'))$('#overviewPerformanceMeta').textContent=money(life)+' lifetime qualifying revenue';
 if($('#overviewPerformanceFoot'))$('#overviewPerformanceFoot').textContent=next?money(remain)+' to reach '+next.n:'Highest published Ambassador level reached';
}
function addCalendarDays(date,days){const d=new Date(date);d.setDate(d.getDate()+days);return d}
function easterSunday(year){
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
 return new Date(year,month-1,day);
}
function southAfricanPublicHolidays(year){
 const fixed=[
   [0,1,"New Year's Day"],[2,21,'Human Rights Day'],[3,27,'Freedom Day'],[4,1,"Workers' Day"],
   [5,16,'Youth Day'],[7,9,"National Women's Day"],[8,24,'Heritage Day'],[11,16,'Day of Reconciliation'],
   [11,25,'Christmas Day'],[11,26,'Day of Goodwill']
 ];
 const list=fixed.map(([month,day,name])=>({date:new Date(year,month,day),name}));
 const easter=easterSunday(year);
 list.push({date:addCalendarDays(easter,-2),name:'Good Friday'},{date:addCalendarDays(easter,1),name:'Family Day'});
 const observed=[];
 list.forEach(h=>{if(h.date.getDay()===0)observed.push({date:addCalendarDays(h.date,1),name:h.name+' (Observed)'})});
 const map=new Map();
 [...list,...observed].forEach(h=>{const k=localDateKey(h.date),names=map.get(k)||[];if(!names.includes(h.name))names.push(h.name);map.set(k,names)});
 return map;
}
function isSouthAfricanBusinessDay(date){
 const day=date.getDay();if(day===0||day===6)return false;
 return !southAfricanPublicHolidays(date.getFullYear()).has(localDateKey(date));
}
function ambassadorPayday(year,month){
 let d=new Date(year,month,5);
 while(!isSouthAfricanBusinessDay(d))d=addCalendarDays(d,-1);
 return d;
}
function compactAxisMoney(value){
 const n=Number(value||0);
 if(Math.abs(n)>=1000000)return 'R'+(n/1000000).toFixed(n%1000000===0?0:1)+'m';
 if(Math.abs(n)>=1000)return 'R'+(n/1000).toFixed(n%1000===0?0:1)+'k';
 return 'R'+Math.round(n);
}
function niceChartMax(value,metric){
 const n=Math.max(metric==='referrals'?4:1,Number(value||0));
 if(metric==='referrals')return Math.max(4,Math.ceil(n/4)*4);
 const magnitude=Math.pow(10,Math.floor(Math.log10(n)));
 const scaled=n/magnitude;
 const nice=scaled<=1?1:scaled<=2?2:scaled<=5?5:10;
 return nice*magnitude;
}
function renderDashboardTrend(){
 const host=$('#ambassadorTrendChart');if(!host)return;
 const today=new Date(),start=new Date(today.getFullYear(),today.getMonth(),today.getDate()-dashboardTrendDays+1);
 const buckets=Array.from({length:dashboardTrendDays},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return {date:d,key:localDateKey(d),referrals:0,revenue:0}});
 const byKey=new Map(buckets.map(x=>[x.key,x]));
 eligibleReferrals().forEach(x=>{const b=byKey.get(localDateKey(x.referral_date));if(b)b.referrals+=1});
 ledger.filter(x=>x.earning_type==='commission'&&['approved','paid'].includes(low(x.earning_status))).forEach(x=>{
   const b=byKey.get(localDateKey(x.created_at||x.earning_month));if(b)b.revenue+=Number(x.qualifying_revenue||0);
 });
 const referralTotal=buckets.reduce((s,x)=>s+x.referrals,0),revenueTotal=buckets.reduce((s,x)=>s+x.revenue,0);
 if($('#trendReferralTotal'))$('#trendReferralTotal').textContent=referralTotal;
 if($('#trendRevenueTotal'))$('#trendRevenueTotal').textContent=money(revenueTotal);
 document.querySelectorAll('[data-trend-period]').forEach(b=>{const on=Number(b.dataset.trendPeriod)===dashboardTrendDays;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.onclick=()=>{dashboardTrendDays=Number(b.dataset.trendPeriod)||30;renderDashboardTrend()}});
 document.querySelectorAll('[data-trend-metric]').forEach(b=>{const on=b.dataset.trendMetric===dashboardTrendMetric;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.onclick=()=>{dashboardTrendMetric=b.dataset.trendMetric||'referrals';renderDashboardTrend()}});
 const dailyValues=buckets.map(x=>dashboardTrendMetric==='revenue'?x.revenue:x.referrals);
 let running=0;const values=dailyValues.map(v=>(running+=Number(v||0)));
 const metricLabel=dashboardTrendMetric==='revenue'?'Cumulative confirmed qualifying revenue':'Cumulative eligible referrals';
 const yMax=niceChartMax(Math.max(...values,0),dashboardTrendMetric);
 const w=760,h=300,left=72,right=24,top=24,bottom=48,plotW=w-left-right,plotH=h-top-bottom;
 const xAt=i=>left+(buckets.length===1?0:(i/(buckets.length-1))*plotW),yAt=v=>top+plotH-(Number(v||0)/yMax)*plotH;
 const points=values.map((v,i)=>[xAt(i),yAt(v)]);
 const line=points.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 const yTicks=Array.from({length:5},(_,i)=>i*yMax/4);
 const xIndexes=[0,Math.round((buckets.length-1)*.25),Math.round((buckets.length-1)*.5),Math.round((buckets.length-1)*.75),buckets.length-1].filter((v,i,a)=>a.indexOf(v)===i);
 const yLabel=v=>dashboardTrendMetric==='revenue'?compactAxisMoney(v):String(Math.round(v));
 const hasActivity=values.some(v=>Number(v)>0);
 const grid=yTicks.map(v=>{const y=yAt(v);return '<line x1="'+left+'" y1="'+y.toFixed(1)+'" x2="'+(w-right)+'" y2="'+y.toFixed(1)+'" stroke="#e5e9ed" stroke-width="1"/><text x="'+(left-10)+'" y="'+(y+4).toFixed(1)+'" text-anchor="end" font-size="11" font-weight="700" fill="#667787">'+esc(yLabel(v))+'</text>'}).join('');
 const markers=points.map((p,i)=>((values[i]>0||i===points.length-1)&&dashboardTrendDays<=30?'<circle cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.8" fill="#c99a2e" stroke="#fff" stroke-width="1.5"/>':'')).join('');
 const xLabels=xIndexes.map(i=>'<line x1="'+xAt(i).toFixed(1)+'" y1="'+(top+plotH)+'" x2="'+xAt(i).toFixed(1)+'" y2="'+(top+plotH+5)+'" stroke="#9aa8b5" stroke-width="1"/><text x="'+xAt(i).toFixed(1)+'" y="'+(h-16)+'" text-anchor="'+(i===0?'start':i===buckets.length-1?'end':'middle')+'" font-size="11" font-weight="700" fill="#667787">'+esc(buckets[i].date.toLocaleDateString('en-ZA',{day:'2-digit',month:'short'}))+'</text>').join('');
 host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(metricLabel)+' line graph for the last '+dashboardTrendDays+' days">'+
   '<rect x="'+left+'" y="'+top+'" width="'+plotW+'" height="'+plotH+'" fill="#fff" stroke="#cfd8df" stroke-width="1"/>'+
   grid+
   '<line x1="'+left+'" y1="'+(top+plotH)+'" x2="'+(w-right)+'" y2="'+(top+plotH)+'" stroke="#8f9eaa" stroke-width="1.2"/>'+
   '<line x1="'+left+'" y1="'+top+'" x2="'+left+'" y2="'+(top+plotH)+'" stroke="#8f9eaa" stroke-width="1.2"/>'+
   '<path d="'+line+'" fill="none" stroke="#173f62" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>'+
   markers+xLabels+
   '<text x="'+left+'" y="14" font-size="11" font-weight="900" fill="#17324a">'+esc(metricLabel)+'</text>'+
   '</svg>'+(hasActivity?'':'<div class="trendEmpty">No '+(dashboardTrendMetric==='revenue'?'confirmed qualifying revenue':'eligible referral')+' activity is recorded in this period yet.</div>');
}
function renderAmbassadorCalendar(){
 const host=$('#ambassadorCalendarGrid');if(!host)return;
 const cursor=dashboardCalendarCursor,y=cursor.getFullYear(),m=cursor.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),start=(first.getDay()+6)%7;
 const holidays=southAfricanPublicHolidays(y),payday=ambassadorPayday(y,m),paydayKey=localDateKey(payday),todayKey=localDateKey(new Date());
 const previousMonth=new Date(y,m-1,1);
 const earningsMonth=previousMonth.toLocaleDateString('en-ZA',{month:'long',year:'numeric'});
 if($('#ambCalendarTitle'))$('#ambCalendarTitle').textContent=cursor.toLocaleDateString('en-ZA',{month:'long',year:'numeric'});
 if($('#ambassadorPaydaySummary'))$('#ambassadorPaydaySummary').innerHTML='<b>Scheduled Ambassador payday: '+esc(payday.toLocaleDateString('en-ZA',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}))+'</b><br>'+esc(earningsMonth)+' qualifying earnings are scheduled for this payday. Standard payday is the 5th of the following month; if the 5th falls on a weekend or South African public holiday, the date moves to the previous business day.';
 const monthHolidayItems=[...holidays.entries()].filter(([date])=>date.startsWith(y+'-'+String(m+1).padStart(2,'0'))).sort((a,b)=>a[0].localeCompare(b[0]));
 if($('#ambassadorCalendarMonthNote'))$('#ambassadorCalendarMonthNote').innerHTML=monthHolidayItems.length?'<b>Public holidays this month:</b> '+monthHolidayItems.map(([date,names])=>esc(names.join(' / '))+' · '+esc(new Date(date+'T12:00:00').toLocaleDateString('en-ZA',{day:'2-digit',month:'short'}))).join(' &nbsp;•&nbsp; '):'<b>Public holidays this month:</b> None.';
 const cells=[];
 for(let i=0;i<start;i++)cells.push('<span class="ambCalendarDate muted" aria-hidden="true"></span>');
 for(let day=1;day<=days;day++){
   const d=new Date(y,m,day),k=localDateKey(d),holidayNames=holidays.get(k)||[],isPayday=k===paydayKey;
   const classes=['ambCalendarDate'];
   if(k===todayKey)classes.push('today');
   if(holidayNames.length)classes.push('holiday');
   if(isPayday)classes.push('payday');
   const details=[d.toLocaleDateString('en-ZA',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})];
   if(holidayNames.length)details.push('Public holiday: '+holidayNames.join(', '));
   if(isPayday)details.push('Scheduled Ambassador payday for '+earningsMonth+' qualifying earnings');
   cells.push('<span class="'+classes.join(' ')+'" title="'+esc(details.join(' · '))+'">'+day+'</span>');
 }
 host.innerHTML='<div class="ambCalendarGrid">'+['Mo','Tu','We','Th','Fr','Sa','Su'].map(x=>'<span class="ambCalendarDow">'+x+'</span>').join('')+cells.join('')+'</div>';
 const prev=$('#ambCalPrev'),next=$('#ambCalNext'),today=$('#ambCalToday');
 if(prev)prev.onclick=()=>{dashboardCalendarCursor=new Date(y,m-1,1);renderAmbassadorCalendar()};
 if(next)next.onclick=()=>{dashboardCalendarCursor=new Date(y,m+1,1);renderAmbassadorCalendar()};
 if(today)today.onclick=()=>{const n=new Date();dashboardCalendarCursor=new Date(n.getFullYear(),n.getMonth(),1);renderAmbassadorCalendar()};
}
async function copy(text,btn){if(!text)return;try{await navigator.clipboard.writeText(text);let old=btn.textContent;btn.textContent='Copied ✓';setTimeout(()=>btn.textContent=old,1200)}catch{alert(text)}}
async function downloadResource(resource,btn){
 if(!resource?.file_url)return;
 const old=btn?.textContent||'Download';
 try{
  if(btn){btn.disabled=true;btn.textContent='Downloading…'}
  const res=await fetch(resource.file_url,{mode:'cors',cache:'no-store'});
  if(!res.ok)throw new Error('File could not be downloaded');
  const blob=await res.blob();
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=resource.original_filename||((resource.title||'funda-marketing-resource').replace(/[^a-z0-9._-]+/gi,'-')+(resource.mime_type==='image/png'?'.png':resource.mime_type==='image/jpeg'?'.jpg':resource.mime_type==='image/webp'?'.webp':resource.mime_type==='application/pdf'?'.pdf':resource.mime_type==='video/mp4'?'.mp4':''));
  a.style.display='none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  if(btn)btn.textContent='Downloaded ✓';
  setTimeout(()=>{if(btn){btn.disabled=false;btn.textContent=old}},1600);
 }catch(err){
  if(btn){btn.disabled=false;btn.textContent=old}
  alert('The file could not be downloaded. Please try again.');
 }
}

async function restoreAuthUser(){
 if(window.FundaAuth?.restore){
  const restored=await window.FundaAuth.restore(db);
  if(restored.user)return restored.user;
  if(!restored.confirmedSignedOut)throw new Error('The secure connection could not be confirmed. You have not been signed out. Check your connection and try again.');
  return null;
 }
 let lastError=null;
 for(const wait of [0,250,650,1200]){
  if(wait)await new Promise(r=>setTimeout(r,wait));
  try{
   const s=await db.auth.getSession();
   if(s.data?.session?.user)return s.data.session.user;
   if(s.error)lastError=s.error;
  }catch(e){lastError=e}
  try{
   const g=await db.auth.getUser();
   if(g.data?.user)return g.data.user;
   if(g.error)lastError=g.error;
  }catch(e){lastError=e}
 }
 if(lastError)console.warn('Ambassador session restore failed',lastError);
 return null;
}

function currentAmbassadorSection(){return document.querySelector('.section.on')?.dataset?.section||'dashboard'}
function ambassadorAutoRefreshSafe(){
 if(!db||!user||!app||document.hidden)return false;
 if(!AMBASSADOR_READ_ONLY_SECTIONS.has(currentAmbassadorSection()))return false;
 if(document.querySelector('#ambSupportModal,#ambMarketingPreview'))return false;
 const active=document.activeElement;
 if(active&&['INPUT','TEXTAREA','SELECT'].includes(active.tagName))return false;
 return true;
}
function scheduleAmbassadorRefresh(reason='sync'){
 if(!db||!app)return;
 if(!ambassadorAutoRefreshSafe()){ambassadorRefreshPending=true;return}
 clearTimeout(ambassadorRefreshDebounce);
 ambassadorRefreshDebounce=setTimeout(()=>refreshAmbassadorRecords(reason),320);
}
async function refreshAmbassadorRecords(reason='sync'){
 if(ambassadorRefreshInFlight||!db||!user||!app)return;
 if(!ambassadorAutoRefreshSafe()){ambassadorRefreshPending=true;return}
 ambassadorRefreshInFlight=true;ambassadorRefreshPending=false;
 const section=currentAmbassadorSection(),scrollYBefore=window.scrollY;
 const appColumns='id,auth_user_id,full_name,email,phone,province,country,best_platform,status,agreement_status,agreement_accepted_at,account_status,referral_code,introductory_started_at,introductory_ends_at,updated_at';
 try{
   const [a,agreementState,l,r,p,b,m,n,t]=await Promise.all([
     db.from('ambassador_programme_applications').select(appColumns).eq('auth_user_id',user.id).maybeSingle(),
     db.rpc('get_own_ambassador_agreement_status'),
     db.rpc('get_own_ambassador_earnings'),
     db.rpc('get_own_ambassador_referrals'),
     db.from('ambassador_payouts').select('id,application_id,amount,payment_reference,payment_date,status,notes,created_at').eq('application_id',app.id).order('created_at',{ascending:false}),
     db.rpc('get_own_ambassador_payout_details'),
     db.from('ambassador_marketing_resources').select('id,title,description,resource_type,file_url,original_filename,mime_type,approved_caption,action_url,status,starts_at,expires_at,created_at').eq('status','active').order('created_at',{ascending:false}),
     db.rpc('get_own_ambassador_announcements'),
     db.from('ambassador_support_tickets').select('id,application_id,subject,category,priority,notes,status,created_at,updated_at').eq('application_id',app.id).order('created_at',{ascending:false})
   ]);
   if(a.error||!a.data||l.error||p.error||b.error||t.error)throw new Error(a.error?.message||l.error?.message||p.error?.message||b.error?.message||t.error?.message||'Ambassador live refresh failed');
   if(a.data.status!=='approved'||!['introductory','active'].includes(a.data.account_status)){location.reload();return}
   app=a.data;
   if(!agreementState.error)currentAgreement=Array.isArray(agreementState.data)?agreementState.data[0]||null:agreementState.data||null;
   ledger=l.data||[];
   if(!r.error)referrals=r.data||[];else console.warn('Ambassador live referrals refresh failed',r.error);
   payouts=p.data||[];
   bank=b.data?.[0]||null;
   if(!m.error){const now=Date.now();resources=(m.data||[]).filter(x=>(!x.starts_at||new Date(x.starts_at).getTime()<=now)&&(!x.expires_at||new Date(x.expires_at).getTime()>=now))}else console.warn('Ambassador live resources refresh failed',m.error);
   if(!n.error)notifications=n.data||[];else console.warn('Ambassador live announcements refresh failed',n.error);
   supportTickets=t.data||[];
   const ticketIds=supportTickets.map(x=>x.id);
   if(ticketIds.length){
     const sm=await db.from('ambassador_support_messages').select('id,ticket_id,author_id,author_role,message,created_at').in('ticket_id',ticketIds).order('created_at',{ascending:true});
     if(!sm.error)supportMessages=sm.data||[];else console.warn('Ambassador live support replies refresh failed',sm.error);
   }else supportMessages=[];
   render();
   ambassadorLastRefreshAt=Date.now();
   window.__fundaAmbassadorLastLiveRefresh={reason,at:new Date(ambassadorLastRefreshAt).toISOString()};
   requestAnimationFrame(()=>{if(currentAmbassadorSection()===section)window.scrollTo({top:scrollYBefore,behavior:'auto'})});
 }catch(error){
   console.warn('Ambassador live reconciliation failed',reason,error);
 }finally{
   ambassadorRefreshInFlight=false;
 }
}
function startAmbassadorLiveSync(){
 if(ambassadorLiveStarted||!db||!app)return;
 ambassadorLiveStarted=true;
 const signal=(source)=>scheduleAmbassadorRefresh(source);
 try{
   let ch=db.channel('ambassador-portal-live-v1');
   [
     ['ambassador_programme_applications','id=eq.'+app.id],
     ['ambassador_earnings_ledger','application_id=eq.'+app.id],
     ['ambassador_payouts','application_id=eq.'+app.id]
   ].forEach(([table,filter])=>{ch=ch.on('postgres_changes',{event:'*',schema:'public',table,filter},()=>signal('realtime:'+table))});
   ['ambassador_marketing_resources','ambassador_notifications'].forEach(table=>{ch=ch.on('postgres_changes',{event:'*',schema:'public',table},()=>signal('realtime:'+table))});
   ambassadorLiveChannel=ch.subscribe(status=>{
     window.__fundaAmbassadorRealtimeStatus=status;
     if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('Ambassador Portal Realtime status:',status);
   });
 }catch(error){
   console.warn('Ambassador Portal Realtime could not start',error);
 }
 window.addEventListener('focus',()=>signal('window-focus'));
 window.addEventListener('pageshow',()=>signal('page-show'));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)signal('window-visible')});
 ambassadorRefreshTimer=setInterval(()=>signal('five-minute-reconciliation'),AMBASSADOR_AUTO_REFRESH_MS);
 window.addEventListener('beforeunload',()=>{
   clearTimeout(ambassadorRefreshDebounce);
   clearInterval(ambassadorRefreshTimer);
   if(ambassadorLiveChannel&&db)db.removeChannel(ambassadorLiveChannel);
 });
}

async function init(){
 installNav();
 db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 if(!db)return fail('The Ambassador Portal is temporarily unavailable.');
 user=await restoreAuthUser();
 if(!user)return location.replace('ambassador-login.html?reason=expired&next=ambassador-portal-v2.html&portal=ambassador');
 const binding=await db.rpc('bind_own_ambassador_account');
 if(binding.error)return fail('Your Ambassador account could not be securely linked. Please refresh or contact Ambassador Support.');
 const appColumns='id,auth_user_id,full_name,email,phone,province,country,best_platform,status,agreement_status,agreement_accepted_at,account_status,referral_code,introductory_started_at,introductory_ends_at,updated_at';
 let a=await db.from('ambassador_programme_applications').select(appColumns).eq('auth_user_id',user.id).maybeSingle();
 if(a.error||!a.data)return fail('No Ambassador application is connected to this account.');
 app=a.data;
 if(app.status!=='approved'){
   $('#loading').classList.add('hide');$('#notFound').classList.remove('hide');
   let title=$('#notFound h2'),msg=$('#notFound .muted');
   if(title)title.textContent=app.status==='declined'?'Ambassador application declined':app.status==='waitlisted'?'Ambassador application waitlisted':'Ambassador application under review';
   if(msg)msg.textContent=app.status==='declined'?'Your Ambassador application was not approved. Contact Ambassador Support if you need clarification.':app.status==='waitlisted'?'Your application is on the Ambassador waitlist. You can keep using this login to check for status changes.':'Your application has been received and is still being reviewed. You can keep using this login to check your status.';
   return;
 }
 const agreementState=await db.rpc('get_own_ambassador_agreement_status');
 if(agreementState.error){
   console.error('Current Ambassador agreement status could not be loaded',agreementState.error);
 }else{
   currentAgreement=Array.isArray(agreementState.data)?agreementState.data[0]||null:agreementState.data||null;
 }
 if(app.agreement_status!=='accepted'){
   $('#loading').classList.add('hide');$('#portal').classList.remove('hide');
   $('#sideNav').innerHTML='<button class="navbtn on" data-go="programme">▧ Programme Agreement</button>';
   if($('#mobileNav'))$('#mobileNav').innerHTML='<button class="navbtn on" data-go="programme">▧ Programme Agreement</button>';
   document.querySelectorAll('[data-go="programme"]').forEach(b=>b.onclick=()=>showSection('programme'));
   $('#profileTop').onclick=()=>showSection('programme');
   showSection('programme');renderAgreement();return;
 }
 if(!['introductory','active'].includes(app.account_status)){
   let ac=await db.rpc('activate_own_ambassador_account');
   if(ac.error||ac.data!==true)return fail(ac.error?.message||'Your Ambassador account could not be activated.');
   a=await db.from('ambassador_programme_applications').select(appColumns).eq('auth_user_id',user.id).maybeSingle();
   if(a.error||!a.data)return fail('Your Ambassador account could not be refreshed after activation.');
   app=a.data;
 }
 const [l,r,p,b,m,n,t]=await Promise.all([
   db.rpc('get_own_ambassador_earnings'),
   db.rpc('get_own_ambassador_referrals'),
   db.from('ambassador_payouts').select('id,application_id,amount,payment_reference,payment_date,status,notes,created_at').eq('application_id',app.id).order('created_at',{ascending:false}),
   db.rpc('get_own_ambassador_payout_details'),
   db.from('ambassador_marketing_resources').select('id,title,description,resource_type,file_url,original_filename,mime_type,approved_caption,action_url,status,starts_at,expires_at,created_at').eq('status','active').order('created_at',{ascending:false}),
   db.rpc('get_own_ambassador_announcements'),
   db.from('ambassador_support_tickets').select('id,application_id,subject,category,priority,notes,status,created_at,updated_at').eq('application_id',app.id).order('created_at',{ascending:false})
 ]);
 if(l.error||p.error||b.error||t.error)return fail('Your secure Ambassador records could not be loaded. Please refresh the page.');
 ledger=l.data||[];
 if(r.error){
   console.error('Ambassador referrals failed to load',r.error);
   referrals=[];
 }else referrals=r.data||[];
 payouts=p.data||[];bank=b.data?.[0]||null;{const now=Date.now();resources=(m.data||[]).filter(x=>(!x.starts_at||new Date(x.starts_at).getTime()<=now)&&(!x.expires_at||new Date(x.expires_at).getTime()>=now));}if(n.error)console.error('Ambassador announcements failed to load',n.error);notifications=n.data||[];supportTickets=t.data||[];
 const ticketIds=supportTickets.map(x=>x.id);
 if(ticketIds.length){const sm=await db.from('ambassador_support_messages').select('id,ticket_id,author_id,author_role,message,created_at').in('ticket_id',ticketIds).order('created_at',{ascending:true});if(sm.error)console.error('Ambassador support replies failed to load',sm.error);supportMessages=sm.data||[]}else supportMessages=[];
 $('#loading').classList.add('hide');$('#portal').classList.remove('hide');render();startAmbassadorLiveSync();
 if(r.error){
   const box=$('#referralMobile');
   if(box)box.innerHTML='<div class="notice bad"><b>Referral records could not be loaded.</b><br>Please refresh the page. If this continues, contact Ambassador Support.</div>';
 }
}

function render(){
 ledger=confirmedLedger();
 const life=ledger.filter(x=>x.earning_type==='commission').reduce((s,x)=>s+Number(x.qualifying_revenue||0),0);
 const approvedPaid=['approved','paid'], awaiting=awaitingReferralCount();
 const total=sum(null,approvedPaid), commission=sum('commission',approvedPaid), bonus=sum('achievement_bonus',approvedPaid), performance=sum('monthly_performance',approvedPaid);
 const r=rank(life),idx=ranks.indexOf(r),next=ranks[idx+1];
 $('#welcome').textContent='Welcome, '+(app.full_name||'Ambassador');
 $('#rankLabel').textContent=r.n==='Ambassador'?'AMBASSADOR':r.n.toUpperCase()+' AMBASSADOR';
 $('#accountLine').textContent='Ambassador ID: '+String(app.id).slice(0,8).toUpperCase()+' · Agreement: '+String(app.agreement_status||'not accepted').replaceAll('_',' ');
 $('#accountBadge').textContent=String(app.account_status||'application').replaceAll('_',' ').toUpperCase();
 $('#accountBadge').className='badge '+(['active','introductory'].includes(app.account_status)?'ok':'warn');
 $('#earningBadge').textContent=awaiting>0?'REFERRALS AWAITING APPROVAL':'EARNINGS VERIFIED';
 if($('#sideName'))$('#sideName').textContent=app.full_name||'Ambassador';
 if($('#sideRank'))$('#sideRank').textContent=r.n;
 if($('#sideStatus')){$('#sideStatus').textContent=String(app.account_status||'application').replaceAll('_',' ');$('#sideStatus').className='sideStatus '+(['active','introductory'].includes(app.account_status)?'ok':'warn')}
 if($('#sideApproved'))$('#sideApproved').textContent=money(total);
 if($('#sidePending'))$('#sidePending').textContent=awaiting;
 $('#referralCount').textContent=referrals.filter(x=>low(x.earning_status)!=='disqualified').length;$('#totalEarned').textContent=money(total);$('#pendingEarned').textContent=awaiting;
 if($('#commissionTotal'))$('#commissionTotal').textContent=money(commission);if($('#bonusTotal'))$('#bonusTotal').textContent=money(bonus);if($('#performanceTotal'))$('#performanceTotal').textContent=money(performance);
 $('#statusCommission').textContent=money(commission);$('#statusBonus').textContent=money(bonus);$('#statusPerformance').textContent=money(performance);
 $('#earnSummary').textContent=money(total)+' confirmed earnings · '+money(payouts.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.amount||0),0))+' paid out to date. Unconfirmed referrals never appear as money in your earnings ledger.';
 $('#codeText').textContent=app.referral_code||'Referral code pending activation';
 $('#referralLinkText').textContent=referralLink()||'Your referral link will appear once your code is issued.';
 $('#copyCode').disabled=!app.referral_code;$('#copyLink').disabled=!app.referral_code;
 $('#copyCode').onclick=()=>copy(app.referral_code,$('#copyCode'));$('#copyLink').onclick=()=>copy(referralLink(),$('#copyLink'));
 if(next){let remain=Math.max(0,next.min-life),pct=Math.max(0,Math.min(100,(life-r.min)/(next.min-r.min)*100));$('#nextRank').textContent='Current rank: '+r.n+'. '+money(remain)+' more lifetime qualifying revenue to reach '+next.n+'.';$('#progressBar').style.width=pct+'%'}else{$('#nextRank').textContent='Elite rank achieved.';$('#progressBar').style.width='100%'}
 $('#monthlyTarget').textContent=r.pay?'Monthly Performance Payment eligibility at this rank: up to '+money(r.pay)+', subject to monthly performance verification.':'Monthly Performance Payments begin at Gold / Level 4.';
 renderPerformanceOverview(total,commission,bonus,performance,life,r,next,awaiting);
 renderDashboardTrend();
 renderAmbassadorCalendar();
 arrangeDashboard();
 document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showSection(b.dataset.go));const qcl=$('#quickCopyLink');if(qcl)qcl.onclick=()=>copy(referralLink(),qcl);renderReferrals();renderLedger();renderPayouts();renderProfile();renderAgreement();renderSupportHub();renderRecentActivity();renderRankProgress();renderReferralAccount();
}

function renderReferralAccount(){
 const code=app?.referral_code||'';
 const url=referralLink();
 if($('#accountReferralCode'))$('#accountReferralCode').textContent=code||'Not issued yet';
 if($('#accountReferralUrl'))$('#accountReferralUrl').textContent=code?url:'Your tracked referral link will appear here once a code is issued.';
 const cc=$('#accountCopyCode'),cl=$('#accountCopyLink');
 if(cc)cc.onclick=()=>code?copy(code,cc):null;
 if(cl)cl.onclick=()=>code?copy(url,cl):null;
}
function renderRankProgress(){
 const life=confirmedLedger().filter(x=>x.earning_type==='commission').reduce((s,x)=>s+Number(x.qualifying_revenue||0),0);
 const current=rank(life),idx=ranks.indexOf(current),next=ranks[idx+1];
 if($('#rankCurrentBadge'))$('#rankCurrentBadge').textContent=current.n.toUpperCase();
 if($('#rankLifetime'))$('#rankLifetime').textContent=money(life);
 if($('#rankNext'))$('#rankNext').textContent=next?next.n:'Elite achieved';
 if($('#rankRemaining'))$('#rankRemaining').textContent=next?money(Math.max(0,next.min-life)):'R0';
 let pct=next?Math.max(0,Math.min(100,(life-current.min)/(next.min-current.min)*100)):100;
 if($('#rankProgressFill'))$('#rankProgressFill').style.width=pct+'%';
 if($('#rankProgressText'))$('#rankProgressText').textContent=next?money(Math.max(0,next.min-life))+' more verified lifetime qualifying revenue to reach '+next.n+'.':'You have reached the highest published Ambassador rank.';
 const path=$('#rankPath');if(path)path.innerHTML=ranks.map((r,i)=>{let state=i<idx?'done':i===idx?'current':'';let threshold=r.min===0?'Starting rank':money(r.min)+' lifetime qualifying revenue';return '<div class="rankStep '+state+'"><div class="rankStepIcon">'+(i<idx?'✓':i===idx?'●':String(i+1))+'</div><div class="rankStepText"><b>'+esc(r.n)+'</b><span>'+threshold+'</span></div><div class="rankStepValue">'+(r.pay?'Up to '+money(r.pay)+'/month':i<3?'Rank milestone':'—')+'</div></div>'}).join('');
 const monthly=$('#rankMonthly');if(monthly){monthly.className='notice '+(current.pay?'ok':'gold');monthly.innerHTML=current.pay?'<b>'+esc(current.n)+' eligibility: up to '+money(current.pay)+' per qualifying month.</b><br>Payment remains subject to the programme\'s monthly performance verification and other applicable rules.':'<b>Monthly Performance Payments begin at Gold / Level 4.</b><br>Your current rank is '+esc(current.n)+'. Continue building verified direct student referral revenue to progress.'}
}
function renderRecentActivity(){
 const box=$('#recentActivity');if(!box)return;
 const items=[];
 referrals.slice(0,3).forEach(x=>items.push({date:x.referral_date,icon:'◎',title:'Referral recorded',detail:(x.student_display||'Student')+' · '+(x.course_title||'Course'),amount:low(x.earning_status)==='confirmed'?money(x.earning_amount):''}));
 confirmedLedger().slice(0,3).forEach(x=>items.push({date:x.created_at||x.earning_month,icon:'R',title:String(x.earning_type||'earning').replaceAll('_',' '),detail:String(x.earning_status||'approved').replaceAll('_',' '),amount:money(x.commission_amount)}));
 payouts.slice(0,2).forEach(x=>items.push({date:x.payment_date||x.created_at,icon:'▤',title:'Payment '+String(x.status||'recorded').replaceAll('_',' '),detail:x.payment_reference||'Ambassador payout',amount:money(x.amount)}));
 items.sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
 box.innerHTML=items.length?items.slice(0,5).map(x=>'<div class="activityItem"><div class="activityIcon">'+esc(x.icon)+'</div><div class="activityText"><b>'+esc(x.title)+'</b><span>'+esc(x.detail)+' · '+fmt(x.date)+'</span></div><div class="activityAmt">'+esc(x.amount)+'</div></div>').join(''):'<div class="empty">No recent Ambassador activity yet.</div>';
}
function renderReferrals(){
 const total=referrals.length;
 const approved=referrals.filter(x=>low(x.earning_status)==='confirmed').length;
 const pending=awaitingReferralCount();
 const earned=referrals.reduce((n,x)=>n+Number(x.earning_amount||0),0);
 if($('#refTotal'))$('#refTotal').textContent=total;
 if($('#refApproved'))$('#refApproved').textContent=approved;
 if($('#refPending'))$('#refPending').textContent=pending;
 if($('#refEarnings'))$('#refEarnings').textContent=money(earned);

 const search=$('#refSearch'),status=$('#refStatus'),copyBtn=$('#refCopyLink');
 const prevBtn=$('#referralPrev'),nextBtn=$('#referralNext');
 if(copyBtn)copyBtn.onclick=()=>copy(referralLink(),copyBtn);

 const paint=()=>{
   const q=low(search?.value||''),st=low(status?.value||'');
   const filtered=referrals.filter(x=>
     (!q||low(x.student_display).includes(q)||low(x.course_title).includes(q)) &&
     (!st||low(x.referral_status).includes(st)||low(x.earning_status).includes(st))
   );

   const pages=Math.max(1,Math.ceil(filtered.length/REFERRALS_PER_PAGE));
   referralPage=Math.min(Math.max(1,referralPage),pages);
   const offset=(referralPage-1)*REFERRALS_PER_PAGE;
   const rows=filtered.slice(offset,offset+REFERRALS_PER_PAGE);

   const body=$('#referralBody');
   if(body)body.innerHTML=rows.length
     ?rows.map(x=>'<tr><td>'+esc(x.student_display)+'</td><td>'+esc(x.course_title)+'</td><td>'+fmt(x.referral_date)+'</td><td>'+badgeStatus(x.referral_status)+'</td><td>'+badgeStatus(x.earning_status)+'</td><td>'+money(x.earning_amount)+'</td></tr>').join('')
     :'<tr><td colspan="6" class="empty">'+(referrals.length?'No referrals match this filter.':'No referrals have been attributed to your code yet.')+'</td></tr>';

   const mobile=$('#referralMobile');
   if(mobile)mobile.innerHTML=rows.length
     ?rows.map(x=>'<article class="refCard"><div class="refCardTop"><div><b>'+esc(x.student_display||'Student')+'</b><small>'+esc(x.course_title||'Course')+'</small></div><b class="refCardAmt">'+money(x.earning_amount)+'</b></div><div class="refCardMeta">'+badgeStatus(x.referral_status)+badgeStatus(x.earning_status)+'</div><div class="refCardDate">Referral recorded · '+fmt(x.referral_date)+'</div></article>').join('')
     :'<div class="empty">'+(referrals.length?'No referrals match this filter.':'No referrals have been attributed to your code yet.')+'</div>';

   const from=filtered.length?offset+1:0;
   const to=Math.min(offset+REFERRALS_PER_PAGE,filtered.length);
   const summary=$('#referralPageSummary'),count=$('#referralPageCount');
   if(summary)summary.textContent=filtered.length?('Showing '+from+'–'+to+' of '+filtered.length+' referrals'):'Showing 0 referrals';
   if(count)count.textContent='Page '+referralPage+' of '+pages;
   if(prevBtn)prevBtn.disabled=referralPage<=1||!filtered.length;
   if(nextBtn)nextBtn.disabled=referralPage>=pages||!filtered.length;
 };

 if(search)search.oninput=()=>{referralPage=1;paint()};
 if(status)status.onchange=()=>{referralPage=1;paint()};
 if(prevBtn)prevBtn.onclick=()=>{if(referralPage>1){referralPage-=1;paint();document.querySelector('[data-section="referrals"] .referralTools')?.scrollIntoView({behavior:'smooth',block:'start'})}};
 if(nextBtn)nextBtn.onclick=()=>{const q=low(search?.value||''),st=low(status?.value||'');const filtered=referrals.filter(x=>(!q||low(x.student_display).includes(q)||low(x.course_title).includes(q))&&(!st||low(x.referral_status).includes(st)||low(x.earning_status).includes(st)));const pages=Math.max(1,Math.ceil(filtered.length/REFERRALS_PER_PAGE));if(referralPage<pages){referralPage+=1;paint();document.querySelector('[data-section="referrals"] .referralTools')?.scrollIntoView({behavior:'smooth',block:'start'})}};
 paint();
}
function renderLedger(){
 const approvedStatuses=['approved','paid'];
 const approved=sum(null,approvedStatuses), paidOut=payouts.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.amount||0),0), commission=sum('commission',approvedStatuses), other=sum('achievement_bonus',approvedStatuses)+sum('monthly_performance',approvedStatuses);
 if($('#earnApproved'))$('#earnApproved').textContent=money(approved);
 if($('#earnPaidOut'))$('#earnPaidOut').textContent=money(paidOut);
 if($('#earnCommission'))$('#earnCommission').textContent=money(commission);
 if($('#earnOther'))$('#earnOther').textContent=money(other);
 const search=$('#earnSearch'),status=$('#earnStatus');
 const paint=()=>{
   const q=low(search?.value||''),st=low(status?.value||'');
   const rows=confirmedLedger().filter(x=>(!q||low(x.earning_type).replaceAll('_',' ').includes(q))&&(!st||low(x.earning_status).includes(st)));
   $('#ledgerBody').innerHTML=rows.length?rows.map(x=>'<tr><td>'+fmt(x.earning_month)+'</td><td>'+esc(String(x.earning_type).replaceAll('_',' '))+'</td><td>'+money(x.qualifying_revenue)+'</td><td>'+(Number(x.commission_rate||0)*100).toFixed(0)+'%</td><td>'+money(x.commission_amount)+'</td><td>'+badgeStatus(x.earning_status)+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">'+(ledger.length?'No earnings match this filter.':'No earnings have been recorded yet.')+'</td></tr>';
   const mobile=$('#earningsMobile');if(mobile)mobile.innerHTML=rows.length?rows.map(x=>'<article class="refCard"><div class="refCardTop"><div><div class="earnType">'+esc(String(x.earning_type||'earning').replaceAll('_',' '))+'</div><div class="earnMeta">'+fmt(x.earning_month)+' · Qualifying revenue '+money(x.qualifying_revenue)+'</div></div><b class="refCardAmt">'+money(x.commission_amount)+'</b></div><div class="refCardMeta">'+badgeStatus(x.earning_status)+'</div><div class="earnRate">Rate: '+(Number(x.commission_rate||0)*100).toFixed(0)+'%</div></article>').join(''):'<div class="empty">'+(ledger.length?'No earnings match this filter.':'No earnings have been recorded yet.')+'</div>';
 };
 if(search)search.oninput=paint;if(status)status.onchange=paint;paint();
}
function renderPayouts(){
 installBankOptions();
 const paid=payouts.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.amount||0),0),scheduled=payouts.filter(x=>['scheduled','processing'].includes(x.status)).reduce((s,x)=>s+Number(x.amount||0),0);
 if($('#paidTotal'))$('#paidTotal').textContent=money(paid);if($('#scheduledTotal'))$('#scheduledTotal').textContent=money(scheduled);
 if($('#paymentCount'))$('#paymentCount').textContent=payouts.length;
 const latest=[...payouts].sort((a,b)=>new Date(b.payment_date||b.created_at||0)-new Date(a.payment_date||a.created_at||0))[0];
 if($('#latestPayment'))$('#latestPayment').textContent=latest?money(latest.amount):'—';
 if($('#payoutBody'))$('#payoutBody').innerHTML=payouts.length?payouts.map(x=>'<tr><td>'+fmt(x.payment_date||x.created_at)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.payment_reference||'—')+'</td><td>'+badgeStatus(x.status)+'</td></tr>').join(''):'<tr><td colspan="4" class="empty">No payments recorded yet.</td></tr>';
 const mobile=$('#payoutMobile');if(mobile)mobile.innerHTML=payouts.length?payouts.map(x=>'<article class="refCard"><div class="refCardTop"><div><b>'+fmt(x.payment_date||x.created_at)+'</b><div class="paymentRef">'+esc(x.payment_reference||'No payment reference')+'</div></div><b class="refCardAmt">'+money(x.amount)+'</b></div><div class="refCardMeta">'+badgeStatus(x.status)+'</div></article>').join(''):'<div class="empty">No payments recorded yet.</div>';
 if(bank){let tail=String(bank.account_last4||'');$('#bankStatus').className='notice '+(bank.verification_status==='verified'?'ok':'gold');$('#bankStatus').textContent='Banking details '+String(bank.verification_status).replaceAll('_',' ')+' · '+bank.bank_name+' · Account ending •••• '+tail;$('#accountHolder').value=bank.account_holder||'';let bs=$('#bankName'),known=saBanks.some(x=>x.name===bank.bank_name&&x.name!=='Other South African Bank');$('#bankName').value=known?bank.bank_name:'Other South African Bank';$('#accountType').value=bank.account_type||'';$('#bankName').dispatchEvent(new Event('change'));if(!known&&$('#otherBankName'))$('#otherBankName').value=bank.bank_name||'';let selected=$('#bankName')?.selectedOptions?.[0],autoCode=selected?.dataset?.code||'';$('#branchCode').readOnly=!!autoCode&&known;$('#branchCode').value=autoCode||bank.branch_code||'';$('#accountNumber').value=''}else{$('#bankStatus').className='notice gold';$('#bankStatus').textContent='No banking details on file. Add your payment account below.'}
 $('#bankForm').onsubmit=saveBank;
}
async function saveBank(e){
 e.preventDefault();let btn=$('#saveBank'),msg=$('#bankMsg'),num=$('#accountNumber').value.trim();
 if(bank&&!num){msg.textContent='For security, re-enter the full account number when updating banking details.';return}
 btn.disabled=true;btn.textContent='Saving securely…';msg.textContent='';
 if(!$('#bankName').value){msg.textContent='Please select your bank.';btn.disabled=false;btn.textContent='Save / Update Banking Details';return}let selectedBank=$('#bankName').value,bankName=selectedBank==='Other South African Bank'?($('#otherBankName')?.value.trim()||''):selectedBank;if(selectedBank==='Other South African Bank'&&!bankName){msg.textContent='Please enter the bank name.';btn.disabled=false;btn.textContent='Save / Update Banking Details';return}if(!$('#branchCode').value.trim()){msg.textContent='Please enter the branch code for the selected bank.';btn.disabled=false;btn.textContent='Save / Update Banking Details';return}let q=await db.rpc('submit_own_ambassador_payout_details',{p_account_holder:$('#accountHolder').value.trim(),p_bank_name:bankName,p_account_number:num,p_account_type:$('#accountType').value,p_branch_code:$('#branchCode').value.trim()});
 if(q.error){msg.textContent=q.error.message}else{msg.textContent='Banking details saved. Finance verification is now pending.';let b=await db.rpc('get_own_ambassador_payout_details');bank=b.data?.[0]||null;renderPayouts()}
 btn.disabled=false;btn.textContent='Save / Update Banking Details';
}
function renderProfile(){
 $('#profileName').value=app.full_name||'';$('#profileEmail').value=app.email||'';$('#profilePhone').value=app.phone||'';$('#profileProvince').value=app.province||'';$('#profileCountry').value=app.country||'South Africa';$('#profilePlatform').value=app.best_platform||'';
 $('#profileMeta').innerHTML='<b>Status:</b> '+esc(app.account_status||'application')+' · <b>Approved application:</b> '+fmt(app.updated_at)+' · <b>Referral code:</b> '+esc(app.referral_code||'pending');
 $('#profileForm').onsubmit=saveProfile;
}
async function saveProfile(e){
 e.preventDefault();let b=$('#saveProfile'),m=$('#profileMsg');b.disabled=true;b.textContent='Saving…';m.textContent='';
 let q=await db.rpc('update_own_ambassador_profile',{p_phone:$('#profilePhone').value.trim(),p_province:$('#profileProvince').value.trim(),p_country:$('#profileCountry').value.trim(),p_best_platform:$('#profilePlatform').value.trim()});
 if(q.error)m.textContent=q.error.message;else{m.textContent='Your Ambassador contact profile has been updated.';app.phone=$('#profilePhone').value.trim();app.province=$('#profileProvince').value.trim();app.country=$('#profileCountry').value.trim();app.best_platform=$('#profilePlatform').value.trim()}
 b.disabled=false;b.textContent='Update My Contact Profile';
}
function currentAgreementRules(){
 const rules=Array.isArray(currentAgreement?.house_rules)?currentAgreement.house_rules:[];
 return rules.length?'<ul style="margin:8px 0 0 18px">'+rules.map(x=>'<li style="margin:5px 0">'+esc(x)+'</li>').join('')+'</ul>':'';
}
function renderAgreement(){
 const a=$('#agreementAction');if(!a)return;
 const currentVersion=currentAgreement?.version||null,currentAccepted=!!currentAgreement?.accepted;
 if($('#agreementStatusText'))$('#agreementStatusText').textContent=currentAccepted?'CURRENT VERSION ACCEPTED':String(app.agreement_status||'not accepted').replaceAll('_',' ').toUpperCase();
 if($('#agreementAcceptedDate'))$('#agreementAcceptedDate').textContent=currentAccepted?fmt(currentAgreement.accepted_at):(app.agreement_accepted_at?fmt(app.agreement_accepted_at):'NOT YET');
 if($('#programmeStatusText'))$('#programmeStatusText').textContent=String(app.account_status||'application').replaceAll('_',' ').toUpperCase();
 if($('#agreementVersionText'))$('#agreementVersionText').textContent=currentVersion?'VERSION '+String(currentVersion).toUpperCase():(app.agreement_status==='accepted'?'LEGACY RECORD':'CURRENT AGREEMENT');
 if($('#agreementStanding')){$('#agreementStanding').textContent=['active','introductory'].includes(app.account_status)?'GOOD STANDING':String(app.account_status||'REVIEW').replaceAll('_',' ').toUpperCase();$('#agreementStanding').className='badge '+(['active','introductory'].includes(app.account_status)?'ok':'warn')}

 if(currentAgreement&&currentAccepted){
   a.innerHTML='<div class="notice ok"><b>Current agreement version accepted ✓</b><br>Version '+esc(currentVersion)+' was accepted on '+fmt(currentAgreement.accepted_at)+'. This version-specific acceptance is recorded securely against the exact agreement version and content hash.</div>';
   return;
 }

 if(currentAgreement&&!currentAccepted){
   const historic=app.agreement_status==='accepted'&&app.agreement_accepted_at?'<div class="notice ok" style="margin-top:10px"><b>Historical acceptance preserved</b><br>Your earlier Ambassador agreement acceptance from '+fmt(app.agreement_accepted_at)+' remains on record. It has not been overwritten or treated as acceptance of Version '+esc(currentVersion)+'.</div>':'';
   a.innerHTML='<div class="notice gold"><b>Current agreement version requires your acceptance</b><br>Please review Version '+esc(currentVersion)+' before accepting it. Your existing Ambassador access and historical acceptance remain preserved while you review this version.</div>'+historic+
   '<details class="agreement" style="margin-top:12px"><summary style="cursor:pointer;font-weight:900">Review '+esc(currentAgreement.title||'current Ambassador Programme Agreement')+' · Version '+esc(currentVersion)+'</summary><div style="white-space:pre-wrap;margin-top:12px;line-height:1.65">'+esc(currentAgreement.agreement_text||'')+'</div>'+currentAgreementRules()+'</details>'+
   '<label class="row" style="margin-top:12px"><input id="acceptCheck" type="checkbox"> <span class="muted">I confirm that I have read, understood and agree to Version '+esc(currentVersion)+' of the Funda Online Academy Ambassador Programme Agreement & Terms.</span></label><button id="acceptAgreement" class="btn gold" style="margin-top:10px" disabled>Accept Version '+esc(currentVersion)+'</button><div id="agreementMsg" class="muted"></div>';
   $('#acceptCheck').onchange=e=>$('#acceptAgreement').disabled=!e.target.checked;
   $('#acceptAgreement').onclick=acceptAgreement;
   return;
 }

 if(app.agreement_status==='accepted'){
   a.innerHTML='<div class="notice ok"><b>Historical agreement acceptance preserved ✓</b><br>Accepted on '+fmt(app.agreement_accepted_at)+'.</div><p class="muted" style="margin-top:10px">The current version record could not be loaded right now. Your existing Ambassador access has not been changed. Refresh later to check the current agreement version.</p>';
   return;
 }

 a.innerHTML='<div class="notice gold"><b>Agreement acceptance required</b><br>The current Ambassador Programme Agreement could not be loaded. Please refresh before accepting.</div>';
}
async function acceptAgreement(){
 let m=$('#agreementMsg');if(!m)return;
 if(!$('#acceptCheck')?.checked){m.textContent='Please confirm that you have read and accept the current agreement version.';return}
 let b=$('#acceptAgreement');b.disabled=true;b.textContent='Recording acceptance…';
 let q=await db.rpc('accept_own_ambassador_agreement');
 if(q.error||q.data!==true){m.textContent=q.error?.message||'Agreement could not be accepted.';b.disabled=false;b.textContent='Accept Agreement';return}
 if(!['introductory','active'].includes(app.account_status)){
   b.textContent='Activating account…';
   let ac=await db.rpc('activate_own_ambassador_account');
   if(ac.error||ac.data!==true){m.textContent=ac.error?.message||'Agreement accepted, but account activation could not be completed.';b.disabled=false;b.textContent='Try Activation Again';return}
 }
 const refreshed=await db.rpc('get_own_ambassador_agreement_status');
 if(!refreshed.error)currentAgreement=Array.isArray(refreshed.data)?refreshed.data[0]||null:refreshed.data||null;
 m.textContent='Current Ambassador Programme Agreement version accepted and recorded securely.';
 setTimeout(()=>location.reload(),700);
}

function marketingFileIcon(resource){
 const mime=low(resource?.mime_type||'');
 if(mime.includes('pdf'))return 'PDF';
 if(mime.includes('video'))return '▶';
 if(mime.includes('image'))return '▧';
 return 'FILE';
}
function closeMarketingPreview(){
 const modal=$('#ambMarketingPreview');
 if(modal)modal.remove();
 document.body.style.overflow='';
}
function openMarketingPreview(id){
 const x=resources.find(r=>String(r.id)===String(id));if(!x)return;
 closeMarketingPreview();
 const mime=low(x.mime_type||'');
 let media='<div class="resourceFileIcon">'+esc(marketingFileIcon(x))+'</div>';
 if(x.file_url&&mime.startsWith('image/'))media='<img src="'+esc(x.file_url)+'" alt="'+esc(x.title||'Marketing resource')+'">';
 else if(x.file_url&&mime==='application/pdf')media='<iframe src="'+esc(x.file_url)+'" title="'+esc(x.title||'Marketing resource')+'"></iframe>';
 else if(x.file_url&&mime.startsWith('video/'))media='<video controls preload="metadata" src="'+esc(x.file_url)+'"></video>';

 const html='<div id="ambMarketingPreview" role="dialog" aria-modal="true" aria-labelledby="ambMarketingPreviewTitle">'+
  '<div class="marketingPreviewShell">'+
   '<div class="marketingPreviewHead"><b id="ambMarketingPreviewTitle">'+esc(x.title||'Marketing Resource')+'</b><button id="ambMarketingPreviewClose" class="marketingPreviewClose" type="button">Close</button></div>'+
   '<div class="marketingPreviewMedia">'+media+'</div>'+
   '<div class="marketingPreviewInfo"><h3>'+esc(x.title||'Marketing Resource')+'</h3>'+
    '<p>'+esc(x.description||'Official Funda Online Academy marketing resource.')+'</p>'+
    (x.expires_at?'<p><b>Available until:</b> '+esc(fmt(x.expires_at))+'</p>':'')+
    (x.approved_caption?'<div class="marketingPreviewCaption"><b>Approved caption</b><span>'+esc(x.approved_caption)+'</span></div>':'')+
    '<div class="marketingPreviewActions">'+
     (x.file_url?'<button class="btn" type="button" id="ambMarketingPreviewDownload">Download</button>':'')+
     (x.file_url?'<a class="btn alt" href="'+esc(x.file_url)+'" target="_blank" rel="noopener">Open Original</a>':'')+
     (x.approved_caption?'<button class="btn alt" type="button" id="ambMarketingPreviewCaption">Copy Approved Caption</button>':'')+
     (x.action_url?'<a class="btn alt" href="'+esc(x.action_url)+'" target="_blank" rel="noopener">Open Campaign Link</a>':'')+
     '<button class="btn alt" type="button" id="ambMarketingPreviewReferral">Copy My Referral Link</button>'+
    '</div>'+
   '</div>'+
  '</div>'+
 '</div>';
 document.body.insertAdjacentHTML('beforeend',html);
 document.body.style.overflow='hidden';
 $('#ambMarketingPreviewClose').onclick=closeMarketingPreview;
 $('#ambMarketingPreview').onclick=e=>{if(e.target.id==='ambMarketingPreview')closeMarketingPreview()};
 $('#ambMarketingPreview').onkeydown=e=>{if(e.key==='Escape')closeMarketingPreview()};
 if($('#ambMarketingPreviewDownload'))$('#ambMarketingPreviewDownload').onclick=()=>downloadResource(x,$('#ambMarketingPreviewDownload'));
 if($('#ambMarketingPreviewCaption'))$('#ambMarketingPreviewCaption').onclick=()=>copy(x.approved_caption,$('#ambMarketingPreviewCaption'));
 if($('#ambMarketingPreviewReferral'))$('#ambMarketingPreviewReferral').onclick=()=>copy(referralLink(),$('#ambMarketingPreviewReferral'));
 setTimeout(()=>$('#ambMarketingPreviewClose')?.focus(),0);
}
function renderMarketingLibrary(){
 const mr=$('#marketingResources');
 if(!mr)return;
 const pages=Math.max(1,Math.ceil(resources.length/MARKETING_RESOURCES_PER_PAGE));
 marketingPage=Math.min(Math.max(1,marketingPage),pages);
 const offset=(marketingPage-1)*MARKETING_RESOURCES_PER_PAGE;
 const pageRows=resources.slice(offset,offset+MARKETING_RESOURCES_PER_PAGE);

 mr.innerHTML=pageRows.length?pageRows.map(x=>{
   const mime=low(x.mime_type||''),image=x.file_url&&mime.startsWith('image/');
   return '<article class="marketingResourceCard">'+
     '<div class="marketingResourceThumb">'+
       (image?'<img src="'+esc(x.file_url)+'" alt="'+esc(x.title||'Marketing resource')+'" loading="lazy">':'<span class="resourceFileIcon">'+esc(marketingFileIcon(x))+'</span>')+
       '<span class="marketingResourceType">'+esc(String(x.resource_type||'RESOURCE').toUpperCase())+'</span>'+
     '</div>'+
     '<div class="marketingResourceBody">'+
       '<h3>'+esc(x.title||'Marketing Resource')+'</h3>'+
       '<span class="marketingResourceMeta">'+(x.expires_at?'EXPIRES '+esc(fmt(x.expires_at)):'CURRENT ACADEMY RESOURCE')+'</span>'+
       '<p>'+esc(x.description||'Official Funda Online Academy marketing material.')+'</p>'+
       '<div class="marketingResourceActions">'+
         '<button class="btn" type="button" data-marketing-preview="'+esc(x.id)+'">Preview & Details</button>'+
         (x.file_url?'<button class="btn alt" type="button" data-download-resource="'+esc(x.id)+'">Download</button>':'')+
       '</div>'+
     '</div>'+
   '</article>';
 }).join(''):'<div class="empty">No Ambassador marketing resources are published yet.</div>';

 if($('#marketingResourceCount'))$('#marketingResourceCount').textContent=resources.length+' RESOURCE'+(resources.length===1?'':'S');
 const summary=$('#marketingPageSummary'),count=$('#marketingPageCount'),prev=$('#marketingPrev'),next=$('#marketingNext');
 const from=resources.length?offset+1:0,to=Math.min(offset+MARKETING_RESOURCES_PER_PAGE,resources.length);
 if(summary)summary.textContent=resources.length?'Showing '+from+'–'+to+' of '+resources.length+' resources':'Showing 0 resources';
 if(count)count.textContent='Page '+marketingPage+' of '+pages;
 if(prev)prev.disabled=marketingPage<=1||!resources.length;
 if(next)next.disabled=marketingPage>=pages||!resources.length;
 if(prev)prev.onclick=()=>{if(marketingPage>1){marketingPage--;renderMarketingLibrary();document.querySelector('.marketingLibraryCard')?.scrollIntoView({behavior:'smooth',block:'start'})}};
 if(next)next.onclick=()=>{if(marketingPage<pages){marketingPage++;renderMarketingLibrary();document.querySelector('.marketingLibraryCard')?.scrollIntoView({behavior:'smooth',block:'start'})}};
 document.querySelectorAll('[data-marketing-preview]').forEach(b=>b.onclick=()=>openMarketingPreview(b.dataset.marketingPreview));
 document.querySelectorAll('[data-download-resource]').forEach(b=>b.onclick=()=>{let x=resources.find(r=>String(r.id)===String(b.dataset.downloadResource));if(x)downloadResource(x,b)});
}
function renderSupportHub(){
 const al=$('#announcementList'),tl=$('#supportTicketList');
 renderMarketingLibrary();
 if($('#announcementCount'))$('#announcementCount').textContent=notifications.length+' UPDATE'+(notifications.length===1?'':'S');
 if(al)al.innerHTML=notifications.length?notifications.map(x=>{
   const dept=x.sender_department||'Administration',name=x.sender_name||'Funda Online Academy',title=x.sender_title||'';
   const from=dept.toLowerCase()==='administration'&&title.toLowerCase().includes('administrator')?'Funda Online Academy Administration':dept;
   return '<article class="announcementCard '+(x.pinned?'pinnedAnnouncement':'')+'"><div class="announcementTop"><div><b>'+esc(x.title)+'</b><span class="meta">'+esc(String(x.category||'programme').toUpperCase())+' · '+fmt(x.created_at)+'</span></div>'+(x.pinned?'<span class="badge warn">PINNED</span>':'')+'</div><div class="announcementFrom"><span>FROM</span><strong>'+esc(from)+'</strong><small>'+esc(name)+(title?' · '+esc(title):'')+'</small></div><p class="announcementMessage">'+esc(x.message)+'</p><div class="announcementScope">'+esc(x.audience==='all_funda'?'EVERYONE IN FUNDA':x.audience==='ambassadors'||x.audience==='all_ambassadors'?'ALL AMBASSADORS':x.audience==='individual_ambassador'?'DIRECT TO YOU':'AMBASSADOR NOTICE')+(x.priority&&x.priority!=='normal'?' · '+esc(String(x.priority).toUpperCase()):'')+'</div></article>'
 }).join(''):'<div class="empty">No Ambassador announcements have been published yet.</div>';
 if(tl)tl.innerHTML=supportTickets.length?supportTickets.map(t=>'<article class="ticketCard"><b>'+esc(t.subject)+'</b><span class="meta">'+esc(t.category)+' · '+fmt(t.created_at)+' · '+esc(String(t.status).replaceAll('_',' ').toUpperCase())+'</span><p>'+esc(t.notes||'')+'</p><button class="btn alt" data-support-view="'+t.id+'">View / Reply</button></article>').join(''):'<div class="empty">No Ambassador support tickets yet.</div>';
 document.querySelectorAll('[data-support-view]').forEach(b=>b.onclick=()=>openSupportTicket(b.dataset.supportView));
 if($('#newSupportTicket'))$('#newSupportTicket').onclick=openNewSupportTicket;
}
function supportModal(html){document.getElementById('ambSupportModal')?.remove();document.body.insertAdjacentHTML('beforeend','<div id="ambSupportModal" style="position:fixed;inset:0;background:#07172fcc;z-index:9999;display:grid;place-items:center;padding:14px"><div class="card" style="width:min(680px,96vw);max-height:92vh;overflow:auto;margin:0">'+html+'</div></div>')}
function openNewSupportTicket(){
 supportModal('<div class="row" style="justify-content:space-between"><h2>Log Ambassador Support Ticket</h2><button class="btn alt" id="ambSupportClose">Close</button></div><form id="ambSupportForm" class="form"><select id="ambSupportCat" class="field"><option>Referral</option><option>Commission</option><option>Achievement Bonus</option><option>Monthly Performance Payment</option><option>Payout / Banking</option><option>Marketing</option><option>Account / Profile</option><option>General</option></select><select id="ambSupportPriority" class="field"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select><input id="ambSupportSubject" class="field wide" required placeholder="Subject"><textarea id="ambSupportNotes" class="field wide" required style="min-height:120px" placeholder="Explain your query"></textarea><button class="btn wide">Submit Ticket</button></form><div id="ambSupportMsg" class="muted"></div>');
 $('#ambSupportClose').onclick=()=>$('#ambSupportModal').remove();$('#ambSupportForm').onsubmit=submitSupportTicket;
}
async function submitSupportTicket(e){
 e.preventDefault();let q=await db.from('ambassador_support_tickets').insert({application_id:app.id,subject:$('#ambSupportSubject').value.trim(),category:$('#ambSupportCat').value,priority:$('#ambSupportPriority').value,notes:$('#ambSupportNotes').value.trim(),status:'open'}).select().single();
 if(q.error){$('#ambSupportMsg').textContent=q.error.message;return}
 $('#ambSupportModal').remove();let t=await db.from('ambassador_support_tickets').select('id,application_id,subject,category,priority,notes,status,created_at,updated_at').eq('application_id',app.id).order('created_at',{ascending:false});supportTickets=t.data||[];renderSupportHub();
}
function openSupportTicket(id){
 let t=supportTickets.find(x=>x.id===id);if(!t)return;let msgs=supportMessages.filter(x=>x.ticket_id===id),closed=['resolved','closed'].includes(t.status);
 supportModal('<div class="row" style="justify-content:space-between"><div><h2>'+esc(t.subject)+'</h2><p class="muted">'+esc(t.category)+' · '+fmt(t.created_at)+' · '+esc(t.status.replaceAll('_',' '))+'</p></div><button class="btn alt" id="ambSupportClose">Close</button></div><div class="notice">'+esc(t.notes)+'</div><div style="margin-top:12px">'+(msgs.length?msgs.map(m=>'<div class="earning" style="margin-bottom:8px"><span>'+(m.author_role==='ambassador'?'YOU':'FUNDA SUPPORT')+' · '+fmt(m.created_at)+'</span><p class="muted">'+esc(m.message)+'</p></div>').join(''):'<div class="empty">No replies yet.</div>')+'</div>'+(closed?'<div class="notice ok">This ticket is '+esc(t.status)+'.</div>':'<form id="ambSupportReplyForm" class="form"><textarea id="ambSupportReply" class="field wide" required style="min-height:90px" placeholder="Add a reply"></textarea><button class="btn wide">Send Reply</button></form>'));
 $('#ambSupportClose').onclick=()=>$('#ambSupportModal').remove();if(!closed)$('#ambSupportReplyForm').onsubmit=e=>replySupport(e,id);
}
async function replySupport(e,id){
 e.preventDefault();let text=$('#ambSupportReply').value.trim();if(!text)return;let q=await db.from('ambassador_support_messages').insert({ticket_id:id,author_id:user.id,author_role:'ambassador',message:text});if(q.error)return alert(q.error.message);let sm=await db.from('ambassador_support_messages').select('id,ticket_id,author_id,author_role,message,created_at').eq('ticket_id',id).order('created_at',{ascending:true});supportMessages=supportMessages.filter(x=>x.ticket_id!==id).concat(sm.data||[]);openSupportTicket(id);
}

$('#logout').onclick=async()=>{if(db)await db.auth.signOut({scope:'local'});location.href='ambassador-login.html'};
const startPortal=()=>init().catch(error=>{
 console.warn('Ambassador Portal session check failed',error);
 fail(error?.message||'The Ambassador Portal could not confirm the connection. Please try again.');
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startPortal);else startPortal();
})();
