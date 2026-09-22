(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaAcademicManualRefreshPolicy)return;
window.__fundaAcademicManualRefreshPolicy=true;
window.__fundaAcademicRefreshMode='manual-only';

const academicChannels=new Set([
  'admin-academic-qa-live-v2',
  'admin-course-qa-review-live-v1',
  'admin-course-inspector-live-v1',
  'admin-academic-integrity-live-v1'
]);

function inertAcademicChannel(name){
  return {
    topic:String(name||''),
    on(){return this},
    subscribe(){return this},
    unsubscribe(){return Promise.resolve('ok')}
  };
}

function patchClient(client){
  if(!client||client.__fundaAcademicManualPatched||typeof client.channel!=='function')return client;
  try{
    const existing=typeof client.getChannels==='function'?client.getChannels():[];
    existing.forEach(ch=>{
      const topic=String(ch?.topic||'').replace(/^realtime:/,'');
      if(academicChannels.has(topic)&&typeof client.removeChannel==='function'){
        try{client.removeChannel(ch)}catch(_){ }
      }
    });
  }catch(_){ }
  const realChannel=client.channel.bind(client);
  client.channel=function(name,...rest){
    if(academicChannels.has(String(name||'')))return inertAcademicChannel(name);
    return realChannel(name,...rest);
  };
  client.__fundaAcademicManualPatched=true;
  return client;
}

// The Academic modules use the shared client created by supabase-config.js.
// Patch that existing client first; the previous implementation only patched
// future createClient() calls and therefore did not actually stop Realtime.
patchClient(window.__fundaSharedSupabaseClient);

const supa=window.supabase;
if(supa?.createClient&&!supa.createClient.__fundaAcademicManualWrapped){
  const original=supa.createClient.bind(supa);
  function wrappedCreateClient(...args){return patchClient(original(...args))}
  wrappedCreateClient.__fundaAcademicManualWrapped=true;
  supa.createClient=wrappedCreateClient;
}

function academicActive(){
  const b=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');
  return !!b&&/academic/i.test(String(b.textContent||''));
}

function displayedCourseCount(){
  const cards=[...document.querySelectorAll('#view .aqCard')];
  const card=cards.find(c=>/\bcourses\b/i.test(c.textContent||''));
  const n=Number(String(card?.querySelector('strong')?.textContent||'').replace(/[^0-9.-]/g,''));
  return Number.isFinite(n)?n:null;
}

function nudgeMissingPanels(){
  if(!academicActive())return;
  const view=document.getElementById('view');
  if(!view||!view.querySelector('.aqHero'))return;
  const expected=['cqaWorkspace','aciWorkspace','academicIntegrityPanel','academicDocumentsPanel','academicDocumentStudios'];
  if(expected.every(id=>document.getElementById(id)))return;
  // Existing Academic modules already know how to mount themselves when the
  // Academic view changes. Trigger that mount path once without redrawing UI.
  const marker=document.createComment('academic-stable-mount');
  view.appendChild(marker);
  marker.remove();
}

let cycle=0;
async function stabiliseAcademic(myCycle){
  if(myCycle!==cycle||!academicActive())return;
  patchClient(window.__fundaSharedSupabaseClient);
  const db=window.__fundaSharedSupabaseClient;
  let actualCourses=null;
  if(db){
    try{
      const r=await db.from('courses').select('id',{count:'exact',head:true});
      if(!r.error)actualCourses=Number(r.count||0);
    }catch(_){ }
  }
  if(myCycle!==cycle||!academicActive())return;
  const hero=document.querySelector('#view .aqHero');
  const shown=displayedCourseCount();
  const badZero=actualCourses>0&&shown===0;
  if((!hero||badZero)&&window.FundaAcademicQA?.open){
    try{await window.FundaAcademicQA.open()}catch(e){console.error('Academic initial load recovery failed',e)}
  }
  if(myCycle!==cycle||!academicActive())return;
  nudgeMissingPanels();
  setTimeout(()=>{if(myCycle===cycle)nudgeMissingPanels()},350);
}

function queueStability(){
  const my=++cycle;
  setTimeout(()=>stabiliseAcademic(my),650);
  setTimeout(()=>stabiliseAcademic(my),1500);
}

document.addEventListener('click',e=>{
  const b=e.target.closest?.('#nav button,.nav button');
  if(b&&/academic/i.test(String(b.textContent||'')))queueStability();
},true);

document.addEventListener('funda:admin-manual-refresh',()=>{
  if(academicActive())queueStability();
});

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{if(academicActive())queueStability()},{once:true});
}else if(academicActive())queueStability();
})();