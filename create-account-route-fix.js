(()=>{
if(window.__fundaCreateAccountRouteFix)return;window.__fundaCreateAccountRouteFix=true;
function rememberRequestedCourse(){
 try{
  const next=new URLSearchParams(location.search).get('next');
  if(!next)return;
  const requested=new URL(next,location.href);
  let course='';
  if(/onboarding\.html$/i.test(requested.pathname))course=requested.searchParams.get('course')||'';
  if(/course-view\.html$/i.test(requested.pathname))course=requested.searchParams.get('id')||'';
  course=String(course).trim();
  if(course)localStorage.setItem('funda_pending_course',JSON.stringify({id:course,source:'requested-route',saved_at:new Date().toISOString()}));
 }catch(e){}
}
function rewrite(root=document){
 root.querySelectorAll?.('a[href]').forEach(a=>{
  const raw=a.getAttribute('href')||'';
  if(/^auth\.html(?:\?|#|$)/i.test(raw)){
   try{
    const source=new URL(raw,location.href);
    const target=new URL('create-account.html',location.href);
    source.searchParams.forEach((value,key)=>target.searchParams.append(key,value));
    target.hash=source.hash;
    a.setAttribute('href',target.pathname.split('/').pop()+target.search+target.hash);
   }catch(e){
    a.setAttribute('href','create-account.html');
   }
  }
 });
}
function clarifyLoginAccountLabel(root=document){
 if(!/(^|\/)login\.html$/i.test(location.pathname))return;
 root.querySelectorAll?.('a').forEach(a=>{
  const text=(a.textContent||'').replace(/\s+/g,' ').trim();
  if(!/New to Funda\?\s*Create Student Account/i.test(text))return;
  const walker=document.createTreeWalker(a,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
   if(/New to Funda\?\s*Create Student Account/i.test(node.nodeValue||'')){
    node.nodeValue=(node.nodeValue||'').replace(/New to Funda\?\s*Create Student Account/i,'New to Funda Online Academy? Create Student Account');
   }
  }
 });
}
function boot(){
 rememberRequestedCourse();
 rewrite();
 clarifyLoginAccountLabel();
 new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{
  if(n.nodeType===1){
   if(n.matches?.('a[href]'))rewrite(n.parentElement||document);else rewrite(n);
   clarifyLoginAccountLabel(n.parentElement||document);
  }
 }))).observe(document.documentElement,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();