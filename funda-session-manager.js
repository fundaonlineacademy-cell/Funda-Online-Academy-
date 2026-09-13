// FUNDA ONLINE ACADEMY — SHARED AUTHENTICATED SESSION MANAGER
// Applies a professional 60-minute inactivity policy to protected workspaces.
// Active interaction is shared across Academy tabs in the same browser.
(()=>{
  'use strict';
  if(window.__fundaSessionManager)return;
  window.__fundaSessionManager=true;

  const MINUTE=60*1000;
  const POLICY=Object.freeze({
    idleMinutes:60,
    warningMinutes:5,
    verifyEveryMinutes:10
  });
  const IDLE_MS=POLICY.idleMinutes*MINUTE;
  const WARNING_MS=(POLICY.idleMinutes-POLICY.warningMinutes)*MINUTE;
  const VERIFY_MS=POLICY.verifyEveryMinutes*MINUTE;
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const protectedPages=new Set([
    'academic-document.html',
    'admin-calendar.html',
    'admin-certificate-studio-v2.html',
    'admin-certificate-studio.html',
    'admin-results-manager.html',
    'admin-results-test.html',
    'admin-v2-core.html',
    'admin-v2.html',
    'ambassador-portal-v2.html',
    'course-study.html',
    'dashboard.html',
    'digital-library.html',
    'library-admin.html',
    'module-assessment.html',
    'onboarding.html',
    'profile.html',
    'security.html',
    'staff-portal.html',
    'student-calendar.html',
    'student-certificates.html',
    'student-results.html'
  ]);
  const isProtected=protectedPages.has(page);
  const $=id=>document.getElementById(id);
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  let client=null;
  let user=null;
  let activityKey='';
  let ending=false;
  let warningOpen=false;
  let lastRecorded=0;
  let lastVerified=0;
  let tickTimer=null;
  let startRetryTimer=null;
  let verifyRetryTimer=null;

  function safeGet(key){
    try{return localStorage.getItem(key)}catch(_){return null}
  }

  function safeSet(key,value){
    try{localStorage.setItem(key,String(value))}catch(_){}
  }

  function safeRemove(key){
    try{localStorage.removeItem(key)}catch(_){}
  }

  function portal(){
    if(page==='ambassador-portal-v2.html')return 'ambassador';
    if(page==='staff-portal.html')return 'staff';
    if(page.startsWith('admin-')||page==='library-admin.html')return 'admin';
    return 'student';
  }

  function safeNext(){
    const value=`${page}${location.search||''}${location.hash||''}`;
    return value.replace(/[\r\n]/g,'');
  }

  function loginDestination(reason='idle'){
    const destination=portal()==='ambassador'
      ?'ambassador-login.html'
      :portal()==='staff'
        ?'staff-portal.html'
        :'login.html';
    const params=new URLSearchParams({reason,next:safeNext(),portal:portal()});
    return `${destination}?${params.toString()}`;
  }

  function installStyles(){
    if($('fundaSessionStyles'))return;
    const style=document.createElement('style');
    style.id='fundaSessionStyles';
    style.textContent=`
      .fundaSessionShade{
        position:fixed;inset:0;z-index:2147483000;display:none;
        place-items:center;padding:18px;background:rgba(3,16,31,.68);
        backdrop-filter:blur(3px);
      }
      .fundaSessionShade.open{display:grid}
      .fundaSessionCard{
        width:min(470px,100%);padding:24px;border:1px solid #dec779;border-radius:19px;
        background:#fffaf0;color:#142846;box-shadow:0 28px 80px rgba(0,0,0,.3);
        font-family:Inter,Arial,sans-serif;
      }
      .fundaSessionKicker{
        color:#9b6a06;font-size:10px;font-weight:900;letter-spacing:.16em;
      }
      .fundaSessionCard h2{margin:7px 0 8px;color:#071b31;font-size:22px;line-height:1.25}
      .fundaSessionCard p{margin:0;color:#42536a;font-size:13px;line-height:1.65}
      .fundaSessionTime{
        margin:16px 0;padding:13px;border:1px solid #eadba9;border-radius:12px;
        background:#fff4d4;color:#071b31;text-align:center;font-size:18px;font-weight:900;
      }
      .fundaSessionActions{display:flex;gap:9px;justify-content:flex-end;flex-wrap:wrap;margin-top:18px}
      .fundaSessionButton{
        border:0;border-radius:10px;padding:11px 14px;cursor:pointer;
        background:#071b31;color:#fff;font:800 12px Inter,Arial,sans-serif;
      }
      .fundaSessionButton.secondary{border:1px solid #d7c581;background:#fff;color:#142846}
      .fundaSessionConnection{
        position:fixed;z-index:2147482990;right:14px;bottom:14px;display:none;
        width:min(380px,calc(100vw - 28px));padding:12px 14px;border:1px solid #e2c778;
        border-radius:12px;background:#fff8df;color:#4b3b14;box-shadow:0 12px 32px rgba(0,0,0,.16);
        font:700 11px/1.5 Inter,Arial,sans-serif;
      }
      .fundaSessionConnection.open{display:block}
      .fundaSessionReturnNotice{
        position:fixed;z-index:2147482990;top:12px;left:50%;transform:translateX(-50%);
        width:min(620px,calc(100vw - 24px));padding:13px 16px;border:1px solid #ddc36b;
        border-radius:12px;background:#fff7da;color:#21384d;box-shadow:0 12px 32px rgba(0,0,0,.16);
        font:800 12px/1.5 Inter,Arial,sans-serif;
      }
      @media(max-width:600px){
        .fundaSessionCard{padding:20px}.fundaSessionCard h2{font-size:19px}
        .fundaSessionActions{display:grid}.fundaSessionButton{width:100%}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureUi(){
    installStyles();
    let shade=$('fundaSessionShade');
    if(!shade){
      shade=document.createElement('section');
      shade.id='fundaSessionShade';
      shade.className='fundaSessionShade';
      shade.setAttribute('role','dialog');
      shade.setAttribute('aria-modal','true');
      shade.setAttribute('aria-live','assertive');
      document.body.appendChild(shade);
    }
    let connection=$('fundaSessionConnection');
    if(!connection){
      connection=document.createElement('div');
      connection.id='fundaSessionConnection';
      connection.className='fundaSessionConnection';
      connection.setAttribute('role','status');
      connection.setAttribute('aria-live','polite');
      document.body.appendChild(connection);
    }
    return shade;
  }

  function showReturnNotice(){
    const params=new URLSearchParams(location.search);
    const reason=params.get('reason');
    if(!['idle','expired'].includes(reason))return;
    const start=()=>{
      installStyles();
      if($('fundaSessionReturnNotice'))return;
      const notice=document.createElement('div');
      notice.id='fundaSessionReturnNotice';
      notice.className='fundaSessionReturnNotice';
      notice.setAttribute('role','status');
      notice.textContent=reason==='idle'
        ?`You were signed out securely after ${POLICY.idleMinutes} minutes without activity. Work already saved remains protected. Sign in again to continue.`
        :'Your previous secure session is no longer available. Work already saved remains protected. Sign in again to continue.';
      document.body.appendChild(notice);
      if(params.get('portal')==='admin'||params.get('portal')==='staff'){
        setTimeout(()=>$('btn-admin')?.click(),0);
      }
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
    else start();
  }

  function lastActivity(){
    const stored=Number(safeGet(activityKey));
    return Number.isFinite(stored)&&stored>0?stored:lastRecorded;
  }

  function hideWarning(){
    warningOpen=false;
    $('fundaSessionShade')?.classList.remove('open');
  }

  function clearConnection(){
    $('fundaSessionConnection')?.classList.remove('open');
  }

  function showConnection(){
    const box=ensureUi()&&$('fundaSessionConnection');
    if(!box)return;
    box.textContent='The Academy could not confirm the connection just now. Your page remains open and the system will retry—this has not signed you out.';
    box.classList.add('open');
  }

  function renderWarning(remaining){
    const shade=ensureUi();
    if(!shade)return;
    const wasOpen=warningOpen;
    const seconds=Math.max(0,Math.ceil(remaining/1000));
    const minutes=Math.floor(seconds/60);
    const rest=String(seconds%60).padStart(2,'0');
    shade.innerHTML=`
      <div class="fundaSessionCard">
        <div class="fundaSessionKicker">ACCOUNT SECURITY</div>
        <h2>Are you still working?</h2>
        <p>Your secure Academy session will end after ${POLICY.idleMinutes} minutes without activity. Choose <strong>Stay signed in</strong> to continue without interruption.</p>
        <div class="fundaSessionTime">${minutes}:${rest} remaining</div>
        <p>Any work already submitted or saved remains protected.</p>
        <div class="fundaSessionActions">
          <button class="fundaSessionButton secondary" id="fundaSignOutNow" type="button">Sign out now</button>
          <button class="fundaSessionButton" id="fundaStaySignedIn" type="button">Stay signed in</button>
        </div>
      </div>`;
    shade.classList.add('open');
    warningOpen=true;
    $('fundaStaySignedIn').onclick=()=>recordActivity('continue',true);
    $('fundaSignOutNow').onclick=()=>endSession('idle');
    if(!wasOpen)$('fundaStaySignedIn')?.focus();
  }

  function renderEnded(reason){
    const shade=ensureUi();
    if(!shade)return;
    shade.innerHTML=`
      <div class="fundaSessionCard">
        <div class="fundaSessionKicker">SESSION ENDED SECURELY</div>
        <h2>Your account remains protected</h2>
        <p>${reason==='idle'
          ?`You were signed out after ${POLICY.idleMinutes} minutes without activity.`
          :'Your secure session is no longer available.'} Work already submitted or saved remains secure. The sign-in page will open now so you can continue.</p>
      </div>`;
    shade.classList.add('open');
    warningOpen=false;
  }

  async function getClient(){
    if(client)return client;
    for(let attempt=0;attempt<50;attempt++){
      if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
        client=window.__fundaSessionClient||window.supabase.createClient(
          window.SUPABASE_URL,
          window.SUPABASE_ANON_KEY,
          {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}
        );
        window.__fundaSessionClient=client;
        return client;
      }
      await wait(100);
    }
    return null;
  }

  async function restoreSession(){
    const db=await getClient();
    if(!db)return {session:null,user:null,error:new Error('Authentication service unavailable'),confirmedSignedOut:false};
    if(window.FundaAuth?.restore)return window.FundaAuth.restore(db);
    try{
      const result=await db.auth.getSession();
      return {
        session:result.data?.session||null,
        user:result.data?.session?.user||null,
        error:result.error||null,
        confirmedSignedOut:!result.error&&!result.data?.session
      };
    }catch(error){
      return {session:null,user:null,error,confirmedSignedOut:false};
    }
  }

  async function verify(){
    if(ending)return false;
    const result=await restoreSession();
    lastVerified=Date.now();
    if(result.user){
      user=result.user;
      clearTimeout(verifyRetryTimer);
      clearConnection();
      return true;
    }
    if(result.confirmedSignedOut){
      await endSession('expired',false);
      return false;
    }
    showConnection();
    clearTimeout(verifyRetryTimer);
    verifyRetryTimer=setTimeout(verify,10000);
    return null;
  }

  function recordActivity(_reason='interaction',force=false){
    if(ending||!activityKey)return;
    const now=Date.now();
    const previous=lastActivity();
    if(previous&&now-previous>=IDLE_MS){
      endSession('idle');
      return;
    }
    if(!force&&now-lastRecorded<5000)return;
    lastRecorded=now;
    safeSet(activityKey,now);
    hideWarning();
    if(now-lastVerified>=VERIFY_MS)verify();
  }

  function protectedLearningInProgress(){
    if(document.hidden)return false;
    if(page==='module-assessment.html'){
      const form=$('assessmentForm');
      return Boolean(form&&!form.hidden&&form.querySelector('[data-question-id]'));
    }
    return [...document.querySelectorAll('video,audio')].some(media=>!media.paused&&!media.ended);
  }

  async function endSession(reason='idle',callSignOut=true){
    if(ending)return;
    ending=true;
    if(tickTimer)clearInterval(tickTimer);
    clearTimeout(startRetryTimer);
    clearTimeout(verifyRetryTimer);
    safeRemove(activityKey);
    renderEnded(reason);
    if(callSignOut){
      const db=await getClient();
      if(db){
        try{
          await Promise.race([
            db.auth.signOut({scope:'local'}),
            wait(1800)
          ]);
        }catch(error){
          console.warn('Local session sign-out could not be confirmed',error);
        }
      }
    }
    await wait(1200);
    location.replace(loginDestination(reason));
  }

  function checkIdle(){
    if(ending||!activityKey)return;
    // A visible assessment attempt or playing lesson media is active study,
    // even during a period without taps or typing.
    if(protectedLearningInProgress()){
      recordActivity('active-learning',true);
      return;
    }
    const elapsed=Date.now()-lastActivity();
    if(elapsed>=IDLE_MS){
      endSession('idle');
      return;
    }
    if(elapsed>=WARNING_MS)renderWarning(IDLE_MS-elapsed);
    else if(warningOpen)hideWarning();
  }

  async function resume(){
    if(ending||document.hidden)return;
    const elapsed=Date.now()-lastActivity();
    if(elapsed>=IDLE_MS){
      await endSession('idle');
      return;
    }
    recordActivity('resume',true);
    await verify();
  }

  function bindActivity(){
    const events=['pointerdown','pointermove','touchstart','keydown','wheel','scroll','input','change','submit','play','timeupdate'];
    events.forEach(event=>document.addEventListener(event,()=>recordActivity(event),{
      capture:true,passive:event!=='keydown'&&event!=='submit'
    }));
    window.addEventListener('focus',resume);
    window.addEventListener('pageshow',resume);
    window.addEventListener('online',verify);
    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)resume();
    });
    window.addEventListener('storage',event=>{
      if(event.key===activityKey&&event.newValue){
        lastRecorded=Number(event.newValue)||lastRecorded;
        hideWarning();
      }
    });
  }

  async function start(){
    ensureUi();
    const restored=await restoreSession();
    if(!restored.user){
      if(restored.confirmedSignedOut){
        // Staff Portal also contains its own sign-in form.
        if(page!=='staff-portal.html')location.replace(loginDestination('expired'));
      }else{
        showConnection();
        clearTimeout(startRetryTimer);
        startRetryTimer=setTimeout(start,10000);
      }
      return;
    }
    clearTimeout(startRetryTimer);
    clearConnection();
    user=restored.user;
    activityKey=`funda_session_last_activity_v2:${user.id}`;
    const signedInAt=Date.parse(user.last_sign_in_at||'')||0;
    const stored=Number(safeGet(activityKey))||0;
    const now=Date.now();
    lastRecorded=!stored||stored<signedInAt||stored>now+MINUTE?now:stored;
    safeSet(activityKey,lastRecorded);
    lastVerified=now;
    bindActivity();
    tickTimer=setInterval(checkIdle,15000);
    const authListener=client.auth.onAuthStateChange((event,session)=>{
      if(session?.user)user=session.user;
      if(event==='SIGNED_OUT'){
        safeRemove(activityKey);
        if(!ending)endSession('expired',false);
      }
    });
    window.__fundaSessionAuthSubscription=authListener.data?.subscription||null;
    checkIdle();
  }

  window.FundaSession={
    activity:reason=>recordActivity(reason,true),
    verify,
    remainingMs:()=>Math.max(0,IDLE_MS-(Date.now()-lastActivity())),
    policy:POLICY
  };

  showReturnNotice();
  if(!isProtected)return;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
