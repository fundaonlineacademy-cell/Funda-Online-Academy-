// FUNDA ONLINE ACADEMY — CARPENTRY ASSESSMENT PROGRESS SYNC
// Hydrates attempt limits and module unlocks from Supabase so progression survives device changes.
(function(){
  let done=false,tries=0;
  const timer=setInterval(async()=>{
    tries++;
    if(done||tries>40){clearInterval(timer);return}
    if(!state?.user||!state?.course)return;
    const carpentry=state.course.id==='60cfc5ea-6d3b-4dd1-abd6-cb68800930b5'||String(state.course.slug||'').toLowerCase()==='carpentry-fundamentals-job-ready-certificate'||/carpentry/i.test(String(state.course.title||''));
    if(!carpentry){done=true;clearInterval(timer);return}
    done=true;clearInterval(timer);
    try{
      const {data:defs,error:de}=await db.from('assessments').select('id,title').eq('course_id',state.course.id).ilike('title','Carpentry Module % Assessment');
      if(de)throw de;if(!defs?.length)return;
      const ids=defs.map(x=>x.id),byId=new Map(defs.map(x=>[x.id,x.title]));
      const {data:rows,error:ae}=await db.from('assessment_attempts').select('assessment_id,attempt_number,score,total_marks,percentage,passed,submitted_at').eq('student_id',state.user.id).in('assessment_id',ids).order('submitted_at',{ascending:true});
      if(ae)throw ae;
      const grouped=new Map();
      for(const r of rows||[]){const title=byId.get(r.assessment_id)||'',m=title.match(/Carpentry Module (\d+) (Formative|Summative) Assessment/i);if(!m)continue;const mod=+m[1],kind=m[2].toLowerCase(),gk=`${mod}-${kind}`;if(!grouped.has(gk))grouped.set(gk,[]);grouped.get(gk).push({m:mod,kind,attempt:+r.attempt_number,correct:Number(r.score||0),total:Number(r.total_marks||0),score:Number(r.percentage||0),passed:!!r.passed,submittedAt:r.submitted_at})}
      for(const [gk,a] of grouped){a.sort((x,y)=>x.attempt-y.attempt);const [modText,kind]=gk.split('-'),mod=+modText;const normal=a.slice(0,3).map((r,i)=>({...r,attempt:i+1,final:r.passed||i===2}));const base=`funda-${kind}`;localStorage.setItem(`${base}-attempts-${state.course.id}-m${mod}`,JSON.stringify(normal));const final=normal.find(x=>x.passed)||normal.find(x=>x.attempt===3);if(final)localStorage.setItem(`${base}-final-${state.course.id}-m${mod}`,JSON.stringify(final));if(kind==='formative'&&normal.some(x=>x.passed))localStorage.setItem(`funda-formative-pass-${state.course.id}-m${mod}`,'1');if(kind==='summative'&&normal.some(x=>x.passed))localStorage.setItem(`funda-module-pass-${state.course.id}-m${mod}`,'1')}
      render();
    }catch(e){console.warn('Carpentry progress sync pending:',e?.message||e)}
  },250);
})();