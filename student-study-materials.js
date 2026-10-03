// FUNDA ONLINE ACADEMY - COURSE STUDY MATERIALS
(function(){
'use strict';
if(!/dashboard\.html$/i.test(location.pathname))return;
let db=null,state={user:null,courses:[],selectedCourseId:'',modules:[],materials:[],loadingCourse:false};
const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const ok=e=>['approved','active','enrolled','completed'].includes(String(e.enrollment_status||e.status||'').toLowerCase());
const typeLabel=v=>({study_guide:'Study Guide / Textbook',textbook:'Study Guide / Textbook',course_textbook:'Study Guide / Textbook',addendum:'Course Addendum',worksheet:'Workbook / Worksheet',workbook:'Workbook / Worksheet',reference:'Reference Document',reference_document:'Reference Document'}[String(v||'').toLowerCase()]||'Course Material');
function css(){
 if(document.getElementById('smCss'))return;
 const s=document.createElement('style');s.id='smCss';
 s.textContent='#studentStudyMaterialsSection{max-width:1180px;margin:22px auto;padding:0 18px}.smHead{background:linear-gradient(135deg,#fffdf7,#fff5dc);border:1px solid #ead8a6;border-radius:22px;padding:22px}.smHead h2{margin:6px 0;color:#17324a;font:900 24px "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.smHead p{margin:0;color:#657383;font-size:12px;line-height:1.65}.smK{font-size:9px;letter-spacing:.18em;font-weight:900;color:#b58216}.smCourse{margin-top:18px;background:#fff;border:1px solid #dfe5ea;border-radius:20px;overflow:hidden}.smCourseHead{padding:17px 19px;background:#f8fafb;border-bottom:1px solid #e4e8ec}.smCourseHead h3{margin:0;color:#17324a;font:900 15px "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.smList{padding:14px}.smCard{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;border:1px solid #e1e6ea;border-radius:14px;padding:14px;margin-bottom:10px}.smCard h4{margin:0;color:#17324a;font-size:13px}.smMeta{margin-top:5px;color:#6d7985;font-size:10px;line-height:1.5}.smTag{display:inline-block;margin-top:7px;padding:5px 8px;border-radius:999px;background:#fff2ca;color:#7a5713;font-size:8px;font-weight:900}.smBtn{padding:9px 11px;border-radius:10px;font-size:9px;font-weight:900;border:1px solid #17324a;color:#17324a;background:#fff}.smBtn.primary{background:#17324a;color:#fff}.smEmpty{padding:28px;text-align:center;color:#687684;font-size:12px;line-height:1.7}.smNote{margin:14px;padding:13px;border-radius:14px;background:#f8fafb;border:1px solid #e4e8ec;color:#5f6e7a;font-size:10px;line-height:1.6}.smOverview{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}.smMetric{padding:13px 14px;border:1px solid #dfe5ea;border-radius:14px;background:#fff;box-shadow:0 4px 14px rgba(20,49,77,.05)}.smMetric small{display:block;color:#667482;font-size:10px;font-weight:800}.smMetric strong{display:block;margin-top:5px;color:#06152f;font-size:18px}.smSelector{margin-top:14px;padding:17px 18px;border:1px solid #dfe5ea;border-radius:17px;background:linear-gradient(145deg,#fff,#f8fbff);box-shadow:0 5px 16px rgba(20,49,77,.05)}.smSelector label{display:block;color:#06152f;font-size:14px;font-weight:900}.smSelector p{margin:4px 0 12px;color:#607286;font-size:11px;line-height:1.5;font-weight:700}.smSelectorGrid{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.45fr);gap:10px}.smSelectorGrid input,.smSelectorGrid select{width:100%;min-height:45px;border:1px solid #cdd9e5;border-radius:11px;background:#fff;color:#183153;padding:9px 11px;font:700 12px/1.3 "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif;outline:none}.smSelectorGrid input:focus,.smSelectorGrid select:focus{border-color:#2767c6;box-shadow:0 0 0 3px rgba(39,103,198,.12)}.smSelectedHint{margin-top:9px;color:#52657a;font-size:10px;font-weight:800}.smLoading{margin-top:18px;padding:28px;text-align:center;border:1px solid #dfe5ea;border-radius:18px;background:#fff;color:#304459;font-size:12px;font-weight:800}@media(max-width:900px){.smOverview{grid-template-columns:1fr 1fr}}@media(max-width:700px){.smCard,.smSelectorGrid{grid-template-columns:1fr}}';
 document.head.appendChild(s);
}
function mount(){
 let r=document.getElementById('studentStudyMaterialsSection');
 if(!r){r=document.createElement('section');r.id='studentStudyMaterialsSection';r.hidden=true;(document.getElementById('dashboardContent')||document.body).appendChild(r)}
 return r;
}
async function signed(m){
 if(m.external_url)return m.external_url;
 if(!m.storage_path)return '';
 const {data}=await db.storage.from('course-study-materials').createSignedUrl(m.storage_path,1800);
 return data?.signedUrl||'';
}

let courseLoadToken=0;
function selectedCourse(){return state.courses.find(c=>String(c.id)===String(state.selectedCourseId))||null}
function resetSelectedData(){state.modules=[];state.materials=[]}
async function load(){
  if(!window.supabase)return;
  db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  const {data:{user}}=await db.auth.getUser();if(!user)return;
  state.user=user;
  const {data:ens,error:ee}=await db.from('enrollments')
    .select('course_id,enrollment_status,status,enrolled_at')
    .eq('student_id',user.id)
    .order('enrolled_at',{ascending:false});
  if(ee){console.error('Study material enrolments unavailable',ee);state.courses=[];render();return}
  const ids=[...new Set((ens||[]).filter(ok).map(e=>e.course_id).filter(Boolean))];
  if(!ids.length){state.courses=[];state.selectedCourseId='';resetSelectedData();render();return}
  const {data:courses,error:ce}=await db.from('courses').select('id,title').in('id',ids);
  if(ce){console.error('Study material courses unavailable',ce);state.courses=[];render();return}
  const byId=new Map((courses||[]).map(x=>[String(x.id),x]));
  state.courses=ids.map(id=>byId.get(String(id))).filter(Boolean);
  if(!state.courses.some(c=>String(c.id)===String(state.selectedCourseId)))state.selectedCourseId=String(state.courses[0]?.id||'');
  resetSelectedData();
  render();
  await loadSelectedCourse();
}
async function loadSelectedCourse(){
  const course=selectedCourse();if(!course)return;
  const token=++courseLoadToken;
  state.loadingCourse=true;resetSelectedData();render();
  try{
    const [mr,sr]=await Promise.all([
      db.from('course_modules').select('id,course_id,module_number,module_name').eq('course_id',course.id).order('module_number'),
      db.from('course_study_materials').select('*').eq('course_id',course.id).eq('published',true).order('sort_order')
    ]);
    if(token!==courseLoadToken)return;
    if(mr.error)throw mr.error;if(sr.error)throw sr.error;
    state.modules=mr.data||[];
    state.materials=sr.data||[];
  }catch(error){
    if(token!==courseLoadToken)return;
    console.error('Selected course study materials could not be loaded',error);
    resetSelectedData();
  }finally{
    if(token===courseLoadToken){state.loadingCourse=false;render()}
  }
}
function moduleName(id){
 const m=state.modules.find(x=>String(x.id)===String(id));
 return m?('Module '+m.module_number+' - '+m.module_name):'Whole Course';
}
async function openM(id,download){
 const m=state.materials.find(x=>String(x.id)===String(id));if(!m)return;
 const u=await signed(m);if(!u)return;
 if(download){
  const a=document.createElement('a');a.href=u;a.download=m.original_filename||m.title||'study-material';document.body.appendChild(a);a.click();a.remove();
 }else window.open(u,'_blank','noopener');
}

function materialStats(){
  const moduleMaterials=state.materials.filter(m=>m.module_id).length;
  const wholeCourse=state.materials.filter(m=>!m.module_id).length;
  return {published:state.materials.length,moduleMaterials,wholeCourse};
}
function renderControls(){
  if(!state.courses.length)return '';
  const stats=materialStats(),selected=selectedCourse();
  return `<div class="smOverview">
    <div class="smMetric"><small>Approved Courses</small><strong>${state.courses.length}</strong></div>
    <div class="smMetric"><small>Published Materials</small><strong>${state.loadingCourse?'—':stats.published}</strong></div>
    <div class="smMetric"><small>Module Materials</small><strong>${state.loadingCourse?'—':stats.moduleMaterials}</strong></div>
    <div class="smMetric"><small>Whole-Course Materials</small><strong>${state.loadingCourse?'—':stats.wholeCourse}</strong></div>
  </div>
  <div class="smSelector">
    <label for="smCourseSelect">Select a course to view study materials</label>
    <p>Only materials for the selected approved course are displayed below. Use the search box when you have several courses.</p>
    <div class="smSelectorGrid">
      <input id="smCourseSearch" type="search" autocomplete="off" placeholder="Search approved courses" aria-label="Search approved courses">
      <select id="smCourseSelect" aria-label="Select an approved course"></select>
    </div>
    <div class="smSelectedHint" id="smSelectedHint">${selected?`Currently viewing: ${esc(selected.title)}`:''}</div>
  </div>`;
}
function wireCourseControls(){
  const search=document.getElementById('smCourseSearch'),select=document.getElementById('smCourseSelect'),hint=document.getElementById('smSelectedHint');
  if(!select)return;
  function fill(query=''){
    const q=String(query||'').trim().toLowerCase();
    const matches=state.courses.filter(c=>!q||String(c.title||'').toLowerCase().includes(q));
    select.innerHTML='';
    if(!matches.length){
      const o=document.createElement('option');o.value='';o.textContent='No approved course matches your search';o.disabled=true;o.selected=true;select.appendChild(o);
      if(hint)hint.textContent='Try a different course name.';return;
    }
    const selectedVisible=matches.some(c=>String(c.id)===String(state.selectedCourseId));
    if(q&&!selectedVisible){
      const p=document.createElement('option');p.value='';p.textContent='Choose a matching course…';p.selected=true;select.appendChild(p);
    }
    matches.forEach(c=>{
      const o=document.createElement('option');o.value=String(c.id);o.textContent=c.title||'Approved Course';
      if(selectedVisible&&String(c.id)===String(state.selectedCourseId))o.selected=true;
      select.appendChild(o);
    });
    const cur=selectedCourse();if(hint&&cur)hint.textContent=`Currently viewing: ${cur.title}`;
  }
  fill('');
  search?.addEventListener('input',()=>fill(search.value));
  select.addEventListener('change',()=>{
    if(!select.value||String(select.value)===String(state.selectedCourseId))return;
    state.selectedCourseId=select.value;
    if(search)search.value='';
    loadSelectedCourse();
  });
}
function selectedCourseBody(){
  const c=selectedCourse();if(!c)return '';
  if(state.loadingCourse)return '<div class="smLoading">Loading study materials for the selected course…</div>';
  let h='<div class="smCourse"><div class="smCourseHead"><h3>'+esc(c.title)+'</h3></div>';
  if(!state.materials.length)h+='<div class="smEmpty">No study materials have been published for this course yet.</div>';
  else{
    h+='<div class="smList">';
    state.materials.forEach(m=>{
      h+='<article class="smCard"><div><h4>'+esc(m.title)+'</h4><div class="smMeta">'+esc(m.description||'Approved course-related study material.')+'<br>'+esc(moduleName(m.module_id))+(m.version_label?' - Version '+esc(m.version_label):'')+'</div><span class="smTag">'+esc(typeLabel(m.material_type))+'</span></div><div><button class="smBtn primary" data-open="'+esc(m.id)+'">Open</button> <button class="smBtn" data-down="'+esc(m.id)+'">Download</button></div></article>';
    });
    h+='</div>';
  }
  h+='<div class="smNote">Only materials officially published for this enrolled course are shown here. General books and broader reference resources belong in the Digital Library.</div></div>';
  return h;
}
function render(){
  const r=mount();
  let h='<div class="smHead"><div class="smK">COURSE STUDY MATERIALS</div><h2>Study Materials</h2><p>Choose one approved course at a time to view its study guide, textbook, course addenda, worksheets and other approved documents. This area is separate from the Digital Library.</p></div>';
  if(!state.courses.length)h+='<div class="smCourse"><div class="smEmpty"><strong>No course study materials are available yet.</strong><br>Study materials will appear here after your course enrolment is approved.</div></div>';
  else h+=renderControls()+selectedCourseBody();
  r.innerHTML=h;
  wireCourseControls();
  r.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openM(b.dataset.open,false));
  r.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>openM(b.dataset.down,true));
}
function show(){
 const dc=document.getElementById('dashboardContent');
 if(dc)[...dc.children].forEach(x=>{if(x.id!=='studentStudyMaterialsSection')x.style.setProperty('display','none','important')});
 const r=mount();r.hidden=false;r.style.setProperty('display','block','important');
 document.body.dataset.sdView='materials';
 document.querySelectorAll('#sdSide [data-sd-key]').forEach(x=>x.classList.toggle('active',x.dataset.sdKey==='materials'));
 document.getElementById('sdSide')?.classList.remove('open');
 document.getElementById('sdOverlay')?.classList.remove('open');
 document.body.style.overflow='';
 window.scrollTo({top:0,behavior:'smooth'});
}
function wire(){
 const a=document.querySelector('#sdSide [data-sd-key="materials"]');if(!a)return false;
 if(a.dataset.smWired)return true;
 a.dataset.smWired='1';
 a.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();show()},{capture:true});
 return true;
}
function boot(){css();mount();load();let n=0,t=setInterval(()=>{n++;if(wire()||n>60)clearInterval(t)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();