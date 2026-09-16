(()=>{
  if(!/course-view\.html$/i.test(location.pathname))return;

  function mount(){
    if(document.getElementById('careerSupportOverview'))return;
    let anchor=document.getElementById('pcvCompletion')||document.getElementById('modules')?.closest('.section')||document.querySelector('#courseContent>section.panel .body');
    if(!anchor)return;
    const s=document.createElement('section');
    s.id='careerSupportOverview';
    s.style.cssText='margin:34px 0;padding:24px;border:1px solid #d9c17e;border-radius:22px;background:linear-gradient(135deg,#fff7df,#fff,#f7e8ed);box-shadow:0 10px 28px rgba(33,56,77,.07)';
    s.innerHTML=`<div style="font-size:10px;font-weight:900;letter-spacing:.16em;color:#9a711c">CAREER & WORKPLACE SUPPORT</div><h2 style="color:#21384d;font-size:23px;margin:6px 0 8px">We do not promise you a job. We help you prepare for one.</h2><p style="color:#3d4d61;line-height:1.75">Completing your course is one part of becoming workplace-ready. Approved Funda Online Academy learners can access practical career support designed to help them present themselves professionally and approach opportunities with greater confidence.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:15px"><div style="background:#fff;border:1px solid #e4dcc9;border-radius:14px;padding:14px"><b style="color:#21384d">Professional CV Support</b><p style="font-size:12px;color:#596879;line-height:1.55">Guidance and professional CV assistance for eligible learners.</p></div><div style="background:#fff;border:1px solid #e4dcc9;border-radius:14px;padding:14px"><b style="color:#21384d">Career Guidance</b><p style="font-size:12px;color:#596879;line-height:1.55">Practical guidance on job searching, applications and workplace readiness.</p></div><div style="background:#fff;border:1px solid #e4dcc9;border-radius:14px;padding:14px"><b style="color:#21384d">Workplace Exposure Support</b><p style="font-size:12px;color:#596879;line-height:1.55">For suitable courses, eligible learners may request an official Academy letter when approaching organisations for supervised workplace exposure.</p></div></div><p style="font-size:11px;color:#687586;line-height:1.55;margin-top:13px"><b>Important:</b> Funda Online Academy does not guarantee employment, interviews, workplace placement or acceptance by an employer. Workplace exposure remains subject to the receiving organisation's capacity, policies and requirements.</p>`;
    if(anchor.classList?.contains('body'))anchor.appendChild(s);else anchor.insertAdjacentElement('afterend',s);
  }

  function restoreCoursePanel(){
    const content=document.getElementById('courseContent');
    const title=document.getElementById('courseTitle');
    if(!content||!title)return;
    const titleText=(title.textContent||'').trim();
    if(!titleText||titleText.toLowerCase()==='course')return;

    content.classList.remove('hidden');
    document.getElementById('loading')?.classList.add('hidden');

    const panel=[...content.children].find(el=>el.matches?.('section.panel'))||content.querySelector('section.panel');
    if(panel){
      panel.style.setProperty('display','block','important');
      panel.style.setProperty('height','auto','important');
      panel.style.setProperty('min-height','0','important');
      panel.style.setProperty('max-height','none','important');
      panel.style.setProperty('overflow','visible','important');
      panel.style.setProperty('visibility','visible','important');
      panel.style.setProperty('opacity','1','important');
      const body=panel.querySelector('.body');
      if(body){
        body.style.setProperty('display','block','important');
        body.style.setProperty('height','auto','important');
        body.style.setProperty('min-height','0','important');
        body.style.setProperty('max-height','none','important');
        body.style.setProperty('visibility','visible','important');
        body.style.setProperty('opacity','1','important');
      }
    }

    document.querySelectorAll('#courseContent .cvclAccordion').forEach(section=>{
      section.style.setProperty('display','block','important');
      section.style.setProperty('height','auto','important');
      section.style.setProperty('min-height','0','important');
      section.style.setProperty('max-height','none','important');
      section.style.setProperty('visibility','visible','important');
      section.style.setProperty('opacity','1','important');
      section.style.setProperty('position','relative','important');
    });

    const genericOut=document.getElementById('learningOutcomes')?.closest('.section');
    const genericMods=document.getElementById('modules')?.closest('.section');
    if(genericOut&&document.querySelector('[id^="acpoOutcomes"],#bkOutcomes,#oaOutcomes,#cpOutcomes,#baOutcomes,#rpoOutcomes,#copOutcomes'))genericOut.style.setProperty('display','none','important');
    if(genericMods&&document.querySelector('[id^="acpoCurriculum"],#bkCurriculum,#oaCurriculum,#cpCurriculum,#baCurriculum,#rpoCurriculum,#copCurriculum'))genericMods.style.setProperty('display','none','important');
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,1800));else setTimeout(mount,1800);

  const compact=document.createElement('script');
  compact.src='course-view-compact-layout.js?v='+Date.now();
  document.head.appendChild(compact);

  let passes=0;
  const repair=()=>{
    restoreCoursePanel();
    if(++passes<30)setTimeout(repair,400);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',repair,{once:true});else repair();

  setTimeout(()=>{
    const content=document.getElementById('courseContent');
    if(!content)return;
    const observer=new MutationObserver(()=>restoreCoursePanel());
    observer.observe(content,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    setTimeout(()=>observer.disconnect(),20000);
  },800);
})();