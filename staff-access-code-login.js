(()=>{
'use strict';
if(!/(^|\/)login\.html$/i.test(location.pathname)||window.__fundaStaffAccessCodeGuard)return;
window.__fundaStaffAccessCodeGuard=true;

function client(){
 return window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY
  ?window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY)
  :null;
}

const attach=()=>{
 const form=document.getElementById('loginForm');
 const adminBtn=document.getElementById('btn-admin');
 const studentBtn=document.getElementById('btn-student');
 const passwordInput=document.getElementById('password');
 const loginBtn=document.getElementById('loginBtn');
 if(!form||!adminBtn||!studentBtn||!passwordInput||!loginBtn)return;

 let extra=document.getElementById('admin-extra');
 if(!extra){
  extra=document.createElement('div');
  extra.id='admin-extra';
  extra.className='hidden mt-5';
  extra.innerHTML='<label for="staff_code" class="block text-sm font-bold text-[#06152f]">Staff access code</label><input id="staff_code" type="password" autocomplete="off" placeholder="Enter staff access code" class="input-field mt-2"><p class="mt-1.5 text-xs text-slate-500">Required for Staff / Admin access. Use your separate Staff Access Code, not your Staff ID. The code is verified securely by the Academy server.</p>';
  const note=document.getElementById('staffAccessNote');
  (note||loginBtn).insertAdjacentElement('beforebegin',extra);
 }
 const codeInput=document.getElementById('staff_code');
 const note=document.getElementById('staffAccessNote');
 const isStaffMode=()=>adminBtn.getAttribute('aria-pressed')==='true'||adminBtn.classList.contains('active');
 const sync=()=>{
  const on=isStaffMode();
  extra.classList.toggle('hidden',!on);
  if(codeInput)codeInput.required=on;
  if(note&&on)note.textContent='Staff and administrator sign-in requires your password and assigned Staff Access Code.';
 };
 adminBtn.addEventListener('click',()=>setTimeout(sync,0));
 studentBtn.addEventListener('click',()=>setTimeout(sync,0));
 new MutationObserver(sync).observe(adminBtn,{attributes:true,attributeFilter:['class','aria-pressed']});
 sync();

 const show=(text,success=false)=>{
  const box=document.getElementById('message');
  if(!box)return;
  box.textContent=text;
  box.classList.remove('error','success','show');
  box.classList.add(success?'success':'error','show');
  box.setAttribute('role',success?'status':'alert');
 };
 const clear=()=>{
  const box=document.getElementById('message');
  if(!box)return;
  box.textContent='';box.classList.remove('error','success','show');box.removeAttribute('role');
 };

 form.addEventListener('submit',async event=>{
  if(!isStaffMode())return;
  event.preventDefault();
  event.stopImmediatePropagation();
  clear();

  const email=(document.getElementById('email')?.value||'').trim().toLowerCase();
  const password=document.getElementById('password')?.value||'';
  const staffCode=(codeInput?.value||'').trim();
  if(!email||!email.includes('@')){show('Please enter a valid email address.');return}
  if(!password){show('Please enter your password.');return}
  if(!staffCode){show('Please enter your Staff Access Code.');codeInput?.focus();return}

  let c=null;
  try{if(typeof supabaseClient!=='undefined'&&supabaseClient)c=supabaseClient}catch(_){ }
  if(!c)c=client();
  if(!c){show('The Academy connection is not ready. Please refresh the page and try again.');return}

  loginBtn.disabled=true;
  loginBtn.innerHTML='<span class="spinner"></span>Signing in...';
  try{
   const {data,error}=await c.auth.signInWithPassword({email,password});
   if(error)throw error;
   if(!data?.user)throw new Error('login-failed');

   const verified=await c.rpc('verify_staff_access_code',{p_staff_code:staffCode});
   if(verified.error){
    await c.auth.signOut();
    throw new Error('staff-code-verification');
   }

   const result=verified.data||{};
   if(!result.ok){
    await c.auth.signOut();
    if(result.reason==='temporarily_locked'){
      show('Staff Access Code verification is temporarily locked after repeated failed attempts. Please wait 15 minutes and try again.');
      return;
    }
    if(result.reason==='not_configured'){
      show('No secure Staff Access Code is configured for this account. Please contact the Academy administrator.');
      return;
    }
    const remaining=Number(result.attempts_remaining);
    show(Number.isFinite(remaining)&&remaining>0
      ?'Invalid Staff Access Code. '+remaining+' attempt'+(remaining===1?'':'s')+' remaining before a temporary lock.'
      :'Invalid Staff Access Code.');
    return;
   }

   const actualRole=String(result.role||'').toLowerCase();
   if(!['admin','staff'].includes(actualRole)){
    await c.auth.signOut();
    show('This account does not have staff or administrator access.');
    return;
   }

   const destination=actualRole==='admin'?'admin-v2.html':'staff-portal.html';
   const portalName=actualRole==='admin'?'Admin Command Center':'Staff Workspace';
   show(`Login successful. Opening the ${portalName}...`,true);
   setTimeout(()=>{window.location.href=destination},450);
  }catch(error){
   console.error('Staff/Admin login error:',error);
   const message=String(error?.message||'').toLowerCase();
   if(message.includes('invalid login credentials'))show('The email address or password is incorrect. Please check your details and try again.');
   else if(message.includes('email not confirmed'))show('This account is waiting for email confirmation. Please contact the Academy if this message continues.');
   else if(message.includes('staff-code-verification'))show('The Academy could not securely verify the Staff Access Code. Please try again.');
   else show('Unable to sign in right now. Please check your details and try again.');
  }finally{
   loginBtn.disabled=false;
   loginBtn.textContent='Sign In Securely';
  }
 },true);
};

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attach,{once:true});else attach();
})();