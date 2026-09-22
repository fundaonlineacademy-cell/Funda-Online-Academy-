(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname))return;

let db,D={},loadErrors=[],currentTab='access',accessKind='students',accessSearch='';
const accessPage={students:1,staff:1,deleted:1};
const PAGE_SIZE=10;
const $=x=>document.getElementById(x);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v||'').toLowerCase();
const fmt=v=>v?new Date(v).toLocaleString('en-ZA'):'—';

function isSecurityLabel(text){
  return /\bsecurity\b|\bplatform\b|\bit\b/i.test(String(text||''));
}
function active(){
  const b=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');
  return !!b&&isSecurityLabel(b.textContent);
}
function isDeleted(p){
  return /@deleted\.funda\.invalid$/i.test(String(p?.email||''))||/^deleted\s+(student|staff)\s+account$/i.test(String(p?.full_name||'').trim());
}
function css(){
  if($('secSafeCss'))return;
  const s=document.createElement('style');
  s.id='secSafeCss';
  s.textContent=`
  .sxHero{padding:20px;border-radius:15px;background:linear-gradient(135deg,#03101f,#0b315c);color:#fff}
  .sxHero b{color:#d6b45c;font-size:12px;letter-spacing:.12em}
  .sxHero h2{margin:5px 0;font-size:24px;line-height:1.2}
  .sxHero p{margin:0;color:#dce8f4;font-size:14px;line-height:1.55}
  .sxK{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:11px 0}
  .sxCard,.sxPanel{background:#fff;border:1px solid #e1dac9;border-radius:11px;padding:13px}
  .sxCard strong{display:block;font-size:21px;line-height:1.2;color:#071b31}
  .sxCard span,.sxMeta{font-size:12px;line-height:1.45;color:#64748b}
  .sxTabs,.sxBar,.sxAccessTabs{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}
  .sxBtn{border:0;border-radius:7px;padding:9px 11px;background:#071b31;color:#efd78e;font-size:13px;font-weight:800;line-height:1.2;cursor:pointer}
  .sxBtn.alt{background:#fff;color:#071b31;border:1px solid #d9d1bf}
  .sxBtn.bad{background:#9d2828;color:#fff}
  .sxBtn:disabled{opacity:.55;cursor:not-allowed}
  .sxInput,.sxSelect{border:1px solid #d9d1bf;border-radius:8px;padding:9px 11px;font-size:14px;background:#fff;color:#10213f}
  .sxInput{flex:1;min-width:220px}
  .sxTable{width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}
  .sxTable th,.sxTable td{padding:10px;border-bottom:1px solid #edf0f3;text-align:left;vertical-align:top}
  .sxTable th{font-size:11px;line-height:1.3;text-transform:uppercase;color:#64748b;letter-spacing:.03em}
  .sxPill{display:inline-block;padding:4px 8px;border-radius:99px;background:#edf2f7;font-size:11px;font-weight:800;line-height:1.2}
  .sxPill.good,.sxPill.resolved,.sxPill.closed,.sxPill.retain{background:#e5f6ef;color:#176b50}
  .sxPill.review,.sxPill.medium,.sxPill.investigating,.sxPill.restrict{background:#fff2d2;color:#8a5a05}
  .sxPill.risk,.sxPill.high,.sxPill.critical,.sxPill.open,.sxPill.remove{background:#ffe7e7;color:#9d2828}
  .sxGrid{display:grid;grid-template-columns:1fr 1fr;gap:9px}
  .sxAlert{margin:10px 0;padding:11px 13px;border:1px solid #efcaca;border-radius:9px;background:#fff3f3;color:#8b2626;font-size:13px;line-height:1.5}
  .sxSearchRow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:8px 0 10px}
  .sxPager{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap;margin-top:11px}
  .sxPager .sxMeta{font-size:12px}
  .sxEmpty{padding:18px;text-align:center;color:#64748b}
  @media(max-width:1050px){.sxK{grid-template-columns:repeat(3,1fr)}}
  @media(max-width:760px){.sxGrid{grid-template-columns:1fr}.sxK{grid-template-columns:repeat(2,1fr)}.sxTable{font-size:12px}.sxHero h2{font-size:21px}}
  `;
  document.head.appendChild(s);
}

