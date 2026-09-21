(()=>{
if(!/admin-v2\.html$/i.test(location.pathname))return;
if(window.__fundaAdminHeaderInteractions)return;
window.__fundaAdminHeaderInteractions=true;
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));let db,user,refreshing=false,refreshAgain=false,lastRefresh=0;
function css(){if($('ahiCss'))return;let s=document.createElement('style');s.id='ahiCss';s.textContent=`.ahiPanel{display:none;position:fixed;z-index:40000;right:12px;top:76px;width:min(410px,calc(100vw - 24px));max-height:72vh;overflow:auto;background:#fffaf0;color:#142846;border:1px solid #dbc98f;border-radius:16px;box-shadow:0 22px 60px #06142155;padding:14px}.ahiPanel.open{display:block}.ahiHead{display:flex;justify-content:space-between;align-items:start;gap:10px}.ahiPanel h3{margin:0 0 4px;font-size:15px}.ahiPanel p{margin:0 0 10px;font-size:10px;color:#748197}.ahiBtns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.ahiClose,.ahiRead{border:0;border-radius:8px;padding:6px 9px;font-weight:800;font-size:9px;cursor:pointer}.ahiClose{background:#142846;color:#fff}.ahiRead{background:#ead18b;color:#142846}.ahiItem{display:grid;grid-template-columns:28px 1fr auto;gap:8px;padding:11px 4px;border-top:1px solid #ece5d8;align-items:start;cursor:pointer}.ahiIcon{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#fff0c9}.ahiItem b{font-size:10px}.ahiItem small{display:block;font-size:9px;color:#6e7d92;margin-top:2px}.ahiTag{font-size:8px;font-weight:900;background:#fff0d6;color:#8a5a05;padding:4px 6px;border-radius:99px}.ahiEmpty{padding:18px 5px;text-align:center;color:#6e7d92;font-size:10px}.safeRoleMobile{display:none;color:#fff;font-size:11px;font-weight:900;white-space:nowrap}.safeMenu{z-index:40001!important}@media(max-width:820px){.safeTop{gap:7px!important}.safeAvatar{width:36px!important;height:36px!important}.safeProfile{gap:5px!important}.safeRoleMobile{display:block}.safeId{display:none!important}.safeProfile>button:last-of-type{font-size:18px;padding:8px 3px!important}.safeMenu{position:fixed!important;right:10px!important;top:76px!important;width:min(300px,calc(100vw - 20px))!important}.ahiPanel{right:8px;top:76px;width:calc(100vw - 16px);box-sizing:border-box;max-height:76vh}}`;document.head.appendChild(s)}
async function client(){db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);if(!db)return null;if(!user){let u=await db.auth.getUser();user=u.data?.user||null}return db}
async function getData(){let c=await client();if(!c)return[];const now=new Date(),createdCutoff=new Date(now.getTime()-7*86400000).toISOString(),dueCutoff=new Date(now.getTime()+24*60*60*1000).toISOString();let [en,tk,pay,emp,cal]=await Promise.all([c.from('enrollments').select('id,status,enrollment_status,created_at'),c.from('support_tickets').select('id,subject,status,priority,created_at'),c.from('payments').select('id,status,amount,created_at'),c.from('employer_partnership_requests').select('id,organisation_name,status,created_at'),c.from('academy_calendar_events').select('id,title,starts_at,event_type,audience,priority,status,created_at,source_type').eq('status','active').gte('starts_at',now.toISOString()).order('starts_at')]),failed=[en,tk,pay,emp,cal].find(result=>result.error);if(failed)throw failed.error;let items=[];(en.data||[]).filter(x=>['pending','awaiting_review','under_review'].includes(String(x.status||x.enrollment_status||'').toLowerCase())).forEach(x=>items.push({key:`enrolment:${x.id}`,icon:'♙',title:'Enrolment awaiting review',detail:'Student application requires Admissions & Finance review.',tag:'REVIEW',open:'enrolments',date:x.created_at}));(tk.data||[]).filter(x=>!['closed','resolved','solved'].includes(String(x.status||'').toLowerCase())).forEach(x=>items.push({key:`ticket:${x.id}`,icon:'✉',title:x.subject||'Open support ticket',detail:'Student support request requires attention.',tag:String(x.priority||'OPEN').toUpperCase(),open:'support',date:x.created_at}));(pay.data||[]).filter(x=>String(x.status||'').toLowerCase().includes('reject')||String(x.status||'').toLowerCase().includes('fail')).forEach(x=>items.push({key:`payment:${x.id}`,icon:'R',title:'Payment exception',detail:'Failed or rejected payment requires review.',tag:'ACTION',open:'finance',date:x.created_at}));(emp.data||[]).filter(x=>String(x.status||'').toLowerCase()==='new').forEach(x=>items.push({key:`employer:${x.id}`,icon:'🤝',title:x.organisation_name||'New employer enquiry',detail:'New Employer & Industry Partnership enquiry requires review.',tag:'PARTNER',open:'employer-partnerships',date:x.created_at}));const fmt=v=>new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',weekday:'short',day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v));(cal.data||[]).forEach(x=>{const dueSoon=x.starts_at<=dueCutoff,createdRecently=x.created_at&&x.created_at>=createdCutoff;if(!dueSoon&&!createdRecently)return;const dateKey=String(x.starts_at||'').slice(0,10);items.push({key:dueSoon?`calendar-due:${x.id}:${dateKey}`:`calendar-created:${x.id}`,icon:'◷',title:dueSoon?(x.title||'Calendar reminder'):(x.title||'Calendar reminder')+' scheduled',detail:(dueSoon?'Due within 24 hours · ':'Scheduled · ')+fmt(x.starts_at)+' SAST',tag:dueSoon?'DUE SOON':'CALENDAR',open:'executive-calendar',date:dueSoon?x.starts_at:x.created_at})});return items.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}
async function unreadData(items=null){items=items||await getData();if(!user||!items.length)return items;let r=await db.from('admin_notification_read_state').select('notification_key').eq('admin_id',user.id).in('notification_key',items.map(x=>x.key));if(r.error)throw r.error;let read=new Set((r.data||[]).map(x=>x.notification_key));return items.filter(x=>!read.has(x.key))}
function close(){$('ahiPanel')?.classList.remove('open')}
function setCount(n){let c=$('safeCount');if(c){c.textContent=Math.min(99,n);c.style.display=n?'grid':'none'}}
async function refreshCount(force=false){if(refreshing){refreshAgain=refreshAgain||force;return}if(!force&&Date.now()-lastRefresh<1500)return;refreshing=true;try{setCount((await unreadData()).length);lastRefresh=Date.now()}catch(e){console.error('Notification count',e)}finally{refreshing=false;if(refreshAgain){refreshAgain=false;refreshCount(true)}}}
async function markAll(items){if(!user||!items.length){setCount(0);return}let rows=items.map(x=>({admin_id:user.id,notification_key:x.key,read_at:new Date().toISOString()}));let r=await db.from('admin_notification_read_state').upsert(rows,{onConflict:'admin_id,notification_key'});if(r.error)return alert('Could not mark notifications as read: '+r.error.message);setCount(0);await bell(null,true)}
async function markOne(key){if(!user||!key)return false;let r=await db.from('admin_notification_read_state').upsert({admin_id:user.id,notification_key:key,read_at:new Date().toISOString()},{onConflict:'admin_id,notification_key'});if(r.error){console.error('Notification read state',r.error);alert('Could not mark this notification as read: '+r.error.message);return false}await refreshCount(true);return true}
async function bell(e,rerender=false){
  e?.preventDefault();
  e?.stopPropagation();
  let panel=$('ahiPanel');
  if(!panel){
    panel=document.createElement('div');
    panel.id='ahiPanel';
    panel.className='ahiPanel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','Academy notifications');
    document.body.appendChild(panel);
  }
  const opening=rerender||!panel.classList.contains('open');
  document.querySelector('.safeMenu')?.classList.remove('open');
  panel.classList.toggle('open',opening);
  if(!opening)return;
  panel.innerHTML='<div class="ahiHead"><div><h3>Notifications</h3><p>Loading Academy notifications…</p></div></div>';
  try{
    const all=await getData();
    const unread=await unreadData(all);
    setCount(unread.length);
    const unreadKeys=new Set(unread.map(item=>item.key));
    panel.innerHTML=`<div class="ahiHead"><div><h3>Notifications</h3><p>${unread.length} unread · ${all.length} outstanding operational item${all.length===1?'':'s'}.</p></div><div class="ahiBtns">${unread.length?'<button class="ahiRead" id="ahiMarkAll">Mark all as read</button>':''}<button class="ahiClose">Close</button></div></div>${all.length?all.slice(0,30).map(item=>`<div class="ahiItem" data-open="${esc(item.open)}" data-key="${esc(item.key)}"><span class="ahiIcon">${esc(item.icon)}</span><div><b>${esc(item.title)}${unreadKeys.has(item.key)?' · NEW':''}</b><small>${esc(item.detail)}</small></div><span class="ahiTag">${unreadKeys.has(item.key)?'UNREAD':esc(item.tag)}</span></div>`).join(''):'<div class="ahiEmpty">All caught up — there are no outstanding Academy items.</div>'}`;
    panel.querySelector('.ahiClose').onclick=close;
    const markAllButton=$('ahiMarkAll');
    if(markAllButton)markAllButton.onclick=()=>markAll(unread);
    panel.querySelectorAll('[data-open]').forEach(item=>{
      item.onclick=async()=>{
        const destination=item.dataset.open;
        await markOne(item.dataset.key);
        close();
        if(destination==='employer-partnerships'){
          const button=$('employerPartnershipNav');
          if(button)return button.click();
        }
        if(destination==='executive-calendar'){
          location.href='admin-calendar.html';
          return;
        }
        if(typeof window.show==='function')window.show(destination);
        else if(typeof show==='function')show(destination);
      };
    });
  }catch(error){
    console.error('Notifications could not load',error);
    panel.innerHTML='<div class="ahiHead"><div><h3>Notifications</h3><p>Notifications could not refresh. Check your connection and try again.</p></div><div class="ahiBtns"><button class="ahiRead" id="ahiRetry">Retry</button><button class="ahiClose">Close</button></div></div>';
    panel.querySelector('.ahiClose').onclick=close;
    $('ahiRetry').onclick=()=>bell(null,true);
  }
}

