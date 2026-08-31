(()=>{
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaEmployerMobilePolish)return;
window.__fundaEmployerMobilePolish=true;
const css=`
@media(max-width:620px){
  .epaStats,.gepStats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
  .epaStat,.gepStat{padding:11px 12px!important;min-height:86px!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
  .epaStat small,.gepStat small{font-size:9px!important;line-height:1.25!important}
  .epaStat b,.gepStat b{font-size:21px!important;line-height:1.1!important;margin-top:3px!important}
  .epaGrid,.epaTalent,.gepGrid,.gepForm{grid-template-columns:1fr!important}
  .epaPanel,.gepPanel{padding:14px!important}
  .gepPanel h2{font-size:17px!important}
}
@media(max-width:370px){
  .epaStats,.gepStats{gap:6px!important}
  .epaStat,.gepStat{padding:10px!important;min-height:82px!important}
}
`;
function install(){if(document.getElementById('employerMobilePolishStyle'))return;let s=document.createElement('style');s.id='employerMobilePolishStyle';s.textContent=css;document.head.appendChild(s)}
install();
})();