async function load(){
  db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  if(!db)return;
  loadErrors=[];

  const previousProfiles=Array.isArray(D.profiles)?D.profiles:[];
  const profileRows=[];
  const pageSize=1000;
  for(let from=0;;from+=pageSize){
    const r=await db.from('profiles')
      .select('id,full_name,email,role,student_number,job_title,department,created_at')
      .order('created_at',{ascending:false})
      .range(from,from+pageSize-1);
    if(r.error){
      loadErrors.push('profiles: '+r.error.message);
      D.profiles=previousProfiles;
      break;
    }
    profileRows.push(...(r.data||[]));
    if((r.data||[]).length<pageSize){
      D.profiles=profileRows;
      break;
    }
  }

  const specs=[
    ['admin_audit_log','id,actor_id,action,department,entity_type,entity_id,details,created_at,source,status,responsible_person,occurred_on','created_at',1000],
    ['security_incidents','id,title,severity,status,description,reported_by,assigned_to,resolution_notes,detected_at,resolved_at,created_at,updated_at','created_at',1000],
    ['security_access_reviews','id,subject_profile_id,reviewed_by,role_snapshot,job_title_snapshot,department_snapshot,decision,notes,reviewed_at','reviewed_at',1000],
    ['platform_security_checks','id,check_name,check_area,status,evidence,checked_by,checked_at','checked_at',1000]
  ];
  await Promise.all(specs.map(async([name,fields,order,limit])=>{
    const r=await db.from(name).select(fields).order(order,{ascending:false}).limit(limit);
    if(r.error){
      loadErrors.push(name+': '+r.error.message);
      if(!Array.isArray(D[name]))D[name]=[];
      return;
    }
    D[name]=r.data||[];
  }));

  const auditCount=await db.from('admin_audit_log').select('id',{count:'exact',head:true});
  if(auditCount.error){
    loadErrors.push('admin_audit_log count: '+auditCount.error.message);
  }else{
    D._auditCount=Number(auditCount.count||0);
  }
}

const profile=id=>(D.profiles||[]).find(x=>x.id===id)||{};
const latestReview=id=>(D.security_access_reviews||[]).find(r=>r.subject_profile_id===id);

