(()=>{
'use strict';
if(!/courses-public\.html$/i.test(location.pathname))return;
if(window.__fundaCourseSearchMobilePolish)return;
window.__fundaCourseSearchMobilePolish=true;
const $=id=>document.getElementById(id);
const escText=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function loadFont(){
  if(document.getElementById('coursePublicSourceSans'))return;
  const l=document.createElement('link');
  l.id='coursePublicSourceSans';
  l.rel='stylesheet';
  l.href='https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700;800;900&display=swap';
  document.head.appendChild(l);
}

function style(){
  loadFont();
  let s=$('csmpStyle');
  if(!s){s=document.createElement('style');s.id='csmpStyle';document.head.appendChild(s)}
  s.textContent=`
    body,button,input,select,textarea,header,header *,header nav,header .brand,header button,header a{font-family:'Source Sans 3','Segoe UI',Roboto,Helvetica,Arial,sans-serif!important}
    body{font-size:16px;line-height:1.62}
    body h1,body h2,body h3,body h4{font-family:'Source Sans 3','Segoe UI',Roboto,Helvetica,Arial,sans-serif!important;font-weight:700!important}
    #employerPublicPromo h2,#ambassadorCoursesPromo h3{font-family:'Source Sans 3','Segoe UI',Roboto,Helvetica,Arial,sans-serif!important}
    .csmpHeaderActionsWrap{margin-left:auto;display:flex;align-items:center;gap:10px;flex:0 0 auto}
    .csmpHeaderActionsWrap #mobileMenuButton{flex:0 0 auto}
    header a[data-legacy-students-link="1"]{white-space:nowrap}
    .csmpWrap{display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:stretch}
    .csmpBtn{border:0;border-radius:12px;padding:0 16px;background:#071d49;color:#fff;font-weight:700;font-size:15px;min-height:48px;cursor:pointer}
    .csmpStatus{margin-top:8px;font-size:14px;color:#52647a;font-weight:600;min-height:18px}
    .csmpStatus strong{color:#071d49}
    .csmpSortRow{justify-content:space-between!important;align-items:center!important;flex-wrap:wrap}
    .csmpSortRow #sortCourses{margin-left:auto!important;margin-right:0!important}
    .csmpHeroBadge{line-height:1.35}
    .csmpHeroStats{max-width:330px!important}
    .csmpHeroPanel{display:none}
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
    .csmpProgrammeMore{max-width:1280px;margin:0 auto;padding:0 28px 22px;text-align:right}
    .csmpProgrammeMore a{display:inline-flex;align-items:center;justify-content:center;border-radius:12px;background:#21384d;color:#fff;text-decoration:none;padding:11px 15px;font-size:13px;font-weight:700}
    html body footer.bg-\[\#041533\]{color:#fff!important}
    html body footer.bg-\[\#041533\] .funda-strong-text.funda-strong-text{color:#dbe6f3!important}
    html body footer.bg-\[\#041533\] .brand,html body footer.bg-\[\#041533\] .brand .funda-strong-text{color:#fff!important}
    html body footer.bg-\[\#041533\] .brand span{color:#d9b95e!important}
    @media(min-width:1024px){
      .csmpHeroOuter{display:grid!important;grid-template-columns:minmax(0,1.18fr) minmax(310px,.82fr);gap:54px;align-items:center}
      .csmpHeroContent{max-width:none!important}
      .csmpHeroContent>p{max-width:760px!important;font-size:16px!important;line-height:1.8!important}
      .csmpHeroContent .hero-title{max-width:790px;font-size:3.2rem!important;line-height:1.06!important;letter-spacing:-.025em}
      .csmpHeroPanel{display:block;border:1px solid rgba(201,154,46,.32);border-radius:24px;background:rgba(255,250,240,.8);box-shadow:0 16px 40px rgba(33,56,77,.08);padding:24px}
      .csmpHeroPanelKicker{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8a6412}
      .csmpHeroPanel h2{margin:6px 0 15px;font-size:22px!important;line-height:1.25;color:#21384d}
      .csmpHeroFact{display:grid;grid-template-columns:34px minmax(0,1fr);gap:11px;padding:12px 0;border-top:1px solid rgba(70,103,127,.14)}
      .csmpHeroFact:first-of-type{border-top:0}
      .csmpHeroFactIcon{width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#fff4dc;border:1px solid #e0cb8d;font-size:14px}
      .csmpHeroFact strong{display:block;color:#21384d;font-size:14px;line-height:1.35}
      .csmpHeroFact span:last-child{display:block;margin-top:2px;color:#5b6976;font-size:13px;line-height:1.5}
    }
    @media(max-width:1100px) and (min-width:768px){
      .csmpHeaderActionsWrap{gap:7px}
      .csmpHeaderActionsWrap>div{gap:7px!important}
      .csmpHeaderActionsWrap>div a{padding-left:11px!important;padding-right:11px!important;font-size:12px!important}
    }
    @media(max-width:767px){
      body{font-size:16px!important;line-height:1.62!important}
      body>section .text-xs{font-size:.84rem!important;line-height:1.35rem!important}
      body>section .text-sm{font-size:.98rem!important;line-height:1.58rem!important}
      body>section .text-base{font-size:1.03rem!important;line-height:1.68rem!important}
      .hero:not(.funda-course-hero)>div{padding-top:30px!important;padding-bottom:32px!important}
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
      .csmpProgrammeMore{padding:0 18px 18px;text-align:left}
      .csmpProgrammeMore a{width:100%}
      body.csmpSearching #pcvCat,body.csmpSearching #fcsaIntro{display:none!important}
    }
  `;
}

function standardiseAccountActions(){
  document.querySelectorAll('header,.hero,#contact,footer').forEach(scope=>{
    scope.querySelectorAll('a[href]').forEach(a=>{
      const raw=a.getAttribute('href')||'';
      const text=(a.textContent||'').replace(/\s+/g,' ').trim();
      if(/^auth\.html(?:\?|#|$)/i.test(raw))a.setAttribute('href','create-account.html');
      if(/^create-account\.html/i.test(a.getAttribute('href')||'')&&/^(Create Account|Register|Sign Up|Get Started)$/i.test(text))a.textContent='Create Student Account';
      if(/^login\.html/i.test(raw)&&/^Login$/i.test(text))a.textContent='Student Login';
    });
  });
}

function ensureHeaderLinks(){
  const header=document.querySelector('header');
  const courseLink=header?.querySelector('a[href="#courses"]');
  const primary=courseLink?.parentElement;
  const mobile=$('mobileMenu')?.firstElementChild;
  if(primary){
    const contact=primary.querySelector('a[href="#contact"]');
    const ensure=(href,label,attr)=>{
      let links=[...primary.querySelectorAll(`a[href="${href}"]`)];
      let link=links.shift();
      links.forEach(x=>x.remove());
      if(!link){link=document.createElement('a');link.href=href;link.textContent=label;link.className=contact?.className||courseLink.className;if(attr)link.dataset[attr]='1';(contact||primary.lastElementChild)?.insertAdjacentElement(contact?'beforebegin':'afterend',link)}
      if(attr)link.dataset[attr]='1';
      return link;
    };
    ensure('employers.html','Employers','employerLink');
    ensure('ambassadors.html','Ambassadors','ambassadorLink');
    contact?.remove();
  }
  const actions=header?.querySelector('a[href="login.html"]')?.parentElement;
  if(actions){
    actions.querySelectorAll('a[data-legacy-students-link="1"],a[href="employers.html"],a[href="ambassadors.html"]').forEach(a=>a.remove());
  }
  if(mobile){
    const contact=[...mobile.querySelectorAll('a')].find(a=>a.getAttribute('href')==='#contact');
    const ensureMobile=(href,label,attr)=>{
      const matches=[...mobile.querySelectorAll(`a[href="${href}"]`)];
      let link=matches.shift();matches.forEach(x=>x.remove());
      if(!link){link=document.createElement('a');link.href=href;link.textContent=label;link.className='block px-3 py-2.5 font-semibold';if(attr)link.dataset[attr]='1';if(contact)mobile.insertBefore(link,contact);else mobile.appendChild(link)}
      if(attr)link.dataset[attr]='1';
    };
    ensureMobile('employers.html','Employers','employerLink');
    ensureMobile('ambassadors.html','Ambassadors','ambassadorLink');
    ensureMobile('legacy-students.html','Legacy Students','legacyStudentsLink');
  }
}

function polishHeaderActions(){
  const button=$('mobileMenuButton');
  if(!button)return;
  const row=button.parentElement;
  if(!row)return;
  let wrap=button.closest('.csmpHeaderActionsWrap');
  if(!wrap){
    const login=row.querySelector('a[href="login.html"]');
    const actions=login?.parentElement;
    wrap=document.createElement('div');
    wrap.className='csmpHeaderActionsWrap';
    row.insertBefore(wrap,actions||button);
    if(actions)wrap.appendChild(actions);
    wrap.appendChild(button);
  }
  standardiseAccountActions();
  ensureHeaderLinks();
}

function bindMobileMenuA11y(){
  const button=$('mobileMenuButton'),menu=$('mobileMenu');
  if(!button||!menu||button.dataset.csmpA11y)return;
  button.dataset.csmpA11y='1';
  const sync=()=>{const open=!menu.classList.contains('hidden');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');button.textContent=open?'×':'☰'};
  button.addEventListener('click',()=>setTimeout(sync,0));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.classList.contains('hidden')){menu.classList.add('hidden');sync();button.focus()}});
  new MutationObserver(sync).observe(menu,{attributes:true,attributeFilter:['class']});
  sync();
}

function polishHero(){
  const hero=document.querySelector('.hero');
  if(!hero)return;
  if(hero.classList.contains('funda-course-hero'))return;
  const outer=hero.firstElementChild;
  const content=outer?.firstElementChild;
  if(!outer||!content)return;
  outer.classList.add('csmpHeroOuter');
  content.classList.add('csmpHeroContent');
  const badge=hero.querySelector('.inline-flex');
  if(badge)badge.classList.add('csmpHeroBadge');
  const description=[...hero.querySelectorAll('p')].find(p=>/browse freely before creating an account/i.test(p.textContent||''));
  if(description)description.textContent='Browse freely before creating an account. Compare practical programmes, course fees and study options, then choose learning that aligns with your interests, development goals and the practical skills you want to build.';
  const browse=hero.querySelector('a[href="#courses"]');
  if(browse?.parentElement)browse.parentElement.classList.add('csmpHeroActions');
  const create=hero.querySelector('a[href="auth.html"],a[href="create-account.html"]');
  if(create){create.href='create-account.html';create.textContent='Create Student Account'}
  const courseCount=$('heroCourseCount');
  if(courseCount?.parentElement?.parentElement){const stats=courseCount.parentElement.parentElement;courseCount.parentElement.remove();stats.classList.remove('grid-cols-3');stats.classList.add('grid-cols-2','csmpHeroStats')}
  if(!outer.querySelector('.csmpHeroPanel')){
    const panel=document.createElement('aside');
    panel.className='csmpHeroPanel';
    panel.setAttribute('aria-label','What to expect from Funda Online Academy');
    panel.innerHTML=`<div class="csmpHeroPanelKicker">Study with clarity</div><h2>Know what to expect before you enrol.</h2><div class="csmpHeroFact"><span class="csmpHeroFactIcon" aria-hidden="true">✓</span><div><strong>100% Online Learning</strong><span>Study and access Academy services online without attending a physical campus.</span></div></div><div class="csmpHeroFact"><span class="csmpHeroFactIcon" aria-hidden="true">◷</span><div><strong>24/7 Platform Access</strong><span>Access the website and available learning services at any time.</span></div></div><div class="csmpHeroFact"><span class="csmpHeroFactIcon" aria-hidden="true">⌕</span><div><strong>Browse Before Registration</strong><span>Review course information, fees and study details before creating an account.</span></div></div><div class="csmpHeroFact"><span class="csmpHeroFactIcon" aria-hidden="true">◇</span><div><strong>Clear Course Information</strong><span>Course requirements and certification information are presented before enrolment.</span></div></div>`;
    outer.appendChild(panel);
  }
}

function polishResultRow(){
  const count=$('courseResultCount'),sort=$('sortCourses');
  if(!count||!sort)return;
  const label=count.parentElement,row=label?.parentElement;
  if(label)label.style.display='block';
  if(row){row.classList.add('csmpSortRow');row.style.justifyContent='space-between'}
  const first=sort.querySelector('option[value="popular"],option[value="catalogue"]');
  if(first){first.value='catalogue';first.textContent='Career & Skills Order'}
  if(sort.value==='popular')sort.value='catalogue';
  sort.setAttribute('aria-label','Sort courses');
}

function orderPublicSections(){
  const how=$('how-it-works'),faq=$('faq'),programme=$('no-student-left-behind'),employer=$('employerPublicPromo'),ambassador=$('ambassadorCoursesPromo');
  if(!how)return;let anchor=how;
  if(faq){if(anchor.nextElementSibling!==faq)anchor.insertAdjacentElement('afterend',faq);anchor=faq}
  if(programme){if(anchor.nextElementSibling!==programme)anchor.insertAdjacentElement('afterend',programme);anchor=programme}
  if(employer){if(anchor.nextElementSibling!==employer)anchor.insertAdjacentElement('afterend',employer);anchor=employer}
  if(ambassador&&anchor.nextElementSibling!==ambassador)anchor.insertAdjacentElement('afterend',ambassador)
}

function compactProgramme(){
  const section=$('no-student-left-behind');if(!section||section.dataset.csmpCompact)return;const original=section.firstElementChild;if(!original)return;
  section.dataset.csmpCompact='1';section.className='csmpProgrammeSection';
  const details=document.createElement('details');details.className='csmpProgrammeDetails';
  const summary=document.createElement('summary');summary.className='csmpProgrammeSummary';summary.innerHTML=`<div class="csmpProgrammeSummaryInner"><div><span class="csmpProgrammeKicker">Legacy Student Programme</span><h2 class="csmpProgrammeTitle">No Student Left Behind</h2><p class="csmpProgrammeLead">A dedicated pathway for eligible former students who may wish to return, complete or upgrade their learning with Funda Online Academy.</p></div><span class="csmpProgrammeAction"><span class="csmpProgrammeActionText">Explore programme</span><span class="csmpProgrammePlus" aria-hidden="true">+</span></span></div>`;
  const body=document.createElement('div');body.className='csmpProgrammeBody';body.appendChild(original);
  const more=document.createElement('div');more.className='csmpProgrammeMore';more.innerHTML='<a href="legacy-students.html">View the full Legacy Student Programme →</a>';body.appendChild(more);details.append(summary,body);section.replaceChildren(details)
}

function professionalCopy(){
  const how=$('how-it-works');if(how){const heading=how.querySelector('h2'),kicker=heading?.previousElementSibling;if(kicker)kicker.textContent='Get Started';const p=[...how.querySelectorAll('p')].find(x=>/see the course first/i.test(x.textContent||''));if(p)p.textContent='Review the course information first. Register when you are ready, then begin learning once your enrolment has been approved.'}
}

function faqCard(key,question,answer){const d=document.createElement('details');d.dataset.csmpFaq=key;d.className='border bg-white rounded-xl p-4 shadow-sm';d.innerHTML=`<summary class="cursor-pointer flex justify-between gap-3 font-semibold text-sm text-[#071D49]">${question}<span class="faq-arrow text-[#C99A2E]">＋</span></summary><p class="mt-3 text-sm text-slate-600 leading-6">${answer}</p>`;return d}
function polishFaq(){
  const faq=$('faq'),grid=faq?.querySelector('.mt-8.grid');if(!grid)return;
  const cards=[...grid.querySelectorAll('details')];const office=cards.find(d=>/where are your offices/i.test(d.querySelector('summary')?.textContent||''));
  if(office){office.dataset.csmpFaq='location';office.innerHTML=`<summary class="cursor-pointer flex justify-between gap-3 font-semibold text-sm text-[#071D49]">Where is Funda Online Academy based, and do you have a physical campus?<span class="faq-arrow text-[#C99A2E]">＋</span></summary><p class="mt-3 text-sm text-slate-600 leading-6">Funda Online Academy is a South African online learning institution that operates 100% online. We do not operate a walk-in campus or public-facing student office. Registration, learning, assessments, student support and Academy services are delivered online, allowing students to study without travelling to a physical campus.</p><p class="mt-3 text-sm text-slate-600 leading-6">We understand that students may want reassurance before registering or making payment. Prospective students are welcome to verify the Academy through our official website, email or WhatsApp contact details before enrolling. Once enrolled, students also receive access to the appropriate support channels within the student environment.</p>`}
  const current=[...grid.querySelectorAll('details')],registered=current.find(d=>/registered business/i.test(d.querySelector('summary')?.textContent||''));let anchor=registered||office||current[0];
  const additions=[['official','How can I confirm that I am dealing with the official Funda Online Academy?','Use our official website <strong>fundaonlineacademy.co.za</strong>, email <strong>infor@fundaonlineacademy.co.za</strong>, or WhatsApp <strong>069 960 8590</strong>. If you receive a payment request or message that you are unsure about, confirm it through one of these official channels before making payment or sharing personal information.'],['data','Do I need internet or mobile data to study?','Yes. Because Funda Online Academy operates fully online, you will need an internet connection through mobile data or Wi-Fi to access the website, your Student Dashboard, course lessons, assessments, learning materials and online support services. Data usage will vary depending on the learning activity and resources being accessed. We recommend a stable internet connection when completing assessments, uploading documents or accessing larger learning materials.'],['device','What device can I use to study?','Most Academy services can be accessed using an internet-connected smartphone, tablet, laptop or desktop computer with a modern web browser. A laptop, desktop or larger screen may be more comfortable for longer lessons, assessments and document uploads. Keep your browser updated and use a stable internet connection where possible.'],['international','Can I study with Funda Online Academy if I live outside South Africa?','Funda Online Academy is designed for online access and is working to support learners beyond South Africa. International enrolment may be available for selected courses and payment arrangements. If you live outside South Africa, contact the Academy through an official channel before making payment so that course availability, payment options, certification information and any country-specific requirements can be confirmed.']];
  additions.forEach(([key,question,answer])=>{let existing=grid.querySelector(`[data-csmp-faq="${key}"]`);if(!existing)existing=faqCard(key,question,answer);if(anchor){if(anchor.nextElementSibling!==existing)anchor.insertAdjacentElement('afterend',existing)}else if(!existing.isConnected)grid.appendChild(existing);anchor=existing})
}

function mount(){
  const input=$('courseSearch'),count=$('courseResultCount'),grid=$('courseGrid');if(!input||!count||!grid)return false;
  style();polishHeaderActions();bindMobileMenuA11y();polishHero();polishResultRow();orderPublicSections();compactProgramme();professionalCopy();polishFaq();standardiseAccountActions();
  input.setAttribute('aria-label','Search courses, skills or topics');
  if($('csmpSearchBtn'))return true;
  const wrap=input.parentElement;wrap.classList.add('csmpWrap');
  const btn=document.createElement('button');btn.id='csmpSearchBtn';btn.type='button';btn.className='csmpBtn';btn.textContent='Search';wrap.appendChild(btn);
  const status=document.createElement('div');status.id='csmpStatus';status.className='csmpStatus';status.setAttribute('aria-live','polite');wrap.insertAdjacentElement('afterend',status);
  function update(){const q=(input.value||'').trim();document.body.classList.toggle('csmpSearching',!!q);if(!q){status.textContent='';return}const n=Number((count.textContent||'').replace(/[^0-9]/g,''));status.innerHTML=Number.isFinite(n)&&n===0?`No courses match “${escText(q)}”.`:`Showing ${Number.isFinite(n)?n:''} ${n===1?'course':'courses'} for “${escText(q)}”.`}
  function run(jump){input.dispatchEvent(new Event('input',{bubbles:true}));setTimeout(()=>{update();if(jump){input.blur();const target=(Number((count.textContent||'').replace(/[^0-9]/g,''))===0?$('noSearchResults'):grid);target?.scrollIntoView({behavior:'smooth',block:'start'})}},80)}
  input.addEventListener('input',()=>setTimeout(update,40));input.addEventListener('search',()=>run(false));input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run(true)}});btn.addEventListener('click',()=>run(true));new MutationObserver(update).observe(count,{childList:true,characterData:true,subtree:true});update();return true
}

function keepLayout(){[300,800,1500,2600,4000].forEach(ms=>setTimeout(()=>{polishHeaderActions();bindMobileMenuA11y();polishHero();polishResultRow();orderPublicSections();polishFaq();standardiseAccountActions()},ms))}
let tries=0;function boot(){if(mount()){keepLayout();return}if(++tries<80)setTimeout(boot,250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
