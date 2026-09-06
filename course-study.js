// FUNDA ONLINE ACADEMY — LEARNING WORKSPACE
'use strict';
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=v=>v==null?'':String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const state={user:null,studentId:null,course:null,modules:[],progress:[],assessments:[],attempts:[],module:1,unit:1};
const doneSet=()=>new Set(state.progress.filter(x=>x.completed).map(x=>String(x.lesson_id)));
const mod=n=>state.modules.find(x=>Number(x.module_number)===Number(n));
const lessons=n=>(mod(n)?.lessons||[]).slice().sort((a,b)=>Number(a.lesson_number)-Number(b.lesson_number));
const assessment=(n,t)=>{const m=mod(n);return m?state.assessments.find(a=>a.module_id===m.id&&String(a.title||'').toLowerCase().includes(t)):null};
const passed=(n,t)=>{const a=assessment(n,t);return !!a&&state.attempts.some(x=>x.assessment_id===a.id&&x.passed)};
const unlocked=n=>Number(n)===1||passed(Number(n)-1,'summative');
function show(message,success=false){const box=$('message');if(!box)return;box.textContent=message;box.style.display='block';box.className='message'+(success?' success':'')}
function asHtml(v){const s=String(v||'').trim();if(!s)return '';if(/<\/?[a-z][\s\S]*>/i.test(s))return s;return s.split(/\n\s*\n/).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('')}
function section(title,value,cls=''){if(!String(value||'').trim())return '';return `<section class="card ${cls}"><h2>${esc(title)}</h2><div>${asHtml(value)}</div></section>`}
function progressPct(){const total=state.modules.reduce((n,m)=>n+(m.lessons?.length||0),0);return total?Math.round(doneSet().size/total*100):0}
function renderSidebar(){
 const host=$('moduleList');if(!host)return;const done=doneSet();
 host.innerHTML=state.modules.map(m=>{
  const n=Number(m.module_number),ls=lessons(n),open=unlocked(n),dc=ls.filter(l=>done.has(String(l.id))).length;
  const hasF=!!assessment(n,'formative'),hasS=!!assessment(n,'summative'),fp=passed(n,'formative'),sp=passed(n,'summative');
  let items=ls.map(l=>{const u=Number(l.lesson_number),active=n===state.module&&u===state.unit;return `<button class="unit ${active?'active':''} ${open?'':'locked'}" data-m="${n}" data-u="${u}" ${open?'':'disabled'}><span class="dot">${done.has(String(l.id))?'✓':active?'▶':u}</span><span>${esc(l.title)}</span></button>`}).join('');
  if(hasF){const lock=!open||dc<ls.length;items+=`<button class="unit ${lock?'locked':''}" data-m="${n}" data-type="formative" ${lock?'disabled':''}><span class="dot">${fp?'✓':ls.length+1}</span><span>Formative Assessment</span></button>`}
  if(hasS){const lock=!open||dc<ls.length||(hasF&&!fp);items+=`<button class="unit ${lock?'locked':''}" data-m="${n}" data-type="summative" ${lock?'disabled':''}><span class="dot">${sp?'✓':ls.length+(hasF?2:1)}</span><span>Summative Assessment</span></button>`}
  return `<div class="module"><h3>Module ${n} · ${esc(m.module_name)}</h3><div style="font-size:10px;color:#64748b;margin-bottom:8px">${dc}/${ls.length} lessons complete</div>${items}</div>`
 }).join('');
 host.querySelectorAll('.unit:not(.locked)').forEach(b=>b.onclick=()=>{state.module=Number(b.dataset.m);if(b.dataset.type){location.assign(`module-assessment.html?course=${encodeURIComponent(state.course.id)}&module=${state.module}&type=${b.dataset.type}`);return}state.unit=Number(b.dataset.u);renderLesson();if(innerWidth<761)$('modulePanel')?.classList.remove('open')})
}
function renderLesson(){
 const ls=lessons(state.module);let l=ls.find(x=>Number(x.lesson_number)===Number(state.unit));if(!l){l=ls[0];state.unit=Number(l?.lesson_number||1)}if(!l){$('course-content').innerHTML='<div class="message">No lessons are configured for this module.</div>';return}
 const complete=doneSet().has(String(l.id));
 $('course-content').innerHTML=`
 <div class="mobiletools"><button id="openModulesInner">☰ Modules</button><button id="scrollNotesInner">✎ Notes</button></div>
 <div class="crumb">${esc(state.course.title)} / Module ${state.module} / Lesson ${l.lesson_number}</div>
 <section class="lessonhead"><div class="course-label">MODULE ${state.module} · LESSON ${l.lesson_number} OF ${ls.length}</div><h1>${esc(l.title)}</h1><div class="meta"><span class="pill">${complete?'Completed ✓':'In progress'}</span><span class="pill gold">Teaching Lesson</span></div></section>
 ${section('Lesson Overview',l.lesson_overview,'hero-learning')}
 ${section('Learning Objectives',l.learning_objectives,'outcomes')}
 ${section('Key Concepts',l.key_concepts)}
 ${section('Lesson Content',l.main_content||l.content)}
 ${section('Examples',l.examples)}
 ${section('Case Study',l.case_study)}
 ${section('Practical Activity',l.practical_activity)}
 ${section('Knowledge Check',l.knowledge_check,'knowledge')}
 ${section('Lesson Summary',l.lesson_summary)}
 ${section('Assessment Guidance',l.assessment_guidance)}
 <div class="navbuttons"><button class="btn secondary" id="prevLesson">← Previous</button><button class="btn primary" id="completeLesson">${complete?'Continue →':'Complete Lesson & Continue →'}</button></div>`;
 $('openModulesInner')?.addEventListener('click',()=>$('modulePanel')?.classList.toggle('open'));
 $('scrollNotesInner')?.addEventListener('click',()=>show('Your notes are available in the study tools panel on larger screens.'));
 if($('keyTerms'))$('keyTerms').innerHTML='<div class="term"><span>Key terminology is included throughout this lesson.</span></div>';
 const nk=`funda-note-${state.course.id}-${l.id}`;if($('lessonNotes'))$('lessonNotes').value=localStorage.getItem(nk)||'';if($('saveNotes'))$('saveNotes').onclick=()=>{localStorage.setItem(nk,$('lessonNotes').value);show('Lesson notes saved on this device.',true)};
 $('prevLesson').disabled=state.module===1&&Number(l.lesson_number)===1;
 $('prevLesson').onclick=()=>{if(Number(l.lesson_number)>1)state.unit=Number(l.lesson_number)-1;else if(state.module>1){state.module--;state.unit=lessons(state.module).length||1}renderAll();scrollTo(0,0)};
 $('completeLesson').onclick=async()=>{const b=$('completeLesson');b.disabled=true;b.textContent='Saving…';try{if(!complete){const now=new Date().toISOString();const r=await db.from('lesson_progress').upsert({student_id:state.user.id,lesson_id:l.id,completed:true,completed_at:now,updated_at:now},{onConflict:'student_id,lesson_id'});if(r.error)throw r.error;state.progress.push({lesson_id:l.id,completed:true,completed_at:now})}if(Number(l.lesson_number)<ls.length){state.unit=Number(l.lesson_number)+1;renderAll();scrollTo(0,0);return}const t=assessment(state.module,'formative')?'formative':assessment(state.module,'summative')?'summative':null;if(t){location.assign(`module-assessment.html?course=${encodeURIComponent(state.course.id)}&module=${state.module}&type=${t}`);return}renderAll()}catch(e){console.error(e);show('Lesson completion could not be saved.');b.disabled=false;b.textContent='Complete Lesson & Continue →'}}
}
function renderAll(){if(!$('course-content'))return;$('sidebarCourse').textContent=state.course.title||'Selected Course';const p=progressPct();$('progressText').textContent=p+'%';$('progressFill').style.width=p+'%';renderSidebar();renderLesson()}
async function init(){
 try{
  const courseId=new URLSearchParams(location.search).get('id')||new URLSearchParams(location.search).get('course');
  if(!courseId){show('No course was selected.');return}
  const {data:{user},error:ae}=await db.auth.getUser();if(ae||!user){location.replace('login.html?next='+encodeURIComponent(location.pathname+location.search));return}state.user=user;
  const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error('Course loading timed out. Please retry.')),15000));
  const request=db.rpc('get_learning_workspace_course',{p_course_id:courseId});
  const {data,error}=await Promise.race([request,timeout]);if(error)throw error;if(!data?.ok)throw new Error(data?.message||'Unable to open this course.');
  state.studentId=data.student_id||user.id;state.course=data.course;state.modules=data.modules||[];state.progress=data.progress||[];state.assessments=data.assessments||[];state.attempts=data.attempts||[];
  const firstOpen=state.modules.find(m=>unlocked(Number(m.module_number)))||state.modules[0];state.module=Number(firstOpen?.module_number||1);state.unit=1;
  renderAll();
 }catch(e){console.error(e);$('course-content').innerHTML='<div class="message">Unable to load course content: '+esc(e.message||'Please try again.')+'</div>'}
}
$('logout')?.addEventListener('click',async()=>{await db.auth.signOut();location.href='login.html'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
