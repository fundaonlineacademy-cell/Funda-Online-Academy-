(()=>{
'use strict';
if(window.__fundaAdminDashboardCompanyDetails)return;
window.__fundaAdminDashboardCompanyDetails=true;

function installStyle(){
  if(document.getElementById('fundaAdminCompanyDetailsStyle'))return;
  const s=document.createElement('style');
  s.id='fundaAdminCompanyDetailsStyle';
  s.textContent=`
    #fundaAdminPermanentFooter{
      margin:18px 0 4px;
      border-radius:18px;
      overflow:hidden;
      background:linear-gradient(135deg,#07172f,#0b2f70);
      color:#fff;
      box-shadow:0 10px 28px rgba(4,22,51,.16);
    }
    .fundaAdminFooterTop{
      display:grid;
      grid-template-columns:1.15fr 1fr 1fr;
      gap:0;
      padding:20px 22px;
    }
    .fundaAdminFooterBlock{padding:2px 20px;border-right:1px solid rgba(255,255,255,.12)}
    .fundaAdminFooterBlock:first-child{padding-left:0}
    .fundaAdminFooterBlock:last-child{border-right:0;padding-right:0}
    .fundaAdminFooterBrand{font-size:16px;font-weight:900;letter-spacing:.02em;color:#fff}
    .fundaAdminFooterMotto{margin-top:4px;color:#e4c76f;font-size:9px;font-weight:900;letter-spacing:.16em}
    .fundaAdminFooterIntro{margin:10px 0 0;max-width:390px;color:#dbe7f7;font-size:11px;line-height:1.6}
    .fundaAdminFooterHeading{font-size:10px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;color:#e4c76f;margin-bottom:9px}
    .fundaAdminFooterMeta{display:grid;gap:8px}
    .fundaAdminFooterMetaItem span{display:block;color:#9fb5d2;font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}
    .fundaAdminFooterMetaItem strong{display:block;margin-top:2px;color:#fff;font-size:11px;line-height:1.4}
    .fundaAdminFooterContact a{color:#fff;text-decoration:none;font-weight:900}
    .fundaAdminFooterContact a:hover{text-decoration:underline}
    .fundaAdminFooterBottom{
      border-top:1px solid rgba(255,255,255,.12);
      padding:11px 22px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      flex-wrap:wrap;
      color:#b9c9dd;
      font-size:9px;
      line-height:1.5;
    }
    .fundaAdminFooterLinks{display:flex;gap:13px;flex-wrap:wrap}
    .fundaAdminFooterLinks a{color:#e8d184;text-decoration:none;font-weight:800}
    .fundaAdminFooterLinks a:hover{text-decoration:underline}
    @media(max-width:900px){
      .fundaAdminFooterTop{grid-template-columns:1fr 1fr}
      .fundaAdminFooterBlock:first-child{grid-column:1/-1;border-right:0;border-bottom:1px solid rgba(255,255,255,.12);padding:0 0 15px;margin-bottom:15px}
      .fundaAdminFooterBlock:nth-child(2){padding-left:0}
    }
    @media(max-width:620px){
      .fundaAdminFooterTop{grid-template-columns:1fr;padding:18px}
      .fundaAdminFooterBlock,.fundaAdminFooterBlock:nth-child(2),.fundaAdminFooterBlock:last-child{
        padding:13px 0;
        border-right:0;
        border-bottom:1px solid rgba(255,255,255,.12)
      }
      .fundaAdminFooterBlock:first-child{padding-top:0}
      .fundaAdminFooterBlock:last-child{border-bottom:0;padding-bottom:0}
      .fundaAdminFooterBottom{padding:11px 18px;align-items:flex-start;flex-direction:column}
    }
  `;
  document.head.appendChild(s);
}

function createFooter(){
  const footer=document.createElement('footer');
  footer.id='fundaAdminPermanentFooter';
  footer.setAttribute('aria-label','Funda Online Academy Admin footer');
  footer.innerHTML=`
    <div class="fundaAdminFooterTop">
      <section class="fundaAdminFooterBlock">
        <div class="fundaAdminFooterBrand">FUNDA ONLINE ACADEMY</div>
        <div class="fundaAdminFooterMotto">LEARN. GROW. ACHIEVE.</div>
        <p class="fundaAdminFooterIntro">Internal Academy reference information for the Admin Command Center.</p>
      </section>

      <section class="fundaAdminFooterBlock">
        <div class="fundaAdminFooterHeading">Academy Details</div>
        <div class="fundaAdminFooterMeta">
          <div class="fundaAdminFooterMetaItem"><span>Registered Business</span><strong>Funda Online Academy</strong></div>
          <div class="fundaAdminFooterMetaItem"><span>Company Registration</span><strong>2023/830451/07</strong></div>
          <div class="fundaAdminFooterMetaItem"><span>Professional Development</span><strong>International CPD Accredited Trainer</strong></div>
        </div>
      </section>

      <section class="fundaAdminFooterBlock fundaAdminFooterContact">
        <div class="fundaAdminFooterHeading">Academy Contact</div>
        <div class="fundaAdminFooterMeta">
          <div class="fundaAdminFooterMetaItem"><span>WhatsApp</span><strong><a href="https://wa.me/27699608590?text=Hello%20Funda%20Online%20Academy" target="_blank" rel="noopener noreferrer">069 960 8590</a></strong></div>
          <div class="fundaAdminFooterMetaItem"><span>CEO Professional Email</span><strong><a href="mailto:aziwe@fundaonlineacademy.co.za">aziwe@fundaonlineacademy.co.za</a></strong></div>
          <div class="fundaAdminFooterMetaItem"><span>Admin Environment</span><strong>Funda Admin Command Center</strong></div>
        </div>
      </section>
    </div>

    <div class="fundaAdminFooterBottom">
      <span>© 2026 Funda Online Academy. All rights reserved.</span>
      <nav class="fundaAdminFooterLinks" aria-label="Admin legal links">
        <a href="policies.html#terms" target="_blank" rel="noopener">Terms &amp; Conditions</a>
        <a href="policies.html#privacy" target="_blank" rel="noopener">Privacy Policy</a>
        <a href="policies.html" target="_blank" rel="noopener">Policies &amp; Legal</a>
      </nav>
    </div>`;
  return footer;
}

function ensureFooter(){
  installStyle();
  const content=document.querySelector('.main .content');
  const view=document.getElementById('view');
  if(!content||!view)return false;

  // Remove the earlier My Dashboard-only company-details/footer implementation
  // so the permanent footer is the single Academy-details footer everywhere.
  document.getElementById('fundaAdminCompanyDetails')?.remove();
  document.getElementById('fundaAdminDashboardFooter')?.remove();

  let footer=document.getElementById('fundaAdminPermanentFooter');
  if(!footer)footer=createFooter();

  if(footer.parentNode!==content||footer.previousElementSibling!==view){
    view.insertAdjacentElement('afterend',footer);
  }
  return true;
}

function boot(){
  if(!ensureFooter()){
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      if(ensureFooter()||tries>=40)clearInterval(timer);
    },150);
  }

  // Individual Admin tabs replace #view contents, but the footer sits outside
  // #view and therefore remains visible at the bottom of every Admin workspace.
  const main=document.querySelector('.main');
  if(main){
    let queued=false;
    new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      setTimeout(()=>{queued=false;ensureFooter()},80);
    }).observe(main,{childList:true,subtree:true});
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();