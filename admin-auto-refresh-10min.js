// FUNDA ONLINE ACADEMY — ADMIN 10-MINUTE AUTO REFRESH
// One automatic Admin refresh interval only. No 30-second dashboard timer.
(()=>{
  'use strict';
  if(!/\/admin-v2\.html$/i.test(location.pathname)||window.__fundaAdminAutoRefresh10Min)return;
  window.__fundaAdminAutoRefresh10Min=true;

  const REFRESH_MS=10*60*1000;
  let busy=false;

  async function refreshAdmin(){
    if(busy||document.hidden)return;
    if('onLine' in navigator&&!navigator.onLine)return;
    busy=true;
    const scrollY=window.scrollY;
    try{
      // Non-destructive refresh: keep the current workspace visible and ask
      // each Admin module to refresh its own data. Do not call the legacy
      // global load(), which can replace a healthy screen with an empty/error
      // state when one network request temporarily fails.
      document.dispatchEvent(new CustomEvent('funda:admin-manual-refresh',{
        detail:{source:'automatic',interval_ms:REFRESH_MS}
      }));
      requestAnimationFrame(()=>window.scrollTo(0,scrollY));
    }catch(error){
      console.error('Admin 10-minute auto refresh failed',error);
    }finally{
      busy=false;
    }
  }

  window.__fundaAdminAutoRefreshTimer=setInterval(refreshAdmin,REFRESH_MS);
})();
