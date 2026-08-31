(()=>{
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaCommunicationForceV2)return;
window.__fundaCommunicationForceV2=true;
let timer=null,working=false,lastRun=0;
function communicationActive(){
  const active=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');
  return !!active&&/communication/i.test(active.textContent||'');
}
function legacyVisible(){
  const view=document.getElementById('view');
  if(!view)return false;
  if(view.querySelector('.comx'))return false;
  const text=(view.textContent||'').replace(/\s+/g,' ').toLowerCase();
  return text.includes('communication hub')||text.includes('create announcement / message')||text.includes('announcements, messages and student-facing information');
}
async function enforce(){
  if(working||!communicationActive()||!legacyVisible())return;
  const api=window.FundaCommunicationCentre;
  if(!api||typeof api.open!=='function')return;
  const now=Date.now();if(now-lastRun<250)return;lastRun=now;working=true;
  try{await api.open()}catch(e){console.error('Communication Centre enforcement failed',e)}finally{working=false}
}
function start(){
  const view=document.getElementById('view');
  if(view){new MutationObserver(()=>setTimeout(enforce,40)).observe(view,{childList:true,subtree:true,characterData:true})}
  document.addEventListener('click',e=>{const b=e.target.closest?.('#nav button,.nav button');if(b&&/communication/i.test(b.textContent||'')){setTimeout(enforce,80);setTimeout(enforce,350)}},true);
  timer=setInterval(enforce,700);
  setTimeout(enforce,200);setTimeout(enforce,1000);setTimeout(enforce,2200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();