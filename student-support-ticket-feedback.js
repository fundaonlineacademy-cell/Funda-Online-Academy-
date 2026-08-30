(()=>{
 if(window.__fundaTicketFeedback)return;window.__fundaTicketFeedback=true;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
 let busy=false;
 async function submit(btn){
  if(busy)return;
  const subject=document.getElementById('sspSubject')?.value.trim();
  const notes=document.getElementById('sspNotes')?.value.trim();
  const category=document.getElementById('sspCat')?.value||'General';
  const priority=document.getElementById('sspPriority')?.value||'normal';
  if(!subject||!notes){
    showInline('Please add a subject and explain your query.',false);return;
  }
  busy=true;btn.disabled=true;btn.textContent='Submitting ticket…';
  try{
    const db=window.supabase?.createClient?.(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    if(!db)throw new Error('Student Support is temporarily unavailable.');
    const {data:{session}}=await db.auth.getSession();
    if(!session)throw new Error('Your login session has expired. Please sign in again.');
    const {data,error}=await db.from('support_tickets').insert({student_id:session.user.id,subject,category,priority,status:'open',notes}).select('id,subject,category,priority,status,created_at').single();
    if(error)throw error;
    try{await db.from('support_ticket_events').insert({ticket_id:data.id,actor_id:session.user.id,event_type:'ticket_created',to_status:'open',details:'Student submitted support ticket'});}catch(_){ }
    const box=document.querySelector('#sspModal .sspBox');
    if(box){
      box.innerHTML=`<div style="text-align:center;padding:18px 8px 8px"><div style="width:64px;height:64px;border-radius:50%;display:grid;place-items:center;margin:0 auto;background:#e5f6ef;color:#176b50;font-size:30px;font-weight:900">✓</div><div class="sspKicker" style="margin-top:16px">TICKET SUBMITTED</div><h2 style="color:#071d49;margin:7px 0 8px;font-size:24px">Your support ticket has been received</h2><p style="color:#5d6b7f;font-size:13px;line-height:1.65;margin:0 auto;max-width:520px">Student Support can now see your <strong>${esc(category)}</strong> query. You can track replies and status changes from your dashboard.</p><div style="margin:18px auto 0;max-width:520px;text-align:left;border:1px solid #dbe6f2;border-radius:14px;padding:14px;background:#f9fbff"><div style="font-size:10px;color:#718096;font-weight:800;text-transform:uppercase;letter-spacing:.08em">Ticket reference</div><div style="margin-top:4px;color:#071d49;font-weight:900;word-break:break-all">${esc(data.id)}</div><div style="margin-top:9px;font-size:12px;color:#46556d"><strong>${esc(subject)}</strong> · ${esc(priority.toUpperCase())}</div></div><button id="sspSuccessClose" class="sspBtn" style="margin-top:18px">Back to Dashboard</button></div>`;
      document.getElementById('sspSuccessClose').onclick=()=>location.reload();
      setTimeout(()=>{if(document.getElementById('sspModal'))location.reload();},2200);
    } else location.reload();
  }catch(e){
    busy=false;btn.disabled=false;btn.textContent='Submit Ticket';
    showInline('Could not submit ticket: '+(e.message||'Please try again.'),false);
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