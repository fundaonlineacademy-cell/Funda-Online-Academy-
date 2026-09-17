(()=>{
  'use strict';
  if(!/(^|\/)courses-public\.html$/i.test(window.location.pathname))return;
  if(window.__fundaCoursesPublicControlsRestore)return;
  window.__fundaCoursesPublicControlsRestore=true;

  const restore=()=>{
    const count=document.getElementById('courseResultCount');
    const summary=count?.parentElement;
    if(summary)summary.style.setProperty('display','none','important');

    const sort=document.getElementById('sortCourses');
    if(!sort)return;
    const first=sort.querySelector('option[value="catalogue"],option[value="popular"]');
    if(first){
      if(first.value!=='popular')first.value='popular';
      if(first.textContent!=='Most Popular')first.textContent='Most Popular';
    }
    if(sort.value==='catalogue')sort.value='popular';
    sort.style.setProperty('margin-left','0','important');
    sort.style.setProperty('margin-right','auto','important');
    sort.parentElement?.style.setProperty('justify-content','flex-start','important');
  };

  const start=()=>{
    restore();
    [200,600,1200,2200,4000].forEach(delay=>setTimeout(restore,delay));
    const sort=document.getElementById('sortCourses');
    if(sort){
      new MutationObserver(()=>setTimeout(restore,0)).observe(sort,{childList:true,subtree:true,attributes:true,characterData:true});
    }
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
