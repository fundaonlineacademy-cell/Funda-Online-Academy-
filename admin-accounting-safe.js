(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname))return;
if(window.__FUNDA_ACCOUNTING_SAFE__)return;
window.__FUNDA_ACCOUNTING_SAFE__=true;

let db;
let S={cash:[],cats:[],rec:[],payments:[],profiles:[],settings:null,closes:[],budgets:[],pettyFunds:[],pettyMoves:[],pettyVouchers:[],pettyRecons:[]};
let loaded={cash:false,cats:false,rec:false,payments:false,profiles:false,settings:false,closes:false,budgets:false,pettyFunds:false,pettyMoves:false,pettyVouchers:false,pettyRecons:false};
let errors=[];
let tab='overview',cashPage=1,plannedPage=1,reconPage=1,budgetPage=1,pettyVoucherPage=1,pettyMovementPage=1,pettyReconPage=1;
let pettyFundId=null,pettyReportMonth=new Date().toISOString().slice(0,7);
let pnlMode='monthly',pnlMonth=new Date().toISOString().slice(0,7),pnlDay=new Date().toISOString().slice(0,10),pnlFyYear=null,pnlFrom='',pnlTo='';
let currentMonthPnl=null,currentFyPnl=null,currentPnl=null,currentPnlComparison=null,currentPnlComparisonRange=null;
const PAGE_SIZE=10;
const $=x=>document.getElementById(x);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v??'').trim().toLowerCase();
const n=v=>Number(v||0);
const money=v=>'R'+n(v).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const today=()=>new Date().toISOString().slice(0,10);
const day=v=>v?new Date(v+'T12:00:00').toLocaleDateString('en-ZA'):'—';
const fmt=v=>v?new Date(v).toLocaleString('en-ZA'):'—';

