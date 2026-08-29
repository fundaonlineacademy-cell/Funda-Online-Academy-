// FUNDA ONLINE ACADEMY — MODULE 1 ASSESSMENT PERSISTENCE ADAPTER
(function(){
  const COURSE_ID='60cfc5ea-6d3b-4dd1-abd6-cb68800930b5';
  const isCarpentry=()=>state?.course && (state.course.id===COURSE_ID||String(state.course.slug||'').toLowerCase()==='carpentry-fundamentals-job-ready-certificate'||/carpentry/i.test(String(state.course.title||'')));
  async function assessmentId(kind){
    if(!isCarpentry())return null;
    const title=`Carpentry Module 1 ${kind==='formative'?'Formative':'Summative'} Assessment`;
    const {data,error}=await db.from('assessments').select('id').eq('course_id',state.course.id).eq('title',title).maybeSingle();
    if(error){console.warn('Module 1 assessment lookup failed:',error.message);return null}
    return data?.id||null;
  }
  async function persist(kind,record){
    try{
      if(!record||!state.user||!state.course)return;
      const id=await assessmentId(kind);if(!id)return;
      const {data:existing}=await db.from('assessment_attempts').select('id').eq('assessment_id',id).eq('student_id',state.user.id).eq('attempt_number',record.attempt).maybeSingle();
      if(existing?.id)return;
      await db.from('assessment_attempts').insert({assessment_id:id,student_id:state.user.id,attempt_number:record.attempt,score:record.correct,total_marks:record.total|| (kind==='formative'?15:25),percentage:record.score,passed:record.passed,submitted_at:record.submittedAt||record.recordedAt||new Date().toISOString()});
    }catch(e){console.warn('Module 1 assessment persistence deferred:',e?.message||e)}
  }
  function latestFormative(){try{const k=`funda-assessment-${state.course?.id||'benchmark'}-${state.user?.id||'student'}-m1-formative`;const r=JSON.parse(localStorage.getItem(k)||'{"attempts":[]}');const x=r?.attempts?.[r.attempts.length-1];return x?{attempt:x.attempt,score:x.score,correct:x.correct,total:15,passed:x.passed,submittedAt:x.submittedAt}:null}catch{return null}}
  function latestSummative(){try{const final=JSON.parse(localStorage.getItem(`funda-summative-final-${state.course?.id||'benchmark'}-m1`)||'null');if(final)return {attempt:final.attempt,score:final.score,correct:final.correct,total:25,passed:final.passed,recordedAt:final.recordedAt};const attempts=JSON.parse(localStorage.getItem(`funda-summative-attempts-${state.course?.id||'benchmark'}-m1`)||'[]');const x=attempts[attempts.length-1];return x?{attempt:x.attempt,score:x.score,correct:x.correct,total:25,passed:x.passed,recordedAt:x.recordedAt}:null}catch{return null}}
  function wrapFormative(){if(typeof window.submitFormative!=='function'||window.submitFormative.__m1persist)return false;const original=window.submitFormative;const wrapped=function(){const r=original.apply(this,arguments);Promise.resolve(r).finally(()=>setTimeout(()=>persist('formative',latestFormative()),0));return r};wrapped.__m1persist=true;window.submitFormative=wrapped;return true}
  function wrapSummative(){if(typeof window.submitSummative!=='function'||window.submitSummative.__m1persist)return false;const original=window.submitSummative;const wrapped=function(){const r=original.apply(this,arguments);Promise.resolve(r).finally(()=>setTimeout(()=>persist('summative',latestSummative()),0));return r};wrapped.__m1persist=true;window.submitSummative=wrapped;return true}
  wrapFormative();wrapSummative();let checks=0;const t=setInterval(()=>{wrapFormative();wrapSummative();if(++checks>40||(window.submitFormative?.__m1persist&&window.submitSummative?.__m1persist))clearInterval(t)},250);
})();