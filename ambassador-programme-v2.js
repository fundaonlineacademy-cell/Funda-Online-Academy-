(()=>{
'use strict';
if(!/ambassadors\.html$/i.test(location.pathname)||window.__fundaCreatorPartnerProgramme)return;
window.__fundaCreatorPartnerProgramme=true;
const $=s=>document.querySelector(s);

function renderProgrammeAccess(apply){
  if($('#ambassador-programme-access'))return;

  const section=document.createElement('section');
  section.id='ambassador-programme-access';
  section.className='max-w-7xl mx-auto px-5 sm:px-6 py-12';
  section.innerHTML=`
    <div class="text-center max-w-3xl mx-auto">
      <div class="text-[10px] font-extrabold tracking-[.18em] text-[#a87818]">AMBASSADOR PROGRAMME ACCESS</div>
      <h2 class="mt-2 text-3xl font-extrabold text-[#21384d]">Approved partners get the tools they need in one secure Ambassador Portal.</h2>
      <p class="mt-3 text-sm leading-6 text-slate-600">Once approved, Ambassadors receive access to their referral tools, programme guidance, verified activity tracking and the commercial information that applies to their participation.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
      <div class="card p-5">
        <div class="text-[10px] font-extrabold tracking-[.12em] text-[#a87818]">REFERRAL TOOLS</div>
        <h3 class="mt-2 text-lg font-bold">Share approved Academy links.</h3>
        <p class="mt-2 text-xs leading-6 text-slate-600">Use your unique referral tools to connect prospective students with Funda Online Academy courses.</p>
      </div>
      <div class="card p-5">
        <div class="text-[10px] font-extrabold tracking-[.12em] text-[#a87818]">PROGRAMME GUIDANCE</div>
        <h3 class="mt-2 text-lg font-bold">Know what responsible promotion requires.</h3>
        <p class="mt-2 text-xs leading-6 text-slate-600">Approved Ambassadors can review current programme guidance, brand expectations and official resources.</p>
      </div>
      <div class="card p-5">
        <div class="text-[10px] font-extrabold tracking-[.12em] text-[#a87818]">VERIFIED TRACKING</div>
        <h3 class="mt-2 text-lg font-bold">Follow real referral activity.</h3>
        <p class="mt-2 text-xs leading-6 text-slate-600">The Ambassador Portal provides the approved view of qualifying referrals and verified programme activity.</p>
      </div>
      <div class="card p-5">
        <div class="text-[10px] font-extrabold tracking-[.12em] text-[#a87818]">PRIVATE PROGRAMME INFORMATION</div>
        <h3 class="mt-2 text-lg font-bold">Access commercial terms after approval.</h3>
        <p class="mt-2 text-xs leading-6 text-slate-600">Detailed compensation, eligibility and payout information is provided to approved Ambassadors through the secure Ambassador Portal and official programme terms.</p>
      </div>
    </div>`;

  apply.before(section);
}

function install(){
  const apply=$('#apply');
  if(!apply)return;
  renderProgrammeAccess(apply);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();