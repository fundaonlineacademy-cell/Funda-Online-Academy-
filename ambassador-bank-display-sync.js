(()=>{
'use strict';
if(!/ambassador-portal-v2\.html$/i.test(location.pathname)||window.__fundaAmbassadorBankDisplaySync)return;
window.__fundaAmbassadorBankDisplaySync=true;
const $=s=>document.querySelector(s);
function sync(){
 const status=$('#bankStatus'),select=$('#bankName'),other=$('#otherBankName'),branch=$('#branchCode');
 if(!status||!select)return;
 const text=String(status.textContent||'');
 const m=text.match(/Banking details\s+.+?\s+·\s+(.+?)\s+·\s+Account ending/i);
 if(!m)return;
 const bankName=m[1].trim();
 const option=[...select.options].find(o=>o.value===bankName);
 if(option&&select.value!==bankName){
   select.value=bankName;
   select.dispatchEvent(new Event('change',{bubbles:true}));
   if(branch&&!branch.value&&option.dataset.code)branch.value=option.dataset.code;
 }else if(!option&&select.value!=='Other South African Bank'){
   select.value='Other South African Bank';
   select.dispatchEvent(new Event('change',{bubbles:true}));
   if(other)other.value=bankName;
 }
}
function boot(){
 const status=$('#bankStatus');
 if(!status)return setTimeout(boot,500);
 new MutationObserver(()=>setTimeout(sync,0)).observe(status,{childList:true,characterData:true,subtree:true});
 setTimeout(sync,250);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();