(()=>{
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAmbassadorMobilePolish)return;
window.__fundaAmbassadorMobilePolish=true;
const css=`
@media(max-width:760px){
  #ambassadorPartnershipAdmin .ambStats{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
  #ambassadorPartnershipAdmin .ambStat{padding:12px 10px!important;min-height:92px;display:flex;flex-direction:column;justify-content:center}
  #ambassadorPartnershipAdmin .ambStat b{font-size:20px!important;line-height:1.05}
  #ambassadorPartnershipAdmin .ambStat small{font-size:9px!important;line-height:1.35;margin-top:7px}
  #ambassadorPartnershipAdmin .ambHero{padding:15px!important}
  #ambassadorPartnershipAdmin .ambHero h2{font-size:18px!important;line-height:1.2}
  #ambassadorPartnershipAdmin .ambHero p{font-size:10.5px!important;line-height:1.55}
  #ambassadorPartnershipAdmin .ambHero .ambActions{display:grid!important;grid-template-columns:1fr auto;gap:8px!important}
  #ambassadorPartnershipAdmin .ambHero .ambBtn{min-height:42px;white-space:normal}
}
@media(max-width:380px){
  #ambassadorPartnershipAdmin .ambStats{grid-template-columns:1fr 1fr!important}
  #ambassadorPartnershipAdmin .ambHero .ambActions{grid-template-columns:1fr!important}
}
`;
function apply(){if(document.getElementById('ambassadorMobilePolishStyle'))return;let s=document.createElement('style');s.id='ambassadorMobilePolishStyle';s.textContent=css;document.head.appendChild(s)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();