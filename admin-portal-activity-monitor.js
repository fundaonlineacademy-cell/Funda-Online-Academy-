(()=>{
'use strict';
if(window.__fundaAdminPortalActivityMonitor)return;
window.__fundaAdminPortalActivityMonitor=true;

const PAGE_SIZE=10;
const ONLINE_MS=5*60*1000;
const DAY_MS=24*60*60*1000;
const WEEK_MS=7*DAY_MS;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const low=value=>String(value??'').trim().toLowerCase();
let db=null,rows=[],roleFilter='all',searchText='',page=1,loading=false,lastLoadedAt=null;
let channel=null,realtimeTimer=null,minuteTimer=null,mountTimer=null,viewObserver=null;

function dashboardActive(){
  const title=document.querySelector('#view h1');
  return !!title&&/business health overview/i.test(title.textContent||'');
}

function client(){
  if(db)return db;
  if(window.__fundaSharedSupabaseClient)return db=window.__fundaSharedSupabaseClient;
  if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
    db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  }
  return db;
}

function installStyle(){
  if($('foaPamStyle'))return;
  const style=document.createElement('style');
  style.id='foaPamStyle';
  style.textContent=`
    .foaPam{margin:14px 0;background:#fff;border:1px solid #d7e0eb;border-radius:14px;box-shadow:0 8px 24px rgba(7,27,49,.08);overflow:hidden;font-family:inherit}
    .foaPamHead{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:18px 20px;background:linear-gradient(135deg,#061b35,#0d3158);color:#fff}
    .foaPamKicker{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#e6c768}
    .foaPamHead h2{margin:4px 0 3px!important;color:#fff!important;font-size:21px!important;line-height:1.2}
    .foaPamHead p{margin:0;color:#d7e3f0;font-size:14px;line-height:1.45}
    .foaPamLiveRule{max-width:280px;border:1px solid rgba(230,199,104,.38);border-radius:10px;background:rgba(255,255,255,.08);padding:10px 12px;color:#f5e7b7;font-size:13px;line-height:1.4}
    .foaPamBody{padding:18px 20px 20px}
    .foaPamMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
    .foaPamMetric{border:1px solid #dfe6ef;border-radius:11px;background:#f8fafc;padding:12px 13px}
    .foaPamMetric b{display:block;color:#071b31;font-size:23px;line-height:1}
    .foaPamMetric span{display:block;margin-top:6px;color:#52647a;font-size:14px;font-weight:700;line-height:1.3}
    .foaPamMetric.online{border-color:#a9d9c3;background:#eef9f3}.foaPamMetric.online b{color:#0b6a48}
    .foaPamControls{display:grid;grid-template-columns:minmax(220px,1fr) minmax(170px,220px) auto;gap:10px;align-items:center;margin-bottom:12px}
    .foaPamInput,.foaPamSelect{width:100%;min-height:42px;border:1px solid #cfd9e5;border-radius:10px;background:#fff;color:#10243e;padding:9px 12px;font-family:inherit;font-size:14px;font-weight:600}
    .foaPamInput:focus,.foaPamSelect:focus{outline:3px solid rgba(31,95,169,.14);border-color:#2a64a6}
    .foaPamRefresh{min-height:42px;border:0;border-radius:10px;background:#cfa42c;color:#071b31;padding:9px 15px;font-family:inherit;font-size:14px;font-weight:900;cursor:pointer;white-space:nowrap}
    .foaPamRefresh:disabled{opacity:.6;cursor:wait}
    .foaPamMessage{display:none;margin-bottom:12px;border:1px solid #edcf86;border-radius:9px;background:#fff8e6;color:#72530b;padding:10px 12px;font-size:14px;line-height:1.45}
    .foaPamTableWrap{overflow-x:auto;border:1px solid #dfe6ef;border-radius:11px}
    .foaPamTable{width:100%;border-collapse:collapse;min-width:820px;background:#fff}
    .foaPamTable th{background:#edf3f8;color:#243b58;text-align:left;padding:11px 12px;font-size:13px;letter-spacing:.02em;border-bottom:1px solid #dce5ef}
    .foaPamTable td{padding:12px;border-bottom:1px solid #edf1f5;vertical-align:top;color:#33465e;font-size:14px;line-height:1.35}
    .foaPamTable tr:last-child td{border-bottom:0}.foaPamPerson b{display:block;color:#0b2341;font-size:14px}.foaPamPerson span{display:block;margin-top:2px;color:#66778b;font-size:13px;overflow-wrap:anywhere}
    .foaPamRole{display:inline-flex;border-radius:999px;padding:5px 8px;background:#eaf0f7;color:#183a63;font-size:12px;font-weight:900;text-transform:capitalize}
    .foaPamStatus{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 8px;background:#eef1f5;color:#4b5b70;font-size:12px;font-weight:900;white-space:nowrap}
    .foaPamStatus:before{content:"";width:7px;height:7px;border-radius:50%;background:#8a98aa}.foaPamStatus.online{background:#e8f7ef;color:#0d6c49}.foaPamStatus.online:before{background:#16a16d}.foaPamStatus.today{background:#eaf2ff;color:#1859a8}.foaPamStatus.today:before{background:#2c73c7}.foaPamStatus.inactive{background:#fff3dc;color:#865b08}.foaPamStatus.inactive:before{background:#d09319}.foaPamStatus.locked{background:#fdeaea;color:#9a3030}.foaPamStatus.locked:before{background:#c83c3c}
    .foaPamDate{color:#203a58;font-weight:700}.foaPamDate small{display:block;margin-top:2px;color:#728196;font-size:12px;font-weight:600}
    .foaPamEmpty{padding:24px;text-align:center;color:#718197;font-size:14px;line-height:1.5}
    .foaPamFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;color:#64758a;font-size:13px}
    .foaPamPager{display:flex;align-items:center;gap:8px}.foaPamPager button{border:1px solid #cfdae6;border-radius:8px;background:#fff;color:#173553;padding:8px 11px;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer}.foaPamPager button:disabled{opacity:.45;cursor:not-allowed}
    @media(max-width:1050px){.foaPamMetrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:720px){.foaPamHead{flex-direction:column}.foaPamLiveRule{max-width:none;width:100%}.foaPamBody{padding:14px}.foaPamControls{grid-template-columns:1fr}.foaPamMetrics{grid-template-columns:1fr 1fr}.foaPamTable{min-width:0}.foaPamTable thead{display:none}.foaPamTable,.foaPamTable tbody,.foaPamTable tr,.foaPamTable td{display:block;width:100%}.foaPamTable tr{padding:12px;border-bottom:1px solid #dfe6ef}.foaPamTable tr:last-child{border-bottom:0}.foaPamTable td{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;padding:7px 0;border:0}.foaPamTable td:before{content:attr(data-label);font-size:12px;font-weight:900;color:#61748b}.foaPamFooter{align-items:flex-start;flex-direction:column}.foaPamPager{width:100%;justify-content:space-between}}
    @media(max-width:420px){.foaPamMetrics{grid-template-columns:1fr}.foaPamHead h2{font-size:19px!important}}
  `;
  document.head.appendChild(style);
}

function shell(){
  const section=document.createElement('section');
  section.id='foaPortalActivityMonitor';
  section.className='foaPam';
  section.innerHTML=`
    <div class="foaPamHead">
      <div><div class="foaPamKicker">CEO OPERATIONAL OVERSIGHT</div><h2>Portal Activity Monitor</h2><p>Students, Ambassadors and Staff — current presence, last portal use and last login.</p></div>
      <div class="foaPamLiveRule">Online means the person reported portal activity within the past 5 minutes.</div>
    </div>
    <div class="foaPamBody">
      <div class="foaPamMetrics" id="foaPamMetrics"></div>
      <div class="foaPamControls">
        <input id="foaPamSearch" class="foaPamInput" type="search" autocomplete="off" placeholder="Search name or email" aria-label="Search portal activity">
        <select id="foaPamRole" class="foaPamSelect" aria-label="Filter portal activity by role"><option value="all">All portal users</option><option value="student">Students</option><option value="ambassador">Ambassadors</option><option value="staff">Staff</option></select>
        <button id="foaPamRefresh" class="foaPamRefresh" type="button">Refresh Activity</button>
      </div>
      <div id="foaPamMessage" class="foaPamMessage" role="status"></div>
      <div id="foaPamResults"></div>
      <div class="foaPamFooter"><span id="foaPamRange">Loading portal activity…</span><div class="foaPamPager"><button id="foaPamPrev" type="button">Previous</button><span id="foaPamPage">Page 1 of 1</span><button id="foaPamNext" type="button">Next</button></div></div>
    </div>`;
  return section;
}

function accountActive(row){return !['deactivated','deleted','disabled','suspended'].includes(low(row.account_status))}
function millis(value){const t=value?new Date(value).getTime():0;return Number.isFinite(t)?t:0}

function activityStatus(row){
  if(!accountActive(row))return {label:'Account '+(low(row.account_status)||'inactive'),className:'locked'};
  const now=Date.now(),seen=millis(row.last_seen_at),active=millis(row.last_active_at),login=millis(row.last_login_at);
  if(seen&&now-seen<=ONLINE_MS)return {label:'Online now',className:'online'};
  if(active&&now-active<=DAY_MS)return {label:'Active in 24h',className:'today'};
  if(active&&now-active<=WEEK_MS)return {label:'Recently active',className:''};
  if(active)return {label:'Inactive 7+ days',className:'inactive'};
  if(login)return {label:'Activity not recorded',className:'inactive'};
  return {label:'Never logged in',className:'inactive'};
}

function formatDate(value){
  if(!value)return 'Not recorded';
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return 'Not recorded';
  return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
}

function relative(value){
  const time=millis(value);
  if(!time)return '';
  const diff=Math.max(0,Date.now()-time),minutes=Math.floor(diff/60000);
  if(minutes<1)return 'Just now';
  if(minutes<60)return `${minutes} min ago`;
  const hours=Math.floor(minutes/60);
  if(hours<24)return `${hours} hr${hours===1?'':'s'} ago`;
  const days=Math.floor(hours/24);
  return `${days} day${days===1?'':'s'} ago`;
}

function filteredRows(){
  const query=low(searchText);
  return rows.filter(row=>{
    if(roleFilter!=='all'&&low(row.role)!==roleFilter)return false;
    if(!query)return true;
    const status=activityStatus(row).label;
    return [row.full_name,row.email,row.role,row.last_portal_area,status].some(value=>low(value).includes(query));
  });
}

function metrics(){
  const activeAccounts=rows.filter(accountActive),now=Date.now();
  const online=activeAccounts.filter(row=>millis(row.last_seen_at)&&now-millis(row.last_seen_at)<=ONLINE_MS).length;
  const today=activeAccounts.filter(row=>millis(row.last_active_at)&&now-millis(row.last_active_at)<=DAY_MS).length;
  const inactive=activeAccounts.filter(row=>millis(row.last_active_at)&&now-millis(row.last_active_at)>WEEK_MS).length;
  const never=activeAccounts.filter(row=>!millis(row.last_login_at)).length;
  return `<article class="foaPamMetric online"><b>${online}</b><span>Online Now</span></article><article class="foaPamMetric"><b>${today}</b><span>Active in 24 Hours</span></article><article class="foaPamMetric"><b>${inactive}</b><span>Inactive 7+ Days</span></article><article class="foaPamMetric"><b>${never}</b><span>Never Logged In</span></article>`;
}

function render(){
  const root=$('foaPortalActivityMonitor');
  if(!root||!dashboardActive())return;
  const list=filteredRows(),pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));
  page=Math.min(Math.max(1,page),pages);
  const start=(page-1)*PAGE_SIZE,visible=list.slice(start,start+PAGE_SIZE);
  $('foaPamMetrics').innerHTML=metrics();
  $('foaPamResults').innerHTML=visible.length?`<div class="foaPamTableWrap"><table class="foaPamTable"><thead><tr><th>Person</th><th>Role</th><th>Portal Status</th><th>Last Portal Use</th><th>Last Login</th><th>Portal</th></tr></thead><tbody>${visible.map(row=>{
    const status=activityStatus(row);
    return `<tr><td data-label="Person"><div class="foaPamPerson"><b>${esc(row.full_name||'Name not recorded')}</b><span>${esc(row.email||'Email not recorded')}</span></div></td><td data-label="Role"><span class="foaPamRole">${esc(row.role||'—')}</span></td><td data-label="Portal Status"><span class="foaPamStatus ${status.className}">${esc(status.label)}</span></td><td data-label="Last Portal Use"><span class="foaPamDate">${esc(formatDate(row.last_active_at))}<small>${esc(relative(row.last_active_at))}</small></span></td><td data-label="Last Login"><span class="foaPamDate">${esc(formatDate(row.last_login_at))}<small>${esc(relative(row.last_login_at))}</small></span></td><td data-label="Portal">${esc(row.last_portal_area||'Not recorded yet')}</td></tr>`;
  }).join('')}</tbody></table></div>`:'<div class="foaPamEmpty">No portal users match this search or role filter.</div>';
  $('foaPamRange').textContent=list.length?`Showing ${start+1}–${Math.min(start+PAGE_SIZE,list.length)} of ${list.length}${lastLoadedAt?' · Updated '+relative(lastLoadedAt):''}`:`0 matching users${lastLoadedAt?' · Updated '+relative(lastLoadedAt):''}`;
  $('foaPamPage').textContent=`Page ${page} of ${pages}`;
  $('foaPamPrev').disabled=page<=1;
  $('foaPamNext').disabled=page>=pages;
}

