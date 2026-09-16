(()=>{
'use strict';
if(!/course-view\.html$/i.test(location.pathname)||window.__fundaUnifiedCourseView)return;
window.__fundaUnifiedCourseView=true;
const $=id=>document.getElementById(id);

function installStyle(){
  if($('fundaUnifiedCourseViewStyle'))return;
  const s=document.createElement('style');
  s.id='fundaUnifiedCourseViewStyle';
  s.textContent=`
    header .brand,header .brand *,body.fundaCourseOverviewBrand header .brand,body.fundaCourseOverviewBrand header .brand *{color:#fff!important}
    #courseContent{align-items:start!important}
    #courseContent>section.panel{grid-column:1!important;grid-row:1!important;min-width:0!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:block!important}
    #courseContent>section.panel>.body{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:block!important}
    #courseContent>aside{grid-column:2!important;grid-row:1!important;min-width:0!important;align-self:start!important;display:block!important}
    #courseContent>aside .aside{height:auto!important;min-height:0!important;max-height:none!important}
    .fundaCourseDuplicate{display:none!important}

    .pcvMetrics{grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-rows:max-content!important;align-items:start!important;gap:12px!important;margin:18px 0 24px!important}
    .pcvMetric{height:auto!important;min-height:0!important;padding:14px 16px!important;align-self:start!important;display:flex!important;flex-direction:column!important;justify-content:center!important}
    .pcvMetric strong{font-size:21px!important;line-height:1.18!important}
    .pcvMetric span{font-size:11px!important;line-height:1.35!important;margin-top:3px!important}

    .fundaCourseAccordion{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:0!important;max-height:none!important;margin:14px 0!important;padding:0!important;border:1px solid rgba(70,103,127,.22)!important;border-radius:18px!important;background:linear-gradient(145deg,#fff6e4,#f8f5ef 78%,#f5e5e9 135%)!important;box-shadow:0 7px 20px rgba(48,70,88,.06)!important;overflow:hidden!important}
    .fundaCourseAccordionBtn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border:0;background:transparent;text-align:left;color:#21384d;cursor:pointer;font:inherit}
    .fundaCourseAccordionText{min-width:0}
    .fundaCourseAccordionKicker{display:block;margin-bottom:4px;font-size:10px;line-height:1.2;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a6412}
    .fundaCourseAccordionTitle{display:block;font-family:'Source Sans 3',Inter,sans-serif;font-size:18px;line-height:1.25;font-weight:700;color:#21384d}
    .fundaCourseAccordionPlus{width:34px;height:34px;flex:0 0 34px;border:1px solid #d8c17c;border-radius:999px;background:#fff8e8;color:#21384d;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;transition:transform .18s ease}
    .fundaCourseAccordion[data-open='1'] .fundaCourseAccordionPlus{transform:rotate(45deg)}
    .fundaCourseAccordionBody{display:none;padding:0 18px 18px}
    .fundaCourseAccordion[data-open='1'] .fundaCourseAccordionBody{display:block}
    .fundaCourseAccordionBody>h2:first-of-type{display:none!important}
    .fundaCourseAccordionBody>.pcvKicker:first-child,.fundaCourseAccordionBody>.acpol:first-child,.fundaCourseAccordionBody>.bklabel:first-child,.fundaCourseAccordionBody>.oalabel:first-child,.fundaCourseAccordionBody>.retailEyebrow:first-child{display:none!important}

    @media(min-width:821px){
      #courseContent{grid-template-columns:minmax(0,1fr) 310px!important;gap:26px!important}
      #courseContent>section.panel>.body{padding:24px!important}
      #courseContent>aside .aside{position:sticky!important;top:92px!important;padding:20px!important}
    }
    @media(max-width:820px){
      #courseContent{grid-template-columns:1fr!important;gap:18px!important}
      #courseContent>section.panel,#courseContent>aside{grid-column:1!important;grid-row:auto!important}
      #courseContent>section.panel>.body{padding:18px 15px!important}
      #courseContent>aside,body.acpoReady #courseContent>aside,body.bookkeepingPremiumReady #courseContent>aside,body.officePremiumReady #courseContent>aside{display:block!important}
      #courseContent>aside .aside{position:static!important;margin:0!important}
      .pcvMetrics{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}
      .pcvMetric{padding:12px 13px!important}
      .fundaCourseAccordion{margin:12px 0!important;border-radius:16px!important}
      .fundaCourseAccordionBtn{padding:14px 15px!important}
      .fundaCourseAccordionTitle{font-size:17px!important}
      .fundaCourseAccordionBody{padding:0 15px 15px!important}
      main.shell{padding-top:16px!important;padding-bottom:28px!important}
    }
  `;
  document.head.appendChild(s);
}

function mainBody(){
  const content=$('courseContent');
  if(!content)return null;
  const panel=[...content.children].find(el=>el.matches?.('section.panel'))||content.querySelector('section.panel');
  return panel?.querySelector('.body')||null;
}

function restoreBase(){
  const content=$('courseContent'),title=$('courseTitle');
  if(!content||!title)return false;
  const text=(title.textContent||'').trim();
  if(!text||text.toLowerCase()==='course')return false;
  content.classList.remove('hidden');
  $('loading')?.classList.add('hidden');
  const panel=[...content.children].find(el=>el.matches?.('section.panel'))||content.querySelector('section.panel');
  if(panel){
    panel.style.setProperty('display','block','important');
    panel.style.setProperty('height','auto','important');
    panel.style.setProperty('min-height','0','important');
    panel.style.setProperty('max-height','none','important');
    panel.style.setProperty('overflow','visible','important');
  }
  return true;
}

function collectOrphans(){
  const content=$('courseContent'),body=mainBody();
  if(!content||!body)return;
  [...content.children].forEach(el=>{
    if(el.matches?.('section.panel')||el.tagName==='ASIDE')return;
    if(el.id==='loading'||el.id==='errorBox')return;
    if(el.tagName==='SECTION'||el.id)body.appendChild(el);
  });
}

function premiumExists(){
  const body=mainBody();
  if(!body)return false;
  return !!body.querySelector('#acpoHero,#bkPremiumIntro,#oaPremiumIntro,#cpPremiumIntro,#baPremiumIntro,#rpoPremiumIntro,#copPremiumIntro,#retailPremiumIntro');
}

function hideDuplicates(){
  const body=mainBody();
  if(!body)return;
  const premium=premiumExists();
  if(premium){
    const genericAbout=$('pcvAbout');
    if(genericAbout)genericAbout.classList.add('fundaCourseDuplicate');
    const baseOut=$('learningOutcomes')?.closest('.section');
    const baseMods=$('modules')?.closest('.section');
    if(baseOut)baseOut.classList.add('fundaCourseDuplicate');
    if(baseMods)baseMods.classList.add('fundaCourseDuplicate');
  }
  body.querySelectorAll(':scope > section').forEach(section=>{
    const id=section.id||'';
    if(/Fee$/i.test(id)||id==='acpoFee')section.classList.add('fundaCourseDuplicate');
  });
  if($('pcvClass')&&$('acpoClassification'))$('pcvClass').classList.add('fundaCourseDuplicate');
}

function labelFor(section){
  const id=section.id||'';
  const h2=section.querySelector(':scope > h2')||section.querySelector('h2');
  const title=(h2?.textContent||'').trim();
  const kicker=section.querySelector(':scope > .pcvKicker,:scope > .acpol,:scope > .bklabel,:scope > .oalabel,:scope > .retailEyebrow')?.textContent?.trim()||'Course information';
  if(title)return {title,kicker};
  const map={
    pcvInvestment:['What Your Course Investment Includes','Professional learning experience'],
    pcvCompletion:['Assessment, Award & Workplace Relevance','Completion & application'],
    careerSupportOverview:['Career & Workplace Support','Career support']
  };
  if(map[id])return {title:map[id][0],kicker:map[id][1]};
  return {title:'Course Information',kicker};
}

function shouldStayOpen(section){
  const id=section.id||'';
  if(/(PremiumIntro|acpoHero|retailPremiumIntro)$/i.test(id))return true;
  if(/(^|_)(About)$/i.test(id)||/(pcvAbout|acpoAbout|bkAbout|oaAbout|cpAbout|baAbout|rpoAbout|copAbout)/i.test(id))return true;
  if(section.classList.contains('fundaCourseDuplicate'))return true;
  return false;
}

function accordion(section){
  if(!section||section.dataset.fundaUnifiedAccordion||shouldStayOpen(section))return;
  section.dataset.fundaUnifiedAccordion='1';
  section.dataset.open='0';
  section.classList.add('fundaCourseAccordion');
  section.style.removeProperty('display');
  section.style.removeProperty('height');
  section.style.removeProperty('min-height');
  section.style.removeProperty('max-height');
  const meta=labelFor(section);
  const body=document.createElement('div');
  body.className='fundaCourseAccordionBody';
  while(section.firstChild)body.appendChild(section.firstChild);
  const btn=document.createElement('button');
  btn.type='button';
  btn.className='fundaCourseAccordionBtn';
  btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<span class="fundaCourseAccordionText"><span class="fundaCourseAccordionKicker"></span><span class="fundaCourseAccordionTitle"></span></span><span class="fundaCourseAccordionPlus" aria-hidden="true">+</span>';
  btn.querySelector('.fundaCourseAccordionKicker').textContent=meta.kicker;
  btn.querySelector('.fundaCourseAccordionTitle').textContent=meta.title;
  btn.addEventListener('click',()=>{
    const opening=section.dataset.open!=='1';
    section.dataset.open=opening?'1':'0';
    btn.setAttribute('aria-expanded',String(opening));
  });
  section.append(btn,body);
}

function standardiseSections(){
  const body=mainBody();
  if(!body)return;
  const sections=[...body.querySelectorAll(':scope > section')];
  sections.forEach(section=>accordion(section));
  const baseSections=[...body.querySelectorAll(':scope > .section')];
  baseSections.forEach(section=>accordion(section));
}

function polish(){
  installStyle();
  if(!restoreBase())return;
  collectOrphans();
  hideDuplicates();
  standardiseSections();
}

let passes=0;
function run(){
  polish();
  if(++passes<10)setTimeout(run,450);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();

setTimeout(()=>{
  const content=$('courseContent');
  if(!content)return;
  const observer=new MutationObserver(()=>polish());
  observer.observe(content,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),5500);
},700);
})();