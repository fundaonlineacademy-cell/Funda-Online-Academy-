(()=>{
if(!/ambassadors\.html$/i.test(location.pathname)||window.__fundaCreatorPartnerApplication)return;
window.__fundaCreatorPartnerApplication=true;
const $=s=>document.querySelector(s);

function install(){
  const apply=$('#apply');
  if(!apply)return;

  const style=document.createElement('style');
  style.textContent=`
    .cpbox{background:#fff;border:1px solid #d8d0bd;border-radius:22px;padding:24px;box-shadow:0 12px 30px rgba(33,56,77,.08)}
    .cpgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
    .cpf{display:grid;gap:7px}.cpf span,.cplabel{font-size:14px;font-weight:800;color:#21384d}
    .cpf input,.cpf select,.cpf textarea{width:100%;border:1px solid #cfc8b9;border-radius:13px;padding:13px 14px;background:#fff;color:#111827;outline:none;font-size:15px}
    .cpf input:focus,.cpf select:focus,.cpf textarea:focus{border-color:#c99a2e;box-shadow:0 0 0 3px rgba(201,154,46,.14)}
    .cpwide{grid-column:1/-1}.cpnote{font-size:14px;line-height:1.7;color:#111827}
    .cpstatus{display:none;border-radius:12px;padding:13px;font-size:14px;line-height:1.55}
    .cpstatus.ok{display:block;background:#eaf6ef;color:#12543b}.cpstatus.err{display:block;background:#fff0f0;color:#8b1f1f}
    .cpconsent{display:flex;align-items:flex-start;gap:10px;border:1px solid #e0d7c3;background:#fffdf7;border-radius:13px;padding:14px;color:#111827;font-size:13px;line-height:1.55}
    .cpconsent input{margin-top:3px;flex:0 0 auto}
    .cpactions{display:flex;gap:10px;flex-wrap:wrap}.cpsecondary{background:#fff;border:1px solid #cfc8b9;color:#21384d}
    @media(max-width:700px){.cpgrid{grid-template-columns:1fr}.cpwide{grid-column:auto}.cpbox{padding:20px}}
  `;
  document.head.appendChild(style);

  apply.innerHTML=`
    <div class="max-w-5xl mx-auto px-5 sm:px-6 py-12">
      <div id="cpIntro" class="cpbox text-center max-w-3xl mx-auto">
        <div class="text-[10px] font-extrabold tracking-[.18em] text-[#a87818]">CREATOR PARTNER APPLICATION</div>
        <h2 class="mt-2 text-3xl font-extrabold text-[#21384d]">Interested in partnering with Funda?</h2>
        <p class="mt-4 cpnote">Start a short application. We only ask for the essential information needed to review your creator profile and audience fit.</p>
        <div class="mt-5 rounded-2xl bg-[#fff4dc] border border-[#e1c878] p-4 cpnote text-left"><b>Application process:</b> Start Application → Submit Application → Funda Review → Approved / Declined → Partnership Agreement → Account Activation.</div>
        <button id="cpStart" type="button" class="btn btnPrimary mt-6">Start Application</button>
      </div>
      <div id="cpFormWrap" class="hidden max-w-3xl mx-auto">
        <div class="mb-5">
          <div class="text-[10px] font-extrabold tracking-[.18em] text-[#a87818]">CREATOR PARTNER APPLICATION</div>
          <h2 class="mt-2 text-3xl font-extrabold text-[#21384d]">Tell us the essentials.</h2>
          <p class="mt-3 cpnote">This should only take a few minutes.</p>
        </div>
        <form id="cpForm" class="cpbox cpgrid">
          <label class="cpf"><span>Full name *</span><input id="cpName" required autocomplete="name"></label>
          <label class="cpf"><span>Email address *</span><input id="cpEmail" type="email" required autocomplete="email"></label>
          <label class="cpf"><span>Mobile / WhatsApp *</span><input id="cpPhone" type="tel" required autocomplete="tel"></label>
          <label class="cpf"><span>Primary social platform *</span><select id="cpPlatform" required><option value="">Choose platform</option><option>TikTok</option><option>Instagram</option><option>Facebook</option><option>YouTube</option><option>LinkedIn</option><option>X</option><option>Blog / Website</option><option>Other</option></select></label>
          <label class="cpf cpwide"><span>Creator profile link or username *</span><input id="cpProfile" required placeholder="Profile URL or @username"></label>
          <label class="cpf"><span>Content niche / topic *</span><input id="cpNiche" required placeholder="e.g. Careers, business, lifestyle"></label>
          <label class="cpf"><span>Approx. followers <small>(optional)</small></span><input id="cpFollowers" type="number" min="0" inputmode="numeric"></label>
          <label class="cpf cpwide"><span>Briefly describe your audience *</span><textarea id="cpAudience" required rows="3" placeholder="Who follows you and what are they interested in?"></textarea></label>
          <label class="cpconsent cpwide"><input id="cpConsent" type="checkbox" required><span>I consent to Funda Online Academy using these details to assess and respond to my Creator Partner application. I understand that submitting an application does not guarantee approval.</span></label>
          <div class="cpactions cpwide"><button id="cpSubmit" type="submit" class="btn btnPrimary">Submit Application</button><button id="cpBack" type="button" class="btn cpsecondary">Back</button></div>
          <div id="cpStatus" class="cpstatus cpwide"></div>
        </form>
      </div>
    </div>`;

  $('#cpStart').addEventListener('click',()=>{
    $('#cpIntro').classList.add('hidden');
    $('#cpFormWrap').classList.remove('hidden');
    $('#cpFormWrap').scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('#cpBack').addEventListener('click',()=>{
    $('#cpFormWrap').classList.add('hidden');
    $('#cpIntro').classList.remove('hidden');
    apply.scrollIntoView({behavior:'smooth',block:'start'});
  });
  $('#cpForm').addEventListener('submit',submit);
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

    const platform=$('#cpPlatform').value;
    const profile=$('#cpProfile').value.trim();
    const isUrl=/^https?:\/\//i.test(profile);
    const followers=$('#cpFollowers').value?Number($('#cpFollowers').value):null;
    const payload={
      full_name:$('#cpName').value.trim(),
      email:$('#cpEmail').value.trim().toLowerCase(),
      phone:$('#cpPhone').value.trim(),
      platforms:[{platform,handle:isUrl?'':profile,url:isUrl?profile:'',followers}],
      content_type:$('#cpNiche').value.trim(),
      audience_description:$('#cpAudience').value.trim(),
      best_platform:platform,
      content_links:[],
      consent:$('#cpConsent').checked
    };

    if(!payload.consent)throw Error('Please provide consent before submitting.');
    const result=await db.functions.invoke('submit-ambassador-application',{body:{application:payload}});
    if(result.error)throw result.error;
    if(result.data?.error)throw Error(result.data.error);

    e.target.reset();
    status.className='cpstatus ok';
    status.textContent='Application submitted successfully. Funda will review your Creator Partner application and contact you using the details provided.';
  }catch(err){
    const msg=err?.message||'We could not submit your application. Please try again.';
    status.className='cpstatus err';
    status.textContent=/already exists|duplicate/i.test(msg)?'A Creator Partner application already exists for this email address.':msg;
  }finally{
    btn.disabled=false;
    btn.textContent='Submit Application';
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();