function accessGroups(){
  const ps=D.profiles||[];
  return {
    students:ps.filter(p=>!isDeleted(p)&&low(p.role)==='student'),
    staff:ps.filter(p=>!isDeleted(p)&&['staff','admin'].includes(low(p.role))),
    deleted:ps.filter(isDeleted)
  };
}
function filteredAccess(){
  let rows=accessGroups()[accessKind]||[];
  const q=low(accessSearch.trim());
  if(q)rows=rows.filter(p=>low([
    p.full_name,p.email,p.role,p.student_number,p.job_title,p.department
  ].join(' ')).includes(q));
  return rows;
}
function accessRowsMarkup(){
  const rows=filteredAccess();
  const total=rows.length;
  const maxPage=Math.max(1,Math.ceil(total/PAGE_SIZE));
  accessPage[accessKind]=Math.min(Math.max(1,accessPage[accessKind]||1),maxPage);
  const page=accessPage[accessKind];
  const start=(page-1)*PAGE_SIZE;
  const slice=rows.slice(start,start+PAGE_SIZE);
  const html=slice.map(p=>{
    const last=latestReview(p.id);
    const deleted=isDeleted(p);
    const identifier=low(p.role)==='student'
      ?(p.student_number||'Student account')
      :(p.job_title||'Staff / Admin');
    const context=[p.department,low(p.role)==='admin'?'Administrator':low(p.role)==='staff'?'Staff':'Student'].filter(Boolean).join(' · ');
    return `<tr>
      <td><b>${esc(p.full_name||p.email||'User')}</b><div class="sxMeta">${esc(p.email||'')}</div></td>
      <td>${esc(String(p.role||'—').replace(/^./,x=>x.toUpperCase()))}</td>
      <td>${esc(identifier)}</td>
      <td>${esc(context||'—')}</td>
      <td>${last?'<span class="sxPill '+esc(low(last.decision))+'">'+esc(String(last.decision).toUpperCase())+'</span><div class="sxMeta">'+fmt(last.reviewed_at)+'</div>':'Not reviewed'}</td>
      <td>${deleted?'<span class="sxMeta">Archived record</span>':`<button class="sxBtn alt" data-review-user="${p.id}">Record Review</button>`}</td>
    </tr>`;
  }).join('');
  return {
    html:html||'<tr><td colspan="6" class="sxEmpty">No accounts match this view.</td></tr>',
    total,page,maxPage,start:total?start+1:0,end:Math.min(start+PAGE_SIZE,total)
  };
}
function drawAccess(){
  const tbody=$('sxAccessRows'),pager=$('sxAccessPager');
  if(!tbody||!pager)return;
  const r=accessRowsMarkup();
  tbody.innerHTML=r.html;
  pager.innerHTML=`
    <div class="sxMeta">Showing ${r.start}–${r.end} of ${r.total} · 10 accounts per page</div>
    <div>
      <button class="sxBtn alt" id="sxPrevPage" ${r.page<=1?'disabled':''}>Previous</button>
      <span class="sxMeta" style="margin:0 8px">Page ${r.page} of ${r.maxPage}</span>
      <button class="sxBtn alt" id="sxNextPage" ${r.page>=r.maxPage?'disabled':''}>Next</button>
    </div>`;
  const prev=$('sxPrevPage'),next=$('sxNextPage');
  if(prev)prev.onclick=()=>{accessPage[accessKind]=Math.max(1,accessPage[accessKind]-1);drawAccess()};
  if(next)next.onclick=()=>{accessPage[accessKind]=Math.min(r.maxPage,accessPage[accessKind]+1);drawAccess()};
}
function accessBody(){
  const g=accessGroups();
  return `
    <div class="sxMeta" style="margin-bottom:8px">Accounts are separated so Student, Staff/Admin and deleted-account evidence remain clear. Access-review outcomes are governance evidence only; they do not deactivate, delete or change a login. Account actions remain controlled through CEO Account Control. Deleted accounts stay as archived records for historical accountability and cannot be access-reviewed here. Staff Access Codes are not loaded into this screen.</div>
    <div class="sxAccessTabs">
      <button class="sxBtn ${accessKind==='students'?'':'alt'}" data-access-kind="students">Students (${g.students.length})</button>
      <button class="sxBtn ${accessKind==='staff'?'':'alt'}" data-access-kind="staff">Staff & Admin (${g.staff.length})</button>
      <button class="sxBtn ${accessKind==='deleted'?'':'alt'}" data-access-kind="deleted">Deleted Accounts (${g.deleted.length})</button>
    </div>
    <div class="sxSearchRow">
      <input class="sxInput" id="sxAccessSearch" placeholder="Search this account group by name, email, number, role or department" value="${esc(accessSearch)}">
      <button class="sxBtn alt" id="sxClearSearch">Clear</button>
    </div>
    <table class="sxTable">
      <thead><tr><th>User / login</th><th>Type</th><th>Identifier</th><th>Role context</th><th>Last review</th><th>Action</th></tr></thead>
      <tbody id="sxAccessRows"></tbody>
    </table>
    <div class="sxPager" id="sxAccessPager"></div>`;
}
function incidentRows(){
  return (D.security_incidents||[]).map(i=>`<tr>
    <td><b>${esc(i.title)}</b><div class="sxMeta">${esc(i.description||'')}</div>${i.resolution_notes?'<div class="sxMeta"><b>Resolution:</b> '+esc(i.resolution_notes)+'</div>':''}</td>
    <td><span class="sxPill ${low(i.severity)}">${esc(String(i.severity).toUpperCase())}</span></td>
    <td><span class="sxPill ${low(i.status)}">${esc(String(i.status).toUpperCase())}</span></td>
    <td>${fmt(i.detected_at)}</td>
    <td>${esc(profile(i.reported_by).email||'—')}</td>
    <td>${!['resolved','closed'].includes(low(i.status))?`<button class="sxBtn alt" data-incident-status="investigating" data-id="${i.id}">Investigate</button> <button class="sxBtn" data-incident-status="resolved" data-id="${i.id}">Resolve</button>`:'—'}</td>
  </tr>`).join('')||'<tr><td colspan="6" class="sxEmpty">No security incidents recorded.</td></tr>';
}
function auditRows(){
  return (D.admin_audit_log||[]).slice(0,100).map(a=>`<tr>
    <td>${fmt(a.created_at)}</td><td>${esc(profile(a.actor_id).email||a.actor_id||'System')}</td>
    <td>${esc(a.action||'—')}</td><td>${esc(a.department||'—')}</td>
    <td>${esc(a.entity_type||'—')}</td><td>${esc(a.details||'')}</td>
  </tr>`).join('')||'<tr><td colspan="6" class="sxEmpty">No admin audit events found.</td></tr>';
}
function checks(){
  const defaults=[
    ['Authentication & admin access','Access Control'],
    ['Row Level Security coverage','Database'],
    ['Administrative audit logging','Audit'],
    ['Student data access review','Privacy'],
    ['Security incident register','Operations'],
    ['Backup / recovery evidence','Continuity']
  ];
  return defaults.map(([n,a])=>{
    const c=(D.platform_security_checks||[]).find(x=>x.check_name===n);
    return `<tr><td><b>${esc(n)}</b></td><td>${esc(a)}</td>
      <td><span class="sxPill ${low(c?.status||'review')}">${esc((c?.status||'review').toUpperCase())}</span></td>
      <td>${esc(c?.evidence||'Awaiting documented check')}</td><td>${c?fmt(c.checked_at):'—'}</td>
      <td><button class="sxBtn alt" data-check="${esc(n)}" data-area="${esc(a)}">Record Check</button></td></tr>`;
  }).join('');
}

