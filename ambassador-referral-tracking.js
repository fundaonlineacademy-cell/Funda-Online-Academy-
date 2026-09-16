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

function run(){
 clearLegacy();
 const code=queryCode();
 if(redirectLegacyReferral(code))return;
 preserveReferralOnRegistrationLinks(code);
 installRegistrationClaim(code);
 installPortalReferralOverride();
}

function loadPortalFix(file,id){if(!/ambassador-portal-v2\.html$/i.test(location.pathname)||document.getElementById(id))return;const s=document.createElement('script');s.id=id;s.src=file+'?v='+Date.now();document.head.appendChild(s)}
loadPortalFix('ambassador-portal-audit-fixes.js','ambassadorPortalAuditFixes');
loadPortalFix('ambassador-bank-display-sync.js','ambassadorBankDisplaySync');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();