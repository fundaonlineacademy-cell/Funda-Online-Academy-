// FUNDA ONLINE ACADEMY — ASSESSMENT ATTEMPT CONTROL
// Production rule: maximum 3 attempts. A pass on any attempt is final.
// If attempt 3 is failed, attempt 3 becomes the final recorded result.
(function(){
  const MAX_ATTEMPTS=3;
  const PASS_MARK=70;
  const keyBase=()=>`funda-assessment-${state.course?.id||'benchmark'}-${state.user?.id||'student'}-m1-formative`;
  const readRecord=()=>{try{return JSON.parse(localStorage.getItem(keyBase())||'{"attempts":[],"final":null}')||{attempts:[],final:null}}catch{return {attempts:[],final:null}}};
  const writeRecord=r=>localStorage.setItem(keyBase(),JSON.stringify(r));
  const attemptsUsed=()=>readRecord().attempts.length;
  const finalResult=()=>readRecord().final;

  async function persistToAcademy(attempt){
    if(!state.user||!state.course)return;
    try{
      await db.from('assessment_attempts').insert({
        student_id:state.user.id,course_id:state.course.id,module_number:1,assessment_type:'formative',
        attempt_number:attempt.attempt,score_percent:attempt.score,correct_answers:attempt.correct,
        total_questions:15,passed:attempt.passed,is_final:attempt.final
      });
      if(attempt.final){
        await db.from('assessment_results').upsert({
          student_id:state.user.id,course_id:state.course.id,module_number:1,assessment_type:'formative',
          final_score_percent:attempt.score,passed:attempt.passed,attempts_used:attempt.attempt
        },{onConflict:'student_id,course_id,module_number,assessment_type'});
      }
    }catch(e){console.warn('Assessment database record pending schema connection:',e?.message||e)}
  }

  const originalAssessmentIntro=assessmentIntro;
  assessmentIntro=function(kind){
    if(kind!=='formative')return originalAssessmentIntro(kind);
    const r=readRecord(), used=r.attempts.length, final=r.final;
    if(final){
      const passed=!!final.passed;
      return `<div class="assess-wrap"><div class="mobiletools"><button id="openModulesInner">☰ Modules</button></div><div class="assess-crumb">${BENCHMARK_TITLE} › Module 1 › Formative Assessment</div><div class="result-card"><div class="result-score ${passed?'result-pass':'result-fail'}">${final.score}%</div><h1>${passed?'Formative Assessment Completed':'Formative Assessment Finalised'}</h1><p><strong>Final recorded mark:</strong> ${final.score}%</p><p><strong>Attempts used:</strong> ${final.attempt} of ${MAX_ATTEMPTS}</p><p>${passed?'You achieved the required 70% pass mark. The Module 1 Summative Assessment is unlocked.':'You used all three permitted attempts. Your third-attempt mark is now the final result for this assessment and will appear in your results/transcript record.'}</p><div class="result-actions">${passed?'<button class="btn primary" id="goSummativeFinal">Proceed to Summative Assessment →</button>':''}<button class="btn secondary" id="reviewLessonsFinal">Review Lessons</button></div></div></div>`;
    }
    const next=used+1, remaining=MAX_ATTEMPTS-used;
    return `<div class="assess-wrap"><div class="mobiletools"><button id="openModulesInner">☰ Modules</button></div><div class="assess-crumb">${BENCHMARK_TITLE} › Module 1 › Formative Assessment</div><div class="assess-title-row"><div><h1 class="assess-title">Module 1 · Formative Assessment</h1><div class="assess-badges"><span class="pill">15 Questions</span><span class="pill gold">Attempt ${next} of ${MAX_ATTEMPTS}</span><span class="pill">Pass mark · ${PASS_MARK}%</span></div></div></div><div class="assess-intro"><h2>You are about to take the Formative Assessment</h2><p>This assessment checks your understanding of Lessons 1–8 in Module 1: Carpentry Practice, Workshop Safety & Professional Standards.</p><div class="assess-rules"><div class="assess-rule"><i>✓</i><span>You need at least <strong>${PASS_MARK}%</strong> to pass.</span></div><div class="assess-rule"><i>✓</i><span>You have <strong>${remaining} attempt${remaining===1?'':'s'} remaining</strong>, including this attempt.</span></div><div class="assess-rule"><i>✓</i><span>If you pass, the result is final and the Summative Assessment unlocks.</span></div><div class="assess-rule"><i>✓</i><span>If Attempt 3 is unsuccessful, that Attempt 3 mark becomes the final recorded result.</span></div></div><div class="assess-note"><strong>Assessment rule:</strong> a maximum of three attempts is permitted. Read each question carefully before submitting.</div><button class="start-assessment" id="startAssessment">Begin Attempt ${next}</button></div></div>`;
  };

  const originalRenderAssessment=renderAssessment;
  renderAssessment=function(kind){
    originalRenderAssessment(kind);
    if(kind==='formative'){
      const f=finalResult();
      const go=$('goSummativeFinal');if(go)go.onclick=()=>{state.unit=10;render();scrollTo(0,0)};
      const rev=$('reviewLessonsFinal');if(rev)rev.onclick=()=>{state.unit=1;render();scrollTo(0,0)};
      if(f)return;
      const start=$('startAssessment');if(start)start.onclick=()=>{
        if(attemptsUsed()>=MAX_ATTEMPTS){renderAssessment('formative');return}
        startFormative();
      };
    }
  };

  submitFormative=function(){
    let correct=0;
    quiz.questions.forEach((item,i)=>{const choice=quiz.answers[i];if(choice!==null&&item.opts[choice]?.correct)correct++});
    const pct=Math.round(correct/15*100), passed=pct>=PASS_MARK;
    const r=readRecord();
    if(r.final){renderAssessment('formative');return}
    const attemptNumber=r.attempts.length+1;
    if(attemptNumber>MAX_ATTEMPTS){renderAssessment('formative');return}
    const isFinal=passed||attemptNumber===MAX_ATTEMPTS;
    const attempt={attempt:attemptNumber,score:pct,correct,passed,final:isFinal,submittedAt:new Date().toISOString()};
    r.attempts.push(attempt);
    if(isFinal)r.final=attempt;
    writeRecord(r);
    persistToAcademy(attempt);
    if(passed)localStorage.setItem(`funda-formative-pass-${state.course?.id||'benchmark'}-m1`,'1');
    localStorage.removeItem(`funda-formative-draft-${state.course?.id||'benchmark'}-m1`);
    const remaining=MAX_ATTEMPTS-attemptNumber;
    $('course-content').innerHTML=`<div class="assess-wrap"><div class="assess-crumb">${BENCHMARK_TITLE} › Module 1 › Formative Assessment › Result</div><div class="result-card"><div class="result-score ${passed?'result-pass':'result-fail'}">${pct}%</div><h1>${passed?'Formative Assessment Passed':isFinal?'Final Attempt Completed':'More Revision Required'}</h1><p>You answered <strong>${correct} of 15</strong> questions correctly.</p><p><strong>Attempt ${attemptNumber} of ${MAX_ATTEMPTS}</strong></p><p>${passed?'You achieved the required 70% benchmark. This mark is now your final formative result and the Summative Assessment is unlocked.':isFinal?'You have used all three permitted attempts. This third-attempt mark is now the final recorded formative result for your results/transcript.':`You have ${remaining} attempt${remaining===1?'':'s'} remaining. Review Lessons 1–8 before trying again.`}</p><div class="result-actions">${passed?'<button class="btn primary" id="goSummative">Proceed to Summative Assessment →</button>':!isFinal?'<button class="btn primary" id="retryFormative">Try Again</button>':''}<button class="btn secondary" id="reviewLessons">Review Lessons</button></div></div></div>`;
    if(passed)$('goSummative').onclick=()=>{state.unit=10;quiz.started=false;render();scrollTo(0,0)};
    const retry=$('retryFormative');if(retry)retry.onclick=()=>{quiz.started=false;renderAssessment('formative');scrollTo(0,0)};
    $('reviewLessons').onclick=()=>{state.unit=1;quiz.started=false;render();scrollTo(0,0)};
    renderModules();
  };
})();