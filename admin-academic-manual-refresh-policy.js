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

function manualChannel(name){
  return {
    topic:name,
    on(){return this},
    subscribe(callback){
      try{callback?.('MANUAL_REFRESH_ONLY')}catch(_){ }
      return this;
    },
    unsubscribe(){return Promise.resolve('ok')}
  };
}

const supa=window.supabase;
if(!supa?.createClient)return;
const original=supa.createClient.bind(supa);
if(original.__fundaAcademicManualWrapped)return;

function wrappedCreateClient(...args){
  const client=original(...args);
  if(client&&!client.__fundaAcademicManualPatched&&typeof client.channel==='function'){
    const realChannel=client.channel.bind(client);
    client.channel=function(name,...rest){
      if(academicChannels.has(String(name||'')))return manualChannel(name);
      return realChannel(name,...rest);
    };
    client.__fundaAcademicManualPatched=true;
  }
  return client;
}
wrappedCreateClient.__fundaAcademicManualWrapped=true;
supa.createClient=wrappedCreateClient;
})();