(()=>{
if(window.__fundaAmbassadorReferralTracking)return;window.__fundaAmbassadorReferralTracking=true;

const INTENT_KEY='funda_ambassador_registration_referral';
const LEGACY_KEYS=['funda_ambassador_referral_code','funda_ambassador_referral_time','funda_ambassador_referral_claimed'];
const clean=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,40);
const queryCode=()=>{try{return clean(new URLSearchParams(location.search).get('ref'))}catch(_){return ''}};
function client(){return window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY?window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY):null}
function clearLegacy(){try{LEGACY_KEYS.forEach(k=>localStorage.removeItem(k))}catch(_){}}
function clearIntent(){try{sessionStorage.removeItem(INTENT_KEY)}catch(_){}}
function setIntent(code){if(!code)return;try{sessionStorage.setItem(INTENT_KEY,JSON.stringify({code,source:location.pathname+location.search,createdAt:Date.now()}))}catch(_){}}
function getIntent(){try{const v=JSON.parse(sessionStorage.getItem(INTENT_KEY)||'null');if(!v?.code||!v?.createdAt||Date.now()-Number(v.createdAt)>30*60*1000){clearIntent();return null}v.code=clean(v.code);return v.code?v:null}catch(_){clearIntent();return null}}

async function claimNewRegistration(){
 const intent=getIntent();if(!intent)return false;
 const c=client();if(!c)return false;
 try{
  const s=await c.auth.getSession();
  if(!s.data?.session?.user)return false;
  const q=await c.rpc('claim_ambassador_v2_referral',{p_code:intent.code,p_source_page:intent.source||'student-account-registration'});
  if(q.error){console.warn('Ambassador registration attribution could not be recorded:',q.error);return false}
  clearIntent();
  return q.data===true;
 }catch(e){console.warn('Ambassador registration attribution check failed:',e);return false}
}

function installRegistrationClaim(code){
 if(!code||!/(^|\/)auth\.html$/i.test(location.pathname))return;
 const attach=()=>{
  const form=document.getElementById('registerForm');
  if(form&&!form.dataset.ambassadorReferralRegistration){
   form.dataset.ambassadorReferralRegistration='1';
   form.addEventListener('submit',()=>{
    setIntent(code);
    [250,700,1500,3000,6000].forEach(ms=>setTimeout(claimNewRegistration,ms));
   },true);
  }
  const c=client();
  if(c&&!window.__fundaAmbassadorReferralAuthListener){
   window.__fundaAmbassadorReferralAuthListener=true;
   c.auth.onAuthStateChange((_event,session)=>{if(session?.user&&getIntent())setTimeout(claimNewRegistration,0)});
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
}

function redirectLegacyReferral(code){
 if(!code||!/(^|\/)(courses-public|course-view)\.html$/i.test(location.pathname))return false;
 const target=new URL('create-account.html',location.href);
 target.searchParams.set('ref',code);
 location.replace(target.pathname+target.search);
 return true;
}

function preserveReferralOnRegistrationLinks(code){
 if(!code)return;
 document.querySelectorAll('a[href]').forEach(a=>{
  try{
   const u=new URL(a.getAttribute('href'),location.href);
   if(u.origin!==location.origin)return;
   if(!/(^|\/)(create-account|auth)\.html$/i.test(u.pathname))return;
   if(!u.searchParams.get('ref'))u.searchParams.set('ref',code);
   a.href=u.pathname+u.search+u.hash;
  }catch(_){ }
 });
}

function portalCode(){
 for(const id of ['accountReferralCode','codeText']){
  const raw=document.getElementById(id)?.textContent||'';
  if(/pending|not issued/i.test(raw))continue;
  const code=clean(raw);if(code)return code;
 }
 for(const id of ['accountReferralUrl','referralLinkText']){
  const raw=document.getElementById(id)?.textContent||'';
  try{const u=new URL(raw,location.href),code=clean(u.searchParams.get('ref'));if(code)return code}catch(_){ }
 }
 return '';
}
function permanentRegistrationLink(code){return code?location.origin+'/create-account.html?ref='+encodeURIComponent(code):''}
function syncPortalReferralUi(){
 if(!/(^|\/)ambassador-portal-v2\.html$/i.test(location.pathname))return;
 const code=portalCode();if(!code)return;
 const url=permanentRegistrationLink(code);
 ['referralLinkText','accountReferralUrl'].forEach(id=>{const el=document.getElementById(id);if(el&&el.textContent!==url)el.textContent=url});
 document.querySelectorAll('a[href*="courses-public.html"][href*="ref="]').forEach(a=>{if(a.href!==url)a.href=url});
 const status=document.getElementById('refStatus');
 if(status&&!Array.from(status.options).some(o=>o.value==='registered')){
  const opt=document.createElement('option');opt.value='registered';opt.textContent='Registered';status.insertBefore(opt,status.options[1]||null);
 }
}
async function copyPermanentPortalLink(btn){
 const code=portalCode(),text=permanentRegistrationLink(code);if(!text)return;
 try{await navigator.clipboard.writeText(text);const old=btn.textContent;btn.textContent='Copied ✓';setTimeout(()=>btn.textContent=old,1200)}catch(_){alert(text)}
}
function installPortalReferralOverride(){
 if(!/(^|\/)ambassador-portal-v2\.html$/i.test(location.pathname))return;
 const sync=()=>syncPortalReferralUi();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
 new MutationObserver(sync).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
 document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#copyLink,#quickCopyLink,#accountCopyLink,#refCopyLink,[data-resource-ref]');
  if(!btn)return;
  const code=portalCode();if(!code)return;
  e.preventDefault();e.stopImmediatePropagation();copyPermanentPortalLink(btn);
 },true);
}

