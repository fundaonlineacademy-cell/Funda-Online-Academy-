(()=>{
 if(window.__fundaLibraryApprovalGuard)return;window.__fundaLibraryApprovalGuard=true;
 const low=v=>String(v||'').toLowerCase();
 async function run(){
  if(!/digital-library\.html$/i.test(location.pathname))return;
  const db=window.supabase?.createClient?.(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);if(!db)return;
  const {data:{session}}=await db.auth.getSession();if(!session){location.replace('login.html');return;}
  const uid=session.user.id;
  const [{data:direct},{data:student}]=await Promise.all([
   db.from('enrollments').select('id,status,enrollment_status').eq('student_id',uid),
   db.from('students').select('id').eq('user_id',uid).maybeSingle()
  ]);
  let rows=direct||[];
  if(student?.id){const {data}=await db.from('enrollments').select('id,status,enrollment_status').eq('student_id',student.id);rows=rows.concat(data||[]);}
  const approved=rows.some(e=>['approved','active','completed'].includes(low(e.status||e.enrollment_status)));
  if(approved)return;
  document.documentElement.style.background='#f4eee6';
  document.body.innerHTML=`<main style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:Inter,Arial,sans-serif;background:linear-gradient(145deg,#eef1f0,#fff4dc,#f5dbe4)"><section style="max-width:620px;background:#fff6e4;border:1px solid #e7cf91;border-radius:28px;padding:32px;box-shadow:0 18px 50px rgba(33,56,77,.14);text-align:center"><div style="font-size:42px">🔒</div><div style="margin-top:12px;font-size:12px;font-weight:900;letter-spacing:.14em;color:#b47b18">LIBRARY ACCESS PENDING</div><h1 style="margin:10px 0;color:#21384d;font-size:28px;line-height:1.2">Your Digital Library will open after approval</h1><p style="color:#495968;line-height:1.7;font-size:16px">Your registration and payment are still being reviewed by Admissions & Finance. You may use your student dashboard to track the application, but course lessons, assessments and the Digital Library remain locked until your enrolment is approved.</p><a href="dashboard.html" style="display:block;margin-top:24px;padding:15px 20px;border-radius:14px;background:#21384d;color:white;text-decoration:none;font-weight:800">Return to Student Dashboard</a></section></main>`;
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();