// FUNDA ONLINE ACADEMY — ADMIN DASHBOARD REALTIME REFRESH
// One authenticated Realtime channel for the live My Dashboard data sources.
(()=>{
  'use strict';
  if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAdminDashboardRealtime)return;
  window.__fundaAdminDashboardRealtime=true;

  const TABLES=[
    'profiles','courses','enrollments','payments','admin_cashbook',
    'support_tickets','communications','certificates','course_results',
    'governance_actions','ambassador_programme_applications',
    'academy_calendar_events','student_consultations'
  ];
  let db=null,channel=null,timer=null,lastTable='';

  function client(){
    if(db)return db;
    if(window.__fundaSharedSupabaseClient)return db=window.__fundaSharedSupabaseClient;
    if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
      return db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    }
    return null;
  }

  function signal(table,source='supabase-realtime'){
    lastTable=table||lastTable||'unknown';
    clearTimeout(timer);
    timer=setTimeout(()=>{
      document.dispatchEvent(new CustomEvent('funda:admin-live-change',{
        detail:{source,table:lastTable,at:new Date().toISOString()}
      }));
    },220);
  }

  async function authorised(c){
    try{
      let user=null;
      if(window.FundaAuth?.restore){
        const restored=await window.FundaAuth.restore(c,{waits:[0,250,700,1400]});
        user=restored?.user||null;
      }else{
        const u=await c.auth.getUser();
        user=u.data?.user||null;
      }
      if(!user)return false;
      const p=await c.from('profiles').select('role').eq('id',user.id).maybeSingle();
      return !p.error&&String(p.data?.role||'').toLowerCase()==='admin';
    }catch(error){
      console.warn('Admin Dashboard Realtime authorization check failed',error);
      return false;
    }
  }

  async function start(){
    const c=client();
    if(!c){setTimeout(start,300);return}
    if(!await authorised(c))return;

    let ch=c.channel('admin-dashboard-live-v1');
    TABLES.forEach(table=>{
      ch=ch.on('postgres_changes',{event:'*',schema:'public',table},()=>signal(table));
    });
    channel=ch.subscribe(status=>{
      window.__fundaAdminDashboardRealtimeStatus=status;
      if(status==='SUBSCRIBED')signal('dashboard-sources','realtime-connected');
      if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')console.warn('Admin Dashboard Realtime status:',status);
    });
  }

  window.addEventListener('focus',()=>signal('focus','window-focus'));
  window.addEventListener('pageshow',()=>signal('pageshow','page-show'));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)signal('visibility','window-visible')});
  window.addEventListener('beforeunload',()=>{if(channel&&db)db.removeChannel(channel)});

  start();
})();