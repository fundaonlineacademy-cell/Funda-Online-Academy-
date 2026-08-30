(()=>{
if(!/admin-v2\.html$/i.test(location.pathname))return;
let db,timer,busy=false;
const n=v=>Number(v||0),money=v=>'R'+n(v).toLocaleString('en-ZA',{maximumFractionDigits:0}),st=v=>String(v||'').toLowerCase();
function client(){return db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY))}
function dashboardVisible(){return [...document.querySelectorAll('#nav button,.nav button')].some(x=>(x.classList.contains('on')||x.classList.contains('active'))&&/dashboard/i.test(x.textContent||''))}
async function sync(){if(busy||!dashboardVisible())return;busy=true;try{const c=client();if(!c)return;const [en,co,pay,cash]=await Promise.all([
 c.from('enrollments').select('id,status,enrollment_status,amount,course_id'),
 c.from('courses').select('id,price,active'),
 c.from('payments').select('status,amount'),
 c.from('admin_cashbook').select('entry_type,amount')
]);if(en.error||co.error)return;
 const approved=(en.data||[]).filter(x=>st(x.status||x.enrollment_status)==='approved');
 const priceMap=new Map((co.data||[]).map(x=>[String(x.id),n(x.price)]));
 const currentTuition=approved.reduce((a,x)=>a+(priceMap.has(String(x.course_id))?priceMap.get(String(x.course_id)):n(x.amount)),0);
 const verified=(pay.data||[]).filter(x=>['verified','paid','approved','completed'].includes(st(x.status))).reduce((a,x)=>a+n(x.amount),0);
 const expenses=(cash.data||[]).filter(x=>st(x.entry_type)==='expense').reduce((a,x)=>a+n(x.amount),0);
 const projected=currentTuition-expenses, margin=currentTuition?Math.round(projected/currentTuition*100):0;
 const health=document.querySelector('.healthGrid .health:first-child');if(health){health.innerHTML=`<h3>📈 Finance Health</h3><strong>${money(currentTuition)}</strong><small>Current approved tuition value · live from course prices</small><div class="bar"><i style="width:${Math.max(0,Math.min(100,margin))}%"></i></div><small class="${projected>=0?'good':'warn'}">${money(verified)} verified payments · ${money(expenses)} expenses</small>`}
 const dept=document.querySelector('.deptGrid [data-open="finance"]');if(dept){let b=dept.querySelector('b'),s=dept.querySelector('small');if(b)b.textContent=money(currentTuition)+' current tuition';if(s)s.textContent=approved.length+' approved enrolment(s) · live pricing'}
 const stats=document.querySelector('.railWrap .rail:first-child');if(stats){let rows=[...stats.querySelectorAll('.stat')];const set=(label,val)=>{let r=rows.find(x=>x.querySelector('span')?.textContent===label);if(r)r.querySelector('b').textContent=val};set('Total Revenue',money(currentTuition));set('Total Expenses',money(expenses));set('Net Result',money(projected));set('Profit Margin',margin+'%');let rev=rows.find(x=>x.querySelector('span')?.textContent==='Total Revenue');if(rev)rev.querySelector('span').textContent='Approved Tuition Value';if(!stats.querySelector('[data-live-finance-note]')){let d=document.createElement('div');d.dataset.liveFinanceNote='1';d.style.cssText='margin-top:7px;padding-top:7px;border-top:1px solid #edf1f5;font-size:9px;color:#6e7d92;line-height:1.45';d.textContent='Live finance view: approved tuition is calculated from current course prices and refreshes automatically as course pricing or approved enrolments change.';stats.appendChild(d)}}
 }catch(e){console.error('Finance live sync',e)}finally{busy=false}}
function schedule(){clearTimeout(timer);timer=setTimeout(sync,180)}
document.addEventListener('click',e=>{if(e.target.closest?.('#nav button,.nav button'))schedule()},true);
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
window.addEventListener('focus',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
setInterval(sync,30000);setTimeout(sync,1300);
})();