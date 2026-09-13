// FUNDA ONLINE ACADEMY — ADMIN STAFF IDENTITY
// Keeps the header controls right-aligned and adds a live staff identity card
// to the admin navigation without changing the existing notification workflow.
(()=>{
  'use strict';
  if(!/admin-v2\.html$/i.test(window.location.pathname))return;
  if(window.__fundaAdminStaffIdentity)return;
  window.__fundaAdminStaffIdentity=true;

  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const text=value=>String(value??'').trim();
  const initials=value=>{
    const letters=text(value).split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('');
    return (letters||'S').toUpperCase();
  };

  let identity=null;
  let client=null;

  function installStyles(){
    if($('adminStaffIdentityStyles'))return;
    const style=document.createElement('style');
    style.id='adminStaffIdentityStyles';
    style.textContent=`
      html body .top{padding-right:12px!important}
      html body .top #who{
        display:block!important;
        flex:0 0 auto!important;
        width:auto!important;
        max-width:none!important;
        min-width:0!important;
        margin-left:auto!important;
      }
      html body .top #who .safeTop{
        width:auto!important;
        max-width:100%!important;
        margin-left:0!important;
        justify-content:flex-end!important;
      }
      html body .top #who .safeProfile{min-width:0!important}
      #safeChevron{
        display:grid!important;
        place-items:center!important;
        flex:0 0 auto!important;
        width:32px!important;
        height:32px!important;
        padding:0!important;
        border-radius:9px!important;
        color:#f4df9d!important;
        transition:background .16s ease!important;
      }
      #safeChevron:hover,#safeChevron:focus-visible{background:rgba(255,255,255,.11)!important}
      #safeChevron:focus-visible{outline:2px solid #e2bc55!important;outline-offset:1px!important}
      #safeChevron svg{width:16px;height:16px;display:block;transition:transform .18s ease}
      #safeChevron[aria-expanded="true"] svg{transform:rotate(180deg)}
      .adminStaffIdentity{
        padding:20px 8px 18px;
        border-bottom:1px solid #ead9ad;
        color:#17324a;
      }
      .adminStaffPerson{display:flex;align-items:center;gap:12px;min-width:0}
      .adminStaffAvatar{
        display:grid;place-items:center;flex:0 0 auto;
        width:54px;height:54px;border-radius:50%;
        background:linear-gradient(135deg,#e8bd51,#f5dc8d);
        color:#17324a;font:800 18px Montserrat,Inter,Arial,sans-serif;
        box-shadow:0 5px 14px rgba(181,130,20,.16);
      }
      .adminStaffDetails{min-width:0}
      .adminStaffDetails b{
        display:block;overflow-wrap:anywhere;
        color:#17324a;font:800 14px/1.3 Montserrat,Inter,Arial,sans-serif;
      }
      .adminStaffDetails small{
        display:block;margin-top:4px;overflow-wrap:anywhere;
        color:#455565;font:700 10px/1.4 Inter,Arial,sans-serif;
      }
      .adminStaffDepartment{
        display:inline-flex;margin-top:7px;padding:4px 7px;border-radius:999px;
        background:#fff3ce;color:#795508;
        font:900 8px/1.2 Inter,Arial,sans-serif;letter-spacing:.04em;
      }
      .adminStaffReports{
        margin-top:14px;padding:10px 11px;border:1px solid #e5d29c;border-radius:11px;
        background:rgba(255,255,255,.72);
      }
      .adminStaffReports span{
        display:block;color:#9a6c0d;
        font:900 8px/1.2 Inter,Arial,sans-serif;letter-spacing:.14em;
      }
      .adminStaffReports strong{
        display:block;margin-top:4px;overflow-wrap:anywhere;
        color:#17324a;font:800 10px/1.45 Inter,Arial,sans-serif;
      }
      .safeMenu .adminStaffMenuReport{
        padding:8px 9px;border-radius:8px;background:#fff7df;
        color:#6f5315!important;font-weight:800!important;line-height:1.4;
      }
      @media(max-width:820px){
        html body .top{padding-right:8px!important}
        html body .top #who .safeTop{gap:6px!important}
        #safeChevron{width:29px!important;height:34px!important}
        .adminStaffIdentity{padding:18px 8px 16px}
      }
    `;
    document.head.appendChild(style);
  }

  function isChiefExecutive(position){
    return /(^|\s)(ceo|chief executive officer)(\s|$)/i.test(text(position));
  }

  function reportingLine(position,leaders,currentId){
    if(isChiefExecutive(position))return 'Academy Governance';
    const chief=(leaders||[]).find(person=>
      person.id!==currentId&&isChiefExecutive(person.job_title)
    );
    if(!chief)return 'Chief Executive Officer';
    const chiefName=text(chief.full_name);
    const chiefPosition=text(chief.job_title)||'Chief Executive Officer';
    return chiefName?`${chiefName} · ${chiefPosition}`:chiefPosition;
  }

  function renderSidebar(){
    if(!identity)return;
    const side=$('side');
    const brand=side?.querySelector('.brand');
    const nav=$('nav');
    if(!side||!brand||!nav)return;
    let card=$('adminStaffIdentity');
    if(!card){
      card=document.createElement('section');
      card.id='adminStaffIdentity';
      card.className='adminStaffIdentity';
      card.setAttribute('aria-label','Signed-in staff member');
      side.insertBefore(card,nav);
    }
    const renderKey=[identity.name,identity.position,identity.department,identity.reportsTo].join('|');
    if(card.dataset.renderKey===renderKey)return;
    card.dataset.renderKey=renderKey;
    card.innerHTML=`
      <div class="adminStaffPerson">
        <div class="adminStaffAvatar" aria-hidden="true">${esc(initials(identity.name))}</div>
        <div class="adminStaffDetails">
          <b>${esc(identity.name)}</b>
          <small>${esc(identity.position)}</small>
          <span class="adminStaffDepartment">${esc(identity.department)}</span>
        </div>
      </div>
      <div class="adminStaffReports">
        <span>REPORTS TO</span>
        <strong>${esc(identity.reportsTo)}</strong>
      </div>`;
  }

  function syncChevron(){
    const button=$('safeChevron');
    const menu=$('safeMenu');
    if(!button)return;
    const open=Boolean(menu?.classList.contains('open'));
    button.setAttribute('aria-expanded',String(open));
    button.setAttribute('aria-controls','safeMenu');
    button.setAttribute('aria-label',open?'Close account menu':'Open account menu');
  }

  function improveChevron(){
    const button=$('safeChevron');
    if(!button)return;
    if(!button.dataset.fundaChevron){
      button.dataset.fundaChevron='true';
      button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6.5 9 5.5 5.5L17.5 9" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      button.addEventListener('click',()=>setTimeout(syncChevron,0));
    }
    const profile=$('safeProfileBtn');
    if(profile&&!profile.dataset.fundaIdentitySync){
      profile.dataset.fundaIdentitySync='true';
      profile.addEventListener('click',()=>setTimeout(syncChevron,0));
    }
    const menu=$('safeMenu');
    if(menu&&!menu.dataset.fundaIdentitySync){
      menu.dataset.fundaIdentitySync='true';
      new MutationObserver(syncChevron).observe(menu,{attributes:true,attributeFilter:['class']});
    }
    syncChevron();
  }

  function enhanceAccountMenu(){
    if(!identity)return;
    const menu=$('safeMenu');
    const signout=$('safeSignout');
    if(!menu||!signout)return;
    let report=menu.querySelector('.adminStaffMenuReport');
    if(!report){
      report=document.createElement('span');
      report.className='adminStaffMenuReport';
      menu.insertBefore(report,signout);
    }
    const reportText=`Reports to: ${identity.reportsTo}`;
    if(report.textContent!==reportText)report.textContent=reportText;
  }

  function enhance(){
    improveChevron();
    renderSidebar();
    enhanceAccountMenu();
  }

  async function getClient(){
    if(client)return client;
    for(let attempt=0;attempt<50;attempt++){
      if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
        client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
        return client;
      }
      await new Promise(resolve=>setTimeout(resolve,100));
    }
    return null;
  }

  async function loadIdentity(){
    try{
      const db=await getClient();
      if(!db)return;
      let auth=await db.auth.getUser();
      let user=auth.data?.user||null;
      if(!user){
        const session=await db.auth.getSession();
        user=session.data?.session?.user||null;
      }
      if(!user)return;

      const [profileResult,staffResult,leadersResult]=await Promise.all([
        db.from('profiles').select('id,full_name,email,job_title,department,role').eq('id',user.id).maybeSingle(),
        db.from('staff_records').select('profile_id,job_title,department,employment_status').eq('profile_id',user.id).maybeSingle(),
        db.from('profiles').select('id,full_name,job_title,department,role').eq('role','admin')
      ]);
      const profile=profileResult.data||{};
      const staff=staffResult.data||{};
      const metadata=user.user_metadata||{};
      const position=text(profile.job_title)||text(staff.job_title)||text(metadata.job_title)||'Administrator';
      const department=text(profile.department)||text(staff.department)||text(metadata.department)||'Administration';
      const email=text(profile.email)||text(user.email);
      const fallbackName=email?email.split('@')[0].replace(/[._-]+/g,' '):'Staff Member';
      const name=text(profile.full_name)||text(metadata.full_name)||fallbackName;
      identity={
        name,
        position,
        department,
        reportsTo:reportingLine(position,leadersResult.data||[],user.id)
      };
      enhance();
    }catch(error){
      console.error('Admin staff identity could not load',error);
    }
  }

  function start(){
    installStyles();
    enhance();
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;enhance()});
    }).observe(document.body,{childList:true,subtree:true});
    loadIdentity();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