function render(tab=currentTab){
  if(!active())return;
  currentTab=tab;
  const groups=accessGroups();
  const admins=groups.staff.filter(p=>low(p.role)==='admin').length;
  const staff=groups.staff.filter(p=>low(p.role)==='staff').length;
  const open=(D.security_incidents||[]).filter(i=>!['resolved','closed'].includes(low(i.status))).length;
  const audits=Number.isFinite(D._auditCount)?D._auditCount:(D.admin_audit_log||[]).length;
  let body='';
  if(tab==='access')body=accessBody();
  else if(tab==='incidents')body=`<div class="sxBar"><input class="sxInput" id="siTitle" placeholder="Incident title"><select class="sxSelect" id="siSeverity"><option>low</option><option selected>medium</option><option>high</option><option>critical</option></select><input class="sxInput" id="siDesc" placeholder="What happened / evidence"><button class="sxBtn bad" id="siAdd">Log Incident</button></div><table class="sxTable"><thead><tr><th>Incident</th><th>Severity</th><th>Status</th><th>Detected</th><th>Reported by</th><th>Action</th></tr></thead><tbody>${incidentRows()}</tbody></table>`;
  else if(tab==='checks')body=`<table class="sxTable"><thead><tr><th>Control</th><th>Area</th><th>Status</th><th>Evidence</th><th>Checked</th><th>Action</th></tr></thead><tbody>${checks()}</tbody></table>`;
  else body=`<table class="sxTable"><thead><tr><th>Date</th><th>Actor / login</th><th>Action</th><th>Department</th><th>Entity</th><th>Evidence</th></tr></thead><tbody>${auditRows()}</tbody></table>`;

  $('view').innerHTML=`
    <div class="sxHero"><b>IT, SECURITY & PLATFORM</b><h2>Security & Platform Control Centre</h2><p>Access governance, incident accountability, platform control evidence and administrative audit visibility.</p></div>
    ${loadErrors.length?'<div class="sxAlert"><b>Security data warning:</b> '+esc(loadErrors.join(' | '))+' The last successfully loaded information remains visible; failed queries are not shown as false zeroes.</div>':''}
    <div class="sxK">
      <div class="sxCard"><strong>${groups.students.length}</strong><span>Active student accounts</span></div>
      <div class="sxCard"><strong>${staff}</strong><span>Staff accounts</span></div>
      <div class="sxCard"><strong>${admins}</strong><span>Admin accounts</span></div>
      <div class="sxCard"><strong>${groups.deleted.length}</strong><span>Deleted / archived accounts</span></div>
      <div class="sxCard"><strong>${open}</strong><span>Open security incidents</span></div>
      <div class="sxCard"><strong>${audits}</strong><span>Admin audit events</span></div>
    </div>
    <div class="sxTabs">
      ${[['access','Access Governance'],['incidents','Security Incidents'],['checks','Platform Controls'],['audit','Audit Activity']].map(x=>`<button class="sxBtn ${tab===x[0]?'':'alt'}" data-sx-tab="${x[0]}">${x[1]}</button>`).join('')}
      <button class="sxBtn alt" id="sxRefresh">Refresh</button>
    </div>
    <div class="sxPanel" style="overflow:auto">${body}</div>`;
  wire(tab);
}

