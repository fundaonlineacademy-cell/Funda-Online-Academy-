(()=>{
'use strict';
if(!/(^|\/)courses-public\.html$/i.test(location.pathname))return;
if(window.__fundaCoursesPublicEnrollmentFaq)return;
window.__fundaCoursesPublicEnrollmentFaq=true;

function install(){
  const faq=document.getElementById('faq');
  if(!faq)return;
  const existing=[...faq.querySelectorAll('summary')].find(summary=>/when can i enroll and start my course\?/i.test((summary.textContent||'').replace(/\s+/g,' ').trim()));
  if(existing)return;
  const grid=faq.querySelector('.mt-8.grid')||faq.querySelector('div[class*="grid"]');
  if(!grid)return;
  const item=document.createElement('details');
  item.className='border bg-white rounded-xl p-4 shadow-sm';
  item.dataset.enrollmentAnytimeFaq='1';
  item.innerHTML='<summary class="cursor-pointer flex justify-between gap-3 font-semibold text-sm text-[#071D49]">When can I enroll and start my course?<span class="faq-arrow text-[#C99A2E]">＋</span></summary><p class="mt-3 text-sm text-slate-600 leading-6">You can enroll at any time. Funda Online Academy accepts registrations throughout the year. Once your registration and payment have been verified and approved, your course access is opened and you can begin learning.</p>';
  const first=grid.querySelector('details');
  if(first)first.insertAdjacentElement('afterend',item);else grid.appendChild(item);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();