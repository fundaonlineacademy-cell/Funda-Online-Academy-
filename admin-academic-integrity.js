(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAcademicIntegrity)return;
window.__fundaAcademicIntegrity=true;
let db=null,courses=[],modules=[],lessons=[],assessments=[],reviews=[],bankHealth=[],lastGood=null,busy=false;
const byId=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v||'').toLowerCase();
function active(){const b=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');return !!b&&/academic/i.test(b.textContent||'')}
function words(v){const t=String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();return t?t.split(' ').filter(Boolean).length:0}
function weeks(c){const m=String(c?.duration||'').match(/(\d+)/);return m?Number(m[1]):0}
function liveAssessment(a){return a&&a.active!==false&&['published','active'].includes(low(a.status))}
function client(){return window.__fundaSharedSupabaseClient||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY)}
const css='.aiPanel{margin:10px 0;border:1px solid #dccb9a;border-radius:14px;background:#fffaf0;padding:13px}.aiHead{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.aiHead h3{margin:0;color:#071b31;font-size:14px}.aiHead p{margin:4px 0 0;color:#6e7d8a;font-size:10px;line-height:1.5}.aiStats{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;margin-top:10px}.aiStat{background:#fff;border:1px solid #e7deca;border-radius:9px;padding:9px}.aiStat b{display:block;font-size:18px;color:#071b31}.aiStat span{font-size:8px;color:#718096;font-weight:800}.aiBtn{border:0;border-radius:8px;padding:8px 10px;background:#071b31;color:#efd78e;font-size:9px;font-weight:900;cursor:pointer}.aiBtn.alt{background:#fff;color:#071b31;border:1px solid #d9d1bf}.aiBack{position:fixed;inset:0;background:rgba(3,16,31,.72);z-index:10045;display:grid;place-items:center;padding:12px}.aiModal{width:min(1220px,98vw);max-height:94vh;overflow:auto;background:#fff;border-radius:17px}.aiModalHead{position:sticky;top:0;z-index:2;background:#071b31;color:#fff;padding:14px 17px;border-bottom:4px solid #c99a2e;display:flex;justify-content:space-between;gap:10px}.aiModalHead h3{margin:0;font-size:18px}.aiModalHead p{margin:4px 0 0;color:#dce6f2;font-size:11px}.aiBody{padding:14px}.aiBar{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:10px}.aiInput{border:1px solid #d7dde5;border-radius:8px;padding:8px 9px;min-width:230px;font-size:10px;background:#fff}.aiTableWrap{max-height:65vh;overflow:auto;border:1px solid #e3e7eb;border-radius:9px}.aiTable{width:100%;border-collapse:collapse;min-width:1050px;font-size:10px}.aiTable th,.aiTable td{padding:8px;border-bottom:1px solid #edf0f2;text-align:left;vertical-align:top}.aiTable th{position:sticky;top:0;background:#f7f9fb;font-size:8px;color:#667789;text-transform:uppercase;z-index:1}.aiPill{display:inline-block;margin:1px;padding:4px 7px;border-radius:99px;background:#edf2f7;font-size:8px;font-weight:900}.aiPill.good{background:#e5f6ef;color:#176b50}.aiPill.warn{background:#fff2d2;color:#8a5a05}.aiPill.bad{background:#ffe7e7;color:#9d2828}.aiNote{font-size:9px;color:#657483;line-height:1.5;margin-top:9px}@media(min-width:821px){.aiHead h3{font-size:17px}.aiHead p,.aiNote{font-size:11px}.aiBtn,.aiInput{font-size:11px}.aiStat span{font-size:10px}}@media(max-width:820px){.aiHead{display:block}.aiHead .aiBtn{margin-top:8px}.aiStats{grid-template-columns:repeat(2,1fr)}.aiBar>*{flex:1 1 100%;min-width:0}}';
function style(){if(byId('aiStyle'))return;const s=document.createElement('style');s.id='aiStyle';s.textContent=css;document.head.appendChild(s)}
async function load(){
 if(busy)return !!lastGood;busy=true;
 try{
  db=db||client();if(!db)throw new Error('Academic integrity connection is unavailable.');
  const snap=window.__fundaAcademicDataSnapshot;
  if(snap){
   courses=[...(snap.courses||[])].filter(c=>c.active!==false);modules=[...(snap.course_modules||[])];lessons=[...(snap.lessons||[])];assessments=[...(snap.assessments||[])];reviews=[...(snap.academic_course_qa_reviews||[])].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));bankHealth=[...(snap.assessment_bank_health||[])];
  }else{
   const rs=await Promise.all([
    db.from('courses').select('id,title,duration,active,modules').eq('active',true).order('title').limit(5000),
    db.from('course_modules').select('id,course_id,module_number,module_name').limit(5000),
    db.from('lessons').select('id,module_id,lesson_number,title,main_content,content').limit(5000),
    db.from('assessments').select('id,course_id,module_id,title,active,status').limit(5000),
    db.from('academic_course_qa_reviews').select('id,course_id,review_status,reviewed_at,created_at').order('created_at',{ascending:false}).limit(5000),
    db.rpc('get_admin_assessment_bank_health')
   ]);
   const bad=rs.find(x=>x.error);if(bad)throw bad.error;
   courses=rs[0].data||[];modules=rs[1].data||[];lessons=rs[2].data||[];assessments=rs[3].data||[];reviews=rs[4].data||[];bankHealth=rs[5].data||[];
  }
  lastGood={courses:[...courses],modules:[...modules],lessons:[...lessons],assessments:[...assessments],reviews:[...reviews],bankHealth:[...bankHealth]};return true;
 }catch(e){
  console.error('Academic integrity load failed',e);
  if(lastGood){courses=[...lastGood.courses];modules=[...lastGood.modules];lessons=[...lastGood.lessons];assessments=[...lastGood.assessments];reviews=[...lastGood.reviews];bankHealth=[...(lastGood.bankHealth||[])];return true}
  return false;
 }finally{busy=false}
}
function rows(){
 return courses.map(c=>{
  const ms=modules.filter(m=>m.course_id===c.id),ids=new Set(ms.map(m=>m.id)),ls=lessons.filter(l=>ids.has(l.module_id)),as=assessments.filter(a=>a.course_id===c.id&&liveAssessment(a)&&a.module_id),w=weeks(c);
  const below=ls.filter(l=>{const n=words(l.main_content);return n>0&&n<500}).length;
  const empty=ls.filter(l=>words(l.main_content)===0).length;
  let missF=0,missS=0;
  ms.forEach(m=>{
   const ma=as.filter(a=>a.module_id===m.id);
   if(w>4&&!ma.some(a=>/formative/i.test(a.title||'')))missF++;
   if(!ma.some(a=>/summative/i.test(a.title||'')))missS++;
  });
  const review=reviews.find(r=>r.course_id===c.id)||null;
  const shortBanks=bankHealth.filter(b=>b.course_id===c.id&&b.assessment_type!=='other'&&!b.bank_ok).length;
  const legacyLessons=ls.filter(l=>String(l.content||'').trim()).length,legacyCourse=Array.isArray(c.modules)&&c.modules.length?1:0,legacy=legacyLessons+legacyCourse;
  const actionable=below+empty+missF+missS+shortBanks;
  return {c,ms:ms.length,ls:ls.length,as:as.length,below,empty,missF,missS,shortBanks,review,actionable,legacy,legacyLessons,legacyCourse};
 });
}
function summary(){
 const r=rows();
 return {
  issueCourses:r.filter(x=>x.actionable>0).length,
  below:r.reduce((n,x)=>n+x.below,0),
  empty:r.reduce((n,x)=>n+x.empty,0),
  assessments:r.reduce((n,x)=>n+x.missF+x.missS+x.shortBanks,0),
  legacy:r.reduce((n,x)=>n+x.legacy,0)
 };
}
function panel(){
 const s=summary();
 return '<details class="aiPanel" id="academicIntegrityPanel"><summary style="cursor:pointer;font-weight:900;color:#071b31">Academic Integrity & Legacy Fields</summary><div style="margin-top:10px"><div class="aiHead"><div><h3>Canonical Academic Data Controls</h3><p>The Admin Academic workspace uses structured course modules, <b>main_content</b> and the assessment question table as its current sources. Retired values may remain in storage for historical traceability but must not be presented as current Admin content.</p><div class="aiNote"><b>'+s.legacy+'</b> retired lesson/module value'+(s.legacy===1?' is':'s are')+' currently retained in storage. Course-content completion and assessment completeness will be handled later during the separate course-development audit.</div></div><button class="aiBtn" id="aiOpen">Open Integrity Register</button></div></div></details>';
}
function renderPanel(){
 if(!active())return;
 const view=byId('view');if(!view)return;
 byId('academicIntegrityPanel')?.remove();
 const hero=view.querySelector('.aqHero');
 if(hero)hero.insertAdjacentHTML('afterend',panel());else view.insertAdjacentHTML('afterbegin',panel());
 byId('aiOpen').onclick=openRegister;
}
function pill(text,type){return '<span class="aiPill '+type+'">'+esc(text)+'</span>'}
function openRegister(){
 byId('academicIntegrityModal')?.remove();
 const r=rows();
 const body=r.map(x=>{
  let content='';
  if(x.empty)content+=pill(x.empty+' no teaching body','bad');
  if(x.below)content+=pill(x.below+' below 500','warn');
  if(!content)content=pill('Lesson standard pass','good');
  let ass='';
  if(x.missF)ass+=pill(x.missF+' missing formative','bad');
  if(x.missS)ass+=pill(x.missS+' missing summative','bad');
  if(x.shortBanks)ass+=pill(x.shortBanks+' undersized question bank'+(x.shortBanks===1?'':'s'),'bad');
  if(!ass)ass=pill('Required assessment types & bank sizes pass','good');
  const legacy=x.legacy?pill(x.legacy+' retired value'+(x.legacy===1?'':'s')+' retained','warn'):pill('No retired values','good');
  const recorded=x.review?String(x.review.review_status||'reviewed').replaceAll('_',' ').toUpperCase():'NO QA REVIEW';
  const qa=x.actionable>0
    ?pill((x.review?'RECORDED '+recorded+' · ':'')+'CURRENTLY REQUIRES ACTION','bad')
    :(x.review?pill(recorded,low(x.review.review_status)==='approved'?'good':'warn'):pill('Integrity pass · QA review not recorded','warn'));
  const cats=[x.below||x.empty?'content':'',x.missF||x.missS||x.shortBanks?'assessment':'',x.legacy?'legacy':''].filter(Boolean).join(' ');
  return '<tr data-ai-row data-search="'+esc(low(x.c.title))+'" data-issues="'+(x.actionable>0?'1':'0')+'" data-cats="'+cats+'"><td><b>'+esc(x.c.title)+'</b><div class="aiNote">'+esc(x.c.duration||'Duration not set')+'</div></td><td>'+x.ms+' modules · '+x.ls+' lessons · '+x.as+' live assessments</td><td>'+content+'</td><td>'+ass+'</td><td>'+legacy+'</td><td>'+qa+'</td></tr>';
 }).join('');
 document.body.insertAdjacentHTML('beforeend','<div class="aiBack" id="academicIntegrityModal"><div class="aiModal"><div class="aiModalHead"><div><h3>Academic Content Integrity Register</h3><p>Live QA indicators; this register identifies work still required and does not auto-generate academic content.</p></div><button class="aiBtn alt" id="aiClose">Close</button></div><div class="aiBody"><div class="aiBar"><input class="aiInput" id="aiSearch" placeholder="Search course"><select class="aiInput" id="aiFilter"><option value="issues">Requires action only</option><option value="all">All active courses</option><option value="content">Content issues</option><option value="assessment">Assessment issues</option><option value="legacy">Retired legacy values</option></select><span class="aiNote" id="aiCount"></span></div><div class="aiTableWrap"><table class="aiTable"><thead><tr><th>Course</th><th>Structure</th><th>Lesson integrity</th><th>Assessment integrity</th><th>Legacy storage</th><th>QA status</th></tr></thead><tbody>'+body+'</tbody></table></div><div class="aiNote"><b>Important:</b> this register separates current canonical Admin data from retired fields retained for historical traceability. Course-content and assessment-completeness indicators are informational only here; the separate course-development audit will address unfinished academic material.</div></div></div></div>');
 byId('aiClose').onclick=()=>byId('academicIntegrityModal')?.remove();
 byId('academicIntegrityModal').onclick=e=>{if(e.target.id==='academicIntegrityModal')byId('academicIntegrityModal')?.remove()};
 byId('aiSearch').oninput=filter;byId('aiFilter').onchange=filter;filter();
}
function filter(){
 const q=low(byId('aiSearch')?.value||''),f=byId('aiFilter')?.value||'issues';let shown=0,total=0;
 document.querySelectorAll('[data-ai-row]').forEach(r=>{total++;let ok=!q||r.dataset.search.includes(q);if(f==='issues')ok=ok&&r.dataset.issues==='1';else if(f!=='all')ok=ok&&String(r.dataset.cats||'').includes(f);r.style.display=ok?'':'none';if(ok)shown++});
 if(byId('aiCount'))byId('aiCount').textContent=shown+' of '+total+' courses';
}
async function refresh(){if(await load())renderPanel()}
async function init(){
 style();
 document.addEventListener('funda:academic-core-ready',()=>refresh());
 if(active()&&byId('view')?.querySelector('.aqHero'))refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();