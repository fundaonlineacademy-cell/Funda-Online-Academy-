(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAmbFinance)return;
window.__fundaAmbFinance=true;

let db,apps=[],earn=[],banks=[],payouts=[];
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=n=>'R'+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:0,maximumFractionDigits:2});
const fmt=v=>v?new Date(v).toLocaleDateString('en-ZA'):'—';
const monthValue=()=>new Date().toISOString().slice(0,7);

const css=`
.afm{margin-top:18px;color:#172b3d}.afmHero,.afmPanel{background:#fff;border:1px solid #dce3e8;border-radius:16px}.afmHero{padding:22px;background:linear-gradient(135deg,#eef5f8,#fff4dc)}.afmHero h2{margin:5px 0;color:#17324a;font-size:24px}.afmHero p,.afmMeta{font-size:14px;line-height:1.6;color:#526476}.afmKicker{font-size:11px;font-weight:900;letter-spacing:.14em;color:#8b6518}.afmStats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.afmStat{padding:15px;background:#fff;border:1px solid #dce3e8;border-radius:12px}.afmStat b{display:block;font-size:23px;color:#17324a}.afmStat small{display:block;margin-top:5px;font-size:11px;font-weight:900;color:#657585;line-height:1.35}.afmPanel{padding:18px;margin-top:12px}.afmPanel h3{font-size:18px;color:#17324a;margin:0 0 6px}.afmPanelLead{font-size:13px;color:#637384;line-height:1.55;margin:0 0 13px}.afmBtn{border:0;border-radius:8px;padding:9px 12px;font-size:12px;font-weight:900;cursor:pointer;background:#173f62;color:#fff}.afmBtn.good{background:#267255}.afmBtn.bad{background:#983d3d}.afmBtn.gold{background:#c99a2e;color:#17324a}.afmBtn:disabled{opacity:.55;cursor:not-allowed}.afmTable{width:100%;border-collapse:collapse;font-size:13px;min-width:980px}.afmTable th,.afmTable td{padding:11px;border-bottom:1px solid #edf0f2;text-align:left;vertical-align:top}.afmTable th{background:#17324a;color:#fff;font-size:11px;letter-spacing:.03em}.afmWrap{overflow:auto;border:1px solid #e1e7eb;border-radius:10px}.afmBadge{display:inline-block;padding:5px 8px;border-radius:99px;background:#fff2d2;color:#7a5207;font-weight:900;font-size:10px}.afmBadge.verified,.afmBadge.paid,.afmBadge.approved,.afmBadge.eligible{background:#e5f6ef;color:#176b50}.afmBadge.failed,.afmBadge.reversed,.afmBadge.needs_update,.afmBadge.blocked{background:#ffe7e7;color:#922727}.afmForm{display:flex;gap:7px;flex-wrap:wrap}.afmForm input,.afmForm select,.afmForm textarea{border:1px solid #cfd9e0;border-radius:8px;padding:9px;font-size:12px;background:#fff}.afmForm textarea{min-width:240px;min-height:38px;resize:vertical}.afmInline{width:135px}.afmEmpty{padding:22px;text-align:center;color:#657585;font-size:13px}.afmCheck{max-width:240px;font-size:12px;line-height:1.45;color:#526476}.afmNote{max-width:280px;color:#667583;font-size:12px;line-height:1.45}.afmWarn{margin:10px 0;padding:12px 14px;border-radius:10px;background:#fff5dc;color:#6f5318;font-size:13px;line-height:1.55}.afmGood{margin:10px 0;padding:12px 14px;border-radius:10px;background:#eaf6ef;color:#176b50;font-size:13px;line-height:1.55}
@media(max-width:900px){.afmStats{grid-template-columns:repeat(2,1fr)}.afmHero h2{font-size:21px}}
@media(max-width:560px){.afmStats{grid-template-columns:1fr 1fr}.afmHero,.afmPanel{padding:15px}.afmHero p,.afmMeta{font-size:13px}.afmForm>*{flex:1 1 100%}}
`;

function style(){if($('#afmStyle'))return;const s=document.createElement('style');s.id='afmStyle';s.textContent=css;document.head.appendChild(s)}
function currentNav(){return [...document.querySelectorAll('#nav button,.nav button')].find(b=>b.classList.contains('on')||b.classList.contains('active'))}
function activeFinance(){const n=currentNav();return !!(n&&/finance/i.test(n.textContent||''))}
function activeMarketing(){const n=currentNav();return !!(n&&/marketing/i.test(n.textContent||''))}
function badge(value){const s=String(value||'pending');return '<span class="afmBadge '+esc(s)+'">'+esc(s.replaceAll('_',' ').toUpperCase())+'</span>'}
function appName(id){return apps.find(x=>x.id===id)?.full_name||'Unknown Ambassador'}
function activeApps(){return apps.filter(x=>x.status==='approved'&&['introductory','active'].includes(x.account_status))}

