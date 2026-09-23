(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname))return;
window.__fundaHrAuthoritativeLoader=true;

let db,D={},loadErrors=[],currentTab='team',workforceMonth='2026-10-01',workforceSummary=null,workforceSummaryError='',workforceEditId=null,disciplinaryCaseId=null;
const PAGE_SIZE=10,pages={team:1,invitations:1,contracts:1,documents:1,leave:1,safety:1,training:1,performance:1,workforce:1,disciplinary:1,disciplinaryEvents:1,audit:1};
const $=x=>document.getElementById(x);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v||'').toLowerCase();
const n=v=>Number(v||0);
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
  .hrPill.active,.hrPill.accepted,.hrPill.approved,.hrPill.approved_plan,.hrPill.completed,.hrPill.closed,.hrPill.resolved{background:#e5f6ef;color:#176b50}
  .hrPill.pending,.hrPill.issued,.hrPill.in_progress,.hrPill.investigating,.hrPill.shared,.hrPill.planning,.hrPill.on_hold{background:#fff2d2;color:#8a5a05}
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
  .hrMoney{text-align:right;white-space:nowrap}.hrPlanningGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:10px 0}.hrPlanCard{border:1px solid #e1dac9;border-radius:10px;padding:12px;background:#fbfcfe}.hrPlanCard strong{display:block;color:#071b31;font-size:18px}.hrPlanCard span{font-size:12px;color:#64748b;line-height:1.45}.hrConfidential{margin:10px 0;padding:10px 12px;border:1px solid #d7e3f0;border-radius:9px;background:#f6f9fd;color:#536174;font-size:13px;line-height:1.5}.hrProcess{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:10px 0}.hrProcessStep{border:1px solid #dce5ef;border-radius:9px;background:#f8fbff;padding:10px}.hrProcessStep b{display:block;color:#0b315c;font-size:12px;margin-bottom:4px}.hrProcessStep span{font-size:11px;line-height:1.4;color:#64748b}.hrCaseBox{border:1px solid #d9d1bf;border-radius:10px;padding:12px;margin-top:10px;background:#fff}.hrCaseBox h4{margin:0 0 8px;color:#071b31;font-size:15px}.hrCaseTimeline{border-left:2px solid #dce5ef;margin:8px 0 8px 8px;padding-left:13px}.hrCaseEvent{margin:0 0 10px}.hrCaseEvent b{display:block;color:#071b31;font-size:12px}.hrCaseEvent span{display:block;color:#64748b;font-size:12px;line-height:1.45}
  @media(max-width:1050px){.hrK{grid-template-columns:repeat(3,1fr)}.hrPlanningGrid{grid-template-columns:repeat(2,1fr)}.hrProcess{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:760px){.hrGrid{grid-template-columns:1fr}.hrK{grid-template-columns:repeat(2,1fr)}.hrDeptGrid,.hrPlanningGrid,.hrProcess{grid-template-columns:1fr}.hrTable{font-size:12px}.hrHero h2{font-size:21px}}
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
    ['hr_workforce_plans','*','created_at'],
    ['hr_compensation_guidance','*','department'],
    ['hr_compensation_floor','*','effective_date'],
    ['hr_disciplinary_rules','*','sort_order'],
    ['hr_disciplinary_cases','*','created_at'],
    ['hr_disciplinary_events','*','event_at'],
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
const workforceDepartments=[
  'Human Resources','Finance & Accounting','Academic, Assessments & Content','Enrolments & Courses',
  'Student Support & CRM','Marketing & Admissions','Communication Hub','IT, Security & Platform','Executive / CEO'
];
function workforceDeptOpts(selected=''){
  return workforceDepartments.map(x=>'<option '+(x===selected?'selected':'')+'>'+esc(x)+'</option>').join('');
}
function compensationFloor(){
  return (D.hr_compensation_floor||[])[0]||{
    hourly_rate:30.23,monthly_equivalent_40h:5239.46,effective_date:'2026-03-01',
    source_label:'South Africa National Minimum Wage 2026'
  };
}
function guidanceMonthlyBand(g){
  if(!g)return {min:0,max:0};
  if(g.guidance_type==='revenue_percentage'){
    const target=n(workforceSummary?.monthly_revenue_target);
    return {min:target*n(g.revenue_pct_min)/100,max:target*n(g.revenue_pct_max)/100};
  }
  return {min:n(g.monthly_min),max:n(g.monthly_max)};
}
function monthlyToHourly(v){return n(v)/(40*52/12)}
function compensationGuidanceRows(){
  const rows=(D.hr_compensation_guidance||[]).filter(x=>x.active);
  return rows.map(g=>{
    const band=guidanceMonthlyBand(g),mid=(band.min+band.max)/2;
    const sourceDate=g.source_as_of?new Date(g.source_as_of+'T12:00:00').toLocaleDateString('en-ZA',{month:'short',year:'numeric'}):'';
    return `<tr>
      <td><b>${esc(g.department)}</b><div class="hrMeta">${esc(g.suggested_role)}</div></td>
      <td>${esc(g.profile_level||'Junior / graduate')}</td>
      <td><b>${moneyHR(band.min)} – ${moneyHR(band.max)}</b><div class="hrMeta">${g.guidance_type==='revenue_percentage'?'FOA internal affordability envelope':'Market-reference monthly planning band'}</div></td>
      <td><b>${moneyHR(monthlyToHourly(band.min))} – ${moneyHR(monthlyToHourly(band.max))}/hour</b><div class="hrMeta">40-hour-week equivalent for planning only</div></td>
      <td><div class="hrMeta"><b>${esc(g.source_label)}</b>${sourceDate?' · '+esc(sourceDate):''}</div><div class="hrEvidence">${esc(g.source_note||'')}</div></td>
      <td><button class="hrBtn alt" data-comp-guide="${g.id}" data-comp-mode="low">Use lower</button> <button class="hrBtn alt" data-comp-guide="${g.id}" data-comp-mode="mid">Use midpoint</button></td>
    </tr>`;
  }).join('')||'<tr><td colspan="6">Compensation guidance is currently unavailable.</td></tr>';
}
function applyCompGuidance(id,mode='mid'){
  const g=(D.hr_compensation_guidance||[]).find(x=>x.id===id);if(!g)return;
  const band=guidanceMonthlyBand(g),rate=mode==='low'?band.min:(band.min+band.max)/2;
  if($('hwDept'))$('hwDept').value=g.department;
  if($('hwRole'))$('hwRole').value=g.suggested_role;
  if($('hwBasis'))$('hwBasis').value='monthly';
  if($('hwMonthlyRate'))$('hwMonthlyRate').value=n(rate).toFixed(2);
  syncWorkforceFields();
  $('hwRole')?.scrollIntoView({behavior:'smooth',block:'center'});
}
function workforceBasePerPerson(x){
  return low(x.pay_basis)==='hourly'
    ? n(x.hourly_rate)*n(x.planned_weekly_hours)*52/12
    : n(x.monthly_rate);
}
function workforceMonthlyCost(x){
  return n(x.planned_headcount)*(workforceBasePerPerson(x)+n(x.employer_cost_per_person)+n(x.other_monthly_cost_per_person));
}
function workforceStatusLabel(v){
  return String(v||'planning').replaceAll('_',' ');
}
async function loadWorkforceSummary(month=workforceMonth){
  workforceSummary=null;workforceSummaryError='';
  const {data,error}=await db.rpc('get_hr_workforce_affordability',{p_month:month});
  if(error){workforceSummaryError=error.message||String(error);return}
  workforceSummary=data||null;
}
function workforceRows(){
  const plans=D.hr_workforce_plans||[];
  return paged(plans,'workforce').map(x=>{
    const base=workforceBasePerPerson(x),total=workforceMonthlyCost(x);
    const rateSet=low(x.pay_basis)==='hourly'?n(x.hourly_rate)>0:n(x.monthly_rate)>0;
    return `<tr>
      <td><b>${esc(x.role_title)}</b><div class="hrMeta">${esc(x.department)}</div></td>
      <td>${esc(String(x.employment_model||'').replaceAll('_',' '))}</td>
      <td>${low(x.pay_basis)==='hourly'
        ?'<b>'+moneyHR(x.hourly_rate)+'/hour</b><div class="hrMeta">'+n(x.planned_weekly_hours).toFixed(1)+' planned hours/week</div>'
        :'<b>'+moneyHR(x.monthly_rate)+'/month</b>'}
        ${!rateSet?'<div class="hrMeta">Rate not set yet</div>':''}</td>
      <td>${n(x.planned_headcount)}</td>
      <td class="hrMoney">${moneyHR(base*n(x.planned_headcount))}</td>
      <td class="hrMoney">${moneyHR((n(x.employer_cost_per_person)+n(x.other_monthly_cost_per_person))*n(x.planned_headcount))}</td>
      <td class="hrMoney"><b>${moneyHR(total)}</b></td>
      <td>${esc(x.start_month||'—')}<div class="hrMeta">to ${esc(x.end_month||'Open-ended')}</div></td>
      <td><span class="hrPill ${low(x.status)}">${esc(workforceStatusLabel(x.status))}</span></td>
      <td>${esc(x.notes||'—')}</td>
      <td><button class="hrBtn alt" data-workforce-edit="${x.id}">Edit plan</button></td>
    </tr>`;
  }).join('')||'<tr><td colspan="11">No workforce plans yet. Add future roles when you are ready to model staffing costs.</td></tr>';
}
function moneyHR(v){return 'R'+n(v).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2})}
function workforcePanel(){
  const plans=D.hr_workforce_plans||[],s=workforceSummary,edit=(D.hr_workforce_plans||[]).find(x=>x.id===workforceEditId)||null;
  const basis=edit?.pay_basis||'monthly',start=(edit?.start_month||workforceMonth).slice(0,7),end=edit?.end_month?edit.end_month.slice(0,7):'',floor=compensationFloor();
  const summary=workforceSummaryError
    ?'<div class="hrAlert"><b>Affordability summary unavailable:</b> '+esc(workforceSummaryError)+'. No budget value has been substituted.</div>'
    :s?`<div class="hrPlanningGrid">
      <div class="hrPlanCard"><strong>${n(s.planned_headcount)}</strong><span>Planned headcount for ${esc(workforceMonth.slice(0,7))}</span></div>
      <div class="hrPlanCard"><strong>${moneyHR(s.planned_workforce_cost)}</strong><span>Planned monthly workforce cost</span></div>
      <div class="hrPlanCard"><strong>${moneyHR(s.finance_people_budget)}</strong><span>Finance Staff / People budget</span></div>
      <div class="hrPlanCard"><strong>${moneyHR(s.people_budget_gap)}</strong><span>People-budget gap / headroom</span></div>
      <div class="hrPlanCard"><strong>${moneyHR(s.monthly_revenue_target)}</strong><span>Monthly revenue target</span></div>
      <div class="hrPlanCard"><strong>${n(s.workforce_cost_pct_of_revenue).toFixed(2)}%</strong><span>Workforce cost as % of target revenue · remaining ${moneyHR(s.revenue_remaining_after_workforce)}</span></div>
    </div>`:'<div class="hrMeta">Choose a month to calculate workforce affordability.</div>';

  return `
    <div class="hrConfidential"><b>Confidential workforce planning.</b> This area models future staffing affordability only. It does not invite staff, create employment contracts, run payroll or post expenses to the P&L. Zero rates mean a role has not yet been costed.</div>
    <div class="hrBar"><label class="hrMeta">Affordability month <input class="hrInput" id="hwMonth" type="month" value="${esc(workforceMonth.slice(0,7))}"></label><button class="hrBtn alt" id="hwMonthApply">Check Month</button></div>
    ${summary}
    <div class="hrDeptGuide">
      <h3>Compensation Guidance — Junior / Graduate Planning</h3>
      <p>These are planning references, not approved salaries or promises to future employees. The current South African ordinary-worker wage floor in this planner is <b>${moneyHR(floor.hourly_rate)}/hour</b> from ${esc(floor.effective_date||'2026-03-01')}. At 40 hours/week that is approximately <b>${moneyHR(floor.monthly_equivalent_40h)}/month</b>. Ordinary graduate/intern employees should not be planned below the applicable minimum wage. Formal Skills Development Act learnerships use a separate allowance schedule and are not treated as ordinary internships here.</p>
      <div class="hrTableWrap"><table class="hrTable"><tr><th>Department / Suggested Starter Role</th><th>Profile</th><th>Monthly Guidance</th><th>Hourly Equivalent</th><th>Reference / Note</th><th>Use in Planner</th></tr>${compensationGuidanceRows()}</table></div>
    </div>
    <h3 style="margin-top:18px">${edit?'Edit Workforce Plan':'Add Future Role Plan'}</h3>
    <div class="hrGrid">
      <input class="hrInput" id="hwRole" placeholder="Role title" value="${esc(edit?.role_title||'')}">
      <select class="hrSelect" id="hwDept">${workforceDeptOpts(edit?.department||'Human Resources')}</select>
      <select class="hrSelect" id="hwModel">
        ${[['full_time','Full-time'],['part_time','Part-time'],['graduate_intern','Graduate / intern'],['contractor','Contractor'],['hourly_casual','Hourly / casual']].map(([v,l])=>'<option value="'+v+'" '+((edit?.employment_model||'full_time')===v?'selected':'')+'>'+l+'</option>').join('')}
      </select>
      <select class="hrSelect" id="hwBasis"><option value="monthly" ${basis==='monthly'?'selected':''}>Monthly rate</option><option value="hourly" ${basis==='hourly'?'selected':''}>Hourly rate</option></select>
      <input class="hrInput" id="hwMonthlyRate" type="number" min="0" step="0.01" placeholder="Monthly rate" value="${n(edit?.monthly_rate).toFixed(2)}">
      <input class="hrInput" id="hwHourlyRate" type="number" min="0" step="0.01" placeholder="Hourly rate" value="${n(edit?.hourly_rate).toFixed(2)}">
      <input class="hrInput" id="hwWeeklyHours" type="number" min="0.5" max="168" step="0.5" placeholder="Planned hours per week" value="${n(edit?.planned_weekly_hours||40).toFixed(1)}">
      <input class="hrInput" id="hwHeadcount" type="number" min="1" step="1" placeholder="Headcount" value="${n(edit?.planned_headcount||1)}">
      <input class="hrInput" id="hwEmployerCost" type="number" min="0" step="0.01" placeholder="Employer/benefit cost per person / month" value="${n(edit?.employer_cost_per_person).toFixed(2)}">
      <input class="hrInput" id="hwOtherCost" type="number" min="0" step="0.01" placeholder="Other monthly cost per person" value="${n(edit?.other_monthly_cost_per_person).toFixed(2)}">
      <label class="hrMeta">Planned start month<input class="hrInput" id="hwStart" type="month" value="${esc(start)}"></label>
      <label class="hrMeta">Planned end month (optional)<input class="hrInput" id="hwEnd" type="month" value="${esc(end)}"></label>
      <select class="hrSelect" id="hwStatus">
        ${[['planning','Planning'],['approved_plan','Approved plan'],['on_hold','On hold'],['retired','Retired']].map(([v,l])=>'<option value="'+v+'" '+((edit?.status||'planning')===v?'selected':'')+'>'+l+'</option>').join('')}
      </select>
      <input class="hrInput" id="hwNotes" placeholder="Planning notes / assumptions" value="${esc(edit?.notes||'')}">
    </div>
    <div class="hrBar"><button class="hrBtn" id="hwSave">${edit?'Update Plan':'Add Plan'}</button>${edit?'<button class="hrBtn alt" id="hwCancel">Cancel Edit</button>':''}</div>
    <div class="hrMeta">Planned weekly hours are used for legal-rate checking on employee plans. Hourly plans use hours × 52 ÷ 12 for the monthly affordability estimate; monthly plans use the entered monthly rate. Employer/benefit and other costs are added per planned person.</div>

    <h3 style="margin-top:18px">Workforce Cost Plans</h3>
    <table class="hrTable"><tr><th>Role / Department</th><th>Model</th><th>Rate Basis</th><th>Headcount</th><th>Base Cost</th><th>On-costs</th><th>Monthly Cost</th><th>Planned Period</th><th>Status</th><th>Notes</th><th>Action</th></tr>${workforceRows()}</table>
    ${pager('workforce',plans.length,'workforce plans')}`;
}
function disciplinaryRule(id){return (D.hr_disciplinary_rules||[]).find(x=>x.id===id)||null}
function disciplinaryStaffOpts(selected=''){
  return '<option value="">Select Staff member</option>'+(D.profiles||[]).filter(p=>low(p.role)==='staff').map(p=>'<option value="'+esc(p.id)+'" '+(p.id===selected?'selected':'')+'>'+esc(p.full_name||p.email)+' · '+esc(p.staff_number||p.job_title||'Staff')+'</option>').join('');
}
function disciplinaryRuleOpts(selected=''){
  return '<option value="">Select alleged rule / category</option>'+(D.hr_disciplinary_rules||[]).filter(x=>x.active).sort((a,b)=>n(a.sort_order)-n(b.sort_order)).map(r=>'<option value="'+esc(r.id)+'" '+(r.id===selected?'selected':'')+'>'+esc(r.rule_code)+' · '+esc(r.category)+' — '+esc(r.rule_title)+'</option>').join('');
}
function disciplinaryStatus(v){return String(v||'').replaceAll('_',' ')}
function disciplinaryNextStep(x){
  const st=low(x.status);
  if(st==='investigating')return x.process_route==='informal'?'Record response / informal correction or escalate to formal notice':'Complete investigation, then issue notice or withdraw';
  if(st==='notice_issued')return 'Record employee response/opportunity';
  if(st==='response_recorded')return 'Schedule meeting/enquiry or record outcome';
  if(st==='meeting_scheduled'||st==='outcome_pending')return 'Record finding and fair outcome';
  if(st==='outcome_issued')return 'Close case or record internal review/appeal if requested';
  if(st==='review_requested')return 'Decide internal review/appeal';
  if(st==='closed')return 'Closed';
  if(st==='withdrawn')return 'Withdrawn';
  return 'Review case';
}
function disciplinaryCaseRows(){
  const rows=D.hr_disciplinary_cases||[];
  return paged(rows,'disciplinary').map(x=>{
    const rule=disciplinaryRule(x.rule_id),p=prof(x.profile_id);
    return `<tr>
      <td><b>${esc(x.case_number)}</b><div class="hrMeta">${esc(x.allegation_title)}</div></td>
      <td>${esc(p.full_name||p.email||'Staff')}<div class="hrMeta">${esc(p.staff_number||p.job_title||'')}</div></td>
      <td>${esc(rule?.category||'Other')}<div class="hrMeta">${esc(rule?.rule_code||'')}</div></td>
      <td>${esc(x.severity_assessment)}</td>
      <td><span class="hrPill ${low(x.status)}">${esc(disciplinaryStatus(x.status).toUpperCase())}</span><div class="hrMeta">${esc(x.process_route)} route</div></td>
      <td>${esc(disciplinaryNextStep(x))}</td>
      <td><button class="hrBtn alt" data-disciplinary-open="${x.id}">Open Case</button></td>
    </tr>`;
  }).join('')||'<tr><td colspan="7">No staff disciplinary cases recorded.</td></tr>';
}
function disciplinaryTimeline(caseId){
  const rows=(D.hr_disciplinary_events||[]).filter(x=>x.case_id===caseId);
  const pg=paged(rows,'disciplinaryEvents');
  const html=pg.map(e=>{
    const evidence=safeUrl(e.evidence_url);
    return `<div class="hrCaseEvent"><b>${fmt(e.event_at)} · ${esc(String(e.event_type).replaceAll('_',' '))}</b><span>${esc(e.notes)}</span>${evidence?'<span><a href="'+esc(evidence)+'" target="_blank" rel="noopener">Open evidence ↗</a></span>':''}</div>`;
  }).join('')||'<div class="hrMeta">No case-history events recorded yet.</div>';
  return '<div class="hrCaseTimeline">'+html+'</div>'+pager('disciplinaryEvents',rows.length,'case events');
}
function disciplinaryGuide(){
  return `<div class="hrConfidential"><b>Staff discipline only.</b> This workspace is for employees/Staff, not learners. An allegation is not a finding of guilt. Poor performance, illness, injury or other incapacity must not be disguised as misconduct; route those matters through the appropriate performance/incapacity process.</div>
    <div class="hrProcess">
      <div class="hrProcessStep"><b>1 · Establish facts</b><span>Record the alleged rule, facts, evidence and the employee explanation. Do not assume guilt.</span></div>
      <div class="hrProcessStep"><b>2 · Choose proportionate route</b><span>Minor issues may be corrected informally. Repeated/serious allegations may require formal discipline.</span></div>
      <div class="hrProcessStep"><b>3 · Fair notice & response</b><span>Explain the allegation, allow reasonable preparation, representation and reasonable language assistance.</span></div>
      <div class="hrProcessStep"><b>4 · Finding & sanction</b><span>Consider rule validity, awareness, harm, seriousness, progressive discipline, mitigation and consistency.</span></div>
      <div class="hrProcessStep"><b>5 · Written outcome & rights</b><span>Record reasons. Dismissal is not automatic and must not trigger system offboarding by itself.</span></div>
    </div>
    <div class="hrMeta">Legal reference: South African <a href="https://www.gov.za/sites/default/files/gcis_document/202509/53294gen3470.pdf" target="_blank" rel="noopener">Code of Practice: Dismissal (4 September 2025) ↗</a>. External dispute-referral rights remain unaffected by an internal review/appeal.</div>`;
}
function disciplinarySelectedCase(){
  const x=(D.hr_disciplinary_cases||[]).find(r=>r.id===disciplinaryCaseId);
  if(!x)return '';
  const rule=disciplinaryRule(x.rule_id),p=prof(x.profile_id),st=low(x.status);
  const active=!['closed','withdrawn'].includes(st);
  const noticeSection=st==='investigating'? `<div class="hrCaseBox"><h4>Formal Notice — if informal correction is not appropriate</h4><div class="hrGrid">
      <textarea class="hrText" id="hdNotice" placeholder="Explain the allegation in enough detail for the employee to understand and answer it.">${esc(x.notice_details||'')}</textarea>
      <div><label class="hrMeta">Preparation / response deadline<input class="hrInput" id="hdDeadline" type="datetime-local"></label><input class="hrInput" id="hdLanguage" placeholder="Preferred language / language assistance"></div>
      <label class="hrMeta"><input type="checkbox" id="hdUnionRole"> Employee is a trade-union representative / office-bearer</label>
      <label class="hrMeta">Union consultation date/time (required if above is ticked)<input class="hrInput" id="hdUnionConsult" type="datetime-local"></label>
    </div><button class="hrBtn" id="hdIssueNotice">Issue Formal Notice</button></div>`:'';

  const informalSection=st==='investigating'? `<div class="hrCaseBox"><h4>Informal Correction — minor matters only</h4><div class="hrMeta">Use when advice/correction is proportionate. Record the employee response first. This closes the case as corrective action, not as a formal warning.</div><div class="hrGrid"><textarea class="hrText" id="hdInformalResponse" placeholder="Employee explanation / response"></textarea><textarea class="hrText" id="hdInformalCorrection" placeholder="Advice, counselling or correction given"></textarea></div><button class="hrBtn alt" id="hdInformal">Record Informal Correction & Close</button></div>`:'';

  const responseSection=st==='notice_issued'? `<div class="hrCaseBox"><h4>Employee Response & Representation</h4><div class="hrGrid">
      <select class="hrSelect" id="hdResponseStatus"><option value="provided">Response provided</option><option value="declined">Employee declined to respond</option><option value="no_response_after_opportunity">No response after reasonable opportunity</option></select>
      <select class="hrSelect" id="hdRepType"><option value="none">No representative</option><option value="fellow_employee">Fellow employee</option><option value="trade_union_representative">Trade union representative</option><option value="other_approved">Other approved representative</option></select>
      <input class="hrInput" id="hdRepName" placeholder="Representative name, if any">
      <input class="hrInput" id="hdRespLanguage" value="${esc(x.preferred_language||'')}" placeholder="Preferred language">
      <label class="hrMeta"><input type="checkbox" id="hdInterpreter"> Interpreter / language assistance required</label>
      <textarea class="hrText" id="hdResponse" placeholder="Employee response / representations"></textarea>
    </div><button class="hrBtn" id="hdSaveResponse">Record Employee Response</button></div>`:'';

  const meetingSection=['response_recorded','meeting_scheduled'].includes(st)? `<div class="hrCaseBox"><h4>Meeting / Enquiry</h4><div class="hrGrid"><label class="hrMeta">Meeting date/time<input class="hrInput" id="hdMeetingAt" type="datetime-local"></label><input class="hrInput" id="hdChair" value="${esc(x.chairperson_name||'')}" placeholder="Chairperson / decision-maker"><textarea class="hrText" id="hdMeetingNote" placeholder="Meeting/investigation note or evidence summary"></textarea><input class="hrInput" id="hdMeetingEvidence" placeholder="Evidence URL (https://...)"></div><div class="hrBar"><button class="hrBtn" id="hdSchedule">Schedule / Record Meeting</button><button class="hrBtn alt" id="hdAddMeetingNote">Add Meeting Note / Evidence</button></div></div>`:'';

  const outcomeSection=['response_recorded','meeting_scheduled','outcome_pending'].includes(st)? `<div class="hrCaseBox"><h4>Finding & Outcome</h4><div class="hrGrid">
      <select class="hrSelect" id="hdFinding"><option value="not_substantiated">Not substantiated</option><option value="partly_substantiated">Partly substantiated</option><option value="substantiated">Substantiated</option><option value="withdrawn">Withdrawn</option></select>
      <select class="hrSelect" id="hdSanction"><option value="none">No sanction</option><option value="verbal_warning">Verbal warning</option><option value="written_warning">Written warning</option><option value="final_written_warning">Final written warning</option><option value="dismissal">Dismissal</option><option value="other">Other proportionate outcome</option></select>
      <label class="hrMeta">Warning valid until (if applicable)<input class="hrInput" id="hdWarningUntil" type="date"></label>
      <textarea class="hrText" id="hdOutcomeReason" placeholder="Written reasons: facts, rule, finding and why this outcome is proportionate"></textarea>
      <textarea class="hrText" id="hdMitigating" placeholder="Mitigating factors: service, record, circumstances, acknowledgement/correction, etc."></textarea>
      <textarea class="hrText" id="hdAggravating" placeholder="Aggravating factors / actual or potential harm"></textarea>
      <textarea class="hrText" id="hdConsistency" placeholder="Consistency with comparable cases / why any difference is justified"></textarea>
      <textarea class="hrText" id="hdRelationship" placeholder="If dismissal is considered: why continued employment is intolerable"></textarea>
      <label class="hrMeta"><input type="checkbox" id="hdExternalRights"> Employee informed of applicable external dispute-referral rights</label>
    </div><div class="hrAlert"><b>No automatic dismissal/offboarding:</b> recording “dismissal” here does not disable the Staff account, end a contract or stop payroll. Those actions remain separate and must only follow a lawful final employment decision.</div><button class="hrBtn bad" id="hdOutcome">Record Finding & Outcome</button></div>`:'';

  const reviewSection=st==='outcome_issued'? `<div class="hrCaseBox"><h4>Internal Review / Appeal — if requested</h4><textarea class="hrText" id="hdReviewGrounds" placeholder="Employee's grounds for internal review / appeal"></textarea><div class="hrBar"><button class="hrBtn alt" id="hdReviewRequest">Record Review / Appeal Request</button><button class="hrBtn" id="hdCloseCase">Close Case Without Internal Review</button></div><div class="hrMeta">An internal review does not remove or delay any statutory right the employee may have to refer an external dispute.</div></div>`:'';

  const reviewDecision=st==='review_requested'? `<div class="hrCaseBox"><h4>Internal Review Decision</h4><div class="hrGrid"><select class="hrSelect" id="hdReviewDecision"><option value="upheld">Outcome upheld</option><option value="varied">Outcome varied</option><option value="overturned">Outcome overturned</option><option value="remitted">Remit for reconsideration</option></select><textarea class="hrText" id="hdReviewNotes" placeholder="Reasons for review decision"></textarea></div><button class="hrBtn" id="hdDecideReview">Record Review Decision</button></div>`:'';

  return `<div class="hrCaseBox"><div class="hrBar" style="justify-content:space-between"><div><h3 style="margin:0">${esc(x.case_number)} · ${esc(x.allegation_title)}</h3><div class="hrMeta">${esc(p.full_name||p.email||'Staff')} · incident ${esc(x.incident_date)} · ${esc(rule?.rule_code||'')} ${esc(rule?.category||'')}</div></div><span class="hrPill ${st}">${esc(disciplinaryStatus(x.status).toUpperCase())}</span></div>
    <div class="hrGrid"><div><b>Alleged facts</b><div class="hrMeta">${esc(x.allegation_details)}</div></div><div><b>Rule / standard</b><div class="hrMeta">${esc(x.workplace_rule||rule?.rule_title||'Not recorded')}</div></div><div><b>Preliminary severity</b><div class="hrMeta">${esc(x.severity_assessment)}</div></div><div><b>Next step</b><div class="hrMeta">${esc(disciplinaryNextStep(x))}</div></div></div>
    ${rule?.guidance?'<div class="hrConfidential"><b>Category guidance:</b> '+esc(rule.guidance)+'</div>':''}
    <div class="hrBar"><button class="hrBtn alt" id="hdBack">← Back to case register</button>${active?'<button class="hrBtn bad" id="hdWithdraw">Withdraw Case</button>':''}</div>
    <div class="hrCaseBox"><h4>Investigation / Evidence Note</h4><div class="hrGrid"><textarea class="hrText" id="hdEventNote" placeholder="Investigation fact, witness/evidence note, or other relevant case information"></textarea><input class="hrInput" id="hdEvidenceUrl" placeholder="Evidence URL (optional, https://...)"></div><button class="hrBtn alt" id="hdAddEvent">Add Case Note / Evidence</button></div>
    ${informalSection}${noticeSection}${responseSection}${meetingSection}${outcomeSection}${reviewSection}${reviewDecision}
    <div class="hrCaseBox"><h4>Case History</h4>${disciplinaryTimeline(x.id)}</div>
  </div>`;
}
function disciplinaryPanel(){
  const cases=D.hr_disciplinary_cases||[];
  if(disciplinaryCaseId)return disciplinaryGuide()+disciplinarySelectedCase();
  return `${disciplinaryGuide()}
    <div class="hrCaseBox"><h3>Open Staff Conduct Case</h3><div class="hrAlert"><b>Attendance example:</b> use this only for alleged <i>unauthorised</i> absence, repeated lateness or failure to follow a known reporting procedure after checking the reason. Approved leave, illness or genuine incapacity is not automatically misconduct.</div><div class="hrGrid">
      <select class="hrSelect" id="hdStaff">${disciplinaryStaffOpts()}</select>
      <select class="hrSelect" id="hdRule">${disciplinaryRuleOpts()}</select>
      <input class="hrInput" id="hdTitle" placeholder="Allegation title">
      <label class="hrMeta">Incident date<input class="hrInput" id="hdIncidentDate" type="date"></label>
      <select class="hrSelect" id="hdSeverity"><option value="minor">Minor</option><option value="moderate" selected>Moderate</option><option value="serious">Serious</option><option value="potentially_gross">Potentially gross — still requires fair process</option></select>
      <select class="hrSelect" id="hdRoute"><option value="informal">Start with informal / corrective route</option><option value="formal" selected>Formal misconduct route</option></select>
      <textarea class="hrText" id="hdRuleStandard" placeholder="Exact workplace rule / standard and how it was communicated"></textarea>
      <textarea class="hrText" id="hdDetails" placeholder="Alleged facts — what happened, when, where, who was involved. Record facts, not conclusions."></textarea>
    </div><button class="hrBtn" id="hdCreateCase">Open Case for Investigation</button></div>
    <div class="hrCaseBox"><h3>Staff Conduct Case Register</h3><table class="hrTable"><tr><th>Case</th><th>Staff</th><th>Category</th><th>Severity</th><th>Status</th><th>Next Step</th><th>Action</th></tr>${disciplinaryCaseRows()}</table>${pager('disciplinary',cases.length,'disciplinary cases')}</div>`;
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
  if(tab==='workforce')body=workforcePanel();
  if(tab==='audit')body=`<table class="hrTable"><tr><th>Date</th><th>Actor</th><th>Action</th><th>Record</th><th>Staff</th><th>Evidence</th></tr>${audits()}</table>${pager('audit',(D.hr_audit_log||[]).length,'audit events')}`;

  $('view').innerHTML=`
    <div class="hrHero"><b>PEOPLE, CULTURE & GOVERNANCE</b><h2>HR & Team Command Centre</h2><p>Staff onboarding, access control, employment records, contracts, wellbeing, leave, development, workforce affordability planning and accountable people management.</p></div>
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
      ${[['team','Team & Access'],['contracts','Contracts & Documents'],['leave','Leave & Attendance'],['safety','Safety & Wellbeing'],['development','Training & Performance'],['workforce','Workforce & Compensation'],['audit','HR Audit Trail']].map(x=>`<button class="hrBtn ${tab===x[0]?'':'alt'}" data-hr-tab="${x[0]}">${x[1]}</button>`).join('')}
      <button class="hrBtn alt" id="hrRefresh">Refresh</button>
    </div>
    <div class="hrPanel" style="overflow:auto">${body}</div>`;
  wire(tab);
}
function wire(tab){
  document.querySelectorAll('[data-hr-tab]').forEach(b=>b.onclick=async()=>{
    const next=b.dataset.hrTab;
    if(next==='workforce'){
      currentTab='workforce';
      await loadWorkforceSummary(workforceMonth);
      render('workforce');
      return;
    }
    render(next);
  });
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
  if(tab==='workforce'){
    $('hwSave').onclick=saveWorkforcePlan;
    $('hwMonthApply').onclick=async()=>{
      const v=$('hwMonth').value;
      if(!v)return alert('Choose a planning month.');
      workforceMonth=v+'-01';
      await loadWorkforceSummary(workforceMonth);
      render('workforce');
    };
    $('hwCancel')?.addEventListener('click',()=>{workforceEditId=null;render('workforce')});
    $('hwBasis').onchange=syncWorkforceFields;
    syncWorkforceFields();
    document.querySelectorAll('[data-workforce-edit]').forEach(b=>b.onclick=()=>editWorkforcePlan(b.dataset.workforceEdit));
    document.querySelectorAll('[data-comp-guide]').forEach(b=>b.onclick=()=>applyCompGuidance(b.dataset.compGuide,b.dataset.compMode));
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
function syncWorkforceFields(){
  const hourly=$('hwBasis')?.value==='hourly';
  if($('hwMonthlyRate'))$('hwMonthlyRate').disabled=hourly;
  if($('hwHourlyRate'))$('hwHourlyRate').disabled=!hourly;
  if($('hwWeeklyHours'))$('hwWeeklyHours').disabled=false;
}
function editWorkforcePlan(id){
  const x=(D.hr_workforce_plans||[]).find(r=>r.id===id);
  if(!x)return;
  workforceEditId=id;
  render('workforce');
  setTimeout(()=>document.getElementById('hwRole')?.scrollIntoView({behavior:'smooth',block:'center'}),20);
}
async function saveWorkforcePlan(){
  const role_title=$('hwRole').value.trim(),department=$('hwDept').value,employment_model=$('hwModel').value,pay_basis=$('hwBasis').value;
  const monthly_rate=Number($('hwMonthlyRate').value||0),hourly_rate=Number($('hwHourlyRate').value||0),planned_weekly_hours=Number($('hwWeeklyHours').value||0);
  const planned_headcount=Number($('hwHeadcount').value||0),employer_cost_per_person=Number($('hwEmployerCost').value||0),other_monthly_cost_per_person=Number($('hwOtherCost').value||0);
  const startRaw=$('hwStart').value,endRaw=$('hwEnd').value,status=$('hwStatus').value,notes=$('hwNotes').value.trim()||null;
  if(!role_title)return alert('Enter the future role title.');
  if(!department)return alert('Choose the department.');
  if(!startRaw)return alert('Choose the planned start month.');
  if(!Number.isInteger(planned_headcount)||planned_headcount<1)return alert('Planned headcount must be at least 1.');
  if([monthly_rate,hourly_rate,planned_weekly_hours,employer_cost_per_person,other_monthly_cost_per_person].some(v=>!Number.isFinite(v)||v<0))return alert('Rates, hours and on-costs must be zero or greater.');
  if(planned_weekly_hours<=0||planned_weekly_hours>168)return alert('Planned weekly hours must be greater than zero and cannot exceed 168.');
  if(endRaw&&endRaw<startRaw)return alert('Planned end month cannot be before the start month.');
  if(status==='approved_plan'){
    if(pay_basis==='monthly'&&monthly_rate<=0)return alert('Set the monthly rate before marking this as an Approved plan.');
    if(pay_basis==='hourly'&&hourly_rate<=0)return alert('Set the hourly rate before marking this as an Approved plan.');
    if(employment_model!=='contractor'){
      const floor=compensationFloor(),requiredMonthly=n(floor.hourly_rate)*planned_weekly_hours*52/12;
      if(pay_basis==='hourly'&&hourly_rate<n(floor.hourly_rate))return alert('This approved employee plan is below the current ordinary-worker minimum wage of '+moneyHR(floor.hourly_rate)+'/hour. Formal learnership allowances must be handled separately.');
      if(pay_basis==='monthly'&&monthly_rate+0.005<requiredMonthly)return alert('At '+planned_weekly_hours.toFixed(1)+' planned hours/week, this approved monthly plan is below the current ordinary-worker minimum-wage equivalent of '+moneyHR(requiredMonthly)+'/month. Adjust the rate or the planned hours. Formal learnership allowances must be handled separately.');
    }
  }
  const u=await me();
  const payload={
    role_title,department,employment_model,pay_basis,
    monthly_rate:pay_basis==='monthly'?monthly_rate:0,
    hourly_rate:pay_basis==='hourly'?hourly_rate:0,
    planned_weekly_hours,
    planned_headcount,employer_cost_per_person,other_monthly_cost_per_person,
    start_month:startRaw+'-01',end_month:endRaw?endRaw+'-01':null,status,notes,
    updated_by:u?.id||null,updated_at:new Date().toISOString()
  };
  let r;
  if(workforceEditId){
    r=await db.from('hr_workforce_plans').update(payload).eq('id',workforceEditId).select('id').single();
  }else{
    payload.created_by=u?.id||null;
    r=await db.from('hr_workforce_plans').insert(payload).select('id').single();
  }
  if(r.error)return alert('Workforce plan could not be saved: '+r.error.message);
  await audit(workforceEditId?'workforce_plan_updated':'workforce_plan_created','hr_workforce_plan',r.data.id,null,{
    role_title,department,employment_model,pay_basis,
    monthly_rate:payload.monthly_rate,hourly_rate:payload.hourly_rate,
    planned_weekly_hours:payload.planned_weekly_hours,planned_headcount,
    employer_cost_per_person,other_monthly_cost_per_person,
    start_month:payload.start_month,end_month:payload.end_month,status
  });
  workforceEditId=null;
  await load();
  await loadWorkforceSummary(workforceMonth);
  render('workforce');
}
async function open(){css();await load();if(currentTab==='workforce')await loadWorkforceSummary(workforceMonth);render(currentTab)}
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