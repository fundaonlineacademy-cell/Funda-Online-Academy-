(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname))return;
window.__fundaHrAuthoritativeLoader=true;

let db,D={},loadErrors=[],currentTab='team';
const PAGE_SIZE=10,pages={team:1,invitations:1,contracts:1,documents:1,leave:1,safety:1,training:1,performance:1,audit:1};
const $=x=>document.getElementById(x);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v||'').toLowerCase();
const fmt=v=>v?new Date(v).toLocaleString('en-ZA'):'—';

function active(){
  const b=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');
  return !!b&&/hr|team|human resources/i.test(b.textContent||'');
}
function css(){
  if($('hrSafeCss'))return;
  const s=document.createElement('style');
  s.id='hrSafeCss';
  s.textContent=`
  .hrHero{padding:20px;border-radius:15px;background:linear-gradient(135deg,#03101f,#0b315c);color:#fff;font-family:'Source Sans 3','Segoe UI',Arial,sans-serif}
  .hrHero b{color:#d6b45c;font-size:12px;letter-spacing:.12em}
  .hrHero h2{margin:5px 0;font-size:24px;line-height:1.2}
  .hrHero p{margin:0;color:#dce8f4;font-size:14px;line-height:1.55}
  .hrK{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:11px 0}
  .hrCard,.hrPanel{background:#fff;border:1px solid #e1dac9;border-radius:11px;padding:13px;font-family:'Source Sans 3','Segoe UI',Arial,sans-serif}
  .hrCard strong{display:block;font-size:21px;line-height:1.2;color:#071b31}
  .hrCard span,.hrMeta{font-size:12px;line-height:1.45;color:#64748b}
  .hrTabs,.hrBar{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}
  .hrBtn{border:0;border-radius:7px;padding:9px 11px;background:#071b31;color:#efd78e;font-size:13px;font-weight:800;line-height:1.2;cursor:pointer;font-family:'Source Sans 3','Segoe UI',Arial,sans-serif}
  .hrBtn.alt{background:#fff;color:#071b31;border:1px solid #d9d1bf}
  .hrBtn.bad{background:#9d2828;color:#fff}
  .hrBtn:disabled{opacity:.55;cursor:not-allowed}
  .hrInput,.hrSelect,.hrText{border:1px solid #d9d1bf;border-radius:8px;padding:9px 11px;font-size:14px;background:#fff;color:#10213f;font-family:'Source Sans 3','Segoe UI',Arial,sans-serif}
  .hrInput{min-width:180px;flex:1}
  .hrText{min-height:100px;width:100%;resize:vertical;box-sizing:border-box}
  .hrGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
  .hrTable{width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}
  .hrTable th,.hrTable td{padding:10px;border-bottom:1px solid #edf0f3;text-align:left;vertical-align:top}
  .hrTable th{font-size:11px;line-height:1.3;text-transform:uppercase;color:#64748b;letter-spacing:.03em}
  .hrPill{display:inline-block;padding:4px 8px;border-radius:99px;background:#edf2f7;font-size:11px;font-weight:800;line-height:1.2}
  .hrPill.active,.hrPill.accepted,.hrPill.approved,.hrPill.completed,.hrPill.closed,.hrPill.resolved{background:#e5f6ef;color:#176b50}
  .hrPill.pending,.hrPill.issued,.hrPill.in_progress,.hrPill.investigating,.hrPill.shared{background:#fff2d2;color:#8a5a05}
  .hrPill.rejected,.hrPill.declined,.hrPill.critical,.hrPill.high,.hrPill.terminated,.hrPill.open{background:#ffe7e7;color:#9d2828}
  .hrAlert{margin:10px 0;padding:11px 13px;border:1px solid #efcaca;border-radius:9px;background:#fff3f3;color:#8b2626;font-size:13px;line-height:1.5}
  .hrEvidence{margin-top:4px;font-size:12px;line-height:1.45;color:#475569}
  .hrEvidence a{color:#164b84;font-weight:700}
  .hrPager{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin:10px 0 2px}.hrPager span{font-size:12px;color:#64748b}.hrPager .hrBtn{min-width:82px}.hrPager .hrBtn:disabled{opacity:.45;cursor:not-allowed}
  .hrDeptGuide{margin-top:14px;border-top:1px solid #e6e9ee;padding-top:14px}
  .hrDeptGuide h3{margin:0 0 5px;color:#071b31;font-size:18px}
  .hrDeptGuide>p{margin:0 0 11px;color:#64748b;font-size:13px;line-height:1.5}
  .hrDeptGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .hrDeptCard{border:1px solid #e1dac9;border-radius:10px;padding:12px;background:#fbfcfe}
  .hrDeptCard h4{margin:0 0 5px;color:#071b31;font-size:14px}
  .hrDeptCard p{margin:0;color:#526275;font-size:13px;line-height:1.5}
  .hrDeptCard small{display:block;margin-top:6px;color:#64748b;font-size:12px;line-height:1.45}
  @media(max-width:1050px){.hrK{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:760px){.hrGrid{grid-template-columns:1fr}.hrK{grid-template-columns:repeat(2,1fr)}.hrDeptGrid{grid-template-columns:1fr}.hrTable{font-size:12px}.hrHero h2{font-size:21px}}
  `;
  document.head.appendChild(s);
}
async function load(){
  db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  if(!db)return;
  loadErrors=[];
  const specs=[
    ['profiles','id,full_name,email,role,staff_number,job_title,department,created_at','created_at'],
    ['staff_records','*','created_at'],
    ['staff_access_assignments','*','granted_at'],
    ['staff_invitations','id,email,full_name,staff_number,job_title,department,invited_user_id,invited_by,invitation_status,invited_at,accepted_at,notes','invited_at'],
    ['hr_contracts','*','created_at'],
    ['hr_documents','*','created_at'],
    ['hr_leave_requests','*','requested_at'],
    ['hr_safety_incidents','*','created_at'],
    ['hr_training_records','*','created_at'],
    ['hr_performance_reviews','*','created_at'],
    ['hr_audit_log','*','created_at']
  ];
  await Promise.all(specs.map(async([name,fields,order])=>{
    const r=await db.from(name).select(fields).order(order,{ascending:false}).limit(2000);
    if(r.error){
      loadErrors.push(name+': '+r.error.message);
      if(!Array.isArray(D[name]))D[name]=[];
      return;
    }
    D[name]=r.data||[];
  }));
}
const prof=id=>(D.profiles||[]).find(x=>x.id===id)||{};
const staff=()=>(D.profiles||[]).filter(p=>['admin','staff'].includes(low(p.role)));
async function me(){const {data:{user}}=await db.auth.getUser();return user}
function paged(items,key){
  const list=Array.isArray(items)?items:[];
  const totalPages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));
  pages[key]=Math.min(Math.max(1,pages[key]||1),totalPages);
  const start=(pages[key]-1)*PAGE_SIZE;
  return list.slice(start,start+PAGE_SIZE);
}
function pager(key,total,label='records'){
  const totalPages=Math.max(1,Math.ceil(Number(total||0)/PAGE_SIZE));
  const page=Math.min(Math.max(1,pages[key]||1),totalPages);
  if(total<=PAGE_SIZE)return '';
  return `<div class="hrPager"><span>Showing page ${page} of ${totalPages} · ${total} ${esc(label)}</span><button class="hrBtn alt" data-hr-page="${key}" data-hr-dir="-1" ${page<=1?'disabled':''}>Previous</button><button class="hrBtn alt" data-hr-page="${key}" data-hr-dir="1" ${page>=totalPages?'disabled':''}>Next</button></div>`;
}
function safeUrl(v){const s=String(v||'').trim();return /^https?:\/\//i.test(s)?s:''}
function evidenceText(v){
  if(!v||typeof v!=='object')return esc(v||'—');
  const parts=Object.entries(v).map(([k,val])=>`${esc(String(k).replaceAll('_',' '))}: ${esc(typeof val==='object'?JSON.stringify(val):val)}`);
  return parts.join('<br>')||'—';
}
async function audit(action,entity,id,subject,details){
  const u=await me();
  await db.from('hr_audit_log').insert({
    actor_id:u?.id||null,action,entity_type:entity,entity_id:String(id||''),
    subject_profile_id:subject||null,details
  });
}
function directory(){
  return paged(staff(),'team').map(p=>{
    const r=(D.staff_records||[]).find(x=>x.profile_id===p.id);
    const a=(D.staff_access_assignments||[]).filter(x=>x.profile_id===p.id&&x.active);
    const access=a.length
      ?a.map(x=>esc(x.department)+' · '+esc(x.access_level)+(x.can_approve?' · approval':'')).join('<br>')
      :low(p.role)==='admin'?'Executive / Admin access':'No active access assignment';
    return `<tr>
      <td><b>${esc(p.full_name||p.email)}</b><div class="hrMeta">${esc(p.email||'')}</div></td>
      <td>${esc(p.staff_number||'—')}</td>
      <td>${esc(p.job_title||r?.job_title||'—')}</td>
      <td>${esc(p.department||r?.department||'—')}</td>
      <td>${esc(r?.employment_status||'Active')}</td>
      <td>${access}</td>
      <td>${low(p.role)==='staff'?'<button class="hrBtn alt" data-manage-access="'+p.id+'">'+(a.length?'Update Access':'Set Access')+'</button>':'Executive / Admin'}</td>
    </tr>`;
  }).join('')||'<tr><td colspan="7">No staff records yet.</td></tr>';
}
function departmentGuide(){
  const departments=[
    ['Human Resources','Staff onboarding, contracts, leave, attendance, performance, training, workplace wellbeing and employment-compliance records.','Coordinates staff access with Management and IT; HR does not become a separate technical-security team.'],
    ['Finance & Accounting','Student payments, receivables, refunds, cashbook controls, income and expenses, financial records and reporting.','Also owns the financial side of Ambassador earnings and approved payouts.'],
    ['Academic, Assessments & Content','Curriculum, lessons, assessments, academic QA, results, transcripts, certificates and academic-content standards.','Owns Digital Library content quality and approval; IT owns the technical library platform.'],
    ['Enrolments & Courses','Student applications and enrolments, course access, course catalogue administration, enrolment decisions and governed course changes.','Works with Finance where payment verification affects enrolment approval.'],
    ['Student Support & CRM','Support tickets, consultations, learner follow-up, student experience, career/workplace support and graduate-employment support.','Owns learner-facing delivery of Employer & Industry opportunities after partnerships are established.'],
    ['Marketing & Admissions','Marketing campaigns, admissions leads, public course promotion, growth activity and external relationship development.','Primary home for Ambassador Programme recruitment/growth and Employer & Industry partner outreach; Finance owns payouts and Student Support owns learner delivery.'],
    ['Communication Hub','Official Academy notices, scheduled communications, student/staff announcements, email communication and message-delivery coordination.','Supports every department but does not replace the department responsible for the underlying issue.'],
    ['IT, Security & Platform','Platform reliability, authentication, technical access controls, security, integrations, backups/recovery evidence and technical automation.','Owns technical infrastructure for tools such as WhatsApp automation and the Digital Library platform.']
  ];
  return `<div class="hrDeptGuide"><h3>Department Responsibilities</h3><p>These are the Academy's existing operating departments. New functions are assigned into them rather than creating unnecessary new departments. A staff member's <b>job title</b> describes their role inside the selected department.</p><div class="hrDeptGrid">${departments.map(d=>`<div class="hrDeptCard"><h4>${esc(d[0])}</h4><p>${esc(d[1])}</p><small>${esc(d[2])}</small></div>`).join('')}</div><div class="hrMeta" style="margin-top:10px"><b>Executive / Management & Governance</b> remains an oversight function of the CEO/management rather than a new staff department. Reports, compliance and audit responsibilities stay with the department that owns the subject, with executive oversight.</div></div>`;
}
function contracts(){
  return paged(D.hr_contracts||[],'contracts').map(c=>`<tr>
    <td><b>${esc(c.contract_number)}</b><div class="hrMeta">${esc(c.title)}</div></td>
    <td>${esc(prof(c.profile_id).full_name||prof(c.profile_id).email||'Staff')}</td>
    <td>${esc(c.contract_type)}</td>
    <td><span class="hrPill ${low(c.status)}">${esc(String(c.status).toUpperCase())}</span></td>
    <td>${fmt(c.issued_at)}</td><td>${fmt(c.accepted_at)}</td>
    <td>${c.status==='draft'?`<button class="hrBtn" data-issue-contract="${c.id}">Issue</button>`:'—'}</td>
  </tr>`).join('')||'<tr><td colspan="7">No employment contracts recorded.</td></tr>';
}
function leaves(){
  return paged(D.hr_leave_requests||[],'leave').map(x=>`<tr>
    <td><b>${esc(prof(x.profile_id).full_name||prof(x.profile_id).email||'Staff')}</b><div class="hrMeta">${esc(x.reason||'')}</div></td>
    <td>${esc(x.leave_type)}</td><td>${esc(x.start_date)} → ${esc(x.end_date)}</td>
    <td><span class="hrPill ${low(x.status)}">${esc(String(x.status).toUpperCase())}</span></td>
    <td>${esc(prof(x.requested_by).full_name||prof(x.requested_by).email||'Self / system')}<div class="hrMeta">${fmt(x.requested_at)}</div></td>
    <td>${x.reviewed_by?esc(prof(x.reviewed_by).full_name||prof(x.reviewed_by).email||'Reviewer')+'<div class="hrMeta">'+fmt(x.reviewed_at)+'</div>':'—'}</td>
    <td>${low(x.status)==='pending'?`<button class="hrBtn" data-leave-action="approved" data-id="${x.id}">Approve</button> <button class="hrBtn bad" data-leave-action="rejected" data-id="${x.id}">Reject</button>`:'—'}</td>
  </tr>`).join('')||'<tr><td colspan="7">No leave requests recorded.</td></tr>';
}
function safety(){
  return paged(D.hr_safety_incidents||[],'safety').map(x=>{
    const st=low(x.status);
    const actions=!['resolved','closed'].includes(st)
      ?`<button class="hrBtn alt" data-safety-status="investigating" data-id="${x.id}">Investigate</button> <button class="hrBtn" data-safety-status="resolved" data-id="${x.id}">Resolve</button>`
      :st==='resolved'?`<button class="hrBtn alt" data-safety-status="closed" data-id="${x.id}">Close</button>`:'—';
    return `<tr>
      <td><b>${esc(x.title)}</b><div class="hrMeta">${esc(x.description)}</div>${x.action_taken?'<div class="hrEvidence"><b>Action taken:</b> '+esc(x.action_taken)+'</div>':''}</td>
      <td>${esc(prof(x.profile_id).full_name||'General / workplace')}</td>
      <td><span class="hrPill ${low(x.severity)}">${esc(String(x.severity).toUpperCase())}</span></td>
      <td><span class="hrPill ${st}">${esc(String(x.status).toUpperCase())}</span></td>
      <td>${fmt(x.occurred_at||x.created_at)}</td>
      <td>${x.resolved_at?fmt(x.resolved_at):'—'}</td>
      <td>${actions}</td>
    </tr>`;
  }).join('')||'<tr><td colspan="7">No staff safety incidents recorded.</td></tr>';
}
function training(){
  const tr=paged(D.hr_training_records||[],'training').map(x=>`<tr>
    <td>${esc(prof(x.profile_id).full_name||prof(x.profile_id).email||'Staff')}</td>
    <td><b>${esc(x.training_name)}</b><div class="hrMeta">${esc(x.provider||'')}</div></td>
    <td>${esc(x.status)}</td><td>${esc(x.completed_on||'—')}</td><td>${esc(x.expires_on||'—')}</td>
  </tr>`).join('');
  const pr=paged(D.hr_performance_reviews||[],'performance').map(x=>`<tr>
    <td>${esc(prof(x.profile_id).full_name||prof(x.profile_id).email||'Staff')}</td>
    <td>${esc(x.review_period)}</td><td>${esc(x.rating??'—')}</td><td>${esc(x.status)}</td><td>${fmt(x.reviewed_at)}</td>
  </tr>`).join('');
  return `<h3>Training & Competency</h3><table class="hrTable"><tr><th>Staff</th><th>Training</th><th>Status</th><th>Completed</th><th>Expires</th></tr>${tr||'<tr><td colspan="5">No training records yet.</td></tr>'}</table>${pager('training',(D.hr_training_records||[]).length,'training records')}<h3 style="margin-top:18px">Performance Reviews</h3><table class="hrTable"><tr><th>Staff</th><th>Period</th><th>Rating</th><th>Status</th><th>Reviewed</th></tr>${pr||'<tr><td colspan="5">No performance reviews yet.</td></tr>'}</table>${pager('performance',(D.hr_performance_reviews||[]).length,'performance reviews')}`;
}
function audits(){
  return paged(D.hr_audit_log||[],'audit').map(a=>`<tr>
    <td>${fmt(a.created_at)}</td>
    <td>${esc(prof(a.actor_id).full_name||prof(a.actor_id).email||'System')}</td>
    <td>${esc(a.action)}</td><td>${esc(a.entity_type)}</td>
    <td>${esc(prof(a.subject_profile_id).full_name||'—')}</td>
    <td><div class="hrEvidence">${evidenceText(a.details||{})}</div></td>
  </tr>`).join('')||'<tr><td colspan="6">No HR audit activity yet.</td></tr>';
}
function invitations(){
  return paged(D.staff_invitations||[],'invitations').map(x=>`<tr>
    <td><b>${esc(x.full_name||x.email||'Staff invitation')}</b><div class="hrMeta">${esc(x.email||'')}</div></td>
    <td>${esc(x.staff_number||'—')}</td>
    <td>${esc(x.job_title||'—')}</td>
    <td>${esc(x.department||'—')}</td>
    <td><span class="hrPill ${low(x.invitation_status)}">${esc(String(x.invitation_status||'invited').toUpperCase())}</span></td>
    <td>${fmt(x.invited_at)}</td>
    <td>${x.accepted_at?fmt(x.accepted_at):'—'}</td>
  </tr>`).join('')||'<tr><td colspan="7">No staff invitations recorded.</td></tr>';
}
function documents(){
  return paged(D.hr_documents||[],'documents').map(x=>{
    const url=safeUrl(x.external_url);
    const source=url?`<a href="${esc(url)}" target="_blank" rel="noopener">Open document ↗</a>`:x.storage_path?'Stored in Academy HR records':'No file/link recorded';
    return `<tr>
      <td><b>${esc(x.title||'HR document')}</b><div class="hrMeta">${esc(x.document_type||'Document')}</div></td>
      <td>${esc(prof(x.profile_id).full_name||prof(x.profile_id).email||'Academy / General')}</td>
      <td>${x.confidential===false?'General':'Confidential'}</td>
      <td>${esc(x.expiry_date||'—')}</td>
      <td>${source}</td>
      <td>${fmt(x.created_at)}</td>
    </tr>`;
  }).join('')||'<tr><td colspan="6">No HR documents recorded yet.</td></tr>';
}
function staffOpts(){
  return staff().map(p=>{
    const tag=low(p.role)==='admin'?'Executive/Admin':(p.staff_number||'Staff');
    return `<option value="${p.id}">${esc(p.full_name||p.email)} · ${esc(tag)}</option>`;
  }).join('');
}
function render(tab=currentTab){
  if(!active())return;
  currentTab=tab;
  const ss=staff();
  const activeN=(D.staff_records||[]).filter(x=>low(x.employment_status)==='active').length||ss.length;
  const pendingInv=(D.staff_invitations||[]).filter(x=>low(x.invitation_status)==='invited').length;
  const pendingContracts=(D.hr_contracts||[]).filter(x=>['draft','issued'].includes(low(x.status))).length;
  const openSafety=(D.hr_safety_incidents||[]).filter(x=>!['resolved','closed'].includes(low(x.status))).length;
  const pendingLeave=(D.hr_leave_requests||[]).filter(x=>low(x.status)==='pending').length;
  const trainingDue=(D.hr_training_records||[]).filter(x=>low(x.status)!=='completed').length;
  let body='';
  if(tab==='team')body=`<div class="hrBar"><button class="hrBtn" id="hrAddStaff">+ Invite Staff User</button></div><h3>Team Directory</h3><table class="hrTable"><tr><th>Staff member</th><th>Staff ID</th><th>Job title</th><th>Department</th><th>Status</th><th>Access</th><th>Action</th></tr>${directory()}</table>${pager('team',ss.length,'team members')}<h3 style="margin-top:18px">Staff Invitation History</h3><div class="hrMeta" style="margin-bottom:8px">Shows recent staff invitations and whether each invitation is still pending, accepted, cancelled or expired.</div><table class="hrTable"><tr><th>Invitee</th><th>Staff ID</th><th>Job title</th><th>Department</th><th>Status</th><th>Invited</th><th>Accepted</th></tr>${invitations()}</table>${pager('invitations',(D.staff_invitations||[]).length,'invitations')}${departmentGuide()}`;
  if(tab==='contracts')body=`<div class="hrBar"><select class="hrSelect" id="hcStaff"><option value="">Select staff member</option>${staffOpts()}</select><input class="hrInput" id="hcTitle" placeholder="Contract title e.g. Employment Agreement"><select class="hrSelect" id="hcType"><option>Employment</option><option>Fixed Term</option><option>Consultancy</option><option>Confidentiality</option><option>Policy Acknowledgement</option></select><button class="hrBtn" id="hcCreate">Create Contract</button></div><textarea class="hrText" id="hcBody" placeholder="Contract terms, duties, remuneration reference, confidentiality, conduct, termination, data protection and acceptance terms..."></textarea><h3>Employment Contracts</h3><table class="hrTable"><tr><th>Contract</th><th>Staff</th><th>Type</th><th>Status</th><th>Issued</th><th>Accepted</th><th>Action</th></tr>${contracts()}</table>${pager('contracts',(D.hr_contracts||[]).length,'contracts')}<h3 style="margin-top:18px">HR Document Register</h3><div class="hrMeta" style="margin-bottom:8px">Read-only register of HR documents already recorded in the Academy system. Document creation/storage remains with the existing governed document workflow.</div><table class="hrTable"><tr><th>Document</th><th>Staff / Scope</th><th>Privacy</th><th>Expiry</th><th>Source</th><th>Recorded</th></tr>${documents()}</table>${pager('documents',(D.hr_documents||[]).length,'documents')}`;
  if(tab==='leave')body=`<div class="hrBar"><select class="hrSelect" id="hlStaff"><option value="">Select staff member</option>${staffOpts()}</select><select class="hrSelect" id="hlType"><option>Annual Leave</option><option>Sick Leave</option><option>Family Responsibility Leave</option><option>Unpaid Leave</option><option>Study Leave</option><option>Compassionate Leave</option><option>Other</option></select><input class="hrInput" id="hlStart" type="date"><input class="hrInput" id="hlEnd" type="date"><input class="hrInput" id="hlReason" placeholder="Reason / HR note"><button class="hrBtn" id="hlAdd">Add Leave Request</button></div><div class="hrMeta" style="margin-bottom:8px">HR can capture a request on behalf of a staff member. Staff self-service requests will also appear here. Every request records who submitted it, current status, and who approved or rejected it.</div><table class="hrTable"><tr><th>Staff</th><th>Leave type</th><th>Dates</th><th>Status</th><th>Requested by</th><th>Reviewed by</th><th>Action</th></tr>${leaves()}</table>${pager('leave',(D.hr_leave_requests||[]).length,'leave requests')}`;
  if(tab==='safety')body=`<div class="hrBar"><select class="hrSelect" id="hsStaff"><option value="">General workplace</option>${staffOpts()}</select><input class="hrInput" id="hsTitle" placeholder="Safety / wellbeing incident"><select class="hrSelect" id="hsSeverity"><option>low</option><option selected>medium</option><option>high</option><option>critical</option></select><input class="hrInput" id="hsDesc" placeholder="What happened / required action"><button class="hrBtn bad" id="hsAdd">Record Incident</button></div><table class="hrTable"><tr><th>Incident</th><th>Staff</th><th>Severity</th><th>Status</th><th>Date</th><th>Resolved</th><th>Action</th></tr>${safety()}</table>${pager('safety',(D.hr_safety_incidents||[]).length,'safety cases')}`;
  if(tab==='development')body=training();
  if(tab==='audit')body=`<table class="hrTable"><tr><th>Date</th><th>Actor</th><th>Action</th><th>Record</th><th>Staff</th><th>Evidence</th></tr>${audits()}</table>${pager('audit',(D.hr_audit_log||[]).length,'audit events')}`;

  $('view').innerHTML=`
    <div class="hrHero"><b>PEOPLE, CULTURE & GOVERNANCE</b><h2>HR & Team Command Centre</h2><p>Staff onboarding, access control, employment records, contracts, wellbeing, leave, development and accountable people management.</p></div>
    ${loadErrors.length?'<div class="hrAlert"><b>HR data warning:</b> '+esc(loadErrors.join(' | '))+' The last successfully loaded information remains visible; failed queries are not shown as false zeroes.</div>':''}
    <div class="hrK">
      <div class="hrCard"><strong>${activeN}</strong><span>Active staff</span></div>
      <div class="hrCard"><strong>${pendingInv}</strong><span>Pending invitations</span></div>
      <div class="hrCard"><strong>${pendingContracts}</strong><span>Contracts requiring action</span></div>
      <div class="hrCard"><strong>${pendingLeave}</strong><span>Pending leave</span></div>
      <div class="hrCard"><strong>${openSafety}</strong><span>Open safety/wellbeing cases</span></div>
      <div class="hrCard"><strong>${trainingDue}</strong><span>Training actions</span></div>
    </div>
    <div class="hrTabs">
      ${[['team','Team & Access'],['contracts','Contracts & Documents'],['leave','Leave & Attendance'],['safety','Safety & Wellbeing'],['development','Training & Performance'],['audit','HR Audit Trail']].map(x=>`<button class="hrBtn ${tab===x[0]?'':'alt'}" data-hr-tab="${x[0]}">${x[1]}</button>`).join('')}
      <button class="hrBtn alt" id="hrRefresh">Refresh</button>
    </div>
    <div class="hrPanel" style="overflow:auto">${body}</div>`;
  wire(tab);
}
function wire(tab){
  document.querySelectorAll('[data-hr-tab]').forEach(b=>b.onclick=()=>render(b.dataset.hrTab));
  $('hrRefresh').onclick=open;
  if(tab==='team'){
    $('hrAddStaff').onclick=inviteForm;
    document.querySelector('.hrPanel').onclick=e=>{
      const access=e.target.closest('[data-manage-access]');
      if(access)manageAccess(access.dataset.manageAccess);
    };
  }
  if(tab==='contracts'){
    $('hcCreate').onclick=createContract;
    document.querySelector('.hrPanel').onclick=e=>{
      const b=e.target.closest('[data-issue-contract]');
      if(b)issueContract(b.dataset.issueContract);
    };
  }
  if(tab==='leave'){
    $('hlAdd').onclick=addLeave;
    document.querySelector('.hrPanel').onclick=e=>{
      const b=e.target.closest('[data-leave-action]');
      if(b)reviewLeave(b.dataset.id,b.dataset.leaveAction);
    };
  }
  if(tab==='safety'){
    $('hsAdd').onclick=addSafety;
    document.querySelector('.hrPanel').onclick=e=>{
      const b=e.target.closest('[data-safety-status]');
      if(b)setSafety(b.dataset.id,b.dataset.safetyStatus);
    };
  }
}
async function manageAccess(id){
  const p=prof(id);
  if(!p?.id||low(p.role)!=='staff')return;
  const department=String(p.department||'').trim();
  if(!department)return alert('This staff member does not yet have a department. Update the staff record before assigning access.');
  const current=(D.staff_access_assignments||[]).find(x=>x.profile_id===id&&x.department===department&&x.active);
  const level=low(prompt('Department access level: read, edit, or manager',current?.access_level||'read')||'');
  if(!['read','edit','manager'].includes(level))return alert('Use read, edit, or manager.');
  const canApprove=confirm('Should this staff member be allowed to approve work within '+department+'?');
  const u=await me();
  const payload={
    profile_id:id,
    department,
    access_level:level,
    can_approve:canApprove,
    active:true,
    granted_by:u?.id||null,
    granted_at:new Date().toISOString(),
    revoked_by:null,
    revoked_at:null
  };
  const r=await db.from('staff_access_assignments').upsert(payload,{onConflict:'profile_id,department'});
  if(r.error)return alert('Staff access could not be saved: '+r.error.message);
  await audit('staff_access_updated','staff_access_assignment',id,id,{department,access_level:level,can_approve:canApprove});
  await open();
  render('team');
}
function inviteForm(){
  $('view').insertAdjacentHTML('afterbegin',`<div class="hrPanel" id="hrInvitePanel"><h3>Invite New Staff User</h3><div class="hrGrid"><input class="hrInput" id="hiName" placeholder="Full name"><input class="hrInput" id="hiEmail" placeholder="Personal or work email"><input class="hrInput" id="hiJob" placeholder="Job title"><select class="hrSelect" id="hiDept"><option>Human Resources</option><option>Finance & Accounting</option><option>Academic, Assessments & Content</option><option>Enrolments & Courses</option><option>Student Support & CRM</option><option>Marketing & Admissions</option><option>Communication Hub</option><option>IT, Security & Platform</option></select><select class="hrSelect" id="hiLevel"><option value="read">Read only</option><option value="edit" selected>Edit</option><option value="manager">Manager</option></select><label class="hrMeta"><input type="checkbox" id="hiApprove"> May approve within department</label></div><div class="hrBar"><button class="hrBtn" id="hiSend">Send Secure Invitation</button><button class="hrBtn alt" id="hiCancel">Cancel</button></div><div class="hrMeta">The system generates a non-secret Staff ID and a separate one-time Staff Access Code. The Access Code is shown once, then stored only as a secure hash. HR/CEO never chooses or sees the employee's password; the employee sets it securely from the invitation email.</div></div>`);
  $('hiSend').onclick=inviteStaff;
  $('hiCancel').onclick=()=>$('hrInvitePanel').remove();
}
async function inviteStaff(){
  const full_name=$('hiName').value.trim(),email=$('hiEmail').value.trim(),job_title=$('hiJob').value.trim(),department=$('hiDept').value;
  if(!full_name||!email||!job_title)return alert('Name, email and job title are required.');
  const redirect_to=location.origin+'/staff-portal.html';
  const r=await db.functions.invoke('invite-staff-user',{body:{full_name,email,job_title,department,access_level:$('hiLevel').value,can_approve:$('hiApprove').checked,redirect_to}});
  if(r.error||r.data?.error)return alert(r.data?.error||r.error.message);
  alert('Staff invitation sent.\n\nStaff ID: '+r.data.staff_number+'\nOne-time Staff Access Code: '+r.data.access_code+'\n\nThe Access Code is shown once and stored by the Academy only as a secure hash. Share it securely with the staff member.');
  await open();
}
async function createContract(){
  const profile_id=$('hcStaff').value,title=$('hcTitle').value.trim(),body=$('hcBody').value.trim();
  if(!profile_id||!title||!body)return alert('Select staff, add a title and enter the contract terms.');
  const u=await me(),num=await db.rpc('next_hr_contract_number');
  if(num.error)return alert(num.error.message);
  const r=await db.from('hr_contracts').insert({profile_id,contract_number:num.data,contract_type:$('hcType').value,title,body,status:'draft',issued_by:u.id});
  if(r.error)return alert(r.error.message);
  await audit('contract_created','hr_contract',num.data,profile_id,{title,type:$('hcType').value});
  await open();render('contracts');
}
async function issueContract(id){
  const c=(D.hr_contracts||[]).find(x=>x.id===id);
  if(!c)return;
  const u=await me();
  const r=await db.from('hr_contracts').update({status:'issued',issued_by:u.id,issued_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',id).eq('status','draft');
  if(r.error)return alert(r.error.message);
  await open();render('contracts');
}
async function addLeave(){
  const profile_id=$('hlStaff').value,start_date=$('hlStart').value,end_date=$('hlEnd').value,leave_type=$('hlType').value,reason=$('hlReason').value.trim();
  if(!profile_id)return alert('Select the staff member requesting leave.');
  if(!start_date||!end_date)return alert('Enter the leave start and end dates.');
  if(end_date<start_date)return alert('End date cannot be before the start date.');
  const u=await me();
  const r=await db.from('hr_leave_requests').insert({profile_id,leave_type,start_date,end_date,reason,status:'pending',requested_by:u.id});
  if(r.error)return alert(r.error.message);
  await audit('leave_request_created','hr_leave_request','',profile_id,{leave_type,start_date,end_date,requested_by:u.id});
  await open();render('leave');
}
async function reviewLeave(id,status){
  const x=(D.hr_leave_requests||[]).find(y=>y.id===id);
  if(!x)return;
  const notes=(prompt(status==='approved'?'Approval note (optional):':'Reason for rejection:','')||'').trim();
  if(status==='rejected'&&!notes)return alert('Please record a reason for rejection.');
  const u=await me();
  const r=await db.from('hr_leave_requests').update({status,reviewed_by:u.id,reviewed_at:new Date().toISOString(),review_notes:notes}).eq('id',id).eq('status','pending');
  if(r.error)return alert(r.error.message);
  await audit('leave_request_'+status,'hr_leave_request',id,x.profile_id,{notes,reviewed_by:u.id});
  await open();render('leave');
}
async function addSafety(){
  const title=$('hsTitle').value.trim(),description=$('hsDesc').value.trim();
  if(!title||!description)return alert('Add an incident title and description.');
  const u=await me();
  const r=await db.from('hr_safety_incidents').insert({profile_id:$('hsStaff').value||null,incident_type:'Staff safety / wellbeing',severity:$('hsSeverity').value,title,description,reported_by:u.id,occurred_at:new Date().toISOString(),status:'open'}).select('id').single();
  if(r.error)return alert(r.error.message);
  await audit('safety_incident_recorded','hr_safety_incident',r.data.id,$('hsStaff').value||null,{title,severity:$('hsSeverity').value});
  await open();render('safety');
}
async function setSafety(id,status){
  const x=(D.hr_safety_incidents||[]).find(y=>y.id===id);
  if(!x)return;
  const u=await me();
  const patch={status};
  if(status==='investigating'){
    const note=(prompt('Investigation note / immediate action (optional):',x.action_taken||'')||'').trim();
    if(note)patch.action_taken=note;
  }
  if(status==='resolved'||status==='closed'){
    const action=(prompt('Corrective action / resolution evidence (required):',x.action_taken||'')||'').trim();
    if(action.length<5)return alert('Record the corrective action or resolution evidence before closing this case.');
    patch.action_taken=action;
    patch.resolved_by=u.id;
    patch.resolved_at=x.resolved_at||new Date().toISOString();
  }
  const r=await db.from('hr_safety_incidents').update(patch).eq('id',id);
  if(r.error)return alert(r.error.message);
  await audit('safety_incident_'+status,'hr_safety_incident',id,x.profile_id,{from:x.status,to:status,action_taken:patch.action_taken||x.action_taken||null});
  await open();render('safety');
}
async function open(){css();await load();render(currentTab)}
function install(){
  css();
  window.FundaHRCentre={open};
  const old=window.hr;
  window.hr=function(){try{old?.()}catch(e){}setTimeout(open,0)};
  document.addEventListener('click',e=>{
    const page=e.target.closest?.('[data-hr-page]');
    if(page&&active()){
      const key=page.dataset.hrPage,dir=Number(page.dataset.hrDir||0);
      pages[key]=Math.max(1,(pages[key]||1)+dir);
      render(currentTab);
      return;
    }
    const b=e.target.closest?.('#nav button,.nav button');
    if(b&&/hr|team|human resources/i.test(b.textContent||''))setTimeout(open,60);
  },false);
  if(active())setTimeout(open,80);
}
if(document.readyState==='complete')setTimeout(install,0);
else window.addEventListener('load',()=>setTimeout(install,0),{once:true});
})();