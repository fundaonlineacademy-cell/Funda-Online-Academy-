(()=>{
  'use strict';
  if(window.__fundaAdminPaymentReview)return;
  window.__fundaAdminPaymentReview=true;
  if(!/admin-v2\.html$/i.test(location.pathname))return;

  const BUCKET='payment-proofs';
  const state={client:null,user:null,payments:[],students:[],accounts:[],filter:'awaiting',search:'',loading:false,notice:'',noticeKind:'success'};
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const number=value=>Number.isFinite(Number(value))?Number(value):0;
  const money=value=>'R'+number(value).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
  const status=value=>String(value||'').trim().toLowerCase();
  const formatDate=value=>{
    if(!value)return '—';
    try{return new Intl.DateTimeFormat('en-ZA',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
    catch{return '—';}
  };

  const CSS=`
.aprShell{margin-top:14px;padding:18px;border:1px solid #dbe2ec;border-radius:14px;background:#fff;box-shadow:0 6px 18px rgba(13,39,78,.07);color:#142846}.aprHead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.aprKicker{margin:0;color:#9b6b0b;font-size:11px;letter-spacing:.14em;font-weight:900;text-transform:uppercase}.aprHead h2{margin:4px 0 0;color:#12274d!important;font-size:20px!important}.aprIntro{max-width:760px;margin:6px 0 0;color:#475569;font-size:13px;line-height:1.6}.aprRefresh{border:1px solid #c8a448;border-radius:8px;background:#fffaf0;color:#17324a;padding:9px 11px;font-size:12px;font-weight:900;cursor:pointer}.aprRefresh:disabled{opacity:.6;cursor:wait}.aprNotice{margin-top:11px;padding:10px 12px;border-radius:8px;background:#eaf7ef;color:#176043;font-size:12px;font-weight:800}.aprNotice.warn{background:#fff2da;color:#86580a}.aprNotice.error{background:#fff0f0;color:#922f2f}
.aprStats{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:13px}.aprStat{padding:12px;border:1px solid #e0e6ee;border-radius:9px;background:#fbfdff}.aprStat span{display:block;color:#526174;font-size:10px;font-weight:800;text-transform:uppercase}.aprStat strong{display:block;margin-top:5px;color:#10213f;font-size:19px}.aprStat.attention strong{color:#9b650b}.aprStat.good strong{color:#16805f}
.aprTools{display:grid;grid-template-columns:210px minmax(220px,1fr);gap:9px;margin-top:13px}.aprControl{width:100%;box-sizing:border-box;border:1px solid #d5dde7;border-radius:8px;background:#fff;padding:10px 11px;color:#152b49;font-size:13px;font-weight:700}.aprList{display:grid;gap:9px;margin-top:12px}.aprItem{padding:13px;border:1px solid #e2e7ee;border-radius:10px;background:#fff}.aprTop{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}.aprStudent{margin:0;color:#12274d;font-size:14px;font-weight:900}.aprCourse{margin-top:4px;color:#475569;font-size:12px;font-weight:700;line-height:1.5}.aprBadge{align-self:start;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.aprBadge.pending,.aprBadge.submitted{background:#fff0cf;color:#86580a}.aprBadge.verified{background:#e2f5e9;color:#146044}.aprBadge.rejected{background:#fde4e4;color:#922f2f}.aprData{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px;margin-top:10px}.aprDatum{padding:9px;border-radius:7px;background:#f6f8fb}.aprDatum span{display:block;color:#5e6d81;font-size:10px;text-transform:uppercase;font-weight:800}.aprDatum b{display:block;margin-top:4px;color:#17304e;font-size:12px;overflow-wrap:anywhere}.aprReason{margin-top:9px;padding:9px;border-radius:7px;background:#fff0f0;color:#8e3030;font-size:12px;line-height:1.5;font-weight:750}.aprActions{display:flex;flex-wrap:wrap;gap:7px;margin-top:10px}.aprBtn{border:0;border-radius:7px;padding:8px 10px;font-size:11px;font-weight:900;cursor:pointer}.aprView{background:#203b5b;color:#fff}.aprApprove{background:#197151;color:#fff}.aprDecline{background:#a53b3b;color:#fff}.aprEmpty,.aprLoading{padding:24px;border:1px dashed #ced8e4;border-radius:9px;text-align:center;color:#526174;font-size:13px;line-height:1.55}.aprSpinner{width:28px;height:28px;margin:0 auto 9px;border:3px solid #dce5ef;border-top-color:#1b477e;border-radius:50%;animation:aprSpin .8s linear infinite}@keyframes aprSpin{to{transform:rotate(360deg)}}
.aprModal{position:fixed;inset:0;z-index:24000;display:grid;place-items:center;padding:14px;background:rgba(3,15,34,.79)}.aprModalCard{width:min(520px,96vw);max-height:92vh;overflow:auto;border-radius:15px;background:#fff;box-shadow:0 25px 65px rgba(0,0,0,.33)}.aprModalHead{display:flex;justify-content:space-between;gap:12px;padding:16px;border-bottom:1px solid #e1e6ed}.aprModalHead h2{margin:3px 0 0;color:#12274d!important;font-size:18px!important}.aprClose{width:36px;height:36px;border:1px solid #d9e0e8;border-radius:8px;background:#f7f9fb;color:#17304e;font-size:20px}.aprModalBody{padding:16px}.aprSummary{padding:11px;border-radius:9px;background:#f5f8fb;color:#354a62;font-size:12px;line-height:1.65}.aprSummary strong{color:#132c4b}.aprLabel{display:block;margin:13px 0 6px;color:#263c55;font-size:12px;font-weight:900}.aprTextarea{width:100%;min-height:110px;box-sizing:border-box;border:1px solid #d3dce5;border-radius:9px;padding:10px;font:500 14px Inter,sans-serif;resize:vertical}.aprModalError{margin-top:10px;padding:9px;border-radius:7px;background:#fff0f0;color:#902f2f;font-size:12px;font-weight:800}.aprModalError[hidden]{display:none}.aprConfirm{width:100%;margin-top:12px;border:0;border-radius:9px;padding:11px;color:#fff;font-size:12px;font-weight:900}.aprConfirm.approve{background:#197151}.aprConfirm.decline{background:#a53b3b}.aprConfirm:disabled{opacity:.62}
@media(max-width:900px){.aprStats{grid-template-columns:1fr 1fr}.aprData{grid-template-columns:1fr 1fr}.aprDatum:last-child{grid-column:1/-1}}
@media(max-width:620px){.aprHead{display:block}.aprRefresh{margin-top:9px}.aprTools{grid-template-columns:1fr}.aprStats{grid-template-columns:1fr 1fr}.aprData{grid-template-columns:1fr 1fr}.aprTop{grid-template-columns:1fr}.aprBadge{justify-self:start}}
`;

  function addStyle(){if($('adminPaymentReviewStyle'))return;const style=document.createElement('style');style.id='adminPaymentReviewStyle';style.textContent=CSS;document.head.appendChild(style);}
  function financeActive(){
    if(document.querySelector('.finx'))return true;
    const selected=[...document.querySelectorAll('#nav button,.nav button')].find(item=>item.classList.contains('active')||item.classList.contains('on'));
    return !!selected&&/finance/i.test(selected.textContent||'');
  }

  async function getClient(){
    if(state.client)return state.client;
    if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)throw new Error('Academy database connection is not available.');
    state.client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
    const session=await state.client.auth.getSession();
    state.user=session.data?.session?.user||null;
    if(!state.user)throw new Error('The administrator session could not be confirmed.');
    return state.client;
  }

  function ensureShell(){
    if(!financeActive())return null;
    let shell=$('paymentProofReview');if(shell)return shell;
    const host=document.querySelector('.finx')||$('view');if(!host)return null;
    shell=document.createElement('section');shell.id='paymentProofReview';shell.className='aprShell';
    shell.innerHTML=`<div class="aprHead"><div><p class="aprKicker">Student Payment Control</p><h2>Proof of Payment Review</h2><p class="aprIntro">Review submitted proofs against the learner's live course balance. Decisions update the same record shown in the Student Payments &amp; Balance tab.</p></div><button class="aprRefresh" id="aprRefresh" type="button">↻ Refresh</button></div><div id="aprNotice"></div><div id="aprBody"><div class="aprLoading"><div class="aprSpinner"></div>Loading payment records…</div></div>`;
    host.appendChild(shell);shell.addEventListener('click',handleClick);$('aprRefresh')?.addEventListener('click',()=>load(true));return shell;
  }

  function humanError(error){
    const message=String(error?.message||error||'The payment records could not be loaded.');
    if(/student_payment_accounts|review_student_payment|schema cache/i.test(message))return 'The secure student-payment service is not available yet. Publish the payment database update before using this review area.';
    return message;
  }

  async function load(force=false,quiet=false){
    const shell=ensureShell();if(!shell||state.loading)return;
    state.loading=true;const refresh=$('aprRefresh');if(refresh){refresh.disabled=true;refresh.textContent='Refreshing…';}
    if(!quiet)$('aprBody').innerHTML='<div class="aprLoading"><div class="aprSpinner"></div>Loading payment records…</div>';
    try{
      const client=await getClient();
      const [paymentsResult,studentsResult,accountsResult]=await Promise.all([
        client.from('payments').select('*').order('created_at',{ascending:false}),client.from('students').select('*'),client.from('student_payment_accounts').select('*')
      ]);
      const failed=[paymentsResult,studentsResult,accountsResult].find(result=>result.error);if(failed)throw failed.error;
      state.payments=paymentsResult.data||[];state.students=studentsResult.data||[];state.accounts=accountsResult.data||[];render();
    }catch(error){
      console.error('Admin payment review:',error);
      if(!quiet||!state.payments.length)$('aprBody').innerHTML=`<div class="aprNotice error"><strong>Payment review could not load.</strong><br>${esc(humanError(error))}</div>`;
    }finally{state.loading=false;if(refresh){refresh.disabled=false;refresh.textContent='↻ Refresh';}}
  }

  function maps(){return {students:new Map(state.students.map(student=>[String(student.id),student])),accounts:new Map(state.accounts.map(account=>[String(account.enrolment_id),account]))};}
  function render(){
    const body=$('aprBody');if(!body)return;
    const awaiting=state.payments.filter(payment=>['pending','submitted'].includes(status(payment.status)));
    const verified=state.payments.filter(payment=>status(payment.status)==='verified');
    const rejected=state.payments.filter(payment=>status(payment.status)==='rejected');
    const outstanding=state.accounts.reduce((sum,account)=>sum+number(account.outstanding_amount),0);
    body.innerHTML=`<div class="aprStats"><div class="aprStat attention"><span>Awaiting decisions</span><strong>${awaiting.length}</strong></div><div class="aprStat attention"><span>Value awaiting review</span><strong>${money(awaiting.reduce((sum,payment)=>sum+number(payment.amount),0))}</strong></div><div class="aprStat good"><span>Verified collections</span><strong>${money(verified.reduce((sum,payment)=>sum+number(payment.amount),0))}</strong></div><div class="aprStat"><span>Outstanding balances</span><strong>${money(outstanding)}</strong></div></div><div class="aprTools"><select class="aprControl" id="aprFilter" aria-label="Filter payment records"><option value="awaiting">Awaiting review (${awaiting.length})</option><option value="all">All records (${state.payments.length})</option><option value="verified">Verified (${verified.length})</option><option value="rejected">Declined (${rejected.length})</option></select><input class="aprControl" id="aprSearch" type="search" placeholder="Search student, email, course or reference" aria-label="Search payment records"></div><div class="aprList" id="aprList"></div>`;
    $('aprFilter').value=state.filter;$('aprSearch').value=state.search;
    $('aprFilter').addEventListener('change',event=>{state.filter=event.target.value;renderList();});
    $('aprSearch').addEventListener('input',event=>{state.search=event.target.value;renderList();});showNotice();renderList();
  }

  function filteredRows(studentMap,accountMap){
    const query=state.search.trim().toLowerCase();
    return state.payments.filter(payment=>{
      const current=status(payment.status),student=studentMap.get(String(payment.student_id))||{},account=accountMap.get(String(payment.enrolment_id))||{};
      const filterMatch=state.filter==='all'||state.filter==='awaiting'&&['pending','submitted'].includes(current)||current===state.filter;if(!filterMatch)return false;
      if(!query)return true;
      return [student.full_name,student.email,student.learner_number,student.student_number,account.course_title,payment.payment_reference].some(value=>String(value||'').toLowerCase().includes(query));
    });
  }

  function paymentCard(payment,studentMap,accountMap){
    const student=studentMap.get(String(payment.student_id))||{},account=accountMap.get(String(payment.enrolment_id))||{},current=status(payment.status)||'pending';
    const labels={submitted:'Awaiting review',pending:'Awaiting review',verified:'Verified',rejected:'Declined'},awaiting=['pending','submitted'].includes(current),projected=Math.max(0,number(account.outstanding_amount)-number(payment.amount));
    const option=payment.payment_option==='full_balance'?'Full balance':payment.payment_option==='next_instalment'?'Required instalment':'Legacy payment';
    const instalment=payment.installment_number&&payment.installment_count?`${payment.installment_number} of ${payment.installment_count}`:'—';
    const treatment=awaiting?money(projected):current==='verified'?'Included in verified paid':'Not deducted';
    return `<article class="aprItem"><div class="aprTop"><div><p class="aprStudent">${esc(student.full_name||'Student record')}</p><div class="aprCourse">${esc(student.email||'No email recorded')} · ${esc(account.course_title||'Course not linked')}<br>Submitted ${formatDate(payment.submitted_at||payment.created_at)}</div></div><span class="aprBadge ${current}">${esc(labels[current]||current)}</span></div><div class="aprData"><div class="aprDatum"><span>Submitted</span><b>${money(payment.amount)}</b></div><div class="aprDatum"><span>Option</span><b>${esc(option)}</b></div><div class="aprDatum"><span>Instalment</span><b>${esc(instalment)}</b></div><div class="aprDatum"><span>Current balance</span><b>${money(account.outstanding_amount)}</b></div><div class="aprDatum"><span>${awaiting?'If approved':'Balance treatment'}</span><b>${esc(treatment)}</b></div></div><div class="aprData"><div class="aprDatum"><span>Reference</span><b>${esc(payment.payment_reference||'Legacy record')}</b></div><div class="aprDatum"><span>Method</span><b>${esc(payment.payment_method||'—')}</b></div><div class="aprDatum"><span>Course fee</span><b>${money(account.course_fee)}</b></div><div class="aprDatum"><span>Verified paid</span><b>${money(account.verified_paid)}</b></div><div class="aprDatum"><span>Source</span><b>${esc(String(payment.submission_source||'legacy').replace('_',' '))}</b></div></div>${payment.rejection_reason?`<div class="aprReason"><strong>Decline reason:</strong> ${esc(payment.rejection_reason)}</div>`:''}<div class="aprActions">${payment.proof_url?`<button class="aprBtn aprView" type="button" data-apr-view="${esc(payment.id)}">View proof</button>`:''}${awaiting?`<button class="aprBtn aprApprove" type="button" data-apr-approve="${esc(payment.id)}">Approve payment</button><button class="aprBtn aprDecline" type="button" data-apr-decline="${esc(payment.id)}">Decline</button>`:''}</div></article>`;
  }

  function renderList(){const list=$('aprList');if(!list)return;const {students,accounts}=maps(),rows=filteredRows(students,accounts);list.innerHTML=rows.length?rows.map(payment=>paymentCard(payment,students,accounts)).join(''):'<div class="aprEmpty">No payment records match this view.</div>';}
  function showNotice(message,kind='success'){if(message!==undefined){state.notice=message;state.noticeKind=kind;}const box=$('aprNotice');if(!box)return;box.className=state.notice?`aprNotice ${state.noticeKind}`:'';box.textContent=state.notice||'';}
  function handleClick(event){const view=event.target.closest('[data-apr-view]');if(view){openProof(view.dataset.aprView);return;}const approve=event.target.closest('[data-apr-approve]');if(approve){openDecision(approve.dataset.aprApprove,'verified');return;}const decline=event.target.closest('[data-apr-decline]');if(decline)openDecision(decline.dataset.aprDecline,'rejected');}

  async function openProof(paymentId){
    const payment=state.payments.find(item=>String(item.id)===String(paymentId));if(!payment?.proof_url)return;
    const popup=window.open('about:blank','_blank');
    try{const client=await getClient(),result=await client.storage.from(BUCKET).createSignedUrl(payment.proof_url,300);if(result.error)throw result.error;if(popup){popup.opener=null;popup.location=result.data.signedUrl;}else window.open(result.data.signedUrl,'_blank','noopener');}
    catch(error){if(popup)popup.close();showNotice('The proof could not be opened securely: '+humanError(error),'error');}
  }

  function openDecision(paymentId,decision){
    closeDecision();const payment=state.payments.find(item=>String(item.id)===String(paymentId));if(!payment)return;
    const {students,accounts}=maps(),student=students.get(String(payment.student_id))||{},account=accounts.get(String(payment.enrolment_id))||{};
    const approve=decision==='verified',projected=Math.max(0,number(account.outstanding_amount)-number(payment.amount));
    document.body.insertAdjacentHTML('beforeend',`<div class="aprModal" id="aprModal" role="dialog" aria-modal="true" aria-labelledby="aprModalTitle"><div class="aprModalCard"><div class="aprModalHead"><div><p class="aprKicker">Finance decision</p><h2 id="aprModalTitle">${approve?'Approve payment':'Decline proof of payment'}</h2></div><button class="aprClose" id="aprModalClose" type="button" aria-label="Close">×</button></div><div class="aprModalBody"><div class="aprSummary"><strong>${esc(student.full_name||'Student')}</strong><br>${esc(account.course_title||'Course')}<br>Submitted: <strong>${money(payment.amount)}</strong> · Current balance: <strong>${money(account.outstanding_amount)}</strong>${approve?` · Balance after approval: <strong>${money(projected)}</strong>`:''}<br>Reference: <strong>${esc(payment.payment_reference||'Legacy record')}</strong></div>${approve?'<p class="aprIntro">Confirm only after the proof amount, beneficiary account and bank reference have been checked.</p>':`<label class="aprLabel" for="aprReason">Clear reason shown to the learner *</label><textarea class="aprTextarea" id="aprReason" placeholder="Explain what is incorrect and what the learner must submit next."></textarea>`}<div class="aprModalError" id="aprModalError" hidden></div><button class="aprConfirm ${approve?'approve':'decline'}" id="aprConfirm" type="button">${approve?'Confirm approval':'Decline & notify learner'}</button></div></div></div>`);
    $('aprModal').dataset.paymentId=payment.id;$('aprModal').dataset.decision=decision;$('aprModalClose').addEventListener('click',closeDecision);$('aprModal').addEventListener('click',event=>{if(event.target.id==='aprModal')closeDecision();});$('aprConfirm').addEventListener('click',submitDecision);if(!approve)$('aprReason').focus();
  }

  function closeDecision(){$('aprModal')?.remove();}
  function modalError(message){const box=$('aprModalError');if(box){box.textContent=message||'';box.hidden=!message;}}
  async function submitDecision(){
    const modal=$('aprModal');if(!modal)return;const payment=state.payments.find(item=>String(item.id)===modal.dataset.paymentId);if(!payment)return;
    const decision=modal.dataset.decision,reason=$('aprReason')?.value.trim()||'';if(decision==='rejected'&&reason.length<8)return modalError('Enter a clear decline reason of at least 8 characters.');
    modalError('');const button=$('aprConfirm');button.disabled=true;button.textContent=decision==='verified'?'Approving…':'Declining…';
    try{
      const client=await getClient(),result=await client.rpc('review_student_payment',{p_payment_id:payment.id,p_decision:decision,p_reason:reason||null});if(result.error)throw result.error;
      let delivery='';if(decision==='rejected')delivery=await notifyLearner(payment,reason);closeDecision();
      showNotice(decision==='verified'?`Payment ${money(payment.amount)} approved. The learner's live balance has been updated.`:`Payment declined. The reason is visible in the learner portal.${delivery}`,delivery.includes('could not')?'warn':'success');await load(true,true);
      window.dispatchEvent(new CustomEvent('funda:finance-data-changed'));
    }catch(error){console.error('Payment decision:',error);modalError(humanError(error));button.disabled=false;button.textContent=decision==='verified'?'Confirm approval':'Decline & notify learner';}
  }

  async function notifyLearner(payment,reason){
    const {students,accounts}=maps(),student=students.get(String(payment.student_id))||{},account=accounts.get(String(payment.enrolment_id))||{};
    const subject='Action required: Proof of payment declined';
    const message=`Dear ${student.full_name||'Learner'},\n\nWe reviewed the proof of payment submitted for ${account.course_title||'your course'}. Unfortunately, it could not be approved.\n\nReason: ${reason}\n\nPlease correct the issue and submit a valid proof through Payments & Balance in your Funda Online Academy Student Portal.\n\nRegards,\nFunda Online Academy\nAdmissions & Finance`;
    const client=await getClient(),notification=await client.from('payment_review_notifications').insert({payment_id:payment.id,student_id:payment.student_id,enrolment_id:payment.enrolment_id,email:student.email||null,subject,message,delivery_status:'pending'});
    if(notification.error){console.warn('Payment notification queue:',notification.error);return ' Email notification could not be queued; follow up with the learner.';}
    if(student.email){try{const delivery=await client.functions.invoke('send-payment-review-email',{body:{payment_id:payment.id}});if(delivery.error)throw delivery.error;return ' Email delivery has been requested.';}catch(error){console.warn('Payment email delivery:',error);return ' Email remains queued for delivery.';}}
    return ' No email address is recorded; follow up through the learner portal.';
  }

  function mount(){addStyle();if(financeActive()&&!$('paymentProofReview')){ensureShell();load();}}
  function init(){
    addStyle();document.addEventListener('click',event=>{const button=event.target.closest?.('#nav button,.nav button');if(button&&/finance/i.test(button.textContent||''))setTimeout(mount,350);},true);
    const view=$('view');if(view)new MutationObserver(()=>setTimeout(mount,100)).observe(view,{childList:true,subtree:false});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('aprModal'))closeDecision();});window.addEventListener('focus',()=>{if(financeActive()&&!$('aprModal'))load(false,true);});setInterval(()=>{if(!document.hidden&&financeActive()&&!$('aprModal'))load(true,true);},30000);setTimeout(mount,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
