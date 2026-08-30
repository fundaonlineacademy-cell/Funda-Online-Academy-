(()=>{
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaStaffInviteRedirectFix)return;
window.__fundaStaffInviteRedirectFix=true;
let db;
function client(){return db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY))}
function staffPortalUrl(){
  const base=new URL('.',location.href);
  return new URL('staff-portal.html',base).href;
}
function installPortalButton(){
  const invite=document.getElementById('hrAddStaff');
  if(!invite||document.getElementById('hrOpenStaffPortal'))return;
  const b=document.createElement('button');
  b.id='hrOpenStaffPortal';
  b.type='button';
  b.className='hrBtn alt';
  b.textContent='Open Staff Portal';
  b.title='Open the staff sign-in and password setup page';
  b.onclick=()=>{location.href=staffPortalUrl()};
  invite.insertAdjacentElement('afterend',b);
}
async function sendInvite(){
  const $=id=>document.getElementById(id);
  const full_name=$('hiName')?.value.trim()||'';
  const email=$('hiEmail')?.value.trim()||'';
  const job_title=$('hiJob')?.value.trim()||'';
  const department=$('hiDept')?.value||'';
  if(!full_name||!email||!job_title)return alert('Name, email and job title are required.');
  const btn=$('hiSend');
  if(btn){btn.disabled=true;btn.textContent='Sending…'}
  try{
    const c=client();
    if(!c)throw new Error('Academy database connection is not available.');
    const redirect_to=staffPortalUrl();
    const r=await c.functions.invoke('invite-staff-user',{body:{
      full_name,email,job_title,department,
      access_level:$('hiLevel')?.value||'edit',
      can_approve:!!$('hiApprove')?.checked,
      redirect_to
    }});
    if(r.error||r.data?.error)throw new Error(r.data?.error||r.error.message);
    alert('Staff invitation sent. Staff code: '+r.data.staff_code+'\n\nThe invitation will open the Staff Portal at the correct Academy path.');
    if(window.FundaHRCentre?.open)await window.FundaHRCentre.open();
    setTimeout(installPortalButton,120);
  }catch(e){
    const msg=e?.message||String(e);
    if(/already|registered|exists|invited/i.test(msg)){
      alert('This staff email already has an Academy account or invitation. Use Open Staff Portal and the password setup/recovery option instead of creating a duplicate staff account.');
    }else alert('Staff invitation could not be sent: '+msg);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='Send Secure Invitation'}
  }
}
document.addEventListener('click',e=>{
  const b=e.target.closest?.('#hiSend');
  if(!b)return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  sendInvite();
},true);
const mo=new MutationObserver(()=>installPortalButton());
mo.observe(document.documentElement,{childList:true,subtree:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(installPortalButton,200));else setTimeout(installPortalButton,200);
})();