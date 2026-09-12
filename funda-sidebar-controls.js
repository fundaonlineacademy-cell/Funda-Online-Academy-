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
    [data-funda-sidebar-control]{cursor:pointer}
    [data-funda-sidebar-control]:focus-visible{outline:3px solid #d4aa42!important;outline-offset:3px!important}

    @media (min-width:821px){
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
      timer=setTimeout(()=>apply(readState()),40);
    }).observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
