(()=>{
"use strict";
if(!/(^|\/)ambassador-portal-v2\.html$/i.test(location.pathname))return;
if(window.__fundaAmbassadorPerformanceRewardsV4)return;
window.__fundaAmbassadorPerformanceRewardsV4=true;

const $=s=>document.querySelector(s);
const money=n=>'R'+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:0,maximumFractionDigits:0});
const monthKey=d=>{const x=new Date(d);return Number.isNaN(x.getTime())?'':x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')};
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
let db=null,lastData={life:0,month:0,commission:0,incentive:0,monthlyReward:0},refreshing=false;

function client(){
 if(!db&&window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
  db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 }
 return db;
}
function installStyle(){
 if($('#ambassadorPerformanceRewardsV4Style'))return;
 const s=document.createElement('style');s.id='ambassadorPerformanceRewardsV4Style';s.textContent=`
 .aprHero{background:linear-gradient(135deg,#fffaf0,#fff,#edf5fb);border:1px solid #dbe3ea;border-radius:14px;padding:20px;margin-top:14px}
 .aprHero h2,.aprCard h2{margin:0;color:#17324a}.aprKicker{font-size:10px;font-weight:900;letter-spacing:.14em;color:#9b721c}.aprLead{margin:8px 0 0;color:#566675;font-size:13px;line-height:1.65}.aprMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:15px}.aprMetric{border:1px solid #dfe5e9;border-radius:12px;padding:13px;background:#fff}.aprMetric span{display:block;color:#74808a;font-size:9px;font-weight:900;letter-spacing:.06em}.aprMetric b{display:block;margin-top:5px;color:#17324a;font-size:20px}.aprCard{background:#fff;border:1px solid #dbe3ea;border-radius:14px;padding:20px;margin-top:14px;box-shadow:0 4px 18px #1239550b}.aprProgress{height:10px;background:#e8edf0;border-radius:999px;overflow:hidden;margin-top:12px}.aprProgress i{display:block;height:100%;background:#c99a2e;width:0}.aprTableWrap{overflow:auto;border:1px solid #dfe4e8;border-radius:13px;margin-top:14px}.aprTable{width:100%;border-collapse:collapse;min-width:840px;font-size:11px}.aprTable th,.aprTable td{padding:11px;border-bottom:1px solid #edf0f2;text-align:left}.aprTable th{background:#21384d;color:#fff;font-size:9px;letter-spacing:.05em}.aprTable tr:last-child td{border-bottom:0}.aprNote{margin-top:12px;padding:12px;border-radius:11px;background:#fff4dc;color:#6e551e;font-size:12px;line-height:1.6}.aprOk{background:#eaf6ef;color:#176b50}.aprRules{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.aprRules div{border:1px solid #e0e6ea;border-radius:11px;padding:12px;font-size:12px;line-height:1.55;background:#fbfcfd}.aprRules b{display:block;color:#17324a;margin-bottom:4px}.aprMoved{text-align:center;padding:30px 18px}.aprMoved button{margin-top:12px}
 #ambassadorAcademyIdentitySummary{margin:14px 0 2px;padding:18px 20px;border:1px solid #dbe4ea;border-radius:14px;background:#fff;box-shadow:0 4px 18px rgba(18,57,85,.07)}
 #ambassadorAcademyIdentitySummary .aaiRow{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}#ambassadorAcademyIdentitySummary .aaiKicker{margin:0;color:#9b721c;font-size:9px;letter-spacing:.14em;font-weight:900;text-transform:uppercase}#ambassadorAcademyIdentitySummary h2{margin:5px 0 0;color:#17324a!important;font-size:19px;line-height:1.3}#ambassadorAcademyIdentitySummary .aaiText{margin:7px 0 0;color:#667583;font-size:12px;line-height:1.55}#ambassadorAcademyIdentitySummary button{flex:0 0 auto;min-height:42px;padding:10px 14px;border:0;border-radius:10px;background:#173f62;color:#fff;font-size:11px;font-weight:900;cursor:pointer}
 #ambassadorAcademyIdentityModal{display:none;position:fixed;inset:0;z-index:100000;background:rgba(2,10,24,.75);padding:18px;overflow-y:auto}#ambassadorAcademyIdentityModal.is-open{display:block}#ambassadorAcademyIdentityModal .aaiModalShell{max-width:940px;margin:20px auto;background:#fff;border-radius:18px;box-shadow:0 30px 80px rgba(0,0,0,.35);overflow:hidden}#ambassadorAcademyIdentityModal .aaiModalTop{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 17px;background:linear-gradient(135deg,#07172f,#0b2b49);color:#fff}#ambassadorAcademyIdentityModal .aaiModalContent{padding:0}#ambassadorAcademyIdentityModal #academy-identity{margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}#ambassadorAcademyIdentityModal .aaiClose{min-height:40px;padding:9px 14px;border:1px solid rgba(255,255,255,.24);border-radius:10px;background:rgba(255,255,255,.10);color:#fff;font-size:11px;font-weight:900;cursor:pointer}
 @media(max-width:800px){.aprMetrics{grid-template-columns:1fr 1fr}.aprRules{grid-template-columns:1fr}}
 @media(max-width:560px){.aprMetrics{grid-template-columns:1fr}.aprHero,.aprCard{padding:16px}#ambassadorAcademyIdentitySummary .aaiRow{flex-direction:column}#ambassadorAcademyIdentitySummary button{width:100%}#ambassadorAcademyIdentityModal{padding:10px}}
 `;document.head.appendChild(s);
}
function nextMilestone(life){return milestones.find(x=>life<x.target)||null}
function monthlyEntitlement(revenue){
 if(revenue>=1000000)return 30000;if(revenue>=750000)return 22500;if(revenue>=500000)return 15000;if(revenue>=250000)return 7500;if(revenue>=100000)return 2500;return 0;
}
function tableRows(){return milestones.map(m=>`<tr><td><b>${money(m.target)}</b></td><td><b>${money(m.commission)}</b></td><td>${m.incentive}</td><td>${m.monthly?money(m.monthly):'—'}</td><td><b>${m.maximum}</b></td></tr>`).join('')}
function performanceMarkup(data){
 const next=nextMilestone(data.life),base=next?(milestones[milestones.indexOf(next)-1]?.target||0):1000000;
 const pct=next?Math.max(0,Math.min(100,((data.life-base)/(next.target-base||1))*100)):100;
 const monthReward=monthlyEntitlement(data.month);
 return `<section class="aprHero"><div class="aprKicker">AMBASSADOR PERFORMANCE & REWARDS · 2026</div><h2>Performance & Rewards</h2><p class="aprLead">All participants remain <b>Ambassadors</b>. Performance is measured only on verified qualifying revenue from students directly attributed to your referral code. There are no ranks, downlines, recruitment commissions or team overrides.</p><div class="aprMetrics"><div class="aprMetric"><span>AMBASSADOR STATUS</span><b>Ambassador</b></div><div class="aprMetric"><span>LIFETIME QUALIFYING REVENUE</span><b>${money(data.life)}</b></div><div class="aprMetric"><span>THIS MONTH QUALIFYING REVENUE</span><b>${money(data.month)}</b></div><div class="aprMetric"><span>CONFIRMED REWARDS</span><b>${money(data.incentive+data.monthlyReward)}</b></div></div></section>
 <section class="aprCard"><div class="aprKicker">PROGRESS</div><h2>${next?'Next qualifying-revenue milestone: '+money(next.target):'Highest published milestone reached'}</h2><p class="aprLead">${next?money(Math.max(0,next.target-data.life))+' remaining to the next published milestone.':'Your verified qualifying revenue has reached the highest published milestone in the current programme table.'}</p><div class="aprProgress"><i style="width:${pct}%"></i></div></section>
 <section class="aprCard"><div class="aprKicker">REWARD TABLE</div><h2>15% direct commission, Achievement Incentives & fixed Monthly Performance Rewards</h2><div class="aprTableWrap"><table class="aprTable"><thead><tr><th>Revenue Target</th><th>15% Direct Commission</th><th>Achievement Incentive</th><th>Monthly Performance Reward</th><th>Maximum Total Cash</th></tr></thead><tbody>${tableRows()}</tbody></table></div><div class="aprNote"><b>How it works:</b> 15% direct commission is earned on verified qualifying student payments. At R10,000, the Achievement Incentive is a 10GB data bundle. Cash Achievement Incentives begin at R25,000 and are cumulative one-time milestone entitlements. Fixed Monthly Performance Rewards begin at R100,000 verified qualifying revenue in a calendar month.</div><div class="aprNote aprOk"><b>20% safeguard:</b> From R100,000 upward, the maximum total cash shown at each stated target does not exceed 20% of qualifying revenue.</div></section>
 <section class="aprCard"><div class="aprKicker">CURRENT MONTH</div><h2>${monthReward?money(monthReward)+' Monthly Performance Reward threshold reached':'Monthly Performance Reward not yet triggered'}</h2><p class="aprLead">${monthReward?'Current verified qualifying revenue supports a fixed reward of '+money(monthReward)+', subject to Academy verification and approval.':'Fixed Monthly Performance Rewards start at R100,000 verified qualifying revenue in a calendar month.'}</p><div class="aprRules"><div><b>Qualifies</b>Successfully paid and administrator-approved student revenue directly attributed to your Ambassador referral code.</div><div><b>Does not qualify</b>Refunds, reversals, chargebacks, fraud, manipulation, self-referrals or revenue that fails programme verification.</div></div></section>`;
}
function mountPerformanceSections(){
 const rankSection=$('.section[data-section="rank"]'),compSection=$('.section[data-section="compensation"]');
 if(rankSection){rankSection.dataset.aprV4='1';rankSection.innerHTML=performanceMarkup(lastData)}
 if(compSection){compSection.dataset.aprV4='1';compSection.innerHTML=`<section class="aprCard aprMoved"><div class="aprKicker">AMBASSADOR PERFORMANCE & REWARDS</div><h2>The current programme is available under Performance & Rewards.</h2><p class="aprLead">The former compensation/rank view has been retired. All participants remain Ambassadors.</p><button id="aprOpenPerformance" class="btn" type="button">Open Performance & Rewards</button></section>`;$('#aprOpenPerformance')?.addEventListener('click',()=>{$('[data-go="rank"]')?.click()})}
}
function fixNavigation(){
 document.querySelectorAll('.navbtn[data-go="rank"]').forEach(b=>{const label=b.querySelector('span:last-child');if(label)label.textContent='Performance & Rewards'});
 document.querySelectorAll('.navbtn[data-go="compensation"]').forEach(b=>b.remove());
 document.querySelectorAll('[data-go="compensation"]:not(.navbtn)').forEach(b=>{b.dataset.go='rank';if(/compensation|rank|level/i.test(b.textContent))b.textContent='View Performance & Rewards →'});
}
function fixProgrammeGuide(){
 const guide=$('.section[data-section="guide"]');if(!guide)return;
 guide.querySelectorAll('.guideMap [data-go="rank"]').forEach(b=>{
  const title=b.querySelector('b'),desc=b.querySelector('span');
  if(title)title.textContent='Performance & Rewards';
  if(desc)desc.textContent='Track verified qualifying revenue, milestones and rewards.';
 });
 guide.querySelectorAll('.guideMap [data-go="compensation"]').forEach(b=>{
  b.dataset.go='rank';
  const title=b.querySelector('b'),desc=b.querySelector('span');
  if(title)title.textContent='Performance & Rewards';
  if(desc)desc.textContent='Track verified qualifying revenue, milestones and rewards.';
 });
 guide.querySelectorAll('b,h2,h3,p,span').forEach(el=>{
  if(/^rank progress$/i.test(el.textContent.trim()))el.textContent='Performance & Rewards';
  else if(/^compensation plan$/i.test(el.textContent.trim()))el.textContent='Performance & Rewards';
 });
}
function fixDashboard(){
 const d=lastData,next=nextMilestone(d.life);
 const perf=$('#overviewPerformance');if(perf)perf.textContent='Ambassador';
 const meta=$('#overviewPerformanceMeta');if(meta)meta.textContent=money(d.life)+' lifetime qualifying revenue';
 const foot=$('#overviewPerformanceFoot');if(foot)foot.textContent=next?money(Math.max(0,next.target-d.life))+' to next reward milestone':'Highest published reward milestone reached';
 const nr=$('#nextRank');if(nr)nr.textContent=next?money(next.target):'Highest milestone reached';
 const mt=$('#monthlyTarget');if(mt){const r=monthlyEntitlement(d.month);mt.textContent=r?money(r)+' fixed reward currently supported':'R100,000 monthly qualifying revenue starts fixed rewards'}
 const bonus=$('#statusBonus');if(bonus?.closest('.earning')){const l=bonus.closest('.earning').querySelector('span');if(l)l.textContent='ACHIEVEMENT INCENTIVES'}
 const monthly=$('#statusPerformance');if(monthly?.closest('.earning')){const l=monthly.closest('.earning').querySelector('span');if(l)l.textContent='MONTHLY PERFORMANCE REWARDS'}
}
function fixSearch(){
 const box=$('#ambassadorSearchResults');if(!box)return;
 const seen=new Set();
 box.querySelectorAll('.ambassadorSearchResult').forEach(btn=>{
  const b=btn.querySelector('b');if(!b)return;
  if(/rank progress|compensation plan/i.test(b.textContent))b.textContent='Performance & Rewards';
  const key=b.textContent+'|'+(btn.querySelector('span')?.textContent||'');if(seen.has(key))btn.remove();else seen.add(key);
 });
}
function compactIdentity(){
 if($('#ambassadorAcademyIdentitySummary'))return true;
 const identity=$('#academy-identity'),dashboard=$('.section[data-section="dashboard"]');if(!identity||!dashboard)return false;
 const summary=document.createElement('section');summary.id='ambassadorAcademyIdentitySummary';summary.innerHTML='<div class="aaiRow"><div><p class="aaiKicker">Our Academy Identity</p><h2>What Funda Online Academy Stands For</h2><p class="aaiText">Learn. Grow. Achieve. View the Academy\'s Vision, Mission, Purpose, Core Values, Strategic Objectives and Commitment.</p></div><button id="openAmbassadorAcademyIdentity" type="button">View Academy Identity</button></div>';dashboard.appendChild(summary);
 const modal=document.createElement('div');modal.id='ambassadorAcademyIdentityModal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.innerHTML='<div class="aaiModalShell"><div class="aaiModalTop"><strong>Funda Online Academy Identity</strong><button class="aaiClose" id="closeAmbassadorAcademyIdentity" type="button">Close</button></div><div class="aaiModalContent"></div></div>';document.body.appendChild(modal);modal.querySelector('.aaiModalContent').appendChild(identity);
 const open=()=>{modal.classList.add('is-open');document.body.style.overflow='hidden'},close=()=>{modal.classList.remove('is-open');document.body.style.overflow=''};
 $('#openAmbassadorAcademyIdentity').onclick=open;$('#closeAmbassadorAcademyIdentity').onclick=close;modal.addEventListener('click',e=>{if(e.target===modal)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))close()});return true;
}
async function refreshData(){
 if(refreshing)return;const c=client();if(!c)return;refreshing=true;
 try{
  const session=await c.auth.getSession();if(!session.data?.session?.user)return;
  const q=await c.rpc('get_own_ambassador_earnings');if(q.error)return;
  const rows=q.data||[],nowKey=monthKey(new Date());
  lastData={
   life:rows.filter(x=>x.earning_type==='commission').reduce((s,x)=>s+Number(x.qualifying_revenue||0),0),
   month:rows.filter(x=>x.earning_type==='commission'&&monthKey(x.earning_month)===nowKey).reduce((s,x)=>s+Number(x.qualifying_revenue||0),0),
   commission:rows.filter(x=>x.earning_type==='commission').reduce((s,x)=>s+Number(x.commission_amount||0),0),
   incentive:rows.filter(x=>x.earning_type==='achievement_bonus').reduce((s,x)=>s+Number(x.commission_amount||0),0),
   monthlyReward:rows.filter(x=>x.earning_type==='monthly_performance').reduce((s,x)=>s+Number(x.commission_amount||0),0)
  };
  mountPerformanceSections();fixNavigation();fixProgrammeGuide();fixDashboard();fixSearch();compactIdentity();
 }finally{refreshing=false}
}
function enforce(){installStyle();fixNavigation();fixProgrammeGuide();fixDashboard();fixSearch();compactIdentity();if($('.section[data-section="rank"]')?.dataset.aprV4!=='1')mountPerformanceSections()}
function boot(){
 installStyle();let tries=0;const timer=setInterval(()=>{tries++;enforce();if($('.section[data-section="dashboard"]')&&$('.section[data-section="rank"]')){clearInterval(timer);refreshData()}else if(tries>80)clearInterval(timer)},100);
 const observer=new MutationObserver(()=>{clearTimeout(window.__aprV4Debounce);window.__aprV4Debounce=setTimeout(enforce,30)});observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
 setInterval(refreshData,300000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshData()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();