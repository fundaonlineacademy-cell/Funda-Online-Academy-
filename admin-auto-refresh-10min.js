// FUNDA ONLINE ACADEMY — ADMIN 10-MINUTE AUTO REFRESH
// One automatic Admin refresh interval only. No 30-second dashboard timer.
(()=>{
  'use strict';
  if(!/\/admin-v2\.html$/i.test(location.pathname)||window.__fundaAdminAutoRefresh10Min)return;
  window.__fundaAdminAutoRefresh10Min=true;

  const REFRESH_MS=10*60*1000;
  let busy=false;

  async function refreshAdmin(){
    if(busy||typeof window.load!=='function')return;
    busy=true;
    const scrollY=window.scrollY;
    try{
      await window.load();
      document.dispatchEvent(new CustomEvent('funda:admin-manual-refresh'));
      requestAnimationFrame(()=>window.scrollTo(0,scrollY));
    }catch(error){
      console.error('Admin 10-minute auto refresh failed',error);
    }finally{
      busy=false;
    }
  }

  window.__fundaAdminAutoRefreshTimer=setInterval(refreshAdmin,REFRESH_MS);
})();
