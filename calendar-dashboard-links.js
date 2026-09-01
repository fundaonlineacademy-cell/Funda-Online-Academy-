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

function adminLink(){
  const nav=document.getElementById('nav');
  if(!nav||!nav.querySelector('button'))return false;
  if(nav.querySelector('[data-funda-calendar-link]'))return true;
  const a=document.createElement('a');
  a.href='admin-calendar.html';
  a.dataset.fundaCalendarLink='1';
  a.textContent='◷ Executive Calendar & Tasks';
  a.style.cssText='display:block;text-decoration:none;text-align:left;padding:11px;border-radius:9px;font-size:12px;font-weight:700;color:#34455f;background:#fff8df;border:1px solid #ead28b;margin:3px 0 7px;';
  const dashboard=[...nav.querySelectorAll('button')].find(b=>/My Dashboard/i.test(b.textContent||''));
  if(dashboard&&dashboard.nextSibling)nav.insertBefore(a,dashboard.nextSibling);else if(dashboard)nav.appendChild(a);else nav.prepend(a);
  return true;
}

function install(){return isStudent?studentLinks():adminLink()}
function start(){
  install();
  if(isAdmin){
    let elapsed=0;
    const timer=setInterval(()=>{
      elapsed+=500;
      if(adminLink()||elapsed>=120000)clearInterval(timer);
    },500);
    document.addEventListener('click',e=>{
      if(e.target.closest?.('#menu'))setTimeout(adminLink,80);
    },true);
  }else{
    let elapsed=0;
    const timer=setInterval(()=>{
      elapsed+=500;
      if(studentLinks()||elapsed>=15000)clearInterval(timer);
    },500);
  }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
