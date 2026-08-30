(()=>{
  if(window.__fundaOnboardingIntegrityPayments)return;
  window.__fundaOnboardingIntegrityPayments=true;

  const MINIMUM_AGE=16;
  const FULL_PAYMENT_THRESHOLD=2000;
  const money=n=>Number(n||0).toLocaleString('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:2});
  const digits=v=>String(v||'').replace(/\D/g,'');

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
    if(fee<FULL_PAYMENT_THRESHOLD||weeks<=4)return {installments:1,weeks,fee};
    return {installments:Math.min(3,Math.max(2,Math.ceil(weeks/4))),weeks,fee};
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
    const id=document.getElementById('idNumber'),dob=document.getElementById('dateOfBirth');
    if(!id||!dob)return;
    dob.required=true;
    dob.readOnly=true;
    dob.setAttribute('aria-readonly','true');
    dob.classList.add('bg-gray-50','text-gray-700');
    dob.removeAttribute('max');
    const note=document.createElement('p');
    note.id='dobIntegrityNote';note.className='text-xs mt-2 text-gray-500 leading-5';
    note.textContent=`Date of birth is read automatically from the South African ID number. Minimum learner age: ${MINIMUM_AGE}.`;
    dob.parentElement.appendChild(note);
    const validate=()=>{
      id.value=digits(id.value).slice(0,13);
      const note=document.getElementById('dobIntegrityNote');
      if(id.value.length<13){dob.value='';note.textContent=`Date of birth is read automatically from the South African ID number. Minimum learner age: ${MINIMUM_AGE}.`;note.className='text-xs mt-2 text-gray-500 leading-5';return;}
      const result=birthDateFromSAId(id.value);
      if(result.error){dob.value='';note.textContent=result.error;note.className='text-xs mt-2 text-red-600 font-semibold leading-5';return;}
      dob.value=result.iso;
      note.textContent=result.checksum?`✓ ID date verified: ${result.iso} · Age ${result.age}`:`The ID date is valid, but the ID checksum appears incorrect. Please check the number before continuing.`;
      note.className=result.checksum?'text-xs mt-2 text-green-700 font-semibold leading-5':'text-xs mt-2 text-red-600 font-semibold leading-5';
    };
    id.addEventListener('input',validate);id.addEventListener('blur',validate);validate();
  }

  function injectPaymentUI(){
    const method=document.getElementById('paymentMethod');
    if(!method||document.getElementById('fundaPaymentPlan'))return;
    method.innerHTML='<option value="">Select payment method</option><option value="EFT / Bank Transfer">EFT / Bank Transfer</option><option value="Bank Deposit">Bank Deposit</option>';
    method.parentElement.classList.add('md:col-span-2');

    const ref=document.getElementById('paymentReference');
    if(ref){ref.required=true;ref.placeholder='Use your South African ID number';ref.parentElement.classList.add('md:col-span-2');}

    const block=document.createElement('div');
    block.id='fundaPaymentPlan';block.className='md:col-span-2 space-y-4';
    block.innerHTML=`
      <div class="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <p class="font-black text-[#03133d]">Payment rules</p>
        <p class="text-sm text-gray-700 leading-6 mt-2">Courses below R2,000 must be paid in full. Courses of R2,000 or more may qualify for instalments when the course runs for more than 4 weeks. The number of instalments is based on the course duration and is capped at 3.</p>
      </div>
      <div id="bankDetailsBox" class="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p class="text-xs uppercase tracking-widest font-black text-blue-700">Official banking details</p>
        <p id="bankDetailsStatus" class="text-sm text-gray-700 leading-6 mt-2">Loading official Academy banking details…</p>
        <div id="bankDetailsRows" class="hidden mt-4 grid sm:grid-cols-2 gap-3 text-sm"></div>
        <p class="text-xs text-red-700 font-semibold mt-3">Only pay into banking details displayed on this official Academy page. Cash payments are not accepted.</p>
      </div>
      <div class="rounded-2xl border border-gray-200 p-5">
        <label for="paymentPlanChoice" class="block text-sm font-bold text-gray-700 mb-2">Payment Option *</label>
        <select id="paymentPlanChoice" class="w-full rounded-xl border border-gray-200 px-4 py-3 bg-white" required></select>
        <div id="paymentSchedule" class="mt-3 text-sm text-gray-600 leading-6"></div>
      </div>
      <div class="grid md:grid-cols-2 gap-5">
        <div><label for="amountPaidNow" class="block text-sm font-bold text-gray-700 mb-2">Amount Paid Now *</label><input id="amountPaidNow" type="number" min="0" step="0.01" required class="w-full rounded-xl border border-gray-200 px-4 py-3" placeholder="0.00"></div>
        <div><label class="block text-sm font-bold text-gray-700 mb-2">Minimum Due Now</label><div id="minimumDueNow" class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 font-black text-[#03133d]">—</div></div>
      </div>`;
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
      const {data,error}=await supabaseClient.from('academy_payment_settings').select('bank_name,account_name,account_number,branch_code,account_type,payment_reference_instruction,is_active').eq('is_active',true).maybeSingle();
      if(error)throw error;
      if(!data||!data.bank_name||!data.account_number){status.textContent='Official banking details have not yet been published. Do not make a payment until the Academy banking details are shown here.';status.className='text-sm text-red-700 font-semibold leading-6 mt-2';return;}
      status.textContent='Use the banking details below for EFT / bank transfer or bank deposit:';
      const items=[['Bank',data.bank_name],['Account name',data.account_name],['Account number',data.account_number],['Branch code',data.branch_code],['Account type',data.account_type],['Reference',data.payment_reference_instruction||'Use your South African ID number']].filter(x=>x[1]);
      rows.innerHTML=items.map(([k,v])=>`<div class="rounded-xl bg-white border border-blue-100 p-3"><span class="text-xs text-gray-500">${k}</span><div class="font-black text-[#03133d] mt-1">${String(v).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}</div></div>`).join('');
      rows.classList.remove('hidden');
    }catch(e){status.textContent='Banking details could not be loaded. Do not make payment until the official details are displayed.';status.className='text-sm text-red-700 font-semibold leading-6 mt-2';}
  }

  function updatePaymentPlanUI(){
    const select=document.getElementById('paymentPlanChoice');
    if(!select||!selectedCourse)return;
    const plan=paymentPlanFor(selectedCourse.price,selectedCourse.duration);
    const parts=paymentParts(plan.fee,plan.installments);
    select.innerHTML='<option value="">Select payment option</option><option value="full">Pay full course fee — '+money(plan.fee)+'</option>';
    if(plan.installments>1)select.innerHTML+=`<option value="installments">Pay in ${plan.installments} instalments — first payment ${money(parts[0])}</option>`;
    select.value=plan.installments>1?'installments':'full';
    updateScheduleDisplay();
  }

  function updateScheduleDisplay(){
    const select=document.getElementById('paymentPlanChoice'),schedule=document.getElementById('paymentSchedule'),minimum=document.getElementById('minimumDueNow'),amount=document.getElementById('amountPaidNow');
    if(!select||!selectedCourse)return;
    const plan=paymentPlanFor(selectedCourse.price,selectedCourse.duration),parts=paymentParts(plan.fee,plan.installments);
    const full=select.value==='full'||plan.installments===1;
    const due=full?plan.fee:parts[0];
    minimum.textContent=money(due);
    if(amount&&!amount.value)amount.value=due.toFixed(2);
    schedule.innerHTML=full?`Full payment of <strong>${money(plan.fee)}</strong> is due now.`:`Your course qualifies for <strong>${plan.installments} instalments</strong>: ${parts.map((p,i)=>`Payment ${i+1}: ${money(p)}`).join(' · ')}. The first instalment is required with this application.`;
  }

  function extraValidation(){
    const id=digits(document.getElementById('idNumber')?.value),dob=document.getElementById('dateOfBirth')?.value;
    const identity=birthDateFromSAId(id);
    if(identity.error)return identity.error;
    if(!identity.checksum)return 'The South African ID number appears to be incorrect. Please check all 13 digits.';
    if(dob!==identity.iso)return 'Date of birth must correspond with the South African ID number.';
    const bankText=document.getElementById('bankDetailsStatus')?.textContent||'';
    if(/not yet been published|could not be loaded/i.test(bankText))return 'Official Academy banking details are not available yet. Please do not submit a payment until the banking details are displayed.';
    const method=document.getElementById('paymentMethod')?.value;
    if(!['EFT / Bank Transfer','Bank Deposit'].includes(method))return 'Please select EFT / Bank Transfer or Bank Deposit.';
    const choice=document.getElementById('paymentPlanChoice')?.value;
    if(!choice)return 'Please select a payment option.';
    const plan=paymentPlanFor(selectedCourse.price,selectedCourse.duration),parts=paymentParts(plan.fee,plan.installments),required=choice==='full'?plan.fee:parts[0];
    const paid=Number(document.getElementById('amountPaidNow')?.value||0);
    if(!Number.isFinite(paid)||paid<=0)return 'Please enter the amount you paid.';
    if(paid+0.009<required)return `The minimum amount due now is ${money(required)}.`;
    if(paid>plan.fee+0.009)return 'The amount paid cannot be more than the course fee.';
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
    submitButton.disabled=true;submitButton.textContent='Submitting application...';
    try{
      await updateStudent(values);
      const enrollment=await ensureEnrollment();
      const proofPath=await uploadProofOfPayment(file,enrollment.id);
      const submittedAt=new Date().toISOString();
      const paymentMethod=document.getElementById('paymentMethod').value;
      const paymentReference=document.getElementById('paymentReference').value.trim();
      const amountPaid=Number(document.getElementById('amountPaidNow').value);
      const planChoice=document.getElementById('paymentPlanChoice').value;
      const plan=paymentPlanFor(selectedCourse.price,selectedCourse.duration);
      const parts=paymentParts(plan.fee,plan.installments);
      const note=`Payment reference: ${paymentReference}; Payment option: ${planChoice==='full'?'Full payment':plan.installments+' instalments'}; Amount paid now: ${money(amountPaid)}; Course fee: ${money(plan.fee)}; Schedule: ${parts.map((p,i)=>`#${i+1} ${money(p)}`).join(', ')}`;
      const {error:enrollmentError}=await supabaseClient.from('enrollments').update({amount:Number(selectedCourse.price||0),enrollment_status:'pending',status:'pending',proof_url:proofPath,submitted_at:submittedAt,approval_department:'Admissions & Finance',review_notes:null,rejection_reason:null}).eq('id',enrollment.id);
      if(enrollmentError)throw new Error('Unable to submit your enrollment application: '+enrollmentError.message);
      const {error:paymentError}=await supabaseClient.from('payments').insert({student_id:currentStudent.id,enrolment_id:enrollment.id,amount:amountPaid,payment_method:paymentMethod,status:'submitted',proof_url:proofPath,submitted_at:submittedAt,notes:note});
      if(paymentError)throw new Error('Your application was saved, but the payment record could not be created: '+paymentError.message);
      showMessage(`Your enrollment for ${selectedCourse.title} has been submitted successfully. Your payment of ${money(amountPaid)} is awaiting verification by Admissions & Finance.`,true);
      submitButton.textContent='Application Submitted ✓';
      setTimeout(()=>{window.location.href=`dashboard.html?application=submitted&enrollment=${encodeURIComponent(enrollment.id)}`;},1800);
    }catch(error){console.error('Enhanced enrollment submission error:',error);showMessage(error.message||'We could not complete your enrollment application.');submitButton.disabled=false;submitButton.textContent='Submit Enrollment Application';}
  }

  function boot(){
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
    document.getElementById('idNumber')?.addEventListener('input',()=>{const r=document.getElementById('paymentReference');if(r)r.value=digits(document.getElementById('idNumber').value);});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0),{once:true});else setTimeout(boot,0);
})();