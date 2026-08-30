(()=>{
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaHrLeaveLiveFix)return;
window.__fundaHrLeaveLiveFix=true;
let db,busy=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v||'').toLowerCase();
const fmt=v=>v?new Date(v).toLocaleString('en-ZA'):'—';
function client(){return db||(db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY))}
function hrActive(){let b=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');return !!b&&/hr|team|human resources/i.test(b.textContent)}
function leaveActive(){let b=document.querySelector('[data-hr-tab="leave"]');return !!b&&!b.classList.contains('alt')}
async function getData(){
  const c=client(); if(!c)return {leave:[],profiles:[]};
  const [lr,pr]=await Promise.all([
    c.from('hr_leave_requests').select('*').order('requested_at',{ascending:false}).limit(2000),
    c.from('profiles').select('id,full_name,email').limit(3000)
  ]);
  if(lr.error)console.error('HR leave load failed',lr.error);
  return {leave:lr.data||[],profiles:pr.data||[]};
}
function person(map,id,fallback='Staff'){let p=map.get(String(id));return p?.full_name||p?.email||fallback}
async function patch(){
  if(busy||!hrActive())return; busy=true;
  try{
    const {leave,profiles}=await getData();
    const map=new Map(profiles.map(p=>[String(p.id),p]));
    const pending=leave.filter(x=>low(x.status)==='pending').length;
    document.querySelectorAll('.hrCard').forEach(card=>{
      const label=card.querySelector('span');
      if(label&&/pending leave/i.test(label.textContent||'')){let n=card.querySelector('strong');if(n)n.textContent=String(pending)}
    });
    if(!leaveActive())return;
    const table=document.querySelector('.hrPanel .hrTable');
    if(!table)return;
    const rows=leave.map(x=>`<tr><td><b>${esc(person(map,x.profile_id))}</b><div class="hrMeta">${esc(x.reason||'')}</div></td><td>${esc(x.leave_type)}</td><td>${esc(x.start_date)} → ${esc(x.end_date)}</td><td><span class="hrPill ${low(x.status)}">${esc(String(x.status||'').toUpperCase())}</span></td><td>${esc(person(map,x.requested_by,'Self / system'))}<div class="hrMeta">${fmt(x.requested_at)}</div></td><td>${x.reviewed_by?esc(person(map,x.reviewed_by,'Reviewer'))+'<div class="hrMeta">'+fmt(x.reviewed_at)+'</div>':'—'}</td><td>${low(x.status)==='pending'?`<button class="hrBtn" data-live-leave-action="approved" data-id="${x.id}">Approve</button> <button class="hrBtn bad" data-live-leave-action="rejected" data-id="${x.id}">Reject</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="7">No leave requests recorded.</td></tr>';
    table.innerHTML='<tr><th>Staff</th><th>Leave type</th><th>Dates</th><th>Status</th><th>Requested by</th><th>Reviewed by</th><th>Action</th></tr>'+rows;
  }finally{busy=false}
}
async function review(id,status){
  const c=client(); if(!c)return;
  let notes=prompt(status==='approved'?'Approval note (optional):':'Reason for rejection:','')||'';
  if(status==='rejected'&&!notes.trim())return alert('Please record a reason for rejection.');
  const {data:{user},error:ue}=await c.auth.getUser();
  if(ue||!user)return alert('Your admin session could not be verified.');
  let r=await c.from('hr_leave_requests').update({status,reviewed_by:user.id,reviewed_at:new Date().toISOString(),review_notes:notes}).eq('id',id).eq('status','pending');
  if(r.error)return alert('Leave request could not be reviewed: '+r.error.message);
  try{await c.from('hr_audit_log').insert({actor_id:user.id,action:'leave_request_'+status,entity_type:'hr_leave_request',entity_id:id,details:{notes,reviewed_by:user.id}})}catch(e){}
  await patch();
}
document.addEventListener('click',e=>{
  const action=e.target.closest?.('[data-live-leave-action]');
  if(action){e.preventDefault();e.stopPropagation();review(action.dataset.id,action.dataset.liveLeaveAction);return}
  const tab=e.target.closest?.('[data-hr-tab="leave"]');
  const refresh=e.target.closest?.('#hrRefresh');
  const nav=e.target.closest?.('#nav button,.nav button');
  if(tab||refresh||(nav&&/hr|team|human resources/i.test(nav.textContent||'')))setTimeout(patch,180);
},true);
window.addEventListener('focus',()=>setTimeout(patch,120));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(patch,120)});
setTimeout(patch,900);
})();