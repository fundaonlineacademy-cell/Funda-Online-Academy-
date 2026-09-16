(()=>{
'use strict';
if(!/ambassador-application\.html$/i.test(location.pathname)||window.__fundaDedicatedCreatorApplication)return;
window.__fundaDedicatedCreatorApplication=true;
const $=s=>document.querySelector(s);
let db=null,agreement=null;
const acceptanceDeclaration='I confirm that I have read, understood and agree to the Funda Online Academy Ambassador Programme Agreement and Terms. I understand that accepting these terms does not approve my application and that my Ambassador relationship becomes active only if Funda Online Academy approves and activates my application.';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const normalName=v=>String(v||'').trim().replace(/\s+/g,' ').toLowerCase();

function platformRow(index){
  const row=document.createElement('div');
  row.className='cpplatform cpwide';
  row.innerHTML=`
    <div class="cpplatformHead"><b>Social platform ${index}</b>${index>1?'<button type="button" class="cpremove">Remove</button>':''}</div>
    <div class="cpgrid">
      <label class="cpf"><span>Platform *</span><select data-k="platform" required><option value="">Choose platform</option><option>TikTok</option><option>Instagram</option><option>Facebook</option><option>YouTube</option><option>LinkedIn</option><option>X</option><option>Blog / Website</option><option>Other</option></select></label>
      <label class="cpf"><span>Profile link or username *</span><input data-k="profile" required placeholder="https://... or @username"></label>
      <label class="cpf cpwide"><span>Approx. followers <small>(optional)</small></span><input data-k="followers" type="number" min="0" inputmode="numeric"></label>
    </div>`;
  row.querySelector('.cpremove')?.addEventListener('click',()=>row.remove());
  return row;
}

function addPlatform(){
  const box=$('#cpPlatforms');
  if(!box)return;
  box.appendChild(platformRow(box.querySelectorAll('.cpplatform').length+1));
}

function renderAgreement(row){
  agreement=row;
  $('#cpAgreementTitle').textContent=row.title||'Funda Online Academy Ambassador Programme Agreement & Terms';
  $('#cpAgreementVersion').textContent='VERSION '+String(row.version||'CURRENT').toUpperCase();
  const paragraphs=String(row.agreement_text||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  $('#cpAgreementBody').innerHTML=paragraphs.map(p=>`<p>${esc(p)}</p>`).join('');
  $('#cpAgreementBody').hidden=false;
  const rules=Array.isArray(row.house_rules)?row.house_rules:[];
  if(rules.length){
    $('#cpAgreementRules').innerHTML='<b>Everyday Ambassador standards</b><ul>'+rules.map(x=>`<li>${esc(x)}</li>`).join('')+'</ul>';
    $('#cpAgreementRules').hidden=false;
  }
  $('#cpAgreementLoading').hidden=true;
  $('#cpSubmit').disabled=false;
  $('#cpSubmit').textContent='Submit Application';
}

async function loadAgreement(){
  const status=$('#cpStatus');
  try{
    db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    if(!db)throw Error('Application service is unavailable. Please try again.');
    const q=await db.rpc('get_current_ambassador_application_agreement');
    if(q.error)throw q.error;
    const row=Array.isArray(q.data)?q.data[0]:q.data;
    if(!row?.agreement_version_id||!row?.content_hash||!row?.agreement_text)throw Error('The current Ambassador Programme Agreement is unavailable. Please try again later.');
    renderAgreement(row);
  }catch(err){
    $('#cpAgreementLoading').textContent='The current Ambassador Programme Agreement could not be loaded. Please refresh this page before applying.';
    $('#cpSubmit').disabled=true;
    $('#cpSubmit').textContent='Agreement Unavailable';
    status.className='cpstatus err';
    status.textContent=err?.message||'The current Ambassador Programme Agreement could not be loaded.';
  }
}

async function submit(e){
  e.preventDefault();
  const status=$('#cpStatus'),btn=$('#cpSubmit');
  status.className='cpstatus';
  btn.disabled=true;
  btn.textContent='Submitting...';
  try{
    if(!db||!agreement)throw Error('The current Ambassador Programme Agreement is not loaded. Please refresh this page.');

    const password=$('#cpPassword').value;
    const password2=$('#cpPassword2').value;
    if(password.length<8)throw Error('Please create a password with at least 8 characters.');
    if(password!==password2)throw Error('The passwords do not match.');

    const platforms=[...document.querySelectorAll('.cpplatform')].map(row=>{
      const platform=row.querySelector('[data-k="platform"]').value;
      const profile=row.querySelector('[data-k="profile"]').value.trim();
      const followersEl=row.querySelector('[data-k="followers"]');
      const isUrl=/^https?:\/\//i.test(profile);
      return {platform,handle:isUrl?'':profile,url:isUrl?profile:'',followers:followersEl.value?Number(followersEl.value):null};
    });

    if(!platforms.length)throw Error('Please add at least one social platform.');
    if(platforms.some(p=>!p.platform||(!p.handle&&!p.url)))throw Error('Please complete the platform and profile link or username for each social profile.');

    const fullName=$('#cpName').value.trim().replace(/\s+/g,' ');
    const signatureName=$('#cpAgreementSignature').value.trim().replace(/\s+/g,' ');
    const email=$('#cpEmail').value.trim().toLowerCase();
    const phone=$('#cpPhone').value.trim();
    if(!$('#cpAgreementAccept').checked)throw Error('Please read and accept the Ambassador Programme Agreement before submitting.');
    if(normalName(signatureName)!==normalName(fullName))throw Error('Your electronic signature must match the full name entered at the top of the application.');

    const payload={
      full_name:fullName,
      email,
      phone,
      platforms,
      content_type:$('#cpNiche').value.trim(),
      audience_description:$('#cpAudience').value.trim(),
      best_platform:platforms[0].platform,
      content_links:platforms.map(p=>p.url).filter(Boolean).slice(0,3),
      consent:$('#cpConsent').checked,
      agreement_accepted:true,
      agreement_version_id:agreement.agreement_version_id,
      agreement_hash:agreement.content_hash,
      agreement_signature_name:signatureName,
      agreement_acceptance_declaration:acceptanceDeclaration
    };

    if(!payload.consent)throw Error('Please provide application-data consent before submitting.');

    const current=await db.auth.getUser();
    const currentEmail=String(current.data?.user?.email||'').toLowerCase();
    if(current.data?.user&&currentEmail!==email)throw Error('You are currently signed in with a different Academy email. Please use that email or sign out before applying.');

    if(!current.data?.user){
      const signup=await db.auth.signUp({
        email,
        password,
        options:{data:{full_name:fullName,phone,account_type:'ambassador_applicant'}}
      });
      if(signup.error)throw signup.error;
      if(!signup.data?.user)throw Error('We could not create your Creator Partner login. Please try again.');
    }

    const result=await db.functions.invoke('submit-ambassador-application',{body:{application:payload}});
    if(result.error)throw result.error;
    if(result.data?.error)throw Error(result.data.error);

    e.target.reset();
    $('#cpPlatforms').innerHTML='';
    addPlatform();
    status.className='cpstatus ok';
    status.textContent='Application submitted successfully. Your login details, Ambassador Programme Agreement acceptance and electronic signature have been recorded. Your application is now pending review. You may use your login to check your application status; your referral link and full Ambassador tools are issued only after approval and activation.';
    status.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(err){
    const msg=err?.message||'We could not submit your application. Please try again.';
    status.className='cpstatus err';
    status.textContent=/already exists|duplicate/i.test(msg)?'A Creator Partner application already exists for this email address.':msg;
  }finally{
    btn.disabled=!agreement;
    btn.textContent=agreement?'Submit Application':'Agreement Unavailable';
  }
}

async function init(){
  addPlatform();
  $('#cpAddPlatform')?.addEventListener('click',addPlatform);
  $('#cpForm')?.addEventListener('submit',submit);
  await loadAgreement();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
