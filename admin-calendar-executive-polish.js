(()=>{
'use strict';
if(!/admin-calendar\.html$/i.test(location.pathname))return;
if(window.__fundaExecutiveCalendarPolish)return;
window.__fundaExecutiveCalendarPolish=true;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
let db=null,selectedKey='',selectedLoading=false,monthOpened=false;

function style(){
  if($('fundaExecutiveCalendarStyle'))return;
  const s=document.createElement('style');
  s.id='fundaExecutiveCalendarStyle';
  s.textContent=`
    body{font-family:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif!important;background:#f4f7fb!important;color:#17233b}
    header{background:linear-gradient(135deg,#06152f,#0b2f70)!important;box-shadow:0 3px 14px rgba(6,21,47,.16)}
    .head{max-width:1220px}
    main{max-width:1220px;padding:20px}
    .hero{border-radius:16px!important;padding:22px!important;box-shadow:0 10px 26px rgba(7,29,73,.10)!important}
    .hero h1{font-size:26px!important;line-height:1.2}.hero p{font-size:13px!important;max-width:820px}
    .stats{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    .stat{border-radius:12px!important;padding:14px 15px!important;box-shadow:0 5px 14px rgba(7,27,49,.05)}
    .stat strong{font-size:24px!important}.stat span{font-size:11px!important;font-weight:700;color:#65758a!important}
    .toolbar{background:#fff;border:1px solid #dbe4ee;border-radius:12px;padding:9px;margin:14px 0 12px;box-shadow:0 4px 14px rgba(7,27,49,.04)}
    .btn{font-family:inherit!important;font-size:11px!important;padding:9px 12px!important;border-radius:8px!important}
    .card{border-radius:14px!important;border-color:#dbe4ee!important;box-shadow:0 6px 18px rgba(7,27,49,.05)!important}
    #scheduleHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #edf1f5}
    #scheduleHeading h2{margin:0;color:#06152f;font-size:16px}
    #scheduleHeading p{margin:3px 0 0;color:#6e7d92;font-size:10px}
    .item{border-radius:10px!important;padding:12px!important;grid-template-columns:125px 1fr auto!important;background:#fbfcfe}
    .when{font-size:11px!important;color:#214d88!important}
    .item h3{font-size:13px!important}.item p{font-size:11px!important}
    .pill{font-size:9px!important;padding:4px 7px!important}
    .monthCard{padding:16px!important}
    .monthTop{margin-bottom:12px!important}
    .monthTop h2{font-size:18px!important}
    .monthHint{font-size:10px!important}
    .monthLayout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(280px,.8fr);gap:14px;align-items:start}
    .monthShell{border:1px solid #e1e7ef;border-radius:12px;background:linear-gradient(180deg,#fbfcfe,#f7f9fc);padding:10px}
    .monthGrid{gap:5px!important;min-width:620px!important}
    .monthDow{font-size:10px!important;color:#65758a!important;padding:6px 2px!important}
    .monthDay{min-height:94px!important;border-radius:9px!important;padding:7px!important;cursor:pointer;transition:border-color .12s,box-shadow .12s,transform .12s}
    .monthDay:not(.blank):hover{border-color:#9aafc8;box-shadow:0 4px 10px rgba(7,27,49,.06)}
    .monthDay.selected{border:2px solid #c99a2e!important;box-shadow:0 0 0 3px rgba(201,154,46,.12)!important}
    .monthDay.publicHoliday{background:linear-gradient(180deg,#fff5cf,#fffaf0)!important;border-color:#d8b85e!important}
    .monthDay.publicHoliday .monthNum{color:#7b5810!important}
    .execHolidayLabel{display:block;margin:3px 0;padding:3px 5px;border-radius:6px;background:#f5df9d;color:#62480d;font-size:9px;font-weight:900;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .execDateItem.holiday{background:#fff8df;border-color:#e3c66f}
    .execDateItem.holiday .execDateTime{color:#7b5810}
    .monthNum{font-size:11px!important}
    .monthEvent{font-size:9px!important;padding:4px 5px!important;border-radius:6px!important}
    .monthMore{font-size:9px!important}
    .execDatePanel{border:1px solid #dfe6ef;border-radius:12px;background:#fff;padding:13px;min-height:220px;box-shadow:0 5px 16px rgba(7,27,49,.04)}
    .execDatePanel h3{margin:0;color:#06152f;font-size:14px}
    .execDatePanel .dateSub{margin:3px 0 10px;color:#6e7d92;font-size:10px}
    .execDateItems{display:grid;gap:7px}
    .execDateItem{border:1px solid #e7ecf2;border-radius:9px;background:#fbfcfe;padding:9px}
    .execDateTime{font-size:9px;font-weight:900;color:#245294;text-transform:uppercase;letter-spacing:.03em}
    .execDateItem b{display:block;margin-top:3px;color:#12274d;font-size:11px;line-height:1.35}
    .execDateItem span{display:block;margin-top:3px;color:#6b788b;font-size:9px;line-height:1.4}
    .execDateEmpty{padding:18px 8px;text-align:center;color:#7b8797;font-size:10px}
    .execDatePanel .dateAction{display:inline-flex;margin-top:10px;text-decoration:none;border-radius:8px;background:#071b31;color:#fff;padding:7px 9px;font-size:9px;font-weight:900}
    .box{border-radius:16px!important}.box h2{font-size:19px!important}
    label{font-size:11px!important}input,select,textarea{font-family:inherit!important;font-size:13px!important}
    @media(max-width:900px){.monthLayout{grid-template-columns:1fr}.execDatePanel{min-height:0}.monthShell{overflow-x:auto}}
    @media(max-width:700px){main{padding:12px}.stats{grid-template-columns:repeat(3,1fr)}.monthDay{min-height:88px!important}.monthEvent{font-size:8.5px!important}.item{grid-template-columns:1fr!important}.hero h1{font-size:22px!important}}
  `;
  document.head.appendChild(s);
}

function updateScheduleHeading(){
  const list=$('list');
  const card=list?.closest('.card');
  if(!card)return;
  let head=$('scheduleHeading');
  if(!head){
    head=document.createElement('div');
    head.id='scheduleHeading';
    card.insertBefore(head,list);
  }
  const active=[...document.querySelectorAll('[data-view]')].find(b=>b.classList.contains('on'))?.dataset.view||'week';
  const map={
    today:['Today','Meetings, reminders and appointments scheduled for today.'],
    week:['Next 7 Days','Upcoming executive and Academy activity for the next seven days.'],
    all:['Upcoming Schedule','All upcoming executive, Academy and learner-linked calendar items.']
  };
  const x=map[active]||map.week;
  head.innerHTML=`<div><h2>${x[0]}</h2><p>${x[1]}</p></div>`;
}

function monthParts(){
  const title=$('monthTitle')?.textContent?.trim();
  if(!title)return null;
  const d=new Date('1 '+title+' 12:00:00');
  if(Number.isNaN(d.getTime()))return null;
  return {year:d.getFullYear(),month:d.getMonth()};
}

function keyFromCell(cell){
  const p=monthParts();
  const num=Number(cell.querySelector('.monthNum')?.textContent||0);
  if(!p||!num)return '';
  return `${p.year}-${String(p.month+1).padStart(2,'0')}-${String(num).padStart(2,'0')}`;
}

function prettyDate(k){
  const d=new Date(k+'T12:00:00+02:00');
  return d.toLocaleDateString('en-ZA',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
}

function localKey(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function easterSunday(year){
  const a=year%19,b=Math.floor(year/100),cc=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(cc/4),k=cc%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(year,month-1,day);
}
function saPublicHolidays(year){
  const base=[
    {date:new Date(year,0,1),name:"New Year's Day"},
    {date:new Date(year,2,21),name:'Human Rights Day'},
    {date:new Date(year,3,27),name:'Freedom Day'},
    {date:new Date(year,4,1),name:"Workers' Day"},
    {date:new Date(year,5,16),name:'Youth Day'},
    {date:new Date(year,7,9),name:"National Women's Day"},
    {date:new Date(year,8,24),name:'Heritage Day'},
    {date:new Date(year,11,16),name:'Day of Reconciliation'},
    {date:new Date(year,11,25),name:'Christmas Day'},
    {date:new Date(year,11,26),name:'Day of Goodwill'}
  ];
  const easter=easterSunday(year);
  base.push({date:addDays(easter,-2),name:'Good Friday'},{date:addDays(easter,1),name:'Family Day'});
  const all=[...base];
  base.forEach(h=>{if(h.date.getDay()===0)all.push({date:addDays(h.date,1),name:h.name+' (Observed)'})});
  const map=new Map();
  all.forEach(h=>{const k=localKey(h.date),arr=map.get(k)||[];if(!arr.includes(h.name))arr.push(h.name);map.set(k,arr)});
  return map;
}
function holidayNames(k){
  const year=Number(String(k||'').slice(0,4));
  return Number.isFinite(year)?(saPublicHolidays(year).get(k)||[]):[];
}
function decorateHoliday(cell,k){
  cell.querySelectorAll('.execHolidayLabel').forEach(x=>x.remove());
  const names=holidayNames(k);
  cell.classList.toggle('publicHoliday',names.length>0);
  return names;
}

function timeLabel(v){
  return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit'}).format(new Date(v));
}

async function client(){
  if(db)return db;
  if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)throw new Error('Calendar connection is not ready.');
  db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  return db;
}

async function loadSelectedDate(k){
  if(!k||selectedLoading)return;
  selectedLoading=true;
  selectedKey=k;
  const panel=$('execSelectedDatePanel');
  if(panel)panel.innerHTML=`<h3>${esc(prettyDate(k))}</h3><div class="dateSub">Loading scheduled items…</div>`;
  try{
    const c=await client();
    const from=k+'T00:00:00+02:00';
    const d=new Date(k+'T12:00:00+02:00');d.setDate(d.getDate()+1);
    const next=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T00:00:00+02:00`;
    const [ev,co]=await Promise.all([
      c.from('academy_calendar_events').select('id,title,description,starts_at,event_type,priority,audience,status').neq('status','cancelled').gte('starts_at',from).lt('starts_at',next).order('starts_at'),
      c.from('student_consultations').select('id,category,department,scheduled_start,duration_minutes,status').in('status',['requested','confirmed']).gte('scheduled_start',from).lt('scheduled_start',next).order('scheduled_start')
    ]);
    if(ev.error)throw ev.error;
    const items=(ev.data||[]).map(x=>({time:x.starts_at,title:x.title||'Calendar item',meta:[x.event_type,x.priority].filter(Boolean).join(' · '),description:x.description||'',holiday:false}));
    (co.data||[]).forEach(x=>items.push({time:x.scheduled_start,title:(x.category||'Student')+' consultation',meta:[x.department,x.status,(x.duration_minutes||30)+' min'].filter(Boolean).join(' · '),description:'',holiday:false}));
    holidayNames(k).forEach(name=>items.push({time:k+'T00:00:00+02:00',title:name,meta:'South African public holiday',description:'',holiday:true}));
    items.sort((a,b)=>new Date(a.time)-new Date(b.time));
    if(panel){
      panel.innerHTML=`<h3>${esc(prettyDate(k))}</h3><div class="dateSub">${items.length?items.length+' scheduled item'+(items.length===1?'':'s'):'No scheduled items'}</div>
        <div class="execDateItems">${items.length?items.map(x=>`<div class="execDateItem ${x.holiday?'holiday':''}"><div class="execDateTime">${x.holiday?'PUBLIC HOLIDAY':esc(timeLabel(x.time))+' SAST'}</div><b>${esc(x.title)}</b>${x.meta?`<span>${esc(x.meta)}</span>`:''}${x.description?`<span>${esc(x.description)}</span>`:''}</div>`).join(''):'<div class="execDateEmpty">Nothing is scheduled for this date.</div>'}</div>
        <button type="button" class="dateAction" id="createForSelectedDate">+ Create Reminder</button>`;
      const b=$('createForSelectedDate');
      if(b)b.onclick=()=>$('newEvent')?.click();
    }
  }catch(e){
    if(panel)panel.innerHTML=`<h3>${esc(prettyDate(k))}</h3><div class="execDateEmpty">This date could not load right now. The calendar view remains available.</div>`;
  }finally{selectedLoading=false}
}

function wireMonthCells(){
  const grid=$('monthGrid');
  if(!grid)return;
  grid.querySelectorAll('.monthDay:not(.blank)').forEach(cell=>{
    const k=keyFromCell(cell);
    const holidays=decorateHoliday(cell,k);
    const baseLabel=prettyDate(k);
    cell.setAttribute('aria-label',holidays.length?`${baseLabel} — Public holiday: ${holidays.join(', ')}`:baseLabel);
    if(cell.dataset.execBound)return;
    cell.dataset.execBound='1';
    cell.tabIndex=0;
    cell.setAttribute('role','button');
    const activate=()=>{
      grid.querySelectorAll('.monthDay.selected').forEach(x=>x.classList.remove('selected'));
      cell.classList.add('selected');
      const selectedDate=keyFromCell(cell);
      if(selectedDate)loadSelectedDate(selectedDate);
    };
    cell.addEventListener('click',activate);
    cell.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate()}});
  });
}

function enhanceMonth(){
  const card=$('monthCard'),shell=card?.querySelector('.monthShell');
  if(!card||!shell)return false;
  const hint=card.querySelector('.monthHint');
  if(hint)hint.textContent='South African public holidays are highlighted. Scheduled meetings, reminders and appointments appear directly on their dates.';
  if(!card.querySelector('.monthLayout')){
    const layout=document.createElement('div');
    layout.className='monthLayout';
    shell.parentNode.insertBefore(layout,shell);
    layout.appendChild(shell);
    const panel=document.createElement('aside');
    panel.id='execSelectedDatePanel';
    panel.className='execDatePanel';
    panel.innerHTML='<h3>Select a date</h3><div class="dateSub">Choose a day to view its meetings, reminders and appointments.</div><div class="execDateEmpty">Calendar details will appear here.</div>';
    layout.appendChild(panel);
  }
  wireMonthCells();
  return true;
}

function openCalendarOnce(){
  const b=$('monthViewBtn');
  if(!b||monthOpened)return;
  monthOpened=true;
  b.click();
  setTimeout(()=>{
    enhanceMonth();
    const today=$('monthGrid')?.querySelector('.monthDay.today');
    if(today)today.click();
  },500);
}

function install(){
  style();
  updateScheduleHeading();
  [250,700,1300,2200].forEach(delay=>setTimeout(()=>{
    updateScheduleHeading();
    if(enhanceMonth())openCalendarOnce();
  },delay));

  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-view]'))setTimeout(updateScheduleHeading,40);
    if(e.target.closest?.('#monthViewBtn'))setTimeout(()=>{enhanceMonth();wireMonthCells()},350);
    if(e.target.closest?.('#monthPrev,#monthNext,#monthToday'))setTimeout(()=>{enhanceMonth();wireMonthCells();const t=$('monthGrid')?.querySelector('.monthDay.today');if(t)t.click()},450);
  },true);

  const gridWatcher=()=>{
    const grid=$('monthGrid');
    if(!grid)return;
    new MutationObserver(()=>setTimeout(()=>{
      wireMonthCells();
      if(!grid.querySelector('.monthDay.selected')){
        const today=grid.querySelector('.monthDay.today');
        if(today)today.click();
      }
    },40)).observe(grid,{childList:true,subtree:false});
  };
  setTimeout(gridWatcher,1200);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();