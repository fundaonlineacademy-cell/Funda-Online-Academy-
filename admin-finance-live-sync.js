(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaCanonicalFinanceDashboard)return;
window.__fundaCanonicalFinanceDashboard=true;
let db,timer,busy=false;
const n=v=>Number(v||0),money=v=>'R'+n(v).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2}),pct=(a,b)=>b?Math.round(n(a)/n(b)*100):0;
function client(){return db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY))}
function activeLabel(){return [...document.querySelectorAll('#nav button,.nav button')].find(x=>x.classList.contains('on')||x.classList.contains('active'))?.textContent||''}
function dashboardVisible(){return /dashboard/i.test(activeLabel())}
function financeVisible(){return /finance/i.test(activeLabel())}
async function snapshot(){const c=client();if(!c)return null;const r=await c.rpc('get_admin_executive_snapshot');if(r.error){console.error('Canonical executive snapshot',r.error);return null}return r.data||null}
function patchFinanceCopy(x){const root=document.querySelector('.finx');if(!root)return;const cards=[...root.querySelectorAll('.finCard span')];if(cards[0])cards[0].textContent='Approved tuition · live current course prices';const infos=[...root.querySelectorAll('.finInfo')];const priceInfo=infos.find(el=>/Price integrity:/i.test(el.textContent||''));if(priceInfo)priceInfo.innerHTML=`<b>Live pricing source:</b> current approved tuition is calculated from the live <code>courses.price</code> value for every approved enrolment. Original enrolment amounts are retained separately for audit/history. Current live value: <b>${money(x.approved_tuition)}</b> · original enrolment snapshot: <b>${money(x.enrolment_snapshot_tuition)}</b>.`;const hero=root.querySelector('.finHero p');if(hero)hero.textContent='One live financial source reading current course prices, approved enrolments, verified payments, receivables and the cashbook.'}
function patchExecutive(x){
 const approvedTuition=n(x.approved_tuition_live??x.approved_tuition),confirmedCash=n(x.confirmed_cash_income),expenses=n(x.operating_expenses),net=n(x.net_cash_result),cashMargin=confirmedCash?Math.round(net/confirmedCash*100):0,students=n(x.student_profiles),approved=n(x.approved_enrolments),courses=n(x.active_courses),completed=n(x.completed_student_courses??x.passed_course_results),certs=n(x.issued_certificates),completion=pct(completed,approved),collectedPct=approvedTuition?Math.min(100,pct(x.verified_against_approved,approvedTuition)):0;
 const health=[...document.querySelectorAll('.healthGrid .health')];
 if(health[0])health[0].innerHTML=`<h3>📈 Finance Health</h3><strong>${money(confirmedCash)}</strong><small>Confirmed cash income vs ${money(expenses)} operating expenses</small><div class="bar"><i style="width:${Math.max(0,Math.min(100,cashMargin))}%"></i></div><small class="${net>=0?'good':'warn'}">${money(net)} net cash result · ${cashMargin}% cash margin</small>`;
 if(health[1])health[1].innerHTML=`<h3>👥 Student Growth</h3><strong>${students}</strong><small>Active student profiles</small><div class="bar"><i style="width:${Math.min(100,students*4)}%"></i></div><small>${approved} approved enrolment(s)</small>`;
 if(health[2])health[2].innerHTML=`<h3>🎓 Course Performance</h3><strong>${courses}</strong><small>Active courses · live catalogue</small><div class="bar"><i style="width:${Math.min(100,completion)}%"></i></div><small class="good">${completion}% completed · ${completed} passed course result(s) · ${certs} issued certificate(s)</small>`;
 const dept=document.querySelector('.deptGrid [data-open="finance"]');if(dept){let b=dept.querySelector('b'),s=dept.querySelector('small');if(b)b.textContent=money(approvedTuition)+' approved tuition';if(s)s.textContent=`${n(x.payment_records)} payment record(s) · ${money(x.outstanding_tuition)} outstanding`}
 const academic=document.querySelector('.deptGrid [data-open="academic"]');if(academic){let b=academic.querySelector('b'),s=academic.querySelector('small');if(b)b.textContent=courses+' active courses';if(s)s.textContent=completed+' passed result(s) · '+certs+' issued certificate(s)'}
 const stats=document.querySelector('.railWrap .rail:first-child');if(stats){
   const rows=[...stats.querySelectorAll('.stat')];
   const values=[
     ['Confirmed Cash Income',money(confirmedCash)],
     ['Operating Expenses',money(expenses)],
     ['Net Cash Result',money(net)],
     ['Cash Margin',cashMargin+'%'],
     ['Cash Flow',net>=0?'Healthy':'Review']
   ];
   rows.slice(0,5).forEach((r,i)=>{if(!values[i])return;const span=r.querySelector('span'),b=r.querySelector('b');if(span)span.textContent=values[i][0];if(b){b.textContent=values[i][1];if(i===2||i===4){b.classList.toggle('good',net>=0);b.classList.toggle('warn',net<0)}}});
   let note=stats.querySelector('[data-live-finance-note]');if(!note){note=document.createElement('div');note.dataset.liveFinanceNote='1';note.style.cssText='margin-top:7px;padding-top:7px;border-top:1px solid #edf1f5;font-size:10px;color:#6e7d92;line-height:1.45';stats.appendChild(note)}
   note.textContent=`Approved tuition value: ${money(approvedTuition)} · Outstanding tuition: ${money(x.outstanding_tuition)}. Canonical live source: Finance snapshot.`;
 }
 const goals=[...document.querySelectorAll('.rail .goal')];
 const completionGoal=goals.find(g=>/Course Completion/i.test(g.textContent||''));if(completionGoal){const b=completionGoal.querySelector('.goalHead b'),bar=completionGoal.querySelector('.bar i');if(b)b.textContent=completion+'%';if(bar)bar.style.width=Math.min(100,completion)+'%'}
 const collectionGoal=goals.find(g=>/Tuition Collected|Revenue Verified/i.test(g.textContent||''));if(collectionGoal){const label=collectionGoal.querySelector('.goalHead span'),b=collectionGoal.querySelector('.goalHead b'),bar=collectionGoal.querySelector('.bar i');if(label)label.textContent='Tuition Collected';if(b)b.textContent=collectedPct+'%';if(bar)bar.style.width=collectedPct+'%'}
 const systemCheck=[...document.querySelectorAll('.auditRow')].find(r=>/System Check/i.test(r.textContent||''));if(systemCheck){const p=systemCheck.querySelector('p');if(p)p.textContent=`${courses} active course(s) · ${students} student profile(s)`}
}
async function sync(){if(busy||(!dashboardVisible()&&!financeVisible()))return;busy=true;try{const x=await snapshot();if(!x)return;window.FundaFinanceSnapshot=x;window.FundaExecutiveSnapshot=x;if(dashboardVisible())patchExecutive(x);if(financeVisible())patchFinanceCopy(x)}catch(e){console.error('Executive live sync',e)}finally{busy=false}}
function schedule(ms=250){clearTimeout(timer);timer=setTimeout(sync,ms)}
window.FundaAdminManualSync=sync;
document.addEventListener('funda:admin-manual-refresh',()=>schedule(120));document.addEventListener('funda:admin-live-change',()=>{if(financeVisible())schedule(120)});
// Initial data is fresh when the Admin portal opens. Further refreshes are manual.
setTimeout(sync,1400);
})();