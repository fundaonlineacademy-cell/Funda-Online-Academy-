(()=>{
if(!/staff-portal\.html$/i.test(location.pathname)||window.__fundaStaffSessionSwitch)return;
window.__fundaStaffSessionSwitch=true;
let db;
const client=()=>db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY));
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function switchToStaff(){
  const b=document.getElementById('switchToStaffBtn');
  if(b){b.disabled=true;b.textContent='Switching…'}
  try{await client().auth.signOut({scope:'local'});}catch(e){try{await client().auth.signOut();}catch(_){} }
  location.href='staff-portal.html?staff_signin=1';
}
async function enhance(){
  const app=document.getElementById('app');
  if(!app||document.getElementById('switchToStaffBtn'))return;
  if(!/Staff access not available/i.test(app.textContent||''))return;
  const c=client();
  const g=await c.auth.getUser();
  const user=g.data?.user;
  let role='another Academy account',email=user?.email||'';
  if(user){
    const pr=await c.from('profiles').select('role,full_name,email,job_title').eq('id',user.id).maybeSingle();
    const p=pr.data;
    if(p?.role==='admin')role='the CEO / Administrator account';
    else if(p?.role==='student')role='a Student account';
    else if(p?.role)role='a '+p.role+' account';
    email=p?.email||email;
  }
  const top=document.getElementById('topLogout');if(top)top.style.display='none';
  app.innerHTML=`<h3 class="sectionTitle">Switch to Staff Account</h3><p style="font-size:13px;line-height:1.65;color:#58697a">You are currently signed in with ${esc(role)}${email?` <b>(${esc(email)})</b>`:''}. The Staff Workspace correctly keeps that account separate from employee access.</p><div class="notice ok">Your staff record is not missing. Switch accounts below, then sign in with the employee's staff email and password.</div><button id="switchToStaffBtn" class="btn" style="margin-top:12px">Switch to Staff Sign-in</button><p class="meta" style="margin-top:10px">This signs out only the current Academy browser session. It does not delete or change either account.</p>`;
  document.getElementById('switchToStaffBtn').onclick=switchToStaff;
}
const mo=new MutationObserver(()=>enhance());
mo.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,250));else setTimeout(enhance,250);
})();