function active(){
  const b=document.querySelector('#nav button.on,#nav button.active');
  return !!b&&/expense|income|cashbook/i.test(b.textContent||'');
}
function css(){
  if($('acctSafeCss'))return;
  const s=document.createElement('style');s.id='acctSafeCss';
  s.textContent=`
  .acRoot{font-family:"Source Sans 3","Segoe UI",Arial,sans-serif;color:#10213f}
  .acHero{padding:20px;border-radius:15px;background:linear-gradient(135deg,#03101f,#0b315c);color:#fff;border-bottom:4px solid #d4af58}
  .acHero b{color:#efd78e;font-size:12px;letter-spacing:.12em}.acHero h2{margin:4px 0;font-size:24px}.acHero p{margin:0;color:#dce8f4;font-size:14px;line-height:1.55}
  .acWarn{margin:10px 0;padding:11px 13px;border:1px solid #efcaca;border-radius:10px;background:#fff3f3;color:#8b2626;font-size:13px;line-height:1.5}
  .acInfo{margin:10px 0;padding:11px 13px;border:1px solid #d7e3f0;border-radius:10px;background:#f6f9fd;color:#536174;font-size:13px;line-height:1.5}
  .acK{display:grid;grid-template-columns:repeat(5,1fr);gap:9px;margin:11px 0}.acCard,.acPanel{background:#fff;border:1px solid #e1e7ef;border-radius:12px;padding:14px}
  .acCard strong{display:block;font-size:22px;color:#071b31}.acCard span,.acMeta{font-size:12px;color:#64748b;line-height:1.45}
  .acTabs,.acBar{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin:10px 0}
  .acBtn{border:0;border-radius:8px;padding:9px 11px;background:#071b31;color:#efd78e;font:800 13px/1.2 "Source Sans 3","Segoe UI",Arial,sans-serif;cursor:pointer}
  .acBtn.alt{background:#fff;color:#071b31;border:1px solid #d9dfe8}.acBtn.ok{background:#176b50;color:#fff}.acBtn.bad{background:#9d2828;color:#fff}.acBtn:disabled{opacity:.55;cursor:not-allowed}
  .acInput,.acSelect,.acText{border:1px solid #d9dfe8;border-radius:8px;padding:9px 10px;font:400 13px/1.4 "Source Sans 3","Segoe UI",Arial,sans-serif;background:#fff;color:#10213f}
  .acInput{min-width:150px;flex:1}.acText{min-height:78px;width:100%;resize:vertical}.acGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.acForm{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.acWide{grid-column:1/-1}
  .acTableWrap{overflow:auto}.acTable{width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}.acTable th,.acTable td{padding:10px;border-bottom:1px solid #edf0f3;text-align:left;vertical-align:top}.acTable th{font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.04em;background:#f8fafc}
  .acPill{display:inline-block;padding:4px 8px;border-radius:99px;background:#edf2f7;font-size:11px;font-weight:800;text-transform:capitalize}.acPill.income,.acPill.reconciled,.acPill.posted,.acPill.closed{background:#e5f6ef;color:#176b50}.acPill.expense,.acPill.voided{background:#ffe7e7;color:#9d2828}.acPill.unreconciled,.acPill.planned,.acPill.reopened{background:#fff2d2;color:#8a5a05}
  .acSection h3{margin:4px 0 8px;color:#071b31;font-size:17px}.acPL{max-width:1280px}.acPL tr.total td{font-weight:900;border-top:2px solid #071b31}.acPL tr.subtotal td{font-weight:800;background:#f8fafc}.acPL tr.net td{font-size:15px;font-weight:900;background:#f8f4e8;border-top:2px solid #c7a13b}.acPL tr.section td{font-weight:900;color:#0b315c;background:#eef4fb}.acPL .acNum{text-align:right;white-space:nowrap}.acPL .acPct{text-align:right;white-space:nowrap;color:#536174}.acPLMetrics{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:10px 0}.acPLMetric{border:1px solid #e1e7ef;border-radius:10px;background:#fbfcfe;padding:10px}.acPLMetric strong{display:block;font-size:17px;color:#071b31}.acPLMetric span{font-size:11px;color:#64748b}.acPLMetric small{display:block;margin-top:3px;font-size:11px;color:#64748b}
  .acPager{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid #edf0f3}.acTarget{height:9px;border-radius:99px;background:#e9eef5;overflow:hidden;margin-top:8px}.acTarget i{display:block;height:100%;background:#c7a13b}.acFuture{background:#fff7e7;color:#8a5a05;font-size:12px;padding:5px 7px;border-radius:7px;display:inline-block;margin-top:4px}.acPettyK{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.acPettyCard{border:1px solid #e1e7ef;border-radius:10px;padding:11px;background:#fbfcfe}.acPettyCard strong{display:block;font-size:18px;color:#071b31}.acPettyCard span{font-size:11px;color:#64748b;line-height:1.4}
  @media(max-width:1050px){.acK{grid-template-columns:repeat(3,1fr)}.acPLMetrics{grid-template-columns:repeat(3,1fr)}.acPettyK{grid-template-columns:repeat(2,1fr)}.acForm{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:760px){.acGrid,.acForm{grid-template-columns:1fr}.acWide{grid-column:auto}.acK{grid-template-columns:repeat(2,1fr)}.acPLMetrics{grid-template-columns:repeat(2,1fr)}.acPettyK{grid-template-columns:1fr}.acHero h2{font-size:21px}}
  `;
  document.head.appendChild(s);
}
function pill(v){
  const k=low(v).replace(/\s+/g,'_');
  return '<span class="acPill '+esc(k)+'">'+esc(String(v||'—').replaceAll('_',' '))+'</span>';
}
function settings(){
  return S.settings||{financial_year_anchor:'2026-10-01',fiscal_year_start_month:10,annual_turnover_target:1000000};
}
function firstFyStart(){
  const x=settings().financial_year_anchor||'2026-10-01';
  return Number(String(x).slice(0,4))||2026;
}
function currentFyStartYear(dateValue=new Date()){
  const m=settings().fiscal_year_start_month||10,d=new Date(dateValue);
  return d.getMonth()+1>=m?d.getFullYear():d.getFullYear()-1;
}
function fyRange(year){
  const m=settings().fiscal_year_start_month||10;
  const start=new Date(year,m-1,1);
  const end=new Date(year+1,m-1,0);
  return [start.toISOString().slice(0,10),end.toISOString().slice(0,10)];
}
function monthRange(v){
  const [y,m]=String(v).split('-').map(Number);
  const a=new Date(y,m-1,1),b=new Date(y,m,0);
  return [a.toISOString().slice(0,10),b.toISOString().slice(0,10)];
}
function isoDate(d){return new Date(d).toISOString().slice(0,10)}
function shiftDays(v,days){const d=new Date(v+'T12:00:00');d.setDate(d.getDate()+days);return isoDate(d)}
function daysInclusive(from,to){return Math.max(1,Math.round((new Date(to+'T12:00:00')-new Date(from+'T12:00:00'))/86400000)+1)}
function comparisonRange(from,to){
  if(pnlMode==='monthly'){
    const d=new Date(from+'T12:00:00');d.setMonth(d.getMonth()-1);
    return monthRange(isoDate(d).slice(0,7));
  }
  if(pnlMode==='daily')return [shiftDays(from,-1),shiftDays(to,-1)];
  if(pnlMode==='financial_year'){
    const y=Number(String(from).slice(0,4));return fyRange(y-1);
  }
  const days=daysInclusive(from,to),end=shiftDays(from,-1);
  return [shiftDays(end,-days+1),end];
}
function selectedPnlRange(){
  if(pnlMode==='monthly')return monthRange(pnlMonth);
  if(pnlMode==='daily')return [pnlDay,pnlDay];
  if(pnlMode==='financial_year')return fyRange(Number(pnlFyYear||currentFyStartYear()));
  return [pnlFrom,pnlTo];
}
function monthClosed(monthStart){
  return S.closes.find(x=>x.month_start===monthStart&&x.status==='closed');
}
async function loadData(){
  db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  if(!db)return;
  errors=[];
  const jobs=[
    ['cash',db.from('admin_cashbook').select('*').order('entry_date',{ascending:false}).limit(5000)],
    ['cats',db.from('accounting_categories').select('*').order('category_type').order('name').limit(1000)],
    ['rec',db.from('finance_reconciliations').select('*').order('created_at',{ascending:false}).limit(3000)],
    ['payments',db.from('payments').select('*').order('created_at',{ascending:false}).limit(5000)],
    ['profiles',db.from('profiles').select('id,full_name,email,role,staff_number,job_title,department').limit(5000)],
    ['settings',db.from('finance_management_settings').select('*').eq('singleton',true).maybeSingle()],
    ['closes',db.from('finance_month_closes').select('*').order('month_start',{ascending:false}).limit(500)],
    ['budgets',db.from('finance_monthly_budgets').select('*').order('month_start',{ascending:true}).limit(240)],
    ['pettyFunds',db.from('finance_petty_cash_funds').select('*').order('created_at',{ascending:true}).limit(200)],
    ['pettyMoves',db.from('finance_petty_cash_movements').select('*').order('movement_date',{ascending:false}).order('created_at',{ascending:false}).limit(5000)],
    ['pettyVouchers',db.from('finance_petty_cash_vouchers').select('*').order('expense_date',{ascending:false}).order('created_at',{ascending:false}).limit(5000)],
    ['pettyRecons',db.from('finance_petty_cash_reconciliations').select('*').order('reconciliation_date',{ascending:false}).order('created_at',{ascending:false}).limit(2000)]
  ];
  const results=await Promise.all(jobs.map(x=>x[1]));
  results.forEach((r,i)=>{
    const key=jobs[i][0];
    if(r.error){errors.push(key+': '+r.error.message);return}
    S[key]=key==='settings'?(r.data||settings()):(r.data||[]);
    loaded[key]=true;
  });
  if(!pnlFyYear)pnlFyYear=currentFyStartYear();
  if((S.pettyFunds||[]).length&&!S.pettyFunds.some(x=>x.id===pettyFundId))pettyFundId=(S.pettyFunds.find(x=>x.status==='active')||S.pettyFunds[0]).id;
}
async function fetchPnl(from,to){
  const {data,error}=await db.rpc('get_admin_management_pnl',{p_from:from,p_to:to});
  if(error)throw error;
  return data||{};
}
async function refreshSummaryPnls(){
  try{
    const m=monthRange(new Date().toISOString().slice(0,7));
    const fy=fyRange(currentFyStartYear());
    const [a,b]=await Promise.all([fetchPnl(m[0],m[1]),fetchPnl(fy[0],fy[1])]);
    currentMonthPnl=a;currentFyPnl=b;
  }catch(e){errors.push('P&L summary: '+(e.message||e))}
}
function pageRows(rows,page){
  const max=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));page=Math.min(Math.max(1,page),max);
  const start=(page-1)*PAGE_SIZE;
  return {page,max,start,end:Math.min(start+PAGE_SIZE,rows.length),rows:rows.slice(start,start+PAGE_SIZE)};
}
function actualCashRows(type=''){
  return S.cash.filter(x=>(!type||low(x.entry_type)===type)&&low(x.posting_status||'posted')==='posted'&&x.entry_date<=today()&&low(x.source_type||'manual')!=='adjustment');
}
function adjustmentRows(){
  return S.cash.filter(x=>low(x.posting_status||'posted')==='posted'&&x.entry_date<=today()&&low(x.source_type||'manual')==='adjustment');
}
function futurePosted(){
  return S.cash.filter(x=>low(x.posting_status||'posted')==='posted'&&x.entry_date>today()&&!['payment','student_payment'].includes(low(x.source_type||'manual')));
}
function plannedRows(){return S.cash.filter(x=>low(x.posting_status)==='planned')}
function voidedRows(){return S.cash.filter(x=>low(x.posting_status)==='voided')}
function options(type){
  const blockedIncome=new Set(['tuition fees','registration fees']);
  return S.cats.filter(x=>x.active&&x.category_type===type&&!(type==='income'&&blockedIncome.has(low(x.name)))).map(x=>'<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join('');
}
function fyOptions(){
  const cur=currentFyStartYear(),first=Math.min(firstFyStart(),cur),years=[];
  for(let y=first;y<=Math.max(firstFyStart(),cur)+3;y++)years.push(y);
  return years.map(y=>'<option value="'+y+'" '+(Number(pnlFyYear)===y?'selected':'')+'>FY '+y+'/'+String(y+1).slice(-2)+' (1 Oct - 30 Sep)</option>').join('');
}
function budgetMonthLabel(v){
  return v?new Date(v+'T12:00:00').toLocaleDateString('en-ZA',{month:'long',year:'numeric'}):'—';
}
function budgetForMonth(monthStart){
  return (S.budgets||[]).find(x=>x.month_start===monthStart)||null;
}
function budgetExpenseTotal(b){
  if(!b)return 0;
  return n(b.direct_cost_budget)+n(b.people_cost_budget)+n(b.operating_expense_budget)+n(b.ambassador_budget)+n(b.other_expense_budget);
}
function budgetPlannedSurplus(b){
  return b?n(b.revenue_target)-budgetExpenseTotal(b):0;
}
function budgetsForFy(year){
  const [from,to]=fyRange(Number(year));
  return (S.budgets||[]).filter(x=>x.month_start>=from&&x.month_start<=to).sort((a,b)=>a.month_start.localeCompare(b.month_start));
}
function budgetTotalsForFy(year){
  const rows=budgetsForFy(year);
  return rows.reduce((a,b)=>{
    a.revenue+=n(b.revenue_target);a.direct+=n(b.direct_cost_budget);a.people+=n(b.people_cost_budget);
    a.operating+=n(b.operating_expense_budget);a.ambassador+=n(b.ambassador_budget);a.other+=n(b.other_expense_budget);
    a.minimumSurplus+=n(b.minimum_surplus_target);return a;
  },{revenue:0,direct:0,people:0,operating:0,ambassador:0,other:0,minimumSurplus:0});
}
function budgetTotalsForPeriod(from,to){
  const rows=(S.budgets||[]).filter(x=>x.month_start>=from&&x.month_start<=to);
  const total=rows.reduce((a,b)=>{
    a.revenue+=n(b.revenue_target);a.expenses+=budgetExpenseTotal(b);a.minimumSurplus+=n(b.minimum_surplus_target);return a;
  },{revenue:0,expenses:0,minimumSurplus:0});
  total.plannedSurplus=total.revenue-total.expenses;
  total.months=rows.length;
  return total;
}
function loadWarning(){
  return errors.length?'<div class="acWarn"><b>Finance data warning:</b> '+esc(errors.join(' | '))+' Failed sources are not being shown as zero.</div>':'';
}
function targetProgress(actual,target){
  if(!target)return 0;
  return Math.max(0,Math.min(100,actual/target*100));
}
function overview(){
  const m=normalisePnl(currentMonthPnl||{}),fy=normalisePnl(currentFyPnl||{}),set=settings(),target=n(set.annual_turnover_target);
  const fyRangeNow=fyRange(currentFyStartYear()),targetActive=fyRangeNow[0]>=(set.financial_year_anchor||'2026-10-01'),pct=targetActive?targetProgress(n(fy.turnover),target):0;
  const future=loaded.cash?futurePosted():[];
  const duplicateKeys=new Map();
  if(loaded.cash)for(const x of S.cash){
    const k=[x.entry_date,low(x.entry_type),Number(x.amount||0).toFixed(2),low(x.reference_number||''),low(x.category)].join('|');
    duplicateKeys.set(k,(duplicateKeys.get(k)||0)+1);
  }
  const likelyDupes=loaded.cash?[...duplicateKeys.values()].filter(v=>v>1).reduce((a,v)=>a+v-1,0):null;
  return `
  <div class="acGrid">
    <div class="acPanel">
      <h3>Current Month Management Result</h3>
      <div class="acMeta">Verified tuition / training receipts: <b>${money(m.tuition_revenue)}</b></div>
      <div class="acMeta">Other recognised income: <b>${money(n(m.total_income)-n(m.turnover))}</b></div>
      <div class="acMeta">Expenses recognised to date: <b>${money(m.total_expenses)}</b></div>
      <div class="acMeta">Net profit / (loss): <b>${money(m.net_result)}</b></div>
      ${n(m.future_posted_records)?'<div class="acFuture">'+n(m.future_posted_records)+' future-dated posted item(s), '+money(m.future_posted_amount)+', excluded until their date arrives.</div>':''}
    </div>
    <div class="acPanel">
      <h3>Annual Turnover Target</h3>
      <div class="acMeta">Management financial year: <b>1 October - 30 September</b></div>
      <div class="acMeta">Actual turnover in current FY: <b>${money(fy.turnover)}</b></div>
      ${targetActive?'<div class="acMeta">FY target: <b>'+money(target)+'</b> · '+pct.toFixed(1)+'%</div><div class="acTarget"><i style="width:'+pct+'%"></i></div><div class="acMeta" style="margin-top:6px">Remaining to target: <b>'+money(Math.max(0,target-n(fy.turnover)))+'</b> · Monthly planning target: <b>'+money(target/12)+'</b></div>':'<div class="acInfo" style="margin-top:8px">The configured annual turnover target begins on <b>'+day(set.financial_year_anchor)+'</b>. Current pre-anchor turnover is shown without applying that future target.</div>'}
    </div>
  </div>
  <div class="acGrid" style="margin-top:9px">
    <div class="acPanel">
      <h3>Cashbook Controls</h3>
      <div class="acMeta">Actual cash / bank / petty-cash entries to date: <b>${loaded.cash?actualCashRows().length:'—'}</b></div>
      <div class="acMeta">Accounting adjustments: <b>${loaded.cash?adjustmentRows().length:'—'}</b></div>
      <div class="acMeta">Planned / scheduled items: <b>${loaded.cash?plannedRows().length:'—'}</b></div>
      <div class="acMeta">Voided records retained for audit: <b>${loaded.cash?voidedRows().length:'—'}</b></div>
      <div class="acMeta">Unreconciled bank/cash entries: <b>${loaded.cash?actualCashRows().filter(x=>low(x.reconciliation_status)==='unreconciled').length:'—'}</b></div>
      ${future.length?'<div class="acFuture">'+future.length+' legacy future-dated posted item(s) require review. They are not automatically deleted or changed.</div>':''}
    </div>
    <div class="acPanel">
      <h3>Integrity Review</h3>
      <div class="acMeta">Likely duplicate records detected by date/type/amount/reference/category: <b>${likelyDupes??'—'}</b></div>
      <div class="acMeta">Browser users cannot hard-delete cashbook records. Use controlled Void when a record is wrong.</div>
      <div class="acMeta">Closed monthly P&Ls use a stored snapshot. Later changes do not silently rewrite a closed month's report.</div>
      <div class="acBar"><button class="acBtn" id="acImportPayments">Sync Verified Payments to Cashbook</button><button class="acBtn alt" id="acReports">Open Report Centre</button></div>
    </div>
  </div>`;
}
function entryForm(type){
  return `
  <div class="acPanel">
    <h3>Add ${type==='income'?'Income':'Expense'}</h3>
    <p class="acMeta">Use <b>Posted actual</b> only for transactions that have happened. Use <b>Planned / scheduled</b> for future or recurring cash items. Use <b>Accounting adjustment</b> only for approved non-cash journals such as depreciation or accountant-approved adjustments.</p>
    ${type==='income'?'<div class="acInfo"><b>Student receipts:</b> verified Student tuition/registration payments are recognised automatically from Payments. Do not duplicate them as manual Income.</div>':''}
    <div class="acForm">
      <select class="acSelect" id="aeBasis"><option value="cash">Cash / bank transaction</option><option value="adjustment">Accounting adjustment (non-cash)</option></select>
      <select class="acSelect" id="aePosting"><option value="posted">Posted actual</option><option value="planned">Planned / scheduled</option></select>
      <select class="acSelect" id="aeRecurrence"><option value="none">One-off</option><option value="monthly">Monthly recurring</option></select>
      <input type="date" class="acInput" id="aeDate" value="${today()}">
      <select class="acSelect" id="aeCat">${options(type)}</select>
      <input class="acInput" id="aeParty" placeholder="${type==='income'?'Source / payer':'Supplier / payee'}">
      <input class="acInput" id="aeRef" placeholder="Reference / receipt no.">
      <select class="acSelect" id="aeMethod"><option>EFT</option><option>Bank Transfer</option><option>Card</option><option>Cash</option><option>Bank Deposit</option><option>Other</option><option hidden>Non-cash Adjustment</option></select>
      <input class="acInput" id="aeDept" placeholder="Department">
      <input class="acInput" id="aeTax" placeholder="Tax treatment / accountant note (optional)">
      <input class="acInput" id="aeAmount" type="number" min="0" step="0.01" placeholder="Amount">
      <input class="acInput" id="aeReceipt" placeholder="Receipt / evidence URL (optional)">
      <textarea class="acText acWide" id="aeDesc" placeholder="Description / accounting note"></textarea>
    </div>
    <div class="acBar"><button class="acBtn ${type==='expense'?'bad':'ok'}" id="aeSave">Save ${type==='income'?'Income':'Expense'}</button></div>
  </div>
  ${cashbookPanel(type)}`;
}
function cashbookRows(type='',status=''){
  return S.cash.filter(x=>(!type||low(x.entry_type)===type)&&(!status||low(x.posting_status||'posted')===status));
}
function cashbookPanel(type=''){
  if(!loaded.cash)return '<div class="acPanel"><div class="acMeta">Cashbook data is unavailable. Use Refresh after checking the warning above.</div></div>';
  const status=$('acStatusFilter')?.value||'',rows=cashbookRows(type,status);
  const pg=pageRows(rows,cashPage);cashPage=pg.page;
  const body=pg.rows.map(x=>`<tr>
    <td>${day(x.entry_date)}${x.entry_date>today()&&low(x.posting_status||'posted')==='posted'?'<div class="acFuture">Future-dated posted</div>':''}</td>
    <td>${pill(x.entry_type)}</td><td>${esc(x.category)}</td><td>${esc(x.counterparty||'—')}</td>
    <td>${esc(x.description)}</td><td>${esc(x.reference_number||'—')}</td><td>${esc(x.department||'—')}</td>
    <td>${low(x.source_type)==='adjustment'?'<span class="acPill">non-cash adjustment</span>':low(x.source_type)==='petty_cash'?'<span class="acPill">petty cash voucher</span>':esc(x.source_type==='student_payment'?'verified student payment':'cash / bank')}</td>
    <td><b>${money(x.amount)}</b></td><td>${pill(x.posting_status||'posted')}<div class="acMeta">${x.recurrence==='monthly'?'Monthly recurring':''}</div></td>
    <td>${['adjustment','petty_cash'].includes(low(x.source_type))?'<span class="acMeta">Not bank-reconciled</span>':pill(x.reconciliation_status||'unreconciled')}</td>
    <td><div class="acBar" style="margin:0">${x.posting_status==='planned'?'<button class="acBtn ok" data-post="'+x.id+'">Post</button>':''}${low(x.source_type)==='petty_cash'&&x.posting_status!=='voided'?'<button class="acBtn alt" data-open-petty="1">Manage in Petty Cash</button>':x.posting_status!=='voided'?'<button class="acBtn bad" data-void="'+x.id+'">Void</button>':'<span class="acMeta">'+esc(x.void_reason||'Voided')+'</span>'}</div></td>
  </tr>`).join('')||'<tr><td colspan="12"><div class="acMeta">No accounting entries match this view.</div></td></tr>';
  return `
  <div class="acPanel" style="margin-top:9px">
    <div class="acBar" style="justify-content:space-between"><div><h3>${type==='income'?'Income Register':type==='expense'?'Expense Register':'Cashbook Register'}</h3><p class="acMeta">Posted, planned and voided records remain visible for audit integrity.</p></div>
      <select id="acStatusFilter" class="acSelect"><option value="">All posting states</option><option value="posted" ${status==='posted'?'selected':''}>Posted</option><option value="planned" ${status==='planned'?'selected':''}>Planned</option><option value="voided" ${status==='voided'?'selected':''}>Voided</option></select>
    </div>
    <div class="acTableWrap"><table class="acTable"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Counterparty</th><th>Description</th><th>Reference</th><th>Department</th><th>Basis</th><th>Amount</th><th>Posting</th><th>Recon</th><th>Action</th></tr></thead><tbody>${body}</tbody></table></div>
    <div class="acPager"><span class="acMeta">Showing ${rows.length?pg.start+1:0}–${pg.end} of ${rows.length} · 10 per page</span><div class="acBar" style="margin:0"><button class="acBtn alt" id="acPrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="acMeta">Page ${pg.page} of ${pg.max}</span><button class="acBtn alt" id="acNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div>
  </div>`;
}
function plannedPanel(){
  if(!loaded.cash)return '<div class="acPanel"><div class="acMeta">Planned-item data is currently unavailable. Use Refresh after checking the warning above.</div></div>';
  const rows=plannedRows(),pg=pageRows(rows,plannedPage);plannedPage=pg.page;
  const body=pg.rows.map(x=>`<tr><td>${day(x.entry_date)}</td><td>${pill(x.entry_type)}</td><td>${esc(x.category)}</td><td>${esc(x.description)}</td><td>${money(x.amount)}</td><td>${esc(x.recurrence||'none')}</td><td><button class="acBtn ok" data-post="${x.id}">Post Now</button> <button class="acBtn bad" data-void="${x.id}">Void</button></td></tr>`).join('')||'<tr><td colspan="7"><div class="acMeta">No planned or scheduled finance items.</div></td></tr>';
  return `<div class="acPanel"><h3>Planned & Recurring Items</h3><p class="acMeta">Planned amounts do not enter the P&L until they are posted. Monthly items create the next planned occurrence when posted.</p><div class="acTableWrap"><table class="acTable"><thead><tr><th>Planned Date</th><th>Type</th><th>Category</th><th>Description</th><th>Amount</th><th>Recurrence</th><th>Action</th></tr></thead><tbody>${body}</tbody></table></div><div class="acPager"><span class="acMeta">Showing ${rows.length?pg.start+1:0}–${pg.end} of ${rows.length}</span><div class="acBar" style="margin:0"><button class="acBtn alt" id="plPrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="acMeta">Page ${pg.page} of ${pg.max}</span><button class="acBtn alt" id="plNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div></div>`;
}
function pnlControls(){
  return `<div class="acPanel">
    <h3>Management P&L Period</h3>
    <p class="acMeta">Monthly is the normal management P&L. Daily, Financial Year and Custom Period views are available when needed.</p>
    <div class="acBar">
      <select id="pnlMode" class="acSelect"><option value="monthly" ${pnlMode==='monthly'?'selected':''}>Monthly P&L</option><option value="daily" ${pnlMode==='daily'?'selected':''}>Daily view</option><option value="financial_year" ${pnlMode==='financial_year'?'selected':''}>Financial Year</option><option value="custom" ${pnlMode==='custom'?'selected':''}>Custom period</option></select>
      ${pnlMode==='monthly'?'<input id="pnlMonth" class="acInput" type="month" value="'+esc(pnlMonth)+'">':''}
      ${pnlMode==='daily'?'<input id="pnlDay" class="acInput" type="date" value="'+esc(pnlDay)+'">':''}
      ${pnlMode==='financial_year'?'<select id="pnlFy" class="acSelect">'+fyOptions()+'</select>':''}
      ${pnlMode==='custom'?'<input id="pnlFrom" class="acInput" type="date" value="'+esc(pnlFrom)+'"><input id="pnlTo" class="acInput" type="date" value="'+esc(pnlTo)+'">':''}
      <button class="acBtn" id="pnlApply">Generate P&L</button>
    </div>
  </div><div id="acPLWrap"><div class="acPanel"><div class="acMeta">Choose a period and generate the management P&L.</div></div></div>`;
}
function sumGroup(lines,groups){
  const set=new Set(Array.isArray(groups)?groups:[groups]);
  return (lines||[]).filter(x=>set.has(x.group)).reduce((a,x)=>a+n(x.amount),0);
}
function sumOtherGroups(lines,known){
  const set=new Set(known);
  return (lines||[]).filter(x=>!set.has(x.group)).reduce((a,x)=>a+n(x.amount),0);
}
function normalisePnl(raw={}){
  const income=Array.isArray(raw.income_lines)?raw.income_lines:[],expense=Array.isArray(raw.expense_lines)?raw.expense_lines:[];
  const operatingIncome=n(raw.operating_cash_income??sumGroup(income,'Operating Income'));
  const turnover=n(raw.turnover??(n(raw.tuition_revenue)+operatingIncome));
  const otherOperatingIncome=n(raw.other_operating_income??sumGroup(income,'Other Operating Income'));
  const financeIncome=n(raw.finance_income??sumGroup(income,'Finance Income'));
  let otherIncome=sumGroup(income,'Other Income')+sumOtherGroups(income,['Operating Income','Other Operating Income','Finance Income','Other Income']);
  if(raw.non_operating_income!=null)otherIncome=n(raw.non_operating_income);
  else if(raw.other_income!=null&&otherOperatingIncome===0&&financeIncome===0&&otherIncome===0)otherIncome=n(raw.other_income);

  const directCosts=n(raw.direct_costs??sumGroup(expense,'Direct Costs'));
  const peopleCosts=n(raw.people_costs??sumGroup(expense,'People Costs'));
  const operatingExpenses=n(raw.operating_expenses??sumGroup(expense,'Operating Expenses'));
  const depreciation=n(raw.depreciation_amortisation??sumGroup(expense,'Depreciation & Amortisation'));
  const financeCosts=n(raw.finance_costs??sumGroup(expense,'Finance Costs'));
  const taxExpense=n(raw.tax_expense??sumGroup(expense,'Tax Expense'));
  let otherExpenses=sumGroup(expense,'Other Expenses')+sumOtherGroups(expense,['Direct Costs','People Costs','Operating Expenses','Depreciation & Amortisation','Finance Costs','Tax Expense','Other Expenses']);
  if(raw.non_operating_expenses!=null)otherExpenses=n(raw.non_operating_expenses);
  else if(raw.other_expenses!=null&&depreciation===0&&financeCosts===0&&taxExpense===0&&otherExpenses===0)otherExpenses=n(raw.other_expenses);

  const grossProfit=turnover-directCosts;
  const operatingBeforeDA=grossProfit+otherOperatingIncome-peopleCosts-operatingExpenses;
  const operatingProfit=operatingBeforeDA-depreciation;
  const profitBeforeTax=operatingProfit+financeIncome+otherIncome-financeCosts-otherExpenses;
  const netResult=profitBeforeTax-taxExpense;
  return {...raw,
    income_lines:income,expense_lines:expense,operating_cash_income:operatingIncome,turnover,
    other_operating_income:otherOperatingIncome,finance_income:financeIncome,non_operating_income:otherIncome,
    other_income:otherOperatingIncome+financeIncome+otherIncome,
    direct_costs:directCosts,gross_profit:grossProfit,people_costs:peopleCosts,operating_expenses:operatingExpenses,
    depreciation_amortisation:depreciation,finance_costs:financeCosts,tax_expense:taxExpense,non_operating_expenses:otherExpenses,
    other_expenses:depreciation+financeCosts+taxExpense+otherExpenses,
    operating_profit_before_da:operatingBeforeDA,operating_profit:operatingProfit,profit_before_tax:profitBeforeTax,
    total_income:turnover+otherOperatingIncome+financeIncome+otherIncome,
    total_expenses:directCosts+peopleCosts+operatingExpenses+depreciation+financeCosts+taxExpense+otherExpenses,
    net_result:netResult
  };
}
function ratio(v,base){return base?Number(v||0)/Number(base)*100:0}
function pct(v){return Number.isFinite(Number(v))?Number(v).toFixed(1)+'%':'—'}
function categoryPairs(currentLines,comparisonLines,groups){
  const allowed=new Set(Array.isArray(groups)?groups:[groups]),map=new Map();
  for(const x of currentLines||[]){if(!allowed.has(x.group))continue;const k=x.category||'Uncategorised';const row=map.get(k)||{category:k,current:0,comparison:0};row.current+=n(x.amount);map.set(k,row)}
  for(const x of comparisonLines||[]){if(!allowed.has(x.group))continue;const k=x.category||'Uncategorised';const row=map.get(k)||{category:k,current:0,comparison:0};row.comparison+=n(x.amount);map.set(k,row)}
  return [...map.values()].sort((a,b)=>Math.abs(b.current)-Math.abs(a.current)||a.category.localeCompare(b.category));
}
function pnlDataRows(x,comp){
  x=normalisePnl(x);comp=normalisePnl(comp||{});
  const rows=[],push=(section,account,current,comparison,type='line')=>rows.push({section,account,current:n(current),comparison:n(comparison),type});
  const addCategories=(section,groups,kind)=>{
    const a=kind==='income'?x.income_lines:x.expense_lines,b=kind==='income'?comp.income_lines:comp.expense_lines;
    categoryPairs(a,b,groups).forEach(r=>push(section,r.category,r.current,r.comparison,'line'));
  };

  push('Revenue / Turnover','Verified tuition / training revenue',x.tuition_revenue,comp.tuition_revenue);
  addCategories('Revenue / Turnover','Operating Income','income');
  push('Revenue / Turnover','Total Turnover',x.turnover,comp.turnover,'total');

  addCategories('Cost of Sales / Direct Costs','Direct Costs','expense');
  push('Cost of Sales / Direct Costs','Total Direct Costs',x.direct_costs,comp.direct_costs,'subtotal');
  push('Gross Profit','GROSS PROFIT',x.gross_profit,comp.gross_profit,'total');

  addCategories('Other Operating Income','Other Operating Income','income');
  push('Other Operating Income','Total Other Operating Income',x.other_operating_income,comp.other_operating_income,'subtotal');

  addCategories('People Costs','People Costs','expense');
  push('People Costs','Total People Costs',x.people_costs,comp.people_costs,'subtotal');

  addCategories('Operating Expenses','Operating Expenses','expense');
  push('Operating Expenses','Total Other Operating Expenses',x.operating_expenses,comp.operating_expenses,'subtotal');
  push('Operating Result','Operating Profit before Depreciation & Amortisation',x.operating_profit_before_da,comp.operating_profit_before_da,'subtotal');

  addCategories('Depreciation & Amortisation','Depreciation & Amortisation','expense');
  push('Depreciation & Amortisation','Total Depreciation & Amortisation',x.depreciation_amortisation,comp.depreciation_amortisation,'subtotal');
  push('Operating Expense Summary','TOTAL OPERATING EXPENSES',n(x.people_costs)+n(x.operating_expenses)+n(x.depreciation_amortisation),n(comp.people_costs)+n(comp.operating_expenses)+n(comp.depreciation_amortisation),'total');
  push('Operating Result','OPERATING PROFIT / (LOSS)',x.operating_profit,comp.operating_profit,'total');

  addCategories('Finance Income','Finance Income','income');
  push('Finance Income','Total Finance Income',x.finance_income,comp.finance_income,'subtotal');
  addCategories('Finance Costs','Finance Costs','expense');
  push('Finance Costs','Total Finance Costs',x.finance_costs,comp.finance_costs,'subtotal');

  addCategories('Other Income','Other Income','income');
  push('Other Income','Total Other Income',x.non_operating_income,comp.non_operating_income,'subtotal');
  addCategories('Other Expenses','Other Expenses','expense');
  push('Other Expenses','Total Other Expenses',x.non_operating_expenses,comp.non_operating_expenses,'subtotal');

  push('Income Summary','TOTAL INCOME',x.total_income,comp.total_income,'total');
  push('Profit Before Tax','PROFIT / (LOSS) BEFORE TAX',x.profit_before_tax,comp.profit_before_tax,'total');
  addCategories('Income Tax','Tax Expense','expense');
  push('Income Tax','Total Income Tax Expense',x.tax_expense,comp.tax_expense,'subtotal');
  push('Expense Summary','TOTAL EXPENSES',x.total_expenses,comp.total_expenses,'total');
  push('Net Result','NET PROFIT / (LOSS)',x.net_result,comp.net_result,'net');
  return rows;
}
function pnlTableRows(x,comp){
  const turnover=n(x.turnover),rows=pnlDataRows(x,comp);
  let section='';
  return rows.map(r=>{
    const heading=r.section!==section?(section=r.section,'<tr class="section"><td colspan="5">'+esc(section)+'</td></tr>'):'';
    const variance=r.current-r.comparison,cls=r.type==='net'?'net':r.type==='total'?'total':r.type==='subtotal'?'subtotal':'';
    return heading+'<tr class="'+cls+'"><td>'+esc(r.account)+'</td><td class="acNum">'+money(r.current)+'</td><td class="acNum">'+money(r.comparison)+'</td><td class="acNum">'+money(variance)+'</td><td class="acPct">'+pct(ratio(r.current,turnover))+'</td></tr>';
  }).join('');
}
function pnlMarkup(raw,rawComp,from,to,compFrom,compTo){
  const x=normalisePnl(raw),comp=normalisePnl(rawComp||{}),set=settings(),annual=n(set.annual_turnover_target),anchor=set.financial_year_anchor||'2026-10-01';
  const monthBudget=budgetForMonth(from),periodBudget=(pnlMode==='monthly'&&monthBudget)
    ?{revenue:n(monthBudget.revenue_target),expenses:budgetExpenseTotal(monthBudget),plannedSurplus:budgetPlannedSurplus(monthBudget),minimumSurplus:n(monthBudget.minimum_surplus_target),months:1}
    :(pnlMode==='financial_year'?budgetTotalsForPeriod(from,to):null);
  let target=null,label='';
  if(from>=anchor&&pnlMode==='monthly'){target=periodBudget?.months?periodBudget.revenue:annual/12;label='Monthly revenue target'}
  if(from>=anchor&&pnlMode==='financial_year'){target=periodBudget?.months?periodBudget.revenue:annual;label='Annual revenue target'}
  const progress=target?targetProgress(n(x.turnover),target):0;
  const close=from===monthRange(from.slice(0,7))[0]&&to===monthRange(from.slice(0,7))[1]?monthClosed(from):null;
  const canClose=pnlMode==='monthly'&&to<today()&&!close;
  const grossMargin=ratio(x.gross_profit,x.turnover),operatingMargin=ratio(x.operating_profit,x.turnover),netMargin=ratio(x.net_result,x.turnover);
  const compareLabel=day(compFrom)+' - '+day(compTo);
  return `
  <div class="acPanel acPL">
    <div class="acBar" style="justify-content:space-between"><div><h3>Management Profit & Loss Statement</h3><div class="acMeta">${day(from)} - ${day(to)} · comparison ${compareLabel} · ${x.period_status==='closed'?'Closed monthly snapshot':'Live management basis'}</div></div><div>${pill(x.period_status||'live')}</div></div>
    <div class="acInfo"><b>Basis:</b> verified Student receipts are recognised from the approved Payments workflow; other posted income/expenses and approved accounting adjustments are recognised by their transaction date. Planned, voided, duplicate Student-payment ledger copies and future-dated posted transactions are excluded. This is a management P&L and is not a statutory tax return or a substitute for accountant year-end adjustments.</div>
    ${n(x.future_posted_records)?'<div class="acWarn"><b>Future-dated items excluded:</b> '+n(x.future_posted_records)+' posted record(s), '+money(x.future_posted_amount)+', fall after today and are not recognised yet.</div>':''}
    <div class="acPLMetrics">
      <div class="acPLMetric"><strong>${money(x.turnover)}</strong><span>Turnover</span><small>Comparison ${money(comp.turnover)}</small></div>
      <div class="acPLMetric"><strong>${money(x.gross_profit)}</strong><span>Gross profit</span><small>Gross margin ${pct(grossMargin)}</small></div>
      <div class="acPLMetric"><strong>${money(x.operating_profit)}</strong><span>Operating profit / (loss)</span><small>Operating margin ${pct(operatingMargin)}</small></div>
      <div class="acPLMetric"><strong>${money(x.profit_before_tax)}</strong><span>Profit / (loss) before tax</span><small>Comparison ${money(comp.profit_before_tax)}</small></div>
      <div class="acPLMetric"><strong>${money(x.net_result)}</strong><span>Net profit / (loss)</span><small>Net margin ${pct(netMargin)}</small></div>
    </div>
    <div class="acTableWrap"><table class="acTable">
      <thead><tr><th>Account</th><th class="acNum">Current Period</th><th class="acNum">Comparison Period</th><th class="acNum">Variance</th><th class="acPct">% of Turnover</th></tr></thead>
      <tbody>${pnlTableRows(x,comp)}</tbody>
    </table></div>
    ${target!==null?'<div class="acPanel" style="margin-top:10px"><div class="acMeta">'+label+': <b>'+money(target)+'</b> · Actual turnover: <b>'+money(x.turnover)+'</b> · Revenue variance: <b>'+money(n(x.turnover)-target)+'</b></div><div class="acTarget"><i style="width:'+progress+'%"></i></div></div>':''}
    ${periodBudget?.months?'<div class="acGrid" style="margin-top:10px"><div class="acPanel"><h3>Budget vs Actual</h3><div class="acMeta">Revenue target: <b>'+money(periodBudget.revenue)+'</b></div><div class="acMeta">Actual turnover: <b>'+money(x.turnover)+'</b></div><div class="acMeta">Revenue variance: <b>'+money(n(x.turnover)-periodBudget.revenue)+'</b></div></div><div class="acPanel"><h3>Expense & Surplus Plan</h3><div class="acMeta">Expense budget: <b>'+money(periodBudget.expenses)+'</b></div><div class="acMeta">Actual expenses: <b>'+money(x.total_expenses)+'</b></div><div class="acMeta">Expense headroom / (overrun): <b>'+money(periodBudget.expenses-n(x.total_expenses))+'</b></div><div class="acMeta">Planned surplus: <b>'+money(periodBudget.plannedSurplus)+'</b> · Actual net profit/(loss): <b>'+money(x.net_result)+'</b></div><div class="acMeta">Minimum surplus target: <b>'+money(periodBudget.minimumSurplus)+'</b></div></div></div>':''}
    <div class="acMeta" style="margin-top:8px">Verified payment records: ${n(x.verified_payment_records)} · Pending/unverified collections excluded: ${money(x.pending_collections)} · Posted non-payment income records: ${n(x.cash_income_records)} · Posted expense/adjustment records: ${n(x.cash_expense_records)}</div>
    <div class="acBar"><button class="acBtn" id="acExcelPL">Download Excel (.xlsx)</button><button class="acBtn" id="acPdfPL">Download PDF</button>${canClose?'<button class="acBtn ok" id="acCloseMonth">Close Month</button>':''}${close?'<button class="acBtn alt" id="acReopenMonth">Reopen Month</button>':''}</div>
  </div>`;
}
function reconciliation(){
  if(!loaded.cash)return '<div class="acPanel"><div class="acMeta">Reconciliation data is currently unavailable. Use Refresh after checking the warning above.</div></div>';
  const rows=actualCashRows().filter(x=>low(x.reconciliation_status)!=='excluded'),pg=pageRows(rows,reconPage);reconPage=pg.page;
  const body=pg.rows.map(x=>`<tr><td>${day(x.entry_date)}</td><td>${esc(x.reference_number||'—')}</td><td>${esc(x.description)}</td><td>${money(x.amount)}</td><td>${pill(x.reconciliation_status||'unreconciled')}</td><td>${x.reconciliation_status==='reconciled'?'<span class="acMeta">Reconciled '+fmt(x.reconciled_at)+'</span>':'<button class="acBtn ok" data-reconcile="'+x.id+'">Mark Reconciled</button>'}</td></tr>`).join('')||'<tr><td colspan="6"><div class="acMeta">No posted actual cashbook entries.</div></td></tr>';
  return `<div class="acPanel"><h3>Entry Reconciliation</h3><p class="acMeta">Reconcile actual posted cashbook records against supporting evidence or the bank statement. Reconciled accounting values cannot be silently rewritten.</p><div class="acTableWrap"><table class="acTable"><thead><tr><th>Date</th><th>Reference</th><th>Description</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>${body}</tbody></table></div><div class="acPager"><span class="acMeta">Showing ${rows.length?pg.start+1:0}–${pg.end} of ${rows.length}</span><div class="acBar" style="margin:0"><button class="acBtn alt" id="rePrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="acMeta">Page ${pg.page} of ${pg.max}</span><button class="acBtn alt" id="reNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div></div>`;
}
function budgetInput(id,key,value,extra=''){
  return '<input class="acInput" style="min-width:118px;width:118px" type="number" min="0" step="0.01" id="bud-'+key+'-'+id+'" value="'+Number(value||0).toFixed(2)+'" '+extra+'>';
}
function targetsPanel(){
  const set=settings(),year=firstFyStart(),target=n(set.annual_turnover_target),rows=budgetsForFy(year),pg=pageRows(rows,budgetPage);
  budgetPage=pg.page;
  const totals=budgetTotalsForFy(year),expenseBudget=totals.direct+totals.people+totals.operating+totals.ambassador+totals.other,plannedSurplus=totals.revenue-expenseBudget;
  const body=pg.rows.map(b=>'<tr>'+
    '<td><b>'+esc(budgetMonthLabel(b.month_start))+'</b><div class="acMeta">'+esc(b.month_start)+'</div></td>'+
    '<td>'+budgetInput(b.id,'revenue',b.revenue_target)+'</td>'+
    '<td>'+budgetInput(b.id,'direct',b.direct_cost_budget)+'</td>'+
    '<td>'+budgetInput(b.id,'people',b.people_cost_budget)+'</td>'+
    '<td>'+budgetInput(b.id,'operating',b.operating_expense_budget)+'</td>'+
    '<td>'+budgetInput(b.id,'ambassador',b.ambassador_budget)+'</td>'+
    '<td>'+budgetInput(b.id,'other',b.other_expense_budget)+'</td>'+
    '<td>'+budgetInput(b.id,'minimum',b.minimum_surplus_target)+'</td>'+
    '<td><b>'+money(budgetPlannedSurplus(b))+'</b><div class="acMeta">Revenue target less planned expenses</div></td>'+
    '<td><input class="acInput" style="min-width:180px;width:180px" id="bud-notes-'+b.id+'" value="'+esc(b.notes||'')+'" placeholder="Planning note"></td>'+
    '<td><button class="acBtn" data-budget-save="'+b.id+'">Save month</button></td>'+
  '</tr>').join('')||'<tr><td colspan="11"><div class="acMeta">No monthly budget rows are available for this financial year.</div></td></tr>';

  return `<div class="acGrid">
    <div class="acPanel"><h3>Management Financial Year</h3><p class="acMeta">The Academy management year is configured from <b>1 October to 30 September</b>. The first configured management year begins <b>${day(set.financial_year_anchor)}</b>. This is an internal management period and should only be treated as the statutory company year if confirmed by the accountant.</p><div class="acForm"><label class="acMeta">First management year start<input id="fyAnchor" class="acInput" type="date" value="${esc(set.financial_year_anchor)}"></label><label class="acMeta">Annual turnover target<input id="fyTarget" class="acInput" type="number" min="0" step="0.01" value="${target}"></label><div class="acBar"><button class="acBtn" id="saveFinanceSettings">Save Management Settings</button></div></div></div>
    <div class="acPanel"><h3>Annual Planning Summary</h3><div class="acMeta">Annual revenue target: <b>${money(target)}</b></div><div class="acMeta">Monthly baseline: <b>${money(target/12)}</b></div><div class="acMeta">Budgeted revenue across 12 months: <b>${money(totals.revenue)}</b></div><div class="acMeta">Budgeted expenses: <b>${money(expenseBudget)}</b></div><div class="acMeta">Planned surplus: <b>${money(plannedSurplus)}</b></div><div class="acMeta">FY ${year}/${String(year+1).slice(-2)} runs 1 Oct ${year} - 30 Sep ${year+1}.</div><div class="acBar"><button class="acBtn alt" id="distributeAnnualTarget">Distribute Annual Target Across 12 Months</button></div><div class="acMeta">Distribution changes only monthly revenue targets. It does not overwrite expense, Ambassador, staff or surplus budgets.</div></div>
  </div>
  <div class="acPanel" style="margin-top:10px">
    <div class="acBar" style="justify-content:space-between"><div><h3>Monthly Budget & Target Planner</h3><p class="acMeta">Plan revenue and cost limits before each month begins. Zero means no budget has been approved yet; it does not mean the future expense cannot occur.</p></div><span class="acPill">FY ${year}/${String(year+1).slice(-2)}</span></div>
    <div class="acTableWrap"><table class="acTable">
      <thead><tr><th>Month</th><th>Revenue Target</th><th>Direct Costs</th><th>Staff / People</th><th>Operating Expenses</th><th>Ambassador</th><th>Other Expenses</th><th>Minimum Surplus</th><th>Planned Surplus</th><th>Notes</th><th>Action</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>
    <div class="acPager"><span class="acMeta">Showing ${rows.length?pg.start+1:0}–${pg.end} of ${rows.length} months · Maximum 10 per page</span><div class="acBar" style="margin:0"><button class="acBtn alt" id="budPrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="acMeta">Page ${pg.page} of ${pg.max}</span><button class="acBtn alt" id="budNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div>
  </div>`;
}

function safeHttp(v){const s=String(v||'').trim();return /^https?:\/\//i.test(s)?s:''}
function pettyFund(){
  return (S.pettyFunds||[]).find(x=>x.id===pettyFundId)||null;
}
function pettyProfileName(id){
  const p=(S.profiles||[]).find(x=>x.id===id);
  return p?.full_name||p?.email||'—';
}
function pettyCustodianOptions(selected=''){
  return '<option value="">No linked staff profile</option>'+(S.profiles||[])
    .filter(p=>['admin','staff'].includes(low(p.role)))
    .map(p=>'<option value="'+esc(p.id)+'" '+(p.id===selected?'selected':'')+'>'+esc(p.full_name||p.email)+' · '+esc(p.staff_number||p.job_title||p.role||'Staff')+'</option>').join('');
}
function pettyExpenseOptions(){
  return (S.cats||[]).filter(x=>x.active&&x.category_type==='expense'&&low(x.name)!=='depreciation & amortisation')
    .map(x=>'<option value="'+esc(x.name)+'">'+esc(x.name)+'</option>').join('');
}
function pettyMoveEffect(m){
  if(low(m.status)!=='posted')return 0;
  if(['opening_float','replenishment'].includes(low(m.movement_type)))return n(m.amount);
  if(low(m.movement_type)==='return_to_bank')return -n(m.amount);
  return 0;
}
function pettyBalance(fundId,asOf=today()){
  const move=(S.pettyMoves||[]).filter(x=>x.fund_id===fundId&&x.movement_date<=asOf).reduce((a,x)=>a+pettyMoveEffect(x),0);
  const spent=(S.pettyVouchers||[]).filter(x=>x.fund_id===fundId&&low(x.status)==='posted'&&x.expense_date<=asOf).reduce((a,x)=>a+n(x.amount),0);
  return move-spent;
}
function pettyPendingTotal(fundId){
  return (S.pettyVouchers||[]).filter(x=>x.fund_id===fundId&&low(x.status)==='pending').reduce((a,x)=>a+n(x.amount),0);
}
function pettyMovementRows(fundId){
  const rows=(S.pettyMoves||[]).filter(x=>x.fund_id===fundId),pg=pageRows(rows,pettyMovementPage);pettyMovementPage=pg.page;
  const body=pg.rows.map(x=>`<tr>
    <td>${day(x.movement_date)}</td>
    <td>${pill(String(x.movement_type||'').replaceAll('_',' '))}</td>
    <td><b>${money(x.amount)}</b></td>
    <td>${esc(x.reference_number||'—')}</td>
    <td>${esc(x.notes||'—')}</td>
    <td>${pill(x.status||'posted')}${x.void_reason?'<div class="acMeta">'+esc(x.void_reason)+'</div>':''}</td>
    <td>${low(x.status)==='posted'?'<button class="acBtn bad" data-pc-void-move="'+x.id+'">Void</button>':'—'}</td>
  </tr>`).join('')||'<tr><td colspan="7"><div class="acMeta">No petty cash funding movements recorded.</div></td></tr>';
  return {rows,pg,html:`<div class="acTableWrap"><table class="acTable"><thead><tr><th>Date</th><th>Movement</th><th>Amount</th><th>Reference</th><th>Notes</th><th>Status</th><th>Action</th></tr></thead><tbody>${body}</tbody></table></div><div class="acPager"><span class="acMeta">Showing ${rows.length?pg.start+1:0}–${pg.end} of ${rows.length} · 10 per page</span><div class="acBar" style="margin:0"><button class="acBtn alt" id="pcMovePrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="acMeta">Page ${pg.page} of ${pg.max}</span><button class="acBtn alt" id="pcMoveNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div>`};
}
function pettyVoucherRows(fundId){
  const rows=(S.pettyVouchers||[]).filter(x=>x.fund_id===fundId),pg=pageRows(rows,pettyVoucherPage);pettyVoucherPage=pg.page;
  const body=pg.rows.map(x=>{
    const evidence=safeHttp(x.receipt_url);
    const action=low(x.status)==='pending'
      ?'<button class="acBtn ok" data-pc-approve="'+x.id+'">Approve & Post</button> <button class="acBtn bad" data-pc-reject="'+x.id+'">Reject</button>'
      :low(x.status)==='posted'
        ?'<button class="acBtn bad" data-pc-void-voucher="'+x.id+'">Void</button>'
        :'—';
    return `<tr>
      <td><b>${esc(x.voucher_number)}</b><div class="acMeta">${day(x.expense_date)}</div></td>
      <td>${esc(x.category)}</td><td>${esc(x.payee||'—')}</td><td>${esc(x.description)}</td>
      <td><b>${money(x.amount)}</b></td><td>${esc(x.department||'—')}</td>
      <td>${evidence?'<a href="'+esc(evidence)+'" target="_blank" rel="noopener">Open receipt ↗</a>':esc(x.evidence_note||'—')}</td>
      <td>${pill(x.status)}${x.review_note?'<div class="acMeta">'+esc(x.review_note)+'</div>':''}${x.void_reason?'<div class="acMeta">'+esc(x.void_reason)+'</div>':''}</td>
      <td>${action}</td>
    </tr>`;
  }).join('')||'<tr><td colspan="9"><div class="acMeta">No petty cash vouchers recorded.</div></td></tr>';
  return {rows,pg,html:`<div class="acTableWrap"><table class="acTable"><thead><tr><th>Voucher / Date</th><th>Expense Category</th><th>Payee</th><th>Description</th><th>Amount</th><th>Department</th><th>Evidence</th><th>Status</th><th>Action</th></tr></thead><tbody>${body}</tbody></table></div><div class="acPager"><span class="acMeta">Showing ${rows.length?pg.start+1:0}–${pg.end} of ${rows.length} · 10 per page</span><div class="acBar" style="margin:0"><button class="acBtn alt" id="pcVoucherPrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="acMeta">Page ${pg.page} of ${pg.max}</span><button class="acBtn alt" id="pcVoucherNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div>`};
}
function pettyReconRows(fundId){
  const rows=(S.pettyRecons||[]).filter(x=>x.fund_id===fundId),pg=pageRows(rows,pettyReconPage);pettyReconPage=pg.page;
  const body=pg.rows.map(x=>`<tr><td>${day(x.reconciliation_date)}</td><td>${money(x.system_balance)}</td><td>${money(x.counted_cash)}</td><td><b>${money(x.variance)}</b></td><td>${esc(x.notes||'—')}</td><td>${fmt(x.created_at)}</td></tr>`).join('')||'<tr><td colspan="6"><div class="acMeta">No petty cash reconciliations recorded.</div></td></tr>';
  return {rows,pg,html:`<div class="acTableWrap"><table class="acTable"><thead><tr><th>Reconciliation Date</th><th>System Balance</th><th>Counted Cash</th><th>Variance</th><th>Notes</th><th>Recorded</th></tr></thead><tbody>${body}</tbody></table></div><div class="acPager"><span class="acMeta">Showing ${rows.length?pg.start+1:0}–${pg.end} of ${rows.length} · 10 per page</span><div class="acBar" style="margin:0"><button class="acBtn alt" id="pcReconPrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="acMeta">Page ${pg.page} of ${pg.max}</span><button class="acBtn alt" id="pcReconNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div>`};
}
function pettyFundSetup(){
  return `<div class="acPanel"><h3>Create Petty Cash Fund</h3><div class="acInfo">Creating a fund does not create cash or an expense. Set the authorised maximum float, then record the actual opening float separately when cash is placed in the fund.</div><div class="acForm">
    <input class="acInput" id="pcNewName" placeholder="Fund name e.g. Main Petty Cash">
    <select class="acSelect" id="pcNewCustodian">${pettyCustodianOptions()}</select>
    <input class="acInput" id="pcNewCustodianName" placeholder="Custodian name if not linked to staff">
    <input class="acInput" id="pcNewFloat" type="number" min="0" step="0.01" placeholder="Authorised float">
    <button class="acBtn" id="pcCreateFund">Create Fund</button>
  </div></div>`;
}
function pettyCashPanel(){
  const funds=S.pettyFunds||[];
  if(!loaded.pettyFunds)return '<div class="acPanel"><div class="acMeta">Petty cash data is unavailable. Use Refresh after checking the Finance warning.</div></div>';
  if(!funds.length)return `<div class="acInfo"><b>Petty Cash Control</b><br>No petty cash fund has been created yet. No cash amount has been assumed.</div>${pettyFundSetup()}`;

  const f=pettyFund()||funds[0],balance=pettyBalance(f.id),pending=pettyPendingTotal(f.id),headroom=n(f.authorized_float)-balance;
  const lastRecon=(S.pettyRecons||[]).find(x=>x.fund_id===f.id);
  const moves=pettyMovementRows(f.id),vouchers=pettyVoucherRows(f.id),recons=pettyReconRows(f.id);
  const fundOpts=funds.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===f.id?'selected':'')+'>'+esc(x.fund_name)+' · '+esc(x.status)+'</option>').join('');
  return `
    <div class="acInfo"><b>Petty Cash Control.</b> Opening float, replenishments and returns are cash transfers and do not affect profit. Only an approved petty-cash voucher posts an expense to the P&L, using the voucher's real accounting category.</div>
    <div class="acBar"><select class="acSelect" id="pcFundSelect">${fundOpts}</select><button class="acBtn alt" id="pcNewFundShow">Create Another Fund</button></div>
    <div id="pcNewFundHost"></div>
    <div class="acPettyK">
      <div class="acPettyCard"><strong>${money(f.authorized_float)}</strong><span>Authorised float</span></div>
      <div class="acPettyCard"><strong>${money(balance)}</strong><span>Current system cash balance</span></div>
      <div class="acPettyCard"><strong>${money(headroom)}</strong><span>Float headroom</span></div>
      <div class="acPettyCard"><strong>${money(pending)}</strong><span>Pending voucher requests</span></div>
    </div>
    ${lastRecon?'<div class="'+(Math.abs(n(lastRecon.variance))>0.005?'acWarn':'acInfo')+'"><b>Last cash count:</b> '+day(lastRecon.reconciliation_date)+' · system '+money(lastRecon.system_balance)+' · counted '+money(lastRecon.counted_cash)+' · variance '+money(lastRecon.variance)+'</div>':''}

    <div class="acGrid">
      <div class="acPanel"><h3>Fund Control</h3><div class="acForm">
        <input class="acInput" id="pcFundName" value="${esc(f.fund_name)}" placeholder="Fund name">
        <select class="acSelect" id="pcCustodian">${pettyCustodianOptions(f.custodian_profile_id||'')}</select>
        <input class="acInput" id="pcCustodianName" value="${esc(f.custodian_name||'')}" placeholder="Custodian name if not linked">
        <input class="acInput" id="pcAuthFloat" type="number" min="0" step="0.01" value="${n(f.authorized_float).toFixed(2)}" placeholder="Authorised float">
        <select class="acSelect" id="pcFundStatus"><option value="active" ${f.status==='active'?'selected':''}>Active</option><option value="closed" ${f.status==='closed'?'selected':''}>Closed</option></select>
        <button class="acBtn" id="pcUpdateFund">Update Fund</button>
      </div><div class="acMeta">Custodian: <b>${esc(f.custodian_profile_id?pettyProfileName(f.custodian_profile_id):(f.custodian_name||'Not assigned'))}</b>. A fund can be closed only after its balance is zero.</div></div>

      <div class="acPanel"><h3>Fund / Replenish / Return Cash</h3><div class="acForm">
        <select class="acSelect" id="pcMoveType"><option value="opening_float">Opening float</option><option value="replenishment">Replenishment</option><option value="return_to_bank">Return to bank</option></select>
        <input class="acInput" id="pcMoveAmount" type="number" min="0" step="0.01" placeholder="Amount">
        <input class="acInput" id="pcMoveDate" type="date" value="${today()}">
        <input class="acInput" id="pcMoveRef" placeholder="Bank / cash reference">
        <input class="acInput" id="pcMoveNotes" placeholder="Movement notes">
        <button class="acBtn" id="pcRecordMove">Record Movement</button>
      </div><div class="acMeta">Replenishment cannot take the system balance above the authorised float. These movements do not enter the P&L.</div></div>
    </div>

    <div class="acPanel" style="margin-top:10px"><h3>Petty Cash Voucher</h3><div class="acInfo">Create the voucher first. A Finance approver must then use <b>Approve & Post</b> before the purchase reduces petty cash and appears as a P&L expense.</div><div class="acForm">
      <input class="acInput" id="pcVoucherDate" type="date" value="${today()}">
      <select class="acSelect" id="pcVoucherCategory">${pettyExpenseOptions()}</select>
      <input class="acInput" id="pcVoucherPayee" placeholder="Payee / supplier">
      <input class="acInput" id="pcVoucherDept" placeholder="Department / purpose">
      <input class="acInput" id="pcVoucherAmount" type="number" min="0" step="0.01" placeholder="Amount">
      <input class="acInput" id="pcVoucherReceipt" type="url" placeholder="Receipt / evidence URL (optional)">
      <input class="acInput acWide" id="pcVoucherEvidence" placeholder="Evidence note / explanation if no receipt URL">
      <textarea class="acText acWide" id="pcVoucherDesc" placeholder="What was purchased and why"></textarea>
      <button class="acBtn" id="pcCreateVoucher">Create Voucher Request</button>
    </div></div>

    <div class="acPanel" style="margin-top:10px"><h3>Voucher Register</h3>${vouchers.html}</div>
    <div class="acPanel" style="margin-top:10px"><h3>Funding & Cash Movement Register</h3>${moves.html}</div>

    <div class="acGrid" style="margin-top:10px">
      <div class="acPanel"><h3>Cash Count & Reconciliation</h3><div class="acForm">
        <input class="acInput" id="pcReconDate" type="date" value="${today()}">
        <input class="acInput" id="pcCountedCash" type="number" min="0" step="0.01" placeholder="Physical cash counted">
        <input class="acInput acWide" id="pcReconNotes" placeholder="Reconciliation note; required if there is a variance">
        <button class="acBtn" id="pcReconcile">Record Reconciliation</button>
      </div><div class="acMeta">System balance now: <b>${money(balance)}</b>. A reconciliation records any difference; it does not silently create an adjustment.</div></div>

      <div class="acPanel"><h3>Petty Cash Report</h3><input class="acInput" id="pcReportMonth" type="month" value="${esc(pettyReportMonth)}"><div class="acBar"><button class="acBtn" id="pcExcel">Download Excel</button><button class="acBtn" id="pcPdf">Download PDF</button></div><div class="acMeta">The report includes fund movements, voucher status, actual inflows/outflows and the running petty cash balance for the selected month.</div></div>
    </div>
    <div class="acPanel" style="margin-top:10px"><h3>Reconciliation History</h3>${recons.html}</div>
  `;
}
function pettyReportRows(fund,month){
  const [from,to]=monthRange(month),opening=pettyBalance(fund.id,shiftDays(from,-1));
  let running=opening;
  const rows=[];
  for(const x of (S.pettyMoves||[]).filter(x=>x.fund_id===fund.id&&x.movement_date>=from&&x.movement_date<=to)){
    const posted=low(x.status)==='posted',effect=posted?pettyMoveEffect(x):0;
    const inflow=Math.max(0,effect),outflow=Math.max(0,-effect);running+=effect;
    rows.push({sort:x.movement_date+'T'+(x.created_at||''),Date:day(x.movement_date),Record:'Fund movement',Reference:x.reference_number||'',Category:'',Payee:'',Description:String(x.movement_type||'').replaceAll('_',' ')+(x.notes?' · '+x.notes:''),'Inflow (R)':inflow,'Outflow (R)':outflow,Status:x.status,'Running Balance (R)':running,Evidence:''});
  }
  for(const x of (S.pettyVouchers||[]).filter(x=>x.fund_id===fund.id&&x.expense_date>=from&&x.expense_date<=to)){
    const outflow=low(x.status)==='posted'?n(x.amount):0;running-=outflow;
    rows.push({sort:x.expense_date+'T'+(x.created_at||''),Date:day(x.expense_date),Record:'Voucher',Reference:x.voucher_number,Category:x.category,Payee:x.payee||'',Description:x.description,'Inflow (R)':0,'Outflow (R)':outflow,Status:x.status,'Running Balance (R)':running,Evidence:x.receipt_url||x.evidence_note||''});
  }
  return {opening,rows:rows.sort((a,b)=>a.sort.localeCompare(b.sort)).map(({sort,...r})=>r),from,to};
}
async function exportPettyCash(format){
  const fund=pettyFund();if(!fund)return alert('Choose a petty cash fund.');
  pettyReportMonth=$('pcReportMonth')?.value||pettyReportMonth;
  if(!pettyReportMonth)return alert('Choose the report month.');
  const api=window.FundaReportExports;if(!api)return alert('The formal report export service is still loading. Please try again.');
  const data=pettyReportRows(fund,pettyReportMonth),closing=pettyBalance(fund.id,data.to);
  const postedExpenses=(S.pettyVouchers||[]).filter(x=>x.fund_id===fund.id&&low(x.status)==='posted'&&x.expense_date>=data.from&&x.expense_date<=data.to).reduce((a,x)=>a+n(x.amount),0);
  const report={title:'Petty Cash Register — '+fund.fund_name,rows:data.rows,summary:[
    ['Month',pettyReportMonth],['Custodian',fund.custodian_profile_id?pettyProfileName(fund.custodian_profile_id):(fund.custodian_name||'Not assigned')],
    ['Authorised float',money(fund.authorized_float)],['Opening system balance',money(data.opening)],['Posted petty cash expenses',money(postedExpenses)],
    ['Closing system balance',money(closing)],['Pending vouchers',money(pettyPendingTotal(fund.id))]
  ]};
  try{
    const fileName=format==='xlsx'?await api.exportExcel(report,{from:data.from,to:data.to,scope:'period'}):await api.exportPdf(report,{from:data.from,to:data.to,scope:'period'});
    await api.logRun?.('petty_cash',data.from,data.to,'period',format,data.rows.length,fileName);
  }catch(e){alert(e.message||'The petty cash report could not be generated.')}
}
function reports(){
  return `<div class="acGrid"><div class="acPanel"><h3>Financial Exports</h3><p class="acMeta">Use the formal FOA Excel/PDF templates. CSV is no longer the primary management-report format.</p><div class="acBar"><button class="acBtn" id="cashExcel">Cashbook Excel</button><button class="acBtn" id="cashPdf">Cashbook PDF</button><button class="acBtn alt" id="acReports2">Open Report Centre</button></div></div><div class="acPanel"><h3>Export Month</h3><input class="acInput" type="month" id="reportMonth" value="${esc(new Date().toISOString().slice(0,7))}"><p class="acMeta">The export includes posted, planned and voided records for audit visibility, with posting and reconciliation status clearly shown.</p></div></div>`;
}
function render(t=tab){
  if(!active())return;
  tab=t;
  const mp=currentMonthPnl||{},future=futurePosted(),un=loaded.cash?actualCashRows().filter(x=>low(x.reconciliation_status)==='unreconciled').length:null;
  let body='';
  if(t==='overview')body=overview();
  if(t==='income')body=entryForm('income');
  if(t==='expenses')body=entryForm('expense');
  if(t==='cashbook')body=cashbookPanel('');
  if(t==='petty')body=pettyCashPanel();
  if(t==='planned')body=plannedPanel();
  if(t==='pnl')body=pnlControls();
  if(t==='reconciliation')body=reconciliation();
  if(t==='targets')body=targetsPanel();
  if(t==='reports')body=reports();
  $('view').innerHTML=`<div class="acRoot">
    <div class="acHero"><b>FINANCIAL OPERATIONS & CONTROL</b><h2>Expenses, Income & Management P&L</h2><p>Daily cashbook control, petty cash, planned items, monthly management P&L, reconciliation, financial-year targets and formal reporting from one governed finance workspace.</p></div>
    ${loadWarning()}
    <div class="acK">
      <div class="acCard"><strong>${currentMonthPnl?money(mp.turnover):'—'}</strong><span>Current month turnover to date</span></div>
      <div class="acCard"><strong>${currentMonthPnl?money(mp.total_income):'—'}</strong><span>Current month total income</span></div>
      <div class="acCard"><strong>${currentMonthPnl?money(mp.total_expenses):'—'}</strong><span>Current month expenses</span></div>
      <div class="acCard"><strong>${currentMonthPnl?money(mp.net_result):'—'}</strong><span>Current month net profit / (loss)</span></div>
      <div class="acCard"><strong>${un??'—'}</strong><span>Unreconciled actual entries</span></div>
    </div>
    ${future.length?'<div class="acWarn"><b>Review required:</b> '+future.length+' existing posted cashbook item(s) are dated in the future. They have not been altered, but live P&L calculations now exclude them until their date arrives.</div>':''}
    <div class="acTabs">${[
      ['overview','Overview'],['income','Income'],['expenses','Expenses'],['cashbook','Cashbook'],['petty','Petty Cash'],['planned','Planned / Recurring'],['pnl','P&L'],['reconciliation','Reconciliation'],['targets','Targets & FY'],['reports','Reports']
    ].map(x=>'<button class="acBtn '+(t===x[0]?'':'alt')+'" data-ac-tab="'+x[0]+'">'+x[1]+'</button>').join('')}<button class="acBtn alt" id="acRefresh">Refresh</button></div>
    <div class="acSection">${body}</div>
  </div>`;
  wire();
  if(t==='pnl')refreshPnl();
}
async function audit(action,id,details,status='recorded',entityType='cashbook'){
  try{
    const u=(await db.auth.getUser()).data.user;
    await db.from('admin_audit_log').insert({actor_id:u?.id||null,action,department:'Finance & Accounting',entity_type:entityType,entity_id:String(id||''),details:JSON.stringify(details||{}),source:'system',status});
  }catch(e){console.warn('Finance audit log',e)}
}
async function saveEntry(type){
  const amount=Number($('aeAmount').value),category=$('aeCat').value,description=$('aeDesc').value.trim(),date=$('aeDate').value||today(),basis=$('aeBasis').value;
  let posting=$('aePosting').value,recurrence=$('aeRecurrence').value;
  if(!category||!description||!(amount>0))return alert('Category, description and a valid amount are required.');
  if(type==='expense'&&low(category)==='depreciation & amortisation'&&basis!=='adjustment')return alert('Depreciation & Amortisation is non-cash. Record it as an Accounting adjustment.');
  if(basis==='adjustment'){posting='posted';recurrence='none'}
  if(posting==='posted'&&date>today())return alert('A future-dated transaction must be saved as Planned / scheduled. It cannot be posted as an actual transaction yet.');
  if(posting==='posted'&&recurrence==='monthly')return alert('Monthly recurrence belongs to Planned / scheduled items. Choose Planned / scheduled for recurring transactions.');

  const ref=$('aeRef').value.trim(),party=$('aeParty').value.trim();
  const dup=S.cash.find(x=>low(x.posting_status||'posted')!=='voided'&&x.entry_date===date&&low(x.entry_type)===type&&Number(x.amount||0).toFixed(2)===amount.toFixed(2)&&low(x.category)===low(category)&&((ref&&low(x.reference_number)===low(ref))||(!ref&&low(x.counterparty)===low(party)&&low(x.description)===low(description))));
  if(dup&&!confirm('A very similar accounting record already exists for '+day(dup.entry_date)+' at '+money(dup.amount)+'. Save another record anyway?'))return;

  const u=(await db.auth.getUser()).data.user;
  const payload={
    entry_type:type,category,description,amount,entry_date:date,counterparty:party||null,reference_number:ref||null,
    payment_method:basis==='adjustment'?'Non-cash Adjustment':$('aeMethod').value,department:$('aeDept').value.trim()||'Finance & Accounting',
    tax_treatment:$('aeTax').value.trim()||null,receipt_url:$('aeReceipt').value.trim()||null,
    created_by:u?.id||null,source_type:basis==='adjustment'?'adjustment':'manual',posting_status:posting,recurrence:posting==='planned'?recurrence:'none'
  };
  const q=await db.from('admin_cashbook').insert(payload).select().single();
  if(q.error)return alert(q.error.message);
  await audit('Accounting '+type+' '+(posting==='planned'?'planned':basis==='adjustment'?'adjustment recorded':'recorded'),q.data.id,{amount,category,date,posting,recurrence,basis});
  await open();render(type==='income'?'income':'expenses');
}
async function postPlanned(id){
  const row=S.cash.find(x=>x.id===id);if(!row)return;
  const postDate=prompt('Posting date for this actual transaction (YYYY-MM-DD):',today());
  if(postDate===null)return;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(postDate))return alert('Enter the posting date as YYYY-MM-DD.');
  const {error}=await db.rpc('finance_post_planned_cashbook_entry',{p_id:id,p_entry_date:postDate});
  if(error)return alert(error.message);
  await audit('Planned cashbook item posted',id,{post_date:postDate,amount:row.amount,category:row.category});
  await open();render(tab);
}
async function voidEntry(id){
  const row=S.cash.find(x=>x.id===id);if(!row)return;
  const reason=prompt('Reason for voiding this record (minimum 8 characters):');
  if(reason===null)return;
  if(reason.trim().length<8)return alert('Enter a clear reason of at least 8 characters.');
  if(!confirm('Void this finance record? It will remain visible for audit history and will be excluded from live P&L calculations.'))return;
  const {error}=await db.rpc('finance_void_cashbook_entry',{p_id:id,p_reason:reason.trim()});
  if(error)return alert(error.message);
  await audit('Cashbook entry voided',id,{reason:reason.trim(),amount:row.amount,category:row.category},'voided');
  await open();render(tab);
}
async function reconcile(id){
  const u=(await db.auth.getUser()).data.user;
  const r=await db.from('admin_cashbook').update({reconciliation_status:'reconciled',reconciled_by:u?.id||null,reconciled_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id);
  if(r.error)return alert(r.error.message);
  await audit('Cashbook entry reconciled',id,{});
  await open();render('reconciliation');
}
async function importPayments(){
  const verified=S.payments.filter(p=>['verified','paid','approved','completed'].includes(low(p.status)));
  const existing=new Set(S.cash.filter(x=>x.source_type==='student_payment').map(x=>String(x.source_id)));
  const todo=verified.filter(p=>!existing.has(String(p.id)));
  if(!todo.length)return alert('No new verified student payments need to be synced.');
  if(!confirm('Sync '+todo.length+' verified payment(s) into the cashbook ledger? The P&L reads verified payments directly, so these ledger copies will not be double-counted.'))return;
  const u=(await db.auth.getUser()).data.user;
  const rows=todo.map(p=>({
    entry_type:'income',category:'Tuition Fees',description:'Verified student payment',amount:Number(p.amount||0),
    entry_date:(p.verified_at||p.submitted_at||p.created_at||new Date().toISOString()).slice(0,10),
    counterparty:S.profiles.find(x=>x.id===p.student_id)?.full_name||S.profiles.find(x=>x.id===p.student_id)?.email||'Student',
    reference_number:p.payment_reference||String(p.id).slice(0,8),payment_method:p.payment_method||'Student Payment',
    department:'Finance & Accounting',receipt_url:p.proof_url||null,created_by:u?.id||null,source_type:'student_payment',source_id:String(p.id),
    posting_status:'posted',recurrence:'none'
  }));
  const r=await db.from('admin_cashbook').insert(rows);
  if(r.error)return alert(r.error.message);
  await audit('Verified student payments synced to cashbook','bulk',{count:rows.length});
  await open();render('overview');alert(rows.length+' verified payment(s) synced to the cashbook.');
}
async function refreshPnl(){
  const wrap=$('acPLWrap');if(!wrap)return;
  const [from,to]=selectedPnlRange();
  if(!from||!to){wrap.innerHTML='<div class="acWarn">Choose a complete P&L period.</div>';return}
  if(from>to){wrap.innerHTML='<div class="acWarn">Start date cannot be after end date.</div>';return}
  const [compFrom,compTo]=comparisonRange(from,to);
  wrap.innerHTML='<div class="acPanel"><div class="acMeta">Generating management P&L and comparison…</div></div>';
  try{
    const [cur,comp]=await Promise.all([fetchPnl(from,to),fetchPnl(compFrom,compTo)]);
    currentPnl=normalisePnl(cur);currentPnlComparison=normalisePnl(comp);currentPnlComparisonRange=[compFrom,compTo];
    wrap.innerHTML=pnlMarkup(currentPnl,currentPnlComparison,from,to,compFrom,compTo);
    wirePnl(from,to);
  }catch(e){wrap.innerHTML='<div class="acWarn"><b>P&L unavailable:</b> '+esc(e.message||e)+'. No zero-value statement has been substituted.</div>'}
}
function pnlExportRows(x,comp){
  x=normalisePnl(x);comp=normalisePnl(comp||{});
  const turnover=n(x.turnover);
  return pnlDataRows(x,comp).map(r=>({
    Section:r.section,
    Account:r.account,
    'Current Period (R)':n(r.current),
    'Comparison Period (R)':n(r.comparison),
    'Variance (R)':n(r.current)-n(r.comparison),
    '% of Turnover':pct(ratio(r.current,turnover))
  }));
}
async function exportPnl(format,from,to){
  const api=window.FundaReportExports;if(!api)return alert('The formal report export service is still loading. Please try again.');
  const x=normalisePnl(currentPnl||{}),comp=normalisePnl(currentPnlComparison||{}),compRange=currentPnlComparisonRange||comparisonRange(from,to);
  const grossMargin=ratio(x.gross_profit,x.turnover),operatingMargin=ratio(x.operating_profit,x.turnover),netMargin=ratio(x.net_result,x.turnover);
  const monthBudget=budgetForMonth(from),plan=(pnlMode==='monthly'&&monthBudget)?{revenue:n(monthBudget.revenue_target),expenses:budgetExpenseTotal(monthBudget),plannedSurplus:budgetPlannedSurplus(monthBudget),minimumSurplus:n(monthBudget.minimum_surplus_target),months:1}:(pnlMode==='financial_year'?budgetTotalsForPeriod(from,to):null);
  const report={title:'Management Profit & Loss Statement',rows:pnlExportRows(x,comp),summary:[
    ['Reporting period',day(from)+' - '+day(to)],
    ['Comparison period',day(compRange[0])+' - '+day(compRange[1])],
    ['Statement basis','Management basis · verified Student receipts + posted income/expenses + approved accounting adjustments'],
    ['Turnover',money(x.turnover)],
    ...(plan?.months?[[pnlMode==='monthly'?'Monthly revenue target':'Annual revenue target',money(plan.revenue)],['Revenue variance',money(n(x.turnover)-plan.revenue)],['Expense budget',money(plan.expenses)],['Expense headroom / (overrun)',money(plan.expenses-n(x.total_expenses))],['Planned surplus',money(plan.plannedSurplus)],['Minimum surplus target',money(plan.minimumSurplus||0)]]:[]),
    ['Gross profit',money(x.gross_profit)+' · '+pct(grossMargin)+' margin'],
    ['Operating profit / (loss)',money(x.operating_profit)+' · '+pct(operatingMargin)+' margin'],
    ['Profit / (loss) before tax',money(x.profit_before_tax)],
    ['Total expenses',money(x.total_expenses)],
    ['Net profit / (loss)',money(x.net_result)+' · '+pct(netMargin)+' margin'],
    ['Pending/unverified collections excluded',money(x.pending_collections)],
    ['Statement status',x.period_status||'live']
  ]};
  try{
    const fileName=format==='xlsx'?await api.exportExcel(report,{from,to,scope:'period'}):await api.exportPdf(report,{from,to,scope:'period'});
    await api.logRun?.('finance',from,to,'period',format,report.rows.length,fileName);
  }catch(e){alert(e.message||'The P&L export could not be generated.')}
}
async function closeMonth(from){
  const notes=prompt('Optional month-close note:','Reviewed management P&L');
  if(notes===null)return;
  if(!confirm('Close this month? The P&L snapshot will be retained so later changes cannot silently rewrite the closed report.'))return;
  const {error}=await db.rpc('finance_close_month',{p_month_start:from,p_notes:notes||null});
  if(error)return alert(error.message);
  await audit('Finance month closed',from,{notes});
  await open();render('pnl');
}
async function reopenMonth(from){
  const reason=prompt('Reason for reopening this closed month (minimum 8 characters):');
  if(reason===null)return;
  if(reason.trim().length<8)return alert('Enter a clear reason of at least 8 characters.');
  const {error}=await db.rpc('finance_reopen_month',{p_month_start:from,p_reason:reason.trim()});
  if(error)return alert(error.message);
  await audit('Finance month reopened',from,{reason:reason.trim()},'reopened');
  await open();render('pnl');
}
async function saveSettings(){
  const anchor=$('fyAnchor').value,target=Number($('fyTarget').value);
  if(!anchor||!/^\d{4}-10-01$/.test(anchor))return alert('The first management financial year must start on 1 October.');
  if(!(target>=0))return alert('Enter a valid annual turnover target.');
  const u=(await db.auth.getUser()).data.user;
  const {error}=await db.from('finance_management_settings').update({financial_year_anchor:anchor,fiscal_year_start_month:10,annual_turnover_target:target,updated_by:u?.id||null,updated_at:new Date().toISOString()}).eq('singleton',true);
  if(error)return alert(error.message);
  await audit('Finance management settings updated','settings',{financial_year_anchor:anchor,annual_turnover_target:target});
  await open();render('targets');
}
async function saveBudgetMonth(id){
  const row=(S.budgets||[]).find(x=>x.id===id);if(!row)return;
  const read=key=>Number($('bud-'+key+'-'+id)?.value||0);
  const payload={
    revenue_target:read('revenue'),direct_cost_budget:read('direct'),people_cost_budget:read('people'),
    operating_expense_budget:read('operating'),ambassador_budget:read('ambassador'),other_expense_budget:read('other'),
    minimum_surplus_target:read('minimum'),notes:$('bud-notes-'+id)?.value.trim()||null
  };
  if(Object.entries(payload).some(([k,v])=>k!=='notes'&&(!Number.isFinite(v)||v<0)))return alert('All budget amounts must be zero or greater.');
  const u=(await db.auth.getUser()).data.user;
  payload.updated_by=u?.id||null;payload.updated_at=new Date().toISOString();
  const {error}=await db.from('finance_monthly_budgets').update(payload).eq('id',id);
  if(error)return alert(error.message);
  await audit('Monthly finance budget updated',row.month_start,{...payload,updated_by:undefined,updated_at:undefined},'recorded','finance_budget');
  await open();render('targets');
}
async function distributeAnnualTarget(){
  const set=settings(),anchor=set.financial_year_anchor,target=n(set.annual_turnover_target);
  if(!confirm('Distribute '+money(target)+' evenly across the 12 months from '+day(anchor)+'? This changes monthly revenue targets only and keeps all expense budgets unchanged.'))return;
  const {error}=await db.rpc('finance_distribute_annual_target',{p_fy_start:anchor,p_annual_target:target});
  if(error)return alert(error.message);
  await audit('Annual finance target distributed to monthly budgets',anchor,{annual_target:target},'recorded','finance_budget');
  budgetPage=1;await open();render('targets');
}

function bindPettyFundCreate(){
  const b=$('pcCreateFund');if(!b)return;
  b.onclick=createPettyFund;
}
async function createPettyFund(){
  const name=$('pcNewName')?.value.trim(),custodian=$('pcNewCustodian')?.value||null,custodianName=$('pcNewCustodianName')?.value.trim()||null,float=Number($('pcNewFloat')?.value||0);
  if(!name)return alert('Enter the petty cash fund name.');
  if(!Number.isFinite(float)||float<0)return alert('Authorised float must be zero or greater.');
  const {data,error}=await db.rpc('finance_create_petty_cash_fund',{p_fund_name:name,p_custodian_profile_id:custodian||null,p_custodian_name:custodianName,p_authorized_float:float});
  if(error)return alert(error.message);
  pettyFundId=data;
  await audit('Petty cash fund created',data,{fund_name:name,authorized_float:float},'recorded','petty_cash_fund');
  await open();render('petty');
}
async function updatePettyFund(){
  const f=pettyFund();if(!f)return;
  const name=$('pcFundName').value.trim(),float=Number($('pcAuthFloat').value||0),status=$('pcFundStatus').value;
  if(!name)return alert('Enter the petty cash fund name.');
  if(!Number.isFinite(float)||float<0)return alert('Authorised float must be zero or greater.');
  const {error}=await db.rpc('finance_update_petty_cash_fund',{
    p_fund_id:f.id,p_fund_name:name,p_custodian_profile_id:$('pcCustodian').value||null,
    p_custodian_name:$('pcCustodianName').value.trim()||null,p_authorized_float:float,p_status:status
  });
  if(error)return alert(error.message);
  await audit('Petty cash fund updated',f.id,{fund_name:name,authorized_float:float,status},'recorded','petty_cash_fund');
  await open();render('petty');
}
async function recordPettyMovement(){
  const f=pettyFund();if(!f)return;
  const type=$('pcMoveType').value,amount=Number($('pcMoveAmount').value),date=$('pcMoveDate').value||today();
  if(!(amount>0))return alert('Enter a petty cash movement amount greater than zero.');
  const labels={opening_float:'opening float',replenishment:'replenishment',return_to_bank:'return to bank'};
  if(!confirm('Record '+labels[type]+' of '+money(amount)+' on '+day(date)+'? Funding movements do not enter the P&L.'))return;
  const {data,error}=await db.rpc('finance_record_petty_cash_movement',{
    p_fund_id:f.id,p_movement_type:type,p_amount:amount,p_movement_date:date,
    p_reference_number:$('pcMoveRef').value.trim()||null,p_notes:$('pcMoveNotes').value.trim()||null
  });
  if(error)return alert(error.message);
  await audit('Petty cash movement recorded',data,{fund_id:f.id,movement_type:type,amount,date},'recorded','petty_cash_movement');
  await open();render('petty');
}
async function createPettyVoucher(){
  const f=pettyFund();if(!f)return;
  const receipt=$('pcVoucherReceipt').value.trim(),evidence=$('pcVoucherEvidence').value.trim(),description=$('pcVoucherDesc').value.trim(),amount=Number($('pcVoucherAmount').value);
  if(receipt&&!safeHttp(receipt))return alert('Receipt/evidence link must start with http:// or https://.');
  if(!receipt&&!evidence)return alert('Add a receipt/evidence URL or explain why evidence is unavailable.');
  if(!description)return alert('Describe what was purchased and why.');
  if(!(amount>0))return alert('Enter a voucher amount greater than zero.');
  const {data,error}=await db.rpc('finance_create_petty_cash_voucher',{
    p_fund_id:f.id,p_expense_date:$('pcVoucherDate').value||today(),p_category:$('pcVoucherCategory').value,
    p_payee:$('pcVoucherPayee').value.trim()||null,p_department:$('pcVoucherDept').value.trim()||null,
    p_description:description,p_amount:amount,p_receipt_url:receipt||null,p_evidence_note:evidence||null
  });
  if(error)return alert(error.message);
  await audit('Petty cash voucher requested',data?.id||'',{fund_id:f.id,voucher_number:data?.voucher_number,amount,category:$('pcVoucherCategory').value},'pending','petty_cash_voucher');
  await open();render('petty');
}
async function approvePettyVoucher(id){
  const v=(S.pettyVouchers||[]).find(x=>x.id===id);if(!v)return;
  if(!confirm('Approve and post '+v.voucher_number+' for '+money(v.amount)+'? This will reduce petty cash and post the expense to the P&L under '+v.category+'.'))return;
  const note=prompt('Approval note (optional):','')??null;
  if(note===null)return;
  const {data,error}=await db.rpc('finance_approve_petty_cash_voucher',{p_voucher_id:id,p_review_note:note.trim()||null});
  if(error)return alert(error.message);
  await audit('Petty cash voucher approved and posted',id,{voucher_number:v.voucher_number,amount:v.amount,category:v.category,cashbook_entry_id:data},'recorded','petty_cash_voucher');
  await open();render('petty');
}
async function rejectPettyVoucher(id){
  const v=(S.pettyVouchers||[]).find(x=>x.id===id);if(!v)return;
  const reason=prompt('Reason for rejecting '+v.voucher_number+':','');
  if(reason===null)return;
  if(reason.trim().length<5)return alert('Enter a clear rejection reason.');
  const {error}=await db.rpc('finance_reject_petty_cash_voucher',{p_voucher_id:id,p_reason:reason.trim()});
  if(error)return alert(error.message);
  await audit('Petty cash voucher rejected',id,{voucher_number:v.voucher_number,reason:reason.trim()},'rejected','petty_cash_voucher');
  await open();render('petty');
}
async function voidPettyVoucher(id){
  const v=(S.pettyVouchers||[]).find(x=>x.id===id);if(!v)return;
  const reason=prompt('Reason for voiding '+v.voucher_number+' (minimum 8 characters):','');
  if(reason===null)return;
  if(reason.trim().length<8)return alert('Enter a clear void reason of at least 8 characters.');
  if(!confirm('Void this posted petty cash voucher? Its linked P&L/cashbook expense will also be voided and the petty cash balance restored.'))return;
  const {error}=await db.rpc('finance_void_petty_cash_voucher',{p_voucher_id:id,p_reason:reason.trim()});
  if(error)return alert(error.message);
  await audit('Petty cash voucher voided',id,{voucher_number:v.voucher_number,amount:v.amount,reason:reason.trim()},'voided','petty_cash_voucher');
  await open();render('petty');
}
async function voidPettyMovement(id){
  const m=(S.pettyMoves||[]).find(x=>x.id===id);if(!m)return;
  const reason=prompt('Reason for voiding this petty cash movement (minimum 8 characters):','');
  if(reason===null)return;
  if(reason.trim().length<8)return alert('Enter a clear void reason of at least 8 characters.');
  if(!confirm('Void this '+String(m.movement_type).replaceAll('_',' ')+' of '+money(m.amount)+'? The record will remain in the audit register.'))return;
  const {error}=await db.rpc('finance_void_petty_cash_movement',{p_movement_id:id,p_reason:reason.trim()});
  if(error)return alert(error.message);
  await audit('Petty cash movement voided',id,{movement_type:m.movement_type,amount:m.amount,reason:reason.trim()},'voided','petty_cash_movement');
  await open();render('petty');
}
async function reconcilePettyCash(){
  const f=pettyFund();if(!f)return;
  const counted=Number($('pcCountedCash').value),date=$('pcReconDate').value||today(),notes=$('pcReconNotes').value.trim();
  if(!Number.isFinite(counted)||counted<0)return alert('Enter the physical cash amount counted.');
  const expected=pettyBalance(f.id,date),variance=counted-expected;
  if(Math.abs(variance)>0.005&&!notes)return alert('Explain the reconciliation variance before recording the cash count.');
  if(!confirm('Record petty cash count of '+money(counted)+' against system balance '+money(expected)+'? Variance: '+money(variance)+'.'))return;
  const {data,error}=await db.rpc('finance_reconcile_petty_cash',{p_fund_id:f.id,p_reconciliation_date:date,p_counted_cash:counted,p_notes:notes||null});
  if(error)return alert(error.message);
  await audit('Petty cash reconciled',data?.id||'',{fund_id:f.id,reconciliation_date:date,system_balance:data?.system_balance,counted_cash:counted,variance:data?.variance},'recorded','petty_cash_reconciliation');
  await open();render('petty');
}
function cashbookReportRows(month){
  const [from,to]=monthRange(month);
  return S.cash.filter(x=>x.entry_date>=from&&x.entry_date<=to).map(x=>({
    Date:day(x.entry_date),Type:x.entry_type,Category:x.category,Counterparty:x.counterparty||'',Description:x.description,
    Reference:x.reference_number||'','Payment Method':x.payment_method||'',Department:x.department||'',Amount:n(x.amount),
    'Basis / Source':x.source_type==='adjustment'?'Non-cash adjustment':x.source_type==='petty_cash'?'Petty cash voucher':x.source_type==='student_payment'?'Verified student payment':'Cash / bank',
    'Posting Status':x.posting_status||'posted',Recurrence:x.recurrence||'none','Reconciliation Status':['adjustment','petty_cash'].includes(x.source_type)?'not applicable':(x.reconciliation_status||'unreconciled'),
    'Void Reason':x.void_reason||''
  }));
}
async function exportCashbook(format){
  if(!loaded.cash)return alert('Cashbook data is currently unavailable. Refresh before exporting.');
  const api=window.FundaReportExports;if(!api)return alert('The formal report export service is still loading. Please try again.');
  const month=$('reportMonth').value;if(!month)return alert('Choose an export month.');
  const [from,to]=monthRange(month),rows=cashbookReportRows(month),report={title:'Cashbook Register',rows,summary:[['Month',month],['Records',rows.length],['Posted',rows.filter(x=>x['Posting Status']==='posted').length],['Planned',rows.filter(x=>x['Posting Status']==='planned').length],['Voided',rows.filter(x=>x['Posting Status']==='voided').length]]};
  try{
    const fileName=format==='xlsx'?await api.exportExcel(report,{from,to,scope:'period'}):await api.exportPdf(report,{from,to,scope:'period'});
    await api.logRun?.('cashbook',from,to,'period',format,rows.length,fileName);
  }catch(e){alert(e.message||'The cashbook export could not be generated.')}
}
function wire(){
  document.querySelectorAll('[data-ac-tab]').forEach(b=>b.onclick=()=>{cashPage=1;plannedPage=1;reconPage=1;render(b.dataset.acTab)});
  $('acRefresh').onclick=async()=>{await open();render(tab)};
  document.querySelectorAll('[data-post]').forEach(b=>b.onclick=()=>postPlanned(b.dataset.post));
  document.querySelectorAll('[data-void]').forEach(b=>b.onclick=()=>voidEntry(b.dataset.void));
  if(['income','expenses'].includes(tab)){
    $('aeSave').onclick=()=>saveEntry(tab==='income'?'income':'expense');
    const syncEntryControls=()=>{
      const adj=$('aeBasis').value==='adjustment';
      if(adj){$('aePosting').value='posted';$('aePosting').disabled=true;$('aeRecurrence').value='none';$('aeRecurrence').disabled=true;$('aeMethod').value='Non-cash Adjustment';$('aeMethod').disabled=true}
      else{$('aePosting').disabled=false;$('aeMethod').disabled=false;if($('aeMethod').value==='Non-cash Adjustment')$('aeMethod').value='EFT';$('aeRecurrence').disabled=$('aePosting').value!=='planned';if($('aePosting').value!=='planned')$('aeRecurrence').value='none'}
    };
    $('aeBasis').onchange=syncEntryControls;
    $('aePosting').onchange=syncEntryControls;
    syncEntryControls();
  }
  if(['income','expenses','cashbook'].includes(tab)){
    $('acStatusFilter')?.addEventListener('change',()=>{cashPage=1;render(tab)});
    $('acPrev')?.addEventListener('click',()=>{cashPage=Math.max(1,cashPage-1);render(tab)});
    $('acNext')?.addEventListener('click',()=>{cashPage++;render(tab)});
  }
  if(tab==='overview'){
    $('acImportPayments').onclick=importPayments;
    $('acReports').onclick=()=>window.openFundaReportCentre?.('finance');
  }
  if(tab==='planned'){
    $('plPrev').onclick=()=>{plannedPage=Math.max(1,plannedPage-1);render('planned')};
    $('plNext').onclick=()=>{plannedPage++;render('planned')};
  }
  if(tab==='pnl'){
    $('pnlMode').onchange=()=>{pnlMode=$('pnlMode').value;render('pnl')};
    $('pnlApply').onclick=()=>{
      if($('pnlMonth'))pnlMonth=$('pnlMonth').value;
      if($('pnlDay'))pnlDay=$('pnlDay').value;
      if($('pnlFy'))pnlFyYear=Number($('pnlFy').value);
      if($('pnlFrom'))pnlFrom=$('pnlFrom').value;
      if($('pnlTo'))pnlTo=$('pnlTo').value;
      refreshPnl();
    };
  }
  if(tab==='reconciliation'){
    document.querySelectorAll('[data-reconcile]').forEach(b=>b.onclick=()=>reconcile(b.dataset.reconcile));
    $('rePrev').onclick=()=>{reconPage=Math.max(1,reconPage-1);render('reconciliation')};
    $('reNext').onclick=()=>{reconPage++;render('reconciliation')};
  }
  if(tab==='targets'){
    $('saveFinanceSettings').onclick=saveSettings;
    $('distributeAnnualTarget').onclick=distributeAnnualTarget;
    document.querySelectorAll('[data-budget-save]').forEach(b=>b.onclick=()=>saveBudgetMonth(b.dataset.budgetSave));
    $('budPrev').onclick=()=>{budgetPage=Math.max(1,budgetPage-1);render('targets')};
    $('budNext').onclick=()=>{budgetPage++;render('targets')};
  }
  if(tab==='reports'){
    $('cashExcel').onclick=()=>exportCashbook('xlsx');
    $('cashPdf').onclick=()=>exportCashbook('pdf');
    $('acReports2').onclick=()=>window.openFundaReportCentre?.('finance');
  }
}
function wirePnl(from,to){
  $('acExcelPL')?.addEventListener('click',()=>exportPnl('xlsx',from,to));
  $('acPdfPL')?.addEventListener('click',()=>exportPnl('pdf',from,to));
  $('acCloseMonth')?.addEventListener('click',()=>closeMonth(from));
  $('acReopenMonth')?.addEventListener('click',()=>reopenMonth(from));
}
async function open(){
  await loadData();
  await refreshSummaryPnls();
  render(tab);
}
function install(){
  css();
  const old=window.expenses;
  window.expenses=function(){open().catch(e=>{console.error('Accounting & Cashbook',e);if(old)old()})};
  document.addEventListener('funda:admin-manual-refresh',e=>{if(e.detail?.source==='manual'&&active())open().catch(console.error)});
  if(active())open().catch(console.error);
}
if(document.readyState==='complete')setTimeout(install,0);
else window.addEventListener('load',install,{once:true});
})();