(()=>{
'use strict';
if(!/ambassador-application\.html$/i.test(location.pathname)||window.__fundaDedicatedCreatorApplication)return;
window.__fundaDedicatedCreatorApplication=true;
const $=s=>document.querySelector(s);

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

async function submit(e){
  e.preventDefault();
  const status=$('#cpStatus'),btn=$('#cpSubmit');
  status.className='cpstatus';
  btn.disabled=true;
  btn.textContent='Submitting...';
  try{
    const db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    if(!db)throw Error('Application service is unavailable. Please try again.');

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

    const fullName=$('#cpName').value.trim();
    const email=$('#cpEmail').value.trim().toLowerCase();
    const phone=$('#cpPhone').value.trim();
    const payload={
      full_name:fullName,
      email,
      phone,
      platforms,
      content_type:$('#cpNiche').value.trim(),
      audience_description:$('#cpAudience').value.trim(),
      best_platform:platforms[0].platform,
      content_links:platforms.map(p=>p.url).filter(Boolean).slice(0,3),
      consent:$('#cpConsent').checked
    };

    if(!payload.consent)throw Error('Please provide consent before submitting.');

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
    status.textContent='Application submitted successfully. Your Creator Partner login details have been saved. Funda Online Academy will review your application and contact you using the details provided.';
    status.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(err){
    const msg=err?.message||'We could not submit your application. Please try again.';
    status.className='cpstatus err';
    status.textContent=/already exists|duplicate/i.test(msg)?'A Creator Partner application already exists for this email address.':msg;
  }finally{
    btn.disabled=false;
    btn.textContent='Submit Application';
  }
}

function init(){
  addPlatform();
  $('#cpAddPlatform')?.addEventListener('click',addPlatform);
  $('#cpForm')?.addEventListener('submit',submit);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
