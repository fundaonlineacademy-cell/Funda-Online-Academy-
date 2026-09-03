// Funda Online Academy — student certificate access.
(()=>{
  'use strict';
  function addLink(){
    if(document.getElementById('fundaCertificatesQuickLink')) return;
    const library=document.querySelector('a[href="digital-library.html"]');
    if(!library) return;
    const a=document.createElement('a');
    a.id='fundaCertificatesQuickLink';
    a.href='student-certificates.html';
    a.className=library.className;
    a.innerHTML='<span class="text-xl">🏅</span><span><strong class="block text-sm text-[#071D49]">My Certificates</strong><span class="text-xs text-slate-500">View and securely download issued certificates</span></span>';
    library.insertAdjacentElement('afterend',a);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addLink,{once:true}); else addLink();
})();
