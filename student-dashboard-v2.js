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
.sdViewHidden{display:none!important}
.sdViewTitle{display:none;margin:0 0 16px;padding:18px 20px;border-radius:18px;background:#fffdf7;border:1px solid #ead8a6;color:#17324a;box-shadow:0 5px 16px rgba(20,49,77,.05)}
.sdViewTitle strong{display:block;font:900 20px Montserrat,sans-serif}.sdViewTitle span{display:block;margin-top:5px;font-size:11px;color:#637180}
body.sdV2[data-student-view="dashboard"] #myCoursesSection,
body.sdV2[data-student-view="dashboard"] #announcementsSection,
body.sdV2[data-student-view="dashboard"] #librarySection{display:none!important}
body.sdV2[data-student-view="dashboard"] #studentFullDetailsGrid{display:none!important}
body.sdV2[data-student-view="dashboard"] #applicationJourneySection{display:none!important}
body.sdV2[data-student-view="dashboard"] #dashboardQuickAccess{display:none!important}
body.sdV2[data-student-view="courses"] #studentDashboardHero,
body.sdV2[data-student-view="courses"] #statusBanner,
body.sdV2[data-student-view="courses"] #studentStatsSection,
body.sdV2[data-student-view="courses"] #applicationJourneySection,
body.sdV2[data-student-view="courses"] #recentActivitySection,
body.sdV2[data-student-view="courses"] #announcementsSection,
body.sdV2[data-student-view="courses"] #librarySection,
body.sdV2[data-student-view="courses"] #studentFullDetailsGrid{display:none!important}
body.sdV2[data-student-view="announcements"] #studentDashboardHero,
body.sdV2[data-student-view="announcements"] #statusBanner,
body.sdV2[data-student-view="announcements"] #studentStatsSection,
body.sdV2[data-student-view="announcements"] #studentCoursesWrap,
body.sdV2[data-student-view="announcements"] #applicationJourneySection,
body.sdV2[data-student-view="announcements"] #recentActivitySection,
body.sdV2[data-student-view="announcements"] #librarySection,
body.sdV2[data-student-view="announcements"] #studentFullDetailsGrid{display:none!important}
.sdMotto{margin-top:22px;padding:16px 10px;border-radius:15px;background:linear-gradient(135deg,#fff9e8,#f5dda0);border:1px solid #ead39b;color:#b58216;text-align:center;font:800 12px Montserrat,sans-serif}.sdMotto small{display:block;margin-top:6px;color:#7c8793;font:800 7px Inter,sans-serif;letter-spacing:.24em}body.sdV2>header{background:#06152f!important}
body.sdV2>header nav,body.sdV2>header .mobile-scroll{display:none!important}
.sdHeroMetrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:20px;position:relative;z-index:2}
.sdHeroMetric{padding:12px 13px;border:1px solid #e2e7ec;border-radius:14px;background:#fff;box-shadow:0 3px 10px rgba(17,44,73,.04)}
.sdHeroMetric span{display:block;font-size:7px;letter-spacing:.1em;color:#687684;font-weight:900}.sdHeroMetric b{display:block;margin-top:4px;color:#17324a;font-size:11px}
body.sdV2 #dashboardContent .hero:first-child{background:linear-gradient(135deg,#fffdf7 0%,#fff8e8 56%,#f7ecd0 100%)!important;border:1px solid #ead8a6!important;box-shadow:0 10px 28px rgba(122,93,26,.08)!important}
body.sdV2 #dashboardContent h1,body.sdV2 #dashboardContent h2,body.sdV2 #dashboardContent h3{color:#17324a}
body.sdV2 #dashboardContent .hero h1,body.sdV2 #dashboardContent .hero h2{color:#17324a} body.sdV2 #dashboardContent .hero:first-child p{color:#273849!important} body.sdV2 #dashboardContent .hero:first-child .text-[#e4c777]{color:#b58216!important}
body.sdV2 .card{box-shadow:0 4px 14px rgba(14,42,72,.06)!important;border-color:#dbe3ea!important}
body.sdV2 .text-slate-500,body.sdV2 .text-slate-600{color:#3d4d5c!important}
body.sdV2 #overview{max-width:1480px!important}
.sdSectionMark{scroll-margin-top:95px}
body.sdV2>header .h-\[72px\]{justify-content:flex-start!important}
body.sdV2>header .h-\[72px\]>a{order:2}
body.sdV2>header .h-\[72px\]>.flex.items-center.gap-2{order:1;margin-right:2px}
body.sdV2>header #logoutButton{order:3;margin-left:auto;background:linear-gradient(135deg,#e2b64a,#f1d67d)!important;color:#17324a!important;border:0!important}
body.sdV2>header #profileButton{display:none!important}
body.sdV2 #dashboardContent .hero:first-child a[href="#myCoursesSection"]{background:linear-gradient(135deg,#bd8a13,#e3bc57)!important;color:#fff!important}
body.sdV2 #dashboardContent .hero:first-child a[href="courses-public.html"]{background:#fff!important;color:#17324a!important;border:1px solid #17324a!important}
body.sdV2 #dashboardContent .hero:first-child:after{background:rgba(212,170,66,.10)!important}
@media(min-width:1000px){
 .sdSide{transform:none}.sdOverlay{display:none}body.sdV2>header{margin-left:292px}body.sdV2>main,body.sdV2>footer{margin-left:292px}
 .sdClose{display:none}body.sdV2>header>div{max-width:none!important}
}
@media(max-width:999px){
 .sdHeroMetrics{grid-template-columns:1fr 1fr}
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
 .sdHeroMetrics{grid-template-columns:1fr 1fr}
 body.sdV2 #overview{padding-left:12px!important;padding-right:12px!important}
 body.sdV2 #dashboardContent .hero:first-child{padding:22px 18px!important;border-radius:22px!important}
 body.sdV2 #welcomeName{font-size:28px!important;line-height:1.12!important}
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
  ['materials','digital-library.html','▤','Study Materials'],
  ['resources','digital-library.html','◇','Course Resources'],
  ['results','student-results.html','▧','My Results'],
  ['certificates','student-certificates.html','♕','My Certificates'],
  ['calendar','student-calendar.html','◷','My Calendar']
 ]},
 {label:'SUPPORT',items:[
  ['announcements','#announcementsSection','●','Announcements'],
  ['academic','#studentCommunicationHelpCentre','?','Academic Support'],
  ['technical','#studentSupportSection','⌁','Technical Support']
 ]},
 {label:'ACCOUNT',items:[
  ['profile','profile.html','♙','My Profile'],
  ['notifications','#announcementsSection','◉','Notifications'],
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
 const bar=document.getElementById('sdProgress');if(bar)bar.style.width=pct+'%';
 const hero=document.getElementById('sdHeroMetrics');
 if(hero)hero.innerHTML=`
  <div class="sdHeroMetric"><span>LEARNER ID</span><b>${esc(learnerId())}</b></div>
  <div class="sdHeroMetric"><span>ENROLMENT STATUS</span><b>${esc(st)}</b></div>
  <div class="sdHeroMetric"><span>MEMBER SINCE</span><b>${esc(memberSince())}</b></div>
  <div class="sdHeroMetric"><span>ACTIVE ENROLMENTS</span><b>${activeCount()} COURSE${activeCount()===1?'':'S'}</b></div>`;
}
function installHero(){
 const hero=document.querySelector('#dashboardContent .hero:first-child');
 if(!hero||document.getElementById('sdHeroMetrics'))return;
 const m=document.createElement('div');m.id='sdHeroMetrics';m.className='sdHeroMetrics';hero.querySelector('.relative')?.appendChild(m);
}
function tagDashboardSections(){
 const dc=document.getElementById('dashboardContent'); if(!dc)return;
 const hero=dc.querySelector('.hero:first-child'); if(hero)hero.id='studentDashboardHero';
 const stats=document.getElementById('enrolledCount')?.closest('section'); if(stats)stats.id='studentStatsSection';
 const courses=document.getElementById('myCoursesSection');
 if(courses){
   const wrap=courses.parentElement; if(wrap)wrap.id='studentCoursesWrap';
   const quick=wrap?.querySelector('aside'); if(quick)quick.id='dashboardQuickAccess';
 }
 const journey=document.getElementById('journeyCards')?.closest('section'); if(journey)journey.id='applicationJourneySection';
 const recent=document.getElementById('recentActivities')?.closest('section'); if(recent)recent.id='recentActivitySection';
 const profileBtn=document.getElementById('profileCardButton');
 if(profileBtn){
   const grid=profileBtn.closest('section.grid'); if(grid)grid.id='studentFullDetailsGrid';
 }
 if(!document.getElementById('sdViewTitle')){
   const title=document.createElement('div');title.id='sdViewTitle';title.className='sdViewTitle';
   dc.prepend(title);
 }
}
function setStudentView(view){
 tagDashboardSections();
 const allowed=['dashboard','courses','announcements']; if(!allowed.includes(view))view='dashboard';
 document.body.dataset.studentView=view;
 const title=document.getElementById('sdViewTitle');
 if(title){
   const map={
     dashboard:['My Dashboard','A clear summary of your learning, applications and recent activity. Use the side tabs for full details.'],
     courses:['My Courses','View your enrolled and pending courses, access learning, and check course-level progress.'],
     announcements:['Announcements','Read official Academy updates and notices relevant to students.']
   };
   title.innerHTML='<strong>'+map[view][0]+'</strong><span>'+map[view][1]+'</span>';
   title.style.display=view==='dashboard'?'none':'block';
 }
 document.querySelectorAll('#sdSide a').forEach(x=>x.classList.toggle('active',x.dataset.sdKey===view));
 close();
 window.scrollTo({top:0,behavior:'smooth'});
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
  e.preventDefault();
  const key=a.dataset.sdKey||'dashboard';
  if(key==='dashboard') return setStudentView('dashboard');
  if(key==='courses') return setStudentView('courses');
  if(key==='announcements') return setStudentView('announcements');
  const target=document.querySelector(a.getAttribute('href'));
  close();
  if(target){target.classList.add('sdSectionMark');target.scrollIntoView({behavior:'smooth',block:'start'})}
  document.querySelectorAll('#sdSide a').forEach(x=>x.classList.remove('active'));a.classList.add('active');
 }));
 document.querySelectorAll('#sdSide [data-funda-results-link],#sdSide #fundaCertificatesQuickLink').forEach(x=>x.remove());
 tagDashboardSections();setStudentView('dashboard');
 installHero();updateIdentity();
 let tries=0;const t=setInterval(()=>{tries++;installHero();updateIdentity();if(tries>30)clearInterval(t)},500);
 window.addEventListener('resize',()=>{if(innerWidth>=1000)close()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();