(()=>{
 if(window.__fundaEnrolmentTerms)return;window.__fundaEnrolmentTerms=true;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 const TERMS_VERSION='2026-08-30';
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
 function init(){addTerms();protectSubmit();}
 const obs=new MutationObserver(init);obs.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