function wire(tab){
  document.querySelectorAll('[data-sx-tab]').forEach(b=>b.onclick=()=>render(b.dataset.sxTab));
  $('sxRefresh').onclick=()=>open();
  if(tab==='access'){
    document.querySelectorAll('[data-access-kind]').forEach(b=>b.onclick=()=>{
      accessKind=b.dataset.accessKind;
      accessPage[accessKind]=1;
      render('access');
    });
    const q=$('sxAccessSearch');
    if(q)q.oninput=()=>{accessSearch=q.value;accessPage[accessKind]=1;drawAccess()};
    const clear=$('sxClearSearch');
    if(clear)clear.onclick=()=>{accessSearch='';accessPage[accessKind]=1;if(q)q.value='';drawAccess()};
    const panel=document.querySelector('.sxPanel');
    if(panel)panel.onclick=e=>{
      const b=e.target.closest('[data-review-user]');
      if(b)reviewAccess(b.dataset.reviewUser);
    };
    drawAccess();
  }
  if(tab==='incidents'){
    $('siAdd').onclick=addIncident;
    document.querySelector('.sxPanel').onclick=e=>{
      const b=e.target.closest('[data-incident-status]');
      if(b)setIncident(b.dataset.id,b.dataset.incidentStatus);
    };
  }
  if(tab==='checks'){
    document.querySelector('.sxPanel').onclick=e=>{
      const b=e.target.closest('[data-check]');
      if(b)recordCheck(b.dataset.check,b.dataset.area);
    };
  }
}
async function me(){const {data:{user}}=await db.auth.getUser();return user}
async function log(action,entity,id,details){
  const u=await me();
  const r=await db.from('admin_audit_log').insert({actor_id:u?.id||null,action,department:'IT & Security',entity_type:entity,entity_id:String(id||''),details});
  return r.error||null;
}
function warnAudit(error){
  if(!error)return;
  console.error('IT security audit-log write failed:',error);
  alert('The main record was saved, but its Audit Activity entry could not be recorded. Please review the Audit Activity tab before making another security change.');
}
async function addIncident(){
  const title=$('siTitle').value.trim(),description=$('siDesc').value.trim();
  if(!title)return alert('Enter an incident title.');
  if(description.length<5)return alert('Enter a short description or evidence for the incident.');
  const u=await me();
  const r=await db.from('security_incidents').insert({title,severity:$('siSeverity').value,description,reported_by:u?.id||null});
  if(r.error)return alert(r.error.message);
  warnAudit(await log('Logged security incident','security_incident','',title));
  await open();render('incidents');
}
async function setIncident(id,status){
  const item=(D.security_incidents||[]).find(x=>x.id===id);
  const u=await me();
  const patch={status,updated_at:new Date().toISOString()};
  if(!item?.assigned_to&&u?.id)patch.assigned_to=u.id;
  if(status==='resolved'){
    const notes=prompt('Resolution notes / evidence (required):','');
    if(!notes||notes.trim().length<5)return alert('Enter clear resolution notes before resolving an incident.');
    patch.resolution_notes=notes.trim();
    patch.resolved_at=new Date().toISOString();
  }
  const r=await db.from('security_incidents').update(patch).eq('id',id);
  if(r.error)return alert(r.error.message);
  warnAudit(await log('Updated security incident','security_incident',id,status+(patch.resolution_notes?' · '+patch.resolution_notes:'')));
  await open();render('incidents');
}
async function reviewAccess(id){
  const p=profile(id);
  if(isDeleted(p))return alert('Deleted accounts are retained as archived evidence and cannot be access-reviewed here.');
  let decision=prompt('Record review outcome: retain, restrict, remove, investigate. This records governance evidence only and does not change the account.','retain');
  if(!decision)return;
  decision=low(decision);
  if(!['retain','restrict','remove','investigate'].includes(decision))return alert('Use retain, restrict, remove, or investigate.');
  const notes=(prompt('Review notes / evidence','Role and access reviewed against current duties.')||'').trim();
  if(notes.length<5)return alert('Enter clear review notes / evidence.');
  const u=await me();
  const r=await db.from('security_access_reviews').insert({
    subject_profile_id:id,reviewed_by:u.id,role_snapshot:p.role,job_title_snapshot:p.job_title,
    department_snapshot:p.department,decision,notes
  });
  if(r.error)return alert(r.error.message);
  warnAudit(await log('Completed access review','profile',id,decision+' · '+notes));
  await open();render('access');
}
async function recordCheck(name,area){
  let status=prompt('Control status: good, review, risk','good');
  if(!status)return;
  status=low(status);
  if(!['good','review','risk'].includes(status))return alert('Use good, review, or risk.');
  const evidence=(prompt('Evidence / finding (required):','')||'').trim();
  if(evidence.length<5)return alert('Record clear evidence or a finding for this control.');
  const u=await me();
  const r=await db.from('platform_security_checks').insert({check_name:name,check_area:area,status,evidence,checked_by:u.id});
  if(r.error)return alert(r.error.message);
  warnAudit(await log('Recorded platform security check','security_control','',name+' · '+status+' · '+evidence));
  await open();render('checks');
}
async function open(){
  css();
  await load();
  render(currentTab);
}
function install(){
  css();
  window.FundaSecurityCentre={open};
  const old=window.security;
  window.security=function(){try{old?.()}catch(e){}setTimeout(open,0)};
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#nav button,.nav button');
    if(b&&isSecurityLabel(b.textContent))setTimeout(open,60);
  },false);
  if(active())setTimeout(open,80);
}
if(document.readyState==='complete')setTimeout(install,0);
else window.addEventListener('load',()=>setTimeout(install,0),{once:true});
})();