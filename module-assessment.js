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
  const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY){
    fail('Assessment services could not be initialised.');
    return;
  }

  const db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  let state=null;

  function fail(message){
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
    if(s.attempt_number)items.push(`Attempt ${s.attempt_number} of ${s.max_attempts||3}`);
    badges.innerHTML=items.map(x=>`<span class="badge">${escapeHtml(x)}</span>`).join('');
  }

  function actionLinks(extra=''){
    return `<div class="actions">${extra}<a class="btn secondary" href="dashboard.html#myCoursesSection">Return to My Courses</a></div>`;
  }

  async function load(){
    if(!validUuid(courseId)||!Number.isInteger(moduleNumber)||moduleNumber<1||!['formative','summative'].includes(assessmentType)){
      fail('The assessment link is invalid. Please reopen it from your course dashboard.');
      return;
    }

    const {data:{user},error:userError}=await db.auth.getUser();
    if(userError||!user){
      fail('Your session has expired. Sign in again from the student dashboard.');
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
    renderState();
  }

  function renderState(){
    if(!state||state.ok===false){
      fail(state?.message||'Assessment unavailable.');
      return;
    }

    heroTitle.textContent=state.title||`Module ${moduleNumber} ${assessmentType} assessment`;
    heroSubtitle.textContent=assessmentType==='formative'
      ? 'Complete this checkpoint to demonstrate your understanding before the module summative assessment.'
      : 'This summative assessment measures your achievement across the complete module.';
    renderBadges(state);

    if(state.status==='locked_lessons'){
      statusBox.innerHTML=`<div class="notice"><strong>🔒 Complete the module lessons first</strong><br>You have completed ${escapeHtml(state.completed_lessons||0)} of ${escapeHtml(state.total_lessons||0)} lessons. The formative assessment unlocks when all module lessons are complete.</div>${actionLinks()}`;
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
      const extra=assessmentType==='formative'
        ? `<a class="btn primary" href="module-assessment.html?course=${encodeURIComponent(courseId)}&module=${moduleNumber}&type=summative">Proceed to Summative Assessment →</a>`
        : '';
      statusBox.innerHTML=`<div class="notice good"><strong>✅ Assessment already passed</strong><br>${escapeHtml(state.message||'Your passing result has been recorded.')} Attempts used: ${escapeHtml(state.attempts_used||1)} of ${escapeHtml(state.max_attempts||3)}.</div>${actionLinks(extra)}`;
      form.hidden=true;
      return;
    }

    if(state.status==='exhausted'){
      statusBox.innerHTML=`<div class="notice bad"><strong>Assessment finalised</strong><br>${escapeHtml(state.message||'All permitted attempts have been used.')} Your recorded attempts remain available to Academy reporting.</div>${actionLinks()}`;
      form.hidden=true;
      return;
    }

    if(state.status!=='ready'||!Array.isArray(state.questions)||!state.questions.length){
      fail(state.message||'No questions are available for this assessment.');
      return;
    }

    statusBox.innerHTML=`<div class="notice"><strong>Before you begin</strong><br>Answer every question and select one best answer. You need at least <strong>${escapeHtml(state.pass_percent||70)}%</strong> to pass. A maximum of <strong>${escapeHtml(state.max_attempts||3)} attempts</strong> is permitted.</div>`;
    renderQuestions();
  }

  function renderQuestions(){
    const qHtml=state.questions.map((q,index)=>{
      const options=(q.options||[]).map(opt=>`
        <label class="opt">
          <input type="radio" name="q-${escapeHtml(q.id)}" value="${escapeHtml(opt.key)}" required>
          <span><strong>${escapeHtml(opt.key)}.</strong> ${escapeHtml(opt.text)}</span>
        </label>`).join('');
      return `<section class="card question" data-question-id="${escapeHtml(q.id)}">
        <div class="qhead"><div class="qnum">${index+1}</div><div class="qtext">${escapeHtml(q.question_text)}</div></div>
        <div class="options">${options}</div>
      </section>`;
    }).join('');

    form.innerHTML=`${qHtml}<div class="submitbar"><div><strong>Attempt ${escapeHtml(state.attempt_number)} of ${escapeHtml(state.max_attempts||3)}</strong><div class="muted">Review every answer before submitting.</div></div><button id="submitAssessment" type="submit" class="btn primary">Submit Assessment</button></div>`;
    form.hidden=false;
    form.onsubmit=submit;
  }

  async function submit(event){
    event.preventDefault();
    const answerMap={};
    let unanswered=0;

    state.questions.forEach(q=>{
      const chosen=form.querySelector(`input[name="q-${CSS.escape(String(q.id))}"]:checked`);
      if(!chosen)unanswered++;
      else answerMap[q.id]=chosen.value;
    });

    if(unanswered){
      statusBox.innerHTML=`<div class="notice bad"><strong>Assessment incomplete</strong><br>Please answer all ${state.question_count} questions before submitting. ${unanswered} question${unanswered===1?' is':'s are'} still unanswered.</div>`;
      statusBox.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }

    const btn=$('submitAssessment');
    btn.disabled=true;
    btn.textContent='Submitting…';

    const {data,error}=await db.rpc('submit_module_assessment',{
      p_course_id:courseId,
      p_module_number:moduleNumber,
      p_assessment_type:assessmentType,
      p_answers:answerMap
    });

    if(error){
      console.error('Assessment submission error',error);
      btn.disabled=false;
      btn.textContent='Submit Assessment';
      statusBox.innerHTML=`<div class="notice bad"><strong>Submission not completed</strong><br>Your attempt could not be recorded. Please retry without closing the page.</div>`;
      statusBox.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }

    renderResult(data);
  }

  function renderResult(result){
    form.hidden=true;
    heroTitle.textContent=result.passed?'Assessment Passed':'Assessment Result';
    heroSubtitle.textContent=`Attempt ${result.attempt_number} has been recorded by Funda Online Academy.`;
    badges.innerHTML=`<span class="badge">${escapeHtml(result.percentage)}%</span><span class="badge">${escapeHtml(result.correct_answers)} / ${escapeHtml(result.total_questions)} correct</span><span class="badge">Attempt ${escapeHtml(result.attempt_number)} of 3</span>`;

    if(result.passed){
      const extra=assessmentType==='formative'
        ? `<a class="btn primary" href="module-assessment.html?course=${encodeURIComponent(courseId)}&module=${moduleNumber}&type=summative">Proceed to Summative Assessment →</a>`
        : '';
      statusBox.innerHTML=`<div class="notice good"><strong>✅ Passed — ${escapeHtml(result.percentage)}%</strong><br>You achieved the required 70% pass mark. This passing attempt is now recorded.</div>${actionLinks(extra)}`;
    }else if(result.status==='exhausted'){
      statusBox.innerHTML=`<div class="notice bad"><strong>Final attempt recorded — ${escapeHtml(result.percentage)}%</strong><br>All three permitted attempts have now been used. This assessment is finalised for Academy review.</div>${actionLinks()}`;
    }else{
      statusBox.innerHTML=`<div class="notice"><strong>More revision required — ${escapeHtml(result.percentage)}%</strong><br>You have ${escapeHtml(result.attempts_remaining)} attempt${Number(result.attempts_remaining)===1?'':'s'} remaining. Review the module lessons before trying again.</div>${actionLinks(`<button class="btn primary" id="retryAssessment" type="button">Start Next Attempt</button>`)}`;
      const retry=$('retryAssessment');
      if(retry)retry.onclick=()=>{statusBox.innerHTML='<div class="spinner"></div>';form.hidden=true;load();scrollTo({top:0,behavior:'smooth'});};
    }
    statusBox.scrollIntoView({behavior:'smooth',block:'start'});
  }

  load();
})();