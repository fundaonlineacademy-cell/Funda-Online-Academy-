// FUNDA ONLINE ACADEMY — CARPENTRY ASSESSMENT ROUTING BRIDGE
(function(){
  if(typeof render!=='function'||typeof window.renderCarpentryGenericAssessment!=='function')return;
  const previousRender=render;
  render=function(){
    const carpentry=state?.course && (state.course.id==='60cfc5ea-6d3b-4dd1-abd6-cb68800930b5'||String(state.course.slug||'').toLowerCase()==='carpentry-fundamentals-job-ready-certificate'||/carpentry/i.test(String(state.course.title||'')));
    if(carpentry&&state.module>1&&(state.unit===9||state.unit===10)){
      if(typeof renderModules==='function')renderModules();
      $('sidebarCourse').textContent=state.course.title||BENCHMARK_TITLE;
      window.renderCarpentryGenericAssessment(state.unit===9?'formative':'summative');
      return;
    }
    previousRender();
  };
})();