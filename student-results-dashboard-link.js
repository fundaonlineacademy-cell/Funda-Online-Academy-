// Funda Online Academy — secure student results dashboard link
(()=>{
  'use strict';
  const add=()=>{
    const library=[...document.querySelectorAll('a[href="digital-library.html"]')].find(a=>a.closest('aside'));
    if(!library || document.querySelector('[data-funda-results-link]')) return;
    const a=document.createElement('a');
    a.href='student-results.html';
    a.dataset.fundaResultsLink='1';
    a.className=library.className;
    a.innerHTML='<span class="text-xl">📄</span><span><strong class="block text-sm text-[#071D49]">My Results</strong><span class="text-xs text-slate-500">View finalised Statements of Results</span></span>';
    library.insertAdjacentElement('afterend',a);
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',add,{once:true}); else add();
  const mo=new MutationObserver(add); mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>mo.disconnect(),12000);
})();
