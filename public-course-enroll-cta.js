(()=>{
'use strict';
if(window.__fundaPublicCourseEnrollCta)return;
window.__fundaPublicCourseEnrollCta=true;

const cleanRef=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'').slice(0,40);
function registrationHref(){
  const target=new URL('create-account.html',location.href);
  const ref=cleanRef(new URLSearchParams(location.search).get('ref'));
  if(ref)target.searchParams.set('ref',ref);
  return target.pathname+target.search;
}
function enrollButton(){
  const a=document.createElement('a');
  a.href=registrationHref();
  a.textContent='Enroll Now';
  a.setAttribute('data-funda-enroll-now','1');
  a.className='px-3.5 py-2.5 rounded-lg bg-[#c99a2e] text-[#071D49] text-xs font-extrabold text-center whitespace-nowrap';
  return a;
}
function enhanceCatalogue(){
  if(!/(^|\/)courses-public\.html$/i.test(location.pathname))return;
  document.querySelectorAll('#courseGrid .course-card').forEach(card=>{
    if(card.dataset.fundaEnrollCta==='1')return;
    const view=[...card.querySelectorAll('a[href*="course-view.html"]')].find(a=>/view\s+course/i.test(a.textContent||''));
    if(!view)return;
    const footer=view.parentElement;
    if(!footer)return;
    const actions=document.createElement('div');
    actions.setAttribute('data-funda-course-actions','1');
    actions.className='flex flex-wrap gap-2 justify-end';
    view.replaceWith(actions);
    actions.appendChild(view);
    actions.appendChild(enrollButton());
    footer.classList.add('gap-3','flex-wrap');
    card.dataset.fundaEnrollCta='1';
  });
}
function enhanceHomepage(){
  if(!((/(^|\/)index\.html$/i.test(location.pathname))||/\/$/.test(location.pathname)))return;
  document.querySelectorAll('#courses > a.course-card[href*="course-view.html"]').forEach(original=>{
    const href=original.getAttribute('href')||'';
    const article=document.createElement('article');
    article.className=original.className+' flex flex-col';
    article.setAttribute('data-funda-enroll-cta','1');

    const body=document.createElement('a');
    body.href=href;
    body.className='block flex-1';
    body.innerHTML=original.innerHTML;
    body.setAttribute('aria-label','View course details');

    const actions=document.createElement('div');
    actions.className='grid grid-cols-2 gap-2 mt-3';
    actions.setAttribute('data-funda-course-actions','1');

    const view=document.createElement('a');
    view.href=href;
    view.textContent='View Course';
    view.className='px-2.5 py-2.5 rounded-lg bg-[#06152f] text-white text-[11px] font-extrabold text-center whitespace-nowrap';

    const enroll=enrollButton();
    enroll.className='px-2.5 py-2.5 rounded-lg bg-[#c99a2e] text-[#071D49] text-[11px] font-extrabold text-center whitespace-nowrap';

    actions.append(view,enroll);
    article.append(body,actions);
    original.replaceWith(article);
  });
}
function enhance(){enhanceCatalogue();enhanceHomepage();}
function watch(root){
  if(!root)return;
  new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
}
function boot(){
  enhance();
  watch(document.getElementById('courseGrid'));
  watch(document.getElementById('courses'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
