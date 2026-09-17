(()=>{
  if(window.__fundaOnboardingRegistrationFlow)return;
  window.__fundaOnboardingRegistrationFlow=true;

  const byId=id=>document.getElementById(id);
  let activeCourseId=null;

  function normaliseStudentTypeCopy(){
    const panel=byId('legacyStudentPanel');
    const target=byId('studentTypeContent');
    if(panel&&target&&panel.parentElement!==target)target.appendChild(panel);
    if(!panel)return;

    const heading=panel.querySelector('h2');
    if(heading)heading.textContent='Are you a first-time Funda Online Academy student?';
    const intro=panel.querySelector('p.text-sm.text-gray-500');
    if(intro)intro.textContent="Choose the option that applies to the course you selected. Previous-study benefits are verified against Funda Online Academy's historical records before course access is approved.";

    const copy={
      first_time:['First-time Funda Online Academy student','I have never studied with Funda Online Academy before. Standard current price.'],
      legacy_completed:['I completed this course before','Legacy upgrade: 70% off after certificate verification. Old Funda Online Academy certificate required. Final approval follows after payment.'],
      legacy_incomplete:['I paid for this course but did not complete it','Restart benefit: 50% off after evidence verification. Old Funda Online Academy proof of payment required. Final approval follows after payment.'],
      returning_student:['I studied with Funda Online Academy before, but this is a different course','Returning student benefit: 25% off after previous-study verification. Final approval follows after payment.']
    };

    Object.entries(copy).forEach(([value,text])=>{
      const input=panel.querySelector(`input[name="legacyType"][value="${value}"]`);
      const label=input?.closest('label');
      if(!label)return;
      const bold=label.querySelector('b');
      const detail=label.querySelector('span');
      if(bold)bold.textContent=text[0];
      if(detail)detail.textContent=text[1];
      if(!input.dataset.brandCopy){
        input.dataset.brandCopy='1';
        input.addEventListener('change',()=>setTimeout(normaliseStudentTypeCopy,0));
      }
    });

    const legacyId=byId('legacyId');
    const idLabel=legacyId?.closest('div')?.querySelector('label');
    if(idLabel)idLabel.textContent='ID number used with your previous Funda Online Academy record *';

    const evidenceLabel=byId('legacyEvidenceLabel');
    const selectedType=panel.querySelector('input[name="legacyType"]:checked')?.value;
    if(evidenceLabel){
      if(selectedType==='legacy_completed')evidenceLabel.textContent='Upload your old Funda Online Academy certificate *';
      else if(selectedType==='legacy_incomplete')evidenceLabel.textContent='Upload your old Funda Online Academy proof of payment *';
      else if(selectedType==='returning_student')evidenceLabel.textContent='Upload proof that you studied with Funda Online Academy before *';
      else evidenceLabel.textContent='Previous Funda Online Academy evidence *';
    }

    const check=byId('legacyCheck');
    if(check&&selectedType!=='legacy_completed')check.textContent='Check my previous Funda Online Academy record';
  }

  function setHeader(step,title,message){
    const stepLabel=byId('stepLabel');
    const pageTitle=byId('pageTitle');
    const welcome=byId('welcomeMessage');
    if(stepLabel)stepLabel.textContent=step;
    if(pageTitle)pageTitle.textContent=title;
    if(welcome)welcome.textContent=message;
  }

  function scrollTop(){
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function hideAllFlowSteps(){
    ['courseStep','studentTypeStep','detailsStep','paymentStep','reviewStep']
      .forEach(id=>byId(id)?.classList.add('hidden-section'));
  }

  function showCourseStep(){
    hideMessage?.();
    hideAllFlowSteps();
    byId('courseStep')?.classList.remove('hidden-section');
    setHeader(
      'STEP 1 OF 5 • CHOOSE YOUR COURSE',
      'Choose Your Course',
      `Welcome, ${currentProfile?.full_name||'Student'}. Choose the course you would like to study.`
    );
    scrollTop();
  }

  function buildStudentTypeStep(){
    if(byId('studentTypeStep'))return;
    const details=byId('detailsStep');
    if(!details)return;

    const section=document.createElement('section');
    section.id='studentTypeStep';
    section.className='hidden-section mt-8';
    section.innerHTML=`
      <div class="max-w-4xl mx-auto space-y-6">
        <div id="studentTypeContent"></div>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button id="studentTypeBack" type="button" class="rounded-xl border border-white/25 px-6 py-3.5 font-bold text-white hover:bg-white/10">← Back to Course Selection</button>
          <button id="studentTypeContinue" type="button" class="rounded-xl bg-[#2563eb] px-7 py-3.5 font-extrabold text-white hover:bg-[#1d4ed8]">Continue →</button>
        </div>
      </div>`;
    details.parentNode.insertBefore(section,details);
    const existingPanel=byId('legacyStudentPanel');
    if(existingPanel)byId('studentTypeContent')?.appendChild(existingPanel);
  }

  function buildRegistrationPaymentAndReviewSteps(){
    const details=byId('detailsStep');
    if(!details||byId('paymentStep')||byId('reviewStep'))return;

    const grid=details.querySelector('.grid.lg\\:grid-cols-3');
    const left=grid?.querySelector('.lg\\:col-span-2');
    const aside=grid?.querySelector('aside');
    const proof=byId('proofFile');
    const paymentCard=proof?.closest('.bg-white.rounded-3xl.shadow-xl');
    const declaration=byId('declaration')?.closest('.bg-white.rounded-3xl');
    if(!grid||!left||!aside||!paymentCard||!declaration)return;

    grid.className='max-w-4xl mx-auto';
    left.className='space-y-6';
    aside.remove();
    paymentCard.remove();
    declaration.remove();

    const registrationNav=document.createElement('div');
    registrationNav.id='registrationNavigation';
    registrationNav.className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between';
    registrationNav.innerHTML=`
      <button id="registrationBack" type="button" class="rounded-xl border border-white/25 px-6 py-3.5 font-bold text-white hover:bg-white/10">← Back to Student Type</button>
      <button id="registrationContinue" type="button" class="rounded-xl bg-[#2563eb] px-7 py-3.5 font-extrabold text-white hover:bg-[#1d4ed8]">Continue to Payment →</button>`;
    details.appendChild(registrationNav);

    const payment=document.createElement('section');
    payment.id='paymentStep';
    payment.className='hidden-section mt-8';
    payment.innerHTML=`
      <div class="max-w-4xl mx-auto space-y-6">
        <div id="paymentContent" class="space-y-6"></div>
        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button id="paymentBack" type="button" class="rounded-xl border border-white/25 px-6 py-3.5 font-bold text-white hover:bg-white/10">← Back to Student Registration</button>
          <button id="paymentContinue" type="button" class="rounded-xl bg-[#2563eb] px-7 py-3.5 font-extrabold text-white hover:bg-[#1d4ed8]">Continue to Declaration →</button>
        </div>
      </div>`;
    details.parentNode.insertBefore(payment,details.nextSibling);
    byId('paymentContent')?.appendChild(paymentCard);

    const review=document.createElement('section');
    review.id='reviewStep';
    review.className='hidden-section mt-8';
    review.innerHTML=`
      <div class="grid lg:grid-cols-3 gap-7">
        <div id="reviewLeft" class="lg:col-span-2 space-y-6">
          <div class="rounded-3xl border border-white/10 bg-white/10 p-5 sm:p-6 text-white">
            <p class="text-xs font-black uppercase tracking-widest text-[#f6c453]">Final Review</p>
            <h2 class="mt-1 text-2xl font-black">Review and declare before submitting</h2>
            <p class="mt-2 text-sm leading-6 text-blue-100">Check your selected course and application summary. Every declaration and acceptance below is compulsory before your enrollment application can be submitted.</p>
          </div>
        </div>
      </div>`;
    payment.parentNode.insertBefore(review,payment.nextSibling);
    byId('reviewLeft')?.appendChild(declaration);
    review.querySelector('.grid')?.appendChild(aside);

    const declarationInput=byId('declaration');
    if(declarationInput)declarationInput.required=true;

    const back=byId('backButton');
    if(back)back.textContent='← Back to Payment';
  }

  async function startStudentType(){
    if(!selectedCourse){
      showMessage?.('Please select a course first.');
      return;
    }

    hideMessage?.();
    try{
      existingEnrollment=await getExistingEnrollment();
      if(existingEnrollment?.submitted_at){
        showMessage?.('You have already submitted an application for this course. Please use your dashboard to track the application status.');
        return;
      }

      const courseId=String(selectedCourse.id);
      if(activeCourseId!==courseId){
        activeCourseId=courseId;
        window.FundaLegacy?.onCourseOpened?.();
      }else{
        window.FundaLegacy?.ensurePanel?.();
      }
      normaliseStudentTypeCopy();

      byId('summaryCourse').textContent=selectedCourse.title;
      byId('summaryDuration').textContent=selectedCourse.duration||'Flexible';
      byId('summaryPrice').textContent=formatMoney(effectiveCoursePrice());

      hideAllFlowSteps();
      byId('studentTypeStep')?.classList.remove('hidden-section');
      setHeader(
        'STEP 2 OF 5 • STUDENT TYPE',
        'Student Type',
        `You selected ${selectedCourse.title}. Tell us whether you are a first-time or returning Funda Online Academy student.`
      );
      scrollTop();
    }catch(error){
      console.error('Student type step error:',error);
      showMessage?.(error.message||'Unable to continue.');
    }
  }

  function continueFromStudentType(){
    hideMessage?.();
    window.FundaLegacy?.ensurePanel?.();
    normaliseStudentTypeCopy();
    const error=window.FundaLegacy?.validate?.();
    if(error){
      showMessage?.(error);
      return;
    }

    hideAllFlowSteps();
    byId('detailsStep')?.classList.remove('hidden-section');
    setHeader(
      'STEP 3 OF 5 • STUDENT REGISTRATION',
      'Complete Your Details',
      'Complete your student registration details, then continue to payment.'
    );
    scrollTop();
  }

  function validateRegistrationDetails(){
    let values;
    try{
      values=getFormValues();
    }catch(error){
      return error?.message||'Please complete the required registration details.';
    }

    const requiredFields=[
      ['Full name',values.full_name],
      ['Gender',values.gender],
      ['Identification type',values.identity_document_type],
      ['Date of birth',values.date_of_birth],
      ['Nationality',values.nationality],
      ['Mobile / WhatsApp',values.mobile_whatsapp],
      ['Residential address',values.address],
      ['City / Town',values.city],
      ['Province',values.province],
      ['Where did you hear about us',values.where_heard_about_us]
    ];
    const missing=requiredFields.find(field=>!field[1]);
    if(missing)return `${missing[0]} is required.`;

    if(values.identity_document_type==='south_african_id'){
      if(!/^\d{13}$/.test(values.south_african_id||'')){
        return 'Please enter a valid 13-digit South African ID number.';
      }
      if(typeof isValidSouthAfricanId==='function'&&!isValidSouthAfricanId(values.south_african_id)){
        return 'This South African ID number is not valid. Please check all 13 digits.';
      }
      if(typeof birthDateFromSouthAfricanId==='function'){
        const expectedDob=birthDateFromSouthAfricanId(values.south_african_id);
        if(!expectedDob||values.date_of_birth!==expectedDob){
          return 'Date of birth could not be confirmed from the South African ID number. Please check the ID number.';
        }
      }
    }else if(!values.passport_number||values.passport_number.length<4){
      return 'Please enter a valid passport or foreign ID number.';
    }

    return null;
  }

  function continueToPayment(){
    hideMessage?.();
    const error=validateRegistrationDetails();
    if(error){
      showMessage?.(error);
      return;
    }

    hideAllFlowSteps();
    byId('paymentStep')?.classList.remove('hidden-section');
    setHeader(
      'STEP 4 OF 5 • PAYMENT',
      'Payment',
      'Complete your payment information and upload your proof of payment, then continue to the final declaration.'
    );
    try{window.FundaPaymentIntegrity?.refresh?.();}catch(_){}
    scrollTop();
  }

  function validatePaymentDetails(){
    const legacyError=window.FundaLegacy?.validate?.();
    if(legacyError)return legacyError;

    const method=byId('paymentMethod')?.value;
    if(!method)return 'Please select a payment method.';

    const reference=String(byId('paymentReference')?.value||'').trim();
    if(reference.length<2)return 'Please enter the payment reference used at the bank.';

    const file=byId('proofFile')?.files?.[0];
    if(!file)return 'Please upload your proof of payment.';

    const allowedTypes=['image/png','image/jpeg','application/pdf'];
    if(!allowedTypes.includes(file.type)){
      return 'Proof of payment must be a PDF, JPG or PNG file.';
    }
    if(file.size>5*1024*1024){
      return 'Proof of payment must be 5 MB or smaller.';
    }
    return null;
  }

  function continueToReview(){
    hideMessage?.();
    const registrationError=validateRegistrationDetails();
    if(registrationError){
      showMessage?.(registrationError);
      return;
    }
    const paymentError=validatePaymentDetails();
    if(paymentError){
      showMessage?.(paymentError);
      return;
    }

    byId('summaryCourse').textContent=selectedCourse?.title||'—';
    byId('summaryDuration').textContent=selectedCourse?.duration||'Flexible';
    byId('summaryPrice').textContent=formatMoney(effectiveCoursePrice());

    hideAllFlowSteps();
    byId('reviewStep')?.classList.remove('hidden-section');
    setHeader(
      'STEP 5 OF 5 • REVIEW & DECLARATION',
      'Review & Declaration',
      'Review your course summary, accept every compulsory declaration, then submit your enrollment application.'
    );
    scrollTop();
  }

  function backToStudentType(){
    hideMessage?.();
    hideAllFlowSteps();
    byId('studentTypeStep')?.classList.remove('hidden-section');
    setHeader(
      'STEP 2 OF 5 • STUDENT TYPE',
      'Student Type',
      `You selected ${selectedCourse?.title||'your course'}. Tell us whether you are a first-time or returning Funda Online Academy student.`
    );
    scrollTop();
  }

  function backToRegistration(){
    hideMessage?.();
    hideAllFlowSteps();
    byId('detailsStep')?.classList.remove('hidden-section');
    setHeader(
      'STEP 3 OF 5 • STUDENT REGISTRATION',
      'Complete Your Details',
      'Complete your student registration details, then continue to payment.'
    );
    scrollTop();
  }

  function backToPayment(){
    hideMessage?.();
    hideAllFlowSteps();
    byId('paymentStep')?.classList.remove('hidden-section');
    setHeader(
      'STEP 4 OF 5 • PAYMENT',
      'Payment',
      'Complete your payment information and upload your proof of payment, then continue to the final declaration.'
    );
    try{window.FundaPaymentIntegrity?.refresh?.();}catch(_){}
    scrollTop();
  }

  function wireFlow(){
    buildStudentTypeStep();
    buildRegistrationPaymentAndReviewSteps();

    const courseContinue=byId('continueButton');
    if(courseContinue){
      courseContinue.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        startStudentType();
      },true);
    }

    byId('studentTypeBack')?.addEventListener('click',showCourseStep);
    byId('studentTypeContinue')?.addEventListener('click',continueFromStudentType);
    byId('registrationBack')?.addEventListener('click',backToStudentType);
    byId('registrationContinue')?.addEventListener('click',continueToPayment);
    byId('paymentBack')?.addEventListener('click',backToRegistration);
    byId('paymentContinue')?.addEventListener('click',continueToReview);

    const back=byId('backButton');
    if(back){
      back.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        backToPayment();
      },true);
    }

    setHeader(
      'STEP 1 OF 5 • CHOOSE YOUR COURSE',
      'Choose Your Course',
      byId('welcomeMessage')?.textContent||'Choose the course you would like to study.'
    );
    normaliseStudentTypeCopy();
  }

  wireFlow();
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(normaliseStudentTypeCopy,0),{once:true});
  }else{
    setTimeout(normaliseStudentTypeCopy,0);
  }
})();
