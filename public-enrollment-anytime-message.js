(()=>{
  'use strict';
  if(window.__fundaEnrollmentAnytimeMessage)return;
  window.__fundaEnrollmentAnytimeMessage=true;

  const path=location.pathname.toLowerCase();
  const isHome=path==='/'||/\/index\.html$/.test(path)||path.endsWith('/');
  const isCourse=/\/course-view\.html$/.test(path);
  const isAmbassador=/\/ambassadors\.html$/.test(path);
  if(!isHome&&!isCourse&&!isAmbassador)return;

  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  const startedAt=Date.now();

  function addStyles(){
    if(document.getElementById('fundaEnrollmentAnytimeStyles'))return;
    const style=document.createElement('style');
    style.id='fundaEnrollmentAnytimeStyles';
    style.textContent=`
      .funda-enrol-font{font-family:var(--funda-ui-font,"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif)!important}
      #fundaEnrollmentTimingStrip{background:linear-gradient(90deg,#fff9e9,#ffffff 50%,#f8edf1);border-bottom:1px solid #e9dfc5;border-top:1px solid #efe7d4}
      #fundaEnrollmentTimingStrip .funda-enrol-strip-shell{max-width:1180px;margin:auto;padding:14px 20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
      #fundaEnrollmentTimingStrip .funda-enrol-strip-item{display:flex;align-items:center;justify-content:center;gap:8px;min-height:38px;text-align:center;color:#21384d;font-size:13px;font-weight:800}
      #fundaEnrollmentTimingStrip .funda-enrol-dot{width:7px;height:7px;border-radius:50%;background:#c99a2e;box-shadow:0 0 0 4px rgba(201,154,46,.12);flex:0 0 auto}
      #fundaCourseEnrollmentTimingNote{margin-top:12px;padding:12px 14px;border:1px solid #dec98e;border-radius:13px;background:#fff8e5;color:#3f4f61;font-size:12px;line-height:1.55}
      #fundaCourseEnrollmentTimingNote strong{color:#21384d}
      #fundaEnrollmentFaq{margin-top:30px;padding-top:26px;border-top:1px solid #dce3eb}
      #fundaEnrollmentFaq .funda-enrol-faq-kicker{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#956d1d;font-weight:900}
      #fundaEnrollmentFaq h2{margin:6px 0 14px;color:#21384d;font-size:22px;font-weight:900}
      .funda-enrol-faq-item{border:1px solid #d9e1ea;border-radius:15px;background:#fffaf0;overflow:hidden}
      .funda-enrol-faq-item summary{cursor:pointer;list-style:none;padding:15px 17px;color:#21384d;font-weight:850;font-size:14px}
      .funda-enrol-faq-item summary::-webkit-details-marker{display:none}
      .funda-enrol-faq-item p{margin:0;padding:0 17px 16px;color:#4b5d70;font-size:13px;line-height:1.7}
      #fundaAmbassadorEnrollmentTiming{max-width:1180px;margin:0 auto;padding:0 20px 22px}
      #fundaAmbassadorEnrollmentTiming .funda-enrol-amb-card{border:1px solid #dfd2ad;border-left:4px solid #c99a2e;border-radius:16px;background:linear-gradient(135deg,#fff9ea,#fff,#f7ebef);padding:16px 18px;color:#394b5d;box-shadow:0 8px 24px rgba(33,56,77,.05)}
      #fundaAmbassadorEnrollmentTiming strong{display:block;color:#21384d;font-size:14px;margin-bottom:4px}
      #fundaAmbassadorEnrollmentTiming span{font-size:12.5px;line-height:1.65}
      @media(max-width:700px){
        #fundaEnrollmentTimingStrip .funda-enrol-strip-shell{grid-template-columns:1fr;padding:12px 16px;gap:4px}
        #fundaEnrollmentTimingStrip .funda-enrol-strip-item{min-height:30px;justify-content:flex-start;text-align:left;font-size:12.5px}
        #fundaAmbassadorEnrollmentTiming{padding:0 16px 18px}
      }
    `;
    document.head.appendChild(style);
  }

  function addHomeStrip(){
    if(!isHome||document.getElementById('fundaEnrollmentTimingStrip'))return;
    const hero=document.querySelector('main .hero, main section.hero');
    if(!hero)return;
    const section=document.createElement('section');
    section.id='fundaEnrollmentTimingStrip';
    section.className='funda-enrol-font';
    section.setAttribute('aria-label','Flexible enrollment information');
    section.innerHTML=`<div class="funda-enrol-strip-shell"><div class="funda-enrol-strip-item"><span class="funda-enrol-dot" aria-hidden="true"></span><span>Enroll anytime</span></div><div class="funda-enrol-strip-item"><span class="funda-enrol-dot" aria-hidden="true"></span><span>100% online</span></div><div class="funda-enrol-strip-item"><span class="funda-enrol-dot" aria-hidden="true"></span><span>Start once registration &amp; payment are approved</span></div></div>`;
    hero.insertAdjacentElement('afterend',section);
  }

  function commonParent(a,b,limit){
    if(!a||!b)return null;
    const seen=new Set();
    let node=a;
    for(let i=0;node&&i<limit;i++,node=node.parentElement)seen.add(node);
    node=b;
    for(let i=0;node&&i<limit;i++,node=node.parentElement){if(seen.has(node))return node;}
    return null;
  }

  function addCourseActionNote(){
    if(!isCourse||document.getElementById('fundaCourseEnrollmentTimingNote'))return;
    const content=document.getElementById('courseContent');
    if(!content||content.classList.contains('hidden'))return;
    const actions=[...content.querySelectorAll('a,button')];
    const login=actions.find(el=>/^(log\s*in|login|student login)$/i.test(clean(el.textContent)));
    const create=actions.find(el=>/^(create account|create student account)$/i.test(clean(el.textContent)));
    if(!login||!create)return;
    let group=commonParent(login,create,6);
    if(!group||group===content)group=create.parentElement;
    if(!group)return;
    const note=document.createElement('div');
    note.id='fundaCourseEnrollmentTimingNote';
    note.className='funda-enrol-font';
    note.innerHTML='<strong>Enroll anytime.</strong> Log in or create your student account to continue. Course access opens once your registration and payment are approved.';
    group.insertAdjacentElement('afterend',note);
  }

  function makeFaqItem(){
    const details=document.createElement('details');
    details.className='funda-enrol-faq-item funda-enrol-font';
    details.dataset.fundaEnrollmentFaq='1';
    details.innerHTML='<summary>When can I enroll and start my course?</summary><p>You can enroll at any time. Funda Online Academy accepts registrations throughout the year. Once your registration and payment have been verified and approved, your course access is opened and you can begin learning.</p>';
    return details;
  }

  function addCourseFaq(){
    if(!isCourse||document.querySelector('[data-funda-enrollment-faq="1"]'))return;
    const content=document.getElementById('courseContent');
    if(!content||content.classList.contains('hidden'))return;

    const headings=[...content.querySelectorAll('h2,h3')];
    const heading=headings.find(el=>/frequently asked questions|\bfaq\b/i.test(clean(el.textContent)));
    if(heading){
      const section=heading.closest('section,div');
      if(section){section.appendChild(makeFaqItem());return;}
    }

    // Give the existing course-overview enhancements time to add their own FAQ
    // section first. If none appears, create one after the page has settled.
    if(Date.now()-startedAt<3800)return;

    const body=document.getElementById('courseDescription')?.parentElement||content.querySelector('.body');
    if(!body)return;
    const section=document.createElement('section');
    section.id='fundaEnrollmentFaq';
    section.className='funda-enrol-font';
    section.innerHTML='<div class="funda-enrol-faq-kicker">Course Information</div><h2>Frequently Asked Questions</h2>';
    section.appendChild(makeFaqItem());
    body.appendChild(section);
  }

  function addAmbassadorNote(){
    if(!isAmbassador||document.getElementById('fundaAmbassadorEnrollmentTiming'))return;
    const anchor=document.getElementById('compensation-plan')||document.getElementById('apply');
    if(!anchor)return;
    const section=document.createElement('section');
    section.id='fundaAmbassadorEnrollmentTiming';
    section.className='funda-enrol-font';
    section.innerHTML='<div class="funda-enrol-amb-card"><strong>Student enrollment timing</strong><span>Students can enroll throughout the year — there is no annual intake period. Once a student\'s registration and payment are approved, course access can begin.</span></div>';
    anchor.insertAdjacentElement('beforebegin',section);
  }

  function run(){
    addStyles();
    addHomeStrip();
    addCourseActionNote();
    addCourseFaq();
    addAmbassadorNote();
  }

  let timer=null;
  const observer=new MutationObserver(()=>{
    clearTimeout(timer);
    timer=setTimeout(run,90);
  });

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{
      run();
      observer.observe(document.documentElement,{childList:true,subtree:true});
    },{once:true});
  }else{
    run();
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  [350,900,1800,3200,4200,6000].forEach(delay=>setTimeout(run,delay));
  setTimeout(()=>observer.disconnect(),12000);
})();
