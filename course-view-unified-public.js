(()=>{
'use strict';
if(!/course-view\.html$/i.test(location.pathname)||window.__fundaUnifiedCourseViewV4)return;
window.__fundaUnifiedCourseViewV4=true;
const $=id=>document.getElementById(id);
const HERO_IDS=new Set(['acpoHero','bkPremiumIntro','oaPremiumIntro','cpPremiumIntro','baHero','baPremiumIntro','rpoPremiumIntro','copPremiumIntro','retailPremiumIntro']);
const ABOUT_IDS=new Set(['pcvAbout','acpoAbout','bkAbout','oaAbout','cpAbout','baAbout','rpoAbout','copAbout','retailAbout']);
const LIGHT='linear-gradient(145deg,#fff8ec,#f8f5ef 78%,#f7e9ee 135%)';
const INK='#21384d';
const COPY='#43566f';
const GOLD='#8a6412';

function important(el,prop,value){if(el)el.style.setProperty(prop,value,'important')}

function installStyle(){
  let s=$('fundaUnifiedCourseViewStyleV4');
  if(!s){s=document.createElement('style');s.id='fundaUnifiedCourseViewStyleV4';document.head.appendChild(s)}
  s.textContent=`
    header .brand,header .brand *{color:#fff!important}
    #courseContent{align-items:start!important}
    #courseContent>section.panel{grid-column:1!important;grid-row:1!important;min-width:0!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:block!important}
    #courseContent>section.panel>.body{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;display:block!important}
    #courseContent>aside{grid-column:2!important;grid-row:1!important;min-width:0!important;align-self:start!important;display:block!important}
    #courseContent>aside .aside{height:auto!important;min-height:0!important;max-height:none!important}
    .fundaCourseDuplicate{display:none!important}
    .fundaCourseAccordionV4{display:block!important;visibility:visible!important;opacity:1!important;height:auto!important;min-height:0!important;max-height:none!important;margin:12px 0!important;padding:0!important;border:1px solid rgba(70,103,127,.22)!important;border-radius:18px!important;background:${LIGHT}!important;color:${INK}!important;box-shadow:0 7px 20px rgba(48,70,88,.06)!important;overflow:hidden!important}
    .fundaCourseAccordionBtnV4{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px;border:0;background:transparent!important;text-align:left;color:${INK}!important;cursor:pointer;font:inherit}
    .fundaCourseAccordionTextV4{min-width:0}
    .fundaCourseAccordionKickerV4{display:block;margin-bottom:4px;font-size:10px;line-height:1.2;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:${GOLD}!important}
    .fundaCourseAccordionTitleV4{display:block;font-family:'Source Sans 3',Inter,sans-serif;font-size:18px;line-height:1.28;font-weight:700;color:${INK}!important}
    .fundaCourseAccordionPlusV4{width:34px;height:34px;flex:0 0 34px;border:1px solid #d8c17c;border-radius:999px;background:#fff8e8!important;color:${INK}!important;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;transition:transform .18s ease}
    .fundaCourseAccordionV4[data-open='1'] .fundaCourseAccordionPlusV4{transform:rotate(45deg)}
    .fundaCourseAccordionBodyV4{display:none;padding:0 18px 18px;background:transparent!important;color:${COPY}!important}
    .fundaCourseAccordionV4[data-open='1'] .fundaCourseAccordionBodyV4{display:block}
    .fundaCourseAccordionBodyV4>.pcvKicker:first-child,.fundaCourseAccordionBodyV4>.acpol:first-child,.fundaCourseAccordionBodyV4>.bklabel:first-child,.fundaCourseAccordionBodyV4>.oalabel:first-child,.fundaCourseAccordionBodyV4>.balabel:first-child,.fundaCourseAccordionBodyV4>.retailEyebrow:first-child{display:none!important}
    .fundaCourseAccordionBodyV4>h2:first-of-type{display:none!important}
    .fundaCourseAccordionBodyV4 .acpoActions,.fundaCourseAccordionBodyV4 .baactions,.fundaCourseAccordionBodyV4 .bkactions,.fundaCourseAccordionBodyV4 .oaactions,.fundaCourseAccordionBodyV4 .cpactions,.fundaCourseAccordionBodyV4 .retailActions{display:none!important}
    .fundaCourseAboutReadable{color:${COPY}!important}
    .fundaCourseAboutReadable p,.fundaCourseAboutReadable li,.fundaCourseAboutReadable dd,.fundaCourseAboutReadable dt,.fundaCourseAboutReadable blockquote,.fundaCourseAboutReadable small{color:${COPY}!important;opacity:1!important;text-shadow:none!important}
    .fundaCourseAboutReadable h1,.fundaCourseAboutReadable h2,.fundaCourseAboutReadable h3,.fundaCourseAboutReadable h4,.fundaCourseAboutReadable h5,.fundaCourseAboutReadable h6,.fundaCourseAboutReadable strong,.fundaCourseAboutReadable b{color:${INK}!important;opacity:1!important;text-shadow:none!important}
    .pcvMetrics{grid-template-columns:repeat(4,minmax(0,1fr))!important;grid-auto-rows:max-content!important;align-items:start!important;gap:12px!important;margin:18px 0 24px!important}
    .pcvMetric{height:auto!important;min-height:0!important;padding:14px 16px!important;align-self:start!important}
    @media(min-width:821px){#courseContent{grid-template-columns:minmax(0,1fr) 310px!important;gap:26px!important}#courseContent>section.panel>.body{padding:24px!important}#courseContent>aside .aside{position:sticky!important;top:92px!important;padding:20px!important}}
    @media(max-width:820px){#courseContent{grid-template-columns:1fr!important;gap:18px!important}#courseContent>section.panel,#courseContent>aside{grid-column:1!important;grid-row:auto!important}#courseContent>section.panel>.body{padding:18px 15px!important}#courseContent>aside,body.acpoReady #courseContent>aside,body.bookkeepingPremiumReady #courseContent>aside,body.officePremiumReady #courseContent>aside,body.baPremiumReady #courseContent>aside{display:block!important}#courseContent>aside .aside{position:static!important;margin:0!important}.pcvMetrics{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.pcvMetric{padding:12px 13px!important}.fundaCourseAccordionV4{border-radius:16px!important}.fundaCourseAccordionBtnV4{padding:14px 15px!important}.fundaCourseAccordionTitleV4{font-size:17px!important}.fundaCourseAccordionBodyV4{padding:0 15px 15px!important}main.shell{padding-top:16px!important;padding-bottom:28px!important}}
  `;
}

function enforceBrand(){
  document.querySelectorAll('header .brand,header .brand *').forEach(el=>important(el,'color','#fff'));
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
  if(panel){important(panel,'display','block');important(panel,'height','auto');important(panel,'min-height','0');important(panel,'max-height','none');important(panel,'overflow','visible')}
  const body=panel?.querySelector('.body');
  if(body){important(body,'display','block');important(body,'height','auto');important(body,'min-height','0');important(body,'max-height','none');important(body,'overflow','visible')}
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
  if(!body)return false;
  if([...HERO_IDS].some(id=>body.querySelector('#'+id)))return true;
  return [...body.querySelectorAll(':scope > section')].some(section=>/^(acpo|bk|oa|cp|ba|rpo|cop|retail)/i.test(section.id||''));
}

function hideDuplicates(){
  const body=mainBody();
  if(!body)return;
  const premium=premiumExists();
  if(premium){
    const dedicatedAbout=[...body.querySelectorAll(':scope > section')].find(section=>ABOUT_IDS.has(section.id||'')&&section.id!=='pcvAbout');
    if(dedicatedAbout)$('pcvAbout')?.classList.add('fundaCourseDuplicate');
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
  return ABOUT_IDS.has(id)||/(About)$/i.test(id);
}

function labelFor(section){
  const id=section.id||'';
  if(HERO_IDS.has(id)){
    const text=id==='acpoHero'?section.querySelector('.acpop')?.textContent?.trim():section.querySelector('h2')?.textContent?.trim();
    return {title:text||'Course information',kicker:'Course Information'};
  }
  const map={pcvInvestment:['What Your Course Investment Includes','Professional learning experience'],pcvCompletion:['Assessment, Award & Workplace Relevance','Completion & application'],careerSupportOverview:['Career & Workplace Support','Career support']};
  if(map[id])return {title:map[id][0],kicker:map[id][1]};
  const h2=section.querySelector(':scope > h2')||section.querySelector('h2');
  const title=(h2?.textContent||'').trim()||'Course Information';
  const kicker=section.querySelector(':scope > .pcvKicker,:scope > .acpol,:scope > .bklabel,:scope > .oalabel,:scope > .balabel,:scope > .retailEyebrow')?.textContent?.trim()||'Course information';
  return {title,kicker};
}

function normaliseAboutVisual(section){
  if(!section||section.classList.contains('fundaCourseDuplicate'))return;
  section.classList.add('fundaCourseAboutReadable');
  important(section,'color',INK);
  section.querySelectorAll('p,li,dd,dt,blockquote,small').forEach(el=>{
    if(el.closest('a,button'))return;
    important(el,'color',COPY);important(el,'opacity','1');important(el,'text-shadow','none');
  });
  section.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b').forEach(el=>{
    if(el.closest('a,button'))return;
    important(el,'color',INK);important(el,'opacity','1');important(el,'text-shadow','none');
  });
}

function normaliseAboutSections(){
  const body=mainBody();
  if(!body)return;
  [...body.querySelectorAll(':scope > section,:scope > .section')].filter(isAbout).forEach(normaliseAboutVisual);
}

function normaliseAccordionVisual(section){
  if(!section)return;
  section.classList.add('fundaCourseAccordionV4');
  important(section,'background',LIGHT);important(section,'background-image',LIGHT);important(section,'color',INK);important(section,'padding','0');important(section,'height','auto');important(section,'min-height','0');important(section,'max-height','none');important(section,'overflow','hidden');important(section,'box-shadow','0 7px 20px rgba(48,70,88,.06)');
  const btn=section.querySelector(':scope > .fundaCourseAccordionBtnV4');
  if(btn){important(btn,'background','transparent');important(btn,'color',INK)}
  const body=section.querySelector(':scope > .fundaCourseAccordionBodyV4');
  if(!body)return;
  important(body,'background','transparent');important(body,'background-image','none');important(body,'color',COPY);
  body.querySelectorAll('p,li,dd,dt,blockquote,label,small,span').forEach(el=>{if(el.closest('button'))return;important(el,'color',COPY);important(el,'opacity','1')});
  body.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b').forEach(el=>important(el,'color',INK));
  body.querySelectorAll('.acpoStats div,.baglance div,.bkglance div,.oaglance div,.retailStats div,.pcvMetric,.acpoCard,.bacard,.bkcard,.oacard').forEach(el=>{important(el,'background','#fff');important(el,'background-image','none');important(el,'color',INK);important(el,'border-color','#dce5ef')});
  body.querySelectorAll('.acpoStep,.bastep,.bkstep,.oastep').forEach(el=>{important(el,'background','#fff');important(el,'background-image','none');important(el,'color',INK);important(el,'border','1px solid #dce5ef')});
}

function accordion(section){
  if(!section||section.classList.contains('fundaCourseDuplicate')||isAbout(section))return;
  const existingBody=section.querySelector(':scope > .fundaCourseAccordionBodyV4');
  if(existingBody){normaliseAccordionVisual(section);return}

  // If an older normaliser already wrapped this section, rebuild it once into the V4 structure.
  const oldBtn=section.querySelector(':scope > .fundaCourseAccordionBtn,:scope > .cvclSummary');
  const oldBody=section.querySelector(':scope > .fundaCourseAccordionBody,:scope > .cvclBody');
  if(oldBtn&&oldBody){
    oldBtn.remove();
    while(oldBody.firstChild)section.appendChild(oldBody.firstChild);
    oldBody.remove();
  }

  const meta=labelFor(section);
  const body=document.createElement('div');body.className='fundaCourseAccordionBodyV4';
  while(section.firstChild)body.appendChild(section.firstChild);
  const btn=document.createElement('button');btn.type='button';btn.className='fundaCourseAccordionBtnV4';btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<span class="fundaCourseAccordionTextV4"><span class="fundaCourseAccordionKickerV4"></span><span class="fundaCourseAccordionTitleV4"></span></span><span class="fundaCourseAccordionPlusV4" aria-hidden="true">+</span>';
  btn.querySelector('.fundaCourseAccordionKickerV4').textContent=meta.kicker;
  btn.querySelector('.fundaCourseAccordionTitleV4').textContent=meta.title;
  section.dataset.open='0';
  btn.addEventListener('click',()=>{const opening=section.dataset.open!=='1';section.dataset.open=opening?'1':'0';btn.setAttribute('aria-expanded',String(opening))});
  section.append(btn,body);
  normaliseAccordionVisual(section);
}

function standardiseSections(){
  const body=mainBody();
  if(!body)return;
  [...body.querySelectorAll(':scope > section,:scope > .section')].forEach(accordion);
}

function polish(){
  installStyle();
  enforceBrand();
  if(!restoreBase())return;
  collectOrphans();
  hideDuplicates();
  normaliseAboutSections();
  standardiseSections();
  enforceBrand();
}

function scheduleAuditFix(){
  [0,250,650,1200,2200,3600,5200,7600,10000].forEach(ms=>setTimeout(polish,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleAuditFix,{once:true});else scheduleAuditFix();
document.addEventListener('funda:course-view-ready',scheduleAuditFix);
})();
