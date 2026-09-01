(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaCanonicalFinanceDashboard)return;
window.__fundaCanonicalFinanceDashboard=true;
let db,timer,busy=false;
const n=v=>Number(v||0),money=v=>'R'+n(v).toLocaleString('en-ZA',{maximumFractionDigits:0});
function client(){return db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY))}
function activeLabel(){return [...document.querySelectorAll('#nav button,.nav button')].find(x=>x.classList.contains('on')||x.classList.contains('active'))?.textContent||''}
function dashboardVisible(){return /dashboard/i.test(activeLabel())}
function financeVisible(){return /finance/i.test(activeLabel())}
async function snapshot(){const c=client();if(!c)return null;const r=await c.rpc('get_admin_finance_snapshot');if(r.error){console.error('Canonical finance snapshot',r.error);return null}return r.data||null}
function patchFinanceCopy(x){const root=document.querySelector('.finx');if(!root)return;const cards=[...root.querySelectorAll('.finCard span')];const first=cards[0];if(first)first.textContent='Approved tuition · live current course prices';const infos=[...root.querySelectorAll('.finInfo')];const priceInfo=infos.find(el=>/Price integrity:/i.test(el.textContent||''));if(priceInfo)priceInfo.innerHTML=`<b>Live pricing source:</b> current approved tuition is calculated from the live <code>courses.price</code> value for every approved enrolment. Original enrolment amounts are retained separately for audit/history. Current live value: <b>${money(x.approved_tuition)}</b> · original enrolment snapshot: <b>${money(x.enrolment_snapshot_tuition)}</b>.`;const hero=root.querySelector('.finHero p');if(hero)hero.textContent='One live financial source reading current course prices, approved enrolments, verified payments, receivables and the cashbook.'}
async function sync(){if(busy||(!dashboardVisible()&&!financeVisible()))return;busy=true;try{const x=await snapshot();if(!x)return;window.FundaFinanceSnapshot=x;const tuition=n(x.approved_tuition),verified=n(x.verified_payments_all),expenses=n(x.operating_expenses),net=n(x.net_cash_result),margin=tuition?Math.round(net/tuition*100):0;
 if(dashboardVisible()){
  const health=document.querySelector('.healthGrid .health:first-child');if(health){health.innerHTML=`<h3>📈 Finance Health</h3><strong>${money(tuition)}</strong><small>Approved tuition value · live current course prices</small><div class="bar"><i style="width:${Math.max(0,Math.min(100,margin))}%"></i></div><small class="${net>=0?'good':'warn'}">${money(verified)} verified collections · ${money(expenses)} expenses</small>`}
  const dept=document.querySelector('.deptGrid [data-open="finance"]');if(dept){let b=dept.querySelector('b'),s=dept.querySelector('small');if(b)b.textContent=money(tuition)+' approved tuition';if(s)s.textContent=`${n(x.approved_enrolments)} approved enrolment(s) · ${money(x.outstanding_tuition)} outstanding`}
  const stats=document.querySelector('.railWrap .rail:first-child');if(stats){let rows=[...stats.querySelectorAll('.stat')];const set=(label,val)=>{let r=rows.find(z=>z.querySelector('span')?.textContent===label);if(r)r.querySelector('b').textContent=val};set('Total Revenue',money(tuition));set('Approved Tuition Value',money(tuition));set('Total Expenses',money(expenses));set('Net Result',money(net));set('Profit Margin',margin+'%');let rev=rows.find(z=>z.querySelector('span')?.textContent==='Total Revenue');if(rev)rev.querySelector('span').textContent='Approved Tuition Value';let note=stats.querySelector('[data-live-finance-note]');if(!note){note=document.createElement('div');note.dataset.liveFinanceNote='1';note.style.cssText='margin-top:7px;padding-top:7px;border-top:1px solid #edf1f5;font-size:9px;color:#6e7d92;line-height:1.45';stats.appendChild(note)}note.textContent='Live finance source: current course catalogue prices + approved enrolments + verified payment records + Finance cashbook. A course-price change automatically flows into this current operating value.'}
 }
 if(financeVisible())patchFinanceCopy(x);
 }catch(e){console.error('Finance live sync',e)}finally{busy=false}}
function schedule(ms=250){clearTimeout(timer);timer=setTimeout(sync,ms)}
document.addEventListener('click',e=>{const b=e.target.closest?.('#nav button,.nav button');if(!b)return;schedule(350);if(/finance/i.test(b.textContent||'')){setTimeout(sync,900);setTimeout(sync,1600)}},true);
window.addEventListener('focus',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
setInterval(sync,30000);setTimeout(sync,1400);
})();