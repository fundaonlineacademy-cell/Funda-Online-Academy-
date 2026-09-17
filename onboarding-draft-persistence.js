(()=>{
  if(window.__fundaOnboardingDraftPersistence)return;
  window.__fundaOnboardingDraftPersistence=true;

  const VERSION='20260917-draft-v1';
  const NAV_PREFIX='funda:onboarding:navigation:v1:';
  const SESSION_PREFIX='funda:onboarding:session:v1:';
  const SERVER_SAVE_DELAY=900;
  const byId=id=>document.getElementById(id);

  const registrationFields=[
    'fullName','mobile','gender','identityDocumentType','idNumber','passportNumber',
    'dateOfBirth','nationality','address','city','province','postalCode',
    'employmentStatus','highestEducation','whereHeard','emergencyName','emergencyPhone'
  ];
  const paymentFields=['paymentMethod','paymentReference'];
  const legacyFields=['legacyId','legacyPaymentDate','legacyReason'];

  let ready=false;
  let restoring=false;
  let serverSaveTimer=null;
  let lastServerSnapshot='';
  let serverSavePending=false;
  let lastKnownStep='course';

  function userId(){
    return window.FundaEnrollmentContext?.getUser?.()?.id||window.currentUser?.id||null;
  }

  function navKey(){
    const id=userId();
    return id?`${NAV_PREFIX}${id}`:null;
  }

  function sessionKey(){
    const id=userId();
    return id?`${SESSION_PREFIX}${id}`:null;
  }

  function safeParse(value){
    try{return value?JSON.parse(value):null;}catch(_){return null;}
  }

  function readNavigation(){
    const key=navKey();
    if(!key)return null;
    try{return safeParse(localStorage.getItem(key));}catch(_){return null;}
  }

  function writeNavigation(patch={}){
    if(restoring)return;
    const key=navKey();
    if(!key)return;
    const current=readNavigation()||{};
    const selected=window.FundaEnrollmentContext?.getSelectedCourse?.()||null;
    const type=document.querySelector('input[name="legacyType"]:checked')?.value||current.studentType||'';
    const next={
      version:VERSION,
      courseId:selected?.id?String(selected.id):(current.courseId||null),
      step:patch.step||lastKnownStep||current.step||'course',
      studentType:type,
      paymentMethod:byId('paymentMethod')?.value||current.paymentMethod||'',
      updatedAt:new Date().toISOString(),
      ...patch
    };
    if(!next.courseId&&next.step!=='course')next.step='course';
    lastKnownStep=next.step;
    try{localStorage.setItem(key,JSON.stringify(next));}catch(_){ }
  }

  function collectSessionFields(){
    const fields={};
    [...registrationFields,...paymentFields,...legacyFields].forEach(id=>{
      const element=byId(id);
      if(!element)return;
      fields[id]=element.value??'';
    });
    return fields;
  }

  function writeSessionDraft(){
    if(restoring)return;
    const key=sessionKey();
    if(!key)return;
    try{
      sessionStorage.setItem(key,JSON.stringify({
        version:VERSION,
        fields:collectSessionFields(),
        updatedAt:new Date().toISOString()
      }));
    }catch(_){ }
  }

  function readSessionDraft(){
    const key=sessionKey();
    if(!key)return null;
    try{return safeParse(sessionStorage.getItem(key));}catch(_){return null;}
  }

  function clearDraft(){
    const n=navKey(),s=sessionKey();
    try{if(n)localStorage.removeItem(n);}catch(_){ }
    try{if(s)sessionStorage.removeItem(s);}catch(_){ }
    lastKnownStep='course';
  }

  function currentStudent(){
    return window.FundaEnrollmentContext?.getStudent?.()||null;
  }

  function courseList(){
    try{return Array.isArray(courses)?courses:[];}catch(_){return [];}
  }

  function db(){
    return window.FundaEnrollmentContext?.getSupabase?.()||window.supabaseClient||null;
  }

  function collectStudentPayload(){
    const identityType=byId('identityDocumentType')?.value||'south_african_id';
    return {
      full_name:String(byId('fullName')?.value||'').trim(),
      gender:byId('gender')?.value||null,
      identity_document_type:identityType,
      south_african_id:identityType==='south_african_id'?String(byId('idNumber')?.value||'').trim()||null:null,
      passport_number:identityType==='passport'?String(byId('passportNumber')?.value||'').trim()||null:null,
      mobile_whatsapp:String(byId('mobile')?.value||'').trim()||null,
      address:String(byId('address')?.value||'').trim()||null,
      date_of_birth:byId('dateOfBirth')?.value||null,
      nationality:String(byId('nationality')?.value||'').trim()||null,
      province:byId('province')?.value||null,
      city:String(byId('city')?.value||'').trim()||null,
      postal_code:String(byId('postalCode')?.value||'').trim()||null,
      employment_status:byId('employmentStatus')?.value||null,
      highest_education:byId('highestEducation')?.value||null,
      where_heard_about_us:byId('whereHeard')?.value||null,
      emergency_contact_name:String(byId('emergencyName')?.value||'').trim()||null,
      emergency_contact_phone:String(byId('emergencyPhone')?.value||'').trim()||null
    };
  }

  async function saveStudentToServer(){
    clearTimeout(serverSaveTimer);
    serverSaveTimer=null;
    const client=db(),student=currentStudent();
    if(!client||!student?.id)return;
    if(typeof navigator!=='undefined'&&navigator.onLine===false){
      serverSavePending=true;
      return;
    }

    const payload=collectStudentPayload();
    const snapshot=JSON.stringify(payload);
    if(snapshot===lastServerSnapshot&&!serverSavePending)return;

    try{
      const {error}=await client
        .from('students')
        .update(payload)
        .eq('id',student.id)
        .select('id')
        .single();
      if(error)throw error;
      lastServerSnapshot=snapshot;
      serverSavePending=false;
    }catch(error){
      serverSavePending=true;
      console.warn('Enrollment draft autosave will retry when online:',error?.message||error);
    }
  }

  function scheduleServerSave(immediate=false){
    writeSessionDraft();
    clearTimeout(serverSaveTimer);
    serverSaveTimer=setTimeout(saveStudentToServer,immediate?0:SERVER_SAVE_DELAY);
  }

  function applySessionFields(){
    const draft=readSessionDraft();
    if(!draft?.fields)return;
    Object.entries(draft.fields).forEach(([id,value])=>{
      const element=byId(id);
      if(!element||element.type==='file'||element.readOnly)return;
      if(value===undefined||value===null)return;
      element.value=String(value);
    });
    try{window.setIdentityMode?.();}catch(_){ }
  }

  function updateCourseSummary(){
    const course=window.FundaEnrollmentContext?.getSelectedCourse?.()||null;
    if(!course)return;
    if(byId('summaryCourse'))byId('summaryCourse').textContent=course.title||'—';
    if(byId('summaryDuration'))byId('summaryDuration').textContent=course.duration||'Flexible';
    try{
      if(byId('summaryPrice')&&typeof window.formatMoney==='function'&&typeof window.effectiveCoursePrice==='function'){
        byId('summaryPrice').textContent=window.formatMoney(window.effectiveCoursePrice());
      }
    }catch(_){ }
  }

  function showStep(step){
    const course=window.FundaEnrollmentContext?.getSelectedCourse?.()||null;
    ['courseStep','studentTypeStep','detailsStep','paymentStep','reviewStep']
      .forEach(id=>byId(id)?.classList.add('hidden-section'));

    if(step==='student_type'){
      byId('studentTypeStep')?.classList.remove('hidden-section');
      byId('stepLabel')&&(byId('stepLabel').textContent='STEP 2 OF 5 • STUDENT TYPE');
      byId('pageTitle')&&(byId('pageTitle').textContent='Student Type');
      byId('welcomeMessage')&&(byId('welcomeMessage').textContent=`You selected ${course?.title||'your course'}. Tell us whether you are a first-time or returning Funda Online Academy student.`);
    }else if(step==='registration'){
      byId('detailsStep')?.classList.remove('hidden-section');
      byId('stepLabel')&&(byId('stepLabel').textContent='STEP 3 OF 5 • STUDENT REGISTRATION');
      byId('pageTitle')&&(byId('pageTitle').textContent='Complete Your Details');
      byId('welcomeMessage')&&(byId('welcomeMessage').textContent='Complete your student registration details, then continue to payment.');
    }else if(step==='payment'){
      byId('paymentStep')?.classList.remove('hidden-section');
      byId('stepLabel')&&(byId('stepLabel').textContent='STEP 4 OF 5 • PAYMENT');
      byId('pageTitle')&&(byId('pageTitle').textContent='Payment');
      byId('welcomeMessage')&&(byId('welcomeMessage').textContent='Complete your payment information and upload your proof of payment, then continue to the final declaration.');
      try{window.FundaPaymentIntegrity?.refresh?.();}catch(_){ }
    }else{
      byId('courseStep')?.classList.remove('hidden-section');
      byId('stepLabel')&&(byId('stepLabel').textContent='STEP 1 OF 5 • CHOOSE YOUR COURSE');
      byId('pageTitle')&&(byId('pageTitle').textContent='Choose Your Course');
      byId('welcomeMessage')&&(byId('welcomeMessage').textContent='Choose the course you would like to study.');
      step='course';
    }
    lastKnownStep=step;
  }

  function restoreStudentType(type){
    if(!type)return '';
    try{window.FundaLegacy?.ensurePanel?.();}catch(_){ }
    const radio=[...document.querySelectorAll('input[name="legacyType"]')].find(item=>item.value===type);
    if(!radio)return '';
    radio.checked=true;
    radio.dispatchEvent(new Event('change',{bubbles:true}));
    return type;
  }

  async function restoreDraft(){
    const navigation=readNavigation();
    if(!navigation)return;

    restoring=true;
    try{
      applySessionFields();

      const courseId=navigation.courseId;
      const course=courseList().find(item=>String(item.id)===String(courseId));
      if(!course){
        clearDraft();
        return;
      }

      if(typeof window.selectCourse!=='function'){
        clearDraft();
        return;
      }
      window.selectCourse(course.id);
      updateCourseSummary();

      const type=restoreStudentType(navigation.studentType||'');
      const requested=navigation.step||'course';
      let target=requested;

      if(requested!=='course'&&!type)target='student_type';
      if(type&&type!=='first_time'&&['registration','payment','review'].includes(requested)){
        target='student_type';
      }
      if(requested==='review')target='payment';

      showStep(target);
      if(navigation.paymentMethod&&byId('paymentMethod'))byId('paymentMethod').value=navigation.paymentMethod;
      applySessionFields();
      updateCourseSummary();

      if(requested==='review'&&target==='payment'){
        window.showMessage?.('Your enrollment details were saved. For security, please reselect your proof-of-payment file before continuing to the final declaration.');
      }else if(type&&type!=='first_time'&&requested!==target){
        window.showMessage?.('Your enrollment details were saved. Please re-verify your previous-study evidence before continuing.');
      }
    }finally{
      restoring=false;
      writeNavigation({step:lastKnownStep});
    }
  }

  function wrapCourseSelection(){
    const original=window.selectCourse;
    if(typeof original==='function'&&!original.__draftWrapped){
      const wrapped=function(courseId){
        const result=original.apply(this,arguments);
        if(!restoring)writeNavigation({courseId:String(courseId),step:'course'});
        return result;
      };
      wrapped.__draftWrapped=true;
      window.selectCourse=wrapped;
    }

    const browser=window.FundaOnboardingCourseBrowser;
    if(browser?.clearSelection&&!browser.clearSelection.__draftWrapped){
      const originalClear=browser.clearSelection;
      const wrappedClear=function(){
        const result=originalClear.apply(this,arguments);
        clearDraft();
        return result;
      };
      wrappedClear.__draftWrapped=true;
      browser.clearSelection=wrappedClear;
    }
  }

  function attachFieldListeners(){
    const ids=[...registrationFields,...paymentFields,...legacyFields];
    ids.forEach(id=>{
      const element=byId(id);
      if(!element||element.dataset.draftPersistence)return;
      element.dataset.draftPersistence='1';
      const sensitive=id==='paymentReference'||id==='legacyId'||id==='idNumber'||id==='passportNumber';
      element.addEventListener('input',()=>{
        writeSessionDraft();
        if(registrationFields.includes(id))scheduleServerSave(false);
        if(!sensitive&&id==='paymentMethod')writeNavigation();
      });
      element.addEventListener('change',()=>{
        writeSessionDraft();
        if(registrationFields.includes(id))scheduleServerSave(true);
        if(id==='paymentMethod')writeNavigation({paymentMethod:element.value});
      });
    });

    document.addEventListener('change',event=>{
      const input=event.target;
      if(input?.matches?.('input[name="legacyType"]')){
        writeNavigation({studentType:input.value,step:'student_type'});
        writeSessionDraft();
      }
    });
  }

  function detectVisibleStep(){
    if(byId('reviewStep')&&!byId('reviewStep').classList.contains('hidden-section'))return 'review';
    if(byId('paymentStep')&&!byId('paymentStep').classList.contains('hidden-section'))return 'payment';
    if(byId('detailsStep')&&!byId('detailsStep').classList.contains('hidden-section'))return 'registration';
    if(byId('studentTypeStep')&&!byId('studentTypeStep').classList.contains('hidden-section'))return 'student_type';
    return 'course';
  }

  function observeStepChanges(){
    const observer=new MutationObserver(()=>{
      if(restoring)return;
      const step=detectVisibleStep();
      if(step!==lastKnownStep){
        lastKnownStep=step;
        writeNavigation({step});
        writeSessionDraft();
      }
    });
    ['courseStep','studentTypeStep','detailsStep','paymentStep','reviewStep'].forEach(id=>{
      const section=byId(id);
      if(section)observer.observe(section,{attributes:true,attributeFilter:['class']});
    });
    lastKnownStep=detectVisibleStep();
    writeNavigation({step:lastKnownStep});
  }

  function watchSubmission(){
    const submit=byId('submitApplication');
    if(!submit||submit.dataset.draftSubmissionWatch)return;
    submit.dataset.draftSubmissionWatch='1';
    const observer=new MutationObserver(()=>{
      if(/Application Submitted/i.test(submit.textContent||''))clearDraft();
    });
    observer.observe(submit,{childList:true,subtree:true,characterData:true});

    const logout=byId('logoutButton');
    logout?.addEventListener('click',clearDraft,{capture:true});
  }

  function readyToWire(){
    return !!(
      userId()&&
      currentStudent()?.id&&
      courseList().length&&
      byId('studentTypeStep')&&byId('paymentStep')&&byId('reviewStep')
    );
  }

  function initialise(){
    if(ready)return;
    if(!readyToWire())return;
    ready=true;
    wrapCourseSelection();
    attachFieldListeners();
    observeStepChanges();
    watchSubmission();
    restoreDraft()
      .then(()=>scheduleServerSave(true))
      .catch(error=>console.warn('Enrollment draft restore warning:',error?.message||error));
    window.addEventListener('online',()=>{
      if(serverSavePending)scheduleServerSave(true);
    });
    window.addEventListener('pagehide',()=>{
      writeSessionDraft();
      writeNavigation({step:lastKnownStep});
    });
  }

  const timer=setInterval(()=>{
    initialise();
    if(ready)clearInterval(timer);
  },200);
  setTimeout(()=>clearInterval(timer),20000);

  window.FundaOnboardingDraft={
    version:VERSION,
    saveNow:()=>{writeSessionDraft();writeNavigation({step:lastKnownStep});return saveStudentToServer();},
    clear:clearDraft
  };
})();
