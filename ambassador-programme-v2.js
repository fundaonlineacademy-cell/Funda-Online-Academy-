(()=>{
'use strict';
if(!/ambassadors\.html$/i.test(location.pathname)||window.__fundaCreatorPartnerProgramme)return;
window.__fundaCreatorPartnerProgramme=true;
const $=s=>document.querySelector(s);
const ranks=[
  ['1','Ambassador','R0–R9,999','—','—'],
  ['2','Bronze','R10,000–R24,999','R500','—'],
  ['3','Silver','R25,000–R49,999','R1,000','—'],
  ['4','Gold','R50,000–R99,999','R2,500','Up to R5,000'],
  ['5','Platinum','R100,000–R249,999','R5,000','Up to R8,000'],
  ['6','Diamond','R250,000–R499,999','R10,000','Up to R12,000'],
  ['7','Executive','R500,000–R999,999','R20,000','Up to R18,000'],
  ['8','Elite','R1,000,000+','R45,000','Up to R25,000']
];

function renderCompensation(apply){
  if($('#compensation-plan'))return;
  const style=document.createElement('style');
  style.id='creatorPartnerCompensationStyle';
  style.textContent=`
    .cpcompbox{background:#fff;border:1px solid #dfd7c4;border-radius:20px;padding:20px;box-shadow:0 12px 30px rgba(33,56,77,.07)}
    .cpcompScroll{overflow-x:auto;-webkit-overflow-scrolling:touch}
    .cptable{width:100%;border-collapse:collapse;min-width:760px;font-size:12px}
    .cptable th,.cptable td{padding:12px;border-bottom:1px solid #eee7d8;text-align:left;vertical-align:top}
    .cptable th{background:#21384d;color:#fff;font-weight:800}
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
      <div class="text-[10px] font-extrabold tracking-[.18em] text-[#a87818]">CREATOR PARTNER COMPENSATION PLAN · 2026</div>
      <h2 class="mt-2 text-3xl font-extrabold text-[#21384d]">15% direct commission. Eight achievement levels.</h2>
      <p class="mt-3 text-sm leading-6 text-black">Approved Creator Partners earn only after a direct referral's student enrolment and payment have both been confirmed by Funda Online Academy.</p>
    </div>
    <div class="cpcompbox mt-7">
      <div class="cpcompScroll">
        <table class="cptable">
          <thead><tr><th>Level</th><th>Rank</th><th>Direct qualifying revenue</th><th>Commission</th><th>One-time achievement bonus</th><th>Monthly performance payment</th></tr></thead>
          <tbody>${ranks.map(r=>`<tr><td><b>${r[0]}</b></td><td><b>${r[1]}</b></td><td>${r[2]}</td><td><b>15%</b></td><td>${r[3]}</td><td>${r[4]}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="cpcompnote"><b>How it works:</b> A referral is recorded first and remains R0 until Finance verifies the received payment and Administration approves the student enrolment. The 15% direct commission is confirmed only after both checks pass. Achievement bonuses are paid once when a new level is reached. Monthly performance payments begin at Level 4 and require monthly verification and approval by Funda Online Academy. There are no downlines, recruitment commissions or team overrides.</div>
      <div class="cpcompnote cpcompstrong">15% DIRECT COMMISSION · ACHIEVEMENT BONUSES UP TO R45,000 · MONTHLY PERFORMANCE PAYMENTS UP TO R25,000</div>
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