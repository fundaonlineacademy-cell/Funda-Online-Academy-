(()=>{
'use strict';
if(window.__fundaAdminDashboardCompanyDetails)return;
window.__fundaAdminDashboardCompanyDetails=true;

const DETAILS=[
  ['Registered Business','Funda Online Academy'],
  ['Company Registration','2023/830451/07'],
  ['Professional Development','International CPD Accredited Trainer'],
  ['Delivery Model','100% Online Learning & Support']
];

const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function installStyle(){
  if(document.getElementById('fundaAdminCompanyDetailsStyle'))return;
  const s=document.createElement('style');
  s.id='fundaAdminCompanyDetailsStyle';
  s.textContent=`
    #fundaAdminCompanyDetails{margin:14px 0 0;border:1px solid #dbe4ee;border-radius:16px;background:#fff;box-shadow:0 6px 20px rgba(7,27,49,.05);overflow:hidden}
    .fundaAdminCompanyHead{padding:17px 18px 15px;border-bottom:1px solid #e7edf4;background:linear-gradient(135deg,#ffffff,#fbfcfe)}
    .fundaAdminCompanyKicker{font-size:9px;font-weight:900;letter-spacing:.13em;color:#a27c24;text-transform:uppercase}
    .fundaAdminCompanyHead h3{margin:4px 0 3px;color:#071b31;font-size:18px}
    .fundaAdminCompanyHead p{margin:0;color:#66758a;font-size:11px;line-height:1.5}
    .fundaAdminCompanyGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0}
    .fundaAdminCompanyItem{padding:15px 17px;min-height:84px;border-right:1px solid #e7edf4}
    .fundaAdminCompanyItem:last-child{border-right:0}
    .fundaAdminCompanyItem span{display:block;color:#78879a;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
    .fundaAdminCompanyItem strong{display:block;margin-top:6px;color:#071b31;font-size:12px;line-height:1.45}
    #fundaAdminDashboardFooter{margin:12px 0 4px;padding:13px 16px;border-radius:14px;background:#07172f;color:#dce6f2;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:10px;line-height:1.5}
    .fundaAdminFooterBrand{font-weight:800}
    .fundaAdminFooterLinks{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
    .fundaAdminFooterLinks a{color:#ead28e;text-decoration:none;font-weight:800}
    .fundaAdminFooterLinks a:hover{text-decoration:underline}
    @media(max-width:1000px){.fundaAdminCompanyGrid{grid-template-columns:repeat(2,minmax(0,1fr))}.fundaAdminCompanyItem:nth-child(2){border-right:0}.fundaAdminCompanyItem:nth-child(-n+2){border-bottom:1px solid #e7edf4}}
    @media(max-width:620px){
      .fundaAdminCompanyGrid{grid-template-columns:1fr}
      .fundaAdminCompanyItem{border-right:0;border-bottom:1px solid #e7edf4}
      .fundaAdminCompanyItem:last-child{border-bottom:0}
      #fundaAdminDashboardFooter{align-items:flex-start;flex-direction:column}
      .fundaAdminFooterLinks{gap:10px 14px}
    }
  `;
  document.head.appendChild(s);
}

function isDashboard(){
  const h=document.querySelector('#view h1');
  return !!h&&/business health overview/i.test(h.textContent||'');
}

function createDetails(){
  const section=document.createElement('section');
  section.id='fundaAdminCompanyDetails';
  section.setAttribute('aria-labelledby','fundaAdminCompanyDetailsHeading');
  section.innerHTML=`
    <div class="fundaAdminCompanyHead">
      <div class="fundaAdminCompanyKicker">ACADEMY DETAILS</div>
      <h3 id="fundaAdminCompanyDetailsHeading">Funda Online Academy</h3>
      <p>Core company information for quick reference from the CEO dashboard.</p>
    </div>
    <div class="fundaAdminCompanyGrid">
      ${DETAILS.map(([label,value])=>`<div class="fundaAdminCompanyItem"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}
    </div>`;
  return section;
}

function createFooter(){
  const footer=document.createElement('footer');
  footer.id='fundaAdminDashboardFooter';
  footer.innerHTML=`
    <div class="fundaAdminFooterBrand">© 2026 Funda Online Academy. All rights reserved.</div>
    <nav class="fundaAdminFooterLinks" aria-label="Admin Dashboard legal links">
      <a href="policies.html#terms" target="_blank" rel="noopener">Terms &amp; Conditions</a>
      <a href="policies.html#privacy" target="_blank" rel="noopener">Privacy Policy</a>
      <a href="policies.html" target="_blank" rel="noopener">Policies &amp; Legal</a>
    </nav>`;
  return footer;
}

function clearOutsideDashboard(){
  if(isDashboard())return false;
  document.getElementById('fundaAdminCompanyDetails')?.remove();
  document.getElementById('fundaAdminDashboardFooter')?.remove();
  return true;
}

function reconcile(){
  installStyle();
  const host=document.getElementById('view');
  if(!host||clearOutsideDashboard())return;

  let details=document.getElementById('fundaAdminCompanyDetails');
  if(!details)details=createDetails();

  let footer=document.getElementById('fundaAdminDashboardFooter');
  if(!footer)footer=createFooter();

  const identity=document.getElementById('fundaAdminAcademyIdentity');
  const rules=document.getElementById('fundaAdminHouseRules');

  if(identity&&identity.parentNode===host){
    if(details.parentNode!==host||details.previousElementSibling!==identity)identity.insertAdjacentElement('afterend',details);
  }else if(rules&&rules.parentNode===host){
    if(details.parentNode!==host||details.previousElementSibling!==rules)rules.insertAdjacentElement('afterend',details);
  }else if(details.parentNode!==host){
    host.appendChild(details);
  }

  if(footer.parentNode!==host||footer.previousElementSibling!==details){
    details.insertAdjacentElement('afterend',footer);
  }
}

function boot(){
  installStyle();
  const view=document.getElementById('view');
  if(!view)return setTimeout(boot,250);
  let scheduled=false;
  new MutationObserver(()=>{
    if(scheduled)return;
    scheduled=true;
    setTimeout(()=>{scheduled=false;reconcile()},70);
  }).observe(view,{childList:true,subtree:false});
  reconcile();
  setTimeout(reconcile,900);
  setTimeout(reconcile,1700);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();