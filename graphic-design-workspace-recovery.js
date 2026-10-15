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

// Shared learner-display polish: the stage bar may identify the current step as
// "Main Lesson Content", but that internal template label must not be repeated
// as a second heading inside the teaching card. Learner-facing subject headings
// already stored in the lesson content remain untouched.
(function(){
'use strict';
const INTERNAL_MAIN=/^Main Lesson Content(?:\s+\d+)?$/i;
function removeDuplicateMainContentHeading(){
  const stageLabel=document.querySelector('.foaStageMeta strong');
  if(!stageLabel || !INTERNAL_MAIN.test(String(stageLabel.textContent||'').trim()))return;
  const stageMeta=stageLabel.closest('.foaStageMeta');
  const stageTrack=stageMeta?.nextElementSibling;
  const card=stageTrack?.nextElementSibling;
  if(!card?.matches?.('section.card'))return;
  const heading=card.querySelector(':scope > h2');
  if(heading && INTERNAL_MAIN.test(String(heading.textContent||'').trim()))heading.remove();
}
function startLessonDisplayPolish(){
  const host=document.getElementById('course-content');
  if(!host)return;
  removeDuplicateMainContentHeading();
  const observer=new MutationObserver(removeDuplicateMainContentHeading);
  observer.observe(host,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startLessonDisplayPolish,{once:true});else startLessonDisplayPolish();
})();
