(()=>{
if(!/staff-portal\.html$/i.test(location.pathname)||window.__fundaStaffPasswordAccess)return;
window.__fundaStaffPasswordAccess=true;
let db;
const client=()=>db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY));
const portalUrl=()=>new URL('staff-portal.html?password_setup=1',new URL('.',location.href)).href;
function enhance(){
  const app=document.getElementById('app');
  if(!app||document.getElementById('staffRecoveryBtn'))return;
  const email=app.querySelector('#em');
  const password=app.querySelector('#pw');
  if(!email||!password)return;
  const b=document.createElement('button');
  b.id='staffRecoveryBtn';
  b.type='button';
  b.className='btn alt';
  b.style.marginLeft='6px';
  b.textContent='Set / Reset Password';
  const status=document.createElement('div');
  status.id='staffRecoveryStatus';
  b.onclick=async()=>{
    const value=email.value.trim();
    if(!value){status.className='notice err';status.textContent='Enter your staff email address first.';return}
    b.disabled=true;b.textContent='Sending…';
    try{
      const r=await client().auth.resetPasswordForEmail(value,{redirectTo:portalUrl()});
      if(r.error)throw r.error;
      status.className='notice ok';
      status.textContent='Password setup email sent. Open the newest email and follow the link back to the Staff Portal.';
    }catch(e){
      status.className='notice err';
      status.textContent='Could not send the password setup email: '+(e?.message||String(e));
    }finally{b.disabled=false;b.textContent='Set / Reset Password'}
  };
  const login=app.querySelector('button[onclick="login()"]');
  if(login)login.insertAdjacentElement('afterend',b);else app.appendChild(b);
  app.appendChild(status);
}
const mo=new MutationObserver(enhance);
mo.observe(document.documentElement,{subtree:true,childList:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhance,250));else setTimeout(enhance,250);
})();