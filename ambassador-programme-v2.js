(()=>{
'use strict';
if(!/ambassadors\.html$/i.test(location.pathname)||window.__fundaCreatorPartnerProgramme)return;
window.__fundaCreatorPartnerProgramme=true;
const $=s=>document.querySelector(s);
const milestones=[
  {target:'R10,000',commission:'R1,500',incentive:'10GB data bundle',monthly:'—',maximum:'R1,500 + data'},
  {target:'R25,000',commission:'R3,750',incentive:'R500',monthly:'—',maximum:'R4,250'},
  {target:'R50,000',commission:'R7,500',incentive:'R1,000',monthly:'—',maximum:'R8,500'},
  {target:'R100,000',commission:'R15,000',incentive:'R2,500',monthly:'R2,500',maximum:'R20,000'},
  {target:'R250,000',commission:'R37,500',incentive:'R5,000',monthly:'R7,500',maximum:'R50,000'},
  {target:'R500,000',commission:'R75,000',incentive:'R10,000',monthly:'R15,000',maximum:'R100,000'},
  {target:'R750,000',commission:'R112,500',incentive:'R15,000',monthly:'R22,500',maximum:'R150,000'},
  {target:'R1,000,000',commission:'R150,000',incentive:'R20,000',monthly:'R30,000',maximum:'R200,000'}
];

function renderCompensation(apply){
  if($('#compensation-plan'))return;
  const style=document.createElement('style');
  style.id='creatorPartnerCompensationStyle';
  style.textContent=`
    .cpcompbox{background:#fff;border:1px solid #dfd7c4;border-radius:20px;padding:20px;box-shadow:0 12px 30px rgba(33,56,77,.07)}
    .cpcompScroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .cptable{width:100%;border-collapse:collapse;min-width:900px;font-size:12px}
    .cptable th,.cptable td{padding:12px;border-bottom:1px solid #eee7d8;text-align:left;vertical-align:top}
    .cptable th{background:#21384d;color:#fff;font-weight:800}
    .cptable tbody tr:last-child td{border-bottom:0}
    .cpcompnote{font-size:12px;line-height:1.7;color:#111827;margin-top:14px}
    .cpcompstrong{font-weight:800;color:#21384d}
    @media(max-width:700px){.cpcompbox{padding:14px}.cptable{font-size:11px}}
  `;
  document.head.appendChild(style);

  const section=document.createElement('section');
  section.id='compensation-plan';
  section.className='max-w-7xl mx-auto px-5 sm:px-6 py-12';
  section.innerHTML=`
    <div class="text-center max-w-3xl mx-auto">
      <div class="text-[10px] font-extrabold tracking-[.18em] text-[#a87818]">AMBASSADOR PERFORMANCE & REWARDS · 2026</div>
      <h2 class="mt-2 text-3xl font-extrabold text-[#21384d]">15% direct commission. Clear targets. Additional performance rewards.</h2>
      <p class="mt-3 text-sm leading-6 text-black">Approved Ambassadors earn 15% direct commission after a referred student's qualifying payment and enrolment have both been verified by Funda Online Academy. Additional incentives reward verified performance without changing an Ambassador's status.</p>
    </div>
    <div class="cpcompbox mt-7">
      <div class="cpcompScroll">
        <table class="cptable">
          <thead><tr><th>Revenue Target</th><th>15% Direct Commission</th><th>Achievement Incentive</th><th>Monthly Performance Reward</th><th>Maximum Total Cash</th></tr></thead>
          <tbody>${milestones.map(r=>`<tr><td><b>${r.target}</b></td><td><b>${r.commission}</b></td><td>${r.incentive}</td><td>${r.monthly}</td><td><b>${r.maximum}</b></td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="cpcompnote"><b>How it works:</b> The 15% direct commission is earned on verified qualifying student payments. At R10,000 qualifying revenue, the Achievement Incentive is a 10GB data bundle rather than cash. Cash Achievement Incentives begin at R25,000 and are one-time cumulative milestone rewards, meaning only the additional amount needed to reach the new milestone entitlement is added when a higher milestone is first reached. Fixed Monthly Performance Rewards begin when verified qualifying revenue reaches R100,000 in a calendar month.</div>
      <div class="cpcompnote"><b>Maximum Total Cash:</b> The amounts shown combine the 15% direct commission, the applicable Achievement Incentive and the fixed Monthly Performance Reward where applicable. From R100,000 upward, the maximum total cash at the stated target is capped at 20% of qualifying revenue. The table assumes that the revenue target and a newly unlocked achievement milestone occur in the same qualifying period. All rewards remain subject to verification, eligibility and the Ambassador Programme Agreement.</div>
      <div class="cpcompnote">All participants remain <b>Ambassadors</b> throughout the programme. There are no Bronze, Silver, Gold or other rank levels, and there are no downlines, recruitment commissions or team overrides.</div>
      <div class="cpcompnote cpcompstrong">15% DIRECT COMMISSION · ACHIEVEMENT INCENTIVES · FIXED MONTHLY PERFORMANCE REWARDS · MAXIMUM 20% TOTAL CASH AT QUALIFYING TARGETS FROM R100,000</div>
    </div>`;
  apply.before(section);
}

function install(){
  const apply=$('#apply');
  if(!apply)return;
  renderCompensation(apply);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();