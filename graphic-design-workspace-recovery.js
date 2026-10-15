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
const STYLE_ID='foa-v12-lesson-polish';
function ensureLessonStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    #course-content details{border:1px solid rgba(15,42,67,.16);border-radius:10px;margin:10px 0;background:#fff;overflow:hidden}
    #course-content details>summary{list-style:none;cursor:pointer;position:relative;padding:13px 48px 13px 16px;font-weight:700;line-height:1.4;color:#102a43;background:#f8fafc}
    #course-content details>summary::-webkit-details-marker{display:none}
    #course-content details>summary::after{content:'+';position:absolute;right:14px;top:50%;transform:translateY(-50%);width:26px;height:26px;border:1px solid rgba(15,42,67,.24);border-radius:50%;display:grid;place-items:center;font-size:20px;font-weight:600;line-height:1}
    #course-content details[open]>summary::after{content:'−'}
    #course-content details>p,#course-content details>div,#course-content details>ul,#course-content details>ol{margin-left:16px;margin-right:16px}
    #course-content details>p:first-of-type,#course-content details>div:first-of-type,#course-content details>ul:first-of-type,#course-content details>ol:first-of-type{margin-top:14px}
    #course-content details>p:last-child,#course-content details>div:last-child,#course-content details>ul:last-child,#course-content details>ol:last-child{margin-bottom:14px}
    @media(max-width:640px){#course-content details>summary{padding:12px 44px 12px 14px}#course-content details>summary::after{right:12px;width:24px;height:24px;font-size:18px}}
  `;
  document.head.appendChild(style);
}
function polishLessonDisplay(){
  ensureLessonStyles();
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
  ensureLessonStyles();
  polishLessonDisplay();
  const observer=new MutationObserver(polishLessonDisplay);
  observer.observe(host,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startLessonDisplayPolish,{once:true});else startLessonDisplayPolish();
})();
