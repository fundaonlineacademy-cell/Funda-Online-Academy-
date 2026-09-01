(()=>{
'use strict';
if(!/dashboard\.html$/i.test(location.pathname)||window.__fundaStudentCourseCardLayoutGuard)return;
window.__fundaStudentCourseCardLayoutGuard=true;
const STYLE_ID='fundaStudentCourseCardLayoutGuardStyle';
function addStyle(){
  if(document.getElementById(STYLE_ID))return;
  const s=document.createElement('style');s.id=STYLE_ID;s.textContent=`
#myCourses{align-items:start!important}
#myCourses>article{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;align-self:start!important;position:relative!important}
#myCourses>article>div{min-height:0!important;max-height:none!important;height:auto!important;visibility:visible!important;opacity:1!important}
#myCourses>article>div:nth-child(2),#myCourses>article>div:nth-child(3){position:static!important;transform:none!important;visibility:visible!important;opacity:1!important}
#myCourses>article h3{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;white-space:normal!important;word-break:normal!important;overflow-wrap:anywhere!important}
#myCourses>article .course-thumb{display:block!important;flex:none!important}
#myCourses>article a,#myCourses>article button{visibility:visible!important;opacity:1!important}
@media(max-width:767px){
  #myCourses{display:grid!important;grid-template-columns:1fr!important;gap:14px!important}
  #myCourses>article{padding:14px!important;width:100%!important;margin:0!important}
  #myCourses>article>div:first-child{display:block!important}
  #myCourses>article>div:first-child>div{display:grid!important;grid-template-columns:88px minmax(0,1fr)!important;gap:12px!important;align-items:start!important}
  #myCourses>article .course-thumb{width:88px!important;height:62px!important;max-width:88px!important;object-fit:cover!important;border-radius:12px!important}
  #myCourses>article h3{font-size:16px!important;line-height:1.35!important;margin:0!important}
  #myCourses>article>div:nth-child(2){margin-top:12px!important;padding:11px!important;line-height:1.5!important}
  #myCourses>article>div:nth-child(3){margin-top:12px!important;display:grid!important;grid-template-columns:1fr!important;gap:8px!important}
  #myCourses>article>div:nth-child(3)>*{width:100%!important;min-height:44px!important;display:flex!important;align-items:center!important;justify-content:center!important}
}
`;
  document.head.appendChild(s);
}
function repair(){
  const root=document.getElementById('myCourses');if(!root)return;
  root.querySelectorAll(':scope > article').forEach(card=>{
    card.style.setProperty('height','auto','important');
    card.style.setProperty('min-height','0','important');
    card.style.setProperty('max-height','none','important');
    card.style.setProperty('overflow','visible','important');
    [...card.children].forEach(ch=>{
      ch.style.setProperty('min-height','0','important');
      ch.style.setProperty('height','auto','important');
      ch.style.setProperty('max-height','none','important');
    });
  });
}
function init(){addStyle();repair();const root=document.getElementById('myCourses');if(root)new MutationObserver(()=>requestAnimationFrame(repair)).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});setTimeout(repair,300);setTimeout(repair,1200);setTimeout(repair,2600)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();