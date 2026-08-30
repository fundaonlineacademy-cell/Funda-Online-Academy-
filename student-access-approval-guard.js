(()=>{
 if(window.__fundaApprovalGuard)return;window.__fundaApprovalGuard=true;
 const path=location.pathname.split('/').pop().toLowerCase();
 const protectedPages=new Set(['digital-library.html','lesson.html','course-player.html','student-course.html','my-course.html']);
 const low=v=>String(v||'').trim().toLowerCase();
 const approved=x=>['approved','active','completed'].includes(low(x?.enrollment_status||x?.status));
 async function client(){
  if(typeof supabaseClient!=='undefined'&&supabaseClient)return supabaseClient;
  if(window.supabaseClient)return window.supabaseClient;
  if(window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)return window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  return null;
 }
 function deny(){
  const dest='dashboard.html?access=pending';
  if(path!=='dashboard.html')location.replace(dest);
 }
 async function check(){
  const db=await client();if(!db)return;
  const {data:{session}}=await db.auth.getSession();if(!session){if(protectedPages.has(path))location.replace('login.html');return;}
  const {data,error}=await db.from('enrollments').select('id,status,enrollment_status,course_id').eq('student_id',session.user.id);
  if(error){if(protectedPages.has(path))deny();return;}
  const hasApproved=(data||[]).some(approved);
  if(protectedPages.has(path)&&!hasApproved)deny();
 }
 check();
})();