// FUNDA ONLINE ACADEMY - COURSE STUDY MATERIALS
(function(){
'use strict';
if(!/dashboard\.html$/i.test(location.pathname))return;
let db=null,state={courses:[],modules:[],materials:[]};
const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const ok=e=>['approved','active','enrolled','completed'].includes(String(e.enrollment_status||e.status||'').toLowerCase());
const typeLabel=v=>({study_guide:'Study Guide / Textbook',textbook:'Study Guide / Textbook',course_textbook:'Study Guide / Textbook',addendum:'Course Addendum',worksheet:'Workbook / Worksheet',workbook:'Workbook / Worksheet',reference:'Reference Document',reference_document:'Reference Document'}[String(v||'').toLowerCase()]||'Course Material');
function css(){
 if(document.getElementById('smCss'))return;
 const s=document.createElement('style');s.id='smCss';
 s.textContent='#studentStudyMaterialsSection{max-width:1180px;margin:22px auto;padding:0 18px}.smHead{background:linear-gradient(135deg,#fffdf7,#fff5dc);border:1px solid #ead8a6;border-radius:22px;padding:22px}.smHead h2{margin:6px 0;color:#17324a;font:900 24px Montserrat,sans-serif}.smHead p{margin:0;color:#657383;font-size:12px;line-height:1.65}.smK{font-size:9px;letter-spacing:.18em;font-weight:900;color:#b58216}.smCourse{margin-top:18px;background:#fff;border:1px solid #dfe5ea;border-radius:20px;overflow:hidden}.smCourseHead{padding:17px 19px;background:#f8fafb;border-bottom:1px solid #e4e8ec}.smCourseHead h3{margin:0;color:#17324a;font:900 15px Montserrat,sans-serif}.smList{padding:14px}.smCard{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;border:1px solid #e1e6ea;border-radius:14px;padding:14px;margin-bottom:10px}.smCard h4{margin:0;color:#17324a;font-size:13px}.smMeta{margin-top:5px;color:#6d7985;font-size:10px;line-height:1.5}.smTag{display:inline-block;margin-top:7px;padding:5px 8px;border-radius:999px;background:#fff2ca;color:#7a5713;font-size:8px;font-weight:900}.smBtn{padding:9px 11px;border-radius:10px;font-size:9px;font-weight:900;border:1px solid #17324a;color:#17324a;background:#fff}.smBtn.primary{background:#17324a;color:#fff}.smEmpty{padding:28px;text-align:center;color:#687684;font-size:12px;line-height:1.7}.smNote{margin:14px;padding:13px;border-radius:14px;background:#f8fafb;border:1px solid #e4e8ec;color:#5f6e7a;font-size:10px;line-height:1.6}@media(max-width:700px){.smCard{grid-template-columns:1fr}}';
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
async function load(){
 if(!window.supabase)return;
 db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
 const {data:{user}}=await db.auth.getUser();if(!user)return;
 const {data:ens}=await db.from('enrollments').select('course_id,enrollment_status,status').eq('student_id',user.id);
 const ids=[...new Set((ens||[]).filter(ok).map(e=>e.course_id).filter(Boolean))];
 if(!ids.length){render();return}
 const rs=await Promise.all([
  db.from('courses').select('id,title').in('id',ids),
  db.from('course_modules').select('id,course_id,module_number,module_name').in('course_id',ids),
  db.from('course_study_materials').select('*').in('course_id',ids).eq('published',true).order('sort_order')
 ]);
 state.courses=rs[0].data||[];state.modules=rs[1].data||[];state.materials=rs[2].data||[];render();
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
function render(){
 const r=mount();
 let h='<div class="smHead"><div class="smK">COURSE STUDY MATERIALS</div><h2>Study Materials</h2><p>Materials issued specifically for your enrolled course, such as the full study guide or textbook, course addenda, worksheets and other approved documents. This is separate from the Digital Library.</p></div>';
 if(!state.courses.length){
  h+='<div class="smCourse"><div class="smEmpty"><strong>No course study materials are available yet.</strong><br>Study materials will appear here after your course enrolment is approved.</div></div>';
  r.innerHTML=h;return;
 }
 state.courses.forEach(c=>{
  const ms=state.materials.filter(m=>String(m.course_id)===String(c.id));
  h+='<div class="smCourse"><div class="smCourseHead"><h3>'+esc(c.title)+'</h3></div>';
  if(!ms.length)h+='<div class="smEmpty">No study materials have been published for this course yet.</div>';
  else{
   h+='<div class="smList">';
   ms.forEach(m=>{
    h+='<article class="smCard"><div><h4>'+esc(m.title)+'</h4><div class="smMeta">'+esc(m.description||'Approved course-related study material.')+'<br>'+esc(moduleName(m.module_id))+(m.version_label?' - Version '+esc(m.version_label):'')+'</div><span class="smTag">'+esc(typeLabel(m.material_type))+'</span></div><div><button class="smBtn primary" data-open="'+esc(m.id)+'">Open</button> <button class="smBtn" data-down="'+esc(m.id)+'">Download</button></div></article>';
   });
   h+='</div>';
  }
  h+='<div class="smNote">Only materials officially published for this enrolled course are shown here. General books and broader reference resources belong in the Digital Library.</div></div>';
 });
 r.innerHTML=h;
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