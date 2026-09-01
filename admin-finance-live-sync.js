(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaCanonicalFinanceDashboard)return;
window.__fundaCanonicalFinanceDashboard=true;
let db,timer,busy=false;
const n=v=>Number(v||0),money=v=>'R'+n(v).toLocaleString('en-ZA',{maximumFractionDigits:0});
function client(){return db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY))}
function dashboardVisible(){return [...document.querySelectorAll('#nav button,.nav button')].some(x=>(x.classList.contains('on')||x.classList.contains('active'))&&/dashboard/i.test(x.textContent||''))}
async function snapshot(){const c=client();if(!c)return null;const r=await c.rpc('get_admin_finance_snapshot');if(r.error){console.error('Canonical finance snapshot',r.error);return null}return r.data||null}
async function sync(){if(busy||!dashboardVisible())return;busy=true;try{const x=await snapshot();if(!x)return;const tuition=n(x.approved_tuition),verified=n(x.verified_payments_all),expenses=n(x.operating_expenses),net=n(x.net_cash_result),margin=tuition?Math.round(net/tuition*100):0;
 const health=document.querySelector('.healthGrid .health:first-child');if(health){health.innerHTML=`<h3>📈 Finance Health</h3><strong>${money(tuition)}</strong><small>Approved tuition value · live agreed enrolment fees</small><div class="bar"><i style="width:${Math.max(0,Math.min(100,margin))}%"></i></div><small class="${net>=0?'good':'warn'}">${money(verified)} verified collections · ${money(expenses)} expenses</small>`}
 const dept=document.querySelector('.deptGrid [data-open="finance"]');if(dept){let b=dept.querySelector('b'),s=dept.querySelector('small');if(b)b.textContent=money(tuition)+' approved tuition';if(s)s.textContent=`${n(x.approved_enrolments)} approved enrolment(s) · ${money(x.outstanding_tuition)} outstanding`}
 const stats=document.querySelector('.railWrap .rail:first-child');if(stats){let rows=[...stats.querySelectorAll('.stat')];const set=(label,val)=>{let r=rows.find(z=>z.querySelector('span')?.textContent===label);if(r)r.querySelector('b').textContent=val};set('Total Revenue',money(tuition));set('Approved Tuition Value',money(tuition));set('Total Expenses',money(expenses));set('Net Result',money(net));set('Profit Margin',margin+'%');let rev=rows.find(z=>z.querySelector('span')?.textContent==='Total Revenue');if(rev)rev.querySelector('span').textContent='Approved Tuition Value';let note=stats.querySelector('[data-live-finance-note]');if(!note){note=document.createElement('div');note.dataset.liveFinanceNote='1';note.style.cssText='margin-top:7px;padding-top:7px;border-top:1px solid #edf1f5;font-size:9px;color:#6e7d92;line-height:1.45';stats.appendChild(note)}note.textContent='Live finance source: agreed enrolment fees, verified payment records and the Finance cashbook. Course price changes affect new enrolments, not historical approved learner fees.'}
 window.FundaFinanceSnapshot=x;
 }catch(e){console.error('Finance live sync',e)}finally{busy=false}}
function schedule(){clearTimeout(timer);timer=setTimeout(sync,250)}
document.addEventListener('click',e=>{if(e.target.closest?.('#nav button,.nav button'))schedule()},true);
window.addEventListener('focus',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
setInterval(sync,30000);setTimeout(sync,1400);
})();