function setMessage(text){
  const box=$('foaPamMessage');
  if(!box)return;
  box.textContent=text||'';
  box.style.display=text?'block':'none';
}

function wire(root){
  root.querySelector('#foaPamSearch').addEventListener('input',event=>{searchText=event.target.value;page=1;render()});
  root.querySelector('#foaPamRole').addEventListener('change',event=>{roleFilter=event.target.value;page=1;render()});
  root.querySelector('#foaPamRefresh').addEventListener('click',()=>loadRows(true));
  root.querySelector('#foaPamPrev').addEventListener('click',()=>{if(page>1){page--;render()}});
  root.querySelector('#foaPamNext').addEventListener('click',()=>{const pages=Math.max(1,Math.ceil(filteredRows().length/PAGE_SIZE));if(page<pages){page++;render()}});
}

function place(){
  if(!dashboardActive()){$('foaPortalActivityMonitor')?.remove();return false}
  if($('foaPortalActivityMonitor'))return true;
  const host=$('view'),dashboard=document.querySelector('#view .execSafe');
  if(!host||!dashboard)return false;
  const section=shell();
  const snapshot=$('ceoActionSnapshot');
  const main=dashboard.querySelector('.execMain2,.execMain');
  if(snapshot&&main?.contains(snapshot))snapshot.insertAdjacentElement('beforebegin',section);
  else if(main)main.insertAdjacentElement('beforeend',section);
  else return false;
  wire(section);
  render();
  return true;
}

