(()=>{
'use strict';
const path=window.location.pathname;
const isStudent=/dashboard\.html$/i.test(path);
const isAdmin=/admin-v2\.html$/i.test(path);
if(!isStudent&&!isAdmin)return;

function studentLinks(){
  const desktop=document.querySelector('header nav');
  if(desktop&&!desktop.querySelector('[data-funda-calendar-link]')){
    const a=document.createElement('a');
    a.href='student-calendar.html';
    a.dataset.fundaCalendarLink='1';
    a.textContent='Calendar';
    desktop.appendChild(a);
  }
  const mobile=document.querySelector('header .mobile-scroll');
  if(mobile&&!mobile.querySelector('[data-funda-calendar-link]')){
    const a=document.createElement('a');
    a.href='student-calendar.html';
    a.dataset.fundaCalendarLink='1';
    a.className='shrink-0 px-3 py-2 rounded-full bg-white/10';
    a.textContent='📅 Calendar';
    mobile.appendChild(a);
  }
  return !!(desktop||mobile);
}

function adminDashboardActive(){
  const h=document.querySelector('#view h1');
  return !!h&&/business health overview/i.test(h.textContent||'');
}

function removeAdminSidebarCalendar(){
  document.querySelectorAll('#nav [data-funda-calendar-link]').forEach(x=>x.remove());
}

function ensureAdminCalendarCard(){
  removeAdminSidebarCalendar();

  if(!adminDashboardActive()){
    document.getElementById('fundaAdminExecutiveCalendarAccess')?.remove();
    return false;
  }

  const host=document.getElementById('view');
  if(!host)return false;

  let card=document.getElementById('fundaAdminExecutiveCalendarAccess');
  if(!card){
    card=document.createElement('section');
    card.id='fundaAdminExecutiveCalendarAccess';
    card.style.cssText='background:#fff;border:1px solid #dbe4ee;border-radius:16px;padding:16px;margin:14px 0 4px;box-shadow:0 6px 20px rgba(7,27,49,.06);font-family:inherit';
    card.innerHTML='<div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap"><div><div style="font-size:10px;font-weight:900;letter-spacing:.12em;color:#a27c24;text-transform:uppercase">EXECUTIVE PLANNING</div><h3 style="margin:4px 0;color:#071b31;font-size:18px">Executive Calendar &amp; Tasks</h3><p style="margin:0;color:#66758a;font-size:11px;line-height:1.5">Open the existing executive calendar and task workspace.</p></div><a href="admin-calendar.html" style="display:inline-flex;align-items:center;text-decoration:none;border:0;border-radius:10px;background:#071b31;color:#fff;padding:10px 14px;font-size:10px;font-weight:800;white-space:nowrap">Open Executive Calendar &amp; Tasks →</a></div>';
  }

  const house=document.getElementById('fundaAdminHouseRules');
  const snapshot=document.getElementById('ceoActionSnapshot');

  if(house&&house.parentNode===host){
    if(card.parentNode!==host||card.nextElementSibling!==house){
      house.insertAdjacentElement('beforebegin',card);
    }
  }else if(snapshot&&snapshot.parentNode===host){
    if(card.parentNode!==host||card.previousElementSibling!==snapshot){
      snapshot.insertAdjacentElement('afterend',card);
    }
  }else if(card.parentNode!==host){
    host.appendChild(card);
  }

  return true;
}

function install(){
  if(isStudent)return studentLinks();
  return ensureAdminCalendarCard();
}

function start(){
  install();
  if(isAdmin){
    const view=document.getElementById('view');
    if(view){
      let queued=false;
      new MutationObserver(()=>{
        if(queued)return;
        queued=true;
        setTimeout(()=>{queued=false;ensureAdminCalendarCard()},90);
      }).observe(view,{childList:true,subtree:false});
    }
    document.addEventListener('click',e=>{
      const b=e.target.closest?.('#nav button');
      if(b)setTimeout(ensureAdminCalendarCard,120);
    },true);
    setTimeout(ensureAdminCalendarCard,900);
    setTimeout(ensureAdminCalendarCard,1600);
  }else{
    let elapsed=0;
    const timer=setInterval(()=>{
      elapsed+=500;
      if(studentLinks()||elapsed>=15000)clearInterval(timer);
    },500);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();