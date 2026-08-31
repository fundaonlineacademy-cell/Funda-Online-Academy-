(()=>{
if(window.__fundaAmbassadorReferralTracking)return;window.__fundaAmbassadorReferralTracking=true;
const CODE_KEY='funda_ambassador_referral_code',TIME_KEY='funda_ambassador_referral_time',CLAIM_KEY='funda_ambassador_referral_claimed',MAX_AGE=30*24*60*60*1000;
const clean=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,40);
function sessionKey(){let k=sessionStorage.getItem('funda_ambassador_session');if(!k){k=(crypto.randomUUID?.()||Math.random().toString(36).slice(2))+Date.now();sessionStorage.setItem('funda_ambassador_session',k)}return k}
function client(){return window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY?window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY):null}
function capture(){let code='';try{code=clean(new URLSearchParams(location.search).get('ref'))}catch(e){}if(code){localStorage.setItem(CODE_KEY,code);localStorage.setItem(TIME_KEY,String(Date.now()));localStorage.removeItem(CLAIM_KEY)}return code||clean(localStorage.getItem(CODE_KEY))}
function validStored(){let code=clean(localStorage.getItem(CODE_KEY)),t=Number(localStorage.getItem(TIME_KEY)||0);if(!code||!t||Date.now()-t>MAX_AGE){localStorage.removeItem(CODE_KEY);localStorage.removeItem(TIME_KEY);localStorage.removeItem(CLAIM_KEY);return ''}return code}
async function record(code){if(!code)return;let c=client();if(!c)return;try{await c.rpc('record_ambassador_click',{p_code:code,p_page:location.pathname+location.search,p_referrer:document.referrer||null,p_session:sessionKey()})}catch(e){}}
async function claim(){let code=validStored();if(!code||localStorage.getItem(CLAIM_KEY)==='1')return;let c=client();if(!c)return;try{let s=await c.auth.getSession();if(!s.data.session?.user)return;let q=await c.rpc('claim_ambassador_referral',{p_code:code,p_source_page:location.pathname+location.search});if(q.data===true){localStorage.setItem(CLAIM_KEY,'1')}}catch(e){}}
async function run(){let code=capture();if(code)await record(code);await claim();setTimeout(claim,1800);setTimeout(claim,5000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(run,500));else setTimeout(run,500);
})();