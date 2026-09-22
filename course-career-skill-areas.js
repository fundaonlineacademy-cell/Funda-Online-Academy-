(()=>{
'use strict';
const path=location.pathname.toLowerCase();
if(!/(courses-public|course-view)\.html$/i.test(path))return;

// The original Browse Courses page still contains a legacy inline catalogue loader.
// Suppress that DOMContentLoaded handler before it runs so the Career & Skills
// catalogue below is the single authoritative public renderer.
if(/courses-public\.html$/i.test(path)&&typeof window.loadCourses==='function'){
  document.removeEventListener('DOMContentLoaded',window.loadCourses);
}
if(window.__fundaCareerSkillAreas)return;
window.__fundaCareerSkillAreas=true;

let db=null,catalog=[];
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>{const n=Number(v);return v===null||v===undefined||v===''?'Contact us':Number.isFinite(n)?'R'+n.toLocaleString('en-ZA',{maximumFractionDigits:2}):String(v)};
const titleOf=c=>c?.title||'Untitled Course';
const descOf=c=>c?.description||'Explore this course and discover what you can learn.';
const durationOf=c=>c?.duration||'Self-paced';
const areaOf=c=>c?.career_skill_area_name||'Other Career & Skills Area';
const typeOf=c=>{const p=titleOf(c).split('—');return p.length>1&&/short course/i.test(p.at(-1))?p.at(-1).trim():'Professional Short Course'};
function client(){if(db)return db;if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)return null;return db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}})}
function style(){if($('fcsaStyle'))return;const s=document.createElement('style');s.id='fcsaStyle';s.textContent=`.fcsaIntro{margin-top:18px;padding:17px 19px;border:1px solid #d8e3ef;border-radius:16px;background:linear-gradient(135deg,#fff,#f5f9ff,#fff8e8)}.fcsaIntro b{display:block;color:#071d49;font-size:15px;line-height:1.4}.fcsaIntro p{margin:6px 0 0;color:#52647a;font-size:14px;line-height:1.7;max-width:900px;text-align:justify;text-justify:inter-word}.fcsaAreaBadge{background:#f4e8bd!important;color:#65480a!important;border:1px solid #dfc67e!important}.fcsaTypeBadge{background:#eaf3ff!important;color:#071d49!important;border:1px solid #cfe0f5!important}.fcsaMeta{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}.fcsaMeta span{font-size:10px;font-weight:800;padding:5px 8px;border-radius:999px;background:#fff7df;color:#6e5315;border:1px solid #e6d196}.fcsaOverview{margin:14px 0 0;padding:14px 16px;border-radius:15px;background:#f7fbff;border:1px solid #d7e4f2;color:#42556d}.fcsaOverview strong{display:block;color:#071d49;font-size:12px}.fcsaOverview span{display:block;margin-top:4px;font-size:11px;line-height:1.55}.fcsaOverview a{color:#1f5da7;font-weight:800;text-decoration:none}@media(max-width:700px){.fcsaIntro{padding:15px 16px}.fcsaIntro b{font-size:14px}.fcsaIntro p{font-size:14px;line-height:1.65;text-align:left}.fcsaOverview{padding:12px 13px}}`;document.head.appendChild(s)}
async function getCatalog(force=false){if(catalog.length&&!force)return catalog;const c=client();if(!c)throw new Error('The Academy database connection is not configured.');const r=await c.from('public_course_career_catalog').select('*').order('career_skill_area_order',{ascending:true}).order('title',{ascending:true});if(r.error)throw r.error;catalog=r.data||[];return catalog}
function areasFrom(rows){const map=new Map();rows.forEach(c=>{const name=areaOf(c),slug=c.career_skill_area_slug||'',order=Number(c.career_skill_area_order||999);if(!map.has(name))map.set(name,{name,slug,order,count:0});map.get(name).count++});return [...map.values()].sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name))}
function renderPublicCards(rows){const grid=$('courseGrid'),empty=$('noSearchResults');if(!grid)return;if(!rows.length){grid.innerHTML='';grid.classList.add('hidden');empty?.classList.remove('hidden');return}empty?.classList.add('hidden');grid.classList.remove('hidden');grid.setAttribute('aria-live','polite');grid.innerHTML='';rows.forEach(c=>{const title=titleOf(c),image=c.image_url||'',card=document.createElement('article');card.className='course-card rounded-2xl overflow-hidden flex flex-col';card.dataset.pcv='1';card.dataset.courseId=c.id;card.dataset.careerArea=c.career_skill_area_slug||'';card.innerHTML=`${image?`<div class="course-image-wrap"><img src="${esc(image)}" alt="${esc(title)}" class="course-image" loading="lazy"></div>`:`<div class="course-image-wrap flex items-center justify-center text-5xl" aria-hidden="true">🎓</div>`}<div class="p-4 flex flex-col flex-1"><div class="flex justify-between gap-2 items-start"><div class="flex flex-wrap gap-1.5"><span class="fcsaTypeBadge px-2.5 py-1 rounded-full text-[10px] font-bold">${esc(typeOf(c))}</span><span class="fcsaAreaBadge px-2.5 py-1 rounded-full text-[10px] font-bold">${esc(areaOf(c))}</span></div><span class="text-[11px] text-slate-400 shrink-0">Online</span></div><h3 class="mt-3 text-base font-bold text-[#071D49] line-clamp-2">${esc(title)}</h3><p class="mt-2 text-[13px] text-slate-500 line-clamp-2">${esc(descOf(c))}</p><div class="mt-3 text-[11px] text-slate-500">⏱ ${esc(durationOf(c))} • Flexible online study</div><div class="fcsaMeta">${Number(c.modules_count)>0?`<span>${Number(c.modules_count)} modules</span>`:''}${Number(c.lessons_count)>0?`<span>${Number(c.lessons_count)} lessons</span>`:''}</div><div class="mt-auto pt-4 flex items-end justify-between gap-3"><div><div class="text-[10px] text-slate-400">Course Fee</div><div class="text-lg font-extrabold text-[#071D49]">${money(c.price)}</div></div><a href="course-view.html?id=${encodeURIComponent(c.id)}" class="px-3.5 py-2.5 rounded-lg bg-[#071D49] text-white text-xs font-bold" aria-label="View ${esc(title)}">View Course</a></div></div>`;grid.appendChild(card)})}
async function publicPage(){
  style();
  for(let i=0;i<40;i++){if($('courseGrid')&&$('categoryChips')&&$('categoryFilters'))break;await new Promise(r=>setTimeout(r,100))}
  const grid=$('courseGrid'),chips=$('categoryChips'),filters=$('categoryFilters'),search=$('courseSearch'),sort=$('sortCourses'),loading=$('loadingState'),errorBox=$('connectionError'),errorMessage=$('connectionErrorMessage');
  if(!grid||!chips||!filters||!search||!sort)return;
  search.setAttribute('aria-label','Search courses, skills or topics');
  sort.setAttribute('aria-label','Sort courses');
  const first=sort.querySelector('option[value="popular"],option[value="catalogue"]');
  if(first){first.value='catalogue';first.textContent='Career & Skills Order'}
  if(sort.value==='popular')sort.value='catalogue';
  loading?.setAttribute('aria-live','polite');
  loading?.setAttribute('aria-busy','true');
  let rows=[];
  const setError=e=>{loading?.classList.add('hidden');loading?.setAttribute('aria-busy','false');errorBox?.classList.remove('hidden');if(errorMessage)errorMessage.textContent=e?.message||'Unable to load the course catalogue.'};
  try{rows=await getCatalog(true);errorBox?.classList.add('hidden')}catch(e){console.warn('Career & Skills Areas:',e);setError(e);return}
  const areas=areasFrom(rows);let active='All';const requested=new URLSearchParams(location.search).get('area');if(requested){const a=areas.find(x=>x.slug===requested);if(a)active=a.name}
  const courseHead=[...document.querySelectorAll('#courses p')].find(p=>/search, filter and compare/i.test(p.textContent||''));if(courseHead)courseHead.textContent='Explore by Career & Skills Area, search by topic and compare courses before you enrol.';
  const sideLabel=[...document.querySelectorAll('aside p')].find(p=>/^categories$/i.test((p.textContent||'').trim()));if(sideLabel)sideLabel.textContent='Career & Skills Areas';
  if(!$('fcsaIntro')){const intro=document.createElement('div');intro.id='fcsaIntro';intro.className='fcsaIntro';intro.innerHTML='<b>Explore by Career & Skills Area</b><p>Our short courses are organised into Career & Skills Areas to help you identify learning that aligns with your interests and goals. Select an area below or browse the full catalogue.</p>';chips.insertAdjacentElement('beforebegin',intro)}
  function controls(){chips.innerHTML=[{name:'All',count:rows.length},...areas].map(a=>`<button type="button" data-fcsa="${esc(a.name)}" aria-pressed="${a.name===active?'true':'false'}" class="chip ${a.name===active?'active':''} px-3.5 py-2 rounded-full border bg-white text-[#071D49] text-xs font-semibold">${a.name==='All'?'All Courses':esc(a.name)}</button>`).join('');filters.innerHTML=areas.map(a=>`<label class="flex items-start gap-2 text-xs leading-5"><input type="radio" name="fcsaArea" value="${esc(a.name)}" ${a.name===active?'checked':''} class="mt-1"><span>${esc(a.name)}</span></label>`).join('');chips.querySelectorAll('[data-fcsa]').forEach(b=>b.onclick=()=>{active=b.dataset.fcsa;controls();apply()});filters.querySelectorAll('input[name="fcsaArea"]').forEach(r=>r.onchange=()=>{if(r.checked){active=r.value;controls();apply()}})}
  function apply(){const q=(search.value||'').trim().toLowerCase();let list=rows.filter(c=>(active==='All'||areaOf(c)===active)&&[titleOf(c),descOf(c),areaOf(c),c.career_application||'',c.practical_projects||'',...(Array.isArray(c.learning_outcomes)?c.learning_outcomes:[])].join(' ').toLowerCase().includes(q));if(sort.value==='az')list.sort((a,b)=>titleOf(a).localeCompare(titleOf(b)));else if(sort.value==='price-low')list.sort((a,b)=>(Number(a.price)||0)-(Number(b.price)||0));else if(sort.value==='price-high')list.sort((a,b)=>(Number(b.price)||0)-(Number(a.price)||0));else list.sort((a,b)=>(Number(a.career_skill_area_order)||999)-(Number(b.career_skill_area_order)||999)||titleOf(a).localeCompare(titleOf(b)));if($('courseResultCount'))$('courseResultCount').textContent=list.length;if($('heroCourseCount'))$('heroCourseCount').textContent=rows.length;loading?.classList.add('hidden');loading?.setAttribute('aria-busy','false');$('emptyState')?.classList.toggle('hidden',rows.length>0);renderPublicCards(list)}
  controls();search.oninput=apply;sort.onchange=apply;const clear=$('clearFilters');if(clear){clear.type='button';clear.onclick=()=>{active='All';search.value='';sort.value='catalogue';controls();apply()}}
  const retry=$('retryButton');if(retry){retry.type='button';retry.onclick=async()=>{loading?.classList.remove('hidden');loading?.setAttribute('aria-busy','true');errorBox?.classList.add('hidden');try{rows=await getCatalog(true);active='All';controls();apply()}catch(e){console.warn(e);setError(e)}}}
  apply();
}
async function courseView(){style();const id=new URLSearchParams(location.search).get('id');if(!id)return;let row;try{const c=client();if(!c)return;const r=await c.from('public_course_career_catalog').select('id,career_skill_area_name,career_skill_area_slug,career_skill_area_description').eq('id',id).maybeSingle();if(r.error||!r.data)return;row=r.data}catch(e){console.warn('Course Career & Skills Area:',e);return}for(let i=0;i<35;i++){if(document.querySelector('.chips')&&$('courseDescription'))break;await new Promise(r=>setTimeout(r,180))}const chips=document.querySelector('.chips'),desc=$('courseDescription');if(!chips||!desc||$('careerSkillAreaBadge'))return;const a=document.createElement('a');a.id='careerSkillAreaBadge';a.className='chip';a.href=`courses-public.html?area=${encodeURIComponent(row.career_skill_area_slug||'')}#courses`;a.textContent=`Career & Skills Area: ${row.career_skill_area_name}`;a.style.cssText='background:#eaf3ff;color:#071d49;border:1px solid #cfe0f5;text-decoration:none';chips.appendChild(a);const box=document.createElement('div');box.id='careerSkillAreaOverview';box.className='fcsaOverview';box.innerHTML=`<strong>Career & Skills Area: ${esc(row.career_skill_area_name)}</strong><span>${esc(row.career_skill_area_description||'This course forms part of this Funda Online Academy Career & Skills Area.')} <a href="courses-public.html?area=${encodeURIComponent(row.career_skill_area_slug||'')}#courses">View other courses in this area →</a></span>`;const classBox=$('pcvClass');(classBox||desc).insertAdjacentElement('afterend',box)}
function start(){if(/courses-public\.html$/i.test(path))publicPage();else setTimeout(courseView,600)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

// Owner-approved 2026-09-22 public Courses visual upgrade.
// This layer changes only the presentation above the live catalogue.
(()=>{
'use strict';
if(!/courses-public\.html$/i.test(location.pathname)||window.__fundaCoursesHero20260922)return;
window.__fundaCoursesHero20260922=true;
const HERO_IMAGE='https://images.pexels.com/photos/12903173/pexels-photo-12903173.jpeg?auto=compress&cs=tinysrgb&w=1600';
function addStyle(){
  if(document.getElementById('fundaCoursesHeroV2Style'))return;
  const s=document.createElement('style');s.id='fundaCoursesHeroV2Style';s.textContent=`
  .hero.fundaHeroV2{background:#fff;border-bottom:0!important;overflow:hidden}
  .fundaHeroV2 .fhv2Hero{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:minmax(0,.95fr) minmax(460px,1.05fr);min-height:510px;background:linear-gradient(90deg,#fff 0%,#fff 44%,#f6f0e7 44%,#f6f0e7 100%)}
  .fundaHeroV2 .csmpHeroPanel{display:none!important}
  .fhv2Copy{padding:52px 34px 45px 18px;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:2}
  .fhv2Badge,.fhv2SectionBadge{display:inline-flex;width:max-content;align-items:center;gap:8px;padding:8px 14px;border:1px solid #e6d4a5;border-radius:999px;background:#fffaf0;color:#0b2f70;font-size:12px;font-weight:800;letter-spacing:.025em}
  .fhv2Title{margin:18px 0 0;color:#071d49;font-size:50px;line-height:1.03;letter-spacing:-.035em;font-weight:800;max-width:650px}
  .fhv2Title span{color:#2767c6}
  .fhv2Lead{margin:18px 0 0;color:#42556d;font-size:17px;line-height:1.72;max-width:650px}
  .fhv2Actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:24px}
  .fhv2Btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:11px 20px;border-radius:11px;text-decoration:none;font-size:15px;font-weight:800}
  .fhv2Btn.primary{background:#0b2f70;color:#fff;box-shadow:0 8px 22px rgba(7,29,73,.16)}
  .fhv2Btn.secondary{background:#fff;color:#071d49;border:1px solid #9fb0c7}
  .fhv2Mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:27px;max-width:650px}
  .fhv2MiniItem{display:grid;grid-template-columns:38px 1fr;gap:9px;align-items:center;padding:9px 10px;border-right:1px solid #d8e0ea}
  .fhv2MiniItem:last-child{border-right:0}
  .fhv2MiniIcon{width:35px;height:35px;display:grid;place-items:center;border-radius:50%;background:#fff1cb;color:#0b2f70;font-size:17px}
  .fhv2MiniItem strong{display:block;color:#0b2f70;font-size:13px;line-height:1.25}
  .fhv2MiniItem span{display:block;margin-top:1px;color:#667789;font-size:12px;line-height:1.25}
  .fhv2Image{position:relative;min-height:510px;overflow:hidden;background:#ece4da}
  .fhv2Image img{width:100%;height:100%;position:absolute;inset:0;object-fit:cover;object-position:center;display:block}
  .fhv2Image:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.12),transparent 30%,rgba(5,20,50,.06));pointer-events:none}
  .fhv2World{position:absolute;right:22px;top:28px;z-index:2;width:175px;padding:15px 16px;background:rgba(255,255,255,.88);backdrop-filter:blur(5px);border:1px solid rgba(255,255,255,.85);box-shadow:0 10px 26px rgba(7,29,73,.12);color:#071d49;font-size:13px;line-height:1.35;font-weight:900;letter-spacing:.09em;text-transform:uppercase}
  .fhv2World i{display:block;width:36px;height:3px;background:#c99a2e;margin-top:10px}
  .fhv2Grow{position:absolute;right:20px;bottom:22px;z-index:2;display:grid;gap:4px}
  .fhv2Grow span{display:block;background:rgba(255,255,255,.92);border:1px solid rgba(255,255,255,.9);padding:5px 13px;min-width:118px;text-align:center;color:#16283f;font-size:12px;font-weight:900;letter-spacing:.09em;box-shadow:0 5px 14px rgba(7,29,73,.10)}
  .fhv2Intro{background:#fff;padding:28px 0 42px;border-bottom:1px solid #e3eaf2}
  .fhv2IntroGrid{max-width:1280px;margin:0 auto;padding:0 18px;display:grid;grid-template-columns:minmax(0,1fr) 480px;gap:45px;align-items:start}
  .fhv2Intro h2{margin:15px 0 0;color:#071d49;font-size:43px;line-height:1.06;letter-spacing:-.03em;font-weight:800}
  .fhv2Intro h2 span{display:block;color:#2767c6}
  .fhv2Intro p{margin:16px 0 0;max-width:720px;color:#52647a;font-size:16px;line-height:1.72}
  .fhv2Stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:28px;max-width:760px}
  .fhv2Stat{padding:0 18px;border-left:1px solid #dbe3ec}.fhv2Stat:first-child{padding-left:0;border-left:0}
  .fhv2Stat strong{display:block;color:#0b2f70;font-size:19px;line-height:1.1}.fhv2Stat span{display:block;margin-top:4px;color:#718096;font-size:12px}
  .fhv2Clarity{border:1px solid #dbe3ec;border-radius:21px;background:#fff;padding:22px 23px;box-shadow:0 8px 26px rgba(27,60,100,.06)}
  .fhv2Clarity small{font-size:11px;font-weight:900;letter-spacing:.16em;color:#0b2f70}
  .fhv2Clarity h3{margin:5px 0 8px;color:#0b2f70;font-size:23px;line-height:1.24;font-weight:800}
  .fhv2Fact{display:grid;grid-template-columns:36px 1fr;gap:10px;padding:11px 0;border-top:1px solid #edf1f5}.fhv2Fact:first-of-type{border-top:0}
  .fhv2FactIcon{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#f4f8fd;border:1px solid #d7e4f3;color:#0b2f70;font-weight:900}
  .fhv2Fact strong{display:block;color:#0b2f70;font-size:14px}.fhv2Fact span{display:block;margin-top:2px;color:#667789;font-size:12px;line-height:1.45}
  .fhv2Note{margin-top:12px;padding:10px 12px;border-radius:11px;background:#eaf4ff;border:1px solid #cfe1f6;color:#0b2f70;font-size:12px;font-weight:800}
  @media(max-width:1023px){.fundaHeroV2 .fhv2Hero{grid-template-columns:1fr;min-height:0;background:#fff}.fhv2Copy{padding:38px 24px 30px}.fhv2Image{min-height:410px}.fhv2IntroGrid{grid-template-columns:1fr;gap:26px}.fhv2Clarity{max-width:none}.fhv2Title{font-size:43px}}
  @media(max-width:700px){.fhv2Copy{padding:30px 17px 24px}.fhv2Title{font-size:35px;line-height:1.06}.fhv2Lead{font-size:16px;line-height:1.62}.fhv2Actions{display:grid;grid-template-columns:1fr}.fhv2Mini{grid-template-columns:1fr;margin-top:21px}.fhv2MiniItem{border-right:0;border-top:1px solid #e5eaf0}.fhv2MiniItem:first-child{border-top:0}.fhv2Image{min-height:350px}.fhv2World{right:13px;top:14px;width:150px;font-size:11px}.fhv2Grow{right:12px;bottom:14px}.fhv2Grow span{min-width:102px;font-size:10px}.fhv2Intro{padding:25px 0 34px}.fhv2IntroGrid{padding:0 17px}.fhv2Intro h2{font-size:34px}.fhv2Intro p{font-size:15px;line-height:1.62}.fhv2Stats{grid-template-columns:1fr 1fr;gap:18px}.fhv2Stat,.fhv2Stat:first-child{padding:0;border:0}.fhv2Clarity{padding:19px}.fhv2Clarity h3{font-size:21px}}
  `;document.head.appendChild(s);
}
function upgrade(){
  const hero=document.querySelector('section.hero');const courses=document.getElementById('courses');
  if(!hero||!courses||hero.dataset.fundaHeroV2)return;
  hero.dataset.fundaHeroV2='1';hero.classList.add('fundaHeroV2');
  hero.innerHTML=`<div class="fhv2Hero"><div class="fhv2Copy"><div class="fhv2Badge">🎓 PRACTICAL • CAREER-FOCUSED • FLEXIBLE</div><h1 class="fhv2Title">Explore courses that open <span>new possibilities.</span></h1><p class="fhv2Lead">Build practical skills, learn flexibly and take meaningful steps toward your personal and professional development. Explore at your own pace, from wherever you are.</p><div class="fhv2Actions"><a class="fhv2Btn primary" href="#courses">Browse Courses&nbsp; →</a><a class="fhv2Btn secondary" href="create-account.html">Create Student Account</a></div><div class="fhv2Mini"><div class="fhv2MiniItem"><div class="fhv2MiniIcon">🎓</div><div><strong>100% Online</strong><span>Flexible learning</span></div></div><div class="fhv2MiniItem"><div class="fhv2MiniIcon">◷</div><div><strong>Study Your Way</strong><span>Anytime, anywhere</span></div></div><div class="fhv2MiniItem"><div class="fhv2MiniIcon">✦</div><div><strong>Build Forward</strong><span>Skills for your journey</span></div></div></div></div><div class="fhv2Image"><img src="${HERO_IMAGE}" alt="Online learner developing practical skills with a laptop"><div class="fhv2World">A BRIGHTER YOU<br>A BRIGHTER WORLD<i></i></div><div class="fhv2Grow"><span>LEARN</span><span>SKILL</span><span>GROW</span><span>SUCCEED</span></div></div></div>`;
  const intro=document.createElement('section');intro.id='fundaCoursesIntroV2';intro.className='fhv2Intro';intro.innerHTML=`<div class="fhv2IntroGrid"><div><div class="fhv2SectionBadge">🎓 LEARN • PRACTICE • PROGRESS • YOUR WAY</div><h2><span>Learn with purpose.</span>Grow with confidence.</h2><p>Discover practical, flexible online courses designed to help you build real skills and work toward your personal goals. Take time to explore, compare options and get the clarity you need before you enrol.</p><div class="fhv2Actions"><a class="fhv2Btn primary" href="#courses">Browse Courses</a><a class="fhv2Btn secondary" href="create-account.html">Create Student Account</a></div><div class="fhv2Stats"><div class="fhv2Stat"><strong>100%</strong><span>Online Learning</span></div><div class="fhv2Stat"><strong>24/7</strong><span>Platform Access</span></div><div class="fhv2Stat"><strong>Wide Range</strong><span>Of Courses</span></div><div class="fhv2Stat"><strong>Forward</strong><span>At your own pace</span></div></div></div><aside class="fhv2Clarity"><small>STUDY WITH CLARITY</small><h3>Know what to expect before you enrol.</h3><div class="fhv2Fact"><div class="fhv2FactIcon">✓</div><div><strong>100% Online Learning</strong><span>Study and access Academy services online without attending a physical campus.</span></div></div><div class="fhv2Fact"><div class="fhv2FactIcon">◷</div><div><strong>24/7 Platform Access</strong><span>Access the website and available learning services at any time.</span></div></div><div class="fhv2Fact"><div class="fhv2FactIcon">⌕</div><div><strong>Browse Before Registration</strong><span>Review course information, fees and study details before creating an account.</span></div></div><div class="fhv2Fact"><div class="fhv2FactIcon">▤</div><div><strong>Clear Course Information</strong><span>Course requirements and certification information are presented before enrolment.</span></div></div><div class="fhv2Note">🎓 Your goals matter. Build your next chapter with clarity.</div></aside></div>`;
  courses.insertAdjacentElement('beforebegin',intro);
}
function boot(){addStyle();setTimeout(upgrade,350)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
