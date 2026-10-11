'use strict';
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const courseId=params.get('course')||params.get('id');
function completionUrl(){return courseId?`course-completion.html?course=${encodeURIComponent(courseId)}`:'dashboard.html'}
function setLinks(){[$('backToCompletion'),$('cancelEvaluation')].forEach(a=>{if(a)a.href=completionUrl()})}
function message(text,success=false){const box=$('message');if(!box)return;box.textContent=text;box.hidden=false;box.className='message'+(success?' success':'');box.scrollIntoView({behavior:'smooth',block:'center'})}
function selected(name){return document.querySelector(`input[name="${name}"]:checked`)?.value||''}
function responsePayload(){return {
  overall_rating:Number(selected('overall_rating'))||null,
  most_useful_learning:$('mostUseful')?.value.trim()||'',
  objectives_achieved:selected('objectives_achieved'),
  objectives_not_achieved_reason:$('objectivesReason')?.value.trim()||'',
  expectations_met:selected('expectations_met'),
  work_applicability:selected('work_applicability'),
  improvement_comments:$('improvementComments')?.value.trim()||'',
  organization_rating:Number(selected('organization_rating'))||null,
  comments_suggestions:$('commentsSuggestions')?.value.trim()||'',
  further_comments:$('furtherComments')?.value.trim()||''
}}
function validate(r){
  if(!Number.isInteger(r.overall_rating)||r.overall_rating<1||r.overall_rating>5)return 'Please rate your overall course experience from 1 to 5.';
  if(!['yes','no'].includes(r.objectives_achieved))return 'Please indicate whether the course achieved its learning objectives.';
  if(r.objectives_achieved==='no'&&r.objectives_not_achieved_reason.length<3)return 'Please explain why the course did not achieve its learning objectives.';
  if(!['yes','no','partly'].includes(r.expectations_met))return 'Please indicate whether the knowledge and information gained met your expectations.';
  if(!['definitely','mostly','somewhat','not_at_all'].includes(r.work_applicability))return 'Please indicate how useful or applicable the learning will be.';
  if(!Number.isInteger(r.organization_rating)||r.organization_rating<1||r.organization_rating>5)return 'Please rate the organisation and presentation of the course from 1 to 5.';
  return '';
}
function wireConditional(){
  document.querySelectorAll('input[name="objectives_achieved"]').forEach(i=>i.addEventListener('change',()=>{
    const no=selected('objectives_achieved')==='no';$('objectivesReasonWrap').hidden=!no;$('objectivesReason').required=no;if(!no)$('objectivesReason').value='';
  }))
}
function renderState(data){
  $('evaluationShell')?.classList.remove('skeleton');
  $('courseTitle').textContent=data.course_title||'Funda Online Academy course';
  if(!data.evaluation_required){message('A separate Course Evaluation is not required for this course.');return}
  if(data.evaluation_form_status!=='active'){message('The Course Evaluation has not yet been activated for this course.');return}
  if(data.evaluation_submitted){message('Thank you. Your Course Evaluation has already been submitted.',true);return}
  if(!data.academic_requirements_met){
    message(data.pca_required?'Complete the final Summative Assessment and achieve Competent status in the required PCA before opening the Course Evaluation.':'Pass the final Summative Assessment before opening the Course Evaluation.');return
  }
  $('evaluationForm').hidden=false;
}
async function submit(event){
  event.preventDefault();
  const responses=responsePayload();const issue=validate(responses);if(issue){message(issue);return}
  const btn=$('submitEvaluation');btn.disabled=true;btn.textContent='Submitting…';
  try{
    const {data,error}=await db.rpc('submit_course_evaluation',{p_course_id:courseId,p_responses:responses});
    if(error)throw error;if(!data?.ok)throw new Error(data?.message||'The Course Evaluation could not be submitted.');
    $('evaluationForm').hidden=true;message(data.message||'Thank you. Your Course Evaluation has been submitted.',true);
    const done=document.createElement('div');done.className='actions';done.innerHTML=`<a class="btn primary" href="${completionUrl()}">Return to Course Completion →</a>`;$('evaluationShell').appendChild(done);
  }catch(error){console.error(error);btn.disabled=false;btn.textContent='Submit Course Evaluation';message(error.message||'The Course Evaluation could not be submitted. Please try again.')}
}
async function init(){
  setLinks();wireConditional();$('evaluationForm')?.addEventListener('submit',submit);
  if(!courseId){message('No course was selected.');$('evaluationShell')?.classList.remove('skeleton');return}
  try{
    const restored=window.FundaAuth?.restore?await window.FundaAuth.restore(db):await db.auth.getUser().then(result=>({user:result.data?.user||null,error:result.error||null,confirmedSignedOut:!result.error&&!result.data?.user}));
    if(!restored.user){if(restored.confirmedSignedOut)location.replace('login.html?reason=expired&next='+encodeURIComponent(location.pathname+location.search)+'&portal=student');else message('The secure connection could not be confirmed. Check your connection and refresh this page.');return}
    const {data,error}=await db.rpc('get_course_end_structure',{p_course_id:courseId});if(error)throw error;if(!data?.ok)throw new Error(data?.message||'Unable to load the Course Evaluation.');renderState(data);
  }catch(error){console.error(error);message(error.message||'Unable to load the Course Evaluation.');$('evaluationShell')?.classList.remove('skeleton')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();