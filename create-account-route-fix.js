(()=>{
if(window.__fundaCreateAccountRouteFix)return;window.__fundaCreateAccountRouteFix=true;
function rewrite(root=document){
 root.querySelectorAll?.('a[href]').forEach(a=>{
  const raw=a.getAttribute('href')||'';
  if(/^auth\.html(?:\?|#|$)/i.test(raw)){
   const u=new URL(raw,location.href);const next=u.searchParams.get('next');
   a.setAttribute('href',`create-account.html${next?`?next=${encodeURIComponent(next)}`:''}`);
  }
 });
}
function clarifyLoginAccountLabel(root=document){
 if(!/(^|\/)login\.html$/i.test(location.pathname))return;
 root.querySelectorAll?.('a').forEach(a=>{
  const spans=[...a.querySelectorAll('span')];
  const label=spans.find(span=>/^New to Funda\?\s*Create Student Account$/i.test((span.textContent||'').replace(/\s+/g,' ').trim()));
  if(label)label.textContent='New to Funda Online Academy? Create Student Account';
 });
}
function boot(){
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