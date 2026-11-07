(()=>{
  if(window.__fundaOnboardingIntegrityPayments)return;
  window.__fundaOnboardingIntegrityPayments=true;

  const MINIMUM_AGE=16;
  const TWO_INSTALLMENT_MIN_FEE=1000;
  const THREE_INSTALLMENT_MIN_FEE=2000;
  const THREE_INSTALLMENT_MIN_WEEKS=8;
  const money=n=>Number(n||0).toLocaleString('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:2});
  const digits=v=>String(v||'').replace(/\D/g,'');

  function ensureCourseBrowser(){
    if(document.querySelector('script[data-funda-course-browser-fresh]'))return;
    const script=document.createElement('script');
    script.src='onboarding-course-browser.js?v='+Date.now();
    script.async=false;
    script.dataset.fundaCourseBrowserFresh='1';
    document.head.appendChild(script);
  }

  function ageOn(date){
    const today=new Date();
    let age=today.getFullYear()-date.getFullYear();
    const m=today.getMonth()-date.getMonth();
    if(m<0||(m===0&&today.getDate()<date.getDate()))age--;
    return age;
  }

  function validDate(y,m,d){
    const x=new Date(y,m-1,d);
    return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d;
  }

  function luhnValidSAId(id){
    if(!/^\d{13}$/.test(id))return false;
    let sum=0;
    for(let i=0;i<12;i++){
      let n=Number(id[i]);
      if(i%2===1){n*=2;if(n>9)n-=9;}
      sum+=n;
    }
    return (10-(sum%10))%10===Number(id[12]);
  }

  function birthDateFromSAId(raw){
    const id=digits(raw);
    if(!/^\d{13}$/.test(id))return {error:'Please enter a valid 13-digit South African ID number.'};
    const yy=Number(id.slice(0,2)),mm=Number(id.slice(2,4)),dd=Number(id.slice(4,6));
    const thisYear=new Date().getFullYear();
    const candidates=[1900+yy,2000+yy]
      .filter(y=>validDate(y,mm,dd))
      .map(y=>new Date(y,mm-1,dd))
      .filter(d=>d<=new Date()&&ageOn(d)>=MINIMUM_AGE&&ageOn(d)<=120)
      .sort((a,b)=>b-a);
    if(!candidates.length)return {error:`The birth date encoded in this ID is not eligible. Learners must be at least ${MINIMUM_AGE} years old and the date cannot be in the future.`};
    const date=candidates[0];
    const iso=`${date.getFullYear()}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
    return {date,iso,age:ageOn(date),checksum:luhnValidSAId(id)};
  }

  function durationWeeks(text){
    const nums=String(text||'').match(/\d+(?:\.\d+)?/g)?.map(Number)||[];
    if(!nums.length)return 0;
    const max=Math.max(...nums);
    return /month/i.test(String(text||''))?Math.round(max*4.345):max;
  }

  function paymentPlanFor(price,duration){
    const fee=Number(price||0),weeks=durationWeeks(duration);
    if(fee<TWO_INSTALLMENT_MIN_FEE)return {installments:1,weeks,fee};
    if(fee>=THREE_INSTALLMENT_MIN_FEE&&weeks>=THREE_INSTALLMENT_MIN_WEEKS)return {installments:3,weeks,fee};
    return {installments:2,weeks,fee};
  }

  function paymentParts(total,count){
    const cents=Math.round(Number(total||0)*100);
    const base=Math.ceil(cents/count);
    const parts=[];let remaining=cents;
    for(let i=0;i<count;i++){
      const part=i===count-1?remaining:Math.min(base,remaining);
      parts.push(part/100);remaining-=part;
    }
    return parts;
  }

  function ensureIdentityUI(){
    const id=document.getElementById('idNumber'),dob=document.getElementById('dateOfBirth'),type=document.getElementById('identityDocumentType');
    if(!id||!dob)return;
    dob.required=true;
    dob.removeAttribute('max');
    let note=document.getElementById('dobIntegrityNote');
    if(!note){
      note=document.createElement('p');
      note.id='dobIntegrityNote';note.className='text-xs mt-2 text-gray-500 leading-5';
      dob.parentElement.appendChild(note);
    }
    const validate=()=>{
      const isSA=(type?.value||'south_african_id')==='south_african_id';
      dob.readOnly=isSA;
      dob.toggleAttribute('aria-readonly',isSA);
      dob.classList.toggle('bg-gray-50',isSA);
      dob.classList.toggle('text-gray-700',isSA);
      if(!isSA){
        note.textContent=`Enter the date of birth shown on the passport or foreign identity document. Minimum learner age: ${MINIMUM_AGE}.`;
        note.className='text-xs mt-2 text-gray-500 leading-5';
        return;
      }
      id.value=digits(id.value).slice(0,13);
      if(id.value.length<13){dob.value='';note.textContent=`Date of birth is read automatically from the South African ID number. Minimum learner age: ${MINIMUM_AGE}.`;note.className='text-xs mt-2 text-gray-500 leading-5';return;}
      const result=birthDateFromSAId(id.value);
      if(result.error){dob.value='';note.textContent=result.error;note.className='text-xs mt-2 text-red-600 font-semibold leading-5';return;}
      dob.value=result.iso;
      note.textContent=result.checksum?`✓ ID date verified: ${result.iso} · Age ${result.age}`:`The ID date is valid, but the ID checksum appears incorrect. Please check the number before continuing.`;
      note.className=result.checksum?'text-xs mt-2 text-green-700 font-semibold leading-5':'text-xs mt-2 text-red-600 font-semibold leading-5';
    };
    id.addEventListener('input',validate);id.addEventListener('blur',validate);type?.addEventListener('change',validate);validate();
  }

  function injectPaymentUI(){
    const method=document.getElementById('paymentMethod');
    if(!method||document.getElementById('fundaPaymentPlan'))return;
    method.innerHTML='<option value="">Select payment method</option><option value="EFT / Bank Transfer">EFT / Bank Transfer</option><option value="Bank Deposit">Bank Deposit</option>';
    method.parentElement.classList.add('md:col-span-2');

    const ref=document.getElementById('paymentReference');
    if(ref){
      ref.required=true;
      const syncRefPlaceholder=()=>{ref.placeholder=document.getElementById('identityDocumentType')?.value==='passport'?'Use your passport / foreign ID number':'Use your South African ID number';};
      syncRefPlaceholder();
      document.getElementById('identityDocumentType')?.addEventListener('change',syncRefPlaceholder);
      ref.parentElement.classList.add('md:col-span-2');
    }

    const block=document.createElement('div');
    block.id='fundaPaymentPlan';block.className='md:col-span-2 space-y-4';
    block.innerHTML=`
      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p class="font-black text-[#03133d]">Payment rules</p>
        <p class="text-sm text-gray-700 leading-6 mt-2">Amounts below R1,000 must be paid in full. Amounts of R1,000 or more qualify for 2 instalments. Amounts of R2,000 or more on courses of at least 8 weeks qualify for 3 instalments. Where instalments are available, you may still choose to pay the full course fee upfront.</p>
        <p class="text-sm text-red-700 font-bold leading-6 mt-3">Important: The amount required by the system must be paid exactly. If full payment is required, the proof of payment must show the full required course amount. If an instalment option is selected, the proof must show the exact instalment amount due now. If Admissions &amp; Finance verifies that the amount paid does not match the required amount, the enrollment application will be rejected.</p>
      </div>
      <div id="bankDetailsBox" class="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p class="text-xs uppercase tracking-widest font-black text-blue-700">Official banking details</p>
        <p id="bankDetailsStatus" class="text-sm text-gray-700 leading-6 mt-2">Loading official Academy banking details…</p>
        <div id="bankDetailsRows" class="hidden mt-4 grid sm:grid-cols-2 gap-3 text-sm"></div>
        <p class="text-xs text-red-700 font-semibold mt-3">Only pay into banking details displayed on this official Academy page. Cash payments are not accepted.</p>
      </div>
`;
    method.closest('.grid').insertBefore(block,method.parentElement);

    const title=document.querySelector('h2.text-2xl.font-black.text-\\[\\#03133d\\].mt-1');
    const intro=[...document.querySelectorAll('p.text-sm.text-gray-500.mt-2.leading-6')].find(p=>p.textContent.includes('Submit proof that the course fee'));
    if(intro)intro.textContent='Choose an approved payment option, pay the amount due, then upload proof of payment. Your registration and payment will be reviewed by Admissions & Finance before course access is approved.';

    document.getElementById('paymentPlanChoice').addEventListener('change',updateScheduleDisplay);
    document.getElementById('idNumber')?.addEventListener('input',()=>{if(ref)ref.value=digits(document.getElementById('idNumber').value);});
    loadBankDetails();
  }

  async function loadBankDetails(){
    const status=document.getElementById('bankDetailsStatus'),rows=document.getElementById('bankDetailsRows');
    if(!status||!rows)return;
    try{
      const {data,error}=await supabaseClient.from('academy_payment_settings').select('id,bank_name,account_name,account_number,branch_code,account_type,payment_reference_instruction,is_active').eq('is_active',true).order('id');
      if(error)throw error;
      const banks=(data||[]).filter(bank=>bank.bank_name&&bank.account_number);
      if(!banks.length){status.textContent='Official banking details have not yet been published. Do not make a payment until the Academy banking details are shown here.';status.className='text-sm text-red-700 font-semibold leading-6 mt-2';return;}
      status.textContent=banks.length>1?'Choose either official Academy account below for EFT / bank transfer or bank deposit:':'Use the official Academy account below for EFT / bank transfer or bank deposit:';
      const safe=value=>String(value??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
      rows.className='mt-4 grid gap-4 text-sm';
      rows.innerHTML=banks.map(bank=>`<section class="rounded-2xl bg-white border border-blue-100 p-4"><div class="font-black text-[#03133d] text-base">${safe(bank.bank_name)}</div><div class="mt-3 grid sm:grid-cols-2 gap-3">${[['Account name',bank.account_name||'Funda Online Academy'],['Account number',bank.account_number],['Branch code',bank.branch_code],['Account type',bank.account_type]].filter(item=>item[1]).map(([key,value])=>`<div><span class="text-xs text-gray-500">${key}</span><div class="font-black text-[#03133d] mt-1">${safe(value)}</div></div>`).join('')}</div></section>`).join('')+`<section class="rounded-2xl border border-amber-200 bg-amber-50 p-4"><span class="text-xs uppercase tracking-widest font-black text-amber-700">Payment reference</span><div class="font-black text-[#03133d] mt-1">${safe(banks[0].payment_reference_instruction||'Use your South African ID number')}</div></section>`;
      rows.classList.remove('hidden');
    }catch(e){status.textContent='Banking details could not be loaded. Do not make payment until the official details are displayed.';status.className='text-sm text-red-700 font-semibold leading-6 mt-2';}
  }

  let combinedCheckout=null;
  let combinedProof=null;
  let checkoutPreparation=null;
  const selectedCourses=()=>window.FundaOnboardingCourseBrowser?.getSelectedCourses?.()||(selectedCourse?[selectedCourse]:[]);
  const isCombined=()=>selectedCourses().length>1;
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  function resetCheckout(){
    combinedCheckout=null;combinedProof=null;
    window.FundaOnboardingDraft?.setCheckoutId?.(null);
  }
  window.addEventListener('funda:course-selection-changed',resetCheckout);
  function validateCheckout(){
    if(!isCombined())return null;
    const ids=selectedCourses().map(course=>String(course.id)).sort();
    const quoted=(combinedCheckout?.items||[]).map(item=>String(item.course_id)).sort();
    if(!combinedCheckout||combinedCheckout.status!=='draft'||JSON.stringify(ids)!==JSON.stringify(quoted)){
      return 'Please return to Student Registration and confirm the combined course fees before payment.';
    }
    return null;
  }
  async function prepareCheckout(){
    if(!isCombined())return null;
    if(checkoutPreparation)return checkoutPreparation;
    checkoutPreparation=(async()=>{
      window.FundaCourseBenefits?.restoreFirstTime?.();
      if(!window.FundaCourseBenefits?.ready?.())throw Error('Please complete the Student Type checks for each selected course.');
      await window.FundaOnboardingDraft?.saveNow?.();
      const chosen=selectedCourses().map(course=>String(course.id));
      const claims={};
      for(const snapshot of window.FundaCourseBenefits.snapshots()){
        const claim=await window.FundaLegacy.saveSelection(snapshot);
        claims[String(snapshot.course.id)]=claim?.id||null;
      }
      const previousId=combinedCheckout?.id||window.FundaOnboardingDraft?.getCheckoutId?.()||null;
      const paymentChoice=document.getElementById('paymentPlanChoice');
      if(paymentChoice?.value)paymentChoice.dataset.pendingValue=paymentChoice.value;
      combinedCheckout=null;updatePaymentPlanUI();
      const {data,error}=await supabaseClient.rpc('prepare_course_checkout',{p_course_ids:chosen,p_claim_ids:claims,p_existing_checkout_id:previousId});
      if(error)throw Error(error.message||'Combined course fees could not be confirmed.');
      if(!data?.id||!Array.isArray(data.items))throw Error('Combined course fees could not be confirmed. Please try again.');
      if(JSON.stringify(chosen.slice().sort())!==JSON.stringify(selectedCourses().map(course=>String(course.id)).sort()))throw Error('Your course selection changed. Please confirm it before payment.');
      if(data.status==='submitted')throw Error('These course applications have already been submitted. Please use your dashboard to track them.');
      combinedCheckout=data;
      window.FundaOnboardingDraft?.setCheckoutId?.(data.id);
      updatePaymentPlanUI();renderSummary();
      return data;
    })().finally(()=>{checkoutPreparation=null;});
    return checkoutPreparation;
  }
  function currentPlan(){
    if(isCombined())return {fee:Number(combinedCheckout?.total_fee||0),installments:Number(combinedCheckout?.installment_count||1)};
    return paymentPlanFor(effectiveFee(),selectedCourse?.duration);
  }
  function renderCourseBreakdown(){
    let box=document.getElementById('combinedCourseFees');
    const field=document.getElementById('paymentPlanChoice')?.closest('div');
    if(!box&&field){box=document.createElement('div');box.id='combinedCourseFees';box.className='md:col-span-2 rounded-2xl border border-blue-100 bg-blue-50 p-5';field.before(box);}
    if(!box)return;
    box.hidden=!isCombined();
    if(!isCombined())return;
    if(!combinedCheckout){box.textContent='Your selected course fees must be confirmed before payment.';return;}
    box.innerHTML=`<h3 class="font-black text-[#03133d]">Selected courses</h3><ul class="mt-3 space-y-3 text-sm text-gray-700">${combinedCheckout.items.map(item=>`<li class="flex items-start justify-between gap-4"><span>${escape(item.title)}${Number(item.discount_percent)>0?`<span class="block mt-1 text-xs text-green-700">Previous-study benefit · ${escape(item.discount_percent)}% off</span>`:''}</span><strong class="shrink-0 text-[#03133d]">${money(item.fee)}</strong></li>`).join('')}</ul><div class="mt-4 flex items-center justify-between gap-4 border-t border-blue-200 pt-3 font-black text-[#03133d]"><span>Total course fees (${combinedCheckout.items.length} courses)</span><span>${money(combinedCheckout.total_fee)}</span></div>`;
  }
  function renderSummary(){
    if(!isCombined()||!combinedCheckout)return;
    const title=document.getElementById('summaryCourse'),duration=document.getElementById('summaryDuration'),price=document.getElementById('summaryPrice');
    if(title)title.textContent=combinedCheckout.items.map(item=>item.title).join(' + ');
    if(duration)duration.textContent=[...new Set(combinedCheckout.items.map(item=>item.duration||'Flexible'))].join(' / ');
    if(price)price.textContent=money(combinedCheckout.total_fee);
  }
  async function submitCombined(values,file){
    const error=validateCheckout();if(error)throw Error(error);
    const checkout=combinedCheckout;
    const currentAmount=()=>{
      const field=document.getElementById('amountPaidNow'),plan=currentPlan();
      return field?Number(field.value):document.getElementById('paymentPlanChoice').value==='full'?plan.fee:paymentParts(plan.fee,plan.installments)[0];
    };
    const selection={choice:document.getElementById('paymentPlanChoice').value,amount:currentAmount(),
      method:document.getElementById('paymentMethod').value,reference:document.getElementById('paymentReference').value.trim()};
    await updateStudent(values);
    if(!combinedProof||combinedProof.checkoutId!==checkout.id||combinedProof.file!==file){
      combinedProof={checkoutId:checkout.id,file,path:await uploadProofOfPayment(file,checkout.id)};
    }
    if(checkout!==combinedCheckout||JSON.stringify(checkout.items.map(item=>String(item.course_id)).sort())!==JSON.stringify(selectedCourses().map(course=>String(course.id)).sort())
      ||selection.choice!==document.getElementById('paymentPlanChoice').value||selection.amount!==currentAmount()
      ||selection.method!==document.getElementById('paymentMethod').value||selection.reference!==document.getElementById('paymentReference').value.trim()
      ||file!==document.getElementById('proofFile').files[0])throw Error('Your course selection or payment details changed. Please review them before submitting.');
    const {data,error:submissionError}=await supabaseClient.rpc('submit_course_checkout',{
      p_checkout_id:checkout.id,p_amount:selection.amount,p_payment_method:selection.method,
      p_payment_reference:selection.reference,p_proof_path:combinedProof.path,
      p_payment_option:selection.choice==='full'?'full_balance':'next_instalment'
    });
    if(submissionError)throw Error(submissionError.message||'The combined application could not be submitted. Please try again.');
    if(!data?.enrolment_ids?.length)throw Error('The application response could not be confirmed. Please try again.');
    const remaining=window.FundaOnboardingCourseBrowser.completeCourses(checkout.items.map(item=>item.course_id));
    showMessage(`Your ${checkout.items.length} selected course applications have been submitted. Your combined payment of ${money(data.amount_paid)} and proof of payment are awaiting verification by Admissions & Finance.`,true);
    submitButton.textContent='Application Submitted ✓';
    setTimeout(()=>{window.location.href=remaining?'onboarding.html?continue_selected=1':`dashboard.html?application=submitted&enrollment=${encodeURIComponent(data.enrolment_ids[0])}`;},1800);
  }

  function effectiveFee(){
    if(isCombined())return Number(combinedCheckout?.total_fee||0);
    const base=Number(selectedCourse?.price||0);
    try{
      const value=window.FundaLegacy?.getPayableAmount?.(selectedCourse);
      return Number.isFinite(Number(value))?Number(value):base;
    }catch(e){return base}
  }

  function updatePaymentPlanUI(){
    const select=document.getElementById('paymentPlanChoice');
    if(!select||!selectedCourse)return;
    renderCourseBreakdown();
    if(isCombined()&&!combinedCheckout){select.innerHTML='<option value="">Confirm combined course fees before payment</option>';const due=document.getElementById('minimumDueNow')||document.getElementById('amountDueNow');if(due)due.textContent='—';const amount=document.getElementById('amountPaidNow');if(amount)amount.value='';return;}
    const previous=select.dataset.pendingValue||select.value;
    const plan=currentPlan();
    const parts=paymentParts(plan.fee,plan.installments);
    select.innerHTML='<option value="">Select payment option</option><option value="full">Pay full course '+(isCombined()?'fees':'fee')+' — '+money(plan.fee)+'</option>';
    if(plan.installments>1)select.innerHTML+=`<option value="installments">Pay in ${plan.installments} instalments — first payment ${money(parts[0])}</option>`;
    select.value=isCombined()&&previous==='full'?'full':plan.installments>1?'installments':'full';
    delete select.dataset.pendingValue;
    updateScheduleDisplay();
  }

  function updateScheduleDisplay(){
    const select=document.getElementById('paymentPlanChoice'),schedule=document.getElementById('paymentSchedule'),minimum=document.getElementById('minimumDueNow')||document.getElementById('amountDueNow'),amount=document.getElementById('amountPaidNow');
    if(!select||!selectedCourse)return;
    const plan=currentPlan(),parts=paymentParts(plan.fee,plan.installments);
    const full=select.value==='full'||plan.installments===1;
    const due=full?plan.fee:parts[0];
    if(minimum)minimum.textContent=money(due);
    if(amount){amount.readOnly=true;amount.setAttribute('aria-readonly','true');amount.value=due.toFixed(2);}
    if(schedule)schedule.innerHTML=full?`Full payment of <strong>${money(plan.fee)}</strong>${isCombined()?` for all ${selectedCourses().length} selected courses`:""} is due now.`:`Your ${isCombined()?"selected courses qualify":"course qualifies"} for <strong>${plan.installments} instalments</strong>: ${parts.map((p,i)=>`Payment ${i+1}: ${money(p)}`).join(' · ')}. The first instalment is required with this application.`;
  }

  function extraValidation(){
    const checkoutError=validateCheckout();if(checkoutError)return checkoutError;
    const identityType=document.getElementById('identityDocumentType')?.value||'south_african_id';
    const dob=document.getElementById('dateOfBirth')?.value;
    if(identityType==='south_african_id'){
      const id=digits(document.getElementById('idNumber')?.value);
      const identity=birthDateFromSAId(id);
      if(identity.error)return identity.error;
      if(!identity.checksum)return 'The South African ID number appears to be incorrect. Please check all 13 digits.';
      if(dob!==identity.iso)return 'Date of birth must correspond with the South African ID number.';
    }else{
      const passport=String(document.getElementById('passportNumber')?.value||'').trim();
      if(passport.length<4)return 'Please enter a valid passport or foreign ID number.';
      if(!dob)return 'Please enter the date of birth shown on the passport or foreign identity document.';
    }
    const bankText=document.getElementById('bankDetailsStatus')?.textContent||'';
    if(/not yet been published|could not be loaded/i.test(bankText))return 'Official Academy banking details are not available yet. Please do not submit a payment until the banking details are displayed.';
    const method=document.getElementById('paymentMethod')?.value;
    if(!['EFT / Bank Transfer','Bank Deposit'].includes(method))return 'Please select EFT / Bank Transfer or Bank Deposit.';
    const choice=document.getElementById('paymentPlanChoice')?.value;
    if(!choice)return 'Please select a payment option.';
    const plan=currentPlan(),parts=paymentParts(plan.fee,plan.installments),required=choice==='full'?plan.fee:parts[0];
    const amountField=document.getElementById('amountPaidNow');
    const paid=amountField?Number(amountField.value||0):required;
    if(!Number.isFinite(paid)||paid<=0)return 'Please enter the amount you paid.';
    if(Math.round(paid*100)!==Math.round(required*100))return choice==='full'?`Full payment must be exactly ${money(required)}.`:`The required first instalment is exactly ${money(required)}. Choose full payment if you want to settle the entire course fee now.`;
    const ref=document.getElementById('paymentReference')?.value.trim();
    if(!ref)return 'Payment reference is required so Finance can match your payment.';
    return null;
  }

  async function enhancedSubmit(event){
    event.preventDefault();event.stopImmediatePropagation();
    hideMessage();
    if(!selectedCourse){showMessage('Please select a course first.');return;}
    const values=getFormValues(),file=document.getElementById('proofFile').files[0];
    const baseError=validateApplication(values,file),moreError=baseError||extraValidation();
    if(moreError){showMessage(moreError);return;}
    const submittedCourse=selectedCourse;
    submitButton.disabled=true;submitButton.textContent='Submitting application...';
    try{
      if(isCombined()){await submitCombined(values,file);return;}
      await updateStudent(values);
      const enrollment=await ensureEnrollment();
      const legacyClaim=await window.FundaLegacy?.saveClaim?.(enrollment.id)||null;
      const proofPath=await uploadProofOfPayment(file,enrollment.id);
      const submittedAt=new Date().toISOString();
      const paymentMethod=document.getElementById('paymentMethod').value;
      const paymentReference=document.getElementById('paymentReference').value.trim();
      const planChoice=document.getElementById('paymentPlanChoice').value;
      const plan=currentPlan();
      const parts=paymentParts(plan.fee,plan.installments);
      const amountField=document.getElementById('amountPaidNow');
      const amountPaid=amountField?Number(amountField.value):(planChoice==='full'||plan.installments===1?plan.fee:parts[0]);
      const {error:enrollmentError}=await supabaseClient.from('enrollments').update({
        amount:plan.fee,
        ...(window.FundaLegacy?.getEnrollmentFields?.(legacyClaim)||{}),
        enrollment_status:'pending',status:'pending',proof_url:proofPath,submitted_at:submittedAt,
        approval_department:'Admissions & Finance',review_notes:null,rejection_reason:null
      }).eq('id',enrollment.id);
      if(enrollmentError)throw new Error('Unable to submit your enrollment application: '+enrollmentError.message);
      const {error:paymentError}=await supabaseClient.rpc('submit_student_payment',{
        p_enrolment_id:enrollment.id,
        p_amount:amountPaid,
        p_payment_method:paymentMethod,
        p_payment_reference:paymentReference,
        p_proof_path:proofPath,
        p_payment_option:planChoice==='full'?'full_balance':'next_instalment',
        p_submission_source:'registration'
      });
      if(paymentError)throw new Error('Your application was saved, but the payment record could not be created: '+paymentError.message);
      const remaining=window.FundaOnboardingCourseBrowser?.completeCourse?.(submittedCourse.id)||0;
      showMessage(`Your enrollment for ${submittedCourse.title} has been submitted successfully. Your payment of ${money(amountPaid)} is awaiting verification by Admissions & Finance.${remaining?` ${remaining} selected course${remaining===1?"":"s"} remain. Continue with the next application from your saved selection.`:""}`,true);
      submitButton.textContent='Application Submitted ✓';
      setTimeout(()=>{window.location.href=remaining?'onboarding.html?continue_selected=1':`dashboard.html?application=submitted&enrollment=${encodeURIComponent(enrollment.id)}`;},1800);
    }catch(error){console.error('Enhanced enrollment submission error:',error);showMessage(error.message||'We could not complete your enrollment application.');submitButton.disabled=false;submitButton.textContent='Submit Enrollment Application';}
  }

  window.FundaPaymentIntegrity={
    refresh:updatePaymentPlanUI,
    effectiveFee,prepareCheckout,validateCheckout,renderSummary
  };

  function boot(){
    ensureCourseBrowser();
    ensureIdentityUI();injectPaymentUI();
    const originalOpen=window.openDetailsStep||openDetailsStep;
    if(typeof originalOpen==='function'){
      const wrapped=async function(){await originalOpen();setTimeout(updatePaymentPlanUI,0);};
      try{openDetailsStep=wrapped;}catch(e){}
      const btn=document.getElementById('continueButton');
      if(btn){btn.addEventListener('click',()=>setTimeout(updatePaymentPlanUI,40));}
    }
    const submit=document.getElementById('submitApplication');
    if(submit)submit.addEventListener('click',enhancedSubmit,true);
    document.getElementById('idNumber')?.addEventListener('input',()=>{if(document.getElementById('identityDocumentType')?.value!=='south_african_id')return;const r=document.getElementById('paymentReference');if(r)r.value=digits(document.getElementById('idNumber').value);});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();
