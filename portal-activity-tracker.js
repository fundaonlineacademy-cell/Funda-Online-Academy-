(()=>{
'use strict';
if(window.__fundaPortalActivityTracker)return;

const path=String(window.location.pathname||'').toLowerCase();
const supported=/\/(dashboard|ambassador-portal-v2|staff-portal)\.html$/.test(path);
if(!supported)return;

window.__fundaPortalActivityTracker=true;
const ACTIVE_WRITE_GAP=2*60*1000;
const HEARTBEAT_GAP=4*60*1000;
let db=null,userId='',lastWriteAt=0,lastActiveWriteAt=0,heartbeat=null,warned=false,inFlight=false;

function client(){
  if(db)return db;
  if(window.__fundaSharedSupabaseClient)return db=window.__fundaSharedSupabaseClient;
  if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
    db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  }
  return db;
}

async function restoreUser(){
  const c=client();
  if(!c)return null;
  try{
    if(window.FundaAuth?.restore){
      const restored=await window.FundaAuth.restore(c,{waits:[0,250,700]});
      if(restored?.user)return restored.user;
    }
    const session=await c.auth.getSession();
    return session.data?.session?.user||null;
  }catch(_){
    return null;
  }
}

async function record(markActive=false,force=false){
  if(document.hidden&&!force)return;
  const now=Date.now();
  if(inFlight)return;
  if(force&&lastWriteAt&&now-lastWriteAt<5000)return;
  if(!force){
    if(markActive&&now-lastActiveWriteAt<ACTIVE_WRITE_GAP)return;
    if(!markActive&&now-lastWriteAt<HEARTBEAT_GAP-5000)return;
  }
  const c=client();
  if(!c)return;
  inFlight=true;
  try{
    const user=await restoreUser();
    if(!user)return;
    userId=user.id;
    const result=await c.rpc('record_own_portal_activity',{p_mark_active:Boolean(markActive)});
    if(result.error){
      if(!warned){
        warned=true;
        console.warn('Portal activity could not be recorded.',result.error);
      }
      return;
    }
    warned=false;
    lastWriteAt=now;
    if(markActive)lastActiveWriteAt=now;
    window.__fundaPortalActivityTrackerStatus={connected:true,lastRecordedAt:new Date(now).toISOString()};
  }finally{
    inFlight=false;
  }
}

function markActivity(){record(true,false)}

function loadAmbassadorRewards(){
  if(!/\/ambassador-portal-v2\.html$/.test(path)||window.__fundaAmbassadorPerformanceRewardsV3)return;
  if(document.querySelector('script[data-funda-ambassador-rewards-v3]'))return;
  const script=document.createElement('script');
  script.src='ambassador-performance-rewards-v3.js?v=20261008-final-20pct-v2';
  script.async=false;
  script.dataset.fundaAmbassadorRewardsV3='1';
  document.head.appendChild(script);
}

function install(){
  loadAmbassadorRewards();
  ['pointerdown','keydown','touchstart'].forEach(type=>window.addEventListener(type,markActivity,{passive:true}));
  window.addEventListener('scroll',markActivity,{passive:true});
  window.addEventListener('focus',()=>record(true,true));
  window.addEventListener('pageshow',()=>record(true,true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)record(true,true)});
  heartbeat=setInterval(()=>record(false,false),HEARTBEAT_GAP);
  window.addEventListener('pagehide',()=>{if(heartbeat)clearInterval(heartbeat)},{once:true});

  const c=client();
  c?.auth?.onAuthStateChange?.((event,session)=>{
    if(event==='SIGNED_OUT')userId='';
    if(session?.user&&session.user.id!==userId)record(true,true);
  });

  [0,500,1500,3000].forEach(delay=>setTimeout(()=>record(true,true),delay));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
