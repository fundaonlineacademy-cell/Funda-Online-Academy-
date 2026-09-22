(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaSecurityUiFixes)return;
window.__fundaSecurityUiFixes=true;

let auditPage=1;
const PAGE_SIZE=10;
const isSecurityActive=()=>{
  const b=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');
  return !!b&&/\bsecurity\b|\bplatform\b|\bit\b/i.test(String(b.textContent||''));
};
const isAuditActive=()=>{
  const b=document.querySelector('#view [data-sx-tab="audit"]');
  return !!b&&!b.classList.contains('alt');
};

function paginateAudit(){
  if(!isSecurityActive()||!isAuditActive())return;
  const tables=[...document.querySelectorAll('#view .sxPanel .sxTable')];
  const table=tables.find(t=>/actor\s*\/\s*login/i.test(t.textContent||'')&&/department/i.test(t.textContent||''));
  if(!table)return;
  const tbody=table.tBodies?.[0];
  if(!tbody)return;
  const all=[...tbody.querySelectorAll('tr')];
  const rows=all.filter(r=>!r.querySelector('.sxEmpty'));
  const empty=all.find(r=>r.querySelector('.sxEmpty'));
  if(empty){
    empty.style.display='';
    document.getElementById('sxAuditPagerFixed')?.remove();
    return;
  }
  const total=rows.length;
  const maxPage=Math.max(1,Math.ceil(total/PAGE_SIZE));
  auditPage=Math.min(Math.max(1,auditPage),maxPage);
  const start=(auditPage-1)*PAGE_SIZE;
  rows.forEach((r,i)=>{r.style.display=i>=start&&i<start+PAGE_SIZE?'':'none'});

  let pager=document.getElementById('sxAuditPagerFixed');
  if(!pager){
    pager=document.createElement('div');
    pager.id='sxAuditPagerFixed';
    pager.className='sxPager';
    table.insertAdjacentElement('afterend',pager);
  }
  const first=total?start+1:0;
  const last=Math.min(start+PAGE_SIZE,total);
  pager.innerHTML=`<div class="sxMeta">Showing ${first}–${last} of ${total} · 10 audit events per page</div><div><button class="sxBtn alt" id="sxAuditPrev" ${auditPage<=1?'disabled':''}>Previous</button><span class="sxMeta" style="margin:0 8px">Page ${auditPage} of ${maxPage}</span><button class="sxBtn alt" id="sxAuditNext" ${auditPage>=maxPage?'disabled':''}>Next</button></div>`;
  const prev=document.getElementById('sxAuditPrev');
  const next=document.getElementById('sxAuditNext');
  if(prev)prev.onclick=()=>{auditPage=Math.max(1,auditPage-1);paginateAudit()};
  if(next)next.onclick=()=>{auditPage=Math.min(maxPage,auditPage+1);paginateAudit()};
}

async function refreshSecurity(button){
  if(button){button.disabled=true;button.textContent='Refreshing…'}
  try{
    if(window.FundaSecurityCentre?.open){
      await window.FundaSecurityCentre.open();
    }else{
      document.dispatchEvent(new CustomEvent('funda:admin-manual-refresh'));
      await new Promise(r=>setTimeout(r,250));
    }
    setTimeout(()=>{
      paginateAudit();
      const fresh=document.getElementById('sxRefresh');
      if(fresh){
        fresh.textContent='Refreshed';
        setTimeout(()=>{const b=document.getElementById('sxRefresh');if(b)b.textContent='Refresh'},900);
      }
    },80);
  }catch(e){
    console.error('IT refresh failed',e);
    const fresh=document.getElementById('sxRefresh')||button;
    if(fresh){fresh.disabled=false;fresh.textContent='Refresh'}
    alert('IT, Security & Platform could not refresh. Please try again.');
  }
}

document.addEventListener('click',e=>{
  const refresh=e.target.closest?.('#sxRefresh');
  if(refresh){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    refreshSecurity(refresh);
    return;
  }
  const audit=e.target.closest?.('[data-sx-tab="audit"]');
  if(audit){auditPage=1;setTimeout(paginateAudit,80)}
},true);

const view=()=>document.getElementById('view');
function observe(){
  const v=view();
  if(!v)return setTimeout(observe,100);
  new MutationObserver(mutations=>{
    if(mutations.length&&mutations.every(m=>m.target.closest?.('#sxAuditPagerFixed')))return;
    setTimeout(paginateAudit,40);
  }).observe(v,{childList:true,subtree:true});
  setTimeout(paginateAudit,100);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
})();