(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAmbassadorPerformance)return;
window.__fundaAmbassadorPerformance=true;

let db,user,month=new Date().toISOString().slice(0,7),performance=[],referrals=[],challenge=null,lastGood=null,lastError='',channel=null,liveTimer=null,pendingLive=false,busy=false;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=n=>'R'+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:0,maximumFractionDigits:2});
const fmt=v=>v?new Date(v).toLocaleString('en-ZA',{dateStyle:'medium',timeStyle:'short'}):'—';
const label=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
function active(){const n=[...document.querySelectorAll('#nav button,.nav button')].find(b=>b.classList.contains('on')||b.classList.contains('active'));return !!(n&&n.dataset.s==='ambassadors')}
function client(){return window.__fundaSharedSupabaseClient||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY)}
const css=`
.amp{margin:10px 0;background:#fff;border:1px solid #ded5c0;border-radius:16px;padding:13px;color:#20364a}
.ampTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.amp h3{margin:0;font-size:16px}.ampLead{margin:4px 0 0;color:#697887;font-size:11px;line-height:1.5}
.ampActions{display:flex;gap:6px;flex-wrap:wrap}.ampBtn{border:0;border-radius:8px;background:#21384d;color:#fff;padding:8px 10px;font-size:10px;font-weight:900;cursor:pointer}.ampBtn.alt{background:#fff;color:#21384d;border:1px solid #d8ccb0}.ampBtn.gold{background:#c99a2e;color:#132b42}.ampBtn:disabled{opacity:.5}
.ampMonth{border:1px solid #d8ccb0;border-radius:8px;padding:7px 9px;font:inherit;font-size:10px;background:#fff}
.ampStats{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:10px}.ampStat{border:1px solid #e5decf;border-radius:10px;background:#fffaf0;padding:9px}.ampStat b{display:block;font-size:18px;color:#21384d}.ampStat span{font-size:9px;color:#71808c;font-weight:800;line-height:1.35}
.ampSignal{margin-top:9px;border-radius:9px;background:#f6f3ea;padding:9px 10px;font-size:10px;color:#5d6b78;line-height:1.5}.ampSignal b{color:#21384d}
.ampBackdrop{position:fixed;inset:0;background:rgba(3,16,31,.72);z-index:10040;display:grid;place-items:center;padding:12px}.ampModal{width:min(1120px,97vw);max-height:94vh;overflow:auto;background:#fff;border-radius:17px;box-shadow:0 30px 90px rgba(3,16,31,.38)}
.ampHead{position:sticky;top:0;z-index:2;background:linear-gradient(135deg,#03101f,#0a2344);border-bottom:4px solid #c99a2e;color:#fff;padding:15px 18px;display:flex;justify-content:space-between;gap:12px}.ampHead h3{margin:0;font-size:19px}.ampHead p{margin:4px 0 0;color:#dfe7f2;font-size:12px}.ampClose{width:36px;height:36px;border-radius:9px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.07);color:#fff;font-size:20px;cursor:pointer}.ampBody{padding:15px}
.ampTableWrap{overflow:auto;border:1px solid #e3e7eb;border-radius:10px}.ampTable{width:100%;border-collapse:collapse;min-width:900px;font-size:11px}.ampTable th,.ampTable td{padding:9px;border-bottom:1px solid #edf0f2;text-align:left;vertical-align:top}.ampTable th{background:#21384d;color:#fff;font-size:10px}.ampBadge{display:inline-block;border-radius:99px;padding:4px 7px;background:#fff1cd;color:#80600d;font-size:9px;font-weight:900}.ampBadge.recorded,.ampBadge.active,.ampBadge.approved{background:#e5f5eb;color:#176b50}.ampBadge.disqualified,.ampBadge.closed{background:#ffe7e7;color:#922727}
.ampRefGrid{display:grid;gap:9px}.ampRef{border:1px solid #e2dac8;background:#fffaf0;border-radius:11px;padding:11px}.ampRef h4{margin:0;color:#21384d}.ampMeta{font-size:10px;color:#667685;line-height:1.55}.ampCourse{margin-top:7px;padding:8px;border-radius:8px;background:#fff;border:1px solid #e8e4dc;font-size:10px;line-height:1.5}
.ampForm{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ampField label{display:block;font-size:10px;font-weight:900;color:#53657a;margin-bottom:4px}.ampField input,.ampField select,.ampField textarea{width:100%;box-sizing:border-box;border:1px solid #d6dde4;border-radius:8px;padding:8px;font:inherit;font-size:11px}.ampField textarea{min-height:90px;resize:vertical}.ampWide{grid-column:1/-1}
.ampNotice{display:none;margin:0 0 9px;padding:9px 10px;border-radius:9px;background:#fff4d6;color:#76580e;font-size:10px;font-weight:800}
@media(min-width:821px){.amp h3{font-size:18px}.ampLead{font-size:13px}.ampBtn,.ampMonth{font-size:12px}.ampStat b{font-size:21px}.ampStat span{font-size:11px}.ampSignal,.ampMeta,.ampCourse{font-size:12px}.ampTable{font-size:12px}}
@media(max-width:820px){.ampStats{grid-template-columns:repeat(2,1fr)}.ampTop{display:block}.ampActions{margin-top:9px}.ampForm{grid-template-columns:1fr}.ampWide{grid-column:auto}}
`;
function style(){if($('ampStyle'))return;let s=document.createElement('style');s.id='ampStyle';s.textContent=css;document.head.appendChild(s)}
async function load(){
  if(busy)return !!lastGood;busy=true;
  try{
    db=db||client();if(!db)throw new Error('Ambassador data connection is unavailable.');
    let auth=await db.auth.getUser();user=auth.data?.user;if(!user)throw new Error('Admin session is unavailable.');
    const first=month+'-01';
    let [p,r,c]=await Promise.all([
      db.rpc('get_admin_ambassador_performance',{p_month:first}),
      db.rpc('get_admin_ambassador_referral_details',{p_application_id:null}),
      db.from('ambassador_monthly_challenges').select('*').eq('challenge_month',first).maybeSingle()
    ]);
    let bad=[p,r,c].find(x=>x.error);if(bad)throw bad.error;
    performance=p.data||[];referrals=r.data||[];challenge=c.data||null;lastGood={performance,referrals,challenge};lastError='';return true;
  }catch(e){
    lastError=String(e?.message||e||'Ambassador performance data could not be loaded.');
    console.error('Ambassador performance load failed',e);
    if(lastGood){performance=lastGood.performance;referrals=lastGood.referrals;challenge=lastGood.challenge;return true}
    return false;
  }finally{busy=false}
}
function totals(){return{
  active:performance.length,
  referrals:performance.reduce((n,x)=>n+Number(x.valid_referrals_month||0),0),
  students:performance.reduce((n,x)=>n+Number(x.approved_students_month||0),0),
  revenue:performance.reduce((n,x)=>n+Number(x.verified_revenue_month||0),0)
}}
function comparisonText(){
  if(!performance.length)return 'No approved active Ambassadors are available for this month.';
  if(performance.length===1)return '<b>Comparative ranking begins when at least two Ambassadors are active.</b> The current Ambassador performance is still tracked against verified referrals, approved Students and revenue.';
  const top=performance[0],bottom=performance[performance.length-1];
  return '<b>Current leader:</b> '+esc(top.full_name)+' · '+money(top.verified_revenue_month)+' verified revenue. <b>Needs attention:</b> '+esc(bottom.full_name)+' · '+money(bottom.verified_revenue_month)+' verified revenue.';
}
function panel(){
  let t=totals(),challengeLine=challenge?'<b>'+esc(challenge.title)+'</b> · '+esc(label(challenge.status))+(challenge.prize_description?' · Prize: '+esc(challenge.prize_description):''):'No monthly challenge is set for this month.';
  return `<section class="amp" id="ambPerformancePanel"><div class="ampTop"><div><h3>Ambassador Performance & Referrals</h3><p class="ampLead">Verified monthly performance, referral evidence and challenge tracking without duplicating Finance controls.</p></div><div class="ampActions"><input class="ampMonth" id="ampMonth" type="month" value="${esc(month)}"><button class="ampBtn" id="ampLeaderboard">Leaderboard</button><button class="ampBtn alt" id="ampChallenge">Monthly Challenge</button><button class="ampBtn alt" id="ampReport">Report</button></div></div><div id="ampLiveNotice" class="ampNotice"></div><div class="ampStats"><div class="ampStat"><b>${t.active}</b><span>ACTIVE / INTRODUCTORY AMBASSADORS</span></div><div class="ampStat"><b>${t.referrals}</b><span>VALID REFERRALS · MONTH</span></div><div class="ampStat"><b>${t.students}</b><span>APPROVED REFERRED STUDENTS · MONTH</span></div><div class="ampStat"><b>${money(t.revenue)}</b><span>VERIFIED QUALIFYING REVENUE · MONTH</span></div></div><div class="ampSignal">${comparisonText()}<br><span>${challengeLine}</span></div></section>`
}
function bindPanel(){
  $('ampMonth').onchange=async e=>{month=e.target.value||new Date().toISOString().slice(0,7);await refresh()};
  $('ampLeaderboard').onclick=leaderboardModal;
  $('ampChallenge').onclick=challengeModal;
  $('ampReport').onclick=()=>window.openFundaReportCentre?window.openFundaReportCentre('ambassador'):alert('Report Centre is loading. Please try again.');
}
function mountPanel(){
  if(!active())return;let host=$('ambV2Admin');if(!host)return;
  $('ambPerformancePanel')?.remove();let stats=host.querySelector('.av2stats');if(stats)stats.insertAdjacentHTML('afterend',panel());else host.insertAdjacentHTML('afterbegin',panel());bindPanel();
}
function modal(title,sub,body){
  $('ampModal')?.remove();document.body.insertAdjacentHTML('beforeend',`<div class="ampBackdrop" id="ampModal"><div class="ampModal"><div class="ampHead"><div><h3>${esc(title)}</h3><p>${esc(sub)}</p></div><button class="ampClose" id="ampClose">×</button></div><div class="ampBody"><div id="ampModalNotice" class="ampNotice"></div>${body}</div></div></div>`);
  $('ampClose').onclick=closeModal;$('ampModal').onclick=e=>{if(e.target.id==='ampModal')closeModal()}
}
function closeModal(){$('ampModal')?.remove();if(pendingLive){pendingLive=false;refresh()}}
function leaderboardModal(){
  let rows=performance.map((x,i)=>`<tr><td><b>#${x.performance_position}</b>${i===0&&performance.length>1?' · Leader':''}</td><td><b>${esc(x.full_name)}</b><div class="ampMeta">${esc(x.current_rank)} · ${esc(label(x.account_status))}</div></td><td>${x.valid_referrals_month}<div class="ampMeta">${x.valid_referrals_lifetime} lifetime · ${x.disqualified_referrals} disqualified</div></td><td>${x.approved_students_month}</td><td>${money(x.verified_revenue_month)}<div class="ampMeta">${money(x.lifetime_verified_revenue)} lifetime</div></td><td>${money(x.confirmed_commission_month)}<div class="ampMeta">${money(x.monthly_performance_payment)} performance payment</div></td><td><button class="ampBtn alt" data-referrals="${x.application_id}">View Referrals</button></td></tr>`).join('');
  modal('Ambassador Performance Leaderboard',month+' · Ranking: verified qualifying revenue → approved referred Students → valid referrals.',`<div class="ampTableWrap"><table class="ampTable"><thead><tr><th>Position</th><th>Ambassador</th><th>Referrals</th><th>Approved Students</th><th>Verified Revenue</th><th>Confirmed Commission</th><th>Evidence</th></tr></thead><tbody>${rows||'<tr><td colspan="7">No active Ambassador performance records.</td></tr>'}</tbody></table></div><div class="ampSignal">The leaderboard is operational performance only. It does not automatically approve earnings, payouts or prizes.</div>`);
  document.querySelectorAll('[data-referrals]').forEach(b=>b.onclick=()=>referralModal(b.dataset.referrals));
}
function coursesHtml(items){
  if(!Array.isArray(items)||!items.length)return '<div class="ampCourse">No course enrolment is currently linked to this referral.</div>';
  return items.map(c=>`<div class="ampCourse"><b>${esc(c.course_title||'Course')}</b><br>Status: ${esc(label(c.enrollment_status||c.status||'pending'))} · Enrolled ${esc(fmt(c.enrolled_at))}${c.reviewed_at?' · Reviewed '+esc(fmt(c.reviewed_at)):''}${c.amount!=null?' · Enrolment amount '+money(c.amount):''}</div>`).join('');
}
function referralModal(appId){
  let person=performance.find(x=>String(x.application_id)===String(appId)),rows=referrals.filter(x=>String(x.application_id)===String(appId));
  modal((person?.full_name||'Ambassador')+' · Referral Evidence','Student attribution, course/enrolment evidence and confirmed commercial outcome.',`<div class="ampRefGrid">${rows.length?rows.map(x=>`<article class="ampRef"><div style="display:flex;justify-content:space-between;gap:8px"><div><h4>${esc(x.student_name)}</h4><div class="ampMeta">${esc(x.student_number||'No Student number')} · ${esc(x.student_email||'No active email')}</div></div><span class="ampBadge ${esc(x.eligibility_status)}">${esc(label(x.eligibility_status))}</span></div><div class="ampMeta" style="margin-top:6px"><b>Referred:</b> ${esc(fmt(x.referral_date))}<br><b>Referral code:</b> ${esc(x.referral_code)}<br><b>Source evidence:</b> ${esc(x.source_page||'Not recorded')}<br><b>Verified qualifying revenue:</b> ${money(x.verified_qualifying_revenue)} · <b>Confirmed commission:</b> ${money(x.confirmed_commission)}</div>${x.disqualification_reason?`<div class="ampSignal"><b>Disqualification reason:</b> ${esc(x.disqualification_reason)}</div>`:''}${coursesHtml(x.enrolments)}</article>`).join(''):'<div class="ampRef">No referral records are linked to this Ambassador.</div>'}</div>`);
}
function challengeModal(){
  const first=month+'-01',leader=performance[0];
  modal('Monthly Ambassador Challenge',month+' · Optional challenge tracking; no prize is paid automatically.',`<div class="ampForm"><div class="ampField ampWide"><label>Challenge title</label><input id="ampChallengeTitle" value="${esc(challenge?.title||'Top Ambassador of the Month')}"></div><div class="ampField ampWide"><label>Prize / recognition</label><input id="ampChallengePrize" value="${esc(challenge?.prize_description||'')}" placeholder="e.g. CEO recognition, voucher, bonus subject to Finance approval"></div><div class="ampField ampWide"><label>Rules / notes</label><textarea id="ampChallengeRules">${esc(challenge?.rules_text||'Leaderboard uses verified qualifying revenue first, then approved referred Students, then valid referrals. Any monetary award remains subject to separate Finance approval.')}</textarea></div><div class="ampField"><label>Status</label><select id="ampChallengeStatus"><option value="draft">Draft</option><option value="active">Active</option><option value="closed">Closed</option></select></div><div class="ampField"><label>Current leader</label><input disabled value="${esc(leader?leader.full_name+' · '+money(leader.verified_revenue_month):'No active Ambassadors')}"></div><div class="ampWide ampActions"><button class="ampBtn" id="ampChallengeSave">Save Challenge</button>${challenge&&challenge.status!=='closed'&&leader?'<button class="ampBtn gold" id="ampChallengeFinalise">Record Current Leader as Winner & Close</button>':''}</div></div><div class="ampSignal">Finalising a challenge records recognition only. It does not create an Ambassador earning or payout.</div>`);
  $('ampChallengeStatus').value=challenge?.status||'draft';
  $('ampChallengeSave').onclick=async()=>{
    let payload={challenge_month:first,title:$('ampChallengeTitle').value.trim(),prize_description:$('ampChallengePrize').value.trim()||null,rules_text:$('ampChallengeRules').value.trim()||null,status:$('ampChallengeStatus').value,updated_by:user.id,updated_at:new Date().toISOString()};
    if(!payload.title)return alert('Enter a challenge title.');
    let q=challenge?await db.from('ambassador_monthly_challenges').update(payload).eq('id',challenge.id):await db.from('ambassador_monthly_challenges').insert({...payload,created_by:user.id});
    if(q.error)return alert('Could not save challenge: '+q.error.message);await refresh();challengeModal();
  };
  if($('ampChallengeFinalise'))$('ampChallengeFinalise').onclick=async()=>{
    if(!leader)return;if(!confirm('Close this challenge and record '+leader.full_name+' as the winner based on the current verified leaderboard?'))return;
    let q=await db.from('ambassador_monthly_challenges').update({status:'closed',winner_application_id:leader.application_id,winner_finalised_at:new Date().toISOString(),updated_by:user.id,updated_at:new Date().toISOString()}).eq('id',challenge.id);
    if(q.error)return alert(q.error.message);await refresh();challengeModal();
  };
}
function editing(){let a=document.activeElement;return !!$('ampModal')||!!a&&!!a.closest?.('#ambPerformancePanel')&&['INPUT','TEXTAREA','SELECT'].includes(a.tagName)}
async function refresh(){let y=window.scrollY;await load();mountPanel();requestAnimationFrame(()=>window.scrollTo(0,y))}
function scheduleLive(){if(!active())return;clearTimeout(liveTimer);liveTimer=setTimeout(()=>{if(editing()){pendingLive=true;let n=$('ampLiveNotice')||$('ampModalNotice');if(n){n.style.display='block';n.textContent='A live Ambassador update is available. Finish the current edit before refreshing.'}return}pendingLive=false;refresh()},180)}
function realtime(){
  if(channel||!db)return;let ch=db.channel('admin-ambassador-performance-live-v1');
  ['ambassador_programme_applications','ambassador_v2_referrals','ambassador_earnings_ledger','ambassador_payouts','ambassador_v2_reward_state','ambassador_monthly_challenges','enrollments'].forEach(table=>{ch=ch.on('postgres_changes',{event:'*',schema:'public',table},scheduleLive)});
  channel=ch.subscribe(status=>{window.__fundaAmbassadorPerformanceRealtimeStatus=status});
}
async function init(){
  style();db=client();if(!db)return;let a=await db.auth.getUser();user=a.data?.user;if(!user)return;
  await load();mountPanel();realtime();
  let view=$('view');if(view)new MutationObserver(()=>{if(active()&&$('ambV2Admin')&&!$('ambPerformancePanel'))setTimeout(mountPanel,120)}).observe(view,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-s="ambassadors"]'))setTimeout(refresh,420)},true);
  document.addEventListener('funda:admin-manual-refresh',()=>{if(active()&&!editing())refresh()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,650));else setTimeout(init,650);
})();