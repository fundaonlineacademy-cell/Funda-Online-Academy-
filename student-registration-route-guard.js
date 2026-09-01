(()=>{
  if(window.__fundaRegistrationRouteGuard)return;
  window.__fundaRegistrationRouteGuard=true;

  // The Student Dashboard is a stable destination. Refreshing it must never
  // restart registration or force the learner back to course selection.
  // Incomplete registrations are represented by the dashboard's own status
  // and course/application UI instead of an automatic navigation.
  async function inspectRegistrationState(){
    try{
      if(!/dashboard\.html$/i.test(location.pathname))return;
      if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)return;
      const client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
      const {data:{user}}=await client.auth.getUser();
      if(!user)return;
      const {data,error}=await client.from('enrollments')
        .select('id,submitted_at,enrollment_status,status')
        .eq('student_id',user.id)
        .order('created_at',{ascending:false});
      if(error){console.warn('Registration state check:',error.message);return;}
      const submitted=(data||[]).some(x=>x&&x.submitted_at);
      document.documentElement.dataset.fundaRegistrationState=submitted?'submitted':'not-submitted';
    }catch(e){console.warn('Registration state check unavailable:',e);}
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inspectRegistrationState,{once:true});
  else inspectRegistrationState();
})();