function installStaffAccessCodeGuard(){
 if(!/(^|\/)login\.html$/i.test(location.pathname)||window.__fundaStaffAccessCodeGuard)return;
 window.__fundaStaffAccessCodeGuard=true;
 const attach=()=>{
  const form=document.getElementById('loginForm');
  const adminBtn=document.getElementById('btn-admin');
  const studentBtn=document.getElementById('btn-student');
  const passwordInput=document.getElementById('password');
  const loginBtn=document.getElementById('loginBtn');
  if(!form||!adminBtn||!studentBtn||!passwordInput||!loginBtn)return;

  let extra=document.getElementById('admin-extra');
  if(!extra){
   extra=document.createElement('div');
   extra.id='admin-extra';
   extra.className='hidden mt-5';
   extra.innerHTML='<label for="staff_code" class="block text-sm font-bold text-[#06152f]">Staff access code</label><input id="staff_code" type="password" autocomplete="off" placeholder="Enter staff access code" class="input-field mt-2"><p class="mt-1.5 text-xs text-slate-500">Required for Staff / Admin access.</p>';
   const note=document.getElementById('staffAccessNote');
   (note||loginBtn).insertAdjacentElement('beforebegin',extra);
  }
  const codeInput=document.getElementById('staff_code');
  const note=document.getElementById('staffAccessNote');
  const isStaffMode=()=>adminBtn.getAttribute('aria-pressed')==='true'||adminBtn.classList.contains('active');
  const sync=()=>{
   const on=isStaffMode();
   extra.classList.toggle('hidden',!on);
   if(codeInput)codeInput.required=on;
   if(note&&on)note.textContent='Staff and administrator sign-in requires your password and assigned Staff Access Code.';
  };
  adminBtn.addEventListener('click',()=>setTimeout(sync,0));
  studentBtn.addEventListener('click',()=>setTimeout(sync,0));
  new MutationObserver(sync).observe(adminBtn,{attributes:true,attributeFilter:['class','aria-pressed']});
  sync();

  const show=(text,success=false)=>{
   const box=document.getElementById('message');
   if(!box)return;
   box.textContent=text;
   box.classList.remove('error','success','show');
   box.classList.add(success?'success':'error','show');
   box.setAttribute('role',success?'status':'alert');
  };
  const clear=()=>{
   const box=document.getElementById('message');
   if(!box)return;
   box.textContent='';box.classList.remove('error','success','show');box.removeAttribute('role');
  };

  form.addEventListener('submit',async event=>{
   if(!isStaffMode())return;
   event.preventDefault();
   event.stopImmediatePropagation();
   clear();

   const email=(document.getElementById('email')?.value||'').trim().toLowerCase();
   const password=document.getElementById('password')?.value||'';
   const staffCode=(codeInput?.value||'').trim();
   if(!email||!email.includes('@')){show('Please enter a valid email address.');return}
   if(!password){show('Please enter your password.');return}
   if(!staffCode){show('Please enter your Staff Access Code.');codeInput?.focus();return}

   let c=null;
   try{if(typeof supabaseClient!=='undefined'&&supabaseClient)c=supabaseClient}catch(_){ }
   if(!c)c=client();
   if(!c){show('The Academy connection is not ready. Please refresh the page and try again.');return}

   loginBtn.disabled=true;
   loginBtn.innerHTML='<span class="spinner"></span>Signing in...';
   try{
    const {data,error}=await c.auth.signInWithPassword({email,password});
    if(error)throw error;
    if(!data?.user)throw new Error('login-failed');
    const {data:profile,error:profileError}=await c.from('profiles').select('role, staff_code').eq('id',data.user.id).maybeSingle();
    if(profileError)throw new Error('profile-load');
    const actualRole=profile?.role||'student';
    if(!['admin','staff'].includes(actualRole)){
     await c.auth.signOut();
     show('This account does not have staff or administrator access.');
     return;
    }
    const assigned=String(profile?.staff_code||'').trim();
    if(!assigned){
     await c.auth.signOut();
     show('No Staff Access Code is assigned to this account. Please contact the Academy administrator.');
     return;
    }
    if(assigned!==staffCode){
     await c.auth.signOut();
     show('Invalid Staff Access Code.');
     return;
    }
    const destination=actualRole==='admin'?'admin-v2.html':'staff-portal.html';
    const portalName=actualRole==='admin'?'Admin Command Center':'Staff Workspace';
    show(`Login successful. Opening the ${portalName}...`,true);
    setTimeout(()=>{window.location.href=destination},450);
   }catch(error){
    console.error('Staff/Admin login error:',error);
    const text=String(error?.message||'').toLowerCase();
    if(text.includes('invalid login credentials'))show('The email address or password is incorrect. Please check your details and try again.');
    else if(text.includes('email not confirmed'))show('This account is waiting for email confirmation. Please contact the Academy if this message continues.');
    else if(text.includes('profile-load'))show('Your account was signed in, but the Academy could not verify staff access. Please try again.');
    else show('Unable to sign in right now. Please check your details and try again.');
   }finally{
    loginBtn.disabled=false;
    loginBtn.textContent='Sign In Securely';
   }
  },true);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
}

function run(){
 clearLegacy();
 const code=queryCode();
 if(redirectLegacyReferral(code))return;
 preserveReferralOnRegistrationLinks(code);
 installRegistrationClaim(code);
 installPortalReferralOverride();
 installStaffAccessCodeGuard();
}

function loadPortalFix(file,id){if(!/ambassador-portal-v2\.html$/i.test(location.pathname)||document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.src=file+'?v='+Date.now();document.head.appendChild(s)}
function loadPublicCourseFaq(){if(!/(^|\/)courses-public\.html$/i.test(location.pathname)||document.querySelector('script[data-funda-public-enrollment-faq]'))return;const s=document.createElement('script');s.src='courses-public-enrollment-faq.js?v=20260917-enroll-anytime-v1';s.async=true;s.dataset.fundaPublicEnrollmentFaq='1';document.head.appendChild(s)}
loadPortalFix('ambassador-portal-audit-fixes.js','ambassadorPortalAuditFixes');
loadPortalFix('ambassador-bank-display-sync.js','ambassadorBankDisplaySync');
loadPublicCourseFaq();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
