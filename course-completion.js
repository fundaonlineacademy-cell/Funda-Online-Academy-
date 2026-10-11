// FUNDA ONLINE ACADEMY — COURSE COMPLETION STRUCTURE
'use strict';
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const courseId=params.get('course')||params.get('id');
function backUrl(){return courseId?`course-study.html?id=${encodeURIComponent(courseId)}`:'dashboard.html'}
function setLinks(){[$('backToCourse'),$('returnCourse')].forEach(a=>{if(a)a.href=backUrl()});const pca=$('openPca');if(pca&&courseId)pca.href=`pca-assessment.html?course=${encodeURIComponent(courseId)}`}
function showMessage(text){const box=$('message');if(!box)return;box.textContent=text;box.hidden=false}
function setStep(id,state,label,detail){const step=$(id+'Step'),badge=$(id+'State'),copy=$(id+'Detail');if(!step||!badge||!copy)return;step.classList.remove('done','wait');if(state==='done')step.classList.add('done');else if(state==='wait')step.classList.add('wait');badge.textContent=label;copy.textContent=detail}
function render(data){
  $('completionShell')?.classList.remove('skeleton');
  const evalInfo=$('evaluationAvailability');
  if(evalInfo)evalInfo.textContent='The Course Evaluation opens after all required academic steps have been satisfied.';
  setStep('assessment',data.final_summative_passed?'done':'wait',data.final_summative_passed?'Passed':'Pending',data.final_summative_passed?'The final Summative Assessment requirement has been satisfied.':'Pass the final Summative Assessment before continuing to the course-end requirements.');

  const openPca=$('openPca');
  if(!data.pca_required){
    setStep('pca','done','Not required','This course does not require a Practical Competence Assessment.');
    if(openPca)openPca.hidden=true;
  }else{
    if(openPca)openPca.hidden=false;
    if(data.pca_submission_status==='competent')setStep('pca','done','Competent',`PCA requirement satisfied${data.pca_rubric_score!=null?` · ${Number(data.pca_rubric_score)}% rubric score`:''}.`);
    else if(data.pca_task_status!=='active')setStep('pca','wait','Structure configured','The PCA applies to this course, but the course-specific task and rubric are not yet active.');
    else if(!data.final_summative_passed)setStep('pca','wait','Locked','The PCA unlocks only after the final Summative Assessment is passed.');
    else setStep('pca','wait',data.pca_submission_status?String(data.pca_submission_status).replaceAll('_',' '):'Required','Complete the approved PCA and achieve Competent status before Course Completion.');
  }

  if(!data.evaluation_required){
    setStep('evaluation','done','Not required','No separate course evaluation is required for this course.');
    if(evalInfo)evalInfo.textContent='No separate learner evaluation is required for this course.';
  }else if(data.evaluation_submitted){
    setStep('evaluation','done','Submitted','Your course evaluation has been submitted. Your feedback does not alter your academic result.');
    if(evalInfo)evalInfo.textContent='Thank you. Your Course Evaluation has been submitted.';
  }else if(data.evaluation_form_status!=='active'){
    setStep('evaluation','wait','Form pending','The Course Evaluation is required, but the online evaluation form has not yet been activated.');
    if(evalInfo)evalInfo.textContent='The Course Evaluation requirement is configured, but learner submission is not currently active.';
  }else if(!data.academic_requirements_met){
    setStep('evaluation','wait','Locked','The Course Evaluation opens after all required academic steps have been satisfied.');
    if(evalInfo)evalInfo.textContent='Complete the required academic pathway first. Your feedback form will then unlock automatically.';
  }else{
    setStep('evaluation','wait','Required','Complete and submit the Course Evaluation to finish the course-completion workflow.');
    if(evalInfo)evalInfo.textContent='Your academic requirements are satisfied. Complete the Course Evaluation to finish the course-completion workflow.';
  }

  const notice=$('completionNotice'),title=$('completionNoticeTitle'),text=$('completionNoticeText');
  if(data.course_completion_ready){
    setStep('complete','done','Complete','All configured academic and course-evaluation requirements have been satisfied.');
    notice.classList.remove('locked');notice.classList.add('good');title.textContent='Course completion requirements satisfied';text.textContent='All configured requirements have been completed. Final certificate or results processes remain governed by the Academy’s separate issuance controls.';
  }else if(!data.academic_requirements_met){
    setStep('complete','wait','Pending','Academic requirements must be satisfied before course completion can be confirmed.');
    title.textContent='Academic requirements pending';text.textContent=data.pca_required&&!data.final_summative_passed?'Pass the final Summative Assessment, then complete the required PCA.':data.pca_required?'Complete the required PCA and achieve Competent status before moving to Course Completion.':'Pass the final Summative Assessment before moving to Course Completion.';
  }else if(data.evaluation_required&&!data.evaluation_submitted){
    setStep('complete','wait','Evaluation pending','Academic requirements are satisfied. Course completion awaits the required learner evaluation.');
    title.textContent='Course Evaluation pending';text.textContent=data.evaluation_form_status==='active'?'Your academic requirements are complete. Submit the Course Evaluation to finish the course-completion workflow.':'Your academic requirements are complete. The Course Evaluation form is configured as the final quality-assurance step and will open after the approved form is activated.';
  }

  const evalButton=$('openEvaluation');
  if(evalButton){
    const canOpen=data.evaluation_form_status==='active'&&data.academic_requirements_met&&!data.evaluation_submitted;
    evalButton.setAttribute('aria-disabled',String(!canOpen));
    if(canOpen&&courseId)evalButton.href=`course-evaluation.html?course=${encodeURIComponent(courseId)}`;else evalButton.removeAttribute('href');
    evalButton.textContent=data.evaluation_submitted?'Evaluation Submitted':'Course Evaluation';
  }
}
async function init(){
  setLinks();
  if(!courseId){showMessage('No course was selected.');$('completionShell')?.classList.remove('skeleton');return}
  try{
    const restored=window.FundaAuth?.restore?await window.FundaAuth.restore(db):await db.auth.getUser().then(result=>({user:result.data?.user||null,error:result.error||null,confirmedSignedOut:!result.error&&!result.data?.user}));
    if(!restored.user){if(restored.confirmedSignedOut)location.replace('login.html?reason=expired&next='+encodeURIComponent(location.pathname+location.search)+'&portal=student');else showMessage('The secure connection could not be confirmed. Check your connection and refresh this page.');return}
    const {data,error}=await db.rpc('get_course_end_structure',{p_course_id:courseId});
    if(error)throw error;if(!data?.ok)throw new Error(data?.message||'Unable to load course-completion requirements.');
    render(data);
  }catch(error){console.error(error);showMessage(error.message||'Unable to load course-completion requirements.');$('completionShell')?.classList.remove('skeleton')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
