(()=>{
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
  const date = value => value
    ? new Date(value).toLocaleDateString('en-ZA',{day:'2-digit',month:'long',year:'numeric'})
    : '—';
  const inactiveStatuses = new Set([
    'revoked','inactive','invalid','cancelled','canceled','void','expired','suspended','withdrawn'
  ]);

  let db;

  function formatStatus(value){
    const text = String(value || 'VALID').trim();
    return text.replaceAll('_',' ').toUpperCase();
  }

  function isInactive(value){
    return inactiveStatuses.has(String(value || '').trim().toLowerCase());
  }

  function good(items){
    const result = $('result');
    result.className = 'result good';
    result.innerHTML = `<div class="status">✓ VERIFIED IN FUNDA ONLINE ACADEMY RECORDS</div><div class="grid">${items.map(item => `<div class="item"><b>${esc(item[0])}</b><span>${esc(item[1] ?? '—')}</span></div>`).join('')}</div>`;
  }

  function bad(message='No matching valid document was found. Check the number or verification code and try again.'){
    const result = $('result');
    result.className = 'result bad';
    result.innerHTML = `<strong>Document not verified</strong><p>${esc(message)}</p>`;
  }

  function loading(){
    const result = $('result');
    result.className = 'result checking';
    result.textContent = 'Checking Academy records…';
  }

  async function verify(){
    const code = $('code').value.trim().toUpperCase();
    const type = $('type').value;
    const button = $('verify');

    if(!code){
      bad('Enter a document number or verification code.');
      $('code').focus();
      return;
    }

    loading();
    button.disabled = true;
    button.textContent = 'Checking…';

    try{
      const isTranscript = type === 'transcript';
      const fn = isTranscript ? 'verify_transcript_public' : 'verify_certificate_public';
      const args = isTranscript ? {p_transcript_number:code} : {p_certificate_number:code};
      const {data,error} = await db.rpc(fn,args);
      if(error) throw error;

      const record = Array.isArray(data) ? data[0] : data;
      if(!record){
        bad(isTranscript
          ? 'No matching valid Statement of Results was found. Check the number and try again.'
          : 'No matching valid certificate was found. Check the number and try again.');
        return;
      }

      const rawStatus = isTranscript
        ? (record.transcript_status || record.document_status || record.status)
        : (record.certificate_status || record.document_status || record.status);

      if(isInactive(rawStatus)){
        bad(isTranscript
          ? 'This Statement of Results record exists, but it is not currently valid. Please contact Funda Online Academy if you need confirmation.'
          : 'This certificate record exists, but it is not currently valid. Please contact Funda Online Academy if you need confirmation.');
        return;
      }

      if(isTranscript){
        good([
          ['Statement Number', record.transcript_number || record.result_number || code],
          ['Current Status', formatStatus(rawStatus)],
          ['Learner', record.learner_name || 'Recorded learner'],
          ['Course', record.course_title || 'Recorded course'],
          ['Date Issued', date(record.issued_at || record.issued_date)]
        ]);
      }else{
        good([
          ['Certificate Number', record.certificate_number || code],
          ['Current Status', formatStatus(rawStatus)],
          ['Learner', record.learner_name || 'Recorded learner'],
          ['Course', record.course_title || 'Recorded course'],
          ['Date Issued', date(record.issued_at || record.issued_date)]
        ]);
      }
    }catch(error){
      console.error('Academic document verification failed:',error);
      bad('The verification service could not complete the check. Please try again.');
    }finally{
      button.disabled = false;
      button.textContent = 'Verify Document';
    }
  }

  function readQuery(){
    const query = new URLSearchParams(location.search);
    let type = query.get('type') === 'transcript' || query.get('type') === 'results'
      ? 'transcript'
      : 'certificate';
    let code = (query.get('code') || '').trim();

    if(!code && query.get('result')){
      type = 'transcript';
      code = query.get('result').trim();
    }
    if(!code && query.get('certificate')){
      type = 'certificate';
      code = query.get('certificate').trim();
    }
    if(!code && query.get('number')){
      code = query.get('number').trim();
      if(/^FOA-RES-/i.test(code)) type = 'transcript';
    }
    return {type,code};
  }

  function boot(){
    if(!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY){
      bad('Verification service is unavailable.');
      return;
    }

    db = window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);

    const form = $('verifyForm');
    if(form){
      form.addEventListener('submit',event => {
        event.preventDefault();
        verify();
      });
    }else{
      $('verify').addEventListener('click',verify);
      $('code').addEventListener('keydown',event => {
        if(event.key === 'Enter') verify();
      });
    }

    const initial = readQuery();
    $('type').value = initial.type;
    if(initial.code){
      $('code').value = initial.code;
      verify();
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded',boot,{once:true});
  }else{
    boot();
  }
})();
