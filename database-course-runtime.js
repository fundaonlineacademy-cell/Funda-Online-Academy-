// FUNDA ONLINE ACADEMY — DATABASE COURSE DELIVERY
(function(){
'use strict';
if(typeof render!=='function'||typeof state==='undefined'||typeof db==='undefined')return;
const CARPENTRY='60cfc5ea-6d3b-4dd1-abd6-cb68800930b5';
const prior=render;
const data={id:null,modules:[],lessons:[],progress:[],assessments:[],attempts:[],loading:null};
const isCarpentry=()=>state.course&&(state.course.id===CARPENTRY||/carpentry/i.test(String(state.course.title||'')));
const doneSet=()=>new Set(data.progress.filter(x=>x.completed).map(x=>String(x.lesson_id)));
const mod=n=>data.modules.find(x=>Number(x.module_number)===Number(n));
const lessons=n=>{const m=mod(n);return m?data.lessons.filter(x=>x.module_id===m.id).sort((a,b)=>a.lesson_number-b.lesson_number):[]};
const assessment=(n,t)=>{const m=mod(n);return m?data.assessments.find(x=>x.module_id===m.id&&new RegExp(t,'i').test(x.title||'')):null};
const passed=(n,t)=>{const a=assessment(n,t);return !!a&&data.attempts.some(x=>x.assessment_id===a.id&&x.passed)};
const unlocked=n=>Number(n)===1||passed(Number(n)-1,'summative');
const doneCount=n=>{const s=doneSet();return lessons(n).filter(x=>s.has(String(x.id))).length};
function text(v){return esc(v==null?'':String(v))}
function bodyHtml(v){return String(v||'').split(/\n\s*\n/).map(p=>`<p>${text(p).replace(/\n/g,'<br>')}</p>`).join('')}
async function load(force=false){
 const id=state.course?.id;if(!id)return;
 if(!force&&data.id===id&&data.modules.length)return;
 if(data.loading&&!force)return data.loading;
 data.loading=(async()=>{
  const mr=await db.from('course_modules').select('*').eq('course_id',id).order('module_number',{ascending:true});if(mr.error)throw mr.error;data.modules=mr.data||[];
  const mids=data.modules.map(x=>x.id);if(!mids.length){data.id=id;return}
  const [lr,pr,ar]=await Promise.all([
   db.from('lessons').select('*').in('module_id',mids).order('lesson_number',{ascending:true}),
   db.from('lesson_progress').select('lesson_id,completed,completed_at').eq('student_id',state.user.id).eq('completed',true),
   db.from('assessments').select('id,module_id,title').eq('course_id',id).eq('active',true).eq('status','published')
  ]);if(lr.error)throw lr.error;if(pr.error)throw pr.error;if(ar.error)throw ar.error;
  data.lessons=lr.data||[];data.progress=pr.data||[];data.assessments=ar.data||[];
  const aids=data.assessments.map(x=>x.id);if(aids.length){const rr=await db.from('assessment_attempts').select('assessment_id,passed,attempt_number,percentage').eq('student_id',state.user.id).in('assessment_id',aids);if(rr.error)throw rr.error;data.attempts=rr.data||[]}else data.attempts=[];
  data.id=id;
 })();try{await data.loading}finally{data.loading=null}
}
function progress(){return data.lessons.length?Math.round(doneSet().size/data.lessons.length*100):0}
function sidebar(){
 const host=$('moduleList');if(!host)return;const complete=doneSet();
 host.innerHTML=data.modules.map(m=>{const n=Number(m.module_number),ls=lessons(n),open=unlocked(n),dc=doneCount(n),fp=passed(n,'formative'),sp=passed(n,'summative');let html=ls.map(l=>{const u=Number(l.lesson_number),active=n===state.module&&u===state.unit;return `<button class="unit ${active?'active':''} ${open?'':'locked'}" data-m="${n}" data-u="${u}" ${open?'':'disabled'}><span class="dot">${complete.has(String(l.id))?'✓':active?'▶':u}</span><span>${text(l.title)}</span></button>`}).join('');const fl=!open||dc<ls.length,sl=!open||!fp;html+=`<button class="unit ${fl?'locked':''}" data-m="${n}" data-u="9" ${fl?'disabled':''}><span class="dot">${fp?'✓':'9'}</span><span>Formative Assessment</span></button><button class="unit ${sl?'locked':''}" data-m="${n}" data-u="10" ${sl?'disabled':''}><span class="dot">${sp?'✓':'10'}</span><span>Summative Assessment</span></button>`;return `<div class="module"><h3>Module ${n} · ${text(m.module_name)}</h3><div style="font-size:10px;color:#64748b;margin-bottom:8px">${dc}/${ls.length} lessons complete</div>${html}</div>`}).join('');
 host.querySelectorAll('.unit:not(.locked)').forEach(b=>b.onclick=()=>{state.module=Number(b.dataset.m);state.unit=Number(b.dataset.u);if(state.unit>8){const t=state.unit===9?'formative':'summative';window.location.assign(`module-assessment.html?course=${encodeURIComponent(state.course.id)}&module=${state.module}&type=${t}`)}else{render();if(innerWidth<761)$('modulePanel')?.classList.remove('open')}})
}
function lessonView(){
 const ls=lessons(state.module);let l=ls.find(x=>Number(x.lesson_number)===Number(state.unit));if(!l){state.unit=1;l=ls[0]}if(!l)return;
 const complete=doneSet().has(String(l.id));$('course-content').innerHTML=`<div class="mobiletools"><button id="openModulesInner">☰ Modules</button><button id="scrollNotesInner">✎ Notes</button></div><div class="crumb">${text(state.course.title)} / Module ${state.module} / Lesson ${l.lesson_number}</div><section class="lessonhead"><div class="course-label">MODULE ${state.module} · LESSON ${l.lesson_number} OF ${ls.length}</div><h1>${text(l.title)}</h1><div class="meta"><span class="pill">${complete?'Completed ✓':'In progress'}</span><span class="pill gold">Teaching Lesson</span></div></section><section class="card"><div>${bodyHtml(l.content||l.main_content||l.lesson_overview||'')}</div></section><div class="navbuttons"><button class="btn secondary" id="prevLesson">← Previous</button><button class="btn primary" id="completeLesson">${complete?'Continue →':'Complete Lesson & Continue →'}</button></div>`;
 $('openModulesInner')?.addEventListener('click',()=>$('modulePanel')?.classList.toggle('open'));$('scrollNotesInner')?.addEventListener('click',()=>show('Your notes are available in the study tools panel on larger screens.'));
 $('keyTerms').innerHTML='<div class="term"><span>Key terminology is included in the lesson content.</span></div>';const nk=`funda-note-${state.course.id}-${l.id}`;$('lessonNotes').value=localStorage.getItem(nk)||'';$('saveNotes').onclick=()=>{localStorage.setItem(nk,$('lessonNotes').value);show('Lesson notes saved on this device.',true)};
 $('prevLesson').disabled=state.module===1&&Number(l.lesson_number)===1;$('prevLesson').onclick=()=>{if(Number(l.lesson_number)>1)state.unit=Number(l.lesson_number)-1;else if(state.module>1){state.module--;state.unit=lessons(state.module).length||1}render();scrollTo(0,0)};
 $('completeLesson').onclick=async()=>{const b=$('completeLesson');b.disabled=true;b.textContent='Saving…';try{if(!complete){const now=new Date().toISOString();const r=await db.from('lesson_progress').upsert({student_id:state.user.id,lesson_id:l.id,completed:true,completed_at:now,updated_at:now},{onConflict:'student_id,lesson_id'});if(r.error)throw r.error;await load(true)}if(Number(l.lesson_number)<ls.length)state.unit=Number(l.lesson_number)+1;else{window.location.assign(`module-assessment.html?course=${encodeURIComponent(state.course.id)}&module=${state.module}&type=formative`);return}render();scrollTo(0,0)}catch(e){console.error(e);show('Lesson completion could not be saved.');b.disabled=false;b.textContent='Complete Lesson & Continue →'}}
}
async function draw(){try{await load();if(!data.modules.length){$('course-content').innerHTML='<div class="message">No modules are configured for this course.</div>';return}if(!unlocked(state.module)){state.module=1;state.unit=1}$('sidebarCourse').textContent=state.course.title||'Selected Course';const p=progress();$('progressText').textContent=`${p}%`;$('progressFill').style.width=`${p}%`;sidebar();if(state.unit>8){const t=state.unit===9?'formative':'summative';window.location.assign(`module-assessment.html?course=${encodeURIComponent(state.course.id)}&module=${state.module}&type=${t}`);return}lessonView()}catch(e){console.error(e);$('course-content').innerHTML=`<div class="message">Unable to load course content: ${text(e.message||'Please try again.')}</div>`}}
render=function(){if(!state.course||isCarpentry())return prior();draw()};

// Post-attach boot guard: course-study.js and this database runtime load as separate
// scripts. On slower/mobile browsers the base course may finish loading before this
// wrapper is attached. Once course/user state is ready, explicitly invoke the new
// renderer so the workspace cannot remain on "Preparing your course...".
let bootTries=0;
function bootDatabaseCourse(){
 bootTries++;
 if(state.course&&state.user&&!isCarpentry()){
  render();
  return;
 }
 if(bootTries<30)setTimeout(bootDatabaseCourse,200);
}
setTimeout(bootDatabaseCourse,0);
})();