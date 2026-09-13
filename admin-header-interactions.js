(()=>{
if(!/admin-v2\.html$/i.test(location.pathname))return;
if(window.__fundaAdminHeaderInteractions)return;
window.__fundaAdminHeaderInteractions=true;
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));let db,user,refreshing=false,refreshAgain=false,lastRefresh=0;
function css(){if($('ahiCss'))return;let s=document.createElement('style');s.id='ahiCss';s.textContent=`.ahiPanel{display:none;position:fixed;z-index:40000;right:12px;top:76px;width:min(410px,calc(100vw - 24px));max-height:72vh;overflow:auto;background:#fffaf0;color:#142846;border:1px solid #dbc98f;border-radius:16px;box-shadow:0 22px 60px #06142155;padding:14px}.ahiPanel.open{display:block}.ahiHead{display:flex;justify-content:space-between;align-items:start;gap:10px}.ahiPanel h3{margin:0 0 4px;font-size:15px}.ahiPanel p{margin:0 0 10px;font-size:10px;color:#748197}.ahiBtns{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.ahiClose,.ahiRead{border:0;border-radius:8px;padding:6px 9px;font-weight:800;font-size:9px;cursor:pointer}.ahiClose{background:#142846;color:#fff}.ahiRead{background:#ead18b;color:#142846}.ahiItem{display:grid;grid-template-columns:28px 1fr auto;gap:8px;padding:11px 4px;border-top:1px solid #ece5d8;align-items:start;cursor:pointer}.ahiIcon{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#fff0c9}.ahiItem b{font-size:10px}.ahiItem small{display:block;font-size:9px;color:#6e7d92;margin-top:2px}.ahiTag{font-size:8px;font-weight:900;background:#fff0d6;color:#8a5a05;padding:4px 6px;border-radius:99px}.ahiEmpty{padding:18px 5px;text-align:center;color:#6e7d92;font-size:10px}.safeRoleMobile{display:none;color:#fff;font-size:11px;font-weight:900;white-space:nowrap}.safeMenu{z-index:40001!important}@media(max-width:820px){.safeTop{gap:7px!important}.safeAvatar{width:36px!important;height:36px!important}.safeProfile{gap:5px!important}.safeRoleMobile{display:block}.safeId{display:none!important}.safeProfile>button:last-of-type{font-size:18px;padding:8px 3px!important}.safeMenu{position:fixed!important;right:10px!important;top:76px!important;width:min(300px,calc(100vw - 20px))!important}.ahiPanel{right:8px;top:76px;width:calc(100vw - 16px);box-sizing:border-box;max-height:76vh}}`;document.head.appendChild(s)}
async function client(){db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);if(!db)return null;if(!user){let u=await db.auth.getUser();user=u.data?.user||null}return db}
async function getData(){let c=await client();if(!c)return[];let [en,tk,pay,emp]=await Promise.all([c.from('enrollments').select('id,status,enrollment_status,created_at'),c.from('support_tickets').select('id,subject,status,priority,created_at'),c.from('payments').select('id,status,amount,created_at'),c.from('employer_partnership_requests').select('id,organisation_name,status,created_at')]),failed=[en,tk,pay,emp].find(result=>result.error);if(failed)throw failed.error;let items=[];(en.data||[]).filter(x=>['pending','awaiting_review','under_review'].includes(String(x.status||x.enrollment_status||'').toLowerCase())).forEach(x=>items.push({key:`enrolment:${x.id}`,icon:'♙',title:'Enrolment awaiting review',detail:'Student application requires Admissions & Finance review.',tag:'REVIEW',open:'enrolments',date:x.created_at}));(tk.data||[]).filter(x=>!['closed','resolved','solved'].includes(String(x.status||'').toLowerCase())).forEach(x=>items.push({key:`ticket:${x.id}`,icon:'✉',title:x.subject||'Open support ticket',detail:'Student support request requires attention.',tag:String(x.priority||'OPEN').toUpperCase(),open:'support',date:x.created_at}));(pay.data||[]).filter(x=>String(x.status||'').toLowerCase().includes('reject')||String(x.status||'').toLowerCase().includes('fail')).forEach(x=>items.push({key:`payment:${x.id}`,icon:'R',title:'Payment exception',detail:'Failed or rejected payment requires review.',tag:'ACTION',open:'finance',date:x.created_at}));(emp.data||[]).filter(x=>String(x.status||'').toLowerCase()==='new').forEach(x=>items.push({key:`employer:${x.id}`,icon:'🤝',title:x.organisation_name||'New employer enquiry',detail:'New Employer & Industry Partnership enquiry requires review.',tag:'PARTNER',open:'employer-partnerships',date:x.created_at}));return items.sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))}
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
function enhanceProfile(){let p=$('safeProfileBtn');if(!p)return;let profile=p.closest('.safeProfile');if(profile&&!profile.querySelector('.safeRoleMobile')){let role=document.createElement('span');role.className='safeRoleMobile';let desktop=profile.querySelector('.safeId b');role.textContent=desktop?.textContent||'CEO';profile.insertBefore(role,profile.querySelector('#safeChevron')||profile.children[1]||null)}}
function wire(){let b=$('safeBell');if(b&&!b.dataset.ahi){b.dataset.ahi='1';b.onclick=bell;b.setAttribute('aria-label','Open notifications');b.setAttribute('aria-haspopup','dialog');refreshCount(true)}enhanceProfile();let profile=$('safeProfileBtn'),chev=$('safeChevron');[profile,chev].filter(Boolean).forEach(x=>{if(x.dataset.ahi)return;x.dataset.ahi='1';x.addEventListener('click',()=>close())})}
function refreshForeground(){if(!document.hidden)refreshCount(true)}
function init(){css();wire();window.FundaAdminNotifications={refresh:()=>refreshCount(true),open:()=>bell(null,true)};setTimeout(()=>refreshCount(true),500);setInterval(refreshForeground,30000);window.addEventListener('focus',refreshForeground);window.addEventListener('pageshow',refreshForeground);document.addEventListener('visibilitychange',refreshForeground);new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',e=>{if(!e.target.closest('#ahiPanel,#safeBell'))close()})}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
