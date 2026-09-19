(()=>{
'use strict';
if(window.__fundaAdminDailyCommandCards)return;
window.__fundaAdminDailyCommandCards=true;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v??'').trim().toLowerCase();
let db=null,loading=false,lastData=null;

function installStyle(){
  if($('adcStyle'))return;
  const s=document.createElement('style');
  s.id='adcStyle';
  s.textContent=`
    .adcSection{margin:16px 0 2px}
    .adcSectionHead{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:10px}
    .adcSectionHead h2{margin:0!important;font-size:15px!important;color:#071b31!important}
    .adcSectionHead small{color:#728197;font-size:9px}
    .adcGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    .adcCard{min-height:220px;border:1px solid #dfe6ef;border-radius:13px;background:#fff;padding:14px;box-shadow:0 5px 16px rgba(7,27,49,.045);overflow:hidden}
    .adcCardHead{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}
    .adcCard h3{margin:0!important;font-size:13px!important;color:#071b31!important}
    .adcCardHint{font-size:8px;color:#8a98aa}
    .adcLinkList,.adcSummaryList,.adcReportList{display:grid;gap:6px}
    .adcLink,.adcSummary,.adcReport{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #edf1f5;border-radius:8px;background:#fbfcfe;padding:8px 9px;color:#18314d;text-decoration:none;font-size:9px;cursor:pointer}
    button.adcLink,button.adcReport{width:100%;font-family:inherit;text-align:left}
    .adcLink:hover,.adcReport:hover{border-color:#d7bc68;background:#fffaf0}
    .adcLink b,.adcReport b{font-size:9px}.adcArrow{color:#a27c24;font-weight:900}
    .adcCount{min-width:28px;height:24px;padding:0 6px;display:grid;place-items:center;border-radius:99px;background:#eef3f8;color:#17324a;font-size:9px;font-weight:900}
    .adcCount.attn{background:#fff0d0;color:#895e00}.adcCount.bad{background:#ffe8e8;color:#9a2d2d}
    .adcSummary span{font-size:9px;color:#526177}.adcSummary strong{font-size:12px;color:#071b31}
    .adcChart{height:128px;display:flex;align-items:flex-end;gap:7px;padding:8px 2px 0;border-bottom:1px solid #dfe5ed}
    .adcDay{height:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:4px}
    .adcBars{height:94px;width:100%;display:flex;align-items:flex-end;justify-content:center;gap:2px}
    .adcBar{width:22%;min-width:4px;border-radius:4px 4px 0 0;background:#0b315c;min-height:2px}
    .adcBar.pay{background:#b9902f}.adcBar.sup{background:#8da0b9}
    .adcDayLabel{font-size:7px;color:#728197;font-weight:800}
    .adcLegend{display:flex;gap:9px;flex-wrap:wrap;margin-top:8px;font-size:7px;color:#69798e}
    .adcLegend i{display:inline-block;width:7px;height:7px;border-radius:2px;background:#0b315c;margin-right:3px}.adcLegend i.pay{background:#b9902f}.adcLegend i.sup{background:#8da0b9}
    .adcWeekList{display:grid;gap:7px}.adcWeekItem{padding:8px;border:1px solid #edf1f5;border-radius:8px;background:#fbfcfe}
    .adcWeekItem b{display:block;font-size:9px;color:#152b43}.adcWeekItem span{display:block;margin-top:2px;font-size:8px;color:#758397}
    .adcWeekTag{display:inline-block!important;margin-top:4px!important;width:auto;padding:2px 5px;border-radius:99px;background:#fff0d0;color:#875d00!important;font-size:7px!important;font-weight:900}
    .adcEmpty{padding:18px 8px;text-align:center;color:#8290a2;font-size:9px}
    .adcCalTop{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}.adcCalTop b{font-size:10px;color:#17324a}
    .adcCalendar{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.adcDow{text-align:center;font-size:7px;color:#8390a0;font-weight:900;padding:3px 0}
    .adcDate{position:relative;min-height:27px;display:grid;place-items:center;border-radius:7px;font-size:8px;color:#273b52;background:#fbfcfe}
    .adcDate.muted{opacity:.18}.adcDate.today{outline:2px solid #0b315c;font-weight:900}.adcDate.holiday{background:#fff0d0;color:#7e5700;font-weight:900}
    .adcDate.hasEvent:after{content:"";position:absolute;bottom:3px;width:4px;height:4px;border-radius:50%;background:#0b63ce}.adcDate.holiday.hasEvent:after{background:#8a5a00}
    .adcCalLegend{display:flex;gap:9px;flex-wrap:wrap;margin-top:8px;font-size:7px;color:#758397}.adcCalLegend i{display:inline-block;width:7px;height:7px;border-radius:2px;margin-right:3px}
    .adcCalLegend .today{border:2px solid #0b315c;background:#fff}.adcCalLegend .holiday{background:#fff0d0}.adcCalLegend .event{background:#0b63ce;border-radius:50%}
    .adcOpen{border:0;background:transparent;color:#8b6b19;font-size:8px;font-weight:900;cursor:pointer;text-decoration:none}
    .adcLoading{min-height:160px;display:grid;place-items:center;color:#8290a2;font-size:9px}
    @media(max-width:1050px){.adcGrid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:650px){.adcGrid{grid-template-columns:1fr}.adcCard{min-height:0}.adcSectionHead{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(s);
}

function activeDashboard(){
  return !!document.querySelector('#view .execSafe .execMain');
}

function client(){
  if(db)return db;
  if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
    db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  }
  return db;
}

function openSection(section){
  if(section==='ceo-account-control'){
    const b=$('ceoAccountControlNav');
    if(b){b.click();return}
  }
  try{if(typeof show==='function'){show(section);return}}catch(_){}
  const b=[...document.querySelectorAll('#nav button')].find(x=>x.dataset.s===section||low(x.textContent).includes(section));
  b?.click();
}

function openReport(type){
  if(typeof window.openFundaReportCentre!=='function')return openSection('audits');
  window.openFundaReportCentre();
  setTimeout(()=>{
    const sel=$('frc-type');
    if(sel&&[...sel.options].some(o=>o.value===type))sel.value=type;
  },30);
}

function localDay(v){
  if(!v)return null;
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:new Date(d.getFullYear(),d.getMonth(),d.getDate());
}
function key(d){return d.toISOString().slice(0,10)}
function dateKeyLocal(v){
  const d=new Date(v);if(Number.isNaN(d.getTime()))return '';
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function dayStart(d){return new Date(d.getFullYear(),d.getMonth(),d.getDate())}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}

function easterSunday(year){
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(year,month-1,day);
}
function saHolidays(year){
  const fixed=[
    [0,1,"New Year's Day"],[2,21,'Human Rights Day'],[3,27,'Freedom Day'],[4,1,"Workers' Day"],
    [5,16,'Youth Day'],[7,9,"National Women's Day"],[8,24,'Heritage Day'],[11,16,'Day of Reconciliation'],
    [11,25,'Christmas Day'],[11,26,'Day of Goodwill']
  ];
  const list=fixed.map(([m,d,n])=>({date:new Date(year,m,d),name:n}));
  const easter=easterSunday(year);
  list.push({date:addDays(easter,-2),name:'Good Friday'},{date:addDays(easter,1),name:'Family Day'});
  const observed=[];
  list.forEach(h=>{if(h.date.getDay()===0)observed.push({date:addDays(h.date,1),name:h.name+' (Observed)'})});
  return [...list,...observed];
}

async function loadData(){
  const c=client();
  if(!c)throw new Error('Admin data connection is not ready.');
  const today=dayStart(new Date()),from=addDays(today,-6),monthStart=new Date(today.getFullYear(),today.getMonth(),1),monthEnd=new Date(today.getFullYear(),today.getMonth()+1,1),weekEnd=addDays(today,8);
  const [en,pay,sup,amb,gov,cal,con]=await Promise.all([
    c.from('enrollments').select('id,status,enrollment_status,created_at,submitted_at'),
    c.from('payments').select('id,status,created_at,submitted_at,verified_at'),
    c.from('support_tickets').select('id,status,created_at'),
    c.from('ambassador_programme_applications').select('id,status,created_at'),
    c.from('governance_actions').select('id,title,status,due_date,priority,department').order('due_date',{ascending:true}),
    c.from('academy_calendar_events').select('id,title,starts_at,status').neq('status','cancelled').gte('starts_at',monthStart.toISOString()).lt('starts_at',monthEnd.toISOString()),
    c.from('student_consultations').select('id,scheduled_start,status').in('status',['requested','confirmed']).gte('scheduled_start',monthStart.toISOString()).lt('scheduled_start',monthEnd.toISOString())
  ]);
  const results=[en,pay,sup,amb,gov,cal,con];
  const bad=results.find(x=>x.error);
  if(bad)console.warn('Daily command centre partial data load',bad.error);
  return {
    enrollments:en.data||[],payments:pay.data||[],support:sup.data||[],ambassadors:amb.data||[],
    actions:gov.data||[],events:cal.data||[],consultations:con.data||[],today,from,weekEnd
  };
}

function pendingCounts(d){
  const pendingEn=d.enrollments.filter(x=>low(x.status||x.enrollment_status)==='pending').length;
  const pendingPay=d.payments.filter(x=>['submitted','pending','awaiting_verification','under_review'].includes(low(x.status))).length;
  const openSup=d.support.filter(x=>!['closed','solved','resolved'].includes(low(x.status))).length;
  const pendingAmb=d.ambassadors.filter(x=>!['approved','rejected','declined','inactive'].includes(low(x.status))).length;
  const todayStr=dateKeyLocal(d.today),weekStr=dateKeyLocal(addDays(d.today,7));
  const openActions=d.actions.filter(x=>!['completed','closed'].includes(low(x.status)));
  const dueActions=openActions.filter(x=>x.due_date&&x.due_date<=weekStr).length;
  const overdue=openActions.filter(x=>x.due_date&&x.due_date<todayStr).length;
  return {pendingEn,pendingPay,openSup,pendingAmb,dueActions,overdue};
}

function quickLinks(){
  return `<div class="adcLinkList">
    <button class="adcLink" data-adc-open="enrolments"><b>Review Enrolments</b><span class="adcArrow">→</span></button>
    <button class="adcLink" data-adc-open="finance"><b>Verify Payment Proofs</b><span class="adcArrow">→</span></button>
    <button class="adcLink" data-adc-open="support"><b>Student Support Queue</b><span class="adcArrow">→</span></button>
    <button class="adcLink" data-adc-open="ambassadors"><b>Ambassador Applications</b><span class="adcArrow">→</span></button>
    <button class="adcLink" data-adc-open="hr"><b>HR &amp; Team</b><span class="adcArrow">→</span></button>
    <button class="adcLink" data-adc-open="ceo-account-control"><b>CEO Account Control</b><span class="adcArrow">→</span></button>
  </div>`;
}

function systemSummary(d){
  const c=pendingCounts(d);
  const row=(label,value,cls='')=>`<div class="adcSummary"><span>${esc(label)}</span><strong class="adcCount ${cls}">${value}</strong></div>`;
  return `<div class="adcSummaryList">
    ${row('Enrolments awaiting decision',c.pendingEn,c.pendingEn?'attn':'')}
    ${row('Payment proofs awaiting verification',c.pendingPay,c.pendingPay?'attn':'')}
    ${row('Open support tickets',c.openSup,c.openSup?'attn':'')}
    ${row('Ambassador applications awaiting review',c.pendingAmb,c.pendingAmb?'attn':'')}
    ${row('Executive actions due / overdue',c.dueActions,c.overdue?'bad':c.dueActions?'attn':'')}
  </div>`;
}

function quickReports(){
  const items=[['executive','Executive Summary'],['enrolments','Enrolments Report'],['payments','Payments Report'],['support','Student Support Report'],['academic','Academic & Assessments']];
  return `<div class="adcReportList">${items.map(([type,label])=>`<button class="adcReport" data-adc-report="${type}"><b>${esc(label)}</b><span class="adcArrow">↗</span></button>`).join('')}</div>`;
}

function graph(d){
  const days=Array.from({length:7},(_,i)=>addDays(d.from,i));
  const data=days.map(day=>{
    const k=dateKeyLocal(day);
    const ens=d.enrollments.filter(x=>dateKeyLocal(x.submitted_at||x.created_at)===k).length;
    const pays=d.payments.filter(x=>dateKeyLocal(x.verified_at||x.submitted_at||x.created_at)===k&&['verified','paid','approved','completed','submitted'].includes(low(x.status))).length;
    const sup=d.support.filter(x=>dateKeyLocal(x.created_at)===k).length;
    return {day,ens,pays,sup};
  });
  const max=Math.max(1,...data.flatMap(x=>[x.ens,x.pays,x.sup]));
  return `<div class="adcChart">${data.map(x=>`
    <div class="adcDay" title="${x.ens} enrolment(s), ${x.pays} payment activity, ${x.sup} support ticket(s)">
      <div class="adcBars">
        <i class="adcBar" style="height:${Math.max(2,Math.round(x.ens/max*88))}px"></i>
        <i class="adcBar pay" style="height:${Math.max(2,Math.round(x.pays/max*88))}px"></i>
        <i class="adcBar sup" style="height:${Math.max(2,Math.round(x.sup/max*88))}px"></i>
      </div>
      <span class="adcDayLabel">${x.day.toLocaleDateString('en-ZA',{weekday:'short'})}</span>
    </div>`).join('')}</div>
    <div class="adcLegend"><span><i></i>Enrolments</span><span><i class="pay"></i>Payments</span><span><i class="sup"></i>Support</span></div>`;
}

function thisWeek(d){
  const today=dateKeyLocal(d.today),end=dateKeyLocal(addDays(d.today,7));
  const open=d.actions.filter(x=>!['completed','closed'].includes(low(x.status))&&x.due_date&&x.due_date<=end).slice(0,4);
  if(!open.length)return '<div class="adcEmpty">No executive actions are due in the next 7 days.</div>';
  return `<div class="adcWeekList">${open.map(a=>{
    const over=a.due_date<today,when=over?'Overdue':a.due_date===today?'Due today':'Due '+new Date(a.due_date+'T12:00:00').toLocaleDateString('en-ZA',{day:'2-digit',month:'short'});
    return `<div class="adcWeekItem"><b>${esc(a.title||'Executive action')}</b><span>${esc(a.department||'Management')}</span><span class="adcWeekTag">${esc(when)}</span></div>`;
  }).join('')}</div>`;
}

function calendar(d){
  const now=d.today,y=now.getFullYear(),m=now.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),start=(first.getDay()+6)%7;
  const holidays=saHolidays(y).filter(h=>h.date.getMonth()===m);
  const holidayMap=new Map(holidays.map(h=>[dateKeyLocal(h.date),h.name]));
  const eventDays=new Set([...d.events.map(x=>dateKeyLocal(x.starts_at)),...d.consultations.map(x=>dateKeyLocal(x.scheduled_start))]);
  const cells=[];
  for(let i=0;i<start;i++)cells.push('<span class="adcDate muted"></span>');
  for(let day=1;day<=days;day++){
    const dt=new Date(y,m,day),k=dateKeyLocal(dt),holiday=holidayMap.get(k),today=k===dateKeyLocal(now),has=eventDays.has(k);
    cells.push(`<span class="adcDate${today?' today':''}${holiday?' holiday':''}${has?' hasEvent':''}" title="${esc(holiday||'')}${holiday&&has?' · ':''}${has?'Academy event / consultation':''}">${day}</span>`);
  }
  return `<div class="adcCalTop"><b>${now.toLocaleDateString('en-ZA',{month:'long',year:'numeric'})}</b><a class="adcOpen" href="admin-calendar.html">Open Calendar →</a></div>
    <div class="adcCalendar">${['Mo','Tu','We','Th','Fr','Sa','Su'].map(x=>'<span class="adcDow">'+x+'</span>').join('')}${cells.join('')}</div>
    <div class="adcCalLegend"><span><i class="today"></i>Today</span><span><i class="holiday"></i>Public holiday</span><span><i class="event"></i>Academy event</span></div>`;
}

function shell(){
  const section=document.createElement('section');
  section.id='adminDailyCommandCentre';
  section.className='adcSection';
  section.innerHTML=`
    <div class="adcSectionHead"><div><h2>Daily Operations</h2><small>Shortcuts, attention items and operational previews — without duplicating department workspaces.</small></div></div>
    <div class="adcGrid">
      <article class="adcCard"><div class="adcCardHead"><h3>Quick Links</h3><span class="adcCardHint">Daily access</span></div><div id="adcQuick">${quickLinks()}</div></article>
      <article class="adcCard"><div class="adcCardHead"><h3>System Summary</h3><span class="adcCardHint">Needs attention</span></div><div id="adcSummary" class="adcLoading">Loading…</div></article>
      <article class="adcCard"><div class="adcCardHead"><h3>Quick Reports</h3><span class="adcCardHint">Existing reports</span></div><div id="adcReports">${quickReports()}</div></article>
      <article class="adcCard"><div class="adcCardHead"><h3>Operational Activity</h3><span class="adcCardHint">Last 7 days</span></div><div id="adcGraph" class="adcLoading">Loading…</div></article>
      <article class="adcCard"><div class="adcCardHead"><h3>This Week</h3><button class="adcOpen" data-adc-open="management">Management →</button></div><div id="adcWeek" class="adcLoading">Loading…</div></article>
      <article class="adcCard"><div class="adcCardHead"><h3>Calendar</h3><span class="adcCardHint">Month view</span></div><div id="adcCalendar" class="adcLoading">Loading…</div></article>
    </div>`;
  return section;
}

function place(){
  if(!activeDashboard()){$('adminDailyCommandCentre')?.remove();return false}
  if($('adminDailyCommandCentre'))return true;
  const dept=document.querySelector('#view .execSafe .execMain .deptGrid');
  if(!dept)return false;
  const section=shell();
  dept.insertAdjacentElement('afterend',section);
  wire(section);
  refreshData();
  return true;
}

function wire(root){
  root.querySelectorAll('[data-adc-open]').forEach(b=>b.addEventListener('click',()=>openSection(b.dataset.adcOpen)));
  root.querySelectorAll('[data-adc-report]').forEach(b=>b.addEventListener('click',()=>openReport(b.dataset.adcReport)));
}

async function refreshData(){
  if(loading||!activeDashboard())return;
  loading=true;
  try{
    const d=await loadData();
    lastData=d;
    if(!activeDashboard())return;
    if(!$('adminDailyCommandCentre'))place();
    if($('adcSummary'))$('adcSummary').innerHTML=systemSummary(d);
    if($('adcGraph'))$('adcGraph').innerHTML=graph(d);
    if($('adcWeek'))$('adcWeek').innerHTML=thisWeek(d);
    if($('adcCalendar'))$('adcCalendar').innerHTML=calendar(d);
  }catch(e){
    console.error('Admin Daily Operations',e);
    ['adcSummary','adcGraph','adcWeek','adcCalendar'].forEach(id=>{const el=$(id);if(el)el.innerHTML='<div class="adcEmpty">This preview could not load. Use the department tab or manual Refresh.</div>'});
  }finally{loading=false}
}

function boot(){
  installStyle();
  const view=$('view');
  if(!view)return setTimeout(boot,250);
  let queued=false;
  new MutationObserver(()=>{
    if(queued)return;
    queued=true;
    setTimeout(()=>{
      queued=false;
      if(place()&&lastData){
        if($('adcSummary'))$('adcSummary').innerHTML=systemSummary(lastData);
        if($('adcGraph'))$('adcGraph').innerHTML=graph(lastData);
        if($('adcWeek'))$('adcWeek').innerHTML=thisWeek(lastData);
        if($('adcCalendar'))$('adcCalendar').innerHTML=calendar(lastData);
      }
    },90);
  }).observe(view,{childList:true,subtree:true});

  document.addEventListener('funda:admin-manual-refresh',()=>{if(activeDashboard())refreshData()});
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#nav button');
    if(b&&/dashboard/i.test(b.textContent||''))setTimeout(place,180);
  },true);

  setTimeout(place,900);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();