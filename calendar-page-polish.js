(()=>{
'use strict';
if(!/(student-calendar|admin-calendar)\.html$/i.test(location.pathname))return;
const isStudent=/student-calendar\.html$/i.test(location.pathname);
let db=null,monthCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1),monthBusy=false;
const pad=n=>String(n).padStart(2,'0');
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const monthName=d=>d.toLocaleDateString('en-ZA',{month:'long',year:'numeric'});
const dateKey=v=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(v));const g=t=>p.find(x=>x.type===t)?.value||'';return `${g('year')}-${g('month')}-${g('day')}`};
const timeLabel=v=>new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',hour:'2-digit',minute:'2-digit'}).format(new Date(v));
function style(){if(document.getElementById('fundaMonthCalendarStyle'))return;const s=document.createElement('style');s.id='fundaMonthCalendarStyle';s.textContent=`
.monthCard{display:none;margin-top:0}.monthTop{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.monthTop h2{margin:0;color:#06152f;font-size:18px}.monthNav{display:flex;gap:7px;align-items:center}.monthNav button{border:1px solid #d9e4f2;background:#fff;color:#06152f;border-radius:9px;padding:8px 10px;font-weight:900;cursor:pointer}.monthShell{overflow-x:auto;padding-bottom:4px}.monthGrid{display:grid;grid-template-columns:repeat(7,minmax(78px,1fr));gap:6px;min-width:610px}.monthDow{text-align:center;font-size:9px;font-weight:900;letter-spacing:.04em;color:#728096;padding:6px 2px;text-transform:uppercase}.monthDay{min-height:104px;border:1px solid #e1e8f1;border-radius:11px;background:#fff;padding:7px;overflow:hidden}.monthDay.blank{background:#f8fafc;border-style:dashed}.monthDay.today{border:2px solid #173d78}.monthDay.hasEvents{background:linear-gradient(180deg,#fff9df,#fff);border-color:#d6ae3f;box-shadow:0 4px 12px rgba(155,112,0,.08)}.monthNum{font-size:11px;font-weight:900;color:#06152f;margin-bottom:5px}.monthDay.today .monthNum{display:inline-grid;place-items:center;width:23px;height:23px;border-radius:50%;background:#06152f;color:#fff}.monthEvent{display:block;margin:3px 0;padding:4px 5px;border-radius:6px;background:#eaf2ff;color:#174d91;font-size:8px;font-weight:800;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.monthDay.hasEvents .monthEvent:first-of-type{background:#f4df9e;color:#5d4510}.monthMore{font-size:8px;font-weight:900;color:#7c5b0c;margin-top:3px}.monthLoading,.monthError,.monthEmpty{padding:24px;text-align:center;color:#66758a;font-size:12px}.monthError{color:#922;background:#fff1f1;border-radius:10px}.monthHint{margin-top:10px;font-size:10px;color:#6b7788;line-height:1.45}@media(max-width:700px){.monthTop{align-items:flex-start}.monthTop h2{font-size:16px}.monthGrid{min-width:600px}.monthDay{min-height:96px;padding:6px}.monthEvent{font-size:7.5px}}
`;document.head.appendChild(s)}
function tidy(){
  document.querySelectorAll('.notice').forEach(n=>n.remove());
  const empty=document.querySelector('.empty');
  if(!empty)return;
  if(isStudent){
    const personal=Number(document.getElementById('personalCount')?.textContent||0);
    const week=Number(document.getElementById('weekCount')?.textContent||0);
    const active=[...document.querySelectorAll('[data-view]')].find(b=>b.classList.contains('on'))?.dataset.view;
    if(active==='week'&&week===0&&personal>0)empty.textContent=`Nothing is scheduled in the next 7 days. You have ${personal} personal reminder${personal===1?'':'s'} later — tap Upcoming to view ${personal===1?'it':'them'}.`;
    else if(active==='today')empty.textContent='Nothing is scheduled for today.';
    else if(active==='all')empty.textContent='You have no upcoming Academy events or personal reminders.';
  }else{
    const active=[...document.querySelectorAll('[data-view]')].find(b=>b.classList.contains('on'))?.dataset.view;
    if(active==='today')empty.textContent='Nothing is scheduled for today.';
    else if(active==='week')empty.textContent='Nothing is scheduled in the next 7 days.';
    else empty.textContent='There are no upcoming executive or Academy calendar items.';
  }
}
function installMonthUi(){
  style();
  const toolbar=document.querySelector('.toolbar');
  if(!toolbar)return false;
  if(!document.getElementById('monthViewBtn')){
    const create=document.getElementById(isStudent?'newReminder':'newEvent');
    const b=document.createElement('button');b.type='button';b.id='monthViewBtn';b.className='btn alt';b.textContent='Calendar';
    if(create)toolbar.insertBefore(b,create);else toolbar.appendChild(b);
    b.addEventListener('click',openMonth);
  }
  const listCard=document.getElementById('list')?.closest('.card');
  if(listCard&&!document.getElementById('monthCard')){
    const c=document.createElement('section');c.className='card monthCard';c.id='monthCard';
    c.innerHTML=`<div class="monthTop"><div><h2 id="monthTitle"></h2><div class="monthHint">Dates with scheduled items are highlighted. Event titles appear directly on the relevant day.</div></div><div class="monthNav"><button type="button" id="monthPrev" aria-label="Previous month">‹</button><button type="button" id="monthToday">Today</button><button type="button" id="monthNext" aria-label="Next month">›</button></div></div><div class="monthShell"><div id="monthGrid" class="monthGrid"></div></div>`;
    listCard.parentNode.insertBefore(c,listCard);
    document.getElementById('monthPrev').onclick=()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()-1,1);loadMonth()};
    document.getElementById('monthNext').onclick=()=>{monthCursor=new Date(monthCursor.getFullYear(),monthCursor.getMonth()+1,1);loadMonth()};
    document.getElementById('monthToday').onclick=()=>{const n=new Date();monthCursor=new Date(n.getFullYear(),n.getMonth(),1);loadMonth()};
  }
  document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.monthBound)return;b.dataset.monthBound='1';b.addEventListener('click',()=>setTimeout(closeMonth,0))});
  return true;
}
function closeMonth(){const c=document.getElementById('monthCard'),list=document.getElementById('list')?.closest('.card'),b=document.getElementById('monthViewBtn');if(c)c.style.display='none';if(list)list.style.display='block';if(b){b.classList.remove('on');b.classList.add('alt')}}
function openMonth(){
  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.remove('on');b.classList.add('alt')});
  const b=document.getElementById('monthViewBtn');if(b){b.classList.add('on');b.classList.remove('alt')}
  const list=document.getElementById('list')?.closest('.card'),c=document.getElementById('monthCard');if(list)list.style.display='none';if(c)c.style.display='block';
  loadMonth();
}
async function client(){if(db)return db;if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)throw new Error('Calendar connection is not ready.');db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);return db}
async function monthItems(){
  const c=await client(),y=monthCursor.getFullYear(),m=monthCursor.getMonth();
  const from=new Date(Date.UTC(y,m,1,-2,0,0)).toISOString(),to=new Date(Date.UTC(y,m+1,1,-2,0,0)).toISOString();
  let evq=c.from('academy_calendar_events').select('id,title,starts_at,event_type,audience,priority,official,status').gte('starts_at',from).lt('starts_at',to).order('starts_at');
  evq=isStudent?evq.eq('status','active'):evq.neq('status','cancelled');
  const cq=c.from('student_consultations').select('id,category,department,scheduled_start,status').gte('scheduled_start',from).lt('scheduled_start',to).in('status',['requested','confirmed']).order('scheduled_start');
  const [ev,co]=await Promise.all([evq,cq]);
  if(ev.error)throw ev.error;
  if(co.error&&!/permission|policy|row-level/i.test(String(co.error.message||'')))console.warn('Calendar consultations',co.error);
  const out=(ev.data||[]).map(x=>({title:x.title||'Calendar item',starts_at:x.starts_at,type:x.event_type||'reminder'}));
  (co.data||[]).forEach(x=>out.push({title:(x.category||'Student')+' consultation',starts_at:x.scheduled_start,type:'appointment'}));
  out.sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));return out;
}
function renderMonth(items){
  const grid=document.getElementById('monthGrid'),title=document.getElementById('monthTitle');if(!grid||!title)return;
  title.textContent=monthName(monthCursor);
  const y=monthCursor.getFullYear(),m=monthCursor.getMonth(),first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),offset=first.getDay();
  const grouped={};items.forEach(x=>{const k=dateKey(x.starts_at);(grouped[k]||(grouped[k]=[])).push(x)});
  const names=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];let html=names.map(x=>`<div class="monthDow">${x}</div>`).join('');
  for(let i=0;i<offset;i++)html+='<div class="monthDay blank"></div>';
  const now=new Date(),todayKey=`${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  for(let d=1;d<=days;d++){
    const key=`${y}-${pad(m+1)}-${pad(d)}`,arr=grouped[key]||[],show=arr.slice(0,3),more=arr.length-show.length;
    html+=`<div class="monthDay ${arr.length?'hasEvents':''} ${key===todayKey?'today':''}"><div class="monthNum">${d}</div>${show.map(x=>`<div class="monthEvent" title="${esc(x.title)}">${esc(timeLabel(x.starts_at))} · ${esc(x.title)}</div>`).join('')}${more?`<div class="monthMore">+${more} more</div>`:''}</div>`;
  }
  const used=offset+days,tail=(7-(used%7))%7;for(let i=0;i<tail;i++)html+='<div class="monthDay blank"></div>';
  grid.innerHTML=html;
}
async function loadMonth(){
  if(monthBusy)return;monthBusy=true;const grid=document.getElementById('monthGrid'),title=document.getElementById('monthTitle');if(title)title.textContent=monthName(monthCursor);if(grid)grid.innerHTML='<div class="monthLoading" style="grid-column:1/-1">Loading month…</div>';
  try{const items=await monthItems();renderMonth(items)}catch(e){if(grid)grid.innerHTML=`<div class="monthError" style="grid-column:1/-1">The month calendar could not load: ${esc(e.message||e)}</div>`}finally{monthBusy=false}
}
function start(){tidy();installMonthUi();setTimeout(()=>{tidy();installMonthUi()},300);setTimeout(()=>{tidy();installMonthUi()},900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
document.addEventListener('click',e=>{if(e.target.closest?.('[data-view]'))setTimeout(tidy,40)},true);
})();