async function load(){
 db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
 if(!db)return false;
 const rs=await Promise.all([
  db.from('ambassador_programme_applications').select('id,full_name,email,status,account_status,referral_code,created_at').order('created_at',{ascending:false}),
  db.rpc('get_admin_ambassador_earnings'),
  db.from('ambassador_payout_details').select('id,application_id,account_holder,bank_name,account_number,account_type,branch_code,verification_status,verified_at,updated_at').order('updated_at',{ascending:false}),
  db.from('ambassador_payouts').select('id,application_id,amount,payment_reference,payment_date,status,notes,created_at').order('created_at',{ascending:false})
 ]);
 if(rs.some(x=>x.error)){console.error('Ambassador finance records failed to load',rs.map(x=>x.error).filter(Boolean));return false}
 apps=rs[0].data||[];earn=rs[1].data||[];banks=rs[2].data||[];payouts=rs[3].data||[];
 return true;
}

function totals(){
 return{
  approved:earn.filter(x=>['approved','paid'].includes(x.earning_status)&&x.verified_eligible!==false).reduce((s,x)=>s+Number(x.commission_amount||0),0),
  review:earn.filter(x=>['pending','held'].includes(x.earning_status)).length,
  paid:payouts.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.amount||0),0),
  banks:banks.filter(x=>x.verification_status==='pending').length
 };
}

function bankRows(){
 if(!banks.length)return '<tr><td colspan="7" class="afmEmpty">No Ambassador banking details submitted yet.</td></tr>';
 return banks.map(x=>'<tr><td>'+esc(appName(x.application_id))+'</td><td>'+esc(x.bank_name)+'</td><td>'+esc(x.account_holder)+'</td><td>•••• '+esc(String(x.account_number||'').slice(-4))+'</td><td>'+esc(x.branch_code||'—')+'</td><td>'+badge(x.verification_status)+'</td><td><div class="afmForm"><button class="afmBtn good" data-bank="'+x.id+'" data-bank-status="verified">Verify</button><button class="afmBtn bad" data-bank="'+x.id+'" data-bank-status="needs_update">Needs Update</button></div></td></tr>').join('');
}

function earningRows(){
 if(!earn.length)return '<tr><td colspan="9" class="afmEmpty">No Ambassador earnings recorded yet.</td></tr>';
 return earn.map(x=>{
  const eligible=x.verified_eligible!==false;
  const state=eligible?badge('eligible'):badge('blocked');
  const lock=x.earning_type==='commission'&&!eligible?' disabled':'';
  return '<tr><td>'+esc(appName(x.application_id))+'</td><td>'+esc(String(x.earning_type||'').replaceAll('_',' '))+'</td><td>'+money(x.qualifying_revenue)+'</td><td>'+money(x.commission_amount)+'</td><td>'+fmt(x.earning_month)+'</td><td>'+badge(x.earning_status)+'</td><td><div class="afmCheck">'+state+'<br>'+esc(x.verification_state||'Verification required')+'</div></td><td><div class="afmNote">'+esc(x.notes||'—')+'</div></td><td><div class="afmForm"><select data-earn-select="'+x.id+'"><option '+(x.earning_status==='pending'?'selected':'')+'>pending</option><option '+(x.earning_status==='approved'?'selected':'')+lock+'>approved</option><option '+(x.earning_status==='held'?'selected':'')+'>held</option><option '+(x.earning_status==='paid'?'selected':'')+lock+'>paid</option><option '+(x.earning_status==='reversed'?'selected':'')+'>reversed</option></select><button class="afmBtn" data-earn-save="'+x.id+'">Save</button></div></td></tr>';
 }).join('');
}

function payoutRows(){
 if(!payouts.length)return '<tr><td colspan="7" class="afmEmpty">No Ambassador payouts recorded yet.</td></tr>';
 return payouts.map(x=>'<tr><td>'+esc(appName(x.application_id))+'</td><td>'+money(x.amount)+'</td><td><input class="afmInline" data-pay-date="'+x.id+'" type="date" value="'+esc(x.payment_date||'')+'"></td><td><input class="afmInline" data-pay-ref="'+x.id+'" value="'+esc(x.payment_reference||'')+'" placeholder="Payment reference"></td><td>'+badge(x.status)+'</td><td><select data-pay-select="'+x.id+'"><option '+(x.status==='scheduled'?'selected':'')+'>scheduled</option><option '+(x.status==='processing'?'selected':'')+'>processing</option><option '+(x.status==='paid'?'selected':'')+'>paid</option><option '+(x.status==='failed'?'selected':'')+'>failed</option><option '+(x.status==='cancelled'?'selected':'')+'>cancelled</option></select></td><td><button class="afmBtn" data-pay-save="'+x.id+'">Save</button></td></tr>').join('');
}

