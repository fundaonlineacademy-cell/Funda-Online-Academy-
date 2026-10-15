// FUNDA ONLINE ACADEMY — GRAPHIC DESIGN WORKSPACE RECOVERY
// Narrow watchdog for the newly added Graphic Design course. It does not alter other courses.
(function(){
'use strict';
const GRAPHIC_ID='8a59da17-0a32-4306-a774-635772e617c4';
let attempts=0;
function isGraphic(){
  try{
    const params=new URLSearchParams(location.search);
    const id=(params.get('id')||params.get('course')||'').trim();
    return id===GRAPHIC_ID || (typeof state!=='undefined' && state.course && (state.course.id===GRAPHIC_ID || /Graphic Design\s*&\s*Visual Communication/i.test(String(state.course.title||''))));
  }catch{return false}
}
function stillPreparing(){
  const host=document.getElementById('course-content');
  return !!host && /Preparing your course/i.test(host.textContent||'');
}
function recover(){
  if(!isGraphic())return;
  attempts++;
  if(typeof render==='function' && typeof state!=='undefined' && state.course){
    try{render()}catch(e){console.error('Graphic Design workspace recovery render failed',e)}
  }
  if(stillPreparing() && attempts<20)setTimeout(recover,350);
}
function boot(){
  if(!isGraphic())return;
  setTimeout(recover,250);
  setTimeout(()=>{if(stillPreparing())recover()},1200);
  setTimeout(()=>{if(stillPreparing())recover()},2500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

// Shared learner-display polish for FOA-ACA-STD-001 v1.2.
// Internal template labels are not exposed where they add no learning value,
// while the learner-facing Practical Activity label becomes Self-Practice Activity.
(function(){
'use strict';
const INTERNAL_MAIN=/^Main Lesson Content(?:\s+\d+)?$/i;
const PRACTICAL=/^Practical Activity$/i;
function polishLessonDisplay(){
  const stageLabel=document.querySelector('.foaStageMeta strong');
  if(!stageLabel)return;
  const stageMeta=stageLabel.closest('.foaStageMeta');
  const stageTrack=stageMeta?.nextElementSibling;
  const card=stageTrack?.nextElementSibling;
  const current=String(stageLabel.textContent||'').trim();

  if(INTERNAL_MAIN.test(current)){
    if(stageMeta)stageMeta.style.display='none';
    if(card?.matches?.('section.card')){
      const heading=card.querySelector(':scope > h2');
      if(heading && INTERNAL_MAIN.test(String(heading.textContent||'').trim()))heading.remove();
    }
    return;
  }

  if(stageMeta)stageMeta.style.display='';
  if(PRACTICAL.test(current))stageLabel.textContent='Self-Practice Activity';
  if(card?.matches?.('section.card')){
    const heading=card.querySelector(':scope > h2');
    if(heading && PRACTICAL.test(String(heading.textContent||'').trim()))heading.textContent='Self-Practice Activity';
  }
}
function startLessonDisplayPolish(){
  const host=document.getElementById('course-content');
  if(!host)return;
  polishLessonDisplay();
  const observer=new MutationObserver(polishLessonDisplay);
  observer.observe(host,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startLessonDisplayPolish,{once:true});else startLessonDisplayPolish();
})();
