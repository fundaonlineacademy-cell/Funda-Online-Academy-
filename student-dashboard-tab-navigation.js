(()=>{
'use strict';
if(!/dashboard\.html$/i.test(location.pathname)||window.__fundaDashboardTabNavigation)return;
window.__fundaDashboardTabNavigation=true;
const targets={overview:'overview',courses:'myCoursesSection',announcements:'announcementsSection',library:'librarySection'};
function go(id){const el=document.getElementById(id);if(!el)return;const header=document.querySelector('header');const offset=(header?.getBoundingClientRect().height||0)+12;const top=el.getBoundingClientRect().top+window.scrollY-offset;window.scrollTo({top:Math.max(0,top),behavior:'smooth'});try{history.replaceState(null,'','#'+id)}catch(_){}}
function bind(){document.querySelectorAll('header a[href^="#"]').forEach(a=>{const id=(a.getAttribute('href')||'').slice(1);if(!Object.values(targets).includes(id))return;a.addEventListener('click',e=>{e.preventDefault();go(id)},{passive:false})});
// Also make the main My Courses hero shortcut use the same reliable offset navigation.
document.querySelectorAll('a[href="#myCoursesSection"]').forEach(a=>{if(a.closest('header'))return;a.addEventListener('click',e=>{e.preventDefault();go('myCoursesSection')},{passive:false})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();