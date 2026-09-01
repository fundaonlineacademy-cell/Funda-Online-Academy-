(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(window.location.pathname)||window.__fundaCalendarNavigationFix)return;
window.__fundaCalendarNavigationFix=true;

function closeCommandDrawer(){
  const side=document.getElementById('side')||document.querySelector('.side');
  if(side)side.classList.remove('open');

  // Keep mobile scrolling usable if another admin navigation helper locked it.
  document.documentElement.classList.remove('overflow-hidden');
  document.body.classList.remove('overflow-hidden');

  document.querySelectorAll('.sidebar-backdrop,.nav-backdrop,[data-sidebar-backdrop],[data-nav-backdrop]').forEach(el=>{
    if(el && el.parentNode)el.remove();
  });
}

function isCalendarNavClick(target){
  return target?.closest?.('#nav [data-s="academy-calendar"], .nav [data-s="academy-calendar"]');
}

// Use capture mode because the calendar button's own handler intentionally stops
// bubbling. This mirrors the core Command Center behaviour on mobile: render the
// selected workspace, close the drawer, and expose the new page immediately.
document.addEventListener('click',event=>{
  if(!isCalendarNavClick(event.target))return;
  closeCommandDrawer();
  requestAnimationFrame(()=>{
    closeCommandDrawer();
    window.scrollTo({top:0,left:0,behavior:'auto'});
  });
},true);
})();
