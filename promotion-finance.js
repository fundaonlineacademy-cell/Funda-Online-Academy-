(()=>{
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const money=value=>'R'+Number(value||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
 const date=value=>value?new Date(value).toLocaleDateString('en-ZA',{timeZone:'Africa/Johannesburg'}):'—';
 let db,report,busy=false;
 function error(message){$('promotionReportError').textContent=message;$('promotionReportError').hidden=false;}
 function render(){
  const campaigns=(report.campaigns||[]).map(c=>`<p><strong>${esc(c.name)}</strong> · ${esc(c.discount_percent)}% off · ${esc(c.status)} · ends ${esc(date(new Date(new Date(c.ends_at).getTime()-1)))}</p>`).join('');
  const promoters=(report.promoters||[]).map(p=>{
   const balance=Number(p.commission)-Number(p.paid);
   return `<section class="panel"><h2>${esc(p.name)}</h2><p>${esc(p.email)} · Code: <code>${esc((p.codes||[]).join(', '))}</code> · Commission: <strong>${Number(p.rate)*100}%</strong></p><div class="metrics"><div><b>${Number(p.students)||0}</b><span>Referred students with submitted applications</span></div><div><b>${money(p.verified_revenue)}</b><span>Verified discounted revenue</span></div><div><b>${money(p.commission)}</b><span>Current confirmed commission</span></div><div><b>${money(balance)}</b><span>${balance<0?'Refund / payout adjustment':'Unpaid confirmed commission'}</span></div></div><p>Recorded EFT payouts: <strong>${money(p.paid)}</strong>. Review the applicable refund terms and banking details before paying.</p>${report.can_record_payout?`<details><summary>Record a completed monthly EFT payout</summary><form data-promoter="${esc(p.id)}"><div class="form"><label>Amount paid<input name="amount" type="number" min="0.01" max="${Math.max(0,balance).toFixed(2)}" step="0.01" required></label><label>Unique EFT reference<input name="reference" minlength="5" maxlength="100" required></label><label>Payment date<input name="payment_date" type="date" required></label></div><label class="check"><input name="confirmation" type="checkbox" required><span>I have reviewed refund eligibility and promoter banking details, and completed this EFT.</span></label><button type="submit" ${balance<=0?'disabled':''}>Record completed payout</button></form></details>`:''}</section>`;
  }).join('');
  const rows=(report.payments||[]).map(v=>`<tr><td>${esc(date(v.verified_at))}</td><td><code>${esc(v.code)}</code></td><td>${esc(v.course_title)}</td><td>${money(v.qualifying_revenue)}</td><td>${Number(v.rate)*100}%</td><td>${money(v.commission_amount)}</td></tr>`).join('');
  const payouts=(report.payouts||[]).map(x=>`<tr><td>${esc(date(x.payment_date))}</td><td>${esc((report.promoters||[]).find(p=>p.id===x.promoter_id)?.name||'Promoter')}</td><td>${esc(x.payment_reference)}</td><td>${money(x.amount)}</td></tr>`).join('');
  $('promotionReportContent').innerHTML=`<section class="panel"><h2>Campaign</h2>${campaigns||'<p>No campaign records.</p>'}<p>General code: <strong>BLACKNOV30</strong>. Promoter codes provide the same student discount and record campaign commission separately from the standard Ambassador programme.</p></section>${promoters||'<section class="panel"><p>No campaign promoters are registered.</p></section>'}<section class="panel"><h2>Verified commission payments</h2><p class="muted">Latest 500 eligible payment allocations. Summary totals include all eligible payments.</p><div class="tablewrap"><table><thead><tr><th>Verified</th><th>Code</th><th>Course</th><th>Discounted receipt</th><th>Rate</th><th>Commission</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No verified commission payments yet.</td></tr>'}</tbody></table></div></section><section class="panel"><h2>Completed payout register</h2><div class="tablewrap"><table><thead><tr><th>Date</th><th>Promoter</th><th>EFT reference</th><th>Amount</th></tr></thead><tbody>${payouts||'<tr><td colspan="4">No payouts have been recorded.</td></tr>'}</tbody></table></div></section>`;
  $('promotionReportContent').hidden=false;
  document.querySelectorAll('form[data-promoter]').forEach(form=>form.addEventListener('submit',async event=>{
   event.preventDefault();if(busy||!form.reportValidity())return;
   const values=new FormData(form),button=form.querySelector('button');button.disabled=true;busy=true;$('promotionReportError').hidden=true;
   let saved=false;
   try{
    const {error:failure}=await db.rpc('record_course_promotion_payout',{p_promoter_id:form.dataset.promoter,p_amount:Number(values.get('amount')),p_reference:String(values.get('reference')).trim(),p_payment_date:String(values.get('payment_date'))});
    if(failure)throw failure;saved=true;
   }catch(failure){error(failure.message||'Payout could not be recorded.');}
   finally{busy=false;button.disabled=false;}
   if(saved){await load();$('promotionReportStatus').textContent='Completed EFT payout recorded.';}
  }));
 }
 async function load(){
  if(busy)return;busy=true;$('refreshPromotion').disabled=true;$('exportPromotion').disabled=true;
  $('promotionReportError').hidden=true;$('promotionReportStatus').textContent='Loading verified campaign records…';
  try{
   db=db||window.__fundaSharedSupabaseClient||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
   if(!db)throw Error('Academy services could not be loaded. Refresh this page.');
   const session=await db.auth.getUser();if(!session.data?.user)throw Error('Sign in through Staff / Admin Login, then open this report again.');
   const {data,error:failure}=await db.rpc('get_course_promotion_report');if(failure)throw failure;
   if(!data?.promoters||!data?.campaigns)throw Error('The campaign report could not be confirmed.');
   report=data;render();$('promotionReportStatus').textContent='Records refreshed. Only approved enrolments with verified payments contribute to confirmed commission.';$('exportPromotion').disabled=false;
  }catch(failure){$('promotionReportContent').hidden=true;error(failure.message||'Campaign records could not be loaded.');$('promotionReportStatus').textContent='Records are unavailable.';}
  finally{busy=false;$('refreshPromotion').disabled=false;}
 }
 $('refreshPromotion').addEventListener('click',load);
 $('exportPromotion').addEventListener('click',()=>{
  if(!report)return;
  const rows=[['Verified date','Promo code','Course','Discounted revenue','Commission rate','Commission'],...(report.payments||[]).map(p=>[date(p.verified_at),p.code,p.course_title,p.qualifying_revenue,p.rate,p.commission_amount])];
  const csv=rows.map(row=>row.map(value=>{let text=String(value??'');if(/^[=+@-]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}).join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Funda_Promotion_Payment_Statement.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 load();
})();
