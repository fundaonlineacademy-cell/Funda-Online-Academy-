// FUNDA ONLINE ACADEMY — CARPENTRY PREMIUM CONTENT RUNTIME
// Branch integration layer: loads premium Markdown lesson files from this repository.
(function(){
  const CARPENTRY_ID='60cfc5ea-6d3b-4dd1-abd6-cb68800930b5';
  const MANIFEST=[
    ['Carpentry Practice, Workshop Safety & Professional Standards',[
      'The Carpentry Profession & Workplace Environment','Roles, Responsibilities & Professional Conduct','Workshop Hazards & Risk Awareness','Personal Protective Equipment (PPE)','Safe Tool Handling & Pre-use Checks','Workshop Housekeeping & Material Storage','Emergency, Fire & Incident Procedures','Quality Workmanship & Professional Standards']],
    ['Hand Tools: Selection, Use & Maintenance',[
      'Hand Tool Categories & Correct Selection','Measuring, Marking & Layout Tools','Saws & Manual Cutting Tools','Chisels & Controlled Material Removal','Planes & Surface Preparation','Hammers, Mallets, Screwdrivers & Fastening Tools','Sharpening, Edge Care & Tool Maintenance','Safe, Accurate Hand-Tool Workflow']],
    ['Power Tools & Safe Operating Practice',[
      'Power-Tool Safety Principles & Pre-use Inspection','Portable Circular Saws','Jigsaws & Reciprocating Saws','Drills, Drivers & Boring Tools','Routers & Edge/Forming Operations','Sanders & Powered Surface Preparation','Stationary Woodworking Machinery Awareness','Power-Tool Workflow, Dust Control & Quality Checks']],
    ['Measurement, Marking & Technical Accuracy',[
      'Measurement Systems, Units & Accuracy','Reading Rules, Tapes & Measuring Devices','Squares, Angles & Reference Surfaces','Marking Gauges, Knives, Pencils & Layout Practice','Datums, Reference Faces & Consistent Set-out','Reading Simple Working Drawings','Tolerance, Error & Dimensional Control','Verification, First-off Checks & Measurement Workflow']],
    ['Timber, Boards & Material Selection',[
      'Timber Structure, Grain & Basic Properties','Softwoods, Hardwoods & Material Identification','Moisture, Movement & Storage Conditions','Board Products: Plywood, MDF, Particleboard & Related Sheets','Defects, Grading & Material Suitability','Selecting Material for the Job','Efficient Cutting, Yield & Waste Reduction','Material Inspection, Handling & Preparation']],
    ['Carpentry Joints & Assembly Techniques',[
      'Joint Selection & Principles of Strong Assembly','Butt Joints & Reinforcement Methods','Lap & Halving Joints','Housing, Dado & Rebate Joints','Mortise-and-Tenon Principles','Dowel, Biscuit & Mechanical Joining','Adhesives, Screws, Nails & Other Fixings','Dry Assembly, Squareness, Clamping & Joint Quality']],
    ['Construction Methods & Practical Application',[
      'Reading a Simple Job Brief & Working Drawing','Planning Work Sequence, Materials & Cut Lists','Building Frames & Simple Timber Structures','Shelving & Basic Storage Construction','Doors, Frames, Hardware & Basic Fitting','Installing Components & Safe Fixing to Substrates','On-site Adjustments & Practical Problem Solving','Practical Build Workflow: Set-out to Handover']],
    ['Surface Preparation, Finishing & Protection',[
      'Surface Assessment & Preparation','Abrasives & Correct Sanding Sequences','Filling, Repairing & Preparing Surface Defects','Stains, Dyes & Colour Preparation','Clear Finishes & Protective Coatings','Paint Systems for Timber','Application Methods, Drying, Curing & Work Environment','Finish Defects, Inspection, Care & Protection']],
    ['Quality Control, Defects & Corrective Practice',[
      'Specifications & Acceptance Criteria','Dimensional Inspection & Tolerance Checking','Checking Square, Level, Plumb & Alignment','Joint & Fixing Inspection','Surface & Finish Inspection','Diagnosing Common Carpentry Defects','Corrective Action, Rework & Waste Prevention','Final Inspection, Documentation & Handover']],
    ['Applied Carpentry Practice & Workplace Readiness',[
      'Interpreting a Client or Workplace Brief','Planning an End-to-End Carpentry Job','Basic Costing, Material Quantities & Waste Estimation','Safe Work Method & Risk Planning','Executing & Sequencing a Practical Project','Quality Control During Project Execution','Customer Communication, Handover & Aftercare','Employability, Portfolio, Entrepreneurship & Continuous Development']]
  ];
  const lessonCache=new Map();
  const qaMode=()=>new URLSearchParams(location.search).get('qa')==='1';
  const isCarpentry=()=>state?.course && (state.course.id===CARPENTRY_ID || String(state.course.slug||'').toLowerCase()==='carpentry-fundamentals-job-ready-certificate' || /carpentry/i.test(String(state.course.title||'')));
  const modulePassKey=n=>`funda-module-pass-${state.course?.id||'benchmark'}-m${n}`;
  const formativePassKey=n=>`funda-formative-pass-${state.course?.id||'benchmark'}-m${n}`;
  const moduleUnlocked=n=>qaMode()||n===1||localStorage.getItem(modulePassKey(n-1))==='1';
  const unitPath=(m,u)=>m===1&&u===5?'course-data/carpentry/module-01/lesson-05-safe-tool-handling-pre-use-checks.md':`course-data/carpentry/module-${String(m).padStart(2,'0')}/lesson-${String(u).padStart(2,'0')}.md`;
  const safeInline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>').replace(/`(.+?)`/g,'<code>$1</code>');
  function markdownToHtml(md){
    const lines=String(md||'').replace(/\r/g,'').split('\n');
    const out=[];let list=null;
    const close=()=>{if(list){out.push(`</${list}>`);list=null}};
    for(const raw of lines){const line=raw.trimEnd();if(!line.trim()){close();continue}
      const h=line.match(/^(#{1,6})\s+(.+)$/);if(h){close();const n=Math.min(4,h[1].length+1);out.push(`<h${n}>${safeInline(h[2])}</h${n}>`);continue}
      const ul=line.match(/^[-*]\s+(.+)$/);if(ul){if(list!=='ul'){close();list='ul';out.push('<ul>')}out.push(`<li>${safeInline(ul[1])}</li>`);continue}
      const ol=line.match(/^\d+[.)]\s+(.+)$/);if(ol){if(list!=='ol'){close();list='ol';out.push('<ol>')}out.push(`<li>${safeInline(ol[1])}</li>`);continue}
      if(/^---+$/.test(line.trim())){close();out.push('<hr>');continue}
      close();out.push(`<p>${safeInline(line)}</p>`)
    }close();return out.join('')
  }
  function stripTitle(md){return String(md||'').replace(/^\s*#\s+.*\n?/,'').replace(/^\s*##\s+.*\n?/,'')}
  function extractStudyTime(md){const m=String(md||'').match(/(?:Estimated\s+Study\s+Time|Study\s+Time|Estimated\s+time)\s*[:—-]\s*\*\*?([^\n*]+)|(?:Estimated\s+Study\s+Time|Study\s+Time|Estimated\s+time)\s*[:—-]\s*([^\n]+)/i);return (m?.[1]||m?.[2]||'35–45 min').trim()}
  function extractTerms(md){
    const lines=String(md||'').split(/\r?\n/);let inTerms=false;const terms=[];
    for(const raw of lines){const t=raw.trim();if(/^#{1,6}\s+.*(?:Key Terms|Vocabulary|Terminology)/i.test(t)){inTerms=true;continue}if(inTerms&&/^#{1,6}\s+/.test(t))break;if(!inTerms)continue;
      let m=t.match(/^[-*]\s+\*\*(.+?)\*\*\s*[:—-]?\s*(.+)$/)||t.match(/^\*\*(.+?)\*\*\s*[:—-]\s*(.+)$/);if(m)terms.push([m[1].trim(),m[2].trim()]);if(terms.length>=10)break
    }return terms
  }
  async function loadLesson(m,u){const key=`${m}-${u}`;if(lessonCache.has(key))return lessonCache.get(key);const r=await fetch(unitPath(m,u),{cache:'no-store'});if(!r.ok)throw new Error(`Lesson file unavailable (${r.status})`);const text=await r.text();lessonCache.set(key,text);return text}
  function premiumShell(title,m,u,time){return `<div class="mobiletools"><button id="openModulesInner">☰ Modules</button><button id="scrollNotesInner">✎ Notes</button></div><div class="crumb">${esc(state.course?.title||BENCHMARK_TITLE)} / Module ${m} / Lesson ${u}</div><section class="lessonhead"><div class="course-label">MODULE ${m} · LESSON ${u} OF 8</div><h1>${esc(title)}</h1><div class="meta"><span class="pill">Study time · ${esc(time)}</span><span class="pill gold">Teaching Lesson</span></div></section><section class="card"><div id="premiumLessonBody"><p>Loading lesson content…</p></div></section><div class="navbuttons"><button class="btn secondary" id="prevLesson">← Previous</button><button class="btn primary" id="completeLesson">Complete Lesson & Continue →</button></div>`}
  async function renderPremiumLesson(){
    const m=state.module,u=state.unit,title=MANIFEST[m-1][1][u-1];$('course-content').innerHTML=premiumShell(title,m,u,'35–45 min');wireMobile();
    try{const md=await loadLesson(m,u);const body=$('premiumLessonBody');if(body)body.innerHTML=markdownToHtml(stripTitle(md));const time=extractStudyTime(md);const pill=document.querySelector('.meta .pill');if(pill)pill.textContent=`Study time · ${time}`;const terms=extractTerms(md);$('keyTerms').innerHTML=terms.length?terms.map(([a,b])=>`<div class="term"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join(''):'<div class="term"><span>Key terminology is included within this lesson.</span></div>';}
    catch(e){console.error(e);$('premiumLessonBody').innerHTML=`<div class="callout"><strong>Lesson could not be loaded.</strong><br>${esc(e.message||'Please refresh and try again.')}</div>`}
    const noteKey=`funda-note-${state.course?.id||'benchmark'}-m${m}-u${u}`;$('lessonNotes').value=localStorage.getItem(noteKey)||'';$('saveNotes').onclick=()=>{localStorage.setItem(noteKey,$('lessonNotes').value);show('Lesson notes saved on this device.',true)};
    $('prevLesson').disabled=m===1&&u===1;$('prevLesson').onclick=()=>{if(u>1){state.unit=u-1}else if(m>1){state.module=m-1;state.unit=8}render();scrollTo(0,0)};
    $('completeLesson').onclick=()=>{localStorage.setItem(`funda-lesson-complete-${state.course?.id||'benchmark'}-m${m}-u${u}`,'1');state.unit=u<8?u+1:9;render();scrollTo(0,0)}
  }
  function renderPremiumModules(){const host=$('moduleList');if(!host)return;host.innerHTML=MANIFEST.map(([title,lessons],i)=>{const m=i+1,unlocked=moduleUnlocked(m);let units='';for(let u=1;u<=10;u++){const label=u===9?'Formative Assessment':u===10?'Summative Assessment':lessons[u-1];const gatedAssessment=u===10&&localStorage.getItem(formativePassKey(m))!=='1'&&!qaMode();const locked=!unlocked||gatedAssessment;const active=state.module===m&&state.unit===u;units+=`<button class="unit ${active?'active':''} ${locked?'locked':''}" data-m="${m}" data-u="${u}" ${locked?'disabled':''}><span class="dot">${active?'▶':u}</span><span>${esc(label)}</span></button>`}return `<div class="module"><h3>Module ${m} · ${esc(title)}</h3>${units}</div>`}).join('');host.querySelectorAll('.unit:not(.locked)').forEach(b=>b.onclick=()=>{state.module=Number(b.dataset.m);state.unit=Number(b.dataset.u);render();if(innerWidth<761)$('modulePanel').classList.remove('open')})}
  function genericAssessmentNotice(kind){const m=state.module;const label=kind==='formative'?'Formative':'Summative';$('course-content').innerHTML=`<div class="assess-wrap"><div class="mobiletools"><button id="openModulesInner">☰ Modules</button></div><div class="assess-crumb">${esc(state.course?.title||BENCHMARK_TITLE)} › Module ${m} › ${label} Assessment</div><div class="assess-intro"><h2>Module ${m} ${label} Assessment</h2><p>The premium question bank for this module is present in the course package. The generic multi-module assessment engine is the remaining integration step before this assessment is enabled for learners.</p><div class="assess-note"><strong>QA protection:</strong> this screen deliberately prevents Module 1 questions from being shown under another module.</div></div></div>`;wireMobile()}
  function progressPercent(){let completed=0;for(let m=1;m<=10;m++)if(localStorage.getItem(modulePassKey(m))==='1')completed+=10;for(let u=1;u<=8;u++)if(localStorage.getItem(`funda-lesson-complete-${state.course?.id||'benchmark'}-m${state.module}-u${u}`)==='1')completed+=1;return Math.max(0,Math.min(100,completed))}
  const originalRender=render;
  render=function(){
    if(!state.course)return originalRender();
    if(!isCarpentry()){$('sidebarCourse').textContent=state.course.title||'Selected Course';$('moduleList').innerHTML='';$('progressText').textContent='0%';$('progressFill').style.width='0%';$('course-content').innerHTML=`<div class="assess-wrap"><div class="assess-intro"><h2>${esc(state.course.title||'Selected course')}</h2><p>This branch is currently validating the Carpentry premium workspace. Carpentry benchmark content has been isolated so it cannot appear inside another course.</p></div></div>`;return}
    $('sidebarCourse').textContent=state.course.title||BENCHMARK_TITLE;renderPremiumModules();const pct=progressPercent();$('progressText').textContent=`${pct}%`;$('progressFill').style.width=`${pct}%`;
    if(state.unit<=8){renderPremiumLesson();return}
    if(state.module===1){if(state.unit===9)renderAssessment('formative');else renderAssessment('summative');return}
    genericAssessmentNotice(state.unit===9?'formative':'summative')
  };
})();
