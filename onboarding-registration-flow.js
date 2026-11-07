(()=>{
  if(window.__fundaOnboardingRegistrationFlow)return;
  window.__fundaOnboardingRegistrationFlow=true;

  const byId=id=>document.getElementById(id);
  let activeCourseId=null;
  const courseBenefits=new Map();
  const chosenCourses=()=>window.FundaOnboardingCourseBrowser?.getSelectedCourses?.()||(selectedCourse?[selectedCourse]:[]);
  function restoreFirstTimeBenefits(){
    if(courseBenefits.size)return;
    const snapshot=window.FundaLegacy?.captureSelection?.();
    if(snapshot?.type!=='first_time')return;
    chosenCourses().forEach(course=>courseBenefits.set(String(course.id),{...snapshot,course:{id:course.id,title:course.title,price:course.price}}));
  }
  window.FundaCourseBenefits={
    snapshots:()=>chosenCourses().map(course=>courseBenefits.get(String(course.id))).filter(Boolean),
    ready:()=>chosenCourses().length<2||chosenCourses().every(course=>courseBenefits.has(String(course.id))),
    needsEvidence:()=>[...courseBenefits.values()].some(item=>item.type!=='first_time'),
    restoreFirstTime:restoreFirstTimeBenefits
  };
  window.addEventListener('funda:course-selection-changed',()=>courseBenefits.clear());
  const AMBASSADOR_SOURCE='Influencer / Brand Ambassador';
  let ambassadorOptions=[];
  let ambassadorLinked=null;
  let ambassadorLoaded=false;
  let ambassadorRequest=null;

  function ambassadorClient(){return window.FundaEnrollmentContext?.getSupabase?.()||supabaseClient;}
  function ambassadorLabel(ambassador){
    const handles=(ambassador.handles||[]).map(item=>`${item.platform||'Social'}: ${item.handle}`).join(' · ');
    return handles?`${handles} — ${ambassador.name||'Ambassador'}`:ambassador.name||'Approved ambassador';
  }
  function ambassadorHelp(message,error=false){
    const help=byId('ambassadorSourceHelp');
    if(help){help.textContent=message;help.className=`mt-2 text-xs leading-5 ${error?'text-red-600':'text-gray-500'}`;}
    byId('ambassadorSource')?.setAttribute('aria-invalid',String(error));
  }
  function addAmbassadorOption(select,value,label){
    const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);
  }
  async function loadAmbassadors(refresh=false){
    if(ambassadorRequest)return ambassadorRequest;
    if(ambassadorLoaded&&!refresh)return;
    const select=byId('ambassadorSource');
    if(!select)return;
    const firstLoad=!ambassadorLoaded;
    const refreshButton=byId('ambassadorSourceRefresh');
    select.disabled=true;
    if(refreshButton)refreshButton.disabled=true;
    ambassadorHelp('Loading approved ambassadors / influencers…');
    ambassadorRequest=(async()=>{
      try{
        const {data,error}=await ambassadorClient().rpc('get_onboarding_ambassador_directory');
        if(error||!data||!Array.isArray(data.ambassadors))throw error||new Error('Directory unavailable');
        const wanted=select.value||select.dataset.pendingValue||(firstLoad?data.selected_id:null)||'';
        ambassadorOptions=data.ambassadors;
        ambassadorLinked=data.linked||null;
        select.replaceChildren();
        addAmbassadorOption(select,'','Select the ambassador / influencer');
        ambassadorOptions.forEach(item=>addAmbassadorOption(select,item.id,ambassadorLabel(item)));
        if(ambassadorLinked&&!ambassadorOptions.some(item=>item.id===ambassadorLinked.id)){
          addAmbassadorOption(select,ambassadorLinked.id,ambassadorLabel(ambassadorLinked));
        }
        select.value=ambassadorLinked?.id||wanted;
        delete select.dataset.pendingValue;
        ambassadorLoaded=true;
        if(ambassadorLinked)ambassadorHelp(`Your referral is already linked to ${ambassadorLabel(ambassadorLinked)}.`);
        else if(!ambassadorOptions.length)ambassadorHelp('No approved ambassadors / influencers are available yet. Please contact the Academy.',true);
        else ambassadorHelp('Select their TikTok, Facebook or other social handle from the list.');
      }catch(error){
        ambassadorLoaded=false;
        ambassadorHelp('Unable to load the ambassador list. Select Refresh list to try again.',true);
      }finally{
        select.disabled=!!ambassadorLinked;
        if(refreshButton)refreshButton.disabled=false;
      }
    })().finally(()=>{ambassadorRequest=null;});
    return ambassadorRequest;
  }
  function syncAmbassadorSelection(refresh=false){
    const required=byId('whereHeard')?.value===AMBASSADOR_SOURCE;
    const group=byId('ambassadorSourceGroup'),select=byId('ambassadorSource');
    if(!group||!select)return;
    group.hidden=!required;
    select.required=required;
    if(required)return loadAmbassadors(refresh);
    select.setAttribute('aria-invalid','false');
  }
  function validateAmbassadorSelection(values){
    if(values.where_heard_about_us!==AMBASSADOR_SOURCE)return null;
    if(ambassadorRequest)return 'The ambassador list is still loading. Please try Continue again.';
    if(!ambassadorLoaded)return 'Please refresh the approved ambassador / influencer list before continuing.';
    const id=values.heard_about_ambassador_id;
    if(!id||(!ambassadorOptions.some(item=>item.id===id)&&ambassadorLinked?.id!==id)){
      return 'Please select the ambassador / influencer who referred you.';
    }
    return null;
  }
  function showAmbassadorError(message){
    ambassadorHelp(message,true);
    byId('ambassadorSource')?.focus();
    showMessage?.(message);
  }
  function wireAmbassadorSelection(){
    byId('whereHeard')?.addEventListener('change',()=>syncAmbassadorSelection(true));
    byId('ambassadorSource')?.addEventListener('change',()=>{
      delete byId('ambassadorSource').dataset.pendingValue;
      ambassadorHelp('Select their TikTok, Facebook or other social handle from the list.');
    });
    byId('ambassadorSourceRefresh')?.addEventListener('click',()=>loadAmbassadors(true));
    window.FundaOnboardingAmbassadors={sync:syncAmbassadorSelection};
    syncAmbassadorSelection();
  }

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
      const index=chosenCourses().findIndex(course=>String(course.id)===String(selectedCourse.id));
      if(byId('studentTypeBack'))byId('studentTypeBack').textContent=index>0?'← Previous course':'← Back to Course Selection';

      const remaining=window.FundaOnboardingCourseBrowser?.getSelectedCourses?.()||[selectedCourse];
      byId('summaryCourse').textContent=selectedCourse.title;
      byId('summaryDuration').textContent=selectedCourse.duration||'Flexible';
      byId('summaryPrice').textContent=formatMoney(effectiveCoursePrice());

      hideAllFlowSteps();
      byId('studentTypeStep')?.classList.remove('hidden-section');
      setHeader(
        'STEP 2 OF 5 • STUDENT TYPE',
        'Student Type',
        `You selected ${selectedCourse.title}. Tell us whether you are a first-time or returning Funda Online Academy student.${remaining.length>1?` You have ${remaining.length} courses selected. Previous-study benefits are checked per course; payment will cover your combined total.`:""}`
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
    if(chosenCourses().length>1){
      const snapshot=window.FundaLegacy?.captureSelection?.();
      if(!snapshot?.course){showMessage?.('Please refresh before confirming your course selection.');return;}
      if(snapshot.type==='first_time'&&!courseBenefits.size)restoreFirstTimeBenefits();
      else courseBenefits.set(String(snapshot.course.id),snapshot);
      const next=chosenCourses().find(course=>!courseBenefits.has(String(course.id)));
      if(next){selectedCourse=next;existingEnrollment=null;startStudentType();return;}
    }

    hideAllFlowSteps();
    byId('detailsStep')?.classList.remove('hidden-section');
    setHeader(
      'STEP 3 OF 5 • STUDENT REGISTRATION',
      'Complete Your Details',
      'Complete your student registration details, then continue to payment.'
    );
    syncAmbassadorSelection(true);
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
    const ambassadorError=validateAmbassadorSelection(values);
    if(ambassadorError)return ambassadorError;

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

  async function continueToPayment(){
    hideMessage?.();
    const error=validateRegistrationDetails();
    if(error){
      if(byId('whereHeard')?.value===AMBASSADOR_SOURCE&&/ambassador/i.test(error))showAmbassadorError(error);
      else showMessage?.(error);
      return;
    }

    if(byId('whereHeard')?.value===AMBASSADOR_SOURCE){
      const button=byId('registrationContinue'),source=byId('whereHeard'),select=byId('ambassadorSource');
      const id=select.value;
      button.disabled=true;source.disabled=true;select.disabled=true;
      try{
        const {data,error}=await ambassadorClient().rpc('save_onboarding_ambassador_choice',{p_application_id:id});
        if(error||data?.selected_id!==id)throw error||new Error('Selection could not be saved');
        if(data.linked_id)ambassadorLinked=ambassadorOptions.find(item=>item.id===data.linked_id)||ambassadorLinked;
        ambassadorHelp(ambassadorLinked?'Your referral is linked to this ambassador.':'Your ambassador / influencer selection has been saved.');
      }catch(error){
        const message=/^(Your account is already linked|This ambassador is no longer available|You cannot select yourself|Please select an approved)/.test(error?.message||'')
          ? error.message:'Your ambassador / influencer selection could not be saved. Please try again.';
        select.disabled=!!ambassadorLinked;
        showAmbassadorError(message);
        return;
      }finally{
        button.disabled=false;source.disabled=false;select.disabled=!!ambassadorLinked;
      }
      if(byId('detailsStep')?.classList.contains('hidden-section'))return;
    }
    if(chosenCourses().length>1){
      const button=byId('registrationContinue');button.disabled=true;
      try{
        if(!window.FundaPaymentIntegrity?.prepareCheckout)throw Error('Combined checkout could not be loaded. Please refresh before payment.');
        await window.FundaPaymentIntegrity.prepareCheckout();
      }catch(error){showMessage?.(error.message||'Combined course fees could not be confirmed. Please try again.');return;}
      finally{button.disabled=false;}
      if(byId('detailsStep')?.classList.contains('hidden-section'))return;
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
    const checkoutError=window.FundaPaymentIntegrity?.validateCheckout?.();
    if(checkoutError)return checkoutError;

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
    window.FundaPaymentIntegrity?.renderSummary?.();

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
    syncAmbassadorSelection(true);
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
    wireAmbassadorSelection();

    const courseContinue=byId('continueButton');
    if(courseContinue){
      courseContinue.addEventListener('click',event=>{
        event.preventDefault();
        event.stopImmediatePropagation();
        startStudentType();
      },true);
    }

    byId('studentTypeBack')?.addEventListener('click',()=>{
      const chosen=chosenCourses(),index=chosen.findIndex(course=>String(course.id)===String(selectedCourse?.id));
      if(index>0){selectedCourse=chosen[index-1];existingEnrollment=null;courseBenefits.delete(String(selectedCourse.id));startStudentType();}
      else showCourseStep();
    });
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
