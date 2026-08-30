(()=>{
if(!/staff-portal\.html$/i.test(location.pathname)||window.__fundaStaffOnboardingStatus)return;
window.__fundaStaffOnboardingStatus=true;
let db;
const client=()=>db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY));
async function sync(){
  try{
    const c=client(); if(!c)return;
    const {data:{user}}=await c.auth.getUser(); if(!user)return;
    const p=await c.from('profiles').select('role').eq('id',user.id).maybeSingle();
    if(p.data?.role!=='staff')return;
    await c.rpc('mark_my_staff_invitation_accepted');
  }catch(e){}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(sync,500));else setTimeout(sync,500);
})();