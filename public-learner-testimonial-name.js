(()=>{
  if(window.__fundaLearnerTestimonialNameFixV2)return;
  window.__fundaLearnerTestimonialNameFixV2=true;

  const NAME='Aphelele Ngilana';
  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  const isPlaceholder=v=>/^SAMPLE\s+LEARNER\s+FEEDBACK$/i.test(norm(v));

  function findCard(el){
    let cur=el;
    while(cur&&cur!==document.body){
      const txt=norm(cur.textContent);
      if(/LEARNER\s+EXPERIENCE/i.test(txt)&&/FLEXIBLE,?\s+PRACTICAL\s+AND\s+EASY\s+TO\s+FOLLOW/i.test(txt))return cur;
      cur=cur.parentElement;
    }
    return null;
  }

  function patchRoot(root){
    let changed=false;
    const scope=root||document;
    const elements=[...scope.querySelectorAll('*')];

    // Handles both a normal text node and wording split across nested spans.
    const labels=elements.filter(el=>isPlaceholder(el.textContent)&&![...el.children].some(ch=>isPlaceholder(ch.textContent)));
    for(const label of labels){
      const card=findCard(label);
      label.textContent=NAME;
      changed=true;
      if(card){
        const candidates=[...card.querySelectorAll('div,span,p')].filter(el=>norm(el.textContent)==='F'&&el.children.length===0);
        const avatar=candidates.find(el=>{
          const s=getComputedStyle(el);
          const r=parseFloat(s.borderRadius)||0;
          const rect=el.getBoundingClientRect();
          return r>=18||s.borderRadius==='50%'||(rect.width>0&&Math.abs(rect.width-rect.height)<4&&r>=rect.width*.35);
        })||candidates[0];
        if(avatar)avatar.textContent='A';
      }
    }

    // Independent avatar repair in case the name was already changed first.
    for(const el of elements){
      const txt=norm(el.textContent);
      if(!/LEARNER\s+EXPERIENCE/i.test(txt)||!/APHELELE\s+NGILANA/i.test(txt)||!/FLEXIBLE,?\s+PRACTICAL\s+AND\s+EASY\s+TO\s+FOLLOW/i.test(txt))continue;
      const candidates=[...el.querySelectorAll('div,span')].filter(x=>norm(x.textContent)==='F'&&x.children.length===0);
      const avatar=candidates.find(x=>{
        const s=getComputedStyle(x),r=parseFloat(s.borderRadius)||0,rect=x.getBoundingClientRect();
        return r>=18||s.borderRadius==='50%'||(rect.width>0&&Math.abs(rect.width-rect.height)<4&&r>=rect.width*.35);
      })||candidates[0];
      if(avatar){avatar.textContent='A';changed=true}
      break;
    }

    elements.forEach(el=>{if(el.shadowRoot)changed=patchRoot(el.shadowRoot)||changed});
    return changed;
  }

  function start(){
    patchRoot(document);
    let runs=0;
    const timer=setInterval(()=>{runs++;patchRoot(document);if(runs>=120)clearInterval(timer)},500);
    const observer=new MutationObserver(()=>patchRoot(document));
    observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    setTimeout(()=>observer.disconnect(),60000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

// Funda Online Academy transparent logo — homepage header and login brand placements only.
(()=>{
  const path=(location.pathname||'/').toLowerCase();
  const isHome=path==='/'||path.endsWith('/index.html');
  const isLogin=path.endsWith('/login.html');
  if(!isHome&&!isLogin)return;

  async function loadTransparentLogo(){
    try{
      const files=[0,1,2,3,4].map(i=>`funda-logo-transparent-${i}.b64`);
      const parts=await Promise.all(files.map(async file=>{
        const response=await fetch(file,{cache:'force-cache'});
        if(!response.ok)throw new Error(`Logo asset ${file} failed`);
        return (await response.text()).trim();
      }));
      return `data:image/png;base64,${parts.join('')}`;
    }catch(err){
      console.warn('Funda transparent logo could not be loaded',err);
      return null;
    }
  }

  async function applyTransparentLogo(){
    const src=await loadTransparentLogo();
    if(!src)return;

    if(isHome){
      const logo=document.querySelector('header img[alt="Funda Online Academy"]');
      if(logo){
        logo.src=src;
        logo.style.width='48px';
        logo.style.height='48px';
        logo.style.objectFit='contain';
        logo.style.background='transparent';
      }
      return;
    }

    if(isLogin){
      const logos=[...document.querySelectorAll('img[alt="Funda Online Academy"]')];
      logos.forEach(logo=>{
        logo.src=src;
        logo.style.width='64px';
        logo.style.height='64px';
        logo.style.objectFit='contain';
        logo.style.background='transparent';
      });
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyTransparentLogo,{once:true});
  else applyTransparentLogo();
})();