function startRealtime(){
  if(channel)return;
  const c=client();
  if(!c)return;
  channel=c.channel('ceo-portal-activity-monitor-v1')
    .on('postgres_changes',{event:'*',schema:'public',table:'portal_user_activity'},()=>{
      clearTimeout(realtimeTimer);
      realtimeTimer=setTimeout(()=>{if(dashboardActive())loadRows(false)},250);
    })
    .subscribe(status=>{
      window.__fundaPortalActivityRealtimeStatus=status;
      if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('Portal Activity Realtime status:',status);
    });
}

async function loadRows(manual=false){
  if(loading)return;
  if(!place()&&!dashboardActive())return;
  const c=client();
  if(!c){setMessage('Portal activity is temporarily unavailable. The current dashboard remains unchanged.');return}
  loading=true;
  const refresh=$('foaPamRefresh');
  if(refresh){refresh.disabled=true;refresh.textContent='Refreshing…'}
  try{
    const result=await c.rpc('ceo_get_portal_activity');
    if(result.error)throw result.error;
    rows=Array.isArray(result.data)?result.data:[];
    lastLoadedAt=new Date().toISOString();
    setMessage('');
    startRealtime();
    render();
  }catch(error){
    console.error('CEO Portal Activity Monitor',error);
    if(String(error?.code||'')==='42501'){
      $('foaPortalActivityMonitor')?.remove();
      return;
    }
    setMessage(rows.length?'The latest update could not be loaded. The last successful information remains visible.':'Portal activity could not load. Use Refresh Activity to try again.');
    render();
  }finally{
    loading=false;
    const button=$('foaPamRefresh');
    if(button){button.disabled=false;button.textContent='Refresh Activity'}
  }
}

