(()=>{
  if(window.__fundaEmployerPublicLink)return;
  window.__fundaEmployerPublicLink=true;

  const path=location.pathname.toLowerCase();
  const isHome=/index\.html$/.test(path)||path.endsWith('/');
  if(!/(^|\/)(index|courses-public|course-view|employers)\.html$/.test(path)&&!path.endsWith('/'))return;

  function makeLink(ref,where='beforebegin'){
    if(ref.parentElement?.querySelector('a[data-employer-link]'))return;
    const n=document.createElement('a');
    n.href='employers.html';
    n.dataset.employerLink='1';
    n.textContent='For Employers';
    n.className=ref.className;
    n.style.color=ref.style.color||'';
    ref.insertAdjacentElement(where,n);
  }

  function refineHomepageBusiness(){
    if(!isHome)return;
    const duplicate=document.getElementById('employerHomePromo');
    if(duplicate)duplicate.remove();

    const business=document.getElementById('business');
    if(!business)return;
    const body=business.firstElementChild;
    if(!body)return;

    const kicker=body.querySelector('p');
    const title=body.querySelector('h2');
    const description=title&&title.nextElementSibling;
    const cta=body.querySelector('a');

    if(kicker)kicker.textContent='FOR ORGANISATIONS & EMPLOYERS';
    if(title)title.textContent='Partner with the Academy around skills and opportunity.';
    if(description)description.textContent='Organisations can work with Funda Online Academy around recruitment interest, supervised workplace exposure, industry skills feedback and certificate verification through our Employer & Industry Partnerships pathway.';
    if(cta){
      cta.href='employers.html';
      cta.textContent='Explore Employer Partnerships →';
      cta.setAttribute('aria-label','Explore Funda Online Academy employer and industry partnerships');
    }
  }

  function polishHomepageIdentity(){
    if(!isHome||document.getElementById('funda-home-identity-polish'))return;
    const style=document.createElement('style');
    style.id='funda-home-identity-polish';
    style.textContent=`
      #academy-identity{
        width:calc(100% - 40px);
        max-width:1280px;
        margin:32px auto!important;
        font-family:'Source Sans 3',Inter,sans-serif!important;
      }
      #academy-identity .funda-identity-head h2,
      #academy-identity .funda-identity-card h3{
        font-family:'Source Sans 3',Inter,sans-serif!important;
        font-weight:700!important;
      }
      #academy-identity .funda-identity-head h2{font-size:26px!important;line-height:1.2!important}
      #academy-identity .funda-identity-kicker{font-size:11px!important;font-weight:700!important;color:#e0c36f!important}
      #academy-identity .funda-identity-motto{font-size:14px!important;font-weight:600!important}
      #academy-identity .funda-identity-card h3{font-size:18px!important;margin-bottom:9px!important}
      #academy-identity .funda-identity-card p{font-size:15px!important;line-height:1.72!important;color:#374151!important}
      #academy-identity .funda-identity-card{padding:21px!important}
      @media(max-width:700px){
        #academy-identity{width:calc(100% - 32px);margin:24px auto!important}
        #academy-identity .funda-identity-head{padding:21px!important}
        #academy-identity .funda-identity-head h2{font-size:22px!important}
        #academy-identity .funda-identity-body{padding:16px!important}
        #academy-identity .funda-identity-card{padding:18px!important}
        #academy-identity .funda-identity-card p{font-size:15px!important;line-height:1.7!important}
      }
    `;
    document.head.appendChild(style);
  }

  function addLinks(){
    document.querySelectorAll('header a').forEach(a=>{
      const t=(a.textContent||'').trim().toLowerCase();
      if(t==='contact')makeLink(a,'beforebegin');
      if(t==='for business'||t==='all courses')makeLink(a,'afterend');
    });

    refineHomepageBusiness();
    polishHomepageIdentity();

    if(/courses-public\.html$/.test(path)&&!document.getElementById('employerPublicPromo')){
      const faq=document.getElementById('faq');
      const how=document.getElementById('how-it-works');
      const anchor=faq||how?.nextElementSibling;
      if(anchor){
        const s=document.createElement('section');
        s.id='employerPublicPromo';
        s.style.cssText='padding:48px 16px;background:linear-gradient(135deg,#fff4dc,#f7edf1,#edf3f4);border-top:1px solid #ead9aa;border-bottom:1px solid #ead9aa';
        s.innerHTML='<div style="max-width:1120px;margin:auto;display:grid;grid-template-columns:1.35fr .65fr;gap:24px;align-items:center"><div><div style="font-size:11px;font-weight:900;letter-spacing:.16em;color:#a87918">EMPLOYERS & INDUSTRY PARTNERS</div><h2 style="font-family:Montserrat,Arial,sans-serif;color:#21384d;font-size:clamp(26px,4vw,38px);margin:7px 0 10px">Build skills. Open doors. Strengthen workplaces.</h2><p style="color:#556476;line-height:1.75;max-width:760px">Employers can partner with Funda Online Academy to consider suitable learners when opportunities arise, host supervised workplace exposure, share the skills their industry needs, and verify Academy certificates.</p><p style="font-size:12px;color:#6b7580"><b>Important:</b> Partnership does not create a guarantee of employment or placement. Learner information is shared only through authorised, consent-based processes.</p></div><div style="display:grid;gap:10px"><a href="employers.html" style="text-decoration:none;text-align:center;background:#21384d;color:white;padding:14px 16px;border-radius:14px;font-weight:800">For Employers</a><a href="employers.html#verify" style="text-decoration:none;text-align:center;background:#fffaf0;color:#21384d;padding:13px 16px;border-radius:14px;border:1px solid #d9c88e;font-weight:800">Verify a Certificate</a></div></div>';
        anchor.parentNode.insertBefore(s,anchor);
        const st=document.createElement('style');
        st.textContent='@media(max-width:720px){#employerPublicPromo>div{grid-template-columns:1fr!important}}';
        document.head.appendChild(st);
      }
    }
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      setTimeout(addLinks,500);
      setTimeout(addLinks,1800);
    });
  }else{
    setTimeout(addLinks,300);
    setTimeout(addLinks,1500);
  }
})();