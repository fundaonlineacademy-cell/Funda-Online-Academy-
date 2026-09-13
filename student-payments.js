(()=>{
  'use strict';
  if(window.__fundaStudentPayments)return;
  window.__fundaStudentPayments=true;

  const BUCKET='payment-proofs';
  const MAX_FILE_BYTES=5*1024*1024;
  const REFRESH_MS=30000;
  const state={client:null,user:null,accounts:[],payments:[],banks:[],selected:null,loading:false,lastLoaded:0,notice:''};
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const number=value=>Number.isFinite(Number(value))?Number(value):0;
  const cents=value=>Math.round(number(value)*100);
  const money=value=>number(value).toLocaleString('en-ZA',{style:'currency',currency:'ZAR',minimumFractionDigits:2,maximumFractionDigits:2});
  const status=value=>String(value||'').trim().toLowerCase();
  const formatDate=value=>{
    if(!value)return '—';
    try{return new Intl.DateTimeFormat('en-ZA',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));}
    catch{return '—';}
  };

  const CSS=`
body.sdV2:not([data-sd-view="payments"]) #studentPaymentsSection{display:none!important}
body.sdV2[data-sd-view="payments"] #dashboardContent>:not(#studentPaymentsSection){display:none!important}
body.sdV2[data-sd-view="payments"] #studentPaymentsSection{display:block!important}
.spShell{color:#172f49}
.spHero{position:relative;overflow:hidden;padding:28px;border-radius:26px;background:linear-gradient(135deg,#06152f 0%,#0b3771 68%,#174d91 100%);border:1px solid rgba(212,170,66,.55);box-shadow:0 12px 30px rgba(6,21,47,.18);color:#fff}
.spHero:after{content:"";position:absolute;width:320px;height:320px;border-radius:50%;right:-155px;top:-190px;background:rgba(255,255,255,.08)}
.spHero>*{position:relative;z-index:1}.spKicker{margin:0;color:#e7cb80;font-size:11px;letter-spacing:.17em;font-weight:900;text-transform:uppercase}.spHeroRow{display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.spHero h1{margin:7px 0 0;color:#fff!important;font:900 29px/1.25 Montserrat,sans-serif}.spHeroText{max-width:820px;margin:11px 0 0;color:#edf4ff;font-size:15px;line-height:1.7;font-weight:600}.spRefresh{flex:0 0 auto;border:1px solid rgba(255,255,255,.52);border-radius:11px;background:rgba(255,255,255,.10);color:#fff;padding:10px 13px;font:800 12px Inter,sans-serif;cursor:pointer}.spRefresh:disabled{opacity:.65;cursor:wait}
.spNotice{margin-top:14px;padding:12px 14px;border-radius:12px;background:#e7f6ed;border:1px solid #a9d6ba;color:#135b3b;font-size:13px;font-weight:800}.spNotice[hidden]{display:none}
.spSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:16px}.spSummaryCard{padding:17px;border:1px solid #dbe3ea;border-radius:17px;background:#fff;box-shadow:0 5px 16px rgba(20,49,77,.05)}.spSummaryCard span{display:block;color:#526274;font-size:11px;font-weight:800}.spSummaryCard strong{display:block;margin-top:7px;color:#102a4a;font:900 22px Montserrat,sans-serif}.spSummaryCard.gold strong{color:#91650b}.spSummaryCard.green strong{color:#14714e}.spSummaryCard.amber strong{color:#a56309}
.spGrid{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(300px,.75fr);gap:16px;margin-top:16px}.spPanel{padding:22px;border:1px solid #dbe3ea;border-radius:22px;background:#fff;box-shadow:0 5px 16px rgba(20,49,77,.05)}.spPanelHead{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}.spPanel h2{margin:4px 0 0;color:#17324a!important;font:900 21px/1.35 Montserrat,sans-serif}.spIntro{margin:8px 0 0;color:#405164;font-size:13px;line-height:1.65;font-weight:600}
.spCourseList{display:grid;gap:13px;margin-top:17px}.spCourse{padding:17px;border:1px solid #dce4eb;border-radius:18px;background:linear-gradient(145deg,#fff,#f8fbff)}.spCourseTop{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.spCourse h3{margin:0;color:#102a4a!important;font:900 15px/1.4 Montserrat,sans-serif}.spCourseMeta{margin-top:4px;color:#667589;font-size:11px;font-weight:700}.spBadge{display:inline-flex;align-items:center;justify-content:center;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap}.spBadge.paid,.spBadge.verified{background:#ddf5e7;color:#12613f}.spBadge.review,.spBadge.submitted,.spBadge.pending{background:#fff0cf;color:#8a5800}.spBadge.due{background:#e8f0ff;color:#174b93}.spBadge.rejected{background:#fde5e5;color:#9a2929}
.spMoneyGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:14px}.spMoney{padding:10px;border-radius:12px;background:#fff;border:1px solid #e3e8ee}.spMoney span{display:block;color:#677589;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.spMoney b{display:block;margin-top:4px;color:#17324a;font-size:13px}.spMoney.balance{border-color:#e0c676;background:#fffbef}.spTrack{height:7px;margin-top:14px;border-radius:999px;background:#e7edf3;overflow:hidden}.spTrack i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#c38c14,#e2bc55)}.spPlan{margin:12px 0 0;color:#33485c;font-size:12px;line-height:1.55;font-weight:650}.spCourseAlert{margin-top:11px;padding:10px 11px;border-radius:10px;background:#fff3d9;border:1px solid #ead08c;color:#76500a;font-size:11px;line-height:1.5;font-weight:750}.spCourseAlert.danger{background:#fff0f0;border-color:#efc0c0;color:#8c2c2c}.spCourseAction{display:flex;justify-content:flex-end;margin-top:13px}.spPayButton{border:0;border-radius:11px;background:#071d49;color:#fff;padding:11px 14px;font:900 12px Inter,sans-serif;cursor:pointer}.spPayButton:disabled{background:#dfe6ed;color:#667589;cursor:not-allowed}
.spBankList{display:grid;gap:11px;margin-top:15px}.spBank{padding:14px;border:1px solid #e1d19f;border-radius:15px;background:#fffaf0}.spBank h3{margin:0;color:#17324a!important;font:900 14px Montserrat,sans-serif}.spBank dl{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0 0}.spBank dt{color:#6f7b89;font-size:9px;font-weight:800;text-transform:uppercase}.spBank dd{margin:3px 0 0;color:#112c49;font-size:12px;font-weight:850;overflow-wrap:anywhere}.spReference{margin-top:12px;padding:12px;border-left:4px solid #d4aa42;border-radius:0 10px 10px 0;background:#fff6dd;color:#263b4e;font-size:12px;line-height:1.55}.spSafety{margin-top:12px;color:#8c2c2c;font-size:11px;line-height:1.55;font-weight:800}.spEmpty{margin-top:15px;padding:25px;border:1px dashed #cdd8e2;border-radius:15px;text-align:center;color:#526274;font-size:13px;line-height:1.6}
.spHistory{margin-top:16px}.spHistoryList{display:grid;gap:9px;margin-top:15px}.spHistoryItem{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:13px;padding:14px;border:1px solid #e0e7ed;border-radius:14px;background:#fbfdff}.spHistoryItem h3{margin:0;color:#17324a!important;font:850 13px/1.4 Inter,sans-serif}.spHistoryMeta{margin-top:5px;color:#5b6c7e;font-size:11px;line-height:1.55}.spHistoryReason{grid-column:1/-1;padding:9px 10px;border-radius:9px;background:#fff0f0;color:#8d3030;font-size:11px;line-height:1.5;font-weight:750}.spProof{align-self:start;border:1px solid #17324a;border-radius:9px;background:#fff;color:#17324a;padding:8px 10px;font-size:10px;font-weight:900;cursor:pointer}
.spLoading{margin-top:16px;padding:42px;border:1px solid #dbe3ea;border-radius:20px;background:#fff;text-align:center}.spSpinner{width:37px;height:37px;margin:0 auto;border:4px solid #dbe5ef;border-top-color:#0b3771;border-radius:50%;animation:spSpin .8s linear infinite}@keyframes spSpin{to{transform:rotate(360deg)}}.spError{margin-top:16px;padding:18px;border:1px solid #efc0c0;border-radius:16px;background:#fff3f3;color:#8c2c2c;font-size:13px;line-height:1.6}.spError button{display:block;margin-top:11px;border:0;border-radius:9px;background:#8c2c2c;color:#fff;padding:9px 12px;font-weight:850}
.spModal{position:fixed;inset:0;z-index:23000;display:grid;place-items:center;padding:16px;background:rgba(3,15,34,.78);backdrop-filter:blur(3px)}.spModal[hidden]{display:none}.spModalCard{width:min(720px,100%);max-height:92vh;overflow:auto;border-radius:23px;background:#fff;box-shadow:0 28px 70px rgba(0,0,0,.32)}.spModalHead{position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;gap:14px;padding:20px 22px;border-bottom:1px solid #e1e7ed;background:#fff}.spModalHead h2{margin:4px 0 0;color:#17324a!important;font:900 21px/1.35 Montserrat,sans-serif}.spClose{width:40px;height:40px;flex:0 0 auto;border:1px solid #dbe3ea;border-radius:11px;background:#f6f8fa;color:#17324a;font-size:22px;cursor:pointer}.spForm{padding:20px 22px 24px}.spBalanceStrip{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px;border-radius:14px;background:#f4f7fb}.spBalanceStrip span{display:block;color:#667589;font-size:9px;font-weight:800;text-transform:uppercase}.spBalanceStrip b{display:block;margin-top:4px;color:#17324a;font-size:13px}.spField{margin-top:16px}.spField>label,.spLegend{display:block;margin-bottom:7px;color:#263b4e;font-size:12px;font-weight:850}.spOptions{display:grid;gap:9px}.spOption{display:flex;gap:10px;align-items:flex-start;padding:12px;border:1px solid #dbe3ea;border-radius:12px;cursor:pointer}.spOption:has(input:checked){border-color:#c99a2e;background:#fff9e8}.spOption input{margin-top:3px}.spOption strong{display:block;color:#17324a;font-size:12px}.spOption span{display:block;margin-top:3px;color:#667589;font-size:10px;line-height:1.45}.spInput{width:100%;min-height:45px;box-sizing:border-box;border:1px solid #cfd9e2;border-radius:11px;background:#fff;padding:11px 12px;color:#142e49;font:650 14px Inter,sans-serif}.spInput[readonly]{background:#f2f5f8;font-weight:900}.spFileHelp{margin-top:6px;color:#667589;font-size:10px;line-height:1.5}.spDeclaration{display:flex;gap:10px;align-items:flex-start;margin-top:16px;padding:12px;border-radius:12px;background:#fff9e8;border:1px solid #ead49b;color:#35495c;font-size:11px;line-height:1.55;font-weight:700}.spDeclaration input{margin-top:3px;flex:0 0 auto}.spFormError{margin-top:13px;padding:10px 12px;border-radius:10px;background:#fff0f0;color:#962d2d;font-size:11px;line-height:1.5;font-weight:800}.spFormError[hidden]{display:none}.spSubmit{width:100%;min-height:47px;margin-top:16px;border:0;border-radius:12px;background:linear-gradient(135deg,#c18a10,#e0ba54);color:#142b45;font:900 13px Inter,sans-serif;cursor:pointer}.spSubmit:disabled{opacity:.62;cursor:wait}
@media(max-width:980px){.spSummary{grid-template-columns:1fr 1fr}.spGrid{grid-template-columns:1fr}.spMoneyGrid{grid-template-columns:1fr 1fr}}
@media(max-width:620px){.spHero{padding:22px 18px;border-radius:21px}.spHeroRow{display:block}.spHero h1{font-size:24px}.spRefresh{margin-top:15px}.spSummary{gap:8px}.spSummaryCard{padding:14px}.spSummaryCard strong{font-size:18px}.spPanel{padding:18px 15px}.spCourseTop{display:block}.spCourseTop .spBadge{margin-top:9px}.spMoneyGrid{grid-template-columns:1fr 1fr}.spBank dl{grid-template-columns:1fr}.spHistoryItem{grid-template-columns:1fr}.spProof{justify-self:start}.spBalanceStrip{grid-template-columns:1fr}.spModal{padding:8px}.spModalCard{max-height:96vh;border-radius:18px}.spModalHead,.spForm{padding-left:16px;padding-right:16px}}
`;

  function addStyle(){
    if($('studentPaymentsStyle'))return;
    const style=document.createElement('style');
    style.id='studentPaymentsStyle';
    style.textContent=CSS;
    document.head.appendChild(style);
  }

  function mount(){
    addStyle();
    const dashboard=$('dashboardContent');
    if(!dashboard||$('studentPaymentsSection'))return;
    const section=document.createElement('section');
    section.id='studentPaymentsSection';
    section.className='spShell';
    section.setAttribute('aria-labelledby','studentPaymentsHeading');
    section.innerHTML=`
      <div class="spHero">
        <div class="spHeroRow">
          <div><p class="spKicker">Student Finance</p><h1 id="studentPaymentsHeading">Payments &amp; Balance</h1><p class="spHeroText">See every course balance, choose an approved payment amount and submit your proof securely for Admissions &amp; Finance review.</p></div>
          <button type="button" class="spRefresh" id="spRefresh">↻ Refresh balances</button>
        </div>
        <div class="spNotice" id="spNotice" role="status" hidden></div>
      </div>
      <div id="spContent"><div class="spLoading"><div class="spSpinner"></div><p class="spIntro">Preparing your payment accounts…</p></div></div>`;
    const orientation=$('studentOrientation');
    if(orientation?.nextSibling)dashboard.insertBefore(section,orientation.nextSibling);else dashboard.prepend(section);
    section.addEventListener('click',handleSectionClick);
    $('spRefresh')?.addEventListener('click',()=>load(true));
  }

  function getClient(){
    if(state.client)return state.client;
    try{if(typeof db!=='undefined'&&db)state.client=db;}catch{}
    if(!state.client&&window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
      state.client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
    }
    return state.client;
  }

  async function getUser(){
    if(state.user)return state.user;
    try{if(typeof currentUser!=='undefined'&&currentUser)state.user=currentUser;}catch{}
    if(state.user)return state.user;
    const client=getClient();
    if(!client)throw new Error('The secure Academy connection is not available.');
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    state.user=data?.session?.user||null;
    if(!state.user)throw new Error('Your student session has ended. Please sign in again.');
    return state.user;
  }

  function humanError(error){
    const message=String(error?.message||error||'The payment information could not be loaded.');
    if(/student_payment_accounts|submit_student_payment|schema cache/i.test(message))return 'The secure Payments & Balance service is not available yet. Please try again after the Academy update is published.';
    if(/jwt|session|not authenticated/i.test(message))return 'Your secure session could not be confirmed. Refresh the page or sign in again.';
    return message;
  }

  async function load(force=false,quiet=false){
    mount();
    if(state.loading)return;
    if(!force&&state.lastLoaded&&Date.now()-state.lastLoaded<15000){render();return;}
    state.loading=true;
    const refresh=$('spRefresh');if(refresh){refresh.disabled=true;refresh.textContent='Refreshing…';}
    if(!quiet&&$('spContent'))$('spContent').innerHTML='<div class="spLoading"><div class="spSpinner"></div><p class="spIntro">Preparing your payment accounts…</p></div>';
    try{
      await getUser();
      const client=getClient();
      const [accountResult,paymentResult,bankResult]=await Promise.all([
        client.from('student_payment_accounts').select('*').order('last_payment_at',{ascending:false,nullsFirst:false}),
        client.from('payments').select('*').order('created_at',{ascending:false}),
        client.from('academy_payment_settings').select('id,bank_name,account_name,account_number,branch_code,account_type,payment_reference_instruction,is_active').eq('is_active',true).order('id')
      ]);
      const failed=[accountResult,paymentResult,bankResult].find(result=>result.error);
      if(failed)throw failed.error;
      state.accounts=accountResult.data||[];
      state.payments=paymentResult.data||[];
      state.banks=(bankResult.data||[]).filter(bank=>bank.bank_name&&bank.account_number);
      state.lastLoaded=Date.now();
      try{if(typeof payments!=='undefined')payments=state.payments;}catch{}
      render();
    }catch(error){
      console.error('Student payments:',error);
      if(!quiet||!state.lastLoaded)renderError(humanError(error));
    }finally{
      state.loading=false;
      if(refresh){refresh.disabled=false;refresh.textContent='↻ Refresh balances';}
    }
  }

  function accountStatus(account){
    if(number(account.outstanding_amount)<=0)return ['Paid in full','paid'];
    if(account.has_payment_under_review)return ['Under review','review'];
    return ['Payment due','due'];
  }

  function planText(account){
    const balance=number(account.outstanding_amount);
    if(balance<=0)return 'Your verified payments have settled this course balance in full.';
    if(number(account.installment_count)<=1)return `This course requires full payment. The current amount due is ${money(account.outstanding_amount)}.`;
    return `Payment plan: ${account.installment_count} instalments. Instalment ${account.next_installment_number} of ${account.installment_count} is ${money(account.next_required_amount)}, or you may settle the full ${money(account.outstanding_amount)} balance.`;
  }

  function latestRejected(account){
    return state.payments.find(payment=>String(payment.enrolment_id)===String(account.enrolment_id)&&status(payment.status)==='rejected');
  }

  function courseCard(account){
    const [label,kind]=accountStatus(account);
    const fee=number(account.course_fee),verified=number(account.verified_paid),pending=number(account.submitted_amount),balance=number(account.outstanding_amount);
    const progress=fee>0?Math.max(0,Math.min(100,Math.round((Math.min(verified,fee)/fee)*100))):100;
    const rejected=latestRejected(account);
    let action='';
    if(balance<=0)action='<button class="spPayButton" type="button" disabled>Balance settled ✓</button>';
    else if(account.has_payment_under_review)action='<button class="spPayButton" type="button" disabled>Proof awaiting review</button>';
    else if(!state.banks.length)action='<button class="spPayButton" type="button" disabled>Bank details unavailable</button>';
    else action=`<button class="spPayButton" type="button" data-sp-pay="${esc(account.enrolment_id)}">Make a payment</button>`;
    return `<article class="spCourse">
      <div class="spCourseTop"><div><h3>${esc(account.course_title||'Registered course')}</h3><div class="spCourseMeta">${esc(account.course_duration||'Course duration not recorded')} · ${account.installment_count>1?esc(account.installment_count)+'-part payment plan':'Full-payment course'}</div></div><span class="spBadge ${kind}">${label}</span></div>
      <div class="spMoneyGrid"><div class="spMoney"><span>Course fee</span><b>${money(fee)}</b></div><div class="spMoney"><span>Verified paid</span><b>${money(verified)}</b></div><div class="spMoney"><span>Awaiting review</span><b>${money(pending)}</b></div><div class="spMoney balance"><span>Outstanding</span><b>${money(balance)}</b></div></div>
      <div class="spTrack" aria-label="${progress}% of course fee verified"><i style="width:${progress}%"></i></div>
      <p class="spPlan">${esc(planText(account))}</p>
      ${account.has_payment_under_review?'<div class="spCourseAlert">Your submitted amount remains visible as “awaiting review”. It reduces the outstanding balance only after Admissions &amp; Finance verifies the proof.</div>':''}
      ${rejected&&!account.has_payment_under_review?`<div class="spCourseAlert danger"><strong>Previous proof declined:</strong> ${esc(rejected.rejection_reason||'Please submit a corrected proof of payment.')}</div>`:''}
      <div class="spCourseAction">${action}</div>
    </article>`;
  }

  function bankCards(compact=false){
    if(!state.banks.length)return '<div class="spEmpty">Official Academy banking details are temporarily unavailable. Do not make or submit a payment until they are displayed here.</div>';
    return state.banks.map(bank=>`<article class="spBank"><h3>${esc(bank.bank_name)}</h3><dl>
      <div><dt>Account name</dt><dd>${esc(bank.account_name||'Funda Online Academy')}</dd></div>
      <div><dt>Account number</dt><dd>${esc(bank.account_number)}</dd></div>
      <div><dt>Branch code</dt><dd>${esc(bank.branch_code||'—')}</dd></div>
      ${bank.account_type?`<div><dt>Account type</dt><dd>${esc(bank.account_type)}</dd></div>`:''}
    </dl></article>`).join('')+(compact?'':`<div class="spReference"><strong>Payment reference:</strong> ${esc(state.banks[0]?.payment_reference_instruction||'Use your South African ID number.')}</div><p class="spSafety">Use only the bank details shown inside this secure Academy portal. The Academy will never ask for your password, OTP or banking PIN.</p>`);
  }

  function historyItem(payment,accountMap){
    const account=accountMap.get(String(payment.enrolment_id));
    const paymentStatus=status(payment.status)||'pending';
    const labels={verified:'Verified',submitted:'Awaiting review',pending:'Awaiting review',rejected:'Declined'};
    const option=payment.payment_option==='full_balance'?'Full balance':payment.payment_option==='next_instalment'?'Required instalment':'Payment';
    const installment=payment.installment_number&&payment.installment_count?` · Instalment ${payment.installment_number} of ${payment.installment_count}`:'';
    return `<article class="spHistoryItem"><div><h3>${esc(account?.course_title||'Course payment')} · ${money(payment.amount)}</h3><div class="spHistoryMeta">${esc(option)}${installment} · ${esc(payment.payment_method||'Method not recorded')}<br>Reference: ${esc(payment.payment_reference||'Legacy record')} · Submitted ${formatDate(payment.submitted_at||payment.created_at)}</div></div><div><span class="spBadge ${paymentStatus}">${esc(labels[paymentStatus]||paymentStatus)}</span>${payment.proof_url?`<button type="button" class="spProof" data-sp-proof="${esc(payment.id)}">View proof</button>`:''}</div>${paymentStatus==='rejected'?`<div class="spHistoryReason"><strong>Decline reason:</strong> ${esc(payment.rejection_reason||'Please contact Admissions & Finance for the review details.')}</div>`:''}</article>`;
  }

  function render(){
    const host=$('spContent');if(!host)return;
    const totals=state.accounts.reduce((sum,account)=>({
      fee:sum.fee+number(account.course_fee),verified:sum.verified+number(account.verified_paid),pending:sum.pending+number(account.submitted_amount),outstanding:sum.outstanding+number(account.outstanding_amount)
    }),{fee:0,verified:0,pending:0,outstanding:0});
    const accountMap=new Map(state.accounts.map(account=>[String(account.enrolment_id),account]));
    const relevantHistory=state.payments.filter(payment=>accountMap.has(String(payment.enrolment_id)));
    host.innerHTML=`
      <div class="spSummary" aria-label="Payment totals"><div class="spSummaryCard"><span>Agreed course fees</span><strong>${money(totals.fee)}</strong></div><div class="spSummaryCard green"><span>Verified payments</span><strong>${money(totals.verified)}</strong></div><div class="spSummaryCard amber"><span>Awaiting review</span><strong>${money(totals.pending)}</strong></div><div class="spSummaryCard gold"><span>Outstanding balance</span><strong>${money(totals.outstanding)}</strong></div></div>
      <div class="spGrid"><section class="spPanel"><div class="spPanelHead"><div><p class="spKicker">Your Accounts</p><h2>Course balances</h2><p class="spIntro">A balance is reduced only by payments marked Verified. Every enrolled course remains listed, including courses with a zero balance.</p></div></div><div class="spCourseList">${state.accounts.length?state.accounts.map(courseCard).join(''):'<div class="spEmpty">No course payment accounts are linked to your student profile yet.</div>'}</div></section>
      <aside class="spPanel"><p class="spKicker">Official Details</p><h2>Academy bank accounts</h2><p class="spIntro">Choose one account and use the required reference. Do not split one payment between accounts unless the Academy instructs you to.</p><div class="spBankList">${bankCards()}</div></aside></div>
      <section class="spPanel spHistory"><p class="spKicker">Traceable Records</p><h2>Payment history</h2><p class="spIntro">Every submitted proof stays connected to its course and review outcome.</p><div class="spHistoryList">${relevantHistory.length?relevantHistory.map(payment=>historyItem(payment,accountMap)).join(''):'<div class="spEmpty">No payment records have been submitted yet.</div>'}</div></section>`;
    showNotice();
  }

  function renderError(message){
    const host=$('spContent');if(!host)return;
    host.innerHTML=`<div class="spError"><strong>Payments &amp; Balance could not load.</strong><br>${esc(message)}<button type="button" id="spRetry">Try again</button></div>`;
    $('spRetry')?.addEventListener('click',()=>load(true));
  }

  function showNotice(message){
    if(message!==undefined)state.notice=message;
    const box=$('spNotice');if(!box)return;
    box.textContent=state.notice||'';
    box.hidden=!state.notice;
  }

  function handleSectionClick(event){
    const pay=event.target.closest('[data-sp-pay]');
    if(pay){const account=state.accounts.find(item=>String(item.enrolment_id)===pay.dataset.spPay);if(account)openModal(account);return;}
    const proof=event.target.closest('[data-sp-proof]');
    if(proof)openProof(proof.dataset.spProof);
  }

  function identityReference(){
    try{return String(studentRecord?.south_african_id||studentRecord?.passport_number||studentRecord?.id_number||studentRecord?.identity_number||'').replace(/\s+/g,'').slice(0,80);}catch{return '';}
  }

  function openModal(account){
    if(number(account.outstanding_amount)<=0||account.has_payment_under_review||!state.banks.length)return;
    closeModal();state.selected=account;
    const nextCents=cents(account.next_required_amount),balanceCents=cents(account.outstanding_amount);
    const hasChoice=nextCents>0&&nextCents<balanceCents;
    const reference=identityReference();
    document.body.insertAdjacentHTML('beforeend',`<div class="spModal" id="spPaymentModal" role="dialog" aria-modal="true" aria-labelledby="spModalTitle"><div class="spModalCard">
      <div class="spModalHead"><div><p class="spKicker">Secure submission</p><h2 id="spModalTitle">Pay ${esc(account.course_title||'course balance')}</h2></div><button type="button" class="spClose" id="spModalClose" aria-label="Close payment form">×</button></div>
      <form class="spForm" id="spPaymentForm" novalidate>
        <div class="spBalanceStrip"><div><span>Course fee</span><b>${money(account.course_fee)}</b></div><div><span>Verified paid</span><b>${money(account.verified_paid)}</b></div><div><span>Outstanding</span><b>${money(account.outstanding_amount)}</b></div></div>
        <fieldset class="spField"><legend class="spLegend">Choose payment amount *</legend><div class="spOptions">
          ${hasChoice?`<label class="spOption"><input type="radio" name="spPaymentOption" value="next_instalment" checked><span><strong>Pay required instalment — ${money(account.next_required_amount)}</strong><span>Instalment ${account.next_installment_number} of ${account.installment_count}. Payments below this amount are not accepted.</span></span></label>`:''}
          <label class="spOption"><input type="radio" name="spPaymentOption" value="full_balance" ${hasChoice?'':'checked'}><span><strong>Pay full outstanding balance — ${money(account.outstanding_amount)}</strong><span>This settles the current verified course balance in full once Finance approves the proof.</span></span></label>
        </div></fieldset>
        <div class="spField"><label for="spAmount">Amount submitted *</label><input class="spInput" id="spAmount" type="text" readonly aria-readonly="true"></div>
        <div class="spField"><label for="spMethod">Payment method *</label><select class="spInput" id="spMethod" required><option value="">Select payment method</option><option value="EFT / Bank Transfer">EFT / Bank Transfer</option><option value="Bank Deposit">Bank Deposit</option></select></div>
        <div class="spField"><label for="spReference">Payment reference used at the bank *</label><input class="spInput" id="spReference" type="text" minlength="2" maxlength="80" autocomplete="off" value="${esc(reference)}" placeholder="Use your South African ID or passport number" required><div class="spFileHelp">Use the exact reference shown on your proof so Finance can match the deposit.</div></div>
        <div class="spField"><label for="spProofFile">Proof of payment *</label><input class="spInput" id="spProofFile" type="file" accept="application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png" required><div class="spFileHelp">PDF, JPG or PNG only. Maximum file size: 5 MB.</div></div>
        <div class="spField"><p class="spLegend">Official Academy bank accounts</p><div class="spBankList">${bankCards(true)}</div></div>
        <label class="spDeclaration"><input id="spDeclaration" type="checkbox" required><span>I confirm that the amount, bank reference and proof are correct and belong to this course payment. I understand that the balance changes only after Admissions &amp; Finance verifies the proof.</span></label>
        <div class="spFormError" id="spFormError" role="alert" hidden></div>
        <button class="spSubmit" id="spSubmit" type="submit">Submit proof for review</button>
      </form></div></div>`);
    const modal=$('spPaymentModal');
    $('spModalClose').addEventListener('click',closeModal);
    modal.addEventListener('click',event=>{if(event.target===modal)closeModal();});
    modal.querySelectorAll('input[name="spPaymentOption"]').forEach(input=>input.addEventListener('change',updateModalAmount));
    $('spPaymentForm').addEventListener('submit',submitPayment);
    updateModalAmount();
    document.body.style.overflow='hidden';
    $('spMethod').focus();
  }

  function closeModal(){
    $('spPaymentModal')?.remove();
    state.selected=null;
    document.body.style.overflow='';
  }

  function updateModalAmount(){
    const account=state.selected,field=$('spAmount');if(!account||!field)return;
    const option=document.querySelector('input[name="spPaymentOption"]:checked')?.value||'full_balance';
    field.value=money(option==='next_instalment'?account.next_required_amount:account.outstanding_amount);
    field.dataset.amount=String(option==='next_instalment'?number(account.next_required_amount):number(account.outstanding_amount));
  }

  function fileInfo(file){
    if(!file)return {error:'Choose a proof of payment file.'};
    if(file.size<=0)return {error:'The selected proof file is empty.'};
    if(file.size>MAX_FILE_BYTES)return {error:'The proof is larger than 5 MB. Upload a smaller PDF, JPG or PNG file.'};
    const extension=String(file.name||'').split('.').pop().toLowerCase();
    const allowedExtensions=['pdf','jpg','jpeg','png'];
    const allowedTypes=['application/pdf','image/jpeg','image/png'];
    if(!allowedExtensions.includes(extension)||file.type&&!allowedTypes.includes(file.type))return {error:'Upload the proof as a PDF, JPG or PNG file.'};
    return {extension,contentType:file.type||({pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg'}[extension])};
  }

  function formError(message){
    const box=$('spFormError');if(!box)return;
    box.textContent=message||'';box.hidden=!message;
  }

  async function submitPayment(event){
    event.preventDefault();
    const account=state.selected;if(!account)return;
    formError('');
    const option=document.querySelector('input[name="spPaymentOption"]:checked')?.value;
    const method=$('spMethod')?.value;
    const reference=$('spReference')?.value.trim();
    const declaration=$('spDeclaration')?.checked;
    const file=$('spProofFile')?.files?.[0];
    const info=fileInfo(file);
    if(!['next_instalment','full_balance'].includes(option))return formError('Choose an approved payment amount.');
    if(!['EFT / Bank Transfer','Bank Deposit'].includes(method))return formError('Select EFT / Bank Transfer or Bank Deposit.');
    if(!reference||reference.length<2)return formError('Enter the payment reference used at the bank.');
    if(info.error)return formError(info.error);
    if(!declaration)return formError('Confirm that the payment details and proof are correct.');
    const expected=option==='next_instalment'?number(account.next_required_amount):number(account.outstanding_amount);
    if(expected<=0)return formError('This course does not have an amount available for payment. Refresh the balance.');
    const button=$('spSubmit');button.disabled=true;button.textContent='Uploading proof securely…';
    let proofPath='';
    try{
      const user=await getUser(),client=getClient();
      const random=window.crypto?.randomUUID?window.crypto.randomUUID().slice(0,12):Math.random().toString(36).slice(2,14);
      proofPath=`${user.id}/${account.enrolment_id}-${Date.now()}-${random}.${info.extension}`;
      const upload=await client.storage.from(BUCKET).upload(proofPath,file,{cacheControl:'3600',upsert:false,contentType:info.contentType});
      if(upload.error)throw new Error('The proof could not be uploaded: '+upload.error.message);
      button.textContent='Recording payment…';
      const result=await client.rpc('submit_student_payment',{
        p_enrolment_id:account.enrolment_id,
        p_amount:expected,
        p_payment_method:method,
        p_payment_reference:reference,
        p_proof_path:proofPath,
        p_payment_option:option,
        p_submission_source:'student_portal'
      });
      if(result.error)throw result.error;
      const successAmount=expected;
      closeModal();
      state.notice=`Proof submitted successfully for ${money(successAmount)}. Admissions & Finance will review it; your outstanding balance will update after verification.`;
      await load(true);
      window.scrollTo({top:0,behavior:'smooth'});
    }catch(error){
      console.error('Payment submission:',error);
      if(proofPath){try{await getClient().storage.from(BUCKET).remove([proofPath]);}catch{}}
      formError(humanError(error));
      if(button){button.disabled=false;button.textContent='Submit proof for review';}
    }
  }

  async function openProof(paymentId){
    const payment=state.payments.find(item=>String(item.id)===String(paymentId));
    if(!payment?.proof_url)return;
    const popup=window.open('about:blank','_blank');
    try{
      const result=await getClient().storage.from(BUCKET).createSignedUrl(payment.proof_url,300);
      if(result.error)throw result.error;
      if(popup){popup.opener=null;popup.location=result.data.signedUrl;}else window.open(result.data.signedUrl,'_blank','noopener');
    }catch(error){
      if(popup)popup.close();
      state.notice='The proof could not be opened securely. Please try again.';showNotice();
    }
  }

  function show(){
    mount();
    load(Date.now()-state.lastLoaded>15000);
  }

  function init(){
    mount();
    window.FundaStudentPayments={show,refresh:()=>load(true),load};
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('spPaymentModal'))closeModal();});
    window.addEventListener('focus',()=>{if(document.body.dataset.sdView==='payments'&&!$('spPaymentModal'))load(true,true);});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden&&document.body.dataset.sdView==='payments'&&!$('spPaymentModal'))load(true,true);});
    setInterval(()=>{if(!document.hidden&&document.body.dataset.sdView==='payments'&&!$('spPaymentModal'))load(true,true);},REFRESH_MS);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
