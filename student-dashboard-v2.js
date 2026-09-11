(()=>{
'use strict';
if(window.__fundaStudentDashboardV2)return;
window.__fundaStudentDashboardV2=true;

const CSS=`
:root{--sd-navy:#06152f;--sd-navy2:#0b2746;--sd-gold:#d4aa42;--sd-ink:#17324a;--sd-line:#dbe3ea}
body.sdV2{background:linear-gradient(180deg,#fffdf8 0%,#f7f8fa 46%,#fffaf0 100%)!important;color:#111!important}
.sdOverlay{position:fixed;inset:0;background:rgba(1,12,29,.62);z-index:74;opacity:0;pointer-events:none;transition:.18s}
.sdOverlay.open{opacity:1;pointer-events:auto}
.sdSide{position:fixed;left:0;top:0;bottom:0;width:292px;background:linear-gradient(180deg,#fffdf7 0%,#fffaf0 58%,#fffdf8 100%);z-index:75;color:#17324a;overflow-y:auto;overscroll-behavior:contain;transform:translateX(-102%);transition:.2s;box-shadow:18px 0 50px rgba(2,17,36,.22);border-right:1px solid #ead9ad}
.sdSide.open{transform:none}
.sdSideInner{padding:24px 20px 28px}
.sdBrand{display:flex;align-items:center;gap:12px;padding-bottom:20px;border-bottom:1px solid #ead9ad}
.sdBrand img{display:none}
.sdBrand b{display:block;font-family:Montserrat,sans-serif;font-size:18px;line-height:1.15;color:#17324a}
.sdBrand span{display:block;margin-top:4px;font-size:9px;letter-spacing:.19em;font-weight:900;color:#b58216}
.sdClose{margin-left:auto;width:42px;height:42px;border:1px solid #e4d29d;border-radius:12px;background:#fff;color:#17324a;font-size:25px;cursor:pointer}
.sdIdentity{padding:22px 8px 18px;border-bottom:1px solid #ead9ad}
.sdPerson{display:flex;gap:13px;align-items:center}
.sdAvatar{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#e8bd51,#f5dc8d);color:#17324a;font:800 20px Montserrat,sans-serif}
.sdPerson b{display:block;font:800 15px Montserrat,sans-serif}.sdPerson small{display:block;color:#677585;font-size:10px;margin-top:3px}
.sdStatus{display:inline-flex;margin-top:6px;padding:4px 8px;border-radius:999px;background:#dff4e7;color:#155f3f;font-size:8px;font-weight:900;letter-spacing:.05em}
.sdProgressMeta{display:flex;justify-content:space-between;margin-top:15px;color:#17324a;font-size:9px;font-weight:800}.sdTrack{height:6px;border-radius:999px;background:#eadfca;overflow:hidden;margin-top:6px}.sdTrack i{display:block;height:100%;background:linear-gradient(90deg,#c58d0c,#e2bc55);width:0}
.sdNavGroup{margin-top:22px}.sdNavLabel{padding:0 8px;margin-bottom:8px;color:#b58216;font-size:9px;letter-spacing:.18em;font-weight:900;display:flex;align-items:center;gap:10px}.sdNavLabel:after{content:"";height:1px;flex:1;background:#e0bd60}
.sdNav a,.sdNav button{width:100%;border:0;text-decoration:none;display:flex;align-items:center;gap:12px;padding:12px 12px;border-radius:12px;background:transparent;color:#17324a;font:800 12px Inter,sans-serif;cursor:pointer;text-align:left}
.sdNav a:hover,.sdNav button:hover{background:#fff6dc;color:#17324a}
.sdNav .active{background:linear-gradient(90deg,#f5dd9a,#e1b84c);color:#17324a;box-shadow:0 4px 12px rgba(184,133,22,.12)}
.sdNavIcon{width:20px;text-align:center;font-size:16px;color:#b58216}.sdLogout{color:#17324a!important;margin-top:7px}
.sdTopMenu{display:inline-grid!important;place-items:center;width:46px;height:46px;padding:0!important;border-radius:12px!important;background:rgba(255,255,255,.08)!important;border:1px solid rgba(255,255,255,.18)!important;color:#fff!important;font-size:24px!important;flex:0 0 auto}
.sdDashOnly{display:none!important}
.sdCompactWelcome{margin-bottom:18px;padding:22px 24px;border-radius:22px;background:#fff;border:1px solid #dbe3ea;box-shadow:0 5px 16px rgba(20,49,77,.05)}
.sdCompactWelcome .sdWelcomeKicker{margin:0;color:#9a6c0d;font-size:12px;letter-spacing:.16em;font-weight:900;text-transform:uppercase}.sdCompactWelcome h1{margin:7px 0 0;color:#111827;font:900 30px/1.15 Montserrat,sans-serif}.sdWelcomeMessage{max-width:900px;margin:10px 0 0;color:#293847;font-size:16px;line-height:1.7;font-weight:600}
.sdStudentCeoMessage{position:relative;overflow:hidden;background:linear-gradient(135deg,#fffdf7 0%,#fff8e8 58%,#f6e8c5 100%)!important;border:1px solid #dfc477!important;color:#111827!important;box-shadow:0 10px 28px rgba(122,93,26,.08)!important}
.sdStudentCeoMessage:before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,#b67b08,#e2bc55)}
.sdCeoKicker{margin:0;color:#8a5f09!important;font-size:12px!important;letter-spacing:.16em;font-weight:900;text-transform:uppercase}.sdStudentCeoMessage h2{max-width:900px;margin:8px 0 0;color:#111827!important;font:900 26px/1.3 Montserrat,sans-serif}.sdCeoBody{max-width:1050px;margin-top:18px;color:#202d39;font-size:16px;line-height:1.75}.sdCeoBody p{margin:0 0 12px;color:#202d39!important}.sdCeoBody p:last-child{margin-bottom:0}.sdCeoCharge{padding:13px 15px;border-left:3px solid #b67b08;background:rgba(255,255,255,.72);border-radius:0 10px 10px 0;font-weight:800;color:#172536!important}.sdCeoSign{margin:18px 0 0;color:#76520a!important;font-size:13px;font-weight:900}.sdCeoSign span{display:block;margin-top:3px;color:#33475a;font-size:12px;font-weight:700}
.sdStatusKicker{margin:0 0 12px;color:#8a5f09;font-size:12px;letter-spacing:.16em;font-weight:900;text-transform:uppercase}
.sdStudentMeta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:20px;padding-top:18px;border-top:1px solid #e2e7ec}.sdStudentMeta div{background:#f8fafc;border:1px solid #dce3e9;border-radius:13px;padding:12px}.sdStudentMeta span{display:block;color:#455565;font-size:12px;letter-spacing:.06em;font-weight:900;text-transform:uppercase}.sdStudentMeta b{display:block;color:#111827;font-size:15px;margin-top:5px}
.sdRecentMore{display:flex;justify-content:flex-end;margin-top:12px}.sdRecentMore button{border:1px solid #d6b458;background:#fffdf7;color:#17324a;border-radius:10px;padding:10px 13px;font-size:14px;font-weight:900}
body.sdV2[data-sd-view="dashboard"] #dashboardStats,
body.sdV2[data-sd-view="dashboard"] #coursesAndQuickAccess,
body.sdV2[data-sd-view="dashboard"] #applicationJourney,
body.sdV2[data-sd-view="dashboard"] #announcementsSection,
body.sdV2[data-sd-view="dashboard"] #librarySection,
body.sdV2[data-sd-view="dashboard"] #studentInfoAndAcademy,
body.sdV2[data-sd-view="dashboard"] #studentCommunicationHelpCentre,
body.sdV2[data-sd-view="dashboard"] #studentFaqSection,
body.sdV2[data-sd-view="dashboard"] #studentAcademicSupportSection,
body.sdV2[data-sd-view="dashboard"] #studentSupportSection,
body.sdV2[data-sd-view="dashboard"] #studentAssessmentsCentre,
body.sdV2[data-sd-view="dashboard"] #studentStudyMaterialsSection{display:none!important}
body.sdV2[data-sd-view="dashboard"] #compactWelcome,
body.sdV2[data-sd-view="dashboard"] #studentHero{display:block!important}
body.sdV2:not([data-sd-view="dashboard"]) #fundaStudentHouseRules,
body.sdV2:not([data-sd-view="dashboard"]) #academy-identity{display:none!important}

body.sdV2[data-sd-view="courses"] #studentHero,
body.sdV2[data-sd-view="courses"] #statusBanner,
body.sdV2[data-sd-view="courses"] #dashboardStats,
body.sdV2[data-sd-view="courses"] #applicationJourney,
body.sdV2[data-sd-view="courses"] #recentActivity,
body.sdV2[data-sd-view="courses"] #announcementsSection,
body.sdV2[data-sd-view="courses"] #librarySection,
body.sdV2[data-sd-view="courses"] #studentInfoAndAcademy,
body.sdV2[data-sd-view="courses"] #compactWelcome,
body.sdV2[data-sd-view="courses"] #studentCommunicationHelpCentre,
body.sdV2[data-sd-view="courses"] #studentFaqSection,
body.sdV2[data-sd-view="courses"] #studentAcademicSupportSection,
body.sdV2[data-sd-view="courses"] #studentSupportSection{display:none!important}
body.sdV2[data-sd-view="courses"] #coursesAndQuickAccess{display:grid!important;grid-template-columns:1fr!important}
body.sdV2[data-sd-view="courses"] #studentQuickAccess{display:none!important}

body.sdV2[data-sd-view="communication"] #studentHero,
body.sdV2[data-sd-view="communication"] #statusBanner,
body.sdV2[data-sd-view="communication"] #dashboardStats,
body.sdV2[data-sd-view="communication"] #coursesAndQuickAccess,
body.sdV2[data-sd-view="communication"] #applicationJourney,
body.sdV2[data-sd-view="communication"] #recentActivity,
body.sdV2[data-sd-view="communication"] #librarySection,
body.sdV2[data-sd-view="communication"] #studentInfoAndAcademy,
body.sdV2[data-sd-view="communication"] #compactWelcome,
body.sdV2[data-sd-view="communication"] #studentFaqSection,
body.sdV2[data-sd-view="communication"] #studentAcademicSupportSection,
body.sdV2[data-sd-view="communication"] #studentSupportSection{display:none!important}

body.sdV2[data-sd-view="faq"] #studentHero,
body.sdV2[data-sd-view="faq"] #statusBanner,
body.sdV2[data-sd-view="faq"] #dashboardStats,
body.sdV2[data-sd-view="faq"] #coursesAndQuickAccess,
body.sdV2[data-sd-view="faq"] #applicationJourney,
body.sdV2[data-sd-view="faq"] #recentActivity,
body.sdV2[data-sd-view="faq"] #announcementsSection,
body.sdV2[data-sd-view="faq"] #librarySection,
body.sdV2[data-sd-view="faq"] #studentInfoAndAcademy,
body.sdV2[data-sd-view="faq"] #compactWelcome,
body.sdV2[data-sd-view="faq"] #studentCommunicationHelpCentre,
body.sdV2[data-sd-view="faq"] #studentAcademicSupportSection,
body.sdV2[data-sd-view="faq"] #studentSupportSection{display:none!important}

body.sdV2[data-sd-view="academic"] #studentHero,
body.sdV2[data-sd-view="academic"] #statusBanner,
body.sdV2[data-sd-view="academic"] #dashboardStats,
body.sdV2[data-sd-view="academic"] #coursesAndQuickAccess,
body.sdV2[data-sd-view="academic"] #applicationJourney,
body.sdV2[data-sd-view="academic"] #recentActivity,
body.sdV2[data-sd-view="academic"] #announcementsSection,
body.sdV2[data-sd-view="academic"] #librarySection,
body.sdV2[data-sd-view="academic"] #studentInfoAndAcademy,
body.sdV2[data-sd-view="academic"] #compactWelcome,
body.sdV2[data-sd-view="academic"] #studentCommunicationHelpCentre,
body.sdV2[data-sd-view="academic"] #studentFaqSection,
body.sdV2[data-sd-view="academic"] #studentSupportSection{display:none!important}

body.sdV2[data-sd-view="support"] #studentHero,
body.sdV2[data-sd-view="support"] #statusBanner,
body.sdV2[data-sd-view="support"] #dashboardStats,
body.sdV2[data-sd-view="support"] #coursesAndQuickAccess,
body.sdV2[data-sd-view="support"] #applicationJourney,
body.sdV2[data-sd-view="support"] #recentActivity,
body.sdV2[data-sd-view="support"] #announcementsSection,
body.sdV2[data-sd-view="support"] #librarySection,
body.sdV2[data-sd-view="support"] #studentInfoAndAcademy,
body.sdV2[data-sd-view="support"] #compactWelcome,
body.sdV2[data-sd-view="support"] #studentCommunicationHelpCentre,
body.sdV2[data-sd-view="support"] #studentFaqSection,
body.sdV2[data-sd-view="support"] #studentAcademicSupportSection{display:none!important}
@media(max-width:700px){.sdStudentMeta{grid-template-columns:1fr 1fr}}
.sdMotto{margin-top:22px;padding:16px 10px;border-radius:15px;background:linear-gradient(135deg,#fff9e8,#f5dda0);border:1px solid #ead39b;color:#b58216;text-align:center;font:800 12px Montserrat,sans-serif}.sdMotto small{display:block;margin-top:6px;color:#7c8793;font:800 7px Inter,sans-serif;letter-spacing:.24em}body.sdV2>header{background:#06152f!important}
body.sdV2>header nav,body.sdV2>header .mobile-scroll{display:none!important}
body.sdV2 #dashboardContent h1,body.sdV2 #dashboardContent h2,body.sdV2 #dashboardContent h3{color:#17324a}
body.sdV2 #dashboardContent .hero h1,body.sdV2 #dashboardContent .hero h2{color:#17324a}
body.sdV2 .card{box-shadow:0 4px 14px rgba(14,42,72,.06)!important;border-color:#dbe3ea!important}
body.sdV2 .text-slate-500,body.sdV2 .text-slate-600{color:#3d4d5c!important}
body.sdV2 #overview{max-width:1480px!important}
.sdSectionMark{scroll-margin-top:95px}
body.sdV2>header .h-\[72px\]{justify-content:flex-start!important}
body.sdV2>header .h-\[72px\]>a{order:2}
body.sdV2>header .h-\[72px\]>.flex.items-center.gap-2{order:1;margin-right:2px}
body.sdV2>header #logoutButton{order:3;margin-left:auto;background:linear-gradient(135deg,#e2b64a,#f1d67d)!important;color:#17324a!important;border:0!important}
body.sdV2>header #profileButton{display:none!important}
body.sdV2 #studentHero a[href="#myCoursesSection"]{background:linear-gradient(135deg,#bd8a13,#e3bc57)!important;color:#fff!important}
body.sdV2 #studentHero a[href="courses-public.html"]{background:#fff!important;color:#17324a!important;border:1px solid #17324a!important}
body.sdV2 #studentHero:after{background:rgba(212,170,66,.10)!important}
@media(min-width:1000px){
 .sdSide{transform:none}.sdOverlay{display:none}body.sdV2>header{margin-left:292px}body.sdV2>main,body.sdV2>footer{margin-left:292px}
 .sdClose{display:none}body.sdV2>header>div{max-width:none!important}
}
@media(max-width:999px){
 body.sdV2>header .brand{display:block}
 body.sdV2>header .h-\[72px\]{gap:10px!important}
 body.sdV2>header .h-\[72px\]>a{min-width:0;gap:8px!important}
 body.sdV2>header .h-\[72px\]>a img{display:none!important}
 body.sdV2>header .h-\[72px\]>.flex.items-center.gap-2{margin-left:0!important}
 body.sdV2>header #logoutButton{padding:11px 17px!important;border-radius:13px!important}
 body.sdV2>header .brand>div:first-child{font-size:15px!important}
 body.sdV2>header .brand>div:last-child{font-size:8px!important;letter-spacing:.20em!important}
}
@media(max-width:560px){
 .sdSide{width:min(88vw,320px)}
 .sdSideInner{padding:18px 16px 24px}
 body.sdV2 #overview{padding-left:12px!important;padding-right:12px!important}
 .sdCompactWelcome{padding:20px 18px}.sdCompactWelcome h1{font-size:27px}.sdWelcomeMessage{font-size:15px}
 body.sdV2 #studentHero{padding:23px 19px!important;border-radius:22px!important}
 .sdStudentCeoMessage h2{font-size:22px}.sdCeoBody{font-size:16px;line-height:1.72}
}
`;

const groups=[
 {label:'MAIN',items:[
  ['dashboard','#overview','⌂','My Dashboard'],
  ['courses','#myCoursesSection','▣','My Courses'],
  ['progress','#myCoursesSection','▥','My Progress'],
  ['assessments','#myCoursesSection','✓','Assessments']
 ]},
 {label:'LEARNING',items:[
  ['materials','#studentStudyMaterialsSection','▤','Study Materials'],
  ['resources','digital-library.html','◇','Digital Library'],
  ['results','student-results.html','▧','My Results'],
  ['certificates','student-certificates.html','♕','My Certificates'],
  ['calendar','student-calendar.html','◷','My Calendar']
 ]},
 {label:'COMMUNICATION & SUPPORT',items:[
  ['communication','#announcementsSection','◉','Communication'],
  ['faq','#studentFaqSection','?','FAQs'],
  ['academic','#studentAcademicSupportSection','⌁','Academic Support'],
  ['support','#studentSupportSection','▣','Support System']
 ]},
 {label:'ACCOUNT',items:[
  ['profile','profile.html','♙','My Profile'],
  ['security','profile.html','◇','Security / Password']
 ]}
];

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const initials=name=>String(name||'Student').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'S';
function style(){if(document.getElementById('studentDashboardV2Style'))return;const s=document.createElement('style');s.id='studentDashboardV2Style';s.textContent=CSS;document.head.appendChild(s)}
function overallProgress(){
 try{
  const approved=(typeof enrollments!=='undefined'?enrollments:[]).filter(e=>typeof isApproved==='function'&&isApproved(e));
  if(!approved.length)return 0;
  const vals=approved.map(e=>Number((typeof courseProgress!=='undefined'&&courseProgress[String(e.course_id)]?.percent)||0));
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
 }catch{return 0}
}
function learnerId(){
 try{
  if(typeof studentRecord!=='undefined'&&studentRecord?.learner_number)return studentRecord.learner_number;
  if(typeof studentRecord!=='undefined'&&studentRecord?.student_number)return studentRecord.student_number;
  if(typeof studentRecord!=='undefined'&&studentRecord?.id)return 'ID '+String(studentRecord.id).slice(0,8).toUpperCase();
 }catch{}
 return 'Pending';
}
function activeCount(){
 try{return (typeof enrollments!=='undefined'?enrollments:[]).filter(e=>typeof isApproved==='function'&&isApproved(e)).length}catch{return 0}
}
function memberSince(){
 try{
  const d=studentRecord?.created_at||profile?.created_at||currentUser?.created_at;
  return d?new Intl.DateTimeFormat('en-ZA',{month:'short',year:'numeric'}).format(new Date(d)):'—';
 }catch{return '—'}
}
function name(){
 try{return typeof displayName==='function'?displayName():(studentRecord?.full_name||profile?.full_name||'Student')}catch{return 'Student'}
}
function statusText(){
 try{
  const all=(typeof enrollments!=='undefined'?enrollments:[]);
  if(all.some(e=>typeof isApproved==='function'&&isApproved(e)))return 'ACTIVE';
  if(all.length)return 'UNDER REVIEW';
 }catch{}
 return 'ACTIVE';
}
function navHtml(){
 return groups.map(g=>`<div class="sdNavGroup"><div class="sdNavLabel">${g.label}</div><div class="sdNav">${g.items.map(([key,href,icon,label])=>`<a data-sd-key="${key}" href="${href}"><span class="sdNavIcon">${icon}</span><span>${label}</span></a>`).join('')}</div></div>`).join('');
}
function open(){document.getElementById('sdSide')?.classList.add('open');document.getElementById('sdOverlay')?.classList.add('open');document.body.style.overflow=innerWidth<1000?'hidden':''}
function close(){document.getElementById('sdSide')?.classList.remove('open');document.getElementById('sdOverlay')?.classList.remove('open');document.body.style.overflow=''}
function updateIdentity(){
 const nm=name(),pct=overallProgress(),st=statusText();
 const set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};
 set('sdName',nm);set('sdLearner',learnerId());set('sdStatus',st);set('sdPct',pct+'%');
 const av=document.getElementById('sdAvatar');if(av)av.textContent=initials(nm);
 set('welcomeName','Welcome back, '+nm);
 const cli=document.getElementById('compactLearnerId');if(cli)cli.textContent=learnerId();
 const cms=document.getElementById('compactMemberSince');if(cms)cms.textContent=memberSince();
 const cs=document.getElementById('compactStatus');if(cs)cs.textContent=st;
 const bar=document.getElementById('sdProgress');if(bar)bar.style.width=pct+'%';
}
function prepareDashboardViews(){
 const dc=document.getElementById('dashboardContent');if(!dc)return;
 const hero=dc.querySelector('.hero:first-child');if(hero)hero.id='studentHero';
 const stats=document.getElementById('enrolledCount')?.closest('section');if(stats)stats.id='dashboardStats';
 const courses=document.getElementById('myCoursesSection');
 if(courses?.parentElement){
   courses.parentElement.id='coursesAndQuickAccess';
   const quick=courses.parentElement.querySelector(':scope > aside');if(quick)quick.id='studentQuickAccess';
 }
 const journey=document.getElementById('journeyCards')?.closest('section');if(journey)journey.id='applicationJourney';
 const recent=document.getElementById('recentActivities')?.closest('section');if(recent)recent.id='recentActivity';
 const info=document.getElementById('profileCardButton')?.closest('section.grid');if(info)info.id='studentInfoAndAcademy';
 if(!document.getElementById('compactWelcome')){
  const w=document.createElement('section');w.id='compactWelcome';w.className='sdCompactWelcome sdDashOnly';
  w.innerHTML='<p class="sdWelcomeKicker">Student Dashboard</p><h1 id="welcomeName">Welcome back</h1><p class="sdWelcomeMessage">We are pleased to welcome you to your learning space. Continue your academic journey with focus, confidence and purpose.</p>';
  dc.prepend(w);
 }
}
function resetDedicatedViewStyles(){
 const dc=document.getElementById('dashboardContent');
 if(dc)[...dc.children].forEach(x=>x.style.removeProperty('display'));
 ['studentAssessmentsCentre','studentStudyMaterialsSection'].forEach(id=>{
  const section=document.getElementById(id);if(!section)return;
  section.hidden=true;section.style.removeProperty('display');
 });
}
function dashboardView(view){
 prepareDashboardViews();
 resetDedicatedViewStyles();
 document.body.dataset.sdView=view;
 const welcome=document.getElementById('welcomeName');if(welcome)welcome.textContent='Welcome back, '+name();
 const cli=document.getElementById('compactLearnerId');if(cli)cli.textContent=learnerId();
 const cms=document.getElementById('compactMemberSince');if(cms)cms.textContent=memberSince();
 const cs=document.getElementById('compactStatus');if(cs)cs.textContent=statusText();
 document.querySelectorAll('#sdSide [data-sd-key]').forEach(x=>x.classList.toggle('active',x.dataset.sdKey===view));
 close();window.scrollTo({top:0,behavior:'smooth'});
}
function tightenDashboardSummary(){
 const recent=document.getElementById('recentActivities');
 if(recent && !recent.dataset.summaryPrepared){
   recent.dataset.summaryPrepared='1';
   const apply=()=>{
     const items=[...recent.children];
     items.forEach((el,i)=>{el.style.display=i<3?'':'none'});
     let wrap=document.getElementById('sdRecentMore');
     if(items.length>3 && !wrap){
       wrap=document.createElement('div');wrap.id='sdRecentMore';wrap.className='sdRecentMore';
       const b=document.createElement('button');b.type='button';b.textContent='View More Activity';
       let expanded=false;b.onclick=()=>{expanded=!expanded;items.forEach((el,i)=>el.style.display=(expanded||i<3)?'':'none');b.textContent=expanded?'Show Less':'View More Activity'};
       wrap.appendChild(b);recent.parentElement.appendChild(wrap);
     }
   };
   apply();new MutationObserver(apply).observe(recent,{childList:true});
 }
 const action=document.getElementById('trackLatestButton');
 if(action){
   const approved=activeCount()>0;
   action.textContent=approved?'Continue Learning':'Track Status';
   action.onclick=approved?()=>{
     const e=(typeof enrollments!=='undefined'?enrollments:[]).find(x=>typeof isApproved==='function'&&isApproved(x));
     if(e?.course_id)location.href='course-study.html?id='+encodeURIComponent(e.course_id);
   }:null;
 }
}
function install(){
 style();document.body.classList.add('sdV2');
 if(!document.getElementById('sdSide')){
  document.body.insertAdjacentHTML('afterbegin',`<div id="sdOverlay" class="sdOverlay"></div><aside id="sdSide" class="sdSide" aria-label="Student portal navigation"><div class="sdSideInner"><div class="sdBrand"><img src="logo.png" alt="Funda Online Academy"><div><b>FUNDA ONLINE<br>ACADEMY</b><span>STUDENT PORTAL</span></div><button id="sdClose" class="sdClose" aria-label="Close navigation">×</button></div><div class="sdIdentity"><div class="sdPerson"><div id="sdAvatar" class="sdAvatar">S</div><div><b id="sdName">Student</b><small>Learner: <span id="sdLearner">Pending</span></small><span id="sdStatus" class="sdStatus">ACTIVE</span></div></div><div class="sdProgressMeta"><span>Overall Progress</span><b id="sdPct">0%</b></div><div class="sdTrack"><i id="sdProgress"></i></div></div><nav class="sdNavWrap">${navHtml()}<div class="sdNavGroup"><div class="sdNav"><button id="sdLogout" class="sdLogout"><span class="sdNavIcon">↪</span><span>Log Out</span></button></div></div></nav><div class="sdMotto">Learn&nbsp;&nbsp;•&nbsp;&nbsp;Grow&nbsp;&nbsp;•&nbsp;&nbsp;Achieve<small>FUNDA ONLINE ACADEMY</small></div></div></aside>`);
 }
 const header=document.querySelector('body>header');
 if(header&&!document.getElementById('sdMenu')){
  const controls=header.querySelector('.flex.items-center.gap-2');
  controls?.insertAdjacentHTML('afterbegin','<button id="sdMenu" class="sdTopMenu" aria-label="Open student navigation">☰</button>');
  const row=header.querySelector('.h-\\[72px\\]');
  const brandLink=row?.querySelector(':scope > a');
  const menu=document.getElementById('sdMenu');
  if(row&&brandLink&&menu) row.insertBefore(menu,brandLink);
 }
 const headerRow=document.querySelector('body>header .h-\\[72px\\]');
 const headerControls=headerRow?.querySelector('.flex.items-center.gap-2');
 if(headerControls) headerControls.style.marginLeft='auto';
 document.getElementById('sdMenu')?.addEventListener('click',open);
 document.getElementById('sdClose')?.addEventListener('click',close);
 document.getElementById('sdOverlay')?.addEventListener('click',close);
 document.getElementById('sdLogout')?.addEventListener('click',()=>document.getElementById('logoutButton')?.click());
 document.querySelectorAll('#sdSide a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();const key=a.dataset.sdKey;
  if(['dashboard','courses','communication','faq','academic','support'].includes(key))return dashboardView(key);
  close();const target=document.querySelector(a.getAttribute('href'));
  if(target){target.classList.add('sdSectionMark');target.scrollIntoView({behavior:'smooth',block:'start'})}
  document.querySelectorAll('#sdSide a').forEach(x=>x.classList.remove('active'));a.classList.add('active');
 }));
 document.querySelectorAll('#sdSide [data-funda-results-link],#sdSide #fundaCertificatesQuickLink').forEach(x=>x.remove());
 prepareDashboardViews();dashboardView('dashboard');
 updateIdentity();tightenDashboardSummary();
 let tries=0;const t=setInterval(()=>{tries++;updateIdentity();tightenDashboardSummary();if(tries>30)clearInterval(t)},500);
 window.addEventListener('resize',()=>{if(innerWidth>=1000)close()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
