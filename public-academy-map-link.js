(()=>{
  'use strict';
  if(window.__fundaAcademyMapLink)return;
  window.__fundaAcademyMapLink=true;

  const path=location.pathname.toLowerCase();
  if(!/(^|\/)(index|courses-public|course-view|employers|ambassadors|login)\.html$/.test(path)&&!path.endsWith('/'))return;

  function hasMapLink(container){
    return Boolean(container?.querySelector('a[href="academy-map.html"]'));
  }

  function addAfter(reference){
    const container=reference?.parentElement;
    if(!container||hasMapLink(container))return;
    const link=document.createElement('a');
    link.href='academy-map.html';
    link.textContent='Academy Map';
    link.dataset.academyMapLink='1';
    link.className=reference.className;
    link.style.color=reference.style.color||'';
    reference.insertAdjacentElement('afterend',link);
  }

  function addBefore(reference){
    const container=reference?.parentElement;
    if(!container||hasMapLink(container))return;
    const link=document.createElement('a');
    link.href='academy-map.html';
    link.textContent='Academy Map';
    link.dataset.academyMapLink='1';
    link.className=reference.className;
    link.style.color=reference.style.color||'';
    reference.insertAdjacentElement('beforebegin',link);
  }

  function addHeaderLinks(){
    document.querySelectorAll('header a').forEach(link=>{
      const text=(link.textContent||'').trim().toLowerCase();
      if(text==='faqs')addAfter(link);
      else if(text==='for business'||text==='all courses'||text==='programme')addAfter(link);
      else if(text==='login'&&!link.closest('header')?.querySelector('a[href="academy-map.html"]'))addBefore(link);
    });
  }

  function addFooterLinks(){
    document.querySelectorAll('footer').forEach(footer=>{
      if(hasMapLink(footer))return;
      const reference=[...footer.querySelectorAll('a')].find(link=>/^(courses|all courses|home)$/i.test((link.textContent||'').trim()));
      if(reference)addAfter(reference);
    });
  }

  function run(){addHeaderLinks();addFooterLinks()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(run,200);setTimeout(run,1200)},{once:true});
  else{setTimeout(run,100);setTimeout(run,900)}
})();
