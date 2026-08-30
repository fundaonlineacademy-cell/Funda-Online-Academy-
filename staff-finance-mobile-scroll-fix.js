(()=>{
if(!/staff-portal\.html$/i.test(location.pathname)||window.__fundaStaffFinanceMobileScrollFix)return;
window.__fundaStaffFinanceMobileScrollFix=true;
function installCss(){
  if(document.getElementById('staffFinanceMobileScrollCss'))return;
  const s=document.createElement('style');
  s.id='staffFinanceMobileScrollCss';
  s.textContent=`
#staffFinanceWorkspace{max-width:100%;min-width:0;overflow:hidden}
#staffFinanceWorkspace .sfPanel{max-width:100%;min-width:0;overflow:hidden}
#staffFinanceWorkspace .sfTableWrap{display:block;width:100%;max-width:100%;min-width:0;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;overscroll-behavior-inline:contain;padding-bottom:10px;scrollbar-width:thin}
#staffFinanceWorkspace .sfTableWrap .sfTable{width:max-content!important;min-width:760px;max-width:none!important}
#staffFinanceWorkspace .sfTableWrap::-webkit-scrollbar{height:7px}
#staffFinanceWorkspace .sfTableWrap::-webkit-scrollbar-thumb{background:#c8b67f;border-radius:99px}
#staffFinanceWorkspace .sfTableWrap::-webkit-scrollbar-track{background:#eee8dc;border-radius:99px}
#staffFinanceWorkspace .sfSwipeHint{display:none;margin:8px 0 5px;padding:7px 9px;border-radius:8px;background:#f8edd2;border:1px solid #dfcc96;color:#6f561a;font-size:10px;font-weight:800;line-height:1.35}
@media(max-width:760px){
  #staffFinanceWorkspace .sfSwipeHint{display:block}
  #staffFinanceWorkspace .sfTableWrap .sfTable{min-width:760px!important}
  #staffFinanceWorkspace .sfTableWrap .sfTable th:first-child,
  #staffFinanceWorkspace .sfTableWrap .sfTable td:first-child{position:sticky;left:0;z-index:3;background:#fffaf0;box-shadow:5px 0 8px rgba(33,56,77,.08)}
  #staffFinanceWorkspace .sfTableWrap .sfTable th:first-child{z-index:4}
}
`;
  document.head.appendChild(s);
}
function enhance(){
  installCss();
  document.querySelectorAll('#staffFinanceWorkspace .sfTableWrap').forEach(w=>{
    if(!w.previousElementSibling?.classList?.contains('sfSwipeHint')){
      const h=document.createElement('div');
      h.className='sfSwipeHint';
      h.textContent='↔ Swipe the table left or right to see all Finance columns. The Finance card itself stays in place.';
      w.parentNode.insertBefore(h,w);
    }
    w.setAttribute('tabindex','0');
    w.setAttribute('aria-label','Scrollable Finance table. Swipe left or right to view additional columns.');
  });
}
installCss();
const obs=new MutationObserver(()=>requestAnimationFrame(enhance));
function start(){enhance();obs.observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',enhance,{passive:true})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
