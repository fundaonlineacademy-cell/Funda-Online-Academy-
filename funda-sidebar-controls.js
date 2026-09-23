// FUNDA ONLINE ACADEMY — CONSISTENT PORTAL SIDEBAR CONTROLS
// Adds persistent desktop collapse/expand behaviour without changing mobile drawers.
(()=>{
  'use strict';
  if(window.__fundaSidebarControls)return;
  window.__fundaSidebarControls=true;

  const page=window.location.pathname.split('/').pop()||'index.html';
  const settings={
    'admin-v2.html':{
      key:'admin',minWidth:821,button:'#menu',panel:'#side',label:'Admin navigation',
      collapsedClass:'funda-admin-sidebar-collapsed'
    },
    'dashboard.html':{
      key:'student',minWidth:1000,button:'#sdMenu',panel:'#sdSide',label:'Student navigation',
      collapsedClass:'funda-student-sidebar-collapsed'
    },
    'ambassador-portal-v2.html':{
      key:'ambassador',minWidth:901,button:'#sideToggle',panel:'.side',label:'Ambassador navigation',
      collapsedClass:'funda-ambassador-sidebar-collapsed'
    },
    'digital-library.html':{
      key:'library',minWidth:1000,button:'#libMenu',panel:'#libSide',label:'Digital Library navigation',
      collapsedClass:'funda-library-sidebar-collapsed'
    },
    'course-study.html':{
      key:'course',minWidth:761,button:'#openModules, #openModulesInner',panel:'#modulePanel',label:'Course modules',
      collapsedClass:'funda-course-sidebar-collapsed'
    }
  };

  const config=settings[page];
  if(!config)return;

  if(config.key==='student'||config.key==='library'){
    let fontLink=document.querySelector('link[data-funda-source-sans-trial]');
    if(!fontLink){
      fontLink=document.createElement('link');
      fontLink.rel='stylesheet';
      fontLink.href='https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800;900&display=swap';
      fontLink.dataset.fundaSourceSansTrial='true';
      document.head.appendChild(fontLink);
    }
  }

  document.documentElement.dataset.fundaSidebarPage=config.key;

  const storageKey=`funda:${config.key}:sidebar`;
  const desktop=()=>window.innerWidth>=config.minWidth;
  const readState=()=>{
    try{return localStorage.getItem(storageKey)==='collapsed'}catch(_){return false}
  };
  const saveState=collapsed=>{
    try{localStorage.setItem(storageKey,collapsed?'collapsed':'expanded')}catch(_){}
  };

  const style=document.createElement('style');
  style.id='fundaSidebarControlStyles';
  style.textContent=`
    :root{--funda-desktop-heading-font:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}
    html[data-funda-sidebar-page="student"] body,
    html[data-funda-sidebar-page="student"] body *,
    html[data-funda-sidebar-page="library"] body,
    html[data-funda-sidebar-page="library"] body *{
      font-family:var(--funda-desktop-heading-font)!important;
    }
    [data-funda-sidebar-control]{cursor:pointer}
    [data-funda-sidebar-control]:focus-visible{outline:3px solid #d4aa42!important;outline-offset:3px!important}

    html[data-funda-sidebar-page="admin"] .fundaAdminLogoutWrap{
      margin:18px 0 4px;padding:13px 5px 0;border-top:1px solid #ead9ad;
    }
    html[data-funda-sidebar-page="admin"] .fundaAdminLogout{
      display:flex;align-items:center;gap:9px;width:100%;min-height:42px;
      border:1px solid #dfc477;border-radius:9px;padding:10px 11px;
      background:#fff8e5;color:#17324a;text-align:left;
      font-family:var(--funda-desktop-heading-font);font-size:12px;font-weight:800;
      cursor:pointer;transition:background .16s ease,border-color .16s ease,transform .16s ease;
    }
    html[data-funda-sidebar-page="admin"] .fundaAdminLogout:hover{
      background:#fff1c7;border-color:#cda642;
    }
    html[data-funda-sidebar-page="admin"] .fundaAdminLogout:active{transform:translateY(1px)}
    html[data-funda-sidebar-page="admin"] .fundaAdminLogout:focus-visible{
      outline:3px solid #d4aa42;outline-offset:2px;
    }
    html[data-funda-sidebar-page="admin"] .fundaAdminLogout:disabled{opacity:.65;cursor:wait}
    html[data-funda-sidebar-page="admin"] .fundaAdminLogoutIcon{
      display:grid;place-items:center;flex:0 0 auto;width:22px;height:22px;
      border-radius:7px;background:#17324a;color:#f6d56d;font-size:13px;line-height:1;
    }

    @media (min-width:821px){
      html[data-funda-sidebar-page="admin"] h1,
      html[data-funda-sidebar-page="admin"] h2,
      html[data-funda-sidebar-page="admin"] h3,
      html[data-funda-sidebar-page="admin"] .nav button{
        font-family:var(--funda-desktop-heading-font)!important;
      }
      html[data-funda-sidebar-page="admin"] #menu{
        display:grid!important;place-items:center;width:42px;height:42px;padding:0!important;
      }
      html[data-funda-sidebar-page="admin"] .side,
      html[data-funda-sidebar-page="admin"] .main{transition:transform .22s ease,visibility .22s ease}
      html.funda-admin-sidebar-collapsed .app{grid-template-columns:0 minmax(0,1fr)!important}
      html.funda-admin-sidebar-collapsed .side{
        transform:translateX(-105%)!important;visibility:hidden!important;pointer-events:none!important;
      }
      html.funda-admin-sidebar-collapsed .main{grid-column:1/-1!important}
    }

    @media (min-width:1000px){
      html[data-funda-sidebar-page="student"] h1,
      html[data-funda-sidebar-page="student"] h2,
      html[data-funda-sidebar-page="student"] h3,
      html[data-funda-sidebar-page="student"] header nav a,
      html[data-funda-sidebar-page="student"] .sdNav a,
      html[data-funda-sidebar-page="student"] .sdNav button{
        font-family:var(--funda-desktop-heading-font)!important;
      }
      html[data-funda-sidebar-page="student"] #sdMenu{display:inline-grid!important}
      html[data-funda-sidebar-page="student"] .sdSide,
      html[data-funda-sidebar-page="student"] body.sdV2>header,
      html[data-funda-sidebar-page="student"] body.sdV2>main,
      html[data-funda-sidebar-page="student"] body.sdV2>footer{
        transition:transform .22s ease,margin-left .22s ease,visibility .22s ease;
      }
      html.funda-student-sidebar-collapsed .sdSide{
        transform:translateX(-105%)!important;visibility:hidden!important;pointer-events:none!important;
      }
      html.funda-student-sidebar-collapsed body.sdV2>header,
      html.funda-student-sidebar-collapsed body.sdV2>main,
      html.funda-student-sidebar-collapsed body.sdV2>footer{margin-left:0!important}

      html[data-funda-sidebar-page="library"] #libMenu{display:grid!important}
      html[data-funda-sidebar-page="library"] .libSide,
      html[data-funda-sidebar-page="library"] body>header,
      html[data-funda-sidebar-page="library"] body>main,
      html[data-funda-sidebar-page="library"] body>header+div{
        transition:transform .22s ease,margin-left .22s ease,visibility .22s ease;
      }
      html.funda-library-sidebar-collapsed .libSide{
        transform:translateX(-105%)!important;visibility:hidden!important;pointer-events:none!important;
      }
      html.funda-library-sidebar-collapsed body>header,
      html.funda-library-sidebar-collapsed body>main,
      html.funda-library-sidebar-collapsed body>header+div{margin-left:0!important}
    }

    @media (min-width:901px){
      html[data-funda-sidebar-page="ambassador"] h1,
      html[data-funda-sidebar-page="ambassador"] h2,
      html[data-funda-sidebar-page="ambassador"] h3,
      html[data-funda-sidebar-page="ambassador"] .navbtn{
        font-family:var(--funda-desktop-heading-font)!important;
      }
      html[data-funda-sidebar-page="ambassador"] #sideToggle{display:grid!important;place-items:center}
      html[data-funda-sidebar-page="ambassador"] .side,
      html[data-funda-sidebar-page="ambassador"] .shell,
      html[data-funda-sidebar-page="ambassador"] .portalFooter{
        transition:transform .22s ease,padding-left .22s ease,margin-left .22s ease,visibility .22s ease;
      }
      html.funda-ambassador-sidebar-collapsed .side{
        transform:translateX(-105%)!important;visibility:hidden!important;pointer-events:none!important;
      }
      html.funda-ambassador-sidebar-collapsed .shell{padding-left:22px!important}
      html.funda-ambassador-sidebar-collapsed .portalFooter{margin-left:0!important}
    }

    @media (min-width:761px){
      html[data-funda-sidebar-page="course"] .mobiletools{display:flex!important}
      html[data-funda-sidebar-page="course"] .mobiletools #scrollNotes,
      html[data-funda-sidebar-page="course"] .mobiletools #scrollNotesInner{display:none!important}
      html[data-funda-sidebar-page="course"] #openModules,
      html[data-funda-sidebar-page="course"] #openModulesInner{display:inline-flex!important;align-items:center;justify-content:center}
      html[data-funda-sidebar-page="course"] .side.left,
      html[data-funda-sidebar-page="course"] .shell{transition:transform .22s ease,visibility .22s ease}
      html.funda-course-sidebar-collapsed .shell{
        grid-template-columns:0 minmax(0,1fr) 290px!important;
      }
      html.funda-course-sidebar-collapsed .side.left{
        transform:translateX(-105%)!important;visibility:hidden!important;pointer-events:none!important;
      }
    }

    @media (min-width:761px) and (max-width:1050px){
      html.funda-course-sidebar-collapsed .shell{grid-template-columns:0 minmax(0,1fr)!important}
    }
  `;
  document.head.appendChild(style);

  function panelId(){
    const panel=document.querySelector(config.panel);
    if(!panel)return '';
    if(!panel.id)panel.id=`funda-${config.key}-sidebar`;
    return panel.id;
  }

  function syncButtons(collapsed){
    const id=panelId();
    document.querySelectorAll(config.button).forEach(button=>{
      button.dataset.fundaSidebarControl='true';
      button.setAttribute('aria-expanded',String(!collapsed));
      if(id)button.setAttribute('aria-controls',id);
      const action=collapsed?'Show':'Hide';
      button.setAttribute('aria-label',`${action} ${config.label}`);
      button.title=`${action} ${config.label}`;
    });
  }

  function mobileOpen(){
    if(config.key==='ambassador')return document.body.classList.contains('amb-nav-open');
    return document.querySelector(config.panel)?.classList.contains('open')||false;
  }

  function syncMobileButtons(){
    const id=panelId(),open=mobileOpen();
    document.querySelectorAll(config.button).forEach(button=>{
      button.dataset.fundaSidebarControl='true';
      button.setAttribute('aria-expanded',String(open));
      if(id)button.setAttribute('aria-controls',id);
      const action=open?'Close':'Open';
      button.setAttribute('aria-label',`${action} ${config.label}`);
      button.title=`${action} ${config.label}`;
    });
  }

  async function writeAdminLogoutAudit(client){
    if(!client)return;
    const timeout=ms=>new Promise(resolve=>setTimeout(()=>resolve(null),ms));
    try{
      const userResult=await Promise.race([
        client.auth?.getUser?.().catch(()=>null),
        timeout(900)
      ]);
      const userId=userResult?.data?.user?.id||null;
      const now=new Date();
      const zaDate=new Intl.DateTimeFormat('en-CA',{
        timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'
      }).format(now);
      const write=client.from('admin_audit_log').insert({
        actor_id:userId,
        action:'Admin logged out',
        department:'IT, Security & Platform',
        entity_type:'session',
        entity_id:userId||'admin-portal',
        details:'Admin session ended through the Admin Command Center logout control.',
        source:'system',
        status:'recorded',
        occurred_on:zaDate
      });
      const result=await Promise.race([write,timeout(1200)]);
      if(result?.error)console.warn('Admin logout audit could not be recorded',result.error);
    }catch(error){
      console.warn('Admin logout audit could not be recorded',error);
    }
  }

  async function signOutAdmin(){
    const button=document.querySelector('[data-funda-admin-logout]');
    if(!window.confirm('Are you sure you want to log out?'))return;
    if(button){
      button.disabled=true;
      button.setAttribute('aria-busy','true');
      const label=button.querySelector('.fundaAdminLogoutLabel');
      if(label)label.textContent='Logging out…';
    }
    try{
      const client=window.__fundaSharedSupabaseClient||window.__fundaSessionClient||(
        window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY
          ? window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY)
          : null
      );
      if(client?.auth){
        await writeAdminLogoutAudit(client);
        try{
          localStorage.removeItem('funda_admin_current_section_v1');
          sessionStorage.removeItem('funda_admin_scroll_v1');
        }catch(_){}
        const result=await client.auth.signOut();
        if(result?.error)throw result.error;
        window.location.replace('login.html');
        return;
      }
      const existing=document.getElementById('safeSignout');
      if(existing){
        existing.click();
        return;
      }
      throw new Error('The secure sign-out service is not available yet.');
    }catch(error){
      console.error('Admin sidebar logout failed',error);
      if(button){
        button.disabled=false;
        button.removeAttribute('aria-busy');
        const label=button.querySelector('.fundaAdminLogoutLabel');
        if(label)label.textContent='Log out';
      }
      window.alert('Log out could not be completed. Please try again.');
    }
  }

  function ensureAdminLogout(){
    if(config.key!=='admin')return;
    const nav=document.querySelector('#nav');
    if(!nav)return;
    let wrap=document.getElementById('fundaAdminLogoutWrap');
    if(!wrap){
      wrap=document.createElement('div');
      wrap.id='fundaAdminLogoutWrap';
      wrap.className='fundaAdminLogoutWrap';
      wrap.innerHTML='<button class="fundaAdminLogout" type="button" data-funda-admin-logout><span class="fundaAdminLogoutIcon" aria-hidden="true">↪</span><span class="fundaAdminLogoutLabel">Log out</span></button>';
      wrap.querySelector('[data-funda-admin-logout]').addEventListener('click',signOutAdmin);
    }
    if(nav.nextElementSibling!==wrap)nav.insertAdjacentElement('afterend',wrap);
  }

  function apply(collapsed,persist=false){
    const useCollapsed=desktop()&&collapsed;
    document.documentElement.classList.toggle(config.collapsedClass,useCollapsed);
    if(desktop())syncButtons(useCollapsed);
    else syncMobileButtons();
    if(persist)saveState(collapsed);
  }

  function toggleDesktop(){
    const collapsed=!document.documentElement.classList.contains(config.collapsedClass);
    apply(collapsed,true);
  }

  function handleToggle(event){
    const button=event.target.closest?.(config.button);
    if(!button)return;
    if(!desktop()){
      setTimeout(syncMobileButtons,0);
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
    toggleDesktop();
  }

  function refresh(){
    if(!document.querySelector(config.button)||!document.querySelector(config.panel))return false;
    ensureAdminLogout();
    apply(readState());
    return true;
  }

  document.addEventListener('click',handleToggle,true);
  document.addEventListener('click',()=>{
    if(!desktop())setTimeout(syncMobileButtons,0);
  });
  window.addEventListener('resize',()=>apply(readState()));

  const start=()=>{
    if(refresh()){
      observeButtons();
      return;
    }
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      if(refresh()){
        clearInterval(timer);
        observeButtons();
      }else if(attempts>=50)clearInterval(timer);
    },100);
  };

  function observeButtons(){
    if(!document.body)return;
    let timer;
    new MutationObserver(()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{
        ensureAdminLogout();
        apply(readState());
      },40);
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
