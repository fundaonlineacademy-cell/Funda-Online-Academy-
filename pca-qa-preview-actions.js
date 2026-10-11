// FUNDA ONLINE ACADEMY — PCA INTERNAL QA ACTION PREVIEW
'use strict';
(function(){
  const $=id=>document.getElementById(id);
  let wired=false;

  function setState(text,kind='success'){
    const host=$('evidenceSaveState');
    if(!host)return;
    host.textContent=text;
    host.className='save-state'+(kind?' '+kind:'');
  }

  function isQaPreview(){
    const notice=$('qaPreviewNotice');
    return !!notice && notice.hidden===false;
  }

  function enableQaActions(){
    if(!isQaPreview())return false;
    const save=$('savePcaDraft');
    const submit=$('submitPca');
    const notes=$('evidenceNotes');
    const declaration=$('learnerDeclaration');
    const files=$('evidenceFiles');
    const notice=$('qaPreviewNotice');
    if(!save||!submit)return false;

    [save,submit,notes,declaration,files].filter(Boolean).forEach(el=>{
      el.disabled=false;
      el.dataset.locked='false';
    });

    if(notice){
      notice.innerHTML='<strong>Internal QA preview:</strong> you can test file selection, Save Draft and Submit PCA. Nothing is uploaded and no learner submission is recorded.';
    }

    if(wired)return true;
    wired=true;

    save.addEventListener('click',function(event){
      if(!isQaPreview())return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const state=$('submissionState');
      if(state)state.textContent='Draft · QA preview';
      setState('QA preview: Save Draft action tested successfully. No learner record or file was saved.');
    },true);

    submit.addEventListener('click',function(event){
      if(!isQaPreview())return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const fileCount=document.querySelectorAll('#evidenceFileList .evidence-file').length;
      if(fileCount<1){
        setState('QA preview: select at least one evidence file before testing Submit PCA.','error');
        return;
      }
      if(!$('learnerDeclaration')?.checked){
        setState('QA preview: confirm the learner declaration before testing Submit PCA.','error');
        return;
      }
      if(!window.confirm('Test the Submit PCA action in QA preview? No learner submission or evidence will be recorded.'))return;
      const state=$('submissionState');
      if(state)state.textContent='Submitted · QA preview';
      setState('QA preview: Submit PCA action tested successfully. No learner submission or evidence was recorded.');
    },true);

    return true;
  }

  function watch(){
    enableQaActions();
    const notice=$('qaPreviewNotice');
    if(notice){
      const observer=new MutationObserver(()=>enableQaActions());
      observer.observe(notice,{attributes:true,attributeFilter:['hidden']});
    }
    const shell=$('pcaShell');
    if(shell){
      const observer=new MutationObserver(()=>enableQaActions());
      observer.observe(shell,{subtree:true,attributes:true,attributeFilter:['hidden','disabled','data-locked']});
    }
    setTimeout(enableQaActions,400);
    setTimeout(enableQaActions,1200);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);
  else watch();
})();
