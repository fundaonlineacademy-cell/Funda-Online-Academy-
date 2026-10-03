(()=>{
'use strict';
if(window.__fundaStudentProgressCentre)return;
window.__fundaStudentProgressCentre=true;

const CSS=`
#studentProgressCentre{margin-bottom:8px}
.spHero{position:relative;overflow:hidden;padding:28px;border-radius:26px;background:linear-gradient(135deg,#071d49 0%,#0c377c 58%,#174b93 100%);border:1px solid rgba(201,154,46,.58);box-shadow:0 12px 30px rgba(7,29,73,.18);color:#fff}
.spHero:after{content:"";position:absolute;width:300px;height:300px;border-radius:50%;right:-135px;top:-175px;background:rgba(255,255,255,.08)}.spHero>*{position:relative;z-index:1}
.spKicker{margin:0;color:#e4c777;font-size:12px;letter-spacing:.16em;font-weight:900;text-transform:uppercase}.spHero h1{margin:7px 0 0;color:#fff!important;font:900 30px/1.2 "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.spHero p:last-child{max-width:900px;margin:12px 0 0;color:#edf4ff;font-size:15px;line-height:1.7;font-weight:650}
.spCourseList{display:grid;gap:18px;margin-top:18px}.spCourse{border:1px solid #dbe3ea;border-radius:22px;background:#fff;box-shadow:0 6px 18px rgba(20,49,77,.07);overflow:hidden}.spCourseHead{padding:22px 23px 18px;background:linear-gradient(145deg,#fff,#fffaf0)}.spCourseTop{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.spCourse h2{margin:0;color:#06152f!important;font:900 21px/1.25 "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.spStatus{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:#eef3f9;color:#213b55;font-size:10px;font-weight:900;white-space:nowrap}.spStatus.done{background:#e9f7f1;color:#176b50}.spStatus.progress{background:#fff2c9;color:#765100}.spBarMeta{display:flex;justify-content:space-between;gap:14px;margin-top:17px;color:#17324a;font-size:12px;font-weight:900}.spBar{height:10px;margin-top:7px;border-radius:999px;background:#e5ebf1;overflow:hidden}.spBar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#b9850f,#e0bb54)}.spSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:17px}.spMetric{padding:12px;border:1px solid #e0e6ec;border-radius:13px;background:#f9fbfd}.spMetric small{display:block;color:#52657a;font-size:11px;font-weight:750}.spMetric strong{display:block;margin-top:5px;color:#06152f;font-size:17px}.spCourseBody{padding:0 23px 23px}.spBlock{margin-top:18px}.spBlockTitle{display:flex;align-items:center;justify-content:space-between;gap:12px}.spBlockTitle h3{margin:0;color:#06152f!important;font:900 17px/1.3 "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.spBlockTitle span{color:#8a5f09;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}.spCurrent{margin-top:10px;padding:13px 15px;border:1px solid #e6cf8c;border-radius:13px;background:#fff9e8;color:#25384a;font-size:13px;line-height:1.55;font-weight:700}.spRoadmap{display:grid;gap:10px;margin-top:11px}.spModule{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 14px;border:1px solid #e0e6ec;border-radius:14px;background:#fbfdff}.spModuleNo{width:40px;height:40px;display:grid;place-items:center;border-radius:11px;background:#071d49;color:#fff;font-size:12px;font-weight:900}.spModuleMain strong{display:block;color:#06152f;font-size:13px}.spModuleMeta{display:flex;flex-wrap:wrap;gap:7px;margin-top:5px;color:#304459;font-size:11px;font-weight:700}.spModuleMeta span{padding:3px 7px;border-radius:999px;background:#eef3f7}.spModuleState{font-size:10px;font-weight:900;padding:6px 9px;border-radius:999px;background:#eef3f7;color:#304459;white-space:nowrap}.spModuleState.done{background:#e8f6ef;color:#176b50}.spModuleState.progress{background:#fff2c9;color:#765100}.spModuleAssessments{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px}.spAssess{font-size:10px;font-weight:800;padding:4px 7px;border-radius:999px;background:#f1f4f7;color:#34495e}.spAssess.pass{background:#e8f6ef;color:#176b50}.spOutstanding{margin-top:11px;padding:14px 15px;border-radius:13px;background:#071d49;color:#fff;border:1px solid rgba(201,154,46,.58);font-size:13px;line-height:1.6}.spOutstanding strong{color:#e4c777}.spEmpty{margin-top:18px;padding:30px;text-align:center;border:1px solid #dbe3ea;border-radius:20px;background:#fff;color:#52657a}.spLoading{margin-top:18px;padding:28px;text-align:center;border:1px solid #dbe3ea;border-radius:20px;background:#fff;color:#304459;font-weight:800}

.spOverviewSummary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
.spOverviewMetric{padding:14px 15px;border:1px solid #dbe3ea;border-radius:15px;background:#fff;box-shadow:0 4px 14px rgba(20,49,77,.05)}
.spOverviewMetric small{display:block;color:#52657a;font-size:11px;font-weight:800}
.spOverviewMetric strong{display:block;margin-top:5px;color:#06152f;font-size:20px}
.spSelectorPanel{margin-top:14px;padding:18px;border:1px solid #dbe3ea;border-radius:18px;background:linear-gradient(145deg,#fff,#f8fbff);box-shadow:0 5px 16px rgba(20,49,77,.05)}
.spSelectorPanel label{display:block;color:#06152f;font-size:14px;font-weight:900}
.spSelectorHelp{margin:4px 0 12px;color:#607286;font-size:12px;line-height:1.5;font-weight:650}
.spSelectorGrid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.45fr);gap:10px}
.spSelectorGrid input,.spSelectorGrid select{width:100%;min-height:46px;border:1px solid #cdd9e5;border-radius:12px;background:#fff;color:#183153;padding:10px 12px;font:700 13px/1.3 "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif;outline:none}
.spSelectorGrid input:focus,.spSelectorGrid select:focus{border-color:#2767c6;box-shadow:0 0 0 3px rgba(39,103,198,.12)}
.spSelectedHint{margin-top:10px;color:#52657a;font-size:11px;font-weight:750}
@media(max-width:900px){.spSummary,.spOverviewSummary{grid-template-columns:1fr 1fr}.spCourseTop{display:block}.spStatus{margin-top:10px}.spModule{grid-template-columns:46px minmax(0,1fr)}.spModuleState{grid-column:2}}
@media(max-width:560px){.spHero{padding:23px 19px;border-radius:22px}.spHero h1{font-size:25px}.spCourseHead,.spCourseBody{padding-left:16px;padding-right:16px}.spSummary{grid-template-columns:1fr}.spModule{grid-template-columns:40px minmax(0,1fr);padding:12px 10px}.spModuleNo{width:34px;height:34px}.spModuleMeta{display:grid}.spModuleState{justify-self:start}}
@media(max-width:560px){.spSelectorGrid{grid-template-columns:1fr}.spOverviewSummary{grid-template-columns:1fr 1fr}.spSelectorPanel{padding:15px}}
`;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function injectStyle(){if(document.getElementById('studentProgressCentreStyle'))return;const s=document.createElement('style');s.id='studentProgressCentreStyle';s.textContent=CSS;document.head.appendChild(s)}
function ensureSection(){
  let section=document.getElementById('studentProgressCentre');
  if(section)return section;
  const host=document.getElementById('dashboardContent');if(!host)return null;
  section=document.createElement('section');
  section.id='studentProgressCentre';
  section.hidden=true;
  section.innerHTML=`<div class="spHero"><p class="spKicker">My Progress</p><h1>Your learning progress, clearly mapped.</h1><p>Choose one approved course at a time to see its progress, current position, module roadmap and outstanding learning requirements. Assessment marks stay in My Results; this page focuses on completion status.</p></div><div id="studentProgressControls"></div><div id="studentProgressContent" class="spLoading">Loading your learning progress…</div>`;
  const orientation=document.getElementById('studentOrientation');
  if(orientation?.parentNode)orientation.parentNode.insertBefore(section,orientation.nextSibling);else host.prepend(section);
  return section;
}
function approvedEnrollments(){
  try{return (typeof enrollments!=='undefined'?enrollments:[]).filter(e=>typeof isApproved==='function'&&isApproved(e))}catch{return []}
}
function titleOf(e){try{return typeof courseTitle==='function'?courseTitle(e):(e?.courses?.title||'Approved Course')}catch{return e?.courses?.title||'Approved Course'}}
function stateLabel(percent,remainingLessons,remainingAssessments){
  if(percent>=100&&remainingLessons===0&&remainingAssessments===0)return ['Requirements Complete','done'];
  if(percent>0)return ['In Progress','progress'];
  return ['Not Started',''];
}

function progressSnapshot(e){
  const cid=String(e?.course_id||'');
  let percent=0;
  try{
    if(typeof statusOf==='function'&&statusOf(e)==='completed')percent=100;
    else if(typeof courseProgress!=='undefined'&&courseProgress[cid])percent=Number(courseProgress[cid].percent||0);
  }catch{}
  percent=Math.max(0,Math.min(100,Math.round(Number.isFinite(percent)?percent:0)));
  if(percent>=100)return {percent:100,label:'Complete',kind:'done'};
  if(percent>0)return {percent,label:'In Progress',kind:'progress'};
  return {percent:0,label:'Not Started',kind:''};
}
function chooseDefaultCourse(approved){
  if(selectedCourseId&&approved.some(e=>String(e.course_id)===String(selectedCourseId)))return String(selectedCourseId);
  const active=approved.find(e=>{const p=progressSnapshot(e).percent;return p>0&&p<100});
  return String((active||approved[0])?.course_id||'');
}
function renderControls(approved){
  const host=document.getElementById('studentProgressControls');if(!host)return;
  const snapshots=approved.map(e=>({e,...progressSnapshot(e)}));
  const counts={
    approved:snapshots.length,
    progress:snapshots.filter(x=>x.kind==='progress').length,
    notStarted:snapshots.filter(x=>!x.kind).length,
    done:snapshots.filter(x=>x.kind==='done').length
  };
  host.innerHTML=`<div class="spOverviewSummary" aria-label="Course progress summary">
    <div class="spOverviewMetric"><small>Approved Courses</small><strong>${counts.approved}</strong></div>
    <div class="spOverviewMetric"><small>In Progress</small><strong>${counts.progress}</strong></div>
    <div class="spOverviewMetric"><small>Not Started</small><strong>${counts.notStarted}</strong></div>
    <div class="spOverviewMetric"><small>Complete</small><strong>${counts.done}</strong></div>
  </div>
  <div class="spSelectorPanel">
    <label for="spCourseSelect">Select a course to view progress</label>
    <p class="spSelectorHelp">Only the selected course is displayed below. Use the search box when you have several approved courses.</p>
    <div class="spSelectorGrid">
      <input id="spCourseSearch" type="search" autocomplete="off" placeholder="Search approved courses" aria-label="Search approved courses">
      <select id="spCourseSelect" aria-label="Select an approved course"></select>
    </div>
    <div class="spSelectedHint" id="spSelectedHint"></div>
  </div>`;

  const search=document.getElementById('spCourseSearch');
  const select=document.getElementById('spCourseSelect');
  const hint=document.getElementById('spSelectedHint');
  if(!select)return;

  function fillOptions(query=''){
    const q=String(query||'').trim().toLowerCase();
    const matches=snapshots.filter(x=>!q||titleOf(x.e).toLowerCase().includes(q));
    select.innerHTML='';
    if(!matches.length){
      const option=document.createElement('option');
      option.value='';option.textContent='No approved course matches your search';option.disabled=true;option.selected=true;
      select.appendChild(option);
      if(hint)hint.textContent='Try a different course name.';
      return;
    }
    const selectedIsVisible=matches.some(x=>String(x.e.course_id)===String(selectedCourseId));
    if(q&&!selectedIsVisible){
      const placeholder=document.createElement('option');
      placeholder.value='';placeholder.textContent='Choose a matching course…';placeholder.selected=true;
      select.appendChild(placeholder);
    }
    matches.forEach(x=>{
      const option=document.createElement('option');
      option.value=String(x.e.course_id);
      option.textContent=`${titleOf(x.e)} — ${x.label} · ${x.percent}%`;
      if(selectedIsVisible&&String(x.e.course_id)===String(selectedCourseId))option.selected=true;
      select.appendChild(option);
    });
    const current=snapshots.find(x=>String(x.e.course_id)===String(selectedCourseId));
    if(hint&&current)hint.textContent=`Currently viewing: ${titleOf(current.e)} · ${current.label} · ${current.percent}%`;
  }

  fillOptions('');
  search?.addEventListener('input',()=>fillOptions(search.value));
  select.addEventListener('change',()=>{
    if(!select.value)return;
    selectedCourseId=select.value;
    if(search)search.value='';
    fillOptions('');
    loadSelectedCourse(true);
  });
}
async function fetchCourseData(courseId){
  if(typeof db==='undefined'||!db||typeof currentUser==='undefined'||!currentUser)throw new Error('Student session is not ready.');
  const {data:modules,error:me}=await db.from('course_modules').select('id,course_id,module_number,module_name').eq('course_id',courseId).order('module_number',{ascending:true});
  if(me)throw me;
  const moduleRows=modules||[];
  const moduleIds=moduleRows.map(m=>m.id);
  let lessons=[];
  for(let i=0;i<moduleIds.length;i+=40){
    const {data,error}=await db.from('lessons').select('id,module_id,lesson_number,title').in('module_id',moduleIds.slice(i,i+40)).order('lesson_number',{ascending:true});
    if(error)throw error;lessons.push(...(data||[]));
  }
  const [lp,mp,requiredResult]=await Promise.all([
    db.from('lesson_progress').select('lesson_id,completed,completed_at').eq('student_id',currentUser.id),
    db.from('module_progress').select('module_id,completed,completed_at').eq('student_id',currentUser.id),
    db.rpc('get_required_course_assessments',{p_course_id:courseId})
  ]);
  if(lp.error)throw lp.error;if(mp.error)throw mp.error;if(requiredResult.error)throw requiredResult.error;
  const required=requiredResult.data||[];
  const assessmentIds=required.map(r=>r.assessment_id).filter(Boolean);
  let attempts=[];
  for(let i=0;i<assessmentIds.length;i+=40){
    const {data,error}=await db.from('assessment_attempts').select('assessment_id,passed,submitted_at').eq('student_id',currentUser.id).in('assessment_id',assessmentIds.slice(i,i+40));
    if(error)throw error;attempts.push(...(data||[]));
  }
  return {modules:moduleRows,lessons,lessonProgress:lp.data||[],moduleProgress:mp.data||[],attempts,required};
}
function renderCourse(data,e){
  const box=document.getElementById('studentProgressContent');if(!box)return;
  if(!e){box.className='spEmpty';box.innerHTML='<strong>Select an approved course to view its progress.</strong>';return}
  const doneLessons=new Set(data.lessonProgress.filter(x=>x.completed).map(x=>String(x.lesson_id)));
  const doneModules=new Set(data.moduleProgress.filter(x=>x.completed).map(x=>String(x.module_id)));
  const attemptsByAssessment={};
  data.attempts.forEach(a=>{const k=String(a.assessment_id);(attemptsByAssessment[k]||(attemptsByAssessment[k]=[])).push(a)});
  const lessonsByModule={};data.lessons.forEach(l=>(lessonsByModule[String(l.module_id)]||(lessonsByModule[String(l.module_id)]=[])).push(l));
  const req=data.required||[];
  const passedReq=new Set(req.filter(r=>(attemptsByAssessment[String(r.assessment_id)]||[]).some(a=>a.passed)).map(r=>String(r.assessment_id)));
  const mods=(data.modules||[]).slice().sort((a,b)=>(a.module_number||0)-(b.module_number||0));
  let totalLessons=0,completedLessons=0,current=null,earnedModuleEquivalents=0;
  const roadmap=mods.map(m=>{
    const ls=(lessonsByModule[String(m.id)]||[]).slice().sort((a,b)=>(a.lesson_number||0)-(b.lesson_number||0));
    const done=ls.filter(l=>doneLessons.has(String(l.id))).length;
    totalLessons+=ls.length;completedLessons+=done;
    if(!current){const next=ls.find(l=>!doneLessons.has(String(l.id)));if(next)current={module:m,lesson:next}}
    const moduleReq=req.filter(r=>String(r.module_id||'')===String(m.id));
    const passed=moduleReq.filter(r=>passedReq.has(String(r.assessment_id))).length;
    const officiallyDone=doneModules.has(String(m.id));
    if(officiallyDone)earnedModuleEquivalents+=1;else if(ls.length)earnedModuleEquivalents+=done/ls.length;
    const partial=done>0||passed>0;
    const state=officiallyDone?'Complete':partial?'In Progress':'Not Started';
    const cls=officiallyDone?'done':partial?'progress':'';
    const chips=moduleReq.map(r=>{
      const kind=String(r.assessment_type||'assessment').replace(/^./,x=>x.toUpperCase());
      const pass=passedReq.has(String(r.assessment_id));
      return `<span class="spAssess ${pass?'pass':''}">${esc(kind)}: ${pass?'Passed':'Outstanding'}</span>`;
    }).join('');
    return `<div class="spModule"><div class="spModuleNo">M${esc(m.module_number||'—')}</div><div class="spModuleMain"><strong>${esc(m.module_name||('Module '+(m.module_number||'')))}</strong><div class="spModuleMeta"><span>Lessons ${done} / ${ls.length}</span>${moduleReq.length?`<span>Assessments ${passed} / ${moduleReq.length}</span>`:''}</div>${chips?`<div class="spModuleAssessments">${chips}</div>`:''}</div><span class="spModuleState ${cls}">${state}</span></div>`;
  }).join('');
  const completedModules=mods.filter(m=>doneModules.has(String(m.id))).length;
  const passedAssessments=req.filter(r=>passedReq.has(String(r.assessment_id))).length;
  const remainingLessons=Math.max(0,totalLessons-completedLessons);
  const remainingAssessments=Math.max(0,req.length-passedAssessments);
  const remainingModules=Math.max(0,mods.length-completedModules);
  let percent=typeof statusOf==='function'&&statusOf(e)==='completed'?100:(mods.length?Math.round((earnedModuleEquivalents/mods.length)*100):0);
  percent=Math.max(0,Math.min(100,percent));
  const [status,cls]=stateLabel(percent,remainingLessons,remainingAssessments);
  let currentText='No lesson activity has been recorded yet.';
  if(current)currentText=`Current position: Module ${esc(current.module.module_number)} — Lesson ${esc(current.lesson.lesson_number)}: ${esc(current.lesson.title||'Next lesson')}`;
  else if(remainingAssessments>0)currentText='All recorded lessons are complete. Required assessments are still outstanding.';
  else if(remainingModules>0)currentText='All recorded lessons are complete. Some modules are not yet recorded as complete.';
  else if(percent>=100||(!remainingLessons&&!remainingAssessments&&!remainingModules))currentText='Learning requirements are complete for this course.';
  let outstanding='';
  if(!remainingLessons&&!remainingAssessments&&!remainingModules)outstanding='<strong>Nothing outstanding:</strong> the recorded learning and required assessment requirements are complete.';
  else{
    const parts=[];
    if(remainingLessons)parts.push(`${remainingLessons} lesson${remainingLessons===1?'':'s'}`);
    if(remainingModules)parts.push(`${remainingModules} module${remainingModules===1?'':'s'} not yet recorded complete`);
    if(remainingAssessments)parts.push(`${remainingAssessments} required assessment${remainingAssessments===1?'':'s'} still to pass`);
    outstanding='<strong>Still outstanding:</strong> '+parts.join(' • ')+'.';
  }
  box.className='spCourseList';
  box.innerHTML=`<article class="spCourse"><div class="spCourseHead"><div class="spCourseTop"><div><p class="spKicker">Selected Approved Course</p><h2>${esc(titleOf(e))}</h2></div><span class="spStatus ${cls}">${status}</span></div><div class="spBarMeta"><span>Overall Course Progress</span><strong>${percent}%</strong></div><div class="spBar"><i style="width:${percent}%"></i></div><div class="spSummary"><div class="spMetric"><small>Lessons</small><strong>${completedLessons} / ${totalLessons}</strong></div><div class="spMetric"><small>Modules</small><strong>${completedModules} / ${mods.length}</strong></div><div class="spMetric"><small>Required assessments passed</small><strong>${passedAssessments} / ${req.length}</strong></div><div class="spMetric"><small>Remaining</small><strong>${remainingLessons} lessons</strong></div></div></div><div class="spCourseBody"><div class="spBlock"><div class="spBlockTitle"><h3>Current Position</h3><span>Where you are now</span></div><div class="spCurrent">${currentText}</div></div><div class="spBlock"><div class="spBlockTitle"><h3>Module Progress Roadmap</h3><span>Module by module</span></div><div class="spRoadmap">${roadmap||'<div class="spEmpty">Module information is not available for this course yet.</div>'}</div></div><div class="spBlock"><div class="spBlockTitle"><h3>What is still outstanding</h3><span>Completion checklist</span></div><div class="spOutstanding">${outstanding}</div></div></div></article>`;
}

let selectedCourseId='';
let lastLoadedAt=0,lastLoadedCourse='',requestToken=0;
async function loadSelectedCourse(force=false){
  const box=document.getElementById('studentProgressContent');if(!box)return;
  const approved=approvedEnrollments();
  const enrolment=approved.find(e=>String(e.course_id)===String(selectedCourseId));
  if(!enrolment){box.className='spEmpty';box.innerHTML='<strong>Select an approved course to view its progress.</strong>';return}
  if(!force&&lastLoadedCourse===String(selectedCourseId)&&lastLoadedAt&&Date.now()-lastLoadedAt<15000&&box.classList.contains('spCourseList'))return;
  const token=++requestToken;
  box.className='spLoading';
  box.textContent='Loading progress for the selected course…';
  try{
    const data=await fetchCourseData(selectedCourseId);
    if(token!==requestToken)return;
    renderCourse(data,enrolment);
    lastLoadedCourse=String(selectedCourseId);
    lastLoadedAt=Date.now();
    renderControls(approved);
  }catch(error){
    if(token!==requestToken)return;
    console.error('My Progress could not be loaded',error);
    box.className='spEmpty';
    box.innerHTML='<strong>My Progress could not be loaded right now.</strong><p>Please refresh the dashboard and try again.</p>';
  }
}
async function show(force=false){
  const section=ensureSection();if(!section)return;
  section.hidden=false;
  const approved=approvedEnrollments();
  const controls=document.getElementById('studentProgressControls');
  const box=document.getElementById('studentProgressContent');
  if(!approved.length){
    if(controls)controls.innerHTML='';
    if(box){box.className='spEmpty';box.innerHTML='<strong>No approved course progress is available yet.</strong><p>Once a course is approved and active, its learning progress will appear here.</p>'}
    return;
  }
  selectedCourseId=chooseDefaultCourse(approved);
  renderControls(approved);
  await loadSelectedCourse(force);
}
function hide(){const section=document.getElementById('studentProgressCentre');if(section)section.hidden=true}
injectStyle();ensureSection();
window.FundaStudentProgress={show,hide,refresh:()=>show(true)};
})();