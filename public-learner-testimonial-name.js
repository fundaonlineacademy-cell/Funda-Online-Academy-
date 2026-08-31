(()=>{
  if(window.__fundaLearnerTestimonialNameFix)return;
  window.__fundaLearnerTestimonialNameFix=true;
  const NAME='Aphelele Ngilana';
  const PLACEHOLDER=/^SAMPLE\s+LEARNER\s+FEEDBACK$/i;
  function patch(){
    let changed=false;
    const walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(PLACEHOLDER.test(String(node.nodeValue||'').trim())){
        node.nodeValue=node.nodeValue.replace(/SAMPLE\s+LEARNER\s+FEEDBACK/i,NAME);
        const card=node.parentElement?.closest('section,article,div');
        if(card && /LEARNER\s+EXPERIENCE/i.test(card.textContent||'')){
          const candidates=[...card.querySelectorAll('div,span')].filter(el=>String(el.textContent||'').trim()==='F' && el.children.length===0);
          const avatar=candidates.find(el=>{const s=getComputedStyle(el);return s.borderRadius==='50%'||parseFloat(s.borderRadius)>=20})||candidates[0];
          if(avatar)avatar.textContent='A';
        }
        changed=true;
      }
    }
    return changed;
  }
  function start(){
    patch();
    let count=0;
    const timer=setInterval(()=>{count++;if(patch()||count>=30)clearInterval(timer)},300);
    const observer=new MutationObserver(()=>patch());
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    setTimeout(()=>observer.disconnect(),15000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
