// FUNDA ONLINE ACADEMY — ADMIN MANUAL REFRESH
// Keeps Admin data fresh without disruptive timed page/dashboard refreshes.
(()=>{
  'use strict';
  if(!/\/admin-v2\.html$/i.test(location.pathname)||window.__fundaAdminManualRefresh)return;
  window.__fundaAdminManualRefresh=true;

  const style=document.createElement('style');
  style.id='fundaAdminManualRefreshStyle';
  style.textContent=`
    #fundaAdminManualRefresh{
      appearance:none;
      border:1px solid rgba(255,255,255,.48);
      background:rgba(255,255,255,.14);
      color:#fff;
      border-radius:9px;
      min-height:38px;
      padding:8px 12px;
      font:800 12px/1.2 Inter,"Segoe UI",Arial,sans-serif;
      white-space:nowrap;
      cursor:pointer;
      transition:background .16s ease,border-color .16s ease,opacity .16s ease;
    }
    #fundaAdminManualRefresh:hover{background:rgba(255,255,255,.22);border-color:rgba(255,255,255,.7)}
    #fundaAdminManualRefresh:focus-visible{outline:3px solid #e2bd62;outline-offset:2px}
    #fundaAdminManualRefresh:disabled{opacity:.62;cursor:wait}
    @media(max-width:560px){
      #fundaAdminManualRefresh{padding:8px 9px;font-size:11px}
    }
  `;
  document.head.appendChild(style);

  function stamp(button){
    const now=new Date();
    button.title='Admin data last refreshed '+now.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'});
  }

  async function refresh(button){
    if(button.disabled)return;
    const previous=button.textContent;
    button.disabled=true;
    button.textContent='Refreshing…';
    const scrollY=window.scrollY;
    try{
      if('onLine' in navigator&&!navigator.onLine)throw new Error('No internet connection.');
      // Keep the current Admin workspace on screen while modules refresh.
      // A transient query failure must never wipe what the CEO is reading.
      document.dispatchEvent(new CustomEvent('funda:admin-manual-refresh',{
        detail:{source:'manual'}
      }));
      stamp(button);
      button.textContent='✓ Refresh requested';
      requestAnimationFrame(()=>window.scrollTo(0,scrollY));
      setTimeout(()=>{button.textContent='↻ Refresh';button.disabled=false;},900);
    }catch(error){
      console.error('Admin manual refresh failed',error);
      button.textContent='Retry Refresh';
      button.disabled=false;
      button.title='Refresh failed. Please try again.';
    }
  }

  function install(){
    const top=document.querySelector('.top');
    if(!top)return false;
    if(document.getElementById('fundaAdminManualRefresh'))return true;
    const button=document.createElement('button');
    button.id='fundaAdminManualRefresh';
    button.type='button';
    button.textContent='↻ Refresh';
    button.setAttribute('aria-label','Refresh Admin portal data');
    button.title='Refresh Admin portal data';
    button.addEventListener('click',()=>refresh(button));
    const who=document.getElementById('who');
    if(who)top.insertBefore(button,who);else top.appendChild(button);
    return true;
  }

  if(!install()){
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      if(install()||attempts>=60)clearInterval(timer);
    },100);
  }
})();