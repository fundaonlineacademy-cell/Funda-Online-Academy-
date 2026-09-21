(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname))return;

let db;
let auditRows=[],reportRuns=[],complianceRows=[],profiles=[];
let auditLoaded=false,runsLoaded=false,complianceLoaded=false;
let loadErrors=[];
let activeTab='audit',auditPage=1,compliancePage=1,historyPage=1,editingComplianceId=null;
const PAGE_SIZE=10;
const $=x=>document.getElementById(x);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v??'').trim().toLowerCase();
const fmt=v=>v?new Date(v).toLocaleString('en-ZA'):'—';
const day=v=>v?new Date(v).toLocaleDateString('en-ZA'):'—';

function active(){
  const b=document.querySelector('#nav button.on,#nav button.active,.nav button.on,.nav button.active');
  return !!b&&/reports|compliance|audit/i.test(b.textContent||'');
}
function css(){
  if($('foaAuditComplianceCss'))return;
  const s=document.createElement('style');s.id='foaAuditComplianceCss';
  s.textContent=`
    .rcaRoot{font-family:"Source Sans 3","Segoe UI",Arial,sans-serif;color:#10213f}
    .rcaHero{padding:20px;border-radius:15px;background:linear-gradient(135deg,#03101f,#0b315c);color:#fff;border-bottom:4px solid #d4af58}
    .rcaHero small{display:block;color:#efd78e;font-size:12px;font-weight:900;letter-spacing:.12em}.rcaHero h1{margin:5px 0;font-size:24px}.rcaHero p{margin:0;color:#dce8f4;font-size:14px;line-height:1.55}
    .rcaWarn{margin:10px 0;padding:11px 13px;border:1px solid #efcaca;border-radius:9px;background:#fff3f3;color:#8b2626;font-size:13px;line-height:1.5}
    .rcaMetrics{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:11px 0}.rcaMetric,.rcaPanel{background:#fff;border:1px solid #e1e7ef;border-radius:11px;padding:13px}
    .rcaMetric strong{display:block;font-size:21px;color:#071b31}.rcaMetric span{font-size:12px;color:#64748b}
    .rcaTabs,.rcaBar{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.rcaBtn{border:0;border-radius:8px;padding:9px 11px;background:#071b31;color:#efd78e;font:800 13px/1.2 "Source Sans 3","Segoe UI",Arial,sans-serif;cursor:pointer}
    .rcaBtn.alt{background:#fff;color:#071b31;border:1px solid #d9dfe8}.rcaBtn.good{background:#176b50;color:#fff}.rcaBtn:disabled{opacity:.55;cursor:not-allowed}
    .rcaField,.rcaText{border:1px solid #d9dfe8;border-radius:8px;padding:9px 11px;font:400 13px/1.4 "Source Sans 3","Segoe UI",Arial,sans-serif;background:#fff;color:#10213f}
    .rcaField{min-width:150px}.rcaText{width:100%;min-height:90px;resize:vertical}.rcaGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .rcaWide{grid-column:1/-1}.rcaTableWrap{overflow:auto}.rcaTable{width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}.rcaTable th,.rcaTable td{padding:10px;border-bottom:1px solid #edf0f3;text-align:left;vertical-align:top}
    .rcaTable th{font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.04em;background:#f8fafc}.rcaMeta{font-size:12px;line-height:1.45;color:#64748b}.rcaWrap{white-space:normal;min-width:250px}
    .rcaPill{display:inline-block;padding:4px 8px;border-radius:99px;background:#edf2f7;font-size:11px;font-weight:800;text-transform:uppercase}.rcaPill.open,.rcaPill.in_progress,.rcaPill.action_required,.rcaPill.review_due{background:#fff2d2;color:#8a5a05}.rcaPill.resolved,.rcaPill.closed,.rcaPill.compliant,.rcaPill.good{background:#e5f6ef;color:#176b50}
    .rcaPager{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid #edf0f3}.rcaEmpty{padding:20px;text-align:center;color:#64748b}
    @media(max-width:950px){.rcaMetrics{grid-template-columns:repeat(2,1fr)}.rcaGrid{grid-template-columns:1fr 1fr}}
    @media(max-width:650px){.rcaGrid{grid-template-columns:1fr}.rcaWide{grid-column:auto}.rcaHero h1{font-size:21px}}
  `;
  document.head.appendChild(s);
}
function pill(v){
  const k=low(v||'recorded').replace(/\s+/g,'_');
  return '<span class="rcaPill '+esc(k)+'">'+esc(String(v||'recorded').replaceAll('_',' '))+'</span>';
}
async function loadData(){
  db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  if(!db)return;
  loadErrors=[];
  const [a,r,c,p]=await Promise.all([
    db.rpc('admin_get_audit_register',{p_from:null,p_to:null,p_source:null,p_department:null,p_status:null,p_search:null,p_limit:10000}),
    db.from('admin_report_runs').select('*').order('created_at',{ascending:false}).limit(3000),
    db.from('admin_compliance_register').select('*').order('updated_at',{ascending:false}).limit(3000),
    db.from('profiles').select('id,full_name,email').limit(5000)
  ]);
  if(a.error)loadErrors.push('Unified audit register: '+a.error.message);else{auditRows=a.data||[];auditLoaded=true}
  if(r.error)loadErrors.push('Report history: '+r.error.message);else{reportRuns=r.data||[];runsLoaded=true}
  if(c.error)loadErrors.push('Compliance register: '+c.error.message);else{complianceRows=c.data||[];complianceLoaded=true}
  if(p.error)loadErrors.push('Profile names: '+p.error.message);else profiles=p.data||[];
}
function profileName(id){
  const p=profiles.find(x=>x.id===id);return p?.full_name||p?.email||'System';
}
function auditFilter(){
  if(!auditLoaded)return [];
  const search=low($('rcaSearch')?.value),from=$('rcaFrom')?.value,to=$('rcaTo')?.value,source=$('rcaSource')?.value||'',dept=$('rcaDept')?.value||'',status=$('rcaStatus')?.value||'';
  return auditRows.filter(x=>{
    const d=String(x.event_date||x.event_time||'').slice(0,10);
    if(from&&d<from)return false;if(to&&d>to)return false;
    if(source&&x.source!==source)return false;if(dept&&x.department!==dept)return false;if(status&&low(x.status)!==low(status))return false;
    if(search&&!low([x.source,x.department,x.action,x.entity_type,x.entity_id,x.responsible_person,x.status,x.details,x.actor_name].join(' ')).includes(search))return false;
    return true;
  });
}
function pager(list,page){
  const max=Math.max(1,Math.ceil(list.length/PAGE_SIZE));page=Math.min(Math.max(1,page),max);
  const start=(page-1)*PAGE_SIZE;return {page,max,start,end:Math.min(start+PAGE_SIZE,list.length),slice:list.slice(start,start+PAGE_SIZE)};
}
function filterOptions(values){
  return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b)));
}
function auditPanel(){
  if(!auditLoaded)return '<div class="rcaPanel"><div class="rcaEmpty">Audit data is currently unavailable. Use Refresh after checking the warning above.</div></div>';
  const sources=filterOptions(auditRows.map(x=>x.source)),depts=filterOptions(auditRows.map(x=>x.department)),statuses=filterOptions(auditRows.map(x=>x.status));
  const list=auditFilter(),pg=pager(list,auditPage);auditPage=pg.page;
  const rows=pg.slice.map(x=>`<tr>
    <td>${day(x.event_time)}<div class="rcaMeta">${fmt(x.event_time)}</div></td>
    <td>${esc(x.source)}</td><td>${esc(x.department||'—')}</td>
    <td><b>${esc(x.action||'—')}</b><div class="rcaMeta">${esc(x.source_table||'')}</div></td>
    <td>${esc(x.entity_type||'—')}<div class="rcaMeta">${esc(x.entity_id||'')}</div></td>
    <td>${esc(x.responsible_person||'—')}</td><td>${pill(x.status)}</td>
    <td class="rcaWrap">${esc(x.details||'—')}</td><td>${esc(x.actor_name||'System')}</td>
  </tr>`).join('')||'<tr><td colspan="9"><div class="rcaEmpty">No audit activity matches the current filters.</div></td></tr>';
  return `
    <div class="rcaPanel">
      <h2>Audit Activity Register</h2>
      <p class="rcaMeta">Unified register across Admin, Academic, Enrolments/Course Change, HR, CEO Account Control, Account Registration and IT/Security audit sources. Historical source records remain in their original tables.</p>
      <div class="rcaBar">
        <input id="rcaSearch" class="rcaField" style="flex:1;min-width:230px" placeholder="Search activity, person, reference, details…">
        <input id="rcaFrom" class="rcaField" type="date"><input id="rcaTo" class="rcaField" type="date">
        <select id="rcaSource" class="rcaField"><option value="">All sources</option>${sources.map(x=>`<option>${esc(x)}</option>`).join('')}</select>
        <select id="rcaDept" class="rcaField"><option value="">All departments</option>${depts.map(x=>`<option>${esc(x)}</option>`).join('')}</select>
        <select id="rcaStatus" class="rcaField"><option value="">All statuses</option>${statuses.map(x=>`<option>${esc(x)}</option>`).join('')}</select>
        <button class="rcaBtn alt" id="rcaApply">Apply</button>
      </div>
      <div class="rcaBar"><button class="rcaBtn" id="rcaExcel">Download Excel (.xlsx)</button><button class="rcaBtn" id="rcaPdf">Download PDF</button><button class="rcaBtn alt" id="rcaReportCentre">Report Centre</button></div>
      <div class="rcaTableWrap"><table class="rcaTable"><thead><tr><th>Date</th><th>Source</th><th>Department</th><th>Activity</th><th>Entity / Ref</th><th>Responsible</th><th>Status</th><th>Details</th><th>Recorded By</th></tr></thead><tbody id="rcaAuditRows">${rows}</tbody></table></div>
      <div class="rcaPager"><span class="rcaMeta">Showing ${list.length?pg.start+1:0}–${pg.end} of ${list.length} · 10 per page</span><div class="rcaBar" style="margin:0"><button class="rcaBtn alt" id="rcaPrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="rcaMeta">Page ${pg.page} of ${pg.max}</span><button class="rcaBtn alt" id="rcaNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div>
    </div>
    <div class="rcaPanel" style="margin-top:10px">
      <h2>Add Manual Audit / Compliance Evidence</h2>
      <p class="rcaMeta">Use this for inspections, findings, reviews, policy breaches, corrective actions or evidence not created automatically by another Academy system.</p>
      <div class="rcaGrid">
        <select id="aaDept" class="rcaField"><option>Executive / Governance</option><option>Finance & Accounting</option><option>Human Resources</option><option>Academic, Assessments & Content</option><option>Enrolments & Courses</option><option>Student Support & CRM</option><option>Marketing & Admissions</option><option>Communication Hub</option><option>IT, Security & Platform</option><option>General Compliance</option></select>
        <select id="aaType" class="rcaField"><option>Internal Audit</option><option>Compliance Review</option><option>Finding</option><option>Corrective Action</option><option>Policy Review</option><option>Incident Review</option><option>Evidence Record</option></select>
        <select id="aaRisk" class="rcaField"><option value="">Risk / severity not specified</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select>
        <input id="aaRef" class="rcaField" placeholder="Reference / record number"><input id="aaResponsible" class="rcaField" placeholder="Responsible person">
        <select id="aaStatus" class="rcaField"><option value="recorded">Recorded</option><option value="open">Open</option><option value="in_progress">In Progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select>
        <input id="aaDate" class="rcaField" type="date" value="${new Date().toISOString().slice(0,10)}"><input id="aaDue" class="rcaField" type="date" title="Corrective action due date"><input id="aaEvidence" class="rcaField" placeholder="Evidence / document / URL reference">
        <input id="aaAction" class="rcaField rcaWide" placeholder="Audit activity / finding / action title">
        <textarea id="aaDetails" class="rcaText rcaWide" placeholder="Full observation, evidence, decision, risk and corrective action details…"></textarea>
      </div>
      <div class="rcaBar"><button class="rcaBtn" id="aaSave">Save Audit Entry</button></div>
    </div>`;
}
function compliancePanel(){
  if(!complianceLoaded)return '<div class="rcaPanel"><div class="rcaEmpty">Compliance-register data is currently unavailable.</div></div>';
  const pg=pager(complianceRows,compliancePage);compliancePage=pg.page;
  const rows=pg.slice.map(x=>`<tr>
    <td><b>${esc(x.control_name)}</b><div class="rcaMeta">${esc(x.control_area)}</div></td>
    <td>${esc(x.requirement_basis||'—')}</td><td>${esc(x.owner_department)}</td><td>${esc(x.responsible_person||'—')}</td>
    <td>${pill(x.status)}</td><td class="rcaWrap">${esc(x.evidence||'—')}</td><td class="rcaWrap">${esc(x.corrective_action||'—')}</td>
    <td>${day(x.last_review_date)}<div class="rcaMeta">Next: ${day(x.next_review_date)} · Due: ${day(x.due_date)}</div></td>
    <td><button class="rcaBtn alt" data-comp-edit="${x.id}">Edit</button></td>
  </tr>`).join('')||'<tr><td colspan="9"><div class="rcaEmpty">No central compliance controls recorded yet. Do not create synthetic evidence; add real controls as the Academy reviews them.</div></td></tr>';
  return `
    <div class="rcaPanel">
      <h2>Business Compliance Register</h2>
      <p class="rcaMeta">Central register for real compliance obligations, responsible ownership, evidence, review dates and corrective actions. HR statutory reviews may remain in the HR compliance workspace while being included in formal reports.</p>
      <div class="rcaGrid">
        <input id="coArea" class="rcaField" placeholder="Control area *"><input id="coName" class="rcaField" placeholder="Control / requirement *"><input id="coBasis" class="rcaField" placeholder="Requirement basis / law / policy">
        <select id="coDept" class="rcaField"><option>Human Resources</option><option>Finance & Accounting</option><option>Academic, Assessments & Content</option><option>Enrolments & Courses</option><option>Student Support & CRM</option><option>Marketing & Admissions</option><option>Communication Hub</option><option>IT, Security & Platform</option><option>Executive / Governance</option></select>
        <input id="coResponsible" class="rcaField" placeholder="Responsible person"><select id="coStatus" class="rcaField"><option value="not_reviewed">Not Reviewed</option><option value="compliant">Compliant</option><option value="review_due">Review Due</option><option value="action_required">Action Required</option><option value="in_progress">In Progress</option><option value="closed">Closed</option></select>
        <input id="coLast" class="rcaField" type="date" title="Last review"><input id="coNext" class="rcaField" type="date" title="Next review"><input id="coDue" class="rcaField" type="date" title="Corrective action due date">
        <textarea id="coEvidence" class="rcaText rcaWide" placeholder="Evidence / reference / document / URL"></textarea><textarea id="coAction" class="rcaText rcaWide" placeholder="Corrective action / follow-up"></textarea>
      </div>
      <div class="rcaBar"><button class="rcaBtn" id="coSave">${editingComplianceId?'Update Compliance Control':'Save Compliance Control'}</button>${editingComplianceId?'<button class="rcaBtn alt" id="coCancel">Cancel Edit</button>':''}</div>
      <div class="rcaTableWrap"><table class="rcaTable"><thead><tr><th>Control</th><th>Basis</th><th>Department</th><th>Responsible</th><th>Status</th><th>Evidence</th><th>Corrective Action</th><th>Review Dates</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="rcaPager"><span class="rcaMeta">Showing ${complianceRows.length?pg.start+1:0}–${pg.end} of ${complianceRows.length} · 10 per page</span><div class="rcaBar" style="margin:0"><button class="rcaBtn alt" id="coPrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="rcaMeta">Page ${pg.page} of ${pg.max}</span><button class="rcaBtn alt" id="coNextPage" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div>
    </div>`;
}
function historyPanel(){
  if(!runsLoaded)return '<div class="rcaPanel"><div class="rcaEmpty">Report history is currently unavailable.</div></div>';
  const pg=pager(reportRuns,historyPage);historyPage=pg.page;
  const rows=pg.slice.map(x=>`<tr>
    <td><b>${esc(x.report_type)}</b></td><td>${esc(x.output_format?String(x.output_format).toUpperCase():'Legacy / not recorded')}</td>
    <td>${x.report_scope==='all'?'All available records':(x.period_start||'—')+' to '+(x.period_end||'—')}</td><td>${x.row_count??x.summary?.rows??'—'}</td>
    <td>${esc(profileName(x.generated_by))}</td><td>${fmt(x.created_at)}</td><td class="rcaWrap">${esc(x.file_name||'—')}</td>
  </tr>`).join('')||'<tr><td colspan="7"><div class="rcaEmpty">No generated reports have been logged.</div></td></tr>';
  return `<div class="rcaPanel"><div class="rcaBar" style="justify-content:space-between"><div><h2>Generated Report History</h2><p class="rcaMeta">Formal report-generation activity is retained for accountability.</p></div><button class="rcaBtn" id="historyGenerate">Generate New Report</button></div>
    <div class="rcaTableWrap"><table class="rcaTable"><thead><tr><th>Report</th><th>Format</th><th>Period / Scope</th><th>Rows</th><th>Generated By</th><th>Generated</th><th>File</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="rcaPager"><span class="rcaMeta">Showing ${reportRuns.length?pg.start+1:0}–${pg.end} of ${reportRuns.length} · 10 per page</span><div class="rcaBar" style="margin:0"><button class="rcaBtn alt" id="hiPrev" ${pg.page<=1?'disabled':''}>Previous</button><span class="rcaMeta">Page ${pg.page} of ${pg.max}</span><button class="rcaBtn alt" id="hiNext" ${pg.page>=pg.max?'disabled':''}>Next</button></div></div>
  </div>`;
}
function render(){
  if(!active())return;
  const manual=auditLoaded?auditRows.filter(x=>x.source==='Manual Audit').length:null;
  const open=auditLoaded?auditRows.filter(x=>['open','in_progress','action_required','review_due'].includes(low(x.status))).length:null;
  const compAction=complianceLoaded?complianceRows.filter(x=>['action_required','review_due','in_progress'].includes(low(x.status))).length:null;
  $('view').innerHTML=`<div class="rcaRoot">
    <div class="rcaHero"><small>ACCOUNTABILITY, REPORTING & COMPLIANCE</small><h1>Reports, Compliance & Audit</h1><p>Formal business reporting, consolidated audit evidence, compliance tracking and accountable governance records.</p></div>
    ${loadErrors.length?'<div class="rcaWarn"><b>Data warning:</b> '+esc(loadErrors.join(' | '))+' Failed sources are not being presented as zero records.</div>':''}
    <div class="rcaMetrics">
      <div class="rcaMetric"><strong>${auditLoaded?auditRows.length:'—'}</strong><span>Unified audit events</span></div>
      <div class="rcaMetric"><strong>${manual??'—'}</strong><span>Manual audit entries</span></div>
      <div class="rcaMetric"><strong>${open??'—'}</strong><span>Open / in-progress audit matters</span></div>
      <div class="rcaMetric"><strong>${compAction??'—'}</strong><span>Compliance actions / reviews due</span></div>
    </div>
    <div class="rcaTabs">
      <button class="rcaBtn ${activeTab==='audit'?'':'alt'}" data-rca-tab="audit">Audit Activity Register</button>
      <button class="rcaBtn ${activeTab==='compliance'?'':'alt'}" data-rca-tab="compliance">Compliance Register</button>
      <button class="rcaBtn ${activeTab==='history'?'':'alt'}" data-rca-tab="history">Report History</button>
      <button class="rcaBtn alt" id="rcaRefresh">Refresh</button>
    </div>
    ${activeTab==='audit'?auditPanel():activeTab==='compliance'?compliancePanel():historyPanel()}
  </div>`;
  wire();
  if(activeTab==='compliance'&&editingComplianceId)fillComplianceForm();
}
function wire(){
  document.querySelectorAll('[data-rca-tab]').forEach(b=>b.onclick=()=>{activeTab=b.dataset.rcaTab;render()});
  $('rcaRefresh').onclick=async()=>{await loadData();render()};
  if(activeTab==='audit')wireAudit();
  if(activeTab==='compliance')wireCompliance();
  if(activeTab==='history')wireHistory();
}
function wireAudit(){
  const refreshList=()=>{auditPage=1;render()};
  ['rcaSearch','rcaFrom','rcaTo','rcaSource','rcaDept','rcaStatus'].forEach(id=>$(id)?.addEventListener(id==='rcaSearch'?'input':'change',refreshList));
  $('rcaApply').onclick=refreshList;
  $('rcaPrev').onclick=()=>{auditPage=Math.max(1,auditPage-1);render()};
  $('rcaNext').onclick=()=>{auditPage++;render()};
  $('aaSave').onclick=saveAudit;
  $('rcaExcel').onclick=()=>exportAudit('xlsx');
  $('rcaPdf').onclick=()=>exportAudit('pdf');
  $('rcaReportCentre').onclick=()=>window.openFundaReportCentre?.('audit');
}
async function saveAudit(){
  const action=$('aaAction').value.trim(),details=$('aaDetails').value.trim();
  if(!action||!details)return alert('Enter the audit activity/title and full details.');
  const {data:{user}}=await db.auth.getUser();
  const extra=[
    $('aaRisk').value?'Risk/Severity: '+$('aaRisk').value:'',
    $('aaEvidence').value.trim()?'Evidence: '+$('aaEvidence').value.trim():'',
    $('aaDue').value?'Corrective action due: '+$('aaDue').value:'',
    'Details: '+details
  ].filter(Boolean).join(' · ');
  const q=await db.from('admin_audit_log').insert({
    actor_id:user?.id||null,action,department:$('aaDept').value,entity_type:$('aaType').value,
    entity_id:$('aaRef').value.trim()||null,details:extra,source:'manual',status:$('aaStatus').value,
    responsible_person:$('aaResponsible').value.trim()||null,occurred_on:$('aaDate').value||null
  });
  if(q.error)return alert(q.error.message);
  await loadData();auditPage=1;render();alert('Audit entry saved.');
}
function auditExportReport(){
  const rows=auditFilter().map(x=>({
    Date:fmt(x.event_time),Source:x.source,Department:x.department,Activity:x.action,
    Entity:x.entity_type,Reference:x.entity_id||'',Responsible:x.responsible_person||'',Status:x.status,
    Details:x.details||'','Recorded By':x.actor_name||'System'
  }));
  return {title:'Audit Activity Register',rows,summary:[
    ['Audit events',rows.length],['Manual entries',rows.filter(x=>x.Source==='Manual Audit').length],
    ['Open / in progress',rows.filter(x=>['open','in_progress','action_required','review_due'].includes(low(x.Status))).length],
    ['Sources',new Set(rows.map(x=>x.Source)).size]
  ]};
}
async function exportAudit(format){
  const api=window.FundaReportExports;if(!api)return alert('The report export service is still loading. Please try again.');
  const report=auditExportReport(),from=$('rcaFrom').value,to=$('rcaTo').value,scope=from||to?'period':'all';
  const btn=$(format==='xlsx'?'rcaExcel':'rcaPdf');btn.disabled=true;const old=btn.textContent;btn.textContent='Generating…';
  try{
    let fileName;
    if(format==='xlsx')fileName=await api.exportExcel(report,{from,to,scope});
    else fileName=await api.exportPdf(report,{from,to,scope});
    await api.logRun?.('audit',from,to,scope,format,report.rows.length,fileName);
    await loadData();
  }catch(e){alert(e.message||'The audit report could not be generated.')}
  finally{btn.disabled=false;btn.textContent=old}
}
function wireCompliance(){
  $('coSave').onclick=saveCompliance;
  $('coCancel')?.addEventListener('click',()=>{editingComplianceId=null;render()});
  document.querySelectorAll('[data-comp-edit]').forEach(b=>b.onclick=()=>{editingComplianceId=b.dataset.compEdit;render()});
  $('coPrev').onclick=()=>{compliancePage=Math.max(1,compliancePage-1);render()};
  $('coNextPage').onclick=()=>{compliancePage++;render()};
}
function fillComplianceForm(){
  const x=complianceRows.find(r=>r.id===editingComplianceId);if(!x)return;
  $('coArea').value=x.control_area||'';$('coName').value=x.control_name||'';$('coBasis').value=x.requirement_basis||'';$('coDept').value=x.owner_department||'Human Resources';
  $('coResponsible').value=x.responsible_person||'';$('coStatus').value=x.status||'not_reviewed';$('coEvidence').value=x.evidence||'';$('coAction').value=x.corrective_action||'';
  $('coLast').value=x.last_review_date||'';$('coNext').value=x.next_review_date||'';$('coDue').value=x.due_date||'';
}
async function saveCompliance(){
  const area=$('coArea').value.trim(),name=$('coName').value.trim();
  if(!area||!name)return alert('Control area and control / requirement are required.');
  const {data:{user}}=await db.auth.getUser();
  const payload={
    control_area:area,control_name:name,requirement_basis:$('coBasis').value.trim()||null,owner_department:$('coDept').value,
    responsible_person:$('coResponsible').value.trim()||null,status:$('coStatus').value,evidence:$('coEvidence').value.trim()||null,
    corrective_action:$('coAction').value.trim()||null,last_review_date:$('coLast').value||null,next_review_date:$('coNext').value||null,
    due_date:$('coDue').value||null,updated_at:new Date().toISOString()
  };
  let q;
  if(editingComplianceId)q=await db.from('admin_compliance_register').update(payload).eq('id',editingComplianceId);
  else q=await db.from('admin_compliance_register').insert({...payload,created_by:user?.id||null});
  if(q.error)return alert(q.error.message);
  const action=editingComplianceId?'Updated compliance control':'Created compliance control';
  await db.from('admin_audit_log').insert({
    actor_id:user?.id||null,action,department:'Executive / Governance',
    entity_type:'Compliance Register',entity_id:editingComplianceId||name,
    details:[area,name,$('coDept').value,$('coStatus').value,$('coEvidence').value.trim(),$('coAction').value.trim()].filter(Boolean).join(' · '),
    source:'manual',status:$('coStatus').value,responsible_person:$('coResponsible').value.trim()||null,occurred_on:new Date().toISOString().slice(0,10)
  });
  editingComplianceId=null;await loadData();render();
}
function wireHistory(){
  $('historyGenerate').onclick=()=>window.openFundaReportCentre?.();
  $('hiPrev').onclick=()=>{historyPage=Math.max(1,historyPage-1);render()};
  $('hiNext').onclick=()=>{historyPage++;render()};
}
async function open(){
  css();await loadData();render();
}
function install(){
  css();
  window.FundaAuditComplianceCentre={open};
  const old=window.audits;
  window.audits=function(){try{old?.()}catch(e){}setTimeout(open,0)};
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#nav button,.nav button');
    if(b&&/reports|compliance|audit/i.test(b.textContent||''))setTimeout(open,70);
  },false);
  if(active())setTimeout(open,80);
}
if(document.readyState==='complete')setTimeout(install,0);
else window.addEventListener('load',()=>setTimeout(install,0),{once:true});
})();