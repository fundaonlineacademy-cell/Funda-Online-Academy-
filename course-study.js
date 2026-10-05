// FUNDA ONLINE ACADEMY — LEARNING WORKSPACE
'use strict';
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=v=>v==null?'':String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#039;");
const state={user:null,studentId:null,course:null,modules:[],progress:[],assessments:[],attempts:[],notes:[],notesLoaded:false,notePage:1,activeLessonId:null,module:1,unit:1,stage:0,studyToolsWired:false};
const NOTE_PAGE_SIZE=10;
const STUDY_TOOLS_OPEN_KEY='funda-study-tools-open';
const doneSet=()=>new Set(state.progress.filter(x=>x.completed).map(x=>String(x.lesson_id)));
const passedAssessmentSet=()=>new Set(state.attempts.filter(x=>x.passed).map(x=>String(x.assessment_id)));
const mod=n=>state.modules.find(x=>Number(x.module_number)===Number(n));
const lessons=n=>(mod(n)?.lessons||[]).slice().sort((a,b)=>Number(a.lesson_number)-Number(b.lesson_number));
const assessment=(n,t)=>{const m=mod(n);return m?state.assessments.find(a=>a.module_id===m.id&&String(a.title||'').toLowerCase().includes(t)):null};
const passed=(n,t)=>{const a=assessment(n,t);return !!a&&state.attempts.some(x=>x.assessment_id===a.id&&x.passed)};
const unlocked=n=>Number(n)===1||passed(Number(n)-1,'summative');

