// FUNDA ONLINE ACADEMY — DEDICATED STUDENT ASSESSMENTS CENTRE
(function(){
'use strict';
if(!/dashboard\.html$/i.test(location.pathname))return;
let db=null,state={user:null,enrolments:[],courses:[],modules:[],assessments:[],progress:[],attempts:[],required:{}};
const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const approved=e=>['approved','active','enrolled','completed'].includes(String(e.enrollment_status||e.status||'').toLowerCase());
const typeOf=a=>/summative/i.test(a.title||'')?'summative':/formative/i.test(a.title||'')?'formative':'assessment';
function css(){if(document.getElementById('studentAssessmentsCss'))return;const s=document.createElement('style');s.id='studentAssessmentsCss';s.textContent=`
#studentAssessmentsCentre{max-width:1180px;margin:22px auto;padding:0 18px}.saHead{background:linear-gradient(135deg,#fffdf7,#fff5dc);border:1px solid #ead8a6;border-radius:22px;padding:22px}.saK{font-size:9px;letter-spacing:.18em;font-weight:900;color:#b58216}.saHead h2{margin:6px 0;color:#17324a;font:900 24px "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.saHead p{margin:0;color:#263746;font-size:13px;line-height:1.65;font-weight:650}.saGuide{margin:18px 19px 0;padding:18px;border:1px solid #e1c774;border-radius:17px;background:linear-gradient(145deg,#fffdf7,#fff8e7)}.saGuideTop{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.saGuideTop h4{margin:0;color:#06152f;font:900 17px/1.3 "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.saGuideTop p{margin:5px 0 0;color:#263746;font-size:11px;line-height:1.55;font-weight:700}.saGuideBadge{flex:0 0 auto;padding:6px 9px;border-radius:999px;background:#071d49;color:#fff;font-size:9px;font-weight:900}.saGuideStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin-top:14px}.saGuideStat{padding:11px;border:1px solid #ead8a6;border-radius:12px;background:#fff}.saGuideStat small{display:block;color:#5e6c79;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}.saGuideStat strong{display:block;margin-top:4px;color:#06152f;font-size:13px;line-height:1.35}.saGuideFlow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:14px}.saGuideStep{position:relative;padding:11px;border-radius:12px;background:#071d49;color:#fff;min-height:108px}.saGuideStep b{display:grid;place-items:center;width:25px;height:25px;border-radius:8px;background:#e4c777;color:#06152f;font-size:10px}.saGuideStep strong{display:block;margin-top:8px;color:#fff;font-size:11px}.saGuideStep span{display:block;margin-top:4px;color:#e9f1ff;font-size:9px;line-height:1.45;font-weight:650}.saCompetence{margin-top:14px;padding:13px 14px;border-radius:12px;background:#fff;border:1px solid #d8e0e8;color:#263746;font-size:11px;line-height:1.6;font-weight:700}.saCompetence strong{color:#06152f}.saCourse{margin-top:18px;background:#fff;border:1px solid #dfe5ea;border-radius:20px;overflow:hidden}.saCourseHead{padding:17px 19px;background:#f8fafb;border-bottom:1px solid #e4e8ec}.saCourseHead h3{margin:0;color:#17324a;font:900 15px "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.saModule{padding:17px 19px;border-bottom:1px solid #edf0f2}.saModuleTitle{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.saModuleTitle b{color:#17324a;font-size:13px}.saModuleTitle span{font-size:10px;color:#6f7c89}.saGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.saCard{border:1px solid #e0e5e9;border-radius:14px;padding:13px}.saCard.locked{background:#f8f9fa}.saCard h4{margin:0 0 5px;color:#17324a;font-size:12px}.saCard p{margin:8px 0;color:#697684;font-size:10px;line-height:1.5}.saBadge{display:inline-block;border-radius:999px;padding:5px 8px;font-size:8px;font-weight:900;background:#eef2f5;color:#566573}.saBadge.ready{background:#e8f6ed;color:#21663b}.saBadge.done{background:#fff1c9;color:#79550b}.saBtn{display:inline-flex;margin-top:4px;padding:9px 11px;border-radius:10px;background:#17324a;color:#fff!important;text-decoration:none;font-size:9px;font-weight:900}.saBtn.disabled{background:#d9dee2;color:#7c8790!important;pointer-events:none}.saEmpty{padding:24px;text-align:center;color:#687684;font-size:12px}@media(max-width:980px){.saGuideStats{grid-template-columns:1fr 1fr}.saGuideFlow{grid-template-columns:1fr 1fr}.saGuideStep:last-child{grid-column:1/-1}}@media(max-width:700px){.saGrid,.saGuideStats,.saGuideFlow{grid-template-columns:1fr}.saGuideStep:last-child{grid-column:auto}.saGuideTop{display:block}.saGuideBadge{display:inline-flex;margin-top:9px}.saModuleTitle{display:block}.saModuleTitle span{display:block;margin-top:5px}}`;document.head.appendChild(s)}
function mount(){let r=document.getElementById('studentAssessmentsCentre');if(!r){r=document.createElement('section');r.id='studentAssessmentsCentre';r.hidden=true;(document.getElementById('dashboardContent')||document.body).appendChild(r)}return r}
async function load(){if(!window.supabase)return;db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);const {data:{user}}=await db.auth.getUser();if(!user)return;state.user=user;const {data:ens}=await db.from('enrollments').select('id,course_id,enrollment_status,status').eq('student_id',user.id);state.enrolments=(ens||[]).filter(approved);const ids=[...new Set(state.enrolments.map(e=>e.course_id).filter(Boolean))];if(!ids.length){render();return}const rs=await Promise.all([db.from('courses').select('id,title').in('id',ids),db.from('course_modules').select('id,course_id,module_number,module_name').in('course_id',ids).order('module_number'),db.from('assessments').select('id,course_id,module_id,title').in('course_id',ids).eq('active',true).eq('status','published'),db.from('module_progress').select('module_id,completed,completed_at').eq('student_id',user.id),db.from('assessment_attempts').select('assessment_id,attempt_number,percentage,passed,submitted_at').eq('student_id',user.id)]);state.courses=rs[0].data||[];state.modules=rs[1].data||[];state.assessments=rs[2].data||[];state.progress=rs[3].data||[];state.attempts=rs[4].data||[];state.required={};for(const cid of ids){const rq=await db.rpc('get_required_course_assessments',{p_course_id:cid});state.required[String(cid)]=rq.error?[]:(rq.data||[])}render()}
const moduleDone=id=>state.progress.some(p=>String(p.module_id)===String(id)&&p.completed===true);
function aState(a,done){const ats=state.attempts.filter(x=>String(x.assessment_id)===String(a.id)),passed=ats.some(x=>x.passed===true);if(passed)return{label:'Passed',cls:'done',msg:'Completed successfully. Your passing result is recorded.',open:true};if(!done)return{label:'Locked',cls:'',msg:'Complete all lessons in this module to unlock this assessment.',open:false};if(typeOf(a)==='summative'){const f=state.assessments.find(x=>String(x.module_id)===String(a.module_id)&&typeOf(x)==='formative');if(f&&!state.attempts.some(x=>String(x.assessment_id)===String(f.id)&&x.passed===true))return{label:'Locked',cls:'',msg:'Pass the module formative assessment first.',open:false}}if(ats.length>=3)return{label:'Finalised',cls:'done',msg:'All permitted attempts have been used.',open:false};return{label:ats.length?'Ready to retry':'Ready',cls:'ready',msg:ats.length?'Review the module and continue when ready.':'Module completed. You may start this assessment.',open:true}}
function card(a,m,done){const st=aState(a,done),type=typeOf(a),href=`module-assessment.html?course=${encodeURIComponent(m.course_id)}&module=${m.module_number}&type=${type}`;return `<article class="saCard ${st.open?'':'locked'}"><h4>${type==='formative'?'Formative Assessment':'Summative Assessment'}</h4><span class="saBadge ${st.cls}">${esc(st.label)}</span><p>${esc(st.msg)}</p><a class="saBtn ${st.open?'':'disabled'}" ${st.open?`href="${href}"`:'aria-disabled="true"'}>${st.open?'Open Assessment':'🔒 Locked'}</a></article>`}
function pctText(mark,total){
  const m=Number(mark),t=Number(total);
  if(!Number.isFinite(m)||!Number.isFinite(t)||t<=0)return '';
  return Math.round((m/t)*1000)/10+'%';
}
function guideForCourse(c){
  const required=state.required[String(c.id)]||[];
  if(!required.length)return '<div class="saGuide"><div class="saGuideTop"><div><h4>Your course assessment procedure</h4><p>The Academy will show your confirmed assessment requirements here when they are available for this course.</p></div><span class="saGuideBadge">COURSE-SPECIFIC</span></div></div>';
  const formative=required.filter(r=>String(r.assessment_type||'').toLowerCase()==='formative');
  const summative=required.filter(r=>String(r.assessment_type||'').toLowerCase()==='summative');
  const other=required.filter(r=>!['formative','summative'].includes(String(r.assessment_type||'').toLowerCase()));
  let pattern='';
  if(formative.length&&summative.length)pattern=`${formative.length} formative + ${summative.length} summative`;
  else if(summative.length&&!formative.length)pattern=`${summative.length} summative only`;
  else if(formative.length&&!summative.length)pattern=`${formative.length} formative only`;
  else pattern=`${required.length} required assessment${required.length===1?'':'s'}`;
  let questionRule='Configured per assessment';
  let passRule='70% minimum';
  if(summative.length&&!formative.length&&!other.length)questionRule='25 questions per summative';
  else if(formative.length&&summative.length&&!other.length)questionRule='15 formative • 25 summative';
  else if(formative.length&&!summative.length&&!other.length)questionRule='15 questions per formative';
  if(other.length&&required.length===1){
    const one=other[0],total=Number(one.configured_total_marks),pass=Number(one.configured_pass_mark);
    if(Number.isFinite(total)&&Number.isFinite(pass)&&total>0){
      if(pass<=total){questionRule=`${total} marks/questions`;passRule=`${pass} / ${total} (${pctText(pass,total)})`}
      else if(pass<=100){questionRule=`${total} marks/questions`;passRule=`${pass}% minimum`}
    }
  }
  const liveMark=formative.length||summative.length;
  const correctRule=liveMark
    ?(formative.length&&summative.length?'Formative: at least 11/15 • Summative: at least 18/25':summative.length?'At least 18/25 correct':formative.length?'At least 11/15 correct':'')
    :'';
  const sequence=formative.length&&summative.length
    ?'Complete the module lessons, pass the formative assessment, then the summative assessment unlocks.'
    :summative.length
      ?'Complete the module lessons and the module summative assessment unlocks.'
      :'Complete the required learning before attempting each assessment shown by the Academy.';
  const allRule=required.length===1?'the required assessment':'all '+required.length+' required assessments';
  return `<div class="saGuide"><div class="saGuideTop"><div><h4>Your course assessment procedure</h4><p>This guide is based on the assessment structure currently attached to <strong>${esc(c.title)}</strong>.</p></div><span class="saGuideBadge">COURSE-SPECIFIC</span></div><div class="saGuideStats"><div class="saGuideStat"><small>Expected assessments</small><strong>${required.length}</strong></div><div class="saGuideStat"><small>Assessment pattern</small><strong>${esc(pattern)}</strong></div><div class="saGuideStat"><small>Question structure</small><strong>${esc(questionRule)}</strong></div><div class="saGuideStat"><small>Pass requirement</small><strong>${esc(passRule)}${correctRule?`<br><small style="font-size:9px;color:#52657a">${esc(correctRule)}</small>`:''}</strong></div></div><div class="saGuideFlow"><div class="saGuideStep"><b>1</b><strong>Complete the module</strong><span>Finish every required lesson in sequence before the assessment opens.</span></div><div class="saGuideStep"><b>2</b><strong>Unlock the assessment</strong><span>${esc(sequence)}</span></div><div class="saGuideStep"><b>3</b><strong>Answer every question</strong><span>Questions are completed one at a time and every question must be answered before submission.</span></div><div class="saGuideStep"><b>4</b><strong>Meet the pass mark</strong><span>Module assessments require 70%. Up to three attempts are permitted where the current assessment engine applies.</span></div><div class="saGuideStep"><b>5</b><strong>Complete the course result</strong><span>Every required assessment must reach a passing status before the course result can be treated as passed.</span></div></div><div class="saCompetence"><strong>Competence and certification:</strong> Passing one assessment does not cancel a failed required assessment. You must pass ${esc(allRule)}. Once all required assessments are complete and passed, your course result can proceed through the Academy's academic finalisation and review process. A certificate is issued only after those requirements are satisfied and the Academy formally issues it; completing an assessment does not issue a certificate automatically.</div></div>`;
}
function render(){const root=mount();let h=`<div class="saHead"><div class="saK">STUDENT ASSESSMENTS</div><h2>My Assessments</h2><p>Assessments are organised by course and module. Complete the module first to unlock its assessment. Where both types apply, pass the formative assessment before the summative assessment opens.</p></div>`;if(!state.courses.length)h+=`<div class="saCourse"><div class="saEmpty">No assessments are available yet. They will appear after your course enrolment is approved.</div></div>`;state.courses.forEach(c=>{h+=`<div class="saCourse"><div class="saCourseHead"><h3>${esc(c.title)}</h3></div>${guideForCourse(c)}`;state.modules.filter(m=>String(m.course_id)===String(c.id)).forEach(m=>{const list=state.assessments.filter(a=>String(a.module_id)===String(m.id));if(!list.length)return;const done=moduleDone(m.id);list.sort((a,b)=>typeOf(a)==='formative'?-1:typeOf(b)==='formative'?1:0);h+=`<div class="saModule"><div class="saModuleTitle"><b>Module ${m.module_number} · ${esc(m.module_name)}</b><span>${done?'Module complete':'Module in progress · assessments locked'}</span></div><div class="saGrid">${list.map(a=>card(a,m,done)).join('')}</div></div>`});h+='</div>'});root.innerHTML=h}
function show(){
 const dc=document.getElementById('dashboardContent');
 if(dc)[...dc.children].forEach(x=>{if(x.id!=='studentAssessmentsCentre')x.style.setProperty('display','none','important')});
 const r=mount();r.hidden=false;r.style.setProperty('display','block','important');
 document.body.dataset.sdView='assessments';
 document.querySelectorAll('#sdSide [data-sd-key]').forEach(x=>x.classList.toggle('active',x.dataset.sdKey==='assessments'));
 document.getElementById('sdSide')?.classList.remove('open');
 document.getElementById('sdOverlay')?.classList.remove('open');
 document.body.style.overflow='';
 if(!r.innerHTML.trim())render();
 window.scrollTo({top:0,behavior:'smooth'})
}
function wire(){
 const a=document.querySelector('#sdSide [data-sd-key="assessments"]');if(!a)return false;
 if(a.dataset.assessmentCentreWired)return true;
 a.dataset.assessmentCentreWired='1';
 a.onclick=function(e){e.preventDefault();e.stopPropagation();show();return false};
 return true
}
function boot(){
 css();mount();load();
 let n=0,t=setInterval(()=>{n++;if(wire()||n>60)clearInterval(t)},250);
 document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#sdSide [data-sd-key="assessments"]');if(a){e.preventDefault();e.stopPropagation();show()}},true)
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();