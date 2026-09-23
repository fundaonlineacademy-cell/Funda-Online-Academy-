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

// Academic data is manual-only. Patch the shared client and every future client,
// but do not schedule, nudge, poll or redraw the Academic workspace.
patchClient(window.__fundaSharedSupabaseClient);

const supa=window.supabase;
if(supa?.createClient&&!supa.createClient.__fundaAcademicManualWrapped){
  const original=supa.createClient.bind(supa);
  function wrappedCreateClient(...args){return patchClient(original(...args))}
  wrappedCreateClient.__fundaAcademicManualWrapped=true;
  supa.createClient=wrappedCreateClient;
}

window.FundaAcademicManualRefreshPolicy={
  patchClient,
  isManualEvent(event){return event?.detail?.source==='manual'}
};
})();