function searchCss(){
  if($('ahiSearchCss'))return;
  const s=document.createElement('style');
  s.id='ahiSearchCss';
  s.textContent=`
    .ahiSearchPanel{position:fixed;z-index:40002;display:none;width:min(560px,calc(100vw - 24px));max-height:min(65vh,560px);overflow:auto;background:#fff;color:#142846;border:1px solid #d9c98f;border-radius:14px;box-shadow:0 22px 60px #06142144;padding:8px}
    .ahiSearchPanel.open{display:block}
    .ahiSearchHead{padding:9px 10px 7px;color:#64748b;font-size:12px;line-height:1.4}
    .ahiSearchItem{width:100%;display:grid;grid-template-columns:94px minmax(0,1fr);gap:10px;align-items:start;border:0;border-top:1px solid #ece7dc;background:#fff;padding:11px 10px;text-align:left;color:#142846;cursor:pointer;border-radius:8px}
    .ahiSearchItem:hover,.ahiSearchItem:focus-visible{background:#fff7df;outline:none}
    .ahiSearchType{font-size:11px;font-weight:900;color:#8a640d;letter-spacing:.03em;text-transform:uppercase}
    .ahiSearchText b{display:block;font-size:13px;line-height:1.35}
    .ahiSearchText small{display:block;margin-top:3px;font-size:12px;line-height:1.4;color:#64748b}
    .ahiSearchEmpty{padding:18px 12px;color:#64748b;font-size:13px;line-height:1.5;text-align:center}
    @media(max-width:820px){.ahiSearchPanel{width:calc(100vw - 16px);max-height:62vh}.ahiSearchItem{grid-template-columns:82px minmax(0,1fr)}}
  `;
  document.head.appendChild(s);
}
let searchCache=null,searchCacheAt=0,searchSequence=0;
function lowText(v){return String(v??'').trim().toLowerCase()}
function deletedProfile(p){return /@deleted\.funda\.invalid$/i.test(String(p?.email||''))||/^deleted\s+(student|staff)\s+account$/i.test(String(p?.full_name||'').trim())}
async function liveSearchData(force=false){
  if(searchCache&&!force&&Date.now()-searchCacheAt<60000)return searchCache;
  const c=await client();
  if(!c)throw new Error('Admin data service is unavailable.');
  const [profiles,courses,enrolments]=await Promise.all([
    c.from('profiles').select('id,full_name,email,phone,role,student_number').eq('role','student'),
    c.from('courses').select('id,title,duration,description,active'),
    c.from('enrollments').select('id,student_id,course_id,status,enrollment_status,student:profiles!enrollments_student_id_fkey(id,full_name,email,phone,role,student_number),course:courses!enrollments_course_id_fkey(id,title,duration,active)')
  ]);
  const failed=[profiles,courses,enrolments].find(result=>result.error);
  if(failed)throw failed.error;
  searchCache={
    profiles:(profiles.data||[]).filter(p=>!deletedProfile(p)),
    courses:courses.data||[],
    enrolments:(enrolments.data||[]).filter(en=>!deletedProfile(en.student||{}))
  };
  searchCacheAt=Date.now();
  return searchCache;
}
async function searchRows(query){
  const q=lowText(query);
  if(q.length<2)return[];
  const data=await liveSearchData();
  const results=[];
  data.profiles.forEach(p=>{
    const hay=lowText([p.full_name,p.email,p.phone,p.student_number].join(' '));
    if(hay.includes(q))results.push({kind:'student',label:'Student',title:p.full_name||p.email||'Student',meta:[p.email,p.phone,p.student_number].filter(Boolean).join(' · '),term:p.email||p.full_name||q});
  });
  data.courses.forEach(c=>{
    const hay=lowText([c.title,c.duration,c.description].join(' '));
    if(hay.includes(q))results.push({kind:'course',label:'Course',title:c.title||'Course',meta:[c.duration,c.active===false?'Inactive':'Active'].filter(Boolean).join(' · '),courseId:String(c.id||''),term:c.title||q});
  });
  data.enrolments.forEach(en=>{
    const p=en.student||{},c=en.course||{},status=lowText(en.enrollment_status||en.status||'pending');
    const hay=lowText([p.full_name,p.email,p.phone,p.student_number,c.title,status,en.id].join(' '));
    if(hay.includes(q))results.push({kind:'enrolment',label:'Enrolment',title:p.full_name||p.email||'Student',meta:[c.title,status?status.replaceAll('_',' '):''].filter(Boolean).join(' · '),term:p.email||p.full_name||c.title||q});
  });
  const order={student:0,enrolment:1,course:2};
  results.sort((a,b)=>(order[a.kind]-order[b.kind])||String(a.title).localeCompare(String(b.title)));
  return results.slice(0,14);
}
function positionSearch(panel,input){
  const r=input.getBoundingClientRect();
  const width=Math.min(560,Math.max(300,r.width));
  panel.style.width=Math.min(width,window.innerWidth-16)+'px';
  panel.style.left=Math.max(8,Math.min(r.left,window.innerWidth-Math.min(width,window.innerWidth-16)-8))+'px';
  panel.style.top=Math.min(window.innerHeight-80,r.bottom+8)+'px';
}
function closeSearch(){$('ahiSearchPanel')?.classList.remove('open');$('global')?.setAttribute('aria-expanded','false')}
function filterEnrolments(term){
  let tries=0;
  const apply=()=>{
    tries++;
    const q=$('enSearch');
    if(q){
      q.value=term;
      q.dispatchEvent(new Event('input',{bubbles:true}));
      q.focus({preventScroll:true});
      q.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    if(tries<18)setTimeout(apply,100);
  };
  apply();
}
function focusCourse(title){
  let tries=0;
  const openCourse=()=>{
    tries++;
    const tab=document.querySelector('[data-en-tab="courses"]');
    if(tab){
      tab.click();
      setTimeout(()=>{
        const card=[...document.querySelectorAll('.enCourse')].find(x=>lowText(x.querySelector('h3')?.textContent)===lowText(title));
        if(card){
          card.scrollIntoView({behavior:'smooth',block:'center'});
          const before=card.style.boxShadow;
          card.style.boxShadow='0 0 0 3px #d4aa42';
          setTimeout(()=>{card.style.boxShadow=before},1800);
        }
      },120);
      return;
    }
    if(tries<18)setTimeout(openCourse,100);
  };
  openCourse();
}
function openSearchResult(result){
  closeSearch();
  const navButton=[...document.querySelectorAll('#nav button')].find(b=>b.dataset.s==='enrolments');
  if(navButton)navButton.click();
  else if(typeof window.show==='function')window.show('enrolments');
  else try{show('enrolments')}catch(_){}
  if(result.kind==='course')focusCourse(result.title);
  else filterEnrolments(result.term);
}
async function renderSearch(input){
  searchCss();
  let panel=$('ahiSearchPanel');
  if(!panel){
    panel=document.createElement('div');
    panel.id='ahiSearchPanel';
    panel.className='ahiSearchPanel';
    panel.setAttribute('role','listbox');
    panel.setAttribute('aria-label','Admin search results');
    document.body.appendChild(panel);
  }
  const query=input.value.trim();
  if(!query){closeSearch();return}
  positionSearch(panel,input);
  panel.classList.add('open');
  input.setAttribute('aria-expanded','true');
  if(query.length<2){
    panel.innerHTML='<div class="ahiSearchEmpty">Type at least 2 characters to search students, courses and enrolments.</div>';
    return;
  }
  const sequence=++searchSequence;
  panel.innerHTML='<div class="ahiSearchEmpty">Searching Academy records…</div>';
  try{
    const rows=await searchRows(query);
    if(sequence!==searchSequence||input.value.trim()!==query)return;
    if(!rows.length){
      panel.innerHTML='<div class="ahiSearchEmpty">No matching students, courses or enrolments were found.</div>';
      return;
    }
    panel.innerHTML='<div class="ahiSearchHead">'+rows.length+' result'+(rows.length===1?'':'s')+' shown</div>'+rows.map((r,i)=>'<button type="button" class="ahiSearchItem" data-ahi-search-index="'+i+'" role="option"><span class="ahiSearchType">'+esc(r.label)+'</span><span class="ahiSearchText"><b>'+esc(r.title)+'</b><small>'+esc(r.meta||'')+'</small></span></button>').join('');
    panel.querySelectorAll('[data-ahi-search-index]').forEach(button=>{
      button.onclick=()=>openSearchResult(rows[Number(button.dataset.ahiSearchIndex)]);
    });
  }catch(error){
    console.error('Admin search failed',error);
    if(sequence!==searchSequence)return;
    panel.innerHTML='<div class="ahiSearchEmpty">Search could not load Academy records. Please check your connection and try again.</div>';
  }
}
function wireSearch(){
  const input=$('global');
  if(!input||input.dataset.ahiSearch)return;
  input.dataset.ahiSearch='1';
  input.setAttribute('role','combobox');
  input.setAttribute('aria-autocomplete','list');
  input.setAttribute('aria-controls','ahiSearchPanel');
  input.setAttribute('aria-expanded','false');
  input.setAttribute('autocomplete','off');
  let timer;
  input.addEventListener('input',()=>{
    clearTimeout(timer);
    timer=setTimeout(()=>renderSearch(input),150);
  });
  input.addEventListener('focus',()=>{if(input.value.trim())renderSearch(input)});
  input.addEventListener('keydown',async event=>{
    if(event.key==='Enter'){
      event.preventDefault();
      event.stopImmediatePropagation();
      try{
        const rows=await searchRows(input.value);
        if(rows.length===1)openSearchResult(rows[0]);
        else renderSearch(input);
      }catch(error){
        console.error('Admin search failed',error);
        renderSearch(input);
      }
    }else if(event.key==='Escape'){
      closeSearch();
    }
  },true);
  window.addEventListener('resize',()=>{const panel=$('ahiSearchPanel');if(panel?.classList.contains('open'))positionSearch(panel,input)});
  window.addEventListener('scroll',()=>{const panel=$('ahiSearchPanel');if(panel?.classList.contains('open'))positionSearch(panel,input)},{passive:true});
}
function enhanceProfile(){let p=$('safeProfileBtn');if(!p)return;let profile=p.closest('.safeProfile');if(profile&&!profile.querySelector('.safeRoleMobile')){let role=document.createElement('span');role.className='safeRoleMobile';let desktop=profile.querySelector('.safeId b');role.textContent=desktop?.textContent||'CEO';profile.insertBefore(role,profile.querySelector('#safeChevron')||profile.children[1]||null)}}
function wire(){let b=$('safeBell');if(b&&!b.dataset.ahi){b.dataset.ahi='1';b.onclick=bell;b.setAttribute('aria-label','Open notifications');b.setAttribute('aria-haspopup','dialog');refreshCount(true)}enhanceProfile();let profile=$('safeProfileBtn'),chev=$('safeChevron');[profile,chev].filter(Boolean).forEach(x=>{if(x.dataset.ahi)return;x.dataset.ahi='1';x.addEventListener('click',()=>close())})}
function refreshForeground(){if(!document.hidden)refreshCount(true)}
function init(){css();wire();setTimeout(wireSearch,0);window.FundaAdminNotifications={refresh:()=>refreshCount(true),open:()=>bell(null,true)};setTimeout(()=>refreshCount(true),500);document.addEventListener('funda:admin-manual-refresh',()=>{searchCache=null;searchCacheAt=0;refreshForeground()});window.addEventListener('focus',refreshForeground);window.addEventListener('pageshow',refreshForeground);document.addEventListener('visibilitychange',refreshForeground);new MutationObserver(()=>{wire();wireSearch()}).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(!e.target.closest('#ahiPanel,#safeBell'))close();if(!e.target.closest('#ahiSearchPanel,#global')){closeSearch();$('global')?.setAttribute('aria-expanded','false')}})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
