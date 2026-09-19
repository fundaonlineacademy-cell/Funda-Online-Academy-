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
@media(max-width:900px){.spSummary{grid-template-columns:1fr 1fr}.spCourseTop{display:block}.spStatus{margin-top:10px}.spModule{grid-template-columns:46px minmax(0,1fr)}.spModuleState{grid-column:2}}
@media(max-width:560px){.spHero{padding:23px 19px;border-radius:22px}.spHero h1{font-size:25px}.spCourseHead,.spCourseBody{padding-left:16px;padding-right:16px}.spSummary{grid-template-columns:1fr}.spModule{grid-template-columns:40px minmax(0,1fr);padding:12px 10px}.spModuleNo{width:34px;height:34px}.spModuleMeta{display:grid}.spModuleState{justify-self:start}}
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
  section.innerHTML=`<div class="spHero"><p class="spKicker">My Progress</p><h1>Your learning progress, clearly mapped.</h1><p>See how far you have moved through each approved course, what you have completed and exactly what still remains. Assessment marks stay in My Results; this page focuses on completion status.</p></div><div id="studentProgressContent" class="spLoading">Loading your learning progress…</div>`;
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
async function fetchData(){
  if(typeof db==='undefined'||!db||typeof currentUser==='undefined'||!currentUser)throw new Error('Student session is not ready.');
  const approved=approvedEnrollments();
  if(!approved.length)return {approved:[],modules:[],lessons:[],lessonProgress:[],moduleProgress:[],attempts:[],required:{}};
  const courseIds=[...new Set(approved.map(e=>e.course_id).filter(Boolean))];
  const {data:modules,error:me}=await db.from('course_modules').select('id,course_id,module_number,module_name').in('course_id',courseIds).order('module_number',{ascending:true});
  if(me)throw me;
  const moduleIds=(modules||[]).map(m=>m.id);
  let lessons=[];
  for(let i=0;i<moduleIds.length;i+=40){
    const {data,error}=await db.from('lessons').select('id,module_id,lesson_number,title').in('module_id',moduleIds.slice(i,i+40)).order('lesson_number',{ascending:true});
    if(error)throw error;lessons.push(...(data||[]));
  }
  const [lp,mp,aa]=await Promise.all([
    db.from('lesson_progress').select('lesson_id,completed,completed_at').eq('student_id',currentUser.id),
    db.from('module_progress').select('module_id,completed,completed_at').eq('student_id',currentUser.id),
    db.from('assessment_attempts').select('assessment_id,passed,submitted_at').eq('student_id',currentUser.id)
  ]);
  if(lp.error)throw lp.error;if(mp.error)throw mp.error;if(aa.error)throw aa.error;
  const required={};
  for(const cid of courseIds){
    const r=await db.rpc('get_required_course_assessments',{p_course_id:cid});
    if(r.error){console.warn('Required assessments unavailable for progress view',r.error);required[String(cid)]=[]}else required[String(cid)]=r.data||[];
  }
  return {approved,modules:modules||[],lessons,lessonProgress:lp.data||[],moduleProgress:mp.data||[],attempts:aa.data||[],required};
}
function render(data){
  const box=document.getElementById('studentProgressContent');if(!box)return;
  if(!data.approved.length){box.className='spEmpty';box.innerHTML='<strong>No approved course progress is available yet.</strong><p>Once a course is approved and active, its learning progress will appear here.</p>';return}
  const doneLessons=new Set(data.lessonProgress.filter(x=>x.completed).map(x=>String(x.lesson_id)));
  const doneModules=new Set(data.moduleProgress.filter(x=>x.completed).map(x=>String(x.module_id)));
  const attemptsByAssessment={};
  data.attempts.forEach(a=>{const k=String(a.assessment_id);(attemptsByAssessment[k]||(attemptsByAssessment[k]=[])).push(a)});
  const modulesByCourse={};data.modules.forEach(m=>(modulesByCourse[String(m.course_id)]||(modulesByCourse[String(m.course_id)]=[])).push(m));
  const lessonsByModule={};data.lessons.forEach(l=>(lessonsByModule[String(l.module_id)]||(lessonsByModule[String(l.module_id)]=[])).push(l));
  box.className='spCourseList';
  box.innerHTML=data.approved.map(e=>{
    const cid=String(e.course_id);
    const mods=(modulesByCourse[cid]||[]).slice().sort((a,b)=>(a.module_number||0)-(b.module_number||0));
    const req=data.required[cid]||[];
    const passedReq=new Set(req.filter(r=>(attemptsByAssessment[String(r.assessment_id)]||[]).some(a=>a.passed)).map(r=>String(r.assessment_id)));
    let totalLessons=0,completedLessons=0,current=null;
    const roadmap=mods.map(m=>{
      const ls=(lessonsByModule[String(m.id)]||[]).slice().sort((a,b)=>(a.lesson_number||0)-(b.lesson_number||0));
      const done=ls.filter(l=>doneLessons.has(String(l.id))).length;
      totalLessons+=ls.length;completedLessons+=done;
      if(!current){const next=ls.find(l=>!doneLessons.has(String(l.id)));if(next)current={module:m,lesson:next}}
      const moduleReq=req.filter(r=>String(r.module_id||'')===String(m.id));
      const passed=moduleReq.filter(r=>passedReq.has(String(r.assessment_id))).length;
      const officiallyDone=doneModules.has(String(m.id));
      const partial=done>0||passed>0;
      const state=officiallyDone?'Complete':partial?'In Progress':'Not Started';
      const cls=officiallyDone?'done':partial?'progress':'';
      const chips=moduleReq.map(r=>{
        const kind=String(r.assessment_type||'assessment').replace(/^./,x=>x.toUpperCase());
        const pass=passedReq.has(String(r.assessment_id));
        return `<span class="spAssess ${pass?'pass':''}">${esc(kind)}: ${pass?'Passed':'Outstanding'}</span>`
      }).join('');
      return `<div class="spModule"><div class="spModuleNo">M${esc(m.module_number||'—')}</div><div class="spModuleMain"><strong>${esc(m.module_name||('Module '+(m.module_number||'')))}</strong><div class="spModuleMeta"><span>Lessons ${done} / ${ls.length}</span>${moduleReq.length?`<span>Assessments ${passed} / ${moduleReq.length}</span>`:''}</div>${chips?`<div class="spModuleAssessments">${chips}</div>`:''}</div><span class="spModuleState ${cls}">${state}</span></div>`
    }).join('');
    const progress=typeof courseProgress!=='undefined'&&courseProgress[cid]?courseProgress[cid]:null;
    const percent=String(typeof statusOf==='function'&&statusOf(e)==='completed'?100:Math.max(0,Math.min(100,Number(progress?.percent||0))));
    const completedModules=mods.filter(m=>doneModules.has(String(m.id))).length;
    const passedAssessments=req.filter(r=>passedReq.has(String(r.assessment_id))).length;
    const remainingLessons=Math.max(0,totalLessons-completedLessons);
    const remainingAssessments=Math.max(0,req.length-passedAssessments);
    const remainingModules=Math.max(0,mods.length-completedModules);
    const [status,cls]=stateLabel(Number(percent),remainingLessons,remainingAssessments);
    let currentText='No lesson activity has been recorded yet.';
    if(current)currentText=`Current position: Module ${esc(current.module.module_number)} — Lesson ${esc(current.lesson.lesson_number)}: ${esc(current.lesson.title||'Next lesson')}`;
    else if(remainingAssessments>0)currentText='All recorded lessons are complete. Required assessments are still outstanding.';
    else if(remainingModules>0)currentText='All recorded lessons are complete. Some modules are not yet recorded as complete.';
    else if(Number(percent)>=100||(!remainingLessons&&!remainingAssessments&&!remainingModules))currentText='Learning requirements are complete for this course.';
    let outstanding='';
    if(!remainingLessons&&!remainingAssessments&&!remainingModules)outstanding='<strong>Nothing outstanding:</strong> the recorded learning and required assessment requirements are complete.';
    else{
      const parts=[];
      if(remainingLessons)parts.push(`${remainingLessons} lesson${remainingLessons===1?'':'s'}`);
      if(remainingModules)parts.push(`${remainingModules} module${remainingModules===1?'':'s'} not yet recorded complete`);
      if(remainingAssessments)parts.push(`${remainingAssessments} required assessment${remainingAssessments===1?'':'s'} still to pass`);
      outstanding='<strong>Still outstanding:</strong> '+parts.join(' • ')+'.';
    }
    return `<article class="spCourse"><div class="spCourseHead"><div class="spCourseTop"><div><p class="spKicker">Approved Course</p><h2>${esc(titleOf(e))}</h2></div><span class="spStatus ${cls}">${status}</span></div><div class="spBarMeta"><span>Overall Course Progress</span><strong>${percent}%</strong></div><div class="spBar"><i style="width:${percent}%"></i></div><div class="spSummary"><div class="spMetric"><small>Lessons</small><strong>${completedLessons} / ${totalLessons}</strong></div><div class="spMetric"><small>Modules</small><strong>${completedModules} / ${mods.length}</strong></div><div class="spMetric"><small>Required assessments passed</small><strong>${passedAssessments} / ${req.length}</strong></div><div class="spMetric"><small>Remaining</small><strong>${remainingLessons} lessons</strong></div></div></div><div class="spCourseBody"><div class="spBlock"><div class="spBlockTitle"><h3>Current Position</h3><span>Where you are now</span></div><div class="spCurrent">${currentText}</div></div><div class="spBlock"><div class="spBlockTitle"><h3>Module Progress Roadmap</h3><span>Module by module</span></div><div class="spRoadmap">${roadmap||'<div class="spEmpty">Module information is not available for this course yet.</div>'}</div></div><div class="spBlock"><div class="spBlockTitle"><h3>What is still outstanding</h3><span>Completion checklist</span></div><div class="spOutstanding">${outstanding}</div></div></div></article>`
  }).join('');
}
let loading=null,lastLoadedAt=0;
async function show(force=false){
  const section=ensureSection();if(!section)return;
  section.hidden=false;
  const box=document.getElementById('studentProgressContent');
  if(!force&&lastLoadedAt&&Date.now()-lastLoadedAt<15000&&box?.classList.contains('spCourseList'))return;
  if(loading)return loading;
  if(box){box.className='spLoading';box.textContent='Loading your learning progress…'}
  loading=fetchData().then(data=>{render(data);lastLoadedAt=Date.now()}).catch(error=>{console.error('My Progress could not be loaded',error);if(box){box.className='spEmpty';box.innerHTML='<strong>My Progress could not be loaded right now.</strong><p>Please refresh the dashboard and try again.</p>'}}).finally(()=>{loading=null});
  return loading;
}
function hide(){const section=document.getElementById('studentProgressCentre');if(section)section.hidden=true}
injectStyle();ensureSection();
window.FundaStudentProgress={show,hide,refresh:()=>show(true)};
})();