function injectLessonStandardCss(){
 if(document.getElementById('foaLessonStandardCss'))return;
 const s=document.createElement('style');
 s.id='foaLessonStandardCss';
 s.textContent=`
 .foaLessonSticky{position:sticky;top:72px;z-index:18;margin:0 0 16px;padding:12px 0 14px;background:rgba(244,248,253,.97);backdrop-filter:blur(10px);border-bottom:1px solid #dce6f2}
 .foaLessonSticky h1{font-size:clamp(25px,3.2vw,36px);margin:6px 0 8px}
 .foaStageMeta{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:10px 0 18px;padding:11px 13px;border:1px solid #d9e4f2;border-radius:14px;background:#fff}
 .foaStageMeta strong{color:#06152f;font-size:13px}.foaStageMeta span{color:#64748b;font-size:11px;font-weight:700}
 .foaStageTrack{height:7px;border-radius:99px;background:#e4ebf3;overflow:hidden;margin-bottom:18px}.foaStageTrack i{display:block;height:100%;background:linear-gradient(90deg,#2767c6,#c99a2e);border-radius:99px}
 .foaStageTitle{margin:0 0 12px;color:#06152f;font-size:21px;font-weight:800}
 .foaStageIntro{margin:0 0 14px;color:#5f7185;font-size:12px;font-weight:700;line-height:1.55}
 .lesson-glossary table,.lesson-table-wrap table,.card table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13px}
 .lesson-glossary th,.lesson-glossary td,.lesson-table-wrap th,.lesson-table-wrap td,.card th,.card td{border:1px solid #d9e4f2;padding:10px 11px;vertical-align:top;text-align:left;line-height:1.55}
 .lesson-glossary th,.lesson-table-wrap th,.card th{background:#071d49;color:#fff;font-weight:800}
 .card details{margin-top:14px;border:1px solid #d9e4f2;border-radius:13px;background:#f8fbff;padding:12px 14px}.card details summary{cursor:pointer;color:#0b2f70;font-weight:800}
 .foaQuizQuestion{margin:14px 0;padding:15px;border:1px solid #d7e3f1;border-radius:15px;background:#fff}.foaQuizQuestion h3{margin:0 0 10px;color:#06152f;font-size:14px}
 .foaQuizOption{display:flex;gap:10px;align-items:flex-start;margin:8px 0;padding:10px 11px;border:1px solid #dce6f2;border-radius:11px;background:#fbfdff;cursor:pointer}.foaQuizOption input{margin-top:3px}.foaQuizOption span{font-size:12px;line-height:1.45;color:#334a62}
 .foaQuizFeedback{margin-top:8px;padding:9px 10px;border-radius:9px;background:#eef6ff;color:#23466c;font-size:11px;line-height:1.5}.foaQuizFeedback.correct{background:#eaf7ef;color:#176b50}.foaQuizFeedback.incorrect{background:#fff3df;color:#80580b}
 .foaQuizResult{margin-top:14px;padding:14px;border-radius:13px;background:#071d49;color:#fff}.foaQuizResult strong{color:#f0cf78;font-size:18px}.foaQuizActions{display:flex;gap:9px;flex-wrap:wrap;margin-top:12px}
 .foaNav{display:flex;justify-content:space-between;gap:12px;margin-top:22px}.foaNav .btn{min-width:150px}
 @media(max-width:760px){.foaLessonSticky{top:64px}.foaLessonSticky h1{font-size:24px}.foaStageMeta{align-items:flex-start;flex-direction:column}.foaNav{flex-direction:column-reverse}.foaNav .btn{width:100%}.lesson-glossary,.lesson-table-wrap,.card{overflow-x:auto}}
 `;
 document.head.appendChild(s);
}
function show(message,success=false){const box=$('message');if(!box)return;box.textContent=message;box.style.display='block';box.className='message'+(success?' success':'')}
function savedNoteKey(lessonId){return `funda-note-${state.user?.id||'student'}-${state.course?.id||'course'}-${lessonId}`}
function savedNoteTimeKey(lessonId){return `${savedNoteKey(lessonId)}-updated`}
function draftNoteKey(lessonId){return `${savedNoteKey(lessonId)}-draft`}
function lessonIndex(){
 const out=[];
 state.modules.forEach(m=>(m.lessons||[]).forEach(l=>out.push({lesson:l,moduleNumber:Number(m.module_number),lessonNumber:Number(l.lesson_number)})));
 return out;
}
function lessonMeta(lessonId){return lessonIndex().find(x=>String(x.lesson.id)===String(lessonId))||null}
function localCourseNotes(){
 return lessonIndex().map(({lesson})=>{
  const text=localStorage.getItem(savedNoteKey(lesson.id));
  if(!String(text||'').trim())return null;
  const updatedAt=localStorage.getItem(savedNoteTimeKey(lesson.id))||null;
  return {id:`local-${lesson.id}`,student_id:state.user?.id,course_id:state.course?.id,lesson_id:lesson.id,note_text:text,created_at:updatedAt,updated_at:updatedAt,local_only:true};
 }).filter(Boolean)
}
function replaceNote(note){
 const i=state.notes.findIndex(x=>String(x.lesson_id)===String(note.lesson_id));
 if(i===-1)state.notes.push(note);else state.notes.splice(i,1,note);
}
function noteTime(value){
 if(!value)return 'Saved on this device';
 const d=new Date(value);if(Number.isNaN(d.getTime()))return 'Saved';
 return new Intl.DateTimeFormat('en-ZA',{dateStyle:'medium',timeStyle:'short'}).format(d);
}
function setNoteStatus(message='',kind=''){
 const host=$('noteSaveStatus');if(!host)return;
 host.textContent=message;host.className='note-save-status'+(kind?' '+kind:'');
}
function renderSavedNotes(){
 const host=$('savedNotesList'),pages=$('savedNotesPages'),count=$('savedNotesCount');if(!host||!pages)return;
 const notes=state.notes.filter(n=>String(n.note_text||'').trim()).sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));
 if(count)count.textContent=`(${notes.length})`;
 const totalPages=Math.max(1,Math.ceil(notes.length/NOTE_PAGE_SIZE));state.notePage=Math.min(Math.max(1,state.notePage),totalPages);
 const start=(state.notePage-1)*NOTE_PAGE_SIZE,pageNotes=notes.slice(start,start+NOTE_PAGE_SIZE);
 host.innerHTML=pageNotes.length?pageNotes.map(n=>{
  const meta=lessonMeta(n.lesson_id),label=meta?`Module ${meta.moduleNumber} · Lesson ${meta.lessonNumber}`:'Saved lesson note',title=meta?.lesson?.title||'Lesson note';
  return `<details class="saved-note"><summary><span class="saved-note-title">${esc(label)} — ${esc(title)}</span><span class="saved-note-meta">${esc(noteTime(n.updated_at))}${n.local_only?' · device copy':''}</span></summary><p class="saved-note-text">${esc(n.note_text)}</p></details>`
 }).join(''):'<div class="saved-notes-empty">Your saved lesson notes will appear here. They stay grouped by lesson, so this panel remains easy to use.</div>';
 pages.hidden=totalPages<=1;
 pages.innerHTML=totalPages>1?`<button type="button" id="previousNotesPage" ${state.notePage===1?'disabled':''}>← Previous</button><span>Page ${state.notePage} of ${totalPages}</span><button type="button" id="nextNotesPage" ${state.notePage===totalPages?'disabled':''}>Next →</button>`:'';
 $('previousNotesPage')?.addEventListener('click',()=>{state.notePage--;renderSavedNotes()});
 $('nextNotesPage')?.addEventListener('click',()=>{state.notePage++;renderSavedNotes()});
}
function showNotesTab(name='write'){
 const saved=name==='saved',writeTab=$('writeNoteTab'),savedTab=$('savedNotesTab'),writePanel=$('writeNotePanel'),savedPanel=$('savedNotesPanel');
 if(!writeTab||!savedTab||!writePanel||!savedPanel)return;
 writeTab.classList.toggle('active',!saved);savedTab.classList.toggle('active',saved);
 writeTab.setAttribute('aria-selected',String(!saved));savedTab.setAttribute('aria-selected',String(saved));
 writePanel.hidden=saved;savedPanel.hidden=!saved;if(saved)renderSavedNotes();
}
function setStudyToolsOpen(open,{remember=true,focus=false}={}){
 const shell=$('learningShell'),panel=$('studyToolsPanel'),toggle=$('studyToolsToggle');if(!shell||!panel)return;
 const desktop=window.matchMedia('(min-width:1051px)').matches;
 if(desktop){
  shell.classList.toggle('tools-collapsed',!open);panel.classList.remove('open');document.body.classList.remove('studytools-open');
  if(remember)localStorage.setItem(STUDY_TOOLS_OPEN_KEY,String(open));
 }else{
  shell.classList.add('tools-collapsed');panel.classList.toggle('open',open);document.body.classList.toggle('studytools-open',open);
 }
 panel.setAttribute('aria-hidden',String(!open));toggle?.setAttribute('aria-expanded',String(open));
 document.querySelectorAll('#scrollNotes,#scrollNotesInner').forEach(b=>b.setAttribute('aria-expanded',String(open)));
 if(open&&focus)setTimeout(()=>$('closeStudyTools')?.focus(),0);
}
function openStudyTools(tab='write'){
 showNotesTab(tab);setStudyToolsOpen(true,{focus:true});
}
function wireStudyToolsShell(){
 if(state.studyToolsWired)return;state.studyToolsWired=true;
 $('studyToolsToggle')?.addEventListener('click',()=>openStudyTools('write'));
 $('scrollNotes')?.addEventListener('click',()=>openStudyTools('write'));
 $('openModules')?.addEventListener('click',()=>$('modulePanel')?.classList.toggle('open'));
 $('closeStudyTools')?.addEventListener('click',()=>setStudyToolsOpen(false,{focus:false}));
 $('studyToolsBackdrop')?.addEventListener('click',()=>setStudyToolsOpen(false,{focus:false}));
 $('writeNoteTab')?.addEventListener('click',()=>showNotesTab('write'));
 $('savedNotesTab')?.addEventListener('click',()=>showNotesTab('saved'));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('studyToolsPanel')?.getAttribute('aria-hidden')==='false')setStudyToolsOpen(false,{focus:false})});
 const media=window.matchMedia('(min-width:1051px)');
 media.addEventListener?.('change',e=>setStudyToolsOpen(e.matches&&localStorage.getItem(STUDY_TOOLS_OPEN_KEY)==='true',{remember:false,focus:false}));
 setStudyToolsOpen(media.matches&&localStorage.getItem(STUDY_TOOLS_OPEN_KEY)==='true',{remember:false,focus:false});
}
function noteForLesson(lessonId){return state.notes.find(n=>String(n.lesson_id)===String(lessonId))||null}
function activateLessonNotes(lesson,{refresh=false}={}){
 const field=$('lessonNotes'),button=$('saveNotes');if(!field||!button)return;
 const lessonId=String(lesson.id),changed=field.dataset.lessonId!==lessonId;state.activeLessonId=lessonId;
 if(changed||(refresh&&field.dataset.dirty!=='true')){
  const draft=localStorage.getItem(draftNoteKey(lessonId)),saved=noteForLesson(lessonId);
  field.value=draft!==null?draft:String(saved?.note_text||'');field.dataset.lessonId=lessonId;field.dataset.dirty=draft!==null?'true':'false';setNoteStatus();
 }
 field.oninput=()=>{field.dataset.dirty='true';localStorage.setItem(draftNoteKey(lessonId),field.value);setNoteStatus('Not saved yet')};
 button.onclick=()=>saveLessonNote(lesson,field,button);renderSavedNotes();
}
async function saveLessonNote(lesson,field,button){
 const text=String(field.value||'').trim();if(!text){setNoteStatus('Write a note before saving.','warning');field.focus();return}
 const now=new Date().toISOString();state.noteLoadToken++;button.disabled=true;button.textContent='Saving…';
 localStorage.setItem(savedNoteKey(lesson.id),text);localStorage.setItem(savedNoteTimeKey(lesson.id),now);localStorage.removeItem(draftNoteKey(lesson.id));field.dataset.dirty='false';
 replaceNote({id:`local-${lesson.id}`,student_id:state.user.id,course_id:state.course.id,lesson_id:lesson.id,note_text:text,created_at:now,updated_at:now,local_only:true});renderSavedNotes();
 try{
  const {data,error}=await db.from('student_lesson_notes').upsert({student_id:state.user.id,course_id:state.course.id,lesson_id:lesson.id,note_text:text,updated_at:now},{onConflict:'student_id,lesson_id'}).select('id,student_id,course_id,lesson_id,note_text,created_at,updated_at').single();
  if(error)throw error;replaceNote(data);renderSavedNotes();setNoteStatus('Saved to your account.','success');
 }catch(error){console.warn('Lesson note account sync paused',error);setNoteStatus('Saved on this device. Select Save Note again when connected.','warning')}
 finally{button.disabled=false;button.textContent='Save Note'}
}
async function loadCourseNotes(){
 const token=++state.noteLoadToken;const local=localCourseNotes();
 try{
  const {data,error}=await db.from('student_lesson_notes').select('id,student_id,course_id,lesson_id,note_text,created_at,updated_at').eq('student_id',state.user.id).eq('course_id',state.course.id).order('updated_at',{ascending:false});
  if(error)throw error;if(state.noteLoadToken!==token)return;
  const merged=new Map((data||[]).map(n=>[String(n.lesson_id),n]));
  local.forEach(n=>{const remote=merged.get(String(n.lesson_id));if(!remote||new Date(n.updated_at||0)>new Date(remote.updated_at||0))merged.set(String(n.lesson_id),n)});
  state.notes=[...merged.values()];state.notesLoaded=true;renderSavedNotes();
  const active=lessonMeta(state.activeLessonId)?.lesson;if(active)activateLessonNotes(active,{refresh:true});
 }catch(error){
  console.warn('Lesson notes loaded from device fallback',error);if(state.noteLoadToken!==token)return;
  state.notes=local;state.notesLoaded=true;renderSavedNotes();const active=lessonMeta(state.activeLessonId)?.lesson;if(active)activateLessonNotes(active,{refresh:true});
 }
}
function asHtml(v){const s=String(v||'').trim();if(!s)return '';if(/<\/?[a-z][\s\S]*>/i.test(s))return s;return s.split(/\n\s*\n/).map(p=>'<p>'+esc(p).replace(/\n/g,'<br>')+'</p>').join('')}
function section(title,value,cls=''){if(!String(value||'').trim())return '';return `<section class="card ${cls}"><h2>${esc(title)}</h2><div>${asHtml(value)}</div></section>`}
function progressPct(){
 const lessonTotal=state.modules.reduce((n,m)=>n+(m.lessons?.length||0),0);
 const assessmentTotal=state.assessments.length;
 const total=lessonTotal+assessmentTotal;
 const completed=doneSet().size+passedAssessmentSet().size;
 return total?Math.min(100,Math.round(completed/total*100)):0;
}
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
 host.querySelectorAll('.unit:not(.locked)').forEach(b=>b.onclick=()=>{
  state.module=Number(b.dataset.m);
  if(b.dataset.type){location.assign(`module-assessment.html?course=${encodeURIComponent(state.course.id)}&module=${state.module}&type=${b.dataset.type}`);return}
  state.unit=Number(b.dataset.u);state.stage=0;renderAll();if(innerWidth<761)$('modulePanel')?.classList.remove('open')
 })
}
function splitMainContent(value){
 const raw=String(value||'').trim();if(!raw)return [];
 const re=/<!--stage:([^>]+)-->/gi;let match,last=0,title='',out=[];
 while((match=re.exec(raw))){
  const before=raw.slice(last,match.index).trim();
  if(before)out.push({title:title||'Main Lesson Content',html:before});
  title=match[1].trim();last=re.lastIndex;
 }
 const tail=raw.slice(last).trim();if(tail)out.push({title:title||'Main Lesson Content',html:tail});
 if(!out.length)out=[{title:'Main Lesson Content',html:raw}];
 return out;
}
function parseKnowledge(value){
 const raw=String(value||'').trim();if(!raw||raw[0]!=='{')return null;
 try{const data=JSON.parse(raw);return Array.isArray(data.questions)&&data.questions.length?data:null}catch{return null}
}
function buildStages(l){
 const stages=[];
 if(String(l.lesson_overview||'').trim()||String(l.learning_objectives||'').trim())stages.push({kind:'start',title:'Lesson Start',html:`${section('Lesson Overview',l.lesson_overview,'hero-learning')}${section('Learning Outcomes',l.learning_objectives,'outcomes')}`});
 if(String(l.key_concepts||'').trim())stages.push({kind:'glossary',title:'Key Terms & Concepts',html:section('Key Terms & Concepts',l.key_concepts)});
 splitMainContent(l.main_content).forEach((part,i)=>stages.push({kind:'content',title:part.title||`Main Lesson Content ${i+1}`,html:section(part.title||'Main Lesson Content',part.html)}));
 if(String(l.examples||'').trim())stages.push({kind:'example',title:'Worked Example',html:section('Worked Example / Demonstration',l.examples)});
 if(String(l.case_study||'').trim())stages.push({kind:'case',title:'Workplace Scenario / Case Study',html:section('Workplace Scenario / Case Study',l.case_study)});
 if(String(l.practical_activity||'').trim())stages.push({kind:'practical',title:'Practical Activity',html:section('Practical Activity',l.practical_activity)});
 if(String(l.knowledge_check||'').trim())stages.push({kind:'knowledge',title:'Knowledge Check',html:'',quiz:parseKnowledge(l.knowledge_check),raw:l.knowledge_check});
 if(String(l.lesson_summary||'').trim())stages.push({kind:'summary',title:'Lesson Summary',html:section('Lesson Summary',l.lesson_summary)});
 return stages.length?stages:[{kind:'content',title:'Lesson Content',html:'<section class="card"><p>No lesson content is available yet.</p></section>'}];
}
function renderKnowledge(stage){
 if(!stage.quiz)return section('Knowledge Check',stage.raw,'knowledge');
 const qs=stage.quiz.questions;
 return `<section class="card knowledge"><h2>Knowledge Check</h2><p>This is a short self-check. It does not form part of your formal result and it will not block your progress.</p><form id="foaKnowledgeForm">${qs.map((q,qi)=>`<div class="foaQuizQuestion" data-q="${qi}"><h3>${qi+1}. ${esc(q.prompt)}</h3>${(q.options||[]).map((o,oi)=>`<label class="foaQuizOption"><input type="radio" name="q${qi}" value="${oi}"><span>${esc(o)}</span></label>`).join('')}<div class="foaQuizFeedback" id="foaFeedback${qi}" hidden></div></div>`).join('')}<div class="foaQuizActions"><button type="button" class="btn primary" id="foaCheckKnowledge">Check My Knowledge</button><button type="button" class="btn secondary" id="foaRetryKnowledge" hidden>Try Again</button></div><div class="foaQuizResult" id="foaQuizResult" hidden></div></form></section>`;
}
function wireKnowledge(stage){
 if(!stage.quiz)return;
 const form=$('foaKnowledgeForm'),check=$('foaCheckKnowledge'),retry=$('foaRetryKnowledge'),result=$('foaQuizResult');if(!form||!check)return;
 check.onclick=()=>{
  const qs=stage.quiz.questions;const chosen=qs.map((_,i)=>form.querySelector(`input[name="q${i}"]:checked`));
  if(chosen.some(x=>!x)){result.hidden=false;result.innerHTML='<strong>Complete all 5 questions first.</strong><div style="margin-top:5px">You can then check your understanding.</div>';return}
  let correct=0;
  qs.forEach((q,i)=>{
   const selected=Number(chosen[i].value),ok=selected===Number(q.answer);if(ok)correct++;
   const fb=$(`foaFeedback${i}`);if(fb){fb.hidden=false;fb.className='foaQuizFeedback '+(ok?'correct':'incorrect');fb.innerHTML=`<strong>${ok?'Correct':'Review this answer'}.</strong> ${esc(q.feedback||'')}`}
   form.querySelectorAll(`input[name="q${i}"]`).forEach(x=>x.disabled=true);
  });
  const pct=Math.round(correct/qs.length*100);result.hidden=false;result.innerHTML=`<strong>${correct} / ${qs.length} · ${pct}%</strong><div style="margin-top:5px">This score is for your own learning only and is not recorded as a formal result.</div>`;check.hidden=true;retry.hidden=false;
 };
 retry.onclick=()=>{renderLesson()};
}
function stageButtonLabel(l,ls,stageIndex,lastIndex){
 if(stageIndex<lastIndex)return 'Next →';
 if(Number(l.lesson_number)<ls.length)return 'Continue to Next Lesson →';
 if(assessment(state.module,'formative'))return 'Continue to Formative Assessment →';
 if(assessment(state.module,'summative'))return 'Continue to Summative Assessment →';
 return 'Finish Lesson →';
}
async function finishLesson(l,ls,complete){
 const b=$('nextStage');if(b){b.disabled=true;b.textContent='Saving…'};
 try{
  if(!complete){const now=new Date().toISOString();const r=await db.from('lesson_progress').upsert({student_id:state.user.id,lesson_id:l.id,completed:true,completed_at:now,updated_at:now},{onConflict:'student_id,lesson_id'});if(r.error)throw r.error;state.progress.push({lesson_id:l.id,completed:true,completed_at:now})}
  if(Number(l.lesson_number)<ls.length){state.unit=Number(l.lesson_number)+1;state.stage=0;renderAll();scrollTo(0,0);return}
  const t=assessment(state.module,'formative')?'formative':assessment(state.module,'summative')?'summative':null;
  if(t){location.assign(`module-assessment.html?course=${encodeURIComponent(state.course.id)}&module=${state.module}&type=${t}`);return}
  renderAll();
 }catch(e){console.error(e);show('Lesson completion could not be saved.');if(b){b.disabled=false;b.textContent='Continue →'}}
}
function renderLesson(){
 const ls=lessons(state.module);let l=ls.find(x=>Number(x.lesson_number)===Number(state.unit));if(!l){l=ls[0];state.unit=Number(l?.lesson_number||1)}if(!l){$('course-content').innerHTML='<div class="message">No lessons are configured for this module.</div>';return}
 const complete=doneSet().has(String(l.id)),stages=buildStages(l);state.stage=Math.max(0,Math.min(state.stage,stages.length-1));const st=stages[state.stage],pct=Math.round((state.stage+1)/stages.length*100);
 $('course-content').innerHTML=`
 <div class="mobiletools"><button id="openModulesInner">☰ Modules</button><button id="scrollNotesInner" aria-controls="studyToolsPanel" aria-expanded="false">✎ Notes &amp; Support</button></div>
 <div class="crumb">${esc(state.course.title)} / Module ${state.module} / Lesson ${l.lesson_number}</div>
 <section class="lessonhead foaLessonSticky"><div class="course-label">MODULE ${state.module} · LESSON ${l.lesson_number} OF ${ls.length}</div><h1>${esc(l.title)}</h1><div class="meta"><span class="pill">${complete?'Completed ✓':'In progress'}</span><span class="pill gold">Step ${state.stage+1} of ${stages.length}</span></div></section>
 <div class="foaStageMeta"><strong>${esc(st.title)}</strong><span>Move through this lesson one stage at a time.</span></div><div class="foaStageTrack"><i style="width:${pct}%"></i></div>
 ${st.kind==='knowledge'?renderKnowledge(st):st.html}
 <div class="foaNav"><button class="btn secondary" id="prevStage">← Back</button><button class="btn primary" id="nextStage">${stageButtonLabel(l,ls,state.stage,stages.length-1)}</button></div>`;
 $('openModulesInner')?.addEventListener('click',()=>$('modulePanel')?.classList.toggle('open'));
 $('scrollNotesInner')?.addEventListener('click',()=>openStudyTools('write'));
 $('scrollNotesInner')?.setAttribute('aria-expanded',String($('studyToolsPanel')?.getAttribute('aria-hidden')==='false'));
 wireKnowledge(st);activateLessonNotes(l);
 const prev=$('prevStage');prev.disabled=state.stage===0&&state.module===1&&Number(l.lesson_number)===1;
 prev.onclick=()=>{if(state.stage>0){state.stage--;renderLesson();scrollTo(0,0);return}if(Number(l.lesson_number)>1){state.unit=Number(l.lesson_number)-1;const prevLesson=lessons(state.module).find(x=>Number(x.lesson_number)===Number(state.unit));state.stage=Math.max(0,buildStages(prevLesson||{}).length-1)}else if(state.module>1){state.module--;state.unit=lessons(state.module).length||1;const prevLesson=lessons(state.module).find(x=>Number(x.lesson_number)===Number(state.unit));state.stage=Math.max(0,buildStages(prevLesson||{}).length-1)}renderAll();scrollTo(0,0)};
 $('nextStage').onclick=()=>{if(state.stage<stages.length-1){state.stage++;renderLesson();scrollTo(0,0);return}finishLesson(l,ls,complete)};
}
function renderAll(){if(!$('course-content'))return;$('sidebarCourse').textContent=state.course.title||'Selected Course';const p=progressPct();$('progressText').textContent=p+'%';$('progressFill').style.width=p+'%';renderSidebar();renderLesson()}
async function init(){
 try{
  injectLessonStandardCss();
  wireStudyToolsShell();
  const courseId=new URLSearchParams(location.search).get('id')||new URLSearchParams(location.search).get('course');
  if(!courseId){show('No course was selected.');return}
  const restored=window.FundaAuth?.restore?await window.FundaAuth.restore(db):await db.auth.getUser().then(result=>({user:result.data?.user||null,error:result.error||null,confirmedSignedOut:!result.error&&!result.data?.user}));
  if(!restored.user){if(restored.confirmedSignedOut)location.replace('login.html?reason=expired&next='+encodeURIComponent(location.pathname+location.search)+'&portal=student');else show('The secure connection could not be confirmed. You have not been signed out. Check your connection and refresh this page.');return}
  const user=restored.user;state.user=user;
  const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error('Course loading timed out. Please retry.')),15000));
  const request=db.rpc('get_learning_workspace_course',{p_course_id:courseId});
  const {data,error}=await Promise.race([request,timeout]);if(error)throw error;if(!data?.ok)throw new Error(data?.message||'Unable to open this course.');
  state.studentId=data.student_id||user.id;state.course=data.course;state.modules=data.modules||[];state.progress=data.progress||[];state.assessments=data.assessments||[];state.attempts=data.attempts||[];
  const openModules=state.modules.filter(m=>unlocked(Number(m.module_number))).sort((a,b)=>Number(a.module_number)-Number(b.module_number));
  const resumeModule=openModules[openModules.length-1]||state.modules[0];state.module=Number(resumeModule?.module_number||1);
  const pendingLesson=lessons(state.module).find(l=>!doneSet().has(String(l.id)));state.unit=Number(pendingLesson?.lesson_number||1);state.stage=0;renderAll();loadCourseNotes();
 }catch(e){console.error(e);$('course-content').innerHTML='<div class="message">Unable to load course content: '+esc(e.message||'Please try again.')+'</div>'}
}
$('logout')?.addEventListener('click',async()=>{await db.auth.signOut({scope:'local'});location.href='login.html'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();