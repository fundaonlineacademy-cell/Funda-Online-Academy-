(()=>{
if(!/library-admin\.html$/i.test(location.pathname))return;

const css=`
#libraryMobileCards{display:none}
@media(max-width:800px){
  body{overflow-x:hidden}
  main{padding:12px!important}
  main>.flex.justify-between{align-items:flex-start!important;gap:10px!important}
  main>.flex.justify-between h1{font-size:28px!important;line-height:1.08!important}
  main>.flex.justify-between p{line-height:1.55!important}
  main>.flex.justify-between>.btn{min-width:122px;min-height:48px;padding:10px 12px!important;font-size:12px!important;line-height:1.35}
  .stats{gap:10px!important}
  .stats .card{min-height:118px;padding:16px!important}
  .stats .text-2xl{font-size:34px!important;line-height:1!important;margin-top:8px}
  .card.rounded-xl.p-4>.flex.flex-wrap{display:grid!important;grid-template-columns:1fr 116px!important;gap:10px!important}
  #search{grid-column:1/-1;max-width:none!important;min-height:48px;font-size:15px!important}
  #status{max-width:none!important;min-height:48px;font-size:14px!important}
  .card.rounded-xl.p-4>.flex.flex-wrap>.btn{min-height:48px;font-size:12px!important}
  .overflow-x-auto{display:none!important}
  #libraryMobileCards{display:grid;gap:12px;margin-top:14px}
  .lam-card{background:#fff;border:1px solid #dce5f1;border-radius:15px;padding:15px;box-shadow:0 5px 18px #06152f0d}
  .lam-top{display:flex;gap:10px;align-items:flex-start;justify-content:space-between}
  .lam-title{font-family:Montserrat,sans-serif;font-weight:800;font-size:15px;line-height:1.35;color:#06152f;overflow-wrap:anywhere}
  .lam-status{flex:none;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:800;text-transform:uppercase}
  .lam-status.published{background:#dcfce7;color:#167249}.lam-status.draft{background:#f1f5f9;color:#526075}.lam-status.archived{background:#fee2e2;color:#9b2c2c}
  .lam-author{font-size:11px;color:#718096;margin-top:5px}
  .lam-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;padding-top:12px;border-top:1px solid #e7edf5}
  .lam-meta{min-width:0}.lam-label{display:block;font-size:8px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#8a97aa;margin-bottom:4px}.lam-value{font-size:11px;line-height:1.4;color:#26364f;overflow-wrap:anywhere}
  .lam-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:14px}
  .lam-actions button{min-height:48px;border:0;border-radius:10px;font-size:12px;font-weight:800;cursor:pointer}
  .lam-edit{background:#edf4ff;color:#0b2f70}.lam-archive{background:#fff1f1;color:#9b2c2c;border:1px solid #f3cece!important}
  .lam-empty{text-align:center;padding:26px 16px;color:#718096;border:1px dashed #cfd9e6;border-radius:12px;background:#f8fafc;font-size:13px}
  #modal{padding:10px!important;align-items:start!important;overflow-y:auto}
  #modal>div{margin:8px auto;max-height:none!important;padding:16px!important;border-radius:16px!important}
  #modal .field{min-height:46px;font-size:13px!important}
  #modal textarea.field{min-height:88px}
  #modal .btn{min-height:46px;font-size:12px!important}
}
`;

function injectStyle(){if(document.getElementById('libraryAdminMobileStyle'))return;const s=document.createElement('style');s.id='libraryAdminMobileStyle';s.textContent=css;document.head.appendChild(s)}
function escM(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function courseName(id){try{return id?(C.find(c=>c.id===id)?.title||'Course restricted'):'All students'}catch(_){return id?'Course restricted':'All students'}}
function filtered(){try{const term=(document.getElementById('search')?.value||'').toLowerCase(),st=document.getElementById('status')?.value||'';return (R||[]).filter(x=>(!st||x.publication_status===st)&&(!term||[x.title,x.author,x.category,x.subject].join(' ').toLowerCase().includes(term)))}catch(_){return []}}
function build(){
  const table=document.querySelector('.overflow-x-auto');if(!table)return;
  let host=document.getElementById('libraryMobileCards');if(!host){host=document.createElement('div');host.id='libraryMobileCards';host.setAttribute('aria-live','polite');table.insertAdjacentElement('afterend',host)}
  const a=filtered();
  host.innerHTML=a.length?a.map(x=>{const status=String(x.publication_status||'draft').toLowerCase();return `<article class="lam-card">
    <div class="lam-top"><div><div class="lam-title">${escM(x.title||'Untitled resource')}</div><div class="lam-author">${escM(x.author||x.publisher||'Funda Online Academy')}</div></div><span class="lam-status ${escM(status)}">${escM(status)}</span></div>
    <div class="lam-grid">
      <div class="lam-meta"><span class="lam-label">Category</span><div class="lam-value">${escM(x.category||'—')}${x.subject?` · ${escM(x.subject)}`:''}</div></div>
      <div class="lam-meta"><span class="lam-label">Format</span><div class="lam-value">${escM(x.file_format||x.resource_type||'—')}</div></div>
      <div class="lam-meta"><span class="lam-label">Course / Access</span><div class="lam-value">${escM(courseName(x.course_id))}</div></div>
      <div class="lam-meta"><span class="lam-label">Download</span><div class="lam-value">${x.is_downloadable?'Allowed':'Not allowed'}</div></div>
    </div>
    <div class="lam-actions"><button class="lam-edit" type="button" onclick="edit('${escM(x.id)}')">Edit Resource</button><button class="lam-archive" type="button" onclick="archive('${escM(x.id)}')">Archive</button></div>
  </article>`}).join(''):'<div class="lam-empty">No Library resources match your current search or filter.</div>';
}
function boot(){injectStyle();const old=window.render;if(typeof old==='function'&&!old.__libraryMobileWrapped){const wrapped=function(){const out=old.apply(this,arguments);build();return out};wrapped.__libraryMobileWrapped=true;window.render=wrapped}build();window.addEventListener('resize',()=>{if(innerWidth<=800)build()},{passive:true})}
if(document.readyState==='complete')setTimeout(boot,80);else window.addEventListener('load',()=>setTimeout(boot,80),{once:true});
})();