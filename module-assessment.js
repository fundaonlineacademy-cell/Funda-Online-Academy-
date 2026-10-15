// FUNDA ONLINE ACADEMY — GENERIC DATABASE-DRIVEN MODULE ASSESSMENTS
// Questions are delivered without answer keys through authenticated RPCs.
(function(){
  'use strict';

  const $=id=>document.getElementById(id);
  const heroTitle=$('assessmentTitle');
  const heroSubtitle=$('assessmentSubtitle');
  const badges=$('assessmentBadges');
  const statusBox=$('assessmentStatus');
  const form=$('assessmentForm');

  const params=new URLSearchParams(location.search);
  const courseId=(params.get('course')||'').trim();
  const moduleNumber=Number(params.get('module'));
  const assessmentType=(params.get('type')||'formative').trim().toLowerCase();

  const validUuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const escapeHtml=value=>String(value??'').replace(/[&<>'\u0022]/g,ch=>ch==='&'?'&amp;':ch==='<'?'&lt;':ch==='>'?'&gt;':ch===String.fromCharCode(39)?'&#39;':'&quot;');

  if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY){
    fail('Assessment services could not be initialised.');
    return;
  }

  const db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  let state=null;
  let courseEnd=null;
  let currentQuestionIndex=0;
  let answerMap={};

  function setAssessmentActive(active){
    document.body.classList.toggle('assessment-active',Boolean(active));
  }

  function assessmentLabel(){
    return assessmentType==='formative'?'Formative':'Summative';
  }

  function attemptLabel(){
    if(state?.qa_mode)return 'QA Preview';
    return `Attempt ${state?.attempt_number||1} of ${state?.max_attempts||3}`;
  }

  function renderProgress(alertMessage=''){
    if(!state)return;
    const questionCount=state.questions?.length||state.question_count||0;
    statusBox.innerHTML=`
      <div class="assessment-progress" role="status" aria-live="polite">
        <div class="assessment-progress-head"><strong>Assessment progress</strong><span>Select one best answer.</span></div>
        <div class="assessment-progress-items">
          <div class="assessment-progress-item">Module ${escapeHtml(state.module_number||moduleNumber)}</div>
          <div class="assessment-progress-item">${escapeHtml(assessmentLabel())}</div>
          <div class="assessment-progress-item">Question ${currentQuestionIndex+1} of ${escapeHtml(questionCount)}</div>
          <div class="assessment-progress-item">${escapeHtml(attemptLabel())}</div>
        </div>
        ${alertMessage?`<div class="assessment-progress-alert">${escapeHtml(alertMessage)}</div>`:''}
      </div>`;
  }

  function fail(message){
    setAssessmentActive(false);
    heroTitle.textContent='Assessment unavailable';
    heroSubtitle.textContent='The Academy could not open this assessment.';
    badges.innerHTML='';
    statusBox.innerHTML=`<div class="notice bad"><strong>Unable to continue</strong><br>${escapeHtml(message)}</div><div class="actions"><a class="btn secondary" href="dashboard.html#myCoursesSection">Return to My Courses</a></div>`;
    form.hidden=true;
  }

  function renderBadges(s){
    if(!s||!s.ok){badges.innerHTML='';return;}
    const items=[];
    if(s.module_number)items.push(`Module ${s.module_number}`);
    if(s.assessment_type)items.push(s.assessment_type==='formative'?'Formative':'Summative');
    if(s.question_count)items.push(`${s.question_count} Questions`);
    if(s.pass_percent)items.push(`Pass · ${s.pass_percent}%`);
    if(s.qa_mode)items.push('Internal QA Preview');
    else if(s.attempt_number)items.push(`Attempt ${s.attempt_number} of ${s.max_attempts||3}`);
    badges.innerHTML=items.map(x=>`<span class="badge">${escapeHtml(x)}</span>`).join('');
  }

  function actionLinks(extra=''){
    return `<div class="actions">${extra}<a class="btn secondary" href="dashboard.html#myCoursesSection">Return to My Courses</a></div>`;
  }

  function postSummativeAction(){
    if(assessmentType!=='summative'||!courseEnd||Number(courseEnd.final_module_number)!==moduleNumber){
      return {href:`course-study.html?id=${encodeURIComponent(courseId)}`,label:'Return to Course →'};
    }
    if(courseEnd.pca_required){
      return {href:`pca-assessment.html?course=${encodeURIComponent(courseId)}`,label:'Proceed to Practical Competence Assessment →'};
    }
    return {href:`course-completion.html?course=${encodeURIComponent(courseId)}`,label:'Proceed to Course Completion →'};
  }

  async function load(){
    if(!validUuid(courseId)||!Number.isInteger(moduleNumber)||moduleNumber<1||!['formative','summative'].includes(assessmentType)){
      fail('The assessment link is invalid. Please reopen it from your course dashboard.');
      return;
    }

    const restored=window.FundaAuth?.restore
      ?await window.FundaAuth.restore(db)
      :await db.auth.getUser().then(result=>({user:result.data?.user||null,error:result.error||null,confirmedSignedOut:!result.error&&!result.data?.user}));
    if(!restored.user){
      if(restored.confirmedSignedOut)fail('Your session has ended. Sign in again from the student dashboard.');
      else fail('The secure connection could not be confirmed. You have not been signed out and your answers on this page remain here. Check your connection and try again.');
      return;
    }

    const {data,error}=await db.rpc('get_module_assessment_state',{
      p_course_id:courseId,
      p_module_number:moduleNumber,
      p_assessment_type:assessmentType
    });

    if(error){
      console.error('Assessment state error',error);
      fail('The assessment could not be verified. Please try again.');
      return;
    }

    state=data;
    if(assessmentType==='summative'){
      try{
        const {data:endData,error:endError}=await db.rpc('get_course_end_structure',{p_course_id:courseId});
        if(!endError&&endData?.ok)courseEnd=endData;else if(endError)console.warn('Course-end structure unavailable',endError);
      }catch(endError){console.warn('Course-end structure unavailable',endError)}
    }
    renderState();
  }

  function renderState(){
    if(!state||state.ok===false){
      fail(state?.message||'Assessment unavailable.');
      return;
    }

    setAssessmentActive(false);
    heroTitle.textContent=state.title||`Module ${moduleNumber} ${assessmentType} assessment`;
    heroSubtitle.textContent=assessmentType==='formative'
      ? 'Complete this checkpoint to demonstrate your understanding before the module summative assessment.'
      : 'This summative assessment measures your achievement across the complete module.';
    renderBadges(state);

    if(state.status==='locked_lessons'){
      const label=assessmentType==='formative'?'formative':'summative';
      statusBox.innerHTML=`<div class="notice"><strong>🔒 Complete the module lessons first</strong><br>You have completed ${escapeHtml(state.completed_lessons||0)} of ${escapeHtml(state.total_lessons||0)} lessons. The ${label} assessment unlocks when all module lessons are complete.</div>${actionLinks()}`;
      form.hidden=true;
      return;
    }

    if(state.status==='locked_formative'){
      const href=`module-assessment.html?course=${encodeURIComponent(courseId)}&module=${moduleNumber}&type=formative`;
      statusBox.innerHTML=`<div class="notice"><strong>🔒 Formative assessment required</strong><br>${escapeHtml(state.message||'Pass the formative assessment first.')}</div>${actionLinks(`<a class="btn primary" href="${href}">Open Formative Assessment</a>`)}`;
      form.hidden=true;
      return;
    }

    if(state.status==='passed'){
      setAssessmentActive(true);
      let extra;
      if(assessmentType==='formative'){
        extra=`<a class="btn primary" href="module-assessment.html?course=${encodeURIComponent(courseId)}&module=${moduleNumber}&type=summative">Proceed to Summative Assessment →</a>`;
      }else{
        const next=postSummativeAction();extra=`<a class="btn primary" href="${next.href}">${escapeHtml(next.label)}</a>`;
      }
      statusBox.innerHTML=`<div class="assessment-result-card"><div class="notice good"><strong>✅ Assessment already passed</strong><br>${escapeHtml(state.message||'Your passing result has been recorded.')} Attempts used: ${escapeHtml(state.attempts_used||1)} of ${escapeHtml(state.max_attempts||3)}.</div>${actionLinks(extra)}</div>`;
      form.hidden=true;
      return;
    }

    if(state.status==='exhausted'){
      setAssessmentActive(true);
      statusBox.innerHTML=`<div class="assessment-result-card"><div class="notice bad"><strong>Assessment finalised</strong><br>${escapeHtml(state.message||'All permitted attempts have been used.')} Your recorded attempts remain available to Academy reporting.</div>${actionLinks()}</div>`;
      form.hidden=true;
      return;
    }

    if(state.status!=='ready'||!Array.isArray(state.questions)||!state.questions.length){
      fail(state.message||'No questions are available for this assessment.');
      return;
    }

    currentQuestionIndex=0;
    answerMap={};
    form.hidden=true;
    form.innerHTML='';

    const typeLabel=assessmentType==='formative'?'Formative Assessment':'Summative Assessment';
    const questionCount=state.question_count||state.questions.length;
    const passPercent=state.pass_percent||70;
    const maxAttempts=state.max_attempts||3;
    const qaMode=Boolean(state.qa_mode);
    const attemptNumber=qaMode?null:(state.attempt_number||1);
    const suppliedInstructions=String(state.instructions||'').trim();
    const currentAttempt=qaMode?'Internal QA preview — no learner attempt will be recorded':`Attempt ${attemptNumber} of ${maxAttempts}`;

    statusBox.innerHTML=`
      <div class="notice">
        <strong>Assessment Instructions</strong><br><br>
        <strong>Module:</strong> ${escapeHtml(state.module_number||moduleNumber)}<br>
        <strong>Assessment:</strong> ${escapeHtml(typeLabel)}<br>
        <strong>Questions:</strong> ${escapeHtml(questionCount)}<br>
        <strong>Pass requirement:</strong> ${escapeHtml(passPercent)}%<br>
        <strong>Attempts:</strong> Maximum ${escapeHtml(maxAttempts)}<br>
        <strong>Current attempt:</strong> ${escapeHtml(currentAttempt)}
        ${suppliedInstructions?`<br><br>${escapeHtml(suppliedInstructions)}`:''}
        ${qaMode?'<br><br><strong>QA preview:</strong> You can complete and score this preview, but it will not change learner progress, results or the three-attempt allowance.':''}
        <br><br><strong>Before you begin</strong><br>
        Questions are shown one at a time. Select one answer before the Next button becomes usable. Review your answer carefully before moving forward. Your assessment will only begin when you select <strong>${qaMode?'Start QA Preview':'Start Assessment'}</strong> below.
      </div>
      <div class="actions">
        <button class="btn primary" id="startAssessment" type="button">${qaMode?'Start QA Preview':'Start Assessment'}</button>
        <a class="btn secondary" href="course-study.html?id=${encodeURIComponent(courseId)}">Return to Course</a>
      </div>`;

    const startButton=$('startAssessment');
    if(startButton)startButton.onclick=()=>{
      startButton.disabled=true;
      setAssessmentActive(true);
      renderProgress();
      renderQuestions();
      scrollTo({top:0,behavior:'smooth'});
    };
  }

  function renderQuestions(){
    if(!state?.questions?.length)return;
    const q=state.questions[currentQuestionIndex];
    const selected=answerMap[q.id]||'';
    const options=(q.options||[]).map(opt=>`
      <label class="opt ${selected===opt.key?'selected':''}">
        <input type="radio" name="q-${escapeHtml(q.id)}" value="${escapeHtml(opt.key)}" ${selected===opt.key?'checked':''}>
        <span><strong>${escapeHtml(opt.key)}.</strong> ${escapeHtml(opt.text)}</span>
      </label>`).join('');

    const isFirst=currentQuestionIndex===0;
    const isLast=currentQuestionIndex===state.questions.length-1;
    const qaMode=Boolean(state.qa_mode);
    form.innerHTML=`
      <section class="card question" data-question-id="${escapeHtml(q.id)}">
        <div class="qhead">
          <div class="qnum">${currentQuestionIndex+1}</div>
          <div class="qtext">${escapeHtml(q.question_text)}</div>
        </div>
        <div class="muted" style="margin-top:10px;font-weight:700">Question ${currentQuestionIndex+1} of ${state.questions.length}</div>
        <div class="options">${options}</div>
      </section>
      <div class="submitbar">
        <div>
          <strong>${escapeHtml(attemptLabel())}</strong>
          <div class="muted">${qaMode?'This preview will not create a learner attempt.':'Answer this question before continuing.'}</div>
        </div>
        <div class="actions" style="margin-top:0">
          ${isFirst?'':`<button id="prevQuestion" type="button" class="btn secondary">← Previous</button>`}
          ${isLast
            ? `<button id="submitAssessment" type="submit" class="btn primary">${qaMode?'Finish QA Preview':'Submit Assessment'}</button>`
            : '<button id="nextQuestion" type="button" class="btn primary">Next Question →</button>'}
        </div>
      </div>`;
    form.hidden=false;
    form.onsubmit=submit;

    form.querySelectorAll(`input[name="q-${CSS.escape(String(q.id))}"]`).forEach(input=>{
      input.addEventListener('change',()=>{
        answerMap[q.id]=input.value;
        form.querySelectorAll('.opt').forEach(label=>label.classList.toggle('selected',label.contains(input)&&input.checked));
        renderProgress();
      });
    });

    const prev=$('prevQuestion');
    if(prev)prev.onclick=()=>{
      currentQuestionIndex=Math.max(0,currentQuestionIndex-1);
      renderProgress();
      renderQuestions();
      scrollTo({top:0,behavior:'smooth'});
    };

    const nxt=$('nextQuestion');
    if(nxt)nxt.onclick=()=>{
      const chosen=form.querySelector(`input[name="q-${CSS.escape(String(q.id))}"]:checked`);
      if(!chosen){
        renderProgress(`Select an answer to Question ${currentQuestionIndex+1} before continuing.`);
        statusBox.scrollIntoView({behavior:'smooth',block:'center'});
        return;
      }
      answerMap[q.id]=chosen.value;
      currentQuestionIndex++;
      renderProgress();
      renderQuestions();
      scrollTo({top:0,behavior:'smooth'});
    };
  }

  async function submit(event){
    event.preventDefault();
    const q=state.questions[currentQuestionIndex];
    const chosen=form.querySelector(`input[name="q-${CSS.escape(String(q.id))}"]:checked`);
    if(!chosen){
      renderProgress('Select an answer to the final question before finishing.');
      statusBox.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    answerMap[q.id]=chosen.value;

    const unanswered=state.questions.filter(item=>!answerMap[item.id]).length;
    if(unanswered){
      renderProgress(`${unanswered} question${unanswered===1?' is':'s are'} still unanswered. Use Previous to complete every question.`);
      statusBox.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }

    const btn=$('submitAssessment');
    btn.disabled=true;
    btn.textContent=state.qa_mode?'Checking Preview…':'Submitting…';

    const {data,error}=await db.rpc('submit_module_assessment',{
      p_course_id:courseId,
      p_module_number:moduleNumber,
      p_assessment_type:assessmentType,
      p_answers:answerMap
    });

    if(error){
      console.error('Assessment submission error',error);
      btn.disabled=false;
      btn.textContent=state.qa_mode?'Finish QA Preview':'Submit Assessment';
      renderProgress(state.qa_mode?'The QA preview could not be checked. Your answers are still here; please retry.':'The submission was not completed. Your answers are still here; please retry.');
      statusBox.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }

    if(!data?.ok){
      btn.disabled=false;
      btn.textContent=state.qa_mode?'Finish QA Preview':'Submit Assessment';
      renderProgress(data?.message||'The assessment could not be completed. Your answers are still here; please retry.');
      statusBox.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }

    renderResult(data);
  }

  function renderResult(result){
    form.hidden=true;
    setAssessmentActive(true);

    if(result.qa_mode||result.recorded===false){
      const benchmarkMet=Boolean(result.passed);
      heroTitle.textContent='QA Preview Complete';
      heroSubtitle.textContent='No learner assessment attempt was recorded.';
      statusBox.innerHTML=`
        <div class="assessment-result-card">
          <div class="notice ${benchmarkMet?'good':''}"><strong>${benchmarkMet?'QA benchmark met':'QA benchmark not met'} — ${escapeHtml(result.percentage)}%</strong><br>${escapeHtml(result.correct_answers)} of ${escapeHtml(result.total_questions)} answers were correct. No learner result, progression status or attempt allowance was changed.</div>
          <div class="actions">
            <button class="btn primary" id="restartQaPreview" type="button">Restart QA Preview</button>
            <a class="btn secondary" href="course-study.html?id=${encodeURIComponent(courseId)}">Return to Course</a>
          </div>
        </div>`;
      const restart=$('restartQaPreview');
      if(restart)restart.onclick=()=>{currentQuestionIndex=0;answerMap={};renderState();scrollTo({top:0,behavior:'smooth'});};
      statusBox.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }

    heroTitle.textContent=result.passed?'Assessment Passed':'Assessment Result';
    heroSubtitle.textContent=`Attempt ${result.attempt_number} has been recorded by Funda Online Academy.`;
    badges.innerHTML=`<span class="badge">${escapeHtml(result.percentage)}%</span><span class="badge">${escapeHtml(result.correct_answers)} / ${escapeHtml(result.total_questions)} correct</span><span class="badge">Attempt ${escapeHtml(result.attempt_number)} of 3</span>`;

    if(result.passed){
      let extra;
      if(assessmentType==='formative'){
        extra=`<a class="btn primary" href="module-assessment.html?course=${encodeURIComponent(courseId)}&module=${moduleNumber}&type=summative">Proceed to Summative Assessment →</a>`;
      }else{
        const next=postSummativeAction();extra=`<a class="btn primary" href="${next.href}">${escapeHtml(next.label)}</a>`;
      }
      statusBox.innerHTML=`<div class="assessment-result-card"><div class="notice good"><strong>✅ Passed — ${escapeHtml(result.percentage)}%</strong><br>You achieved the required 70% pass mark. This passing attempt is now recorded.</div>${actionLinks(extra)}</div>`;
    }else if(result.status==='exhausted'){
      statusBox.innerHTML=`<div class="assessment-result-card"><div class="notice bad"><strong>Final attempt recorded — ${escapeHtml(result.percentage)}%</strong><br>All three permitted attempts have now been used. This assessment is finalised for Academy review.</div>${actionLinks()}</div>`;
    }else{
      statusBox.innerHTML=`<div class="assessment-result-card"><div class="notice"><strong>More revision required — ${escapeHtml(result.percentage)}%</strong><br>You have ${escapeHtml(result.attempts_remaining)} attempt${Number(result.attempts_remaining)===1?'':'s'} remaining. Review the module lessons before trying again.</div>${actionLinks(`<button class="btn primary" id="retryAssessment" type="button">Start Next Attempt</button>`)}</div>`;
      const retry=$('retryAssessment');
      if(retry)retry.onclick=()=>{setAssessmentActive(false);statusBox.innerHTML='<div class="spinner"></div>';form.hidden=true;load();scrollTo({top:0,behavior:'smooth'});};
    }
    statusBox.scrollIntoView({behavior:'smooth',block:'start'});
  }

  load();
})();
