(()=>{
"use strict";
if(!/(^|\/)ambassador-portal-v2\.html$/i.test(location.pathname))return;
if(window.__fundaAmbassadorCompactAcademyIdentity)return;
window.__fundaAmbassadorCompactAcademyIdentity=true;

const rewardBands=[
  {range:"R0 – R9,999",milestone:"R0",incentive:"—",monthly:"—"},
  {range:"R10,000 – R24,999",milestone:"R10,000",incentive:"R500",monthly:"—"},
  {range:"R25,000 – R49,999",milestone:"R25,000",incentive:"R1,000",monthly:"—"},
  {range:"R50,000 – R99,999",milestone:"R50,000",incentive:"R2,500",monthly:"Up to R5,000"},
  {range:"R100,000 – R249,999",milestone:"R100,000",incentive:"R5,000",monthly:"Up to R8,000"},
  {range:"R250,000 – R499,999",milestone:"R250,000",incentive:"R10,000",monthly:"Up to R12,000"},
  {range:"R500,000 – R999,999",milestone:"R500,000",incentive:"R20,000",monthly:"Up to R18,000"},
  {range:"R1,000,000+",milestone:"R1,000,000",incentive:"R45,000",monthly:"Up to R25,000"}
];
const legacyRankMilestones={Ambassador:"R0",Bronze:"R10,000",Silver:"R25,000",Gold:"R50,000",Platinum:"R100,000",Diamond:"R250,000",Executive:"R500,000",Elite:"R1,000,000"};

function installStyle(){
  if(document.getElementById("ambassadorAcademyIdentityCompactStyle"))return;
  const style=document.createElement("style");
  style.id="ambassadorAcademyIdentityCompactStyle";
  style.textContent=`
#ambassadorAcademyIdentitySummary{margin:14px 0 2px;padding:18px 20px;border:1px solid #dbe4ea;border-radius:14px;background:#fff;box-shadow:0 4px 18px rgba(18,57,85,.07)}
#ambassadorAcademyIdentitySummary .aaiRow{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}
#ambassadorAcademyIdentitySummary .aaiKicker{margin:0;color:#9b721c;font-size:9px;letter-spacing:.14em;font-weight:900;text-transform:uppercase}
#ambassadorAcademyIdentitySummary h2{margin:5px 0 0;color:#17324a!important;font-size:19px;line-height:1.3}
#ambassadorAcademyIdentitySummary .aaiText{margin:7px 0 0;color:#667583;font-size:12px;line-height:1.55}
#ambassadorAcademyIdentitySummary button{flex:0 0 auto;min-height:42px;padding:10px 14px;border:0;border-radius:10px;background:#173f62;color:#fff;font-size:11px;font-weight:900;cursor:pointer}
#ambassadorAcademyIdentitySummary button:hover{background:#0b2b49}
#ambassadorAcademyIdentityModal{display:none;position:fixed;inset:0;z-index:100000;background:rgba(2,10,24,.75);padding:18px;overflow-y:auto}
#ambassadorAcademyIdentityModal.is-open{display:block}
#ambassadorAcademyIdentityModal .aaiModalShell{max-width:940px;margin:20px auto;background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.35);overflow:hidden}
#ambassadorAcademyIdentityModal .aaiModalTop{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;background:linear-gradient(135deg,#07172f,#0b2b49);color:#fff}
#ambassadorAcademyIdentityModal .aaiModalTop strong{font-size:13px;letter-spacing:.03em}
#ambassadorAcademyIdentityModal .aaiClose{min-height:40px;padding:9px 14px;border:1px solid rgba(255,255,255,.24);border-radius:10px;background:rgba(255,255,255,.10);color:#fff;font-size:11px;font-weight:900;cursor:pointer}
#ambassadorAcademyIdentityModal .aaiModalContent{padding:0}
#ambassadorAcademyIdentityModal #academy-identity{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}
@media(max-width:700px){
  #ambassadorAcademyIdentitySummary{padding:17px 16px}
  #ambassadorAcademyIdentitySummary .aaiRow{flex-direction:column}
  #ambassadorAcademyIdentitySummary button{width:100%}
  #ambassadorAcademyIdentityModal{padding:10px}
  #ambassadorAcademyIdentityModal .aaiModalShell{margin:10px auto;border-radius:16px}
}
`;
  document.head.appendChild(style);
}

function compactIdentity(){
  if(document.getElementById("ambassadorAcademyIdentitySummary"))return true;
  const identity=document.getElementById("academy-identity");
  const dashboard=document.querySelector('.section[data-section="dashboard"]');
  if(!identity||!dashboard)return false;

  installStyle();

  const summary=document.createElement("section");
  summary.id="ambassadorAcademyIdentitySummary";
  summary.setAttribute("aria-labelledby","ambassadorAcademyIdentityHeading");
  summary.innerHTML=`
    <div class="aaiRow">
      <div>
        <p class="aaiKicker">Our Academy Identity</p>
        <h2 id="ambassadorAcademyIdentityHeading">What Funda Online Academy Stands For</h2>
        <p class="aaiText">Learn. Grow. Achieve. View the Academy's Vision, Mission, Purpose, Core Values, Strategic Objectives and Commitment.</p>
      </div>
      <button id="openAmbassadorAcademyIdentity" type="button" aria-haspopup="dialog" aria-controls="ambassadorAcademyIdentityModal">View Academy Identity</button>
    </div>`;
  dashboard.appendChild(summary);

  const modal=document.createElement("div");
  modal.id="ambassadorAcademyIdentityModal";
  modal.setAttribute("role","dialog");
  modal.setAttribute("aria-modal","true");
  modal.setAttribute("aria-labelledby","ambassadorAcademyIdentityModalTitle");
  modal.innerHTML=`
    <div class="aaiModalShell">
      <div class="aaiModalTop">
        <strong id="ambassadorAcademyIdentityModalTitle">Funda Online Academy Identity</strong>
        <button class="aaiClose" id="closeAmbassadorAcademyIdentity" type="button">Close</button>
      </div>
      <div class="aaiModalContent"></div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector(".aaiModalContent").appendChild(identity);

  const openButton=summary.querySelector("#openAmbassadorAcademyIdentity");
  const closeButton=modal.querySelector("#closeAmbassadorAcademyIdentity");
  let previousFocus=null;

  const open=()=>{
    previousFocus=document.activeElement;
    modal.classList.add("is-open");
    document.body.style.overflow="hidden";
    closeButton.focus();
  };
  const close=()=>{
    modal.classList.remove("is-open");
    document.body.style.overflow="";
    if(previousFocus&&typeof previousFocus.focus==="function")previousFocus.focus();
  };

  openButton.addEventListener("click",open);
  closeButton.addEventListener("click",close);
  modal.addEventListener("click",event=>{if(event.target===modal)close();});
  document.addEventListener("keydown",event=>{if(event.key==="Escape"&&modal.classList.contains("is-open"))close();});

  return true;
}

function replaceLegacyRanks(text){
  let out=String(text||"");
  Object.entries(legacyRankMilestones).forEach(([name,target])=>{
    out=out.replace(new RegExp("\\b"+name+"\\b","g"),name==="Ambassador"?"Ambassador":target+" milestone");
  });
  return out
    .replace(/rank journey/gi,"reward milestone journey")
    .replace(/current rank/gi,"current milestone status")
    .replace(/next rank/gi,"next milestone")
    .replace(/Ambassador rank/gi,"Ambassador milestone")
    .replace(/published Ambassador rank/gi,"published reward milestone")
    .replace(/rank threshold/gi,"qualifying-revenue milestone")
    .replace(/achievement bonuses/gi,"achievement incentives")
    .replace(/achievement bonus/gi,"achievement incentive")
    .replace(/monthly performance payments/gi,"monthly performance rewards")
    .replace(/monthly performance payment/gi,"monthly performance reward");
}

function setText(el,text){if(el&&el.textContent!==text)el.textContent=text}

function reframeAmbassadorRewards(){
  const navRank=document.querySelector('[data-go="rank"] span:last-child');
  const navComp=document.querySelector('[data-go="compensation"] span:last-child');
  setText(navRank,"Milestone Progress");
  setText(navComp,"Performance & Rewards");

  document.querySelectorAll('[data-go="rank"] b').forEach(el=>setText(el,"Milestone Progress"));
  document.querySelectorAll('[data-go="compensation"]').forEach(el=>{
    if(el.classList.contains('textAction')&&/compensation plan/i.test(el.textContent))setText(el,"View Performance & Rewards →");
  });

  const dashboard=document.querySelector('.section[data-section="dashboard"]');
  if(dashboard){
    const nextRank=document.getElementById('nextRank');
    if(nextRank){
      const card=nextRank.closest('.card');
      setText(card?.querySelector('.eyebrow'),"MILESTONE PROGRESS");
      setText(card?.querySelector('h2'),"Next reward milestone");
      const revised=replaceLegacyRanks(nextRank.textContent);
      if(nextRank.textContent!==revised)nextRank.textContent=revised;
    }
    const monthlyTarget=document.getElementById('monthlyTarget');
    if(monthlyTarget){const revised=replaceLegacyRanks(monthlyTarget.textContent);if(monthlyTarget.textContent!==revised)monthlyTarget.textContent=revised}
    setText(document.getElementById('statusBonus')?.closest('.earning')?.querySelector('span'),"ACHIEVEMENT INCENTIVES");
    setText(document.getElementById('statusPerformance')?.closest('.earning')?.querySelector('span'),"MONTHLY PERFORMANCE REWARDS");
    setText(document.getElementById('overviewPerformance'),"Ambassador");
    const overviewFoot=document.getElementById('overviewPerformanceFoot');
    if(overviewFoot){const revised=replaceLegacyRanks(overviewFoot.textContent);if(overviewFoot.textContent!==revised)overviewFoot.textContent=revised}
  }

  const rankSection=document.querySelector('.section[data-section="rank"]');
  if(rankSection){
    const hero=rankSection.querySelector('.rankHeroCard');
    setText(hero?.querySelector('.eyebrow'),"AMBASSADOR PERFORMANCE");
    setText(hero?.querySelector('h2'),"Milestone Progress");
    setText(hero?.querySelector('.muted'),"Your progress is based on cumulative verified qualifying revenue from students directly attributed to your Ambassador code.");
    setText(document.getElementById('rankCurrentBadge'),"AMBASSADOR");
    const numbers=hero?.querySelectorAll('.rankNumbers>div');
    if(numbers?.length>=3){
      setText(numbers[0].querySelector('span'),"CUMULATIVE QUALIFYING REVENUE");
      setText(numbers[1].querySelector('span'),"NEXT MILESTONE");
      setText(numbers[2].querySelector('span'),"REMAINING TO NEXT MILESTONE");
    }
    const next=document.getElementById('rankNext');
    if(next){
      const raw=next.textContent.trim();
      if(legacyRankMilestones[raw]&&raw!=="Ambassador")setText(next,legacyRankMilestones[raw]);
      else if(/elite achieved/i.test(raw))setText(next,"Highest milestone reached");
    }
    const progress=document.getElementById('rankProgressText');
    if(progress){const revised=replaceLegacyRanks(progress.textContent);if(progress.textContent!==revised)progress.textContent=revised}

    const cards=rankSection.querySelectorAll(':scope > .card');
    if(cards[1]){
      setText(cards[1].querySelector('.eyebrow'),"REWARD MILESTONES");
      setText(cards[1].querySelector('h2'),"Your Ambassador milestone journey");
      setText(cards[1].querySelector('.muted'),"Milestones recognise verified direct-referral performance. They do not create teams, downlines or recruitment earnings.");
    }
    const steps=document.querySelectorAll('#rankPath .rankStep');
    steps.forEach((step,i)=>{
      const band=rewardBands[i];if(!band)return;
      setText(step.querySelector('.rankStepText b'),band.range);
      setText(step.querySelector('.rankStepText span'),i===0?"Starting qualifying-revenue band":"Qualifying-revenue milestone");
      const detail='15% commission'+(band.incentive!=="—"?' · '+band.incentive+' incentive':'')+(band.monthly!=="—"?' · '+band.monthly+' monthly reward':'');
      setText(step.querySelector('.rankStepValue'),detail);
    });
    if(cards[2]){
      setText(cards[2].querySelector('.eyebrow'),"MONTHLY PERFORMANCE");
      setText(cards[2].querySelector('h2'),"Monthly Performance Reward eligibility");
      const action=cards[2].querySelector('[data-go="compensation"]');
      if(action)setText(action,"View Performance & Rewards →");
    }
    const monthly=document.getElementById('rankMonthly');
    if(monthly)monthly.innerHTML='<b>Monthly Performance Rewards become available from the R50,000 qualifying-revenue milestone.</b><br>Rewards are performance-based, subject to monthly verification and approval, and are not a salary or guaranteed monthly payment.';
  }

  const comp=document.querySelector('.section[data-section="compensation"]');
  if(comp){
    const hero=comp.querySelector('.compHero');
    setText(hero?.querySelector('.eyebrow'),"AMBASSADOR PERFORMANCE & REWARDS · 2026");
    setText(hero?.querySelector('h2'),"Ambassador Performance & Rewards");
    setText(hero?.querySelector('.muted'),"A direct student-referral programme with clear qualifying-revenue milestones and performance-based rewards. No downlines, recruitment commissions or team overrides.");
    const headline=hero?.querySelectorAll('.compHeadline .earning');
    if(headline?.length>=3){
      setText(headline[0].querySelector('span'),"DIRECT COMMISSION");
      setText(headline[0].querySelector('p'),"15% on verified qualifying revenue from students directly attributed to you.");
      setText(headline[1].querySelector('span'),"ACHIEVEMENT INCENTIVES");
      setText(headline[1].querySelector('p'),"One-time incentives unlocked when a cumulative qualifying-revenue milestone is reached.");
      setText(headline[2].querySelector('span'),"MONTHLY PERFORMANCE REWARDS");
      setText(headline[2].querySelector('p'),"Available from the R50,000 milestone, subject to monthly verification and approval.");
    }

    const mobile=document.getElementById('compMobile');
    if(mobile){
      const card=mobile.closest('.card');
      setText(card?.querySelector('.eyebrow'),"MILESTONES & REWARDS");
      setText(card?.querySelector('h2'),"Qualifying revenue milestones, incentives & rewards");
      setText(card?.querySelector('.muted'),"Cumulative milestones use verified direct qualifying student revenue.");
      const action=card?.querySelector('[data-go="rank"]');if(action)setText(action,"View My Progress →");
      mobile.querySelectorAll('article').forEach((article,i)=>{
        const band=rewardBands[i];if(!band)return;
        setText(article.querySelector('b'),band.range);
        setText(article.querySelector('span'),"Qualifying revenue milestone");
        setText(article.querySelector('em'),'15% direct commission'+(band.incentive!=="—"?' · '+band.incentive+' incentive':''));
        setText(article.querySelector('small'),band.monthly!=="—"?band.monthly+' monthly performance reward':'No monthly performance reward');
      });
    }

    const table=comp.querySelector('.compTable');
    if(table&&!table.dataset.reframedRewards){
      table.dataset.reframedRewards='1';
      table.innerHTML='<thead><tr><th>Qualifying Revenue Milestone</th><th>Direct Commission</th><th>Achievement Incentive</th><th>Monthly Performance Reward</th></tr></thead><tbody>'+rewardBands.map(b=>'<tr><td><b>'+b.range+'</b></td><td>15%</td><td>'+b.incentive+'</td><td>'+b.monthly+'</td></tr>').join('')+'</tbody>';
      table.style.minWidth='680px';
    }

    comp.querySelectorAll('.compFlowStep').forEach(step=>{
      if(/earnings are recorded separately/i.test(step.textContent)){
        setText(step.querySelector('b'),"Rewards are recorded separately");
        setText(step.querySelector('span'),"Direct commission, achievement incentives and monthly performance rewards remain auditable.");
      }
    });
  }
}

function installRewardsObserver(){
  if(window.__fundaAmbassadorRewardsPresentation)return;
  window.__fundaAmbassadorRewardsPresentation=true;
  let scheduled=false;
  const apply=()=>{scheduled=false;reframeAmbassadorRewards()};
  const queue=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(apply)};
  reframeAmbassadorRewards();
  const observer=new MutationObserver(queue);
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}

function boot(){
  compactIdentity();
  installRewardsObserver();
  let tries=0;
  const timer=setInterval(()=>{
    tries+=1;
    compactIdentity();
    reframeAmbassadorRewards();
    if(tries>=30)clearInterval(timer);
  },150);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});
else boot();
})();