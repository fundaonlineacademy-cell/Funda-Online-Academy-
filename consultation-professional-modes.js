(()=>{
'use strict';
if(!/(admin-v2|dashboard)\.html$/i.test(location.pathname))return;
const OPTIONS=[['google_meet','Google Meet'],['microsoft_teams','Microsoft Teams'],['phone','Phone call']];
function normaliseValue(v){v=String(v||'').toLowerCase();if(v==='video')return 'google_meet';if(v==='whatsapp')return 'phone';return OPTIONS.some(x=>x[0]===v)?v:'google_meet'}
function patchSelect(sel){if(!sel||sel.name!=='mode')return;const value=normaliseValue(sel.value);const desired=OPTIONS.map(([v,l])=>`${v}:${l}`).join('|');const current=[...sel.options].map(o=>`${o.value}:${o.textContent}`).join('|');if(current!==desired){sel.innerHTML=OPTIONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}sel.value=value}
function patchAdmin(){
 const form=document.getElementById('acbConfirmForm');if(form){patchSelect(form.querySelector('select[name="mode"]'));const lab=[...form.querySelectorAll('label')].find(x=>/Meeting link|contact instruction/i.test(x.textContent||''));if(lab)lab.textContent='Online meeting link / phone contact instruction';}
 const rows=document.getElementById('acbRows');if(rows){[...rows.querySelectorAll('tr')].forEach(r=>{const td=r.children?.[2];if(!td)return;td.textContent=td.textContent.replace(/GOOGLE_MEET/g,'Google Meet').replace(/MICROSOFT_TEAMS/g,'Microsoft Teams').replace(/PHONE/g,'Phone call').replace(/VIDEO/g,'Google Meet').replace(/WHATSAPP/g,'Phone call')})}
}
function patchStudent(){
 const form=document.getElementById('scbForm');if(form){patchSelect(form.querySelector('select[name="mode"]'));const info=[...form.querySelectorAll('.scbInfo')].find(x=>/Google Meet requests|meeting arrangements/i.test(x.textContent||''));if(info)info.textContent='Google Meet and Microsoft Teams requests are reviewed by the relevant Academy department. The confirmed meeting link or phone contact instructions will be provided after approval.';}
}
function patch(){if(/admin-v2\.html$/i.test(location.pathname))patchAdmin();else patchStudent()}
function burst(){[0,80,220,500,1000].forEach(ms=>setTimeout(patch,ms))}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',burst,{once:true});else burst();
document.addEventListener('click',e=>{if(e.target.closest?.('[data-manage-consultation],#scbNew,#menu,#nav button,.nav button'))burst()},true);
document.addEventListener('submit',e=>{if(e.target?.id==='acbConfirmForm'||e.target?.id==='scbForm')patch()},true);
})();
