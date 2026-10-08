(()=>{
'use strict';
if(!/\/ambassador-portal-v2\.html$/i.test(location.pathname)||window.__fundaAmbassadorPerformanceRewardsV3)return;
window.__fundaAmbassadorPerformanceRewardsV3=true;

const milestones=[
 {target:10000,commission:1500,incentive:'10GB data bundle',monthly:0,maximum:'R1,500 + data'},
 {target:25000,commission:3750,incentive:'R500',monthly:0,maximum:'R4,250'},
 {target:50000,commission:7500,incentive:'R1,000',monthly:0,maximum:'R8,500'},
 {target:100000,commission:15000,incentive:'R2,500',monthly:2500,maximum:'R20,000'},
 {target:250000,commission:37500,incentive:'R5,000',monthly:7500,maximum:'R50,000'},
 {target:500000,commission:75000,incentive:'R10,000',monthly:15000,maximum:'R100,000'},
 {target:750000,commission:112500,incentive:'R15,000',monthly:22500,maximum:'R150,000'},
 {target:1000000,commission:150000,incentive:'R20,000',monthly:30000,maximum:'R200,000'}
];
const money=n=>'R'+Number(n||0).toLocaleString('en-ZA',{maximumFractionDigits:0});
const parseMoney=v=>Number(String(v||'').replace(/[^0-9.-]/g,''))||0;
const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text};
const nextMilestone=life=>milestones.find(m=>life<m.target)||null;
const previousTarget=life=>[...milestones].reverse().find(m=>life>=m.target)?.target||0;

function patchNav(){
 document.querySelectorAll('[data-go="rank"]').forEach(btn=>{const label=btn.querySelector('span:last-child')||btn;setText(label,'Target Progress')});
 document.querySelectorAll('[data-go="compensation"]').forEach(btn=>{const label=btn.querySelector('span:last-child')||btn;setText(label,'Performance & Rewards')});
 document.querySelectorAll('[data-go="compensation"].textAction').forEach(btn=>setText(btn,'View Performance & Rewards →'));
}

function patchEarningLabels(){
 const bonus=document.getElementById('statusBonus');
 if(bonus?.nextElementSibling)setText(bonus.nextElementSibling,'ACHIEVEMENT INCENTIVES');
 const perf=document.getElementById('statusPerformance');
 if(perf?.nextElementSibling)setText(perf.nextElementSibling,'MONTHLY PERFORMANCE REWARDS');
 const meta=document.getElementById('overviewEarningsMeta');
 if(meta&&/bonuses\s*\/\s*performance/i.test(meta.textContent||''))meta.textContent=meta.textContent.replace(/bonuses\s*\/\s*performance/i,'incentives / performance rewards');
}

function patchDashboardProgress(life){
 const next=nextMilestone(life),prev=previousTarget(life);
 const nextRank=document.getElementById('nextRank'),monthly=document.getElementById('monthlyTarget'),bar=document.getElementById('progressBar');
 const card=nextRank?.closest('section.card');
 if(card){
  const eye=card.querySelector('.eyebrow');setText(eye,'TARGET PROGRESS');
  const h=card.querySelector('h2');setText(h,'Next revenue target');
  const action=card.querySelector('[data-go="compensation"]');if(action)setText(action,'View rewards →');
 }
 if(next){
  const remaining=Math.max(0,next.target-life);
  setText(nextRank,'Next target: '+money(next.target)+'. '+money(remaining)+' more lifetime qualifying revenue to reach it.');
  const span=Math.max(1,next.target-prev),pct=Math.max(0,Math.min(100,((life-prev)/span)*100));
  if(bar&&bar.style.width!==pct+'%')bar.style.width=pct+'%';
 }else{
  setText(nextRank,'R1,000,000 qualifying-revenue target achieved.');
  if(bar)bar.style.width='100%';
 }
 setText(monthly,'Fixed Monthly Performance Rewards begin at R100,000 verified qualifying revenue in a calendar month.');
 const ov=document.getElementById('overviewPerformance');setText(ov,'Ambassador');
 const om=document.getElementById('overviewPerformanceMeta');setText(om,money(life)+' lifetime qualifying revenue');
 const of=document.getElementById('overviewPerformanceFoot');setText(of,next?money(Math.max(0,next.target-life))+' to your next revenue target':'Highest published revenue target achieved');
}

function patchPreview(){
 const box=document.querySelector('.compensationPreview');if(!box)return;
 const desired=`
  <div class="sectionHead"><div><div class="eyebrow dark">AMBASSADOR PERFORMANCE & REWARDS</div><h2>Direct commission, milestone incentives and monthly performance rewards</h2><p class="muted">Direct referrals only. All participants remain Ambassadors. No ranks, downlines, recruitment commissions or team overrides.</p></div><button class="btn gold" data-go="compensation">View Full Rewards</button></div>
  <div class="three compensationSteps">
    <div class="earning"><b>15%</b><span>DIRECT COMMISSION</span><p class="muted">On verified qualifying revenue from your own directly attributed students.</p></div>
    <div class="earning"><b>R20,000</b><span>HIGHEST CASH ACHIEVEMENT INCENTIVE</span><p class="muted">One-time cumulative milestone incentives. The R10,000 milestone begins with a 10GB data bundle.</p></div>
    <div class="earning"><b>R30,000</b><span>R1M MONTHLY PERFORMANCE REWARD</span><p class="muted">Fixed rewards begin at R100,000 verified qualifying revenue in a calendar month.</p></div>
  </div>`;
 if(box.dataset.rewardsV3!=='1'){
  box.innerHTML=desired;box.dataset.rewardsV3='1';
  box.querySelectorAll('[data-go="compensation"]').forEach(b=>b.onclick=()=>document.querySelector('.navbtn[data-go="compensation"]')?.click());
 }
}

function patchTargetSection(life){
 const section=document.querySelector('.section[data-section="rank"]');if(!section)return;
 const next=nextMilestone(life),prev=previousTarget(life);
 if(section.dataset.rewardsV3!=='1'){
  section.innerHTML=`
   <section class="card rankHeroCard">
    <div class="sectionHead"><div><div class="eyebrow dark">AMBASSADOR PERFORMANCE</div><h2>Target Progress</h2><p class="muted">Your progress is based on cumulative verified qualifying revenue from students directly attributed to your Ambassador referral code. Your programme status remains Ambassador at every target.</p></div><span id="rankCurrentBadge" class="badge ok">AMBASSADOR</span></div>
    <div class="rankNumbers"><div><span>LIFETIME QUALIFYING REVENUE</span><b id="rankLifetime">R0</b></div><div><span>NEXT REVENUE TARGET</span><b id="rankNext">R10,000</b></div><div><span>REMAINING TO NEXT TARGET</span><b id="rankRemaining">R10,000</b></div></div>
    <div class="rankProgressTrack"><i id="rankProgressFill"></i></div><p id="rankProgressText" class="muted"></p>
   </section>
   <section class="card"><div class="sectionHead"><div><div class="eyebrow dark">TARGET PATH</div><h2>Your qualifying-revenue milestones</h2><p class="muted">Targets unlock additional benefits; they do not create Ambassador ranks or hierarchy.</p></div></div><div id="rankPath" class="rankPath"></div></section>
   <section class="card"><div class="sectionHead"><div><div class="eyebrow dark">MONTHLY PERFORMANCE REWARDS</div><h2>Fixed monthly revenue targets</h2></div><button class="textAction" data-go="compensation">View Performance & Rewards →</button></div><div id="rankMonthly" class="notice gold"></div></section>`;
  section.dataset.rewardsV3='1';
  section.querySelectorAll('[data-go="compensation"]').forEach(b=>b.onclick=()=>document.querySelector('.navbtn[data-go="compensation"]')?.click());
 }
 setText(document.getElementById('rankCurrentBadge'),'AMBASSADOR');
 setText(document.getElementById('rankLifetime'),money(life));
 setText(document.getElementById('rankNext'),next?money(next.target):'R1,000,000 achieved');
 setText(document.getElementById('rankRemaining'),next?money(Math.max(0,next.target-life)):'R0');
 const fill=document.getElementById('rankProgressFill');
 if(fill){const pct=next?Math.max(0,Math.min(100,((life-prev)/Math.max(1,next.target-prev))*100)):100;fill.style.width=pct+'%'}
 setText(document.getElementById('rankProgressText'),next?money(Math.max(0,next.target-life))+' more verified lifetime qualifying revenue to reach the '+money(next.target)+' target.':'You have reached the highest published qualifying-revenue target.');
 const path=document.getElementById('rankPath');
 if(path){
  path.innerHTML=milestones.map((m,i)=>{const done=life>=m.target,active=!done&&next?.target===m.target;const state=done?'done':active?'current':'';const monthly=m.monthly?money(m.monthly)+' monthly reward':'No monthly cash reward';return `<div class="rankStep ${state}"><div class="rankStepIcon">${done?'✓':active?'●':i+1}</div><div class="rankStepText"><b>${money(m.target)} target</b><span>Achievement Incentive: ${m.incentive}</span></div><div class="rankStepValue">${monthly}</div></div>`}).join('');
 }
 const monthly=document.getElementById('rankMonthly');if(monthly){monthly.className='notice gold';monthly.innerHTML='<b>Monthly Performance Rewards start at R100,000 verified qualifying revenue in a calendar month.</b><br>R100,000 → R2,500 · R250,000 → R7,500 · R500,000 → R15,000 · R750,000 → R22,500 · R1,000,000 → R30,000.'}
}

function rewardsTable(){
 return milestones.map(m=>`<tr><td><b>${money(m.target)}</b></td><td><b>${money(m.commission)}</b></td><td>${m.incentive}</td><td>${m.monthly?money(m.monthly):'—'}</td><td><b>${m.maximum}</b></td></tr>`).join('');
}
function mobileCards(){
 return milestones.map(m=>`<article><b>${money(m.target)} target</b><span>15% commission: ${money(m.commission)}</span><em>Achievement Incentive: ${m.incentive}</em><small>Monthly Performance Reward: ${m.monthly?money(m.monthly):'—'} · Maximum Total Cash: ${m.maximum}</small></article>`).join('');
}
function patchCompensation(){
 const section=document.querySelector('.section[data-section="compensation"]');if(!section||section.dataset.rewardsV3==='1')return;
 section.innerHTML=`
  <section class="card compHero">
   <div class="sectionHead"><div><div class="eyebrow dark">AMBASSADOR PERFORMANCE & REWARDS · 2026</div><h2>Clear targets. Fixed rewards. No rank hierarchy.</h2><p class="muted">A direct student-referral programme with transparent performance rewards. All participants remain Ambassadors.</p></div><span class="badge ok">CURRENT PLAN</span></div>
   <div class="three compHeadline" style="margin-top:16px">
    <div class="earning"><b>15%</b><span>DIRECT COMMISSION</span><p class="muted">On verified qualifying revenue from students directly attributed to you.</p></div>
    <div class="earning"><b>R20,000</b><span>HIGHEST CASH ACHIEVEMENT INCENTIVE</span><p class="muted">One-time cumulative cash milestone entitlement at R1,000,000. The R10,000 milestone earns a 10GB data bundle.</p></div>
    <div class="earning"><b>R30,000</b><span>R1M MONTHLY PERFORMANCE REWARD</span><p class="muted">Fixed monthly rewards begin at R100,000 verified qualifying revenue in a calendar month.</p></div>
   </div>
  </section>
  <section class="card">
   <div class="sectionHead"><div><div class="eyebrow dark">APPROVED REWARD TABLE</div><h2>Your revenue targets and total cash</h2><p class="muted">The 15% commission remains fixed. Achievement Incentives and Monthly Performance Rewards follow the targets below.</p></div></div>
   <div class="compMobile">${mobileCards()}</div>
   <div class="tablewrap compDesktop"><table class="tbl compTable" style="min-width:900px"><thead><tr><th>Revenue Target</th><th>15% Direct Commission</th><th>Achievement Incentive</th><th>Monthly Performance Reward</th><th>Maximum Total Cash</th></tr></thead><tbody>${rewardsTable()}</tbody></table></div>
  </section>
  <section class="card"><div class="sectionHead"><div><div class="eyebrow dark">HOW REWARDS WORK</div><h2>Simple performance rules</h2></div></div><div class="compRules" style="margin-top:14px"><div class="notice"><b>Achievement Incentives</b><br>The R10,000 target earns a 10GB data bundle. Cash Achievement Incentives begin at R25,000 and are cumulative one-time milestone entitlements.</div><div class="notice gold"><b>Monthly Performance Rewards</b><br>Fixed cash rewards begin at R100,000 verified qualifying revenue achieved within a calendar month. There is no “up to” amount.</div><div class="notice"><b>20% cash protection</b><br>From R100,000 upward, the Maximum Total Cash shown at each target is exactly 20% of that qualifying revenue target.</div><div class="notice"><b>Direct referrals only</b><br>No ranks, downlines, recruitment commissions or team overrides. Programme status remains Ambassador.</div></div></section>`;
 section.dataset.rewardsV3='1';
}

let timer=0,applying=false;
function apply(){
 if(applying)return;applying=true;
 try{
  patchNav();patchEarningLabels();patchPreview();patchCompensation();
  const life=parseMoney(document.getElementById('rankLifetime')?.textContent);
  patchDashboardProgress(life);patchTargetSection(life);
 }finally{applying=false}
}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,30)}
function install(){apply();new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true,characterData:true});[300,900,1800,3500].forEach(ms=>setTimeout(apply,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();