function appOptions(){return activeApps().map(x=>'<option value="'+x.id+'">'+esc(x.full_name)+'</option>').join('')}

function block(){
 const t=totals(),opts=appOptions();
 return '<section id="ambFinanceAdmin" class="afm">'+
 '<div class="afmHero"><div class="afmKicker">AMBASSADOR FINANCE CONTROL</div><h2>Ambassador Earnings, Banking & Payouts</h2><p>Commission becomes visible to an Ambassador only after Finance verifies the payment and Administration approves the student enrolment. Monthly performance payments require a separate administrator verification. Payouts are blocked unless banking and available confirmed earnings pass the database controls.</p></div>'+
 '<div class="afmStats"><div class="afmStat"><b>'+money(t.approved)+'</b><small>CONFIRMED EARNINGS</small></div><div class="afmStat"><b>'+t.review+'</b><small>RECORDS REQUIRING REVIEW</small></div><div class="afmStat"><b>'+money(t.paid)+'</b><small>PAYOUTS PAID</small></div><div class="afmStat"><b>'+t.banks+'</b><small>BANK ACCOUNTS TO VERIFY</small></div></div>'+
 '<div class="afmPanel"><h3>Banking Verification</h3><p class="afmPanelLead">Confirm that the account holder and bank details are correct before marking the account verified.</p><div class="afmWrap"><table class="afmTable"><thead><tr><th>Ambassador</th><th>Bank</th><th>Account Holder</th><th>Account</th><th>Branch</th><th>Status</th><th>Action</th></tr></thead><tbody>'+bankRows()+'</tbody></table></div></div>'+
 '<div class="afmPanel"><h3>Earnings Verification</h3><div class="afmWarn"><b>Controlled confirmation:</b> A blocked commission cannot be changed to approved or paid. Correct the linked payment or student enrolment first; the ledger then updates automatically.</div><div class="afmWrap"><table class="afmTable"><thead><tr><th>Ambassador</th><th>Type</th><th>Qualifying Revenue</th><th>Amount</th><th>Month</th><th>Status</th><th>Verification</th><th>Audit Note</th><th>Action</th></tr></thead><tbody>'+earningRows()+'</tbody></table></div></div>'+
 '<div class="afmPanel"><h3>Monthly Performance Verification</h3><p class="afmPanelLead">Gold / Level 4 and above may receive a monthly performance payment only after an administrator verifies the selected month. The backend checks confirmed direct qualifying revenue and enforces the Ambassador\'s current rank cap.</p><div class="afmForm"><select id="afmPerfApp"><option value="">Choose active Ambassador</option>'+opts+'</select><input id="afmPerfMonth" type="month" value="'+monthValue()+'"><input id="afmPerfAmount" type="number" min="0.01" step="0.01" placeholder="Approved amount"><textarea id="afmPerfNotes" placeholder="Verification note / monthly conditions confirmed"></textarea><button class="afmBtn gold" id="afmAddPerformance">Approve Monthly Performance</button></div><div id="afmPerfMsg"></div></div>'+
 '<div class="afmPanel"><h3>Payout Queue & History</h3><p class="afmPanelLead">The database now requires an approved active Ambassador, verified banking details and enough unpaid confirmed earnings before a payout can be scheduled, processed or marked paid.</p><div class="afmForm" style="margin:10px 0 14px"><select id="afmPayApp"><option value="">Choose active Ambassador</option>'+opts+'</select><input id="afmPayAmount" type="number" min="0.01" step="0.01" placeholder="Amount"><input id="afmPayRef" placeholder="Payment reference"><input id="afmPayDate" type="date"><select id="afmPayStatus"><option>scheduled</option><option>processing</option><option>paid</option></select><button class="afmBtn gold" id="afmAddPay">Record Payout</button></div><div class="afmWrap"><table class="afmTable"><thead><tr><th>Ambassador</th><th>Amount</th><th>Payment Date</th><th>Reference</th><th>Current Status</th><th>New Status</th><th>Action</th></tr></thead><tbody>'+payoutRows()+'</tbody></table></div></div></section>';
}

async function mountFinance(){if(!activeFinance()||$('#ambFinanceAdmin'))return;if(!await load())return;style();const view=$('#view');if(!view)return;view.insertAdjacentHTML('beforeend',block());wire()}

function wire(){
 const root=$('#ambFinanceAdmin');if(!root)return;
 root.onclick=async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.bank){
   const status=b.dataset.bankStatus;
   const q=await db.from('ambassador_payout_details').update({verification_status:status,verified_at:status==='verified'?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq('id',b.dataset.bank);
   if(q.error)return alert(q.error.message);return refresh();
  }
  if(b.dataset.earnSave){
   const sel=root.querySelector('[data-earn-select="'+b.dataset.earnSave+'"]');
   b.disabled=true;b.textContent='Saving…';
   const q=await db.rpc('admin_set_ambassador_earning_status',{p_earning_id:b.dataset.earnSave,p_status:sel.value});
   if(q.error){b.disabled=false;b.textContent='Save';return alert(q.error.message)}
   return refresh();
  }
  if(b.id==='afmAddPerformance'){
   const aid=$('#afmPerfApp').value,month=$('#afmPerfMonth').value,amount=Number($('#afmPerfAmount').value),notes=$('#afmPerfNotes').value.trim(),msg=$('#afmPerfMsg');
   if(!aid||!month||!(amount>0))return alert('Choose an active Ambassador, month and approved performance amount.');
   b.disabled=true;b.textContent='Verifying…';
   const q=await db.rpc('admin_award_ambassador_monthly_performance',{p_application_id:aid,p_month:month+'-01',p_amount:amount,p_notes:notes||null});
   if(q.error){b.disabled=false;b.textContent='Approve Monthly Performance';if(msg)msg.innerHTML='<div class="afmWarn">'+esc(q.error.message)+'</div>';return}
   const r=q.data||{};if(msg)msg.innerHTML='<div class="afmGood"><b>Monthly performance approved.</b> '+esc(String(r.rank||''))+' · Cap '+money(r.monthly_payment_cap)+' · Approved '+money(r.monthly_payment)+'.</div>';
   setTimeout(refresh,900);return;
  }
  if(b.dataset.paySave){
   const id=b.dataset.paySave,sel=root.querySelector('[data-pay-select="'+id+'"]'),ref=root.querySelector('[data-pay-ref="'+id+'"]')?.value.trim()||'',date=root.querySelector('[data-pay-date="'+id+'"]')?.value||'';
   if(sel.value==='paid'&&(!ref||!date))return alert('Payment reference and payment date are required before marking a payout as paid.');
   const patch={status:sel.value,payment_reference:ref||null,payment_date:date||null};
   const q=await db.from('ambassador_payouts').update(patch).eq('id',id);
   if(q.error)return alert(q.error.message);return refresh();
  }
  if(b.id==='afmAddPay'){
   const aid=$('#afmPayApp').value,amt=Number($('#afmPayAmount').value),ref=$('#afmPayRef').value.trim(),date=$('#afmPayDate').value,status=$('#afmPayStatus').value;
   if(!aid||!(amt>0))return alert('Ambassador and payout amount are required.');
   if(status==='paid'&&(!ref||!date))return alert('Payment reference and payment date are required for a paid payout.');
   const q=await db.from('ambassador_payouts').insert({application_id:aid,amount:amt,payment_reference:ref||null,payment_date:date||null,status});
   if(q.error)return alert(q.error.message);return refresh();
  }
 };
}

async function refresh(){$('#ambFinanceAdmin')?.remove();await mountFinance()}
async function marketingSummary(){
 if(!activeMarketing()||$('#ambFinanceSummary'))return;if(!await load())return;style();
 const host=$('#ambV2Admin')||$('#view .mktStudio');if(!host)return;
 const t=totals(),s=document.createElement('section');s.id='ambFinanceSummary';s.className='afmPanel';
 s.innerHTML='<h3>Ambassador Programme Financial Snapshot</h3><div class="afmStats"><div class="afmStat"><b>'+money(t.approved)+'</b><small>CONFIRMED EARNINGS</small></div><div class="afmStat"><b>'+t.review+'</b><small>RECORDS REQUIRING REVIEW</small></div><div class="afmStat"><b>'+money(t.paid)+'</b><small>PAYOUTS PAID</small></div><div class="afmStat"><b>'+t.banks+'</b><small>BANK ACCOUNTS TO VERIFY</small></div></div><p class="afmMeta">Full banking verification, controlled earning confirmation, monthly performance verification and payout processing are available under Finance & Accounting.</p>';
 host.appendChild(s);
}

setInterval(()=>{if(activeFinance())mountFinance();else $('#ambFinanceAdmin')?.remove();if(activeMarketing())marketingSummary();else $('#ambFinanceSummary')?.remove()},900);
document.addEventListener('click',()=>setTimeout(()=>{mountFinance();marketingSummary()},180),true);
})();