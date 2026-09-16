(()=>{
 if(window.__fundaEnrolmentTerms)return;window.__fundaEnrolmentTerms=true;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
 const TERMS_VERSION='2026-08-30';
 const ACCOUNT_POLICY_VERSION='FOA Terms v1.0';
 const ACCOUNT_DECLARATION='I confirm that the information I supplied when creating my Funda Online Academy student account is true and correct to the best of my knowledge. I have read and accepted the Academy student terms and privacy information.';

 function addTerms(){
  const declaration=document.getElementById('declaration'); if(!declaration||document.getElementById('fundaTermsPanel'))return;
  declaration.required=true;
  const card=declaration.closest('.bg-white'); if(!card)return;
  const label=card.querySelector('label[for="declaration"]');
  if(label)label.innerHTML='<strong>Required declaration.</strong> I confirm that my registration information is correct, my proof of payment belongs to this application, and I understand that course access remains locked until Admissions & Finance approves my registration and payment.';
  const panel=document.createElement('div');panel.id='fundaTermsPanel';panel.className='mt-6 border-t border-gray-200 pt-5 space-y-4';
  panel.innerHTML=`<div class="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p class="font-black text-[#03133d]">Important payment, cancellation & refund terms</p><div class="text-sm text-gray-700 leading-6 mt-2 space-y-2"><p><strong>Payment plans:</strong> I understand that any instalment option shown for my selected course forms part of my payment commitment. Course access and continued access may depend on payments being received and verified when due.</p><p><strong>Cancellation after course access begins:</strong> If I choose to discontinue after course access/services have started, any refund or cancellation amount will be determined under the Academy policy and applicable South African consumer law. A refund is not automatically due merely because I change my mind or stop participating.</p><p><strong>Before course access begins:</strong> Any lawful cancellation, cooling-off or refund right that applies under South African law remains unaffected.</p><p><strong>Incorrect payments:</strong> I am responsible for checking the official beneficiary and banking details displayed by Funda Online Academy before authorising a payment. The Academy cannot credit money it has not actually received. If I pay an incorrect third-party account, I must contact my bank/payment provider promptly; this does not remove any rights I may have where an error is attributable to the Academy.</p><p><strong>Reference and proof:</strong> I must use the required payment reference and upload genuine proof showing the amount paid. Missing or incorrect references may delay verification.</p></div></div><label class="flex gap-3 items-start"><input id="termsAcceptance" type="checkbox" required class="mt-1 w-5 h-5"><span class="text-sm text-gray-700 leading-6"><strong>I have read and accept the enrolment, payment, cancellation and refund terms above.</strong> I understand these terms before submitting my application.</span></label><label class="flex gap-3 items-start"><input id="bankAcceptance" type="checkbox" required class="mt-1 w-5 h-5"><span class="text-sm text-gray-700 leading-6"><strong>I have checked the official banking details and payment amount.</strong> I understand that I must verify the beneficiary/account details before authorising an EFT or bank deposit and keep my proof of payment.</span></label><p class="text-xs text-gray-500">Terms version: ${TERMS_VERSION}</p>`;
  card.appendChild(panel);
 }

 function validation(){
   if(!document.getElementById('declaration')?.checked)return 'Please accept the required declaration.';
   if(!document.getElementById('termsAcceptance')?.checked)return 'Please read and accept the enrolment, payment, cancellation and refund terms.';
   if(!document.getElementById('bankAcceptance')?.checked)return 'Please confirm that you checked the official banking details and payment amount.';
   return null;
 }

 function protectSubmit(){
  const btn=document.getElementById('submitApplication');if(!btn||btn.dataset.termsGuard)return;btn.dataset.termsGuard='1';
  btn.addEventListener('click',e=>{const err=validation();if(err){e.preventDefault();e.stopImmediatePropagation();if(typeof showMessage==='function')showMessage(err);else alert(err);}},true);
 }

 function storedCourse(){
  const query=String(new URLSearchParams(location.search).get('course')||'').trim();
  if(query)return query;
  try{
    const raw=localStorage.getItem('funda_pending_course');
    if(!raw)return '';
    try{
      const parsed=JSON.parse(raw);
      return String(parsed?.id||parsed?.course_id||parsed?.courseId||'').trim();
    }catch(_){return String(raw).trim();}
  }catch(_){return '';}
 }

 function restoreRequestedCourse(){
  if(window.__fundaRequestedCourseRestored)return;
  const courseId=storedCourse();
  if(!courseId)return;
  let attempts=0;
  const trySelect=()=>{
    attempts++;
    try{
      if(typeof window.selectCourse==='function')window.selectCourse(courseId);
      const selected=document.getElementById('selectedCourseName')?.textContent?.trim();
      if(selected&&selected!=='—'){
        window.__fundaRequestedCourseRestored=true;
        document.getElementById('continueBar')?.scrollIntoView({behavior:'smooth',block:'nearest'});
        return;
      }
    }catch(e){console.warn('Course restoration warning:',e);}
    if(attempts<50)setTimeout(trySelect,180);
  };
  trySelect();
 }

 async function repairAccountPolicyAcceptance(attempt=0){
  try{
    if(!window.supabase?.createClient||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)return;
    const client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    const session=await client.auth.getSession();
    const user=session.data?.session?.user;
    if(!user)return;
    const meta=user.user_metadata||{};
    if(meta.policy_version!==ACCOUNT_POLICY_VERSION||meta.policies_accepted!==true||!meta.policy_accepted_at)return;

    const student=await client.from('students').select('id').eq('user_id',user.id).maybeSingle();
    if(student.error){console.warn('Policy recovery student lookup warning:',student.error);return;}
    if(!student.data?.id){if(attempt<8)setTimeout(()=>repairAccountPolicyAcceptance(attempt+1),700);return;}

    const existing=await client.from('policy_acceptances').select('id').eq('user_id',user.id).eq('policy_version',ACCOUNT_POLICY_VERSION).maybeSingle();
    if(existing.error){console.warn('Policy recovery lookup warning:',existing.error);return;}
    if(existing.data)return;

    const saved=await client.from('policy_acceptances').insert({
      student_id:student.data.id,
      user_id:user.id,
      policy_version:ACCOUNT_POLICY_VERSION,
      policies_accepted:true,
      declaration_accepted:true,
      declaration_text:ACCOUNT_DECLARATION,
      accepted_at:meta.policy_accepted_at
    });
    if(saved.error)console.warn('Policy recovery save warning:',saved.error);
  }catch(error){console.warn('Account policy recovery warning:',error);}
 }

 function init(){addTerms();protectSubmit();restoreRequestedCourse();}
 const obs=new MutationObserver(init);obs.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{init();repairAccountPolicyAcceptance();},{once:true});else{init();repairAccountPolicyAcceptance();}
})();