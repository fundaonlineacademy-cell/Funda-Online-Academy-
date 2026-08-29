// FUNDA ONLINE ACADEMY — STUDENT MODULE ASSESSMENT CONTROLS
// Adds database-driven assessment links beneath modules that have published banks.
(function(){
  'use strict';

  if(!/dashboard\.html$/i.test(location.pathname))return;

  const enhancedCourses=new Map();
  let db=null;

  function getDb(){
    if(db)return db;
    if(!window.supabase||!window.SUPABASE_URL||!window.SUPABASE_ANON_KEY)return null;
    db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    return db;
  }

  function escapeHtml(value){
    return String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  async function loadCourseAssessmentMap(courseId){
    if(enhancedCourses.has(courseId))return enhancedCourses.get(courseId);
    const client=getDb();
    if(!client)return null;

    const {data:modules,error:moduleError}=await client
      .from('course_modules')
      .select('id,module_number,module_name')
      .eq('course_id',courseId)
      .order('module_number',{ascending:true});

    if(moduleError){
      console.warn('Module assessment controls: module load failed',moduleError);
      return null;
    }

    const ids=(modules||[]).map(m=>m.id);
    if(!ids.length)return new Map();

    const {data:assessments,error:assessmentError}=await client
      .from('assessments')
      .select('id,module_id,title,active,status')
      .eq('course_id',courseId)
      .eq('active',true)
      .eq('status','published')
      .in('module_id',ids);

    if(assessmentError){
      console.warn('Module assessment controls: assessment load failed',assessmentError);
      return null;
    }

    const byModuleId=new Map();
    (assessments||[]).forEach(a=>{
      const list=byModuleId.get(String(a.module_id))||[];
      list.push(a);
      byModuleId.set(String(a.module_id),list);
    });

    const byNumber=new Map();
    (modules||[]).forEach(m=>{
      const list=byModuleId.get(String(m.id))||[];
      byNumber.set(Number(m.module_number),{
        module:m,
        formative:list.find(a=>/formative/i.test(a.title||''))||null,
        summative:list.find(a=>/summative/i.test(a.title||''))||null
      });
    });

    enhancedCourses.set(courseId,byNumber);
    return byNumber;
  }

  function makeControls(courseId,moduleNumber,record){
    if(!record||(!record.formative&&!record.summative))return '';
    const base=`course=${encodeURIComponent(courseId)}&module=${encodeURIComponent(moduleNumber)}`;
    const formative=record.formative
      ? `<a href="module-assessment.html?${base}&type=formative" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:10px 14px;border-radius:11px;background:#071d49;color:white;font-size:13px;font-weight:800">📝 Open Formative</a>`
      : '';
    const summative=record.summative
      ? `<a href="module-assessment.html?${base}&type=summative" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none;padding:10px 14px;border-radius:11px;background:#fff7df;color:#7b5813;border:1px solid #e6cf91;font-size:13px;font-weight:800">🎓 Open Summative</a>`
      : '';
    return `<div data-module-assessment-controls="1" style="margin-top:16px;padding:14px;border-radius:14px;border:1px solid #d8e4f0;background:linear-gradient(135deg,#f7fbff,#fffaf0)">
      <div style="font-weight:800;color:#071d49;margin-bottom:4px">Module Assessments</div>
      <div style="font-size:12px;color:#64748b;line-height:1.5;margin-bottom:10px">Complete all lessons before the formative assessment. Passing the formative assessment unlocks the summative assessment.</div>
      <div style="display:flex;flex-wrap:wrap;gap:9px">${formative}${summative}</div>
    </div>`;
  }

  async function enhanceCourseCard(card){
    if(!card||card.dataset.assessmentEnhancing==='1')return;
    const courseId=String(card.dataset.courseId||'').trim();
    if(!courseId)return;
    card.dataset.assessmentEnhancing='1';

    const map=await loadCourseAssessmentMap(courseId);
    if(!map){delete card.dataset.assessmentEnhancing;return;}

    const moduleCards=card.querySelectorAll('.module-card');
    moduleCards.forEach(moduleCard=>{
      const numberEl=moduleCard.querySelector('.module-number');
      const content=moduleCard.querySelector('[data-module-content]');
      if(!numberEl||!content||content.querySelector('[data-module-assessment-controls]'))return;
      const moduleNumber=Number(String(numberEl.textContent||'').trim());
      if(!Number.isInteger(moduleNumber))return;
      const html=makeControls(courseId,moduleNumber,map.get(moduleNumber));
      if(html)content.insertAdjacentHTML('beforeend',html);
    });
  }

  async function scan(){
    const cards=document.querySelectorAll('.study-card[data-course-id]');
    for(const card of cards)await enhanceCourseCard(card);
  }

  function boot(){
    scan();
    const root=document.getElementById('myCourses')||document.body;
    const observer=new MutationObserver(()=>scan());
    observer.observe(root,{childList:true,subtree:true});
    setTimeout(scan,900);
    setTimeout(scan,2200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();