(()=>{
'use strict';
if(!/course-view\.html$/i.test(location.pathname)||window.__fundaUnifiedCourseViewV3)return;
window.__fundaUnifiedCourseViewV3=true;
const $=id=>document.getElementById(id);
const HERO_IDS=new Set(['acpoHero','bkPremiumIntro','oaPremiumIntro','cpPremiumIntro','baHero','baPremiumIntro','rpoPremiumIntro','copPremiumIntro','retailPremiumIntro']);

function installStyle(){
  if($('fundaUnifiedCourseViewStyleV3'))return;
  const s=document.createElement('style');
  s.id='fundaUnifiedCourseViewStyleV3';
  s.textContent=`
    header .brand,header .brand *{color:#fff!important}
    #courseContent{align-items:start!important}
    #courseContent>section.panel{grid-column:1!important;grid-row:1!important;min-width:0!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:block!important}
    #courseContent>section.panel>.body{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:block!important}
    #courseContent>aside{grid-column:2!important;grid-row:1!important;min-width:0!important;align-self:start!important;display:block!important}
    #courseContent>aside .aside{height:auto!important;min-height:0!important;max-height:none!important}
    .fundaCourseDuplicate{display:none!important}

    .pcvMetrics{grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-rows:max-content!important;align-items:start!important;gap:12px!important;margin:18px 0 24px!important}
    .pcvMetric{height:auto!important;min-height:0!important;padding:14px 16px!important;align-self:start!important;display:flex!important;flex-direction:column!important;justify-content:center!important}

    .fundaCourseAccordion,
    .fundaCourseHeroAccordion,
    .fundaCourseHeroAccordion.acpoHero,
    .fundaCourseHeroAccordion.bahero,
    .fundaCourseHeroAccordion.bkhero,
    .fundaCourseHeroAccordion.oahero,
    .fundaCourseHeroAccordion.retailHero{
      display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:0!important;max-height:none!important;
      margin:14px 0!important;padding:0!important;border:1px solid rgba(70,103,127,.22)!important;border-radius:18px!important;
      background:linear-gradient(145deg,#fff8ec,#f8f5ef 78%,#f7e9ee 135%)!important;color:#21384d!important;
      box-shadow:0 7px 20px rgba(48,70,88,.06)!important;overflow:hidden!important;
    }
    .fundaCourseAccordionBtn{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border:0;background:transparent!important;text-align:left;color:#21384d!important;cursor:pointer;font:inherit}
    .fundaCourseAccordionText{min-width:0}
    .fundaCourseAccordionKicker{display:block;margin-bottom:4px;font-size:10px;line-height:1.2;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8a6412!important}
    .fundaCourseAccordionTitle{display:block;font-family:'Source Sans 3',Inter,sans-serif;font-size:18px;line-height:1.28;font-weight:700;color:#21384d!important}
    .fundaCourseAccordionPlus{width:34px;height:34px;flex:0 0 34px;border:1px solid #d8c17c;border-radius:999px;background:#fff8e8;color:#21384d;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;transition:transform .18s ease}
    .fundaCourseAccordion[data-open='1'] .fundaCourseAccordionPlus{transform:rotate(45deg)}
    .fundaCourseAccordionBody{display:none;padding:0 18px 18px;color:#43566f!important;background:transparent!important}
    .fundaCourseAccordion[data-open='1'] .fundaCourseAccordionBody{display:block}

    .fundaCourseAccordionBody,.fundaCourseAccordionBody *{text-shadow:none!important}
    .fundaCourseAccordionBody p,.fundaCourseAccordionBody span,.fundaCourseAccordionBody li,
    .fundaCourseAccordionBody .acpop,.fundaCourseAccordionBody .bkintro,.fundaCourseAccordionBody .oaintro,.fundaCourseAccordionBody .baintro,.fundaCourseAccordionBody .retailLead{color:#43566f!important}
    .fundaCourseAccordionBody h2,.fundaCourseAccordionBody h3,.fundaCourseAccordionBody h4,.fundaCourseAccordionBody strong,.fundaCourseAccordionBody b{color:#21384d!important}
    .fundaCourseAccordionBody>.pcvKicker:first-child,.fundaCourseAccordionBody>.acpol:first-child,.fundaCourseAccordionBody>.bklabel:first-child,.fundaCourseAccordionBody>.oalabel:first-child,.fundaCourseAccordionBody>.balabel:first-child,.fundaCourseAccordionBody>.retailEyebrow:first-child{display:none!important}
    .fundaCourseAccordionBody>h2:first-of-type{display:none!important}

    .fundaCourseHeroAccordion .fundaCourseAccordionBody>div:first-child{background:transparent!important;color:#21384d!important;padding:4px 0 0!important;box-shadow:none!important}
    .fundaCourseHeroAccordion .fundaCourseAccordionBody h2:first-of-type,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .acpol:first-child,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .bklabel:first-child,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .oalabel:first-child,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .balabel:first-child,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .retailEyebrow:first-child{display:none!important}
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .acpoStats,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .baglance,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .bkglance,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .oaglance,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .retailStats{display:grid!important;gap:10px!important}
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .acpoStats div,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .baglance div,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .bkglance div,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .oaglance div,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .retailStats div{background:#fff!important;border:1px solid #dce5ef!important;color:#21384d!important;box-shadow:none!important}
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .acpoStats strong,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .baglance strong,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .bkglance strong,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .oaglance strong,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .retailStats strong{color:#21384d!important}
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .acpoStats span,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .baglance span,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .bkglance span,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .oaglance span,
    .fundaCourseHeroAccordion .fundaCourseAccordionBody .retailStats span{color:#5b6d82!important}

    @media(min-width:821px){
      #courseContent{grid-template-columns:minmax(0,1fr) 310px!important;gap:26px!important}
      #courseContent>section.panel>.body{padding:24px!important}
      #courseContent>aside .aside{position:sticky!important;top:92px!important;padding:20px!important}
    }
    @media(max-width:820px){
      #courseContent{grid-template-columns:1fr!important;gap:18px!important}
      #courseContent>section.panel,#courseContent>aside{grid-column:1!important;grid-row:auto!important}
      #courseContent>section.panel>.body{padding:18px 15px!important}
      #courseContent>aside,body.acpoReady #courseContent>aside,body.bookkeepingPremiumReady #courseContent>aside,body.officePremiumReady #courseContent>aside,body.baPremiumReady #courseContent>aside{display:block!important}
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
  const panel=content&&([ ...content.children ].find(el=>el.matches?.('section.panel'))||content.querySelector('section.panel'));
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
    if(el.matches?.('section.panel')||el.tagName==='ASIDE'||el.id==='loading'||el.id==='errorBox')return;
    if(el.tagName==='SECTION'||el.id)body.appendChild(el);
  });
}

function premiumExists(){
  const body=mainBody();
  return !!body&&[...HERO_IDS].some(id=>body.querySelector('#'+id));
}

function hideDuplicates(){
  const body=mainBody();
  if(!body)return;
  if(premiumExists()){
    $('pcvAbout')?.classList.add('fundaCourseDuplicate');
    $('learningOutcomes')?.closest('.section')?.classList.add('fundaCourseDuplicate');
    $('modules')?.closest('.section')?.classList.add('fundaCourseDuplicate');
  }
  body.querySelectorAll(':scope > section').forEach(section=>{
    const id=section.id||'';
    if(/Fee$/i.test(id)||id==='acpoFee')section.classList.add('fundaCourseDuplicate');
  });
  if($('pcvClass')&&$('acpoClassification'))$('pcvClass').classList.add('fundaCourseDuplicate');
}

function isAbout(section){
  const id=section.id||'';
  return /(^|_)(About)$/i.test(id)||/(pcvAbout|acpoAbout|bkAbout|oaAbout|cpAbout|baAbout|rpoAbout|copAbout)/i.test(id);
}

function labelFor(section){
  const id=section.id||'';
  if(HERO_IDS.has(id)){
    const heroText=id==='acpoHero'?section.querySelector('.acpop')?.textContent?.trim():section.querySelector('h2')?.textContent?.trim();
    return {title:heroText||'Course information',kicker:'Course Information'};
  }
  const map={pcvInvestment:['What Your Course Investment Includes','Professional learning experience'],pcvCompletion:['Assessment, Award & Workplace Relevance','Completion & application'],careerSupportOverview:['Career & Workplace Support','Career support']};
  if(map[id])return {title:map[id][0],kicker:map[id][1]};
  const h2=section.querySelector(':scope > h2')||section.querySelector('h2');
  const title=(h2?.textContent||'').trim()||'Course Information';
  const kicker=section.querySelector(':scope > .pcvKicker,:scope > .acpol,:scope > .bklabel,:scope > .oalabel,:scope > .balabel,:scope > .retailEyebrow')?.textContent?.trim()||'Course information';
  return {title,kicker};
}

function accordion(section){
  if(!section||section.dataset.fundaUnifiedAccordion||section.classList.contains('fundaCourseDuplicate')||isAbout(section))return;
  const hero=HERO_IDS.has(section.id||'');
  section.dataset.fundaUnifiedAccordion='1';
  section.dataset.open='0';
  section.classList.add('fundaCourseAccordion');
  if(hero)section.classList.add('fundaCourseHeroAccordion');
  section.style.removeProperty('display');
  section.style.removeProperty('height');
  section.style.removeProperty('min-height');
  section.style.removeProperty('max-height');
  section.style.removeProperty('background');
  section.style.removeProperty('color');
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
  [...body.querySelectorAll(':scope > section,:scope > .section')].forEach(accordion);
}

function polish(){installStyle();if(!restoreBase())return;collectOrphans();hideDuplicates();standardiseSections();}
let passes=0;
function run(){polish();if(++passes<10)setTimeout(run,400)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
setTimeout(()=>{const content=$('courseContent');if(!content)return;const observer=new MutationObserver(()=>polish());observer.observe(content,{childList:true,subtree:true});setTimeout(()=>observer.disconnect(),4500)},600);
})();