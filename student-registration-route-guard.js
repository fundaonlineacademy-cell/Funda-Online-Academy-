(()=>{
  if(window.__fundaRegistrationRouteGuard)return;
  window.__fundaRegistrationRouteGuard=true;
  async function guard(){
    try{
      if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)return;
      const client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
      const {data:{user}}=await client.auth.getUser();
      if(!user)return;
      const path=location.pathname.toLowerCase();
      if(!path.endsWith('/dashboard.html')&&!path.endsWith('dashboard.html'))return;
      const {data,error}=await client.from('enrollments').select('id,submitted_at,enrollment_status,status').eq('student_id',user.id).order('created_at',{ascending:false}).limit(1);
      if(error){console.warn('Registration route guard:',error.message);return;}
      const submitted=(data||[]).some(x=>x&&x.submitted_at);
      if(!submitted){location.replace('onboarding.html?resume=registration');}
    }catch(e){console.warn('Registration route guard unavailable:',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',guard,{once:true});else guard();
})();