function scheduleMount(){
  [180,550,1100,2100].forEach(delay=>setTimeout(()=>{if(dashboardActive()){place();if(!lastLoadedAt)loadRows(false)}},delay));
}

function boot(){
  installStyle();
  document.addEventListener('click',event=>{const button=event.target.closest?.('#nav button,.nav button');if(button){if(/dashboard/i.test(button.textContent||''))scheduleMount();else $('foaPortalActivityMonitor')?.remove()}},true);
  document.addEventListener('funda:admin-manual-refresh',()=>{if(dashboardActive()){place();loadRows(true)}});
  document.addEventListener('funda:admin-live-change',()=>{if(dashboardActive())place()});
  window.addEventListener('focus',()=>{if(dashboardActive())loadRows(false)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&dashboardActive())loadRows(false)});
  const view=$('view');
  if(view){
    viewObserver=new MutationObserver(()=>{
      if(!dashboardActive()||$('foaPortalActivityMonitor'))return;
      clearTimeout(mountTimer);
      mountTimer=setTimeout(()=>{if(dashboardActive()){place();loadRows(false)}},140);
    });
    viewObserver.observe(view,{childList:true});
  }
  minuteTimer=setInterval(()=>{if(dashboardActive())render()},60000);
  window.addEventListener('beforeunload',()=>{if(minuteTimer)clearInterval(minuteTimer);if(mountTimer)clearTimeout(mountTimer);viewObserver?.disconnect();if(channel&&db)db.removeChannel(channel)});
  scheduleMount();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
