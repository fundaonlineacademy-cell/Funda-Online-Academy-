(()=>{
'use strict';
if(!/(student-calendar|admin-calendar)\.html$/i.test(location.pathname))return;
function tidy(){
  document.querySelectorAll('.notice').forEach(n=>n.remove());
  const empty=document.querySelector('.empty');
  if(!empty)return;
  if(/student-calendar\.html$/i.test(location.pathname)){
    const personal=Number(document.getElementById('personalCount')?.textContent||0);
    const week=Number(document.getElementById('weekCount')?.textContent||0);
    const active=[...document.querySelectorAll('[data-view]')].find(b=>b.classList.contains('on'))?.dataset.view;
    if(active==='week'&&week===0&&personal>0)empty.textContent=`Nothing is scheduled in the next 7 days. You have ${personal} personal reminder${personal===1?'':'s'} later — tap Upcoming to view ${personal===1?'it':'them'}.`;
    else if(active==='today')empty.textContent='Nothing is scheduled for today.';
    else if(active==='all')empty.textContent='You have no upcoming Academy events or personal reminders.';
  }else{
    const active=[...document.querySelectorAll('[data-view]')].find(b=>b.classList.contains('on'))?.dataset.view;
    if(active==='today')empty.textContent='Nothing is scheduled for today.';
    else if(active==='week')empty.textContent='Nothing is scheduled in the next 7 days.';
    else empty.textContent='There are no upcoming executive or Academy calendar items.';
  }
}
function start(){tidy();setTimeout(tidy,300);setTimeout(tidy,900);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
document.addEventListener('click',e=>{if(e.target.closest?.('[data-view]'))setTimeout(tidy,40)},true);
})();
