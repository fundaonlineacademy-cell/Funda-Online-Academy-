// FUNDA ONLINE ACADEMY — PRACTICAL COMPETENCE ASSESSMENT STRUCTURE
'use strict';
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=v=>v==null?'':String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const params=new URLSearchParams(location.search);
const courseId=params.get('course')||params.get('id');
const modeLabels={
  hands_on_practical:'Hands-on Practical',
  applied_work_product:'Applied Work Product',
  business_project_plan:'Business / Project Plan',
  structured_simulation:'Structured Simulation',
  portfolio:'Portfolio',
  drawing:'Drawing / Plan',
  applied_drawing:'Applied Drawing / Plan'
};
function showMessage(text){const box=$('message');if(!box)return;box.textContent=text;box.hidden=false}
function backUrl(){return courseId?`course-study.html?id=${encodeURIComponent(courseId)}`:'dashboard.html'}
function setLinks(){[$('backToCourse'),$('returnCourse')].forEach(a=>{if(a)a.href=backUrl()});const cc=$('courseCompletion');if(cc&&courseId)cc.href=`course-completion.html?course=${encodeURIComponent(courseId)}`}
function liList(host,items,empty='To be confirmed in the approved course task.'){if(!host)return;const list=Array.isArray(items)?items.filter(Boolean):[];host.innerHTML=list.length?list.map(x=>`<li>${esc(typeof x==='string'?x:(x.text||x.label||x.description||''))}</li>`).join(''):`<li>${esc(empty)}</li>`}
function renderComponents(components){const host=$('taskComponents');if(!host)return;const list=Array.isArray(components)?components:[];host.innerHTML=list.map((c,i)=>`<section><h3>${esc(c.title||`Part ${String.fromCharCode(65+i)}`)}</h3><p>${esc(c.instructions||c.description||'')}</p>${Array.isArray(c.evidence_required)&&c.evidence_required.length?`<ul class="list">${c.evidence_required.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</section>`).join('')}
function renderCriteria(criteria){const host=$('taskCriteria');if(!host)return;const list=Array.isArray(criteria)?criteria:[];host.innerHTML=list.length?list.map(c=>`<div class="mode" style="display:block;margin:8px 0"><strong>${esc(c.name||c.title||'Criterion')}</strong>${c.critical?' · Critical':''}<div style="margin-top:4px;font-weight:500;color:#566c84">${esc(c.description||'')}</div></div>`).join(''):'<p>The approved course-specific rubric will appear here before learner submission opens.</p>'}
function statusLabel(value){return String(value||'not_started').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase())}
function render(data){
  $('pcaShell')?.classList.remove('skeleton');
  $('pcaTitle').textContent=data.pca_title||'Practical Competence Assessment';
  $('moduleLabel').textContent=`Final module · Module ${data.final_module_number||'—'}`;
  $('minimumScore').textContent=`${Number(data.pca_minimum_score||60)}%`;
  $('resubmissionCount').textContent=String(data.pca_max_resubmissions??1);
  const modes=$('pcaModes');if(modes)modes.innerHTML=(data.pca_modes||[]).map(m=>`<span class="mode">${esc(modeLabels[m]||m.replaceAll('_',' '))}</span>`).join('')||'<span class="mode">Course-specific mode pending</span>';

  const pcaStatus=$('pcaStatus');
  if(!data.pca_required){pcaStatus.textContent='Not required for this course';pcaStatus.className='pill';showMessage('This course does not require a Practical Competence Assessment.');return}
  if(data.pca_submission_status){pcaStatus.textContent=statusLabel(data.pca_submission_status);pcaStatus.className=data.pca_submission_status==='competent'?'pill green':'pill amber'}
  else if(data.pca_task_status!=='active'){pcaStatus.textContent='Structure configured · task not yet active';pcaStatus.className='pill amber'}
  else if(!data.pca_unlocked){pcaStatus.textContent='Locked until final Summative is passed';pcaStatus.className='pill amber'}
  else{pcaStatus.textContent='Ready';pcaStatus.className='pill green'}

  const unavailable=$('taskUnavailable'),taskContent=$('taskContent');
  if(data.pca_task_status==='active'){
    unavailable.hidden=true;taskContent.hidden=false;
    const cfg=data.pca_task_config||{};
    $('taskPurpose').innerHTML=`<p>${esc(cfg.purpose||'Apply the knowledge and skills taught in this course through the approved practical task.')}</p>`;
    $('taskInstructions').innerHTML=`<p>${esc(cfg.instructions||'Follow the approved task brief and submit the required evidence.')}</p>`;
    renderComponents(cfg.components);
    liList($('taskMaterials'),cfg.materials);
    liList($('taskSafety'),cfg.safety,'Follow the safety and responsible-practice instructions stated in the approved task brief.');
    liList($('taskEvidence'),cfg.evidence_requirements||cfg.evidence);
    renderCriteria(cfg.criteria);
  }else{
    unavailable.hidden=false;taskContent.hidden=true;
    $('taskUnavailableText').textContent='The PCA placement, assessment mode and competence rules are configured. The course-specific task, evidence brief and rubric will be added during the formal assessment-development phase before learner submission is activated.';
  }

  const progress=$('progressText');
  if(data.pca_submission_status==='competent'){
    progress.textContent=`Competent${data.pca_rubric_score!=null?` · Rubric score ${Number(data.pca_rubric_score)}%`:''}. All required critical criteria have been recorded as met.`;
    $('progressCard').classList.add('good');
    if(data.course_completion_unlocked||data.academic_requirements_met)$('courseCompletion').hidden=false;
  }else if(data.pca_submission_status){
    progress.textContent=`Current status: ${statusLabel(data.pca_submission_status)}${data.pca_rubric_score!=null?` · Rubric score ${Number(data.pca_rubric_score)}%`:''}.`;
  }else if(!data.final_summative_passed){
    progress.textContent='The PCA remains locked until the final Summative Assessment has been passed.';
  }else if(data.pca_task_status!=='active'){
    progress.textContent='The final Summative requirement is satisfied, but the course-specific PCA task is not yet active.';
  }else{
    progress.textContent='The PCA is available. Review the full task brief and criteria before submitting evidence.';
  }
}
async function init(){
  setLinks();
  if(!courseId){showMessage('No course was selected.');$('pcaShell')?.classList.remove('skeleton');return}
  try{
    const restored=window.FundaAuth?.restore?await window.FundaAuth.restore(db):await db.auth.getUser().then(result=>({user:result.data?.user||null,error:result.error||null,confirmedSignedOut:!result.error&&!result.data?.user}));
    if(!restored.user){if(restored.confirmedSignedOut)location.replace('login.html?reason=expired&next='+encodeURIComponent(location.pathname+location.search)+'&portal=student');else showMessage('The secure connection could not be confirmed. Check your connection and refresh this page.');return}
    const {data,error}=await db.rpc('get_course_end_structure',{p_course_id:courseId});
    if(error)throw error;if(!data?.ok)throw new Error(data?.message||'Unable to load the Practical Competence Assessment structure.');
    render(data);
  }catch(error){console.error(error);showMessage(error.message||'Unable to load the Practical Competence Assessment structure.');$('pcaShell')?.classList.remove('skeleton')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
