(()=>{
'use strict';
if(!/course-view\.html$/i.test(location.pathname)||window.__fundaCourseCompactLayout)return;
window.__fundaCourseCompactLayout=true;
const $=id=>document.getElementById(id);

function installStyle(){
  if($('fundaCourseCompactLayoutStyle'))return;
  const s=document.createElement('style');
  s.id='fundaCourseCompactLayoutStyle';
  s.textContent=`
    header .brand,header .brand>span,header .brand>span>span,header .brand span,header .brand strong,header .brand b{color:#fff!important}
    body.fundaCourseOverviewBrand header .brand,body.fundaCourseOverviewBrand header .brand *{color:#fff!important}
    #courseContent{align-items:start!important}
    #courseContent>section.panel{min-width:0!important;grid-column:1!important;height:auto!important;min-height:0!important}
    #courseContent>section.panel>.body{height:auto!important;min-height:0!important}
    #courseContent>aside{min-width:0!important;grid-column:2!important;grid-row:1!important;align-self:start!important}
    #courseContent>aside .aside{height:auto!important;min-height:0!important}

    .pcvMetrics{grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-rows:max-content!important;align-items:start!important;gap:12px!important;margin:18px 0 24px!important}
    .pcvMetric{height:auto!important;min-height:0!important;align-self:start!important;padding:14px 16px!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
    .pcvMetric strong{font-size:22px!important;line-height:1.18!important}
    .pcvMetric span{font-size:11px!important;line-height:1.35!important;margin-top:3px!important}

    .cvclHiddenDuplicate{display:none!important}
    .cvclAccordion{display:block!important;visibility:visible!important;opacity:1!important;position:relative!important;height:auto!important;min-height:0!important;max-height:none!important;margin:16px 0!important;padding:0!important;border:1px solid rgba(70,103,127,.22)!important;border-radius:18px!important;background:linear-gradient(145deg,#fff6e4,#f8f5ef 78%,#f5e5e9 135%)!important;box-shadow:0 8px 22px rgba(48,70,88,.07)!important;overflow:hidden!important}
    .cvclSummary{width:100%;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:17px 18px;border:0;background:transparent;color:#21384d;text-align:left;cursor:pointer;font:inherit}
    .cvclSummaryText{min-width:0}
    .cvclKicker{display:block;margin-bottom:4px;font-size:10px;line-height:1.25;font-weight:800;letter-spacing:.13em;text-transform:uppercase;color:#8a6412}
    .cvclTitle{display:block;font-family:'Source Sans 3',Inter,sans-serif;font-size:18px;line-height:1.25;font-weight:700;color:#21384d}
    .cvclPlus{width:34px;height:34px;flex:0 0 34px;border:1px solid #d8c17c;border-radius:999px;background:#fff8e8;color:#21384d;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;transition:transform .18s ease}
    .cvclAccordion[data-open='1'] .cvclPlus{transform:rotate(45deg)}
    .cvclBody{display:none;padding:0 18px 18px}
    .cvclAccordion[data-open='1'] .cvclBody{display:block}
    .cvclBody>.pcvKicker:first-child,.cvclBody>.acpol:first-child,.cvclBody>.bklabel:first-child,.cvclBody>.oalabel:first-child{display:none!important}
    .cvclBody>h2:first-of-type{display:none!important}
    .cvclAccordion .pcvValueGrid,.cvclAccordion .acpoGrid,.cvclAccordion .acpoFlow,.cvclAccordion .acpoMods,.cvclAccordion .bkgrid2,.cvclAccordion .bkoutcomes,.cvclAccordion .bkflow,.cvclAccordion .bkmetrics,.cvclAccordion .bkapply,.cvclAccordion .oagrid,.cvclAccordion .oaoutcomes,.cvclAccordion .oaflow,.cvclAccordion .oametrics,.cvclAccordion .oaapply{margin-top:4px!important}

    #pcvAbout{margin-top:18px!important}
    #pcvAbout .pcvLead{max-width:900px!important}
    #careerSupportOverview.cvclAccordion{padding:0!important}
    #careerSupportOverview.cvclAccordion>div:not(.cvclBody){display:none!important}
    #careerSupportOverview.cvclAccordion>h2{display:none!important}
    #careerSupportOverview.cvclAccordion>p{display:none!important}

    @media(max-width:1023px){
      #courseContent>aside{display:block!important}
    }
    @media(min-width:821px){
      #courseContent{grid-template-columns:minmax(0,1fr) 300px!important;gap:26px!important}
      #courseContent>section.panel>.body{padding:24px!important}
      #courseContent>aside .aside{position:sticky!important;top:92px!important;padding:20px!important}
      .pcvValueGrid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
    }
    @media(max-width:820px){
      #courseContent{grid-template-columns:1fr!important;gap:18px!important}
      #courseContent>section.panel,#courseContent>aside{grid-column:1!important;grid-row:auto!important}
      #courseContent>section.panel{display:block!important;height:auto!important;min-height:0!important}
      #courseContent>section.panel>.body{display:block!important;height:auto!important;min-height:0!important;padding:20px 16px!important}
      #courseContent>aside,body.acpoReady #courseContent>aside{display:block!important}
      #courseContent>aside .aside{position:static!important;margin-top:0!important}
      .pcvMetrics{grid-template-columns:repeat(2,minmax(0,1fr))!important}
      .pcvMetric{padding:13px 14px!important}
      .cvclSummary{padding:15px 16px}
      .cvclTitle{font-size:17px}
      .cvclBody{padding:0 16px 16px}
      main.shell{padding-top:16px!important;padding-bottom:28px!important}
    }
  `;
  document.head.appendChild(s);
}

function primaryBody(){
  const content=$('courseContent');
  if(!content)return null;
  const main=[...content.children].find(el=>el.matches?.('section.panel'))||content.querySelector('section.panel');
  return main?.querySelector('.body')||null;
}

function ensureRenderedCourseVisible(){
  const content=$('courseContent'),title=$('courseTitle'),error=$('errorBox'),loading=$('loading');
  if(!content||!title)return;
  const text=(title.textContent||'').trim();
  const hasCourse=text&&text.toLowerCase()!=='course';
  const errorVisible=error&&!error.classList.contains('hidden');
  if(hasCourse&&!errorVisible){
    content.classList.remove('hidden');
    loading?.classList.add('hidden');
  }
}

function repairGridOrphans(){
  const content=$('courseContent'),body=primaryBody();
  if(!content||!body)return;
  const known=['pcvFlagship','pcvMetrics','pcvAbout','pcvInvestment','pcvRetailIntro','pcvCompletion','careerSupportOverview'];
  known.forEach(id=>{
    const el=$(id);
    if(el&&el.parentElement===content)body.appendChild(el);
  });
  const metrics=$('pcvMetrics');
  const about=$('pcvAbout');
  const investment=$('pcvInvestment');
  const completion=$('pcvCompletion');
  const career=$('careerSupportOverview');
  const classBox=$('pcvClass');
  const desc=$('courseDescription');
  let anchor=classBox||desc;
  if(metrics&&anchor&&metrics!==anchor.nextElementSibling)anchor.insertAdjacentElement('afterend',metrics);
  if(metrics)anchor=metrics;
  if(about&&anchor&&about!==anchor.nextElementSibling)anchor.insertAdjacentElement('afterend',about);
  if(about)anchor=about;
  if(investment&&anchor&&investment!==anchor.nextElementSibling)anchor.insertAdjacentElement('afterend',investment);
  if(completion&&completion.parentElement!==body)body.appendChild(completion);
  if(career&&career.parentElement!==body)body.appendChild(career);
}

function accordion(section,label,kicker){
  if(!section||section.dataset.cvclAccordion)return;
  section.style.removeProperty('display');
  section.style.removeProperty('visibility');
  section.style.removeProperty('opacity');
  section.dataset.cvclAccordion='1';
  section.dataset.open='0';
  section.classList.add('cvclAccordion');

  const inferredHeading=section.querySelector(':scope > h2')||section.querySelector('h2');
  const inferredKicker=section.querySelector(':scope > .pcvKicker,:scope > .acpol,:scope > .bklabel,:scope > .oalabel');
  const title=label||inferredHeading?.textContent?.trim()||'Course information';
  const small=kicker||inferredKicker?.textContent?.trim()||'Course details';

  const body=document.createElement('div');
  body.className='cvclBody';
  while(section.firstChild)body.appendChild(section.firstChild);

  const button=document.createElement('button');
  button.type='button';
  button.className='cvclSummary';
  button.setAttribute('aria-expanded','false');
  button.innerHTML=`<span class="cvclSummaryText"><span class="cvclKicker"></span><span class="cvclTitle"></span></span><span class="cvclPlus" aria-hidden="true">+</span>`;
  button.querySelector('.cvclKicker').textContent=small;
  button.querySelector('.cvclTitle').textContent=title;
  button.addEventListener('click',()=>{
    const open=section.dataset.open==='1';
    section.dataset.open=open?'0':'1';
    button.setAttribute('aria-expanded',String(!open));
  });
  section.append(button,body);
}

function compactHeavySections(){
  const acpoAbout=$('acpoAbout');
  const acpoFee=$('acpoFee');
  if(acpoAbout)acpoAbout.classList.add('cvclHiddenDuplicate');
  if(acpoFee)acpoFee.classList.add('cvclHiddenDuplicate');
  if($('pcvClass')&&$('acpoClassification'))$('pcvClass').classList.add('cvclHiddenDuplicate');

  accordion($('pcvInvestment'),'What Your Course Investment Includes','Professional learning experience');
  accordion($('pcvCompletion'),'Assessment, Award & Workplace Relevance','Completion & application');
  accordion($('careerSupportOverview'),'Career & Workplace Support','Career support');

  [
    ['acpoWho','Who This Course Is For','Course suitability'],
    ['acpoOutcomes','What You Will Learn','Learning outcomes'],
    ['acpoCurriculum','Course Curriculum','Course modules'],
    ['acpoHow','How Learning Works','Learning journey'],
    ['acpoAssessment','Assessment & Academic Standards','Assessment'],
    ['acpoPractical','Practical & Workplace Application','Practical learning'],
    ['acpoSupport','Learner Support','Student support'],
    ['acpoCertificate','Certificate of Completion','Course completion'],
    ['acpoClassification','Course Classification','Important information']
  ].forEach(([id,title,kicker])=>accordion($(id),title,kicker));
}

function compactNamedPremiumSections(){
  const body=primaryBody();
  if(!body)return;
  const premium=[...body.querySelectorAll(':scope > section')].filter(section=>{
    const id=section.id||'';
    return /^(bk|oa|cp|ba|rpo|cop)/i.test(id);
  });
  if(!premium.length)return;

  const genericAbout=$('pcvAbout');
  if(genericAbout)genericAbout.classList.add('cvclHiddenDuplicate');

  premium.forEach(section=>{
    const id=section.id||'';
    if(/PremiumIntro$/i.test(id))return;
    if(/Fee$/i.test(id)){
      section.classList.add('cvclHiddenDuplicate');
      return;
    }
    const heading=section.querySelector(':scope > h2')?.textContent?.trim()||'Course information';
    const kicker=section.querySelector(':scope > .bklabel,:scope > .oalabel,:scope > .acpol,:scope > .pcvKicker')?.textContent?.trim()||'Course details';
    accordion(section,heading,kicker);
  });
}

function polish(){
  installStyle();
  ensureRenderedCourseVisible();
  repairGridOrphans();
  compactHeavySections();
  compactNamedPremiumSections();
}

let passes=0;
function run(){
  polish();
  if(++passes<18)setTimeout(run,450);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
setTimeout(()=>{
  const content=$('courseContent');
  if(!content)return;
  const observer=new MutationObserver(()=>polish());
  observer.observe(content,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  setTimeout(()=>observer.disconnect(),18000);
},1200);
})();
