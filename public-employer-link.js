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

  function polishHomepageFooter(){
    if(!isHome)return;
    const footer=document.querySelector('body > footer')||document.querySelector('footer');
    if(!footer)return;

    if(!footer.dataset.fundaHomeFooter){
      footer.dataset.fundaHomeFooter='1';
      footer.className='funda-home-footer';
      footer.innerHTML=`
        <div class="funda-home-footer-shell">
          <div class="funda-home-footer-grid">
            <div class="funda-home-footer-brand">
              <div class="funda-home-footer-brandrow">
                <img src="logo.png" alt="Funda Online Academy" class="funda-home-footer-logo">
                <div>
                  <div class="funda-home-footer-name">FUNDA ONLINE ACADEMY</div>
                  <div class="funda-home-footer-motto">LEARN. GROW. ACHIEVE.</div>
                </div>
              </div>
              <p>Practical, flexible online learning designed to help people build useful knowledge, skills and confidence.</p>
              <div class="funda-home-online-badge" aria-label="Funda Online Academy is one hundred percent online"><span aria-hidden="true">●</span> 100% Online</div>
            </div>

            <nav class="funda-home-footer-nav" aria-label="Footer navigation">
              <div class="funda-home-footer-linkgroups">
                <div class="funda-home-footer-linkgroup funda-home-footer-linkgroup-primary">
                  <h2>Explore</h2>
                  <a href="courses-public.html">Courses</a>
                  <a href="academy-map.html">Academy Map</a>
                  <a href="employers.html">Employers &amp; Industry</a>
                </div>
                <div class="funda-home-footer-linkgroup funda-home-footer-linkgroup-secondary">
                  <a href="ambassadors.html">Ambassadors</a>
                  <a href="login.html">Student Login</a>
                  <a href="register.html">Register</a>
                  <a href="policies.html">Policies &amp; Legal</a>
                </div>
              </div>
            </nav>

            <div class="funda-home-footer-contact">
              <h2>Contact the Academy</h2>
              <div class="funda-home-contact-item">
                <span class="funda-home-contact-label">General Enquiries</span>
                <a href="mailto:infor@fundaonlineacademy.co.za">infor@fundaonlineacademy.co.za</a>
              </div>
              <div class="funda-home-contact-item">
                <span class="funda-home-contact-label">WhatsApp</span>
                <a href="https://wa.me/27699608590?text=Hello%20Funda%20Online%20Academy%2C%20I%20would%20like%20to%20make%20a%20general%20enquiry." target="_blank" rel="noopener noreferrer">069 960 8590</a>
              </div>
              <div class="funda-home-contact-item funda-home-contact-location">
                <span class="funda-home-contact-label">Learning Location</span>
                <span>100% Online</span>
              </div>
            </div>
          </div>

          <div class="funda-home-footer-bottom">
            <span>© ${new Date().getFullYear()} Funda Online Academy. All rights reserved.</span>
            <span>Learn. Grow. Achieve.</span>
          </div>
        </div>`;
    }

    if(document.getElementById('funda-home-footer-polish'))return;
    const style=document.createElement('style');
    style.id='funda-home-footer-polish';
    style.textContent=`
      .funda-home-footer{background:#06152f;color:#fff;border-top:1px solid rgba(201,154,46,.35);font-family:'Source Sans 3',Inter,sans-serif!important}
      .funda-home-footer-shell{max-width:1280px;margin:0 auto;padding:42px 20px 22px}
      .funda-home-footer-grid{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(310px,.95fr) minmax(250px,.8fr);gap:42px;align-items:start}
      .funda-home-footer-brandrow{display:flex;align-items:center;gap:13px}
      .funda-home-footer-logo{width:46px;height:46px;object-fit:contain;background:#fff;border-radius:11px;padding:4px}
      .funda-home-footer-name{font-size:17px;line-height:1.15;font-weight:700;letter-spacing:-.01em;color:#fff}
      .funda-home-footer-motto{margin-top:5px;font-size:11px;line-height:1.2;font-weight:600;letter-spacing:.15em;color:#efd78e}
      .funda-home-footer-brand p{max-width:440px;margin:17px 0 14px;font-size:14px;line-height:1.7;color:#d7e2f0}
      .funda-home-online-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(239,215,142,.45);border-radius:999px;background:rgba(255,255,255,.06);padding:8px 12px;font-size:12px;font-weight:600;color:#f2dfaa}
      .funda-home-online-badge span{font-size:9px;color:#c99a2e}
      .funda-home-footer h2{margin:0;font-family:'Source Sans 3',Inter,sans-serif!important;font-size:15px;line-height:1.45;font-weight:700;color:#fff}
      .funda-home-footer-nav{display:block}
      .funda-home-footer-linkgroups{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:24px;align-items:start}
      .funda-home-footer-linkgroup{display:grid;grid-auto-rows:minmax(22px,auto);align-content:start;align-items:start;gap:8px;margin:0;padding:0}
      .funda-home-footer-linkgroup h2,.funda-home-footer-linkgroup a{display:flex;align-items:flex-start;min-height:22px;margin:0;padding:0}
      .funda-home-footer a{color:#dbe6f3;text-decoration:none;font-size:14px;line-height:1.45;transition:color .18s ease}
      .funda-home-footer a:hover{color:#efd78e}
      .funda-home-footer a:focus-visible{outline:3px solid rgba(201,154,46,.55);outline-offset:3px;border-radius:4px}
      .funda-home-footer-contact{display:grid;gap:14px}
      .funda-home-footer-contact h2{margin:0 0 1px}
      .funda-home-contact-item{display:grid;gap:3px}
      .funda-home-contact-label{font-size:11px;line-height:1.35;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#efd78e}
      .funda-home-contact-location>span:last-child{font-size:14px;line-height:1.45;color:#dbe6f3}
      .funda-home-footer-bottom{display:flex;justify-content:space-between;gap:20px;margin-top:28px;padding-top:18px;border-top:1px solid rgba(255,255,255,.13);font-size:12px;line-height:1.5;color:#aebfd3}

      #fundaSubscribe{
        width:calc(100% - 40px)!important;
        max-width:1280px!important;
        margin:32px auto!important;
        padding:26px 28px!important;
        font-family:'Source Sans 3',Inter,sans-serif!important;
      }
      #fundaSubscribe h3{font-family:'Source Sans 3',Inter,sans-serif!important;font-size:23px!important;line-height:1.2!important;font-weight:700!important;margin-bottom:7px!important}
      #fundaSubscribe>p{font-size:15px!important;line-height:1.65!important;margin-bottom:17px!important;color:#d9e3ef!important}
      #fundaSubscribe .fundaSubForm{gap:10px!important}
      #fundaSubscribe .fundaSubForm input{min-height:44px!important;padding:11px 12px!important;font-family:'Source Sans 3',Inter,sans-serif!important;font-size:14px!important}
      #fundaSubscribe .fundaSubForm button{min-height:44px!important;padding:11px 17px!important;font-family:'Source Sans 3',Inter,sans-serif!important;font-size:14px!important;font-weight:700!important}
      #fundaSubscribe .fundaSubConsent{margin-top:12px!important;font-size:12px!important;line-height:1.55!important}
      #fundaSubscribe .fundaSubConsent input{margin-top:2px}
      #fundaSubscribe .fundaSubMsg{margin-top:10px!important;font-size:12px!important;line-height:1.5!important}

      @media(max-width:900px){
        .funda-home-footer-grid{grid-template-columns:1fr 1fr;gap:32px}
        .funda-home-footer-brand{grid-column:1/-1}
      }
      @media(max-width:560px){
        .funda-home-footer-shell{padding:34px 16px 20px}
        .funda-home-footer-grid{grid-template-columns:1fr;gap:30px}
        .funda-home-footer-brand{grid-column:auto}
        .funda-home-footer-linkgroups{gap:10px 18px}
        .funda-home-footer a{font-size:15px}
        .funda-home-footer-bottom{flex-direction:column;gap:6px;margin-top:26px}
        #fundaSubscribe{width:calc(100% - 32px)!important;margin:24px auto!important;padding:22px 18px!important}
        #fundaSubscribe h3{font-size:21px!important}
        #fundaSubscribe>p{font-size:14px!important}
        #fundaSubscribe .fundaSubConsent{font-size:12px!important}
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
    polishHomepageFooter();

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