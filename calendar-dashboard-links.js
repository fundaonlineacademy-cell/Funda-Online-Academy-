(()=>{
'use strict';
const path=window.location.pathname;
const isStudent=/dashboard\.html$/i.test(path);
const isAdmin=/admin-v2\.html$/i.test(path);
if(!isStudent&&!isAdmin)return;
let attempts=0;
function studentLinks(){
  let mounted=false;
  const desktop=document.querySelector('header nav');
  if(desktop&&!desktop.querySelector('[data-funda-calendar-link]')){
    const a=document.createElement('a');
    a.href='student-calendar.html';
    a.dataset.fundaCalendarLink='1';
    a.textContent='Calendar';
    desktop.appendChild(a);
  }
  if(desktop)mounted=true;
  const mobile=document.querySelector('header .mobile-scroll');
  if(mobile&&!mobile.querySelector('[data-funda-calendar-link]')){
    const a=document.createElement('a');
    a.href='student-calendar.html';
    a.dataset.fundaCalendarLink='1';
    a.className='shrink-0 px-3 py-2 rounded-full bg-white/10';
    a.textContent='📅 Calendar';
    mobile.appendChild(a);
  }
  if(mobile)mounted=true;
  return mounted;
}
function adminLink(){
  const nav=document.getElementById('nav');
  if(!nav)return false;
  if(!nav.querySelector('[data-funda-calendar-link]')){
    const a=document.createElement('a');
    a.href='admin-calendar.html';
    a.dataset.fundaCalendarLink='1';
    a.textContent='◷ Executive Calendar & Tasks';
    a.style.cssText='display:block;text-decoration:none;text-align:left;padding:11px;border-radius:9px;font-size:12px;font-weight:700;color:#34455f;background:#fff8df;border:1px solid #ead28b;margin:3px 0 7px;';
    const first=nav.firstElementChild;
    if(first&&first.nextSibling)nav.insertBefore(a,first.nextSibling);else nav.appendChild(a);
  }
  return true;
}
function mount(){
  attempts++;
  const done=isStudent?studentLinks():adminLink();
  if(!done&&attempts<40)setTimeout(mount,100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
