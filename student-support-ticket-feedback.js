(()=>{
 if(window.__fundaTicketFeedback)return;window.__fundaTicketFeedback=true;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 let busy=false;
 const SHOT_BUCKET='support-ticket-screenshots',MAX_SHOT_SIZE=5*1024*1024,SHOT_TYPES=['image/jpeg','image/png','image/webp'];
 function makeId(){if(globalThis.crypto?.randomUUID)return crypto.randomUUID();let bytes=new Uint8Array(16);if(globalThis.crypto?.getRandomValues)crypto.getRandomValues(bytes);else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;let hex=[...bytes].map(v=>v.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`}
 function screenshotProblem(file){if(!file)return 'A screenshot is required for every support ticket.';if(!SHOT_TYPES.includes(file.type))return 'Please use a JPG, PNG or WebP screenshot.';if(file.size>MAX_SHOT_SIZE)return 'The screenshot must be 5 MB or smaller.';if(file.size<1)return 'The selected screenshot is empty.';return ''}
 async function submit(btn){
  if(busy)return;
  const subject=document.getElementById('sspSubject')?.value.trim();
  const notes=document.getElementById('sspNotes')?.value.trim();
  const category=document.getElementById('sspCat')?.value||'General';
  const priority=document.getElementById('sspPriority')?.value||'normal';
  const file=document.getElementById('sspScreenshot')?.files?.[0];
  if(!subject||!notes){
    showInline('Please add a subject and explain your query.',false);return;
  }
  const fileProblem=screenshotProblem(file);
  if(fileProblem){showInline(fileProblem,false);return;}
  busy=true;btn.disabled=true;btn.textContent='Uploading screenshot…';
  let db,uploadedPath='';
  try{
    db=window.supabase?.createClient?.(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    if(!db)throw new Error('Student Support is temporarily unavailable.');
    const {data:{session}}=await db.auth.getSession();
    if(!session)throw new Error('Your login session has expired. Please sign in again.');
    const ticketId=makeId(),extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    uploadedPath=`${session.user.id}/${ticketId}/screenshot-${Date.now()}.${extension}`;
    const uploaded=await db.storage.from(SHOT_BUCKET).upload(uploadedPath,file,{contentType:file.type,cacheControl:'3600',upsert:false});
    if(uploaded.error)throw new Error('Could not upload screenshot: '+uploaded.error.message);
    btn.textContent='Submitting ticket…';
    const {data,error}=await db.from('support_tickets').insert({id:ticketId,student_id:session.user.id,subject,category,priority,status:'open',notes,screenshot_required:true,screenshot_path:uploadedPath,screenshot_name:file.name,screenshot_mime_type:file.type,screenshot_size:file.size}).select('id,subject,category,priority,status,created_at').single();
    if(error)throw error;
    try{await db.from('support_ticket_events').insert({ticket_id:data.id,actor_id:session.user.id,event_type:'ticket_created',to_status:'open',details:'Student submitted support ticket with required screenshot'});}catch(_){ }
    const box=document.querySelector('#sspModal .sspBox');
    if(box){
      box.innerHTML=`<div style="text-align:center;padding:18px 8px 8px"><div style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto;background:#e5f6ef;color:#176b50;font-size:30px;font-weight:900">✓</div><div class="sspKicker" style="margin-top:16px">TICKET SUBMITTED</div><h2 style="color:#071d49;margin:7px 0 8px;font-size:24px">Your support ticket has been received</h2><p style="color:#000;font-size:13px;line-height:1.65;margin:0 auto;max-width:520px">Student Support can now see your <strong>${esc(category)}</strong> query and the attached screenshot. You can track replies and status changes from your dashboard.</p><div style="margin:18px auto 0;max-width:520px;text-align:left;border:1px solid #dbe6f2;border-radius:14px;padding:14px;background:#f9fbff"><div style="font-size:10px;color:#000;font-weight:800;text-transform:uppercase;letter-spacing:.08em">Ticket reference</div><div style="margin-top:4px;color:#071d49;font-weight:900;word-break:break-all">${esc(data.id)}</div><div style="margin-top:9px;font-size:12px;color:#000"><strong>${esc(subject)}</strong> · ${esc(priority.toUpperCase())} · Screenshot included</div></div><button id="sspSuccessClose" class="sspBtn" style="margin-top:18px">Back to Dashboard</button></div>`;
      document.getElementById('sspSuccessClose').onclick=()=>location.reload();
      setTimeout(()=>{if(document.getElementById('sspModal'))location.reload();},2200);
    } else location.reload();
  }catch(e){
    if(uploadedPath&&db)try{await db.storage.from(SHOT_BUCKET).remove([uploadedPath]);}catch(_){ }
    busy=false;btn.disabled=false;btn.textContent='Submit Ticket with Screenshot';
    const message=e.message||'Please try again.';
    showInline(message.startsWith('Could not ')||message.startsWith('Your ')||message.startsWith('Student Support')?message:'Could not submit ticket: '+message,false);
  }
 }
 function showInline(text,ok){
   let form=document.querySelector('#sspModal .sspForm');if(!form)return alert(text);
   let note=document.getElementById('sspFeedback');
   if(!note){note=document.createElement('div');note.id='sspFeedback';form.prepend(note);}
   note.textContent=text;note.style.cssText=`padding:11px 12px;border-radius:10px;font-size:12px;font-weight:700;${ok?'background:#e5f6ef;color:#176b50;border:1px solid #bfe8d8':'background:#fff1f2;color:#9f1239;border:1px solid #fecdd3'}`;
 }
 function patch(){
   const btn=document.getElementById('sspSubmit');
   if(!btn||btn.dataset.feedbackPatched)return;
   btn.dataset.feedbackPatched='1';
   btn.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();submit(btn);};
 }
 const obs=new MutationObserver(patch);obs.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();
