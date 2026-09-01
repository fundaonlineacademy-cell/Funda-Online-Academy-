// FUNDA ONLINE ACADEMY — SITE-WIDE TEXT CONTRAST
// Makes ordinary reading text pure black on light surfaces and pure white on dark
// surfaces without changing backgrounds, spacing, layout or font sizes.
(()=>{
  'use strict';
  if(window.__fundaTextContrast)return;
  window.__fundaTextContrast=true;

  const TARGET=7.5;
  const readingTags=new Set(['P','LI','TD','TH','DD','DT','BLOCKQUOTE','LABEL','SMALL']);
  const excluded=new Set(['SCRIPT','STYLE','NOSCRIPT','SVG','PATH','META','LINK','IMG','VIDEO','CANVAS','IFRAME']);
  const style=document.createElement('style');
  style.id='fundaTextContrastStyle';
  style.textContent=`
    html body .funda-strong-text.funda-strong-text{color:var(--funda-strong-color)!important}
    input:not([type="color"]),textarea,select{color:#000000!important}
    input::placeholder,textarea::placeholder{color:#000000!important;opacity:1!important}
  `;
  document.head.appendChild(style);

  function parseColor(value){
    const m=String(value||'').match(/rgba?\(\s*([\d.]+)[, ]+\s*([\d.]+)[, ]+\s*([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)/i);
    return m?{r:+m[1],g:+m[2],b:+m[3],a:m[4]===undefined?1:+m[4]}:null;
  }
  const channel=n=>{n=n/255;return n<=.04045?n/12.92:Math.pow((n+.055)/1.055,2.4)};
  const luminance=c=>.2126*channel(c.r)+.7152*channel(c.g)+.0722*channel(c.b);
  const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  function gradientSurface(image){
    if(!image||image==='none')return null;
    const colors=[...image.matchAll(/rgba?\([^)]*\)/gi)].map(x=>parseColor(x[0])).filter(x=>x&&x.a>.25);
    if(!colors.length)return null;
    return colors.reduce((a,c)=>({r:a.r+c.r/colors.length,g:a.g+c.g/colors.length,b:a.b+c.b/colors.length,a:1}),{r:0,g:0,b:0,a:1});
  }
  function surfaceFor(el){
    let node=el;
    while(node&&node.nodeType===1){
      const css=getComputedStyle(node),solid=parseColor(css.backgroundColor);
      if(solid&&solid.a>=.82)return solid;
      const gradient=gradientSurface(css.backgroundImage);
      if(gradient)return gradient;
      node=node.parentElement;
    }
    return {r:255,g:255,b:255,a:1};
  }
  const strongColor=bg=>luminance(bg)>.42?'#000000':'#ffffff';
  function eligible(el){
    if(!el||excluded.has(el.tagName)||el.closest('[aria-hidden="true"],.sr-only,.hidden,[hidden]'))return false;
    const css=getComputedStyle(el);
    if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)<.35)return false;
    return true;
  }
  function improve(el){
    if(!eligible(el)||el.classList.contains('funda-strong-text'))return;
    const css=getComputedStyle(el),fg=parseColor(css.color),bg=surfaceFor(el),weight=parseInt(css.fontWeight,10)||400;
    if(!fg||fg.a<.5)return;
    const ordinaryReadingText=readingTags.has(el.tagName)||weight<700;
    if(!ordinaryReadingText&&contrast(fg,bg)>=TARGET)return;
    el.style.setProperty('--funda-strong-color',strongColor(bg));
    el.classList.add('funda-strong-text');
  }
  function scan(root=document.body){
    if(!root)return;
    const seen=new Set(),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){return node.nodeValue&&node.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
    let node;
    while((node=walker.nextNode())){const el=node.parentElement;if(el&&!seen.has(el)){seen.add(el);improve(el)}}
  }
  let timer;
  const schedule=root=>{clearTimeout(timer);timer=setTimeout(()=>scan(root?.nodeType===1?root:document.body),80)};
  const boot=()=>{
    scan();
    const observer=new MutationObserver(records=>{const added=records.find(r=>r.addedNodes?.length)?.target;schedule(added||document.body)});
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
