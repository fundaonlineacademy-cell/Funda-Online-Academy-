(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAcademicIntegrity)return;
window.__fundaAcademicIntegrity=true;
let db=null,courses=[],modules=[],lessons=[],assessments=[],reviews=[],bankHealth=[],lastGood=null,busy=false,channel=null,timer=null;
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
  const rs=await Promise.all([
   db.from('courses').select('id,title,duration,active,modules').eq('active',true).order('title'),
   db.from('course_modules').select('id,course_id,module_number,module_name'),
   db.from('lessons').select('id,module_id,lesson_number,title,content,main_content'),
   db.from('assessments').select('id,course_id,module_id,title,active,status,questions'),
   db.from('academic_course_qa_reviews').select('id,course_id,review_status,reviewed_at,created_at').order('created_at',{ascending:false}),
   db.rpc('get_admin_assessment_bank_health')
  ]);
  const bad=rs.find(x=>x.error);if(bad)throw bad.error;
  courses=rs[0].data||[];modules=rs[1].data||[];lessons=rs[2].data||[];assessments=rs[3].data||[];reviews=rs[4].data||[];bankHealth=rs[5].data||[];
  lastGood={courses:[...courses],modules:[...modules],lessons:[...lessons],assessments:[...assessments],reviews:[...reviews],bankHealth:[...bankHealth]};return true;
 }catch(e){
  console.error('Academic integrity load failed',e);
  if(lastGood){courses=[...lastGood.courses];modules=[...lastGood.modules];lessons=[...lastGood.lessons];assessments=[...lastGood.assessments];reviews=[...lastGood.reviews];bankHealth=[...(lastGood.bankHealth||[])];return true}
  return false;
 }finally{busy=false}
}
function rows(){
 return courses.map(c=>{
  const ms=modules.filter(m=>m.course_id===c.id),ids=new Set(ms.map(m=>m.id)),ls=lessons.filter(l=>ids.has(l.module_id)),as=assessments.filter(a=>a.course_id===c.id&&liveAssessment(a)),w=weeks(c);
  const below=ls.filter(l=>words(l.main_content||l.content)<500).length;
  const empty=ls.filter(l=>words(l.main_content||l.content)===0).length;
  const fallback=ls.filter(l=>!String(l.main_content||'').trim()&&String(l.content||'').trim()).length;
  const duplicate=ls.filter(l=>String(l.main_content||'').trim()&&String(l.content||'').trim()).length;
  let missF=0,missS=0;
  ms.forEach(m=>{
   const ma=as.filter(a=>a.module_id===m.id);
   if(w>4&&!ma.some(a=>/formative/i.test(a.title||'')))missF++;
   if(!ma.some(a=>/summative/i.test(a.title||'')))missS++;
  });
  const oldCount=Array.isArray(c.modules)?c.modules.length:0,mismatch=oldCount>0&&oldCount!==ms.length;
  const legacyQ=assessments.filter(a=>a.course_id===c.id&&Array.isArray(a.questions)&&a.questions.length).length;
  const review=reviews.find(r=>r.course_id===c.id)||null;
  const shortBanks=bankHealth.filter(b=>b.course_id===c.id&&b.assessment_type!=='other'&&!b.bank_ok).length;
  const actionable=below+empty+fallback+missF+missS+shortBanks+(mismatch?1:0);
  return {c,ms:ms.length,ls:ls.length,as:as.length,below,empty,fallback,duplicate,missF,missS,shortBanks,mismatch,oldCount,legacyQ,review,actionable};
 });
}
function summary(){
 const r=rows();
 return {
  issueCourses:r.filter(x=>x.actionable>0).length,
  below:r.reduce((n,x)=>n+x.below,0),
  empty:r.reduce((n,x)=>n+x.empty,0),
  assessments:r.reduce((n,x)=>n+x.missF+x.missS+x.shortBanks,0),
  fallback:r.reduce((n,x)=>n+x.fallback,0)
 };
}
function panel(){
 const s=summary();
 return '<section class="aiPanel" id="academicIntegrityPanel"><div class="aiHead"><div><h3>Content Integrity · Live</h3><p>Canonical lesson content, 500-word minimum, module assessment coverage and legacy-field conflicts across active courses.</p></div><button class="aiBtn" id="aiOpen">Open Integrity Register</button></div><div class="aiStats"><div class="aiStat"><b>'+s.issueCourses+'</b><span>COURSES REQUIRING ACTION</span></div><div class="aiStat"><b>'+s.below+'</b><span>LESSONS BELOW 500 WORDS</span></div><div class="aiStat"><b>'+s.empty+'</b><span>LESSONS WITHOUT TEACHING BODY</span></div><div class="aiStat"><b>'+s.assessments+'</b><span>ASSESSMENT CONFIGURATION ISSUES</span></div><div class="aiStat"><b>'+s.fallback+'</b><span>LEGACY-ONLY LESSON BODIES</span></div></div><div class="aiNote">Structured <b>main_content</b>, <b>course_modules</b> and the assessment question table are authoritative. Historical duplicate fields are reported separately and are not allowed to override current learner content.</div></section>';
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
  let legacy='';
  if(x.fallback)legacy+=pill(x.fallback+' legacy fallback','bad');
  if(x.mismatch)legacy+=pill('Old module array '+x.oldCount+' ≠ '+x.ms,'warn');
  if(x.duplicate)legacy+=pill(x.duplicate+' duplicate lesson bodies','');
  if(x.legacyQ)legacy+=pill(x.legacyQ+' legacy question JSON','');
  if(!legacy)legacy=pill('Canonical fields','good');
  const qa=x.review?pill(String(x.review.review_status||'reviewed').replaceAll('_',' ').toUpperCase(),low(x.review.review_status)==='approved'?'good':'warn'):pill('No QA review','warn');
  const cats=[x.below||x.empty?'content':'',x.missF||x.missS||x.shortBanks?'assessment':'',x.fallback||x.mismatch?'legacy':''].filter(Boolean).join(' ');
  return '<tr data-ai-row data-search="'+esc(low(x.c.title))+'" data-issues="'+(x.actionable>0?'1':'0')+'" data-cats="'+cats+'"><td><b>'+esc(x.c.title)+'</b><div class="aiNote">'+esc(x.c.duration||'Duration not set')+'</div></td><td>'+x.ms+' modules · '+x.ls+' lessons · '+x.as+' live assessments</td><td>'+content+'</td><td>'+ass+'</td><td>'+legacy+'</td><td>'+qa+'</td></tr>';
 }).join('');
 document.body.insertAdjacentHTML('beforeend','<div class="aiBack" id="academicIntegrityModal"><div class="aiModal"><div class="aiModalHead"><div><h3>Academic Content Integrity Register</h3><p>Live QA indicators; this register identifies work still required and does not auto-generate academic content.</p></div><button class="aiBtn alt" id="aiClose">Close</button></div><div class="aiBody"><div class="aiBar"><input class="aiInput" id="aiSearch" placeholder="Search course"><select class="aiInput" id="aiFilter"><option value="issues">Requires action only</option><option value="all">All active courses</option><option value="content">Content issues</option><option value="assessment">Assessment issues</option><option value="legacy">Legacy conflicts</option></select><span class="aiNote" id="aiCount"></span></div><div class="aiTableWrap"><table class="aiTable"><thead><tr><th>Course</th><th>Structure</th><th>Lesson integrity</th><th>Assessment integrity</th><th>Legacy status</th><th>QA status</th></tr></thead><tbody>'+body+'</tbody></table></div><div class="aiNote"><b>Important:</b> retired lesson bodies and assessment JSON are preserved only in Admin-only archive tables; they are no longer present in live learner-facing fields. Live learner assessment delivery uses the canonical question table. The 500-word and assessment indicators show actual academic work still outstanding; they are not automatically filled with placeholder text.</div></div></div></div>');
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
function live(){
 if(channel||!db)return;
 let ch=db.channel('admin-academic-integrity-live-v1');
 ['courses','course_modules','lessons','assessments','academic_course_qa_reviews'].forEach(table=>{ch=ch.on('postgres_changes',{event:'*',schema:'public',table},()=>{if(!active())return;clearTimeout(timer);timer=setTimeout(refresh,180)})});
 channel=ch.subscribe(status=>{window.__fundaAcademicIntegrityRealtimeStatus=status});
}
async function init(){
 style();await load();renderPanel();live();
 const view=byId('view');if(view)new MutationObserver(()=>{if(active()&&view.querySelector('.aqHero')&&!byId('academicIntegrityPanel'))setTimeout(renderPanel,100)}).observe(view,{childList:true,subtree:false});
 document.addEventListener('click',e=>{const b=e.target.closest?.('#nav button,.nav button');if(b&&/academic/i.test(b.textContent||''))setTimeout(refresh,350)},true);
 document.addEventListener('funda:admin-manual-refresh',()=>{if(active())refresh()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,650));else setTimeout(init,650);
})();