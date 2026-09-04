// FUNDA ONLINE ACADEMY — SECURE LEARNING WORKSPACE BOOTSTRAP
'use strict';
const {createClient}=supabase;
const db=createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
const $=id=>document.getElementById(id);
const esc=v=>v==null?'':String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const statusOf=r=>String(r?.enrollment_status??r?.status??'pending').trim().toLowerCase();
const state={user:null,enrol:null,course:null,module:1,unit:1};
function show(message,success=false){
 const box=$('message');if(!box)return;
 box.textContent=message;box.style.display='block';
 box.className='message'+(success?' success':'');
}
function render(){
 if(!$('course-content'))return;
 $('course-content').innerHTML='<div class="message">Preparing your approved course content…</div>';
}
async function init(){
 try{
  const p=new URLSearchParams(location.search),courseId=p.get('id')||p.get('course');
  if(!courseId){show('No course was selected.');return}
  const {data:{user},error:ae}=await db.auth.getUser();
  if(ae||!user){location.href='login.html?next='+encodeURIComponent(location.pathname+location.search);return}
  state.user=user;
  const {data:ens,error:ee}=await db.from('enrollments').select('*').eq('student_id',user.id).eq('course_id',courseId).order('enrolled_at',{ascending:false}).limit(1);
  if(ee)throw ee;
  if(!ens?.length){show('You are not enrolled in this course.');return}
  state.enrol=ens[0];
  if(!['approved','active','enrolled','completed'].includes(statusOf(state.enrol))){show('Your course access is still awaiting Academy approval.');return}
  const {data:course,error:ce}=await db.from('courses').select('*').eq('id',courseId).maybeSingle();
  if(ce)throw ce;
  if(!course){show('This course could not be found.');return}
  state.course=course;
  $('sidebarCourse').textContent=course.title||'Selected Course';
  render();
  document.dispatchEvent(new CustomEvent('funda:approved-course-ready',{detail:{courseId}}));
 }catch(e){console.error(e);show(e.message||'Unable to open the learning workspace.')}
}
$('logout')?.addEventListener('click',async()=>{await db.auth.signOut();location.href='login.html'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
