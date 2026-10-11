// FUNDA ONLINE ACADEMY — PRACTICAL COMPETENCE ASSESSMENT
'use strict';
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=v=>v==null?'':String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const params=new URLSearchParams(location.search);
const courseId=params.get('course')||params.get('id');
const STORAGE_BUCKET='pca-evidence';
const MAX_FILES=20;
const MAX_FILE_BYTES=50*1024*1024;
const ALLOWED_EXTENSIONS=new Set(['jpg','jpeg','png','webp','pdf','docx','xlsx','pptx','txt','mp4']);
const modeLabels={
  hands_on_practical:'Hands-on Practical',
  applied_work_product:'Applied Work Product',
  business_project_plan:'Business / Project Plan',
  structured_simulation:'Structured Simulation',
  portfolio:'Portfolio',
  drawing:'Drawing / Plan',
  applied_drawing:'Applied Drawing / Plan'
};
const workspace={user:null,data:null,submission:null,files:[],qaPreview:false,busy:false};
function showMessage(text,success=false){const box=$('message');if(!box)return;box.textContent=text;box.hidden=false;box.className='message'+(success?' success':'')}
function backUrl(){return courseId?`course-study.html?id=${encodeURIComponent(courseId)}`:'dashboard.html'}
function setLinks(){[$('backToCourse'),$('returnCourse')].forEach(a=>{if(a)a.href=backUrl()});const cc=$('courseCompletion');if(cc&&courseId)cc.href=`course-completion.html?course=${encodeURIComponent(courseId)}`}
function liList(host,items,empty='To be confirmed in the approved course task.'){if(!host)return;const list=Array.isArray(items)?items.filter(Boolean):[];host.innerHTML=list.length?list.map(x=>`<li>${esc(typeof x==='string'?x:(x.text||x.label||x.description||''))}</li>`).join(''):`<li>${esc(empty)}</li>`}
function renderComponents(components){const host=$('taskComponents');if(!host)return;const list=Array.isArray(components)?components:[];host.innerHTML=list.map((c,i)=>`<section><h3>${esc(c.title||`Part ${String.fromCharCode(65+i)}`)}</h3><p>${esc(c.instructions||c.description||'')}</p>${Array.isArray(c.evidence_required)&&c.evidence_required.length?`<ul class="list">${c.evidence_required.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}</section>`).join('')}
function renderCriteria(criteria){const host=$('taskCriteria');if(!host)return;const list=Array.isArray(criteria)?criteria:[];host.innerHTML=list.length?list.map(c=>{const weight=Number(c.weight);const meta=[Number.isFinite(weight)?`${weight}%`:null,c.critical?'Critical criterion':null].filter(Boolean).join(' · ');return `<div class="rubric-item"><strong>${esc(c.name||c.title||'Criterion')}</strong>${meta?`<span class="rubric-meta">${esc(meta)}</span>`:''}<div class="rubric-desc">${esc(c.description||'')}</div></div>`}).join(''):'<p>The approved course-specific rubric will appear here before learner submission opens.</p>'}
function renderRubricScale(cfg){
  const host=$('rubricScale');if(!host)return;
  const levels=Array.isArray(cfg.rubric_scale)?cfg.rubric_scale:[];
  host.innerHTML=levels.length?levels.map(level=>`<div class="rubric-level"><div class="rubric-level-head"><strong>Level ${esc(level.level)}</strong><span>${esc(level.label||'')}</span><b>${esc(level.criterion_percentage)}%</b></div><p>${esc(level.descriptor||'')}</p></div>`).join(''):'<p>The approved scoring guide will appear here.</p>';
  const rule=$('rubricScoringRule');if(rule)rule.textContent=cfg.rubric_scoring_rule?.method||'';
  const critical=$('criticalRule');if(critical)critical.textContent=cfg.critical_criterion_rule?.rule||'Every critical criterion must be met in addition to the overall minimum score.';
}
function renderExtraStandards(cfg){
  const host=$('taskExtraStandards');if(!host)return;
  const items=[
    ['Access requirement',cfg.access_requirement],
    ['Monitoring requirement',cfg.monitoring_requirement],
    ['Product quality standard',cfg.product_quality_standard],
    ['Production-readiness standard',cfg.production_readiness_standard],
    ['Production specification standard',cfg.production_specification_standard]
  ].filter(([,value])=>value);
  host.hidden=!items.length;
  host.innerHTML=items.map(([label,value])=>`<div class="extra-standard"><strong>${esc(label)}</strong><p>${esc(value)}</p></div>`).join('');
}
function renderEvidenceVerification(cfg){
  const host=$('evidenceVerification');if(!host)return;
  const verification=cfg.evidence_verification||{};
  const items=[];
  if(verification.process_evidence_required_where_material)items.push('Process evidence is required where the process itself is material to competence.');
  if(verification.final_output_alone_not_sufficient_where_process_is_essential)items.push('A final photo or finished output alone is not sufficient where the process is essential.');
  if(verification.editable_or_source_files_required_where_relevant)items.push('Editable or source files must be supplied where they are relevant to verifying the work.');
  if(verification.assessor_clarification_allowed)items.push('The assessor may request brief clarification, additional evidence or a limited demonstration where authenticity or competence is unclear.');
  if(verification.rule)items.push(verification.rule);
  liList(host,items,'Submit the evidence specified in the approved task brief.');
}
function statusLabel(value){return String(value||'not_started').replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase())}
function formatBytes(bytes){const n=Number(bytes||0);if(n<1024)return `${n} B`;if(n<1024*1024)return `${(n/1024).toFixed(1)} KB`;return `${(n/(1024*1024)).toFixed(1)} MB`}
function safeFileName(name){const raw=String(name||'evidence').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').replace(/^[-.]+|[-.]+$/g,'');return (raw||'evidence').slice(-120)}
function fileExtension(name){return String(name||'').split('.').pop().toLowerCase()}
function validateFile(file){if(!file)return 'No file was selected.';if(!ALLOWED_EXTENSIONS.has(fileExtension(file.name)))return `${file.name}: this file type is not allowed.`;if(Number(file.size||0)>MAX_FILE_BYTES)return `${file.name}: the file is larger than 50 MB.`;return ''}
function setSaveState(text='',kind=''){const host=$('evidenceSaveState');if(!host)return;host.textContent=text;host.className='save-state'+(kind?' '+kind:'')}
function setBusy(busy,label='Working…'){workspace.busy=busy;const save=$('savePcaDraft'),submit=$('submitPca'),input=$('evidenceFiles');if(save){save.disabled=busy||save.dataset.locked==='true';save.textContent=busy?label:'Save Draft'}if(submit){submit.disabled=busy||submit.dataset.locked==='true';submit.textContent=busy?label:'Submit PCA for Assessment'}if(input)input.disabled=busy||input.dataset.locked==='true'}
function evidencePayload(){return {files:workspace.files.filter(f=>!f.preview_only),notes:$('evidenceNotes')?.value.trim()||''}}
function isReadOnlyStatus(status){return ['submitted','under_review','competent','not_yet_competent','final_not_yet_competent'].includes(String(status||''))}
function renderEvidenceFiles(){
  const host=$('evidenceFileList');if(!host)return;
  if(!workspace.files.length){host.innerHTML='<div class="subtle">No evidence files selected yet.</div>';return}
  const readOnly=isReadOnlyStatus(workspace.submission?.status)||(!workspace.qaPreview&&!workspace.data?.pca_unlocked);
  host.innerHTML=workspace.files.map((f,i)=>`<div class="evidence-file"><div><strong>${esc(f.name||'Evidence file')}</strong><span>${esc(f.type||fileExtension(f.name).toUpperCase()||'File')} · ${esc(formatBytes(f.size))}${f.preview_only?' · QA preview only':''}</span></div><div class="actions" style="margin:0">${!f.preview_only&&f.path?`<button class="btn" type="button" data-view-file="${i}">View</button>`:''}${!readOnly?`<button class="btn danger" type="button" data-remove-file="${i}">Remove</button>`:''}</div></div>`).join('');
  host.querySelectorAll('[data-remove-file]').forEach(btn=>btn.addEventListener('click',()=>removeEvidenceFile(Number(btn.dataset.removeFile))));
  host.querySelectorAll('[data-view-file]').forEach(btn=>btn.addEventListener('click',()=>openEvidenceFile(Number(btn.dataset.viewFile))));
}
function renderSubmissionMeta(){
  const number=$('submissionNumber'),state=$('submissionState');
  if(number)number.textContent=workspace.submission?.submission_number?`Submission ${workspace.submission.submission_number}`:(workspace.qaPreview?'QA preview':'Submission not started');
  if(state)state.textContent=workspace.qaPreview?'Preview only':statusLabel(workspace.submission?.status||workspace.data?.pca_submission_status||'draft');
}
function lockEvidenceEditor(reason=''){
  ['evidenceFiles','evidenceNotes','learnerDeclaration','savePcaDraft','submitPca'].forEach(id=>{const el=$(id);if(el){el.disabled=true;el.dataset.locked='true'}});
  if(reason)setSaveState(reason,'error');
}
function unlockEvidenceEditor(){
  ['evidenceFiles','evidenceNotes','learnerDeclaration','savePcaDraft','submitPca'].forEach(id=>{const el=$(id);if(el){el.dataset.locked='false';el.disabled=false}});
}
async function loadLatestSubmission(){
  if(workspace.qaPreview)return;
  const {data,error}=await db.from('pca_submissions').select('id,submission_number,status,evidence,learner_declaration,rubric_score,critical_criteria_met,assessor_feedback,submitted_at,created_at,updated_at').eq('course_id',courseId).eq('user_id',workspace.user.id).order('submission_number',{ascending:false}).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error)throw error;
  if(data){workspace.submission={...data,submission_id:data.id};workspace.files=Array.isArray(data.evidence?.files)?data.evidence.files:[];$('evidenceNotes').value=data.evidence?.notes||'';$('learnerDeclaration').checked=!!data.learner_declaration}
}
async function ensureDraft(){
  if(workspace.qaPreview)return null;
  if(workspace.submission?.status==='draft')return workspace.submission;
  const {data,error}=await db.rpc('prepare_pca_submission',{p_course_id:courseId});
  if(error)throw error;if(!data?.ok)throw new Error(data?.message||'Unable to prepare the PCA draft.');
  if(data.read_only){workspace.submission={submission_id:data.submission_id,id:data.submission_id,submission_number:data.submission_number,status:data.status,evidence:data.evidence||{},learner_declaration:!!data.learner_declaration};workspace.files=Array.isArray(data.evidence?.files)?data.evidence.files:[];renderEvidenceFiles();renderSubmissionMeta();lockEvidenceEditor('This PCA submission is read-only at its current status.');return null}
  workspace.submission={submission_id:data.submission_id,id:data.submission_id,submission_number:data.submission_number,status:data.status,evidence:data.evidence||{},learner_declaration:!!data.learner_declaration};workspace.files=Array.isArray(data.evidence?.files)?data.evidence.files:workspace.files;renderSubmissionMeta();return workspace.submission;
}
async function persistDraft({quiet=false}={}){
  if(workspace.qaPreview){if(!quiet)setSaveState('QA preview only — no learner record or file was saved.','success');return true}
  const draft=await ensureDraft();if(!draft)return false;
  const update={evidence:evidencePayload(),learner_declaration:!!$('learnerDeclaration')?.checked,updated_at:new Date().toISOString()};
  const {error}=await db.from('pca_submissions').update(update).eq('id',draft.submission_id||draft.id).eq('status','draft');
  if(error)throw error;
  workspace.submission.evidence=update.evidence;workspace.submission.learner_declaration=update.learner_declaration;
  if(!quiet)setSaveState('Draft saved.','success');
  return true;
}
async function uploadSelectedFiles(event){
  const selected=[...(event.target.files||[])];event.target.value='';if(!selected.length)return;
  if(workspace.files.length+selected.length>MAX_FILES){setSaveState(`A maximum of ${MAX_FILES} files can be attached to one PCA submission.`,'error');return}
  for(const file of selected){const issue=validateFile(file);if(issue){setSaveState(issue,'error');return}}
  if(workspace.qaPreview){workspace.files.push(...selected.map(file=>({name:file.name,type:file.type||'',size:file.size,preview_only:true})));renderEvidenceFiles();setSaveState('QA preview: files are shown locally only and were not uploaded.','success');return}
  try{
    setBusy(true,'Uploading…');const draft=await ensureDraft();if(!draft)return;
    for(const file of selected){
      const unique=`${Date.now()}-${Math.random().toString(36).slice(2,9)}-${safeFileName(file.name)}`;
      const path=`${workspace.user.id}/${courseId}/${draft.submission_id||draft.id}/${unique}`;
      const {error}=await db.storage.from(STORAGE_BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type||undefined});
      if(error)throw error;
      workspace.files.push({path,name:file.name,type:file.type||'',size:file.size,uploaded_at:new Date().toISOString()});
      await persistDraft({quiet:true});
      renderEvidenceFiles();
    }
    setSaveState(`${selected.length} file${selected.length===1?'':'s'} uploaded and saved to your draft.`,'success');
  }catch(error){console.error(error);setSaveState(error.message||'The evidence file could not be uploaded.','error')}
  finally{setBusy(false)}
}
async function removeEvidenceFile(index){
  const file=workspace.files[index];if(!file)return;
  if(workspace.qaPreview){workspace.files.splice(index,1);renderEvidenceFiles();setSaveState('Removed from QA preview.','success');return}
  if(isReadOnlyStatus(workspace.submission?.status))return;
  try{
    setBusy(true,'Removing…');
    if(file.path){const {error}=await db.storage.from(STORAGE_BUCKET).remove([file.path]);if(error)throw error}
    workspace.files.splice(index,1);await persistDraft({quiet:true});renderEvidenceFiles();setSaveState('Evidence file removed from the draft.','success');
  }catch(error){console.error(error);setSaveState(error.message||'The evidence file could not be removed.','error')}
  finally{setBusy(false)}
}
async function openEvidenceFile(index){
  const file=workspace.files[index];if(!file?.path)return;
  try{const {data,error}=await db.storage.from(STORAGE_BUCKET).createSignedUrl(file.path,300);if(error)throw error;if(data?.signedUrl)window.open(data.signedUrl,'_blank','noopener')}
  catch(error){console.error(error);setSaveState(error.message||'Unable to open this evidence file.','error')}
}
async function savePcaDraft(){
  if(workspace.qaPreview){setSaveState('QA preview only — no learner record or file was saved.','success');return}
  try{setBusy(true,'Saving…');await persistDraft()}catch(error){console.error(error);setSaveState(error.message||'Unable to save the PCA draft.','error')}finally{setBusy(false)}
}
async function submitPca(){
  if(workspace.qaPreview){setSaveState('QA preview only — a learner PCA cannot be submitted from this account.','success');return}
  if(!workspace.files.length){setSaveState('Upload the required evidence before submitting your PCA.','error');return}
  if(!$('learnerDeclaration')?.checked){setSaveState('Confirm the learner declaration before submitting your PCA.','error');return}
  if(!window.confirm('Submit this PCA for assessment? After submission, the evidence will be locked unless a resubmission is authorised.'))return;
  try{
    setBusy(true,'Submitting…');const saved=await persistDraft({quiet:true});if(!saved)return;
    const id=workspace.submission?.submission_id||workspace.submission?.id;if(!id)throw new Error('The PCA draft could not be prepared.');
    const {data,error}=await db.rpc('submit_pca_submission',{p_submission_id:id});if(error)throw error;if(!data?.ok)throw new Error(data?.message||'The PCA could not be submitted.');
    workspace.submission.status='submitted';renderSubmissionMeta();renderEvidenceFiles();lockEvidenceEditor('Submitted for assessment. Your evidence is now locked.');showMessage(data.message||'Your PCA evidence has been submitted for assessment.',true);
    const {data:endData}=await db.rpc('get_course_end_structure',{p_course_id:courseId});if(endData?.ok){workspace.data=endData;renderProgress(endData)}
  }catch(error){console.error(error);setSaveState(error.message||'The PCA could not be submitted.','error')}
  finally{setBusy(false)}
}
function renderProgress(data){
  const progress=$('progressText');if(!progress)return;
  $('progressCard')?.classList.remove('good');
  if(data.pca_submission_status==='competent'){
    progress.textContent=`Competent${data.pca_rubric_score!=null?` · Rubric score ${Number(data.pca_rubric_score)}%`:''}. All required critical criteria have been recorded as met.`;
    $('progressCard')?.classList.add('good');if(data.course_completion_unlocked||data.academic_requirements_met)$('courseCompletion').hidden=false;
  }else if(data.pca_submission_status){progress.textContent=`Current status: ${statusLabel(data.pca_submission_status)}${data.pca_rubric_score!=null?` · Rubric score ${Number(data.pca_rubric_score)}%`:''}.`}
  else if(!data.final_summative_passed){progress.textContent='The PCA remains locked until the final Summative Assessment has been passed.'}
  else if(data.pca_task_status==='draft'){progress.textContent='The final Summative requirement is satisfied, but this PCA is still under academic QA and is not open for learner submission.'}
  else if(data.pca_task_status!=='active'){progress.textContent='The final Summative requirement is satisfied, but the course-specific PCA task is not yet active.'}
  else{progress.textContent='The PCA is available. Review the full task brief, evidence requirements and scoring criteria before submitting evidence.'}
}
async function setupEvidenceWorkspace(data){
  const card=$('evidenceSubmissionCard');if(!card)return;
  workspace.qaPreview=!!data.qa_preview||!!data.internal_qa_access;
  $('qaPreviewNotice').hidden=!workspace.qaPreview;
  $('evidenceFiles')?.addEventListener('change',uploadSelectedFiles);
  $('savePcaDraft')?.addEventListener('click',savePcaDraft);
  $('submitPca')?.addEventListener('click',submitPca);
  $('evidenceNotes')?.addEventListener('input',()=>setSaveState('Draft changes not saved yet.'));
  $('learnerDeclaration')?.addEventListener('change',()=>setSaveState('Draft changes not saved yet.'));
  if(workspace.qaPreview){unlockEvidenceEditor();$('savePcaDraft').disabled=true;$('submitPca').disabled=true;$('savePcaDraft').dataset.locked='true';$('submitPca').dataset.locked='true';renderSubmissionMeta();renderEvidenceFiles();return}
  if(!data.pca_unlocked){lockEvidenceEditor('This upload area unlocks after the final Summative Assessment is passed.');renderSubmissionMeta();renderEvidenceFiles();return}
  await loadLatestSubmission();renderSubmissionMeta();renderEvidenceFiles();
  const status=workspace.submission?.status||data.pca_submission_status;
  if(isReadOnlyStatus(status)){lockEvidenceEditor(status==='submitted'||status==='under_review'?'Submitted for assessment. Your evidence is locked while it is being assessed.':`This PCA is read-only while its status is ${statusLabel(status)}.`);return}
  if(status==='resubmission_required'){setSaveState('A resubmission has been authorised. Upload corrected evidence and submit the new attempt.','success')}
  unlockEvidenceEditor();
}
function render(data){
  workspace.data=data;$('pcaShell')?.classList.remove('skeleton');
  $('pcaTitle').textContent=data.pca_title||'Practical Competence Assessment';
  $('moduleLabel').textContent=`Final module · Module ${data.final_module_number||'—'}`;
  $('minimumScore').textContent=`${Number(data.pca_minimum_score||60)}%`;
  $('resubmissionCount').textContent=String(data.pca_max_resubmissions??1);
  const modes=$('pcaModes');if(modes)modes.innerHTML=(data.pca_modes||[]).map(m=>`<span class="mode">${esc(modeLabels[m]||m.replaceAll('_',' '))}</span>`).join('')||'<span class="mode">Course-specific mode pending</span>';

  const pcaStatus=$('pcaStatus');
  if(!data.pca_required){pcaStatus.textContent='Not required for this course';pcaStatus.className='pill';showMessage('This course does not require a Practical Competence Assessment.');return}
  if(data.pca_submission_status){pcaStatus.textContent=statusLabel(data.pca_submission_status);pcaStatus.className=data.pca_submission_status==='competent'?'pill green':'pill amber'}
  else if(data.pca_task_status==='draft'){pcaStatus.textContent='Task drafted · academic QA pending';pcaStatus.className='pill amber'}
  else if(data.pca_task_status!=='active'){pcaStatus.textContent='Structure configured · task not yet active';pcaStatus.className='pill amber'}
  else if(!data.pca_unlocked){pcaStatus.textContent='Locked until final Summative is passed';pcaStatus.className='pill amber'}
  else{pcaStatus.textContent=data.qa_preview?'Internal QA Preview':'Ready';pcaStatus.className=data.qa_preview?'pill gold':'pill green'}

  const unavailable=$('taskUnavailable'),taskContent=$('taskContent');
  if(data.pca_task_status==='active'){
    unavailable.hidden=true;taskContent.hidden=false;
    const cfg=data.pca_task_config||{};
    $('taskPurpose').innerHTML=`<p>${esc(cfg.purpose||'Apply the knowledge and skills taught in this course through the approved practical task.')}</p>`;
    $('taskInstructions').innerHTML=`<p>${esc(cfg.instructions||'Follow the approved task brief and submit the required evidence.')}</p>`;
    renderComponents(cfg.components);renderExtraStandards(cfg);liList($('taskMaterials'),cfg.materials);liList($('taskSafety'),cfg.safety,'Follow the safety and responsible-practice instructions stated in the approved task brief.');liList($('taskEvidence'),cfg.evidence_requirements||cfg.evidence);renderEvidenceVerification(cfg);renderCriteria(cfg.criteria);renderRubricScale(cfg);
  }else{
    unavailable.hidden=false;taskContent.hidden=true;
    $('taskUnavailableText').textContent=data.pca_task_status==='draft'?'The course-specific PCA brief and rubric have been drafted and are held for academic QA. Learner submission will remain closed until the task is approved and activated.':'The PCA placement, assessment mode and competence rules are configured. Learner submission will remain closed until the course-specific task and rubric are approved and activated.';
  }
  renderProgress(data);
}
async function init(){
  setLinks();
  if(!courseId){showMessage('No course was selected.');$('pcaShell')?.classList.remove('skeleton');return}
  try{
    const restored=window.FundaAuth?.restore?await window.FundaAuth.restore(db):await db.auth.getUser().then(result=>({user:result.data?.user||null,error:result.error||null,confirmedSignedOut:!result.error&&!result.data?.user}));
    if(!restored.user){if(restored.confirmedSignedOut)location.replace('login.html?reason=expired&next='+encodeURIComponent(location.pathname+location.search)+'&portal=student');else showMessage('The secure connection could not be confirmed. Check your connection and refresh this page.');return}
    workspace.user=restored.user;
    const {data,error}=await db.rpc('get_course_end_structure',{p_course_id:courseId});if(error)throw error;if(!data?.ok)throw new Error(data?.message||'Unable to load the Practical Competence Assessment structure.');
    render(data);if(data.pca_required&&data.pca_task_status==='active')await setupEvidenceWorkspace(data);
  }catch(error){console.error(error);showMessage(error.message||'Unable to load the Practical Competence Assessment structure.');$('pcaShell')?.classList.remove('skeleton')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
