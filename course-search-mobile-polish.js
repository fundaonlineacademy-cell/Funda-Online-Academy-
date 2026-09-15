(()=>{
'use strict';
if(!/courses-public\.html$/i.test(location.pathname))return;
const $=id=>document.getElementById(id);
const escText=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function loadFont(){
  if(document.getElementById('coursePublicSourceSans'))return;
  const l=document.createElement('link');
  l.id='coursePublicSourceSans';
  l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap';
  document.head.appendChild(l);
}

function style(){
  if($('csmpStyle'))return;
  loadFont();
  const s=document.createElement('style');
  s.id='csmpStyle';
  s.textContent=`
    body,button,input,select,textarea{font-family:'Source Sans 3',Inter,sans-serif!important}
    body{font-size:16px;line-height:1.62}
    body h1,body h2,body h3,body h4{font-family:'Source Sans 3',Inter,sans-serif!important;font-weight:700!important}
    header,header *,header nav,header .brand,header button,header a{font-family:'Montserrat',sans-serif!important}
    .csmpWrap{display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:stretch}
    .csmpBtn{border:0;border-radius:12px;padding:0 16px;background:#071d49;color:#fff;font-weight:700;font-size:15px;min-height:48px;cursor:pointer}
    .csmpStatus{margin-top:8px;font-size:14px;color:#52647a;font-weight:600;min-height:18px}
    .csmpStatus strong{color:#071d49}
    .csmpSortRow{justify-content:flex-end!important}
    .csmpHeroBadge{line-height:1.35}
    .csmpHeroStats{max-width:330px!important}
    .csmpProgrammeSection{padding:28px 16px;background:#fff;border-top:1px solid #e5edf6;border-bottom:1px solid #e5edf6}
    .csmpProgrammeDetails{max-width:1280px;margin:0 auto;border:1px solid #e2d3a8;border-radius:22px;background:linear-gradient(135deg,#fffaf0,#f5f9ff);overflow:hidden;box-shadow:0 8px 22px rgba(31,64,101,.05)}
    .csmpProgrammeSummary{list-style:none;cursor:pointer;padding:20px 22px}
    .csmpProgrammeSummary::-webkit-details-marker{display:none}
    .csmpProgrammeSummaryInner{display:flex;justify-content:space-between;align-items:center;gap:24px}
    .csmpProgrammeKicker{display:block;font-size:11px;line-height:1.3;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8a6412}
    .csmpProgrammeTitle{margin:4px 0 0;font-size:22px;line-height:1.2;font-weight:700;color:#071d49}
    .csmpProgrammeLead{margin:6px 0 0;max-width:780px;font-size:15px;line-height:1.6;color:#52647a}
    .csmpProgrammeAction{display:inline-flex;align-items:center;gap:9px;white-space:nowrap;border:1px solid #d8c17c;border-radius:999px;background:#fff;padding:9px 13px;font-size:13px;font-weight:700;color:#071d49}
    .csmpProgrammePlus{font-size:18px;line-height:1;transition:transform .18s ease}
    .csmpProgrammeDetails[open] .csmpProgrammePlus{transform:rotate(45deg)}
    .csmpProgrammeBody{border-top:1px solid #eadfbf;padding:24px 0 8px;background:#fff}
    .csmpProgrammeBody>div{padding-top:0!important;padding-bottom:18px!important}
    .csmpProgrammeBody p.leading-7{text-align:justify;text-justify:inter-word}
    @media(max-width:767px){
      body{font-size:16px!important;line-height:1.62!important}
      body>section .text-xs{font-size:.84rem!important;line-height:1.35rem!important}
      body>section .text-sm{font-size:.98rem!important;line-height:1.58rem!important}
      body>section .text-base{font-size:1.03rem!important;line-height:1.68rem!important}
      .hero>div{padding-top:30px!important;padding-bottom:32px!important}
      .hero-title{font-size:2.05rem!important;line-height:1.08!important}
      .section-title{font-size:1.75rem!important;line-height:1.18!important}
      .csmpHeroBadge{font-size:12px!important;line-height:1.35!important;padding:8px 12px!important;letter-spacing:0!important}
      .csmpHeroActions{margin-top:20px!important;gap:9px!important}
      .csmpHeroActions a{min-height:46px;display:flex;align-items:center;justify-content:center}
      .csmpHeroStats{margin-top:23px!important;max-width:100%!important;padding:14px 18px!important;gap:0!important}
      .csmpHeroStats>div>div:first-child{font-size:1.65rem!important;line-height:1.15!important}
      .csmpHeroStats>div>div:last-child{font-size:.9rem!important;line-height:1.3!important}
      .csmpBtn{font-size:15px;padding:0 13px;min-height:48px}
      .csmpStatus{font-size:14px}
      .csmpProgrammeSection{padding:22px 16px}
      .csmpProgrammeSummary{padding:18px}
      .csmpProgrammeSummaryInner{align-items:flex-start;gap:14px}
      .csmpProgrammeTitle{font-size:20px}
      .csmpProgrammeLead{font-size:14px;line-height:1.55}
      .csmpProgrammeAction{padding:8px 10px;font-size:12px}
      .csmpProgrammeActionText{display:none}
      .csmpProgrammeBody{padding-top:18px}
      .csmpProgrammeBody p.leading-7{text-align:left}
      body.csmpSearching #pcvCat,body.csmpSearching #fcsaIntro{display:none!important}
    }
  `;
  document.head.appendChild(s);
}

function polishHero(){
  const hero=document.querySelector('.hero');
  if(!hero||hero.dataset.csmpPolished)return;
  hero.dataset.csmpPolished='1';

  const badge=hero.querySelector('.inline-flex');
  if(badge)badge.classList.add('csmpHeroBadge');

  const description=[...hero.querySelectorAll('p')].find(p=>/browse freely before creating an account/i.test(p.textContent||''));
  if(description)description.textContent='Browse freely before creating an account. Compare practical programmes, course fees and study options designed to help you build practical, career-relevant skills.';

  const browse=hero.querySelector('a[href="#courses"]');
  if(browse?.parentElement)browse.parentElement.classList.add('csmpHeroActions');

  const courseCount=$('heroCourseCount');
  if(courseCount?.parentElement?.parentElement){
    const stats=courseCount.parentElement.parentElement;
    courseCount.parentElement.remove();
    stats.classList.remove('grid-cols-3');
    stats.classList.add('grid-cols-2','csmpHeroStats');
  }
}

function polishResultRow(){
  const count=$('courseResultCount');
  if(!count)return;
  const label=count.parentElement;
  const row=label?.parentElement;
  if(label)label.style.display='none';
  if(row)row.classList.add('csmpSortRow');
}

function compactProgramme(){
  const section=$('no-student-left-behind');
  if(!section||section.dataset.csmpCompact)return;
  const original=section.firstElementChild;
  if(!original)return;
  section.dataset.csmpCompact='1';
  section.className='csmpProgrammeSection';

  const details=document.createElement('details');
  details.className='csmpProgrammeDetails';
  const summary=document.createElement('summary');
  summary.className='csmpProgrammeSummary';
  summary.innerHTML=`<div class="csmpProgrammeSummaryInner"><div><span class="csmpProgrammeKicker">Funda Student Programme</span><h2 class="csmpProgrammeTitle">No Student Left Behind</h2><p class="csmpProgrammeLead">A dedicated pathway for eligible former students who may wish to return, complete or upgrade their learning with Funda Online Academy.</p></div><span class="csmpProgrammeAction"><span class="csmpProgrammeActionText">Explore programme</span><span class="csmpProgrammePlus" aria-hidden="true">+</span></span></div>`;
  const body=document.createElement('div');
  body.className='csmpProgrammeBody';
  body.appendChild(original);
  details.append(summary,body);
  section.replaceChildren(details);
}

function professionalCopy(){
  const how=$('how-it-works');
  if(how){
    const p=[...how.querySelectorAll('p')].find(x=>/see the course first/i.test(x.textContent||''));
    if(p)p.textContent='Review the course information first. Register when you are ready, then begin learning once your enrolment has been approved.';
  }
}

function mount(){
  const input=$('courseSearch'),count=$('courseResultCount'),grid=$('courseGrid');
  if(!input||!count||!grid)return false;
  if($('csmpSearchBtn'))return true;
  style();
  polishHero();
  polishResultRow();
  compactProgramme();
  professionalCopy();

  const wrap=input.parentElement;
  wrap.classList.add('csmpWrap');
  const btn=document.createElement('button');
  btn.id='csmpSearchBtn';
  btn.type='button';
  btn.className='csmpBtn';
  btn.textContent='Search';
  wrap.appendChild(btn);
  const status=document.createElement('div');
  status.id='csmpStatus';
  status.className='csmpStatus';
  wrap.insertAdjacentElement('afterend',status);

  function update(){
    const q=(input.value||'').trim();
    document.body.classList.toggle('csmpSearching',!!q);
    if(!q){status.textContent='';return}
    const n=Number((count.textContent||'').replace(/[^0-9]/g,''));
    status.innerHTML=Number.isFinite(n)&&n===0?`No courses match “${escText(q)}”.`:`Showing results for “${escText(q)}”.`;
  }
  function run(jump){
    input.dispatchEvent(new Event('input',{bubbles:true}));
    setTimeout(()=>{
      update();
      if(jump){
        input.blur();
        const target=(Number((count.textContent||'').replace(/[^0-9]/g,''))===0?$('noSearchResults'):grid);
        target?.scrollIntoView({behavior:'smooth',block:'start'});
      }
    },80);
  }
  input.addEventListener('input',()=>setTimeout(update,40));
  input.addEventListener('search',()=>run(false));
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run(true)}});
  btn.addEventListener('click',()=>run(true));
  new MutationObserver(update).observe(count,{childList:true,characterData:true,subtree:true});
  update();
  return true;
}

let tries=0;
function boot(){if(mount())return;if(++tries<80)setTimeout(boot,250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
