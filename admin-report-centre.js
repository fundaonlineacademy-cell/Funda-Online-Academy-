(()=>{
'use strict';
if(window.__FUNDA_REPORT_CENTRE__)return;
window.__FUNDA_REPORT_CENTRE__=true;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const low=v=>String(v??'').trim().toLowerCase();
const money=n=>'R'+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate=v=>v?new Date(v).toLocaleDateString('en-ZA'):'—';
const fmtDateTime=v=>v?new Date(v).toLocaleString('en-ZA'):'—';
const safeName=v=>String(v||'report').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80)||'report';
const client=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
if(!client)return;

const defs={
  executive:{label:'Executive Summary',tables:['profiles','ceo_account_control_state','courses','enrollments','payments','admin_cashbook','support_tickets','assessment_attempts','certificates','communications']},
  management:{label:'Management & Governance',tables:['governance_objectives','governance_policies','governance_risks','governance_actions','governance_decisions','governance_action_history']},
  finance:{label:'Finance & Accounting',tables:['profiles','courses','enrollments','payments','admin_cashbook']},
  enrolments:{label:'Enrolments',tables:['profiles','courses','enrollments']},
  students:{label:'Students',tables:['profiles','ceo_account_control_state']},
  courses:{label:'Courses',tables:['courses']},
  academic:{label:'Academic & Assessments',tables:['profiles','courses','assessment_attempts','certificates']},
  payments:{label:'Payments',tables:['profiles','payments']},
  support:{label:'Student Support & CRM',tables:['profiles','support_tickets','support_ticket_messages','support_ticket_events','student_consultations','consultation_events']},
  marketing:{label:'Marketing & Admissions',tables:['marketing_leads']},
  communication:{label:'Communication Hub',tables:['communications','communication_recipients']},
  cashbook:{label:'Expenses & Income',tables:['admin_cashbook']},
  hr:{label:'HR & Team',tables:['profiles','staff_records','hr_contracts','hr_leave_requests','hr_safety_incidents','hr_training_records','hr_performance_reviews','hr_compliance_reviews']},
  ambassador:{label:'Ambassador Programme',tables:['ambassador_programme_applications','ambassador_earnings_ledger','ambassador_payouts']},
  employer:{label:'Employer & Industry Partnerships',tables:['employer_partnership_requests','employer_opportunities']},
  library:{label:'Digital Library',tables:['courses','library_resources']},
  security:{label:'IT, Security & Platform',tables:['profiles','security_access_reviews','platform_security_checks','security_incidents']},
  compliance:{label:'Compliance Register',tables:['admin_compliance_register','hr_compliance_reviews']},
  audit:{label:'Audit Activity Register',tables:[]}
};

const css=`
.frc-backdrop{position:fixed;inset:0;background:rgba(3,16,31,.58);backdrop-filter:blur(3px);display:none;place-items:center;z-index:9999;padding:18px;font-family:"Source Sans 3","Segoe UI",Arial,sans-serif}
.frc-backdrop.open{display:grid}.frc-modal{width:min(780px,96vw);max-height:92vh;overflow:auto;background:#fff;border:1px solid #d8cfbb;border-radius:18px;box-shadow:0 30px 90px rgba(3,16,31,.35)}
.frc-head{padding:20px;background:linear-gradient(135deg,#03101f,#0a2344);color:#fff;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;border-bottom:4px solid #d4af58}
.frc-head h2{margin:0;font-size:22px;line-height:1.2}.frc-head p{margin:6px 0 0;color:#dfe7f2;font-size:14px;line-height:1.45}
.frc-close{border:1px solid rgba(212,175,88,.35);background:rgba(255,255,255,.07);color:#fff;width:36px;height:36px;border-radius:10px;cursor:pointer;font-size:20px}
.frc-body{padding:20px}.frc-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.frc-field{display:grid;gap:6px}
.frc-field label{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#536174}
.frc-field select,.frc-field input{width:100%;border:1px solid #d8d2c6;border-radius:10px;padding:10px 11px;background:#fff;color:#10213f;font:400 14px/1.4 "Source Sans 3","Segoe UI",Arial,sans-serif}
.frc-field select:focus,.frc-field input:focus{outline:none;border-color:#d4af58;box-shadow:0 0 0 3px rgba(212,175,88,.12)}
.frc-note{margin-top:12px;padding:12px;border-radius:10px;background:#f8f4e8;border:1px solid #e4d5aa;color:#6f5a21;font-size:13px;line-height:1.5}
.frc-actions{display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;padding-top:16px}
.frc-btn{border:0;border-radius:10px;padding:10px 14px;font:900 13px/1.2 "Source Sans 3","Segoe UI",Arial,sans-serif;cursor:pointer}
.frc-btn.primary{background:linear-gradient(135deg,#06172d,#12345d);color:#fff;border:1px solid rgba(212,175,88,.35)}
.frc-btn.light{background:#fff;color:#06172d;border:1px solid #d8cfbb}.frc-btn:disabled{opacity:.55;cursor:not-allowed}
.frc-status{font-size:13px;line-height:1.45;color:#667085;margin-top:10px;min-height:18px}.frc-trigger{display:inline-flex;align-items:center;gap:6px}
@media(max-width:700px){.frc-grid{grid-template-columns:1fr}.frc-modal{border-radius:14px}.frc-head h2{font-size:19px}}
`;

function installStyle(){
  if(document.getElementById('frc-style'))return;
  const s=document.createElement('style');s.id='frc-style';s.textContent=css;document.head.appendChild(s);
}
function loadScript(src,test){
  if(test())return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const old=[...document.scripts].find(s=>s.src===src);
    if(old){
      old.addEventListener('load',()=>test()?resolve():reject(new Error('Report export library did not initialise.')),{once:true});
      old.addEventListener('error',()=>reject(new Error('Report export library could not load.')),{once:true});
      return;
    }
    const s=document.createElement('script');s.src=src;s.async=true;
    s.onload=()=>test()?resolve():reject(new Error('Report export library did not initialise.'));
    s.onerror=()=>reject(new Error('Report export library could not load.'));
    document.head.appendChild(s);
  });
}
async function ensureExcel(){
  await loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js',()=>!!window.ExcelJS);
}
async function ensurePdf(){
  await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',()=>!!window.jspdf?.jsPDF);
  await loadScript('https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.2/dist/jspdf.plugin.autotable.min.js',()=>!!window.jspdf?.jsPDF?.API?.autoTable);
}
function modal(selected='executive'){
  let b=document.getElementById('frc-backdrop');
  if(!b){
    b=document.createElement('div');b.id='frc-backdrop';b.className='frc-backdrop';
    b.innerHTML=`<div class="frc-modal" role="dialog" aria-modal="true">
      <div class="frc-head"><div><h2>Funda Report Centre</h2><p>Generate a formal Excel workbook or downloadable PDF from live Academy records.</p></div><button class="frc-close" id="frc-close">×</button></div>
      <div class="frc-body">
        <div class="frc-grid">
          <div class="frc-field" style="grid-column:1/-1"><label>Report type</label><select id="frc-type">${Object.entries(defs).map(([k,v])=>`<option value="${k}">${esc(v.label)}</option>`).join('')}</select></div>
          <div class="frc-field"><label>From date</label><input type="date" id="frc-from"></div>
          <div class="frc-field"><label>To date</label><input type="date" id="frc-to"></div>
          <div class="frc-field"><label>Format</label><select id="frc-format"><option value="xlsx">Excel Workbook (.xlsx)</option><option value="pdf">PDF Report (.pdf)</option></select></div>
          <div class="frc-field"><label>Scope</label><select id="frc-scope"><option value="period">Selected date range</option><option value="all">All available records</option></select></div>
        </div>
        <div class="frc-note"><b>Excel</b> creates a structured FOA workbook with title, reporting period, generated-by details, styled columns, filters, frozen headings and print settings. <b>PDF</b> creates a directly downloadable formal report. If any required data source fails, the report is stopped rather than presenting incomplete data as zero.</div>
        <div class="frc-status" id="frc-status"></div>
        <div class="frc-actions"><button class="frc-btn light" id="frc-cancel">Cancel</button><button class="frc-btn primary" id="frc-generate">Generate Report</button></div>
      </div>
    </div>`;
    document.body.appendChild(b);
    document.getElementById('frc-close').onclick=close;
    document.getElementById('frc-cancel').onclick=close;
    b.addEventListener('click',e=>{if(e.target===b)close()});
    document.getElementById('frc-generate').onclick=generate;
  }
  if(defs[selected])document.getElementById('frc-type').value=selected;
  return b;
}
function open(selected='executive'){installStyle();modal(selected).classList.add('open')}
function close(){document.getElementById('frc-backdrop')?.classList.remove('open')}
function between(row,from,to,fields){
  if(!from&&!to)return true;
  const f=fields.find(k=>row?.[k])||fields[0],v=row?.[f];
  if(!v)return true;
  const d=new Date(v);
  if(Number.isNaN(d.getTime()))return true;
  if(from&&d<new Date(from+'T00:00:00'))return false;
  if(to&&d>new Date(to+'T23:59:59'))return false;
  return true;
}
async function fetchTables(names){
  const out={},errors=[];
  await Promise.all([...new Set(names)].map(async t=>{
    const {data,error}=await client.from(t).select('*');
    if(error)errors.push(t+': '+error.message);
    else out[t]=data||[];
  }));
  if(errors.length)throw new Error('Report data is incomplete because these sources could not be loaded: '+errors.join(' | '));
  return out;
}
async function fetchAudit(from,to,scope){
  const args={
    p_from:scope==='all'?null:(from||null),
    p_to:scope==='all'?null:(to||null),
    p_source:null,p_department:null,p_status:null,p_search:null,p_limit:10000
  };
  const {data,error}=await client.rpc('admin_get_audit_register',args);
  if(error)throw new Error('Unified audit register could not be loaded: '+error.message);
  return data||[];
}
async function fetchFor(type,from,to,scope){
  const data=await fetchTables(defs[type].tables||[]);
  if(type==='audit')data.audit_register=await fetchAudit(from,to,scope);
  if(type==='finance'){
    const args={p_from:scope==='all'?null:(from||null),p_to:scope==='all'?null:(to||null)};
    const period=await client.rpc('get_admin_finance_period',args);
    if(period.error)throw new Error('Canonical Finance period could not be loaded: '+period.error.message);
    data.finance_period=period.data||{};
    if(scope==='all'){
      const snap=await client.rpc('get_admin_finance_snapshot');
      if(snap.error)throw new Error('Canonical Finance snapshot could not be loaded: '+snap.error.message);
      data.finance_snapshot=snap.data||{};
    }
  }
  return data;
}
const byId=a=>Object.fromEntries((a||[]).map(x=>[x.id,x]));
function currentProfiles(data,role){
  const states=Object.fromEntries((data.ceo_account_control_state||[]).map(x=>[x.user_id,low(x.status)||'active']));
  return (data.profiles||[]).filter(x=>low(x.role)===role&&states[x.id]!=='deleted');
}
function filterRows(arr,scope,from,to,fields=['created_at','updated_at','submitted_at','issued_at','entry_date']){
  return (arr||[]).filter(r=>scope==='all'||between(r,from,to,fields));
}
function build(type,data,from,to,scope){
  const p=byId(data.profiles||[]),c=byId(data.courses||[]);
  let rows=[],summary=[],title=defs[type].label;
  const all=(arr,fields)=>filterRows(arr,scope,from,to,fields);

  if(type==='executive'){
    const students=currentProfiles(data,'student');
    const staff=currentProfiles(data,'staff');
    const courses=(data.courses||[]).filter(x=>x.active!==false);
    const approved=all(data.enrollments,['created_at','submitted_at','enrolled_at']).filter(x=>low(x.status||x.enrollment_status)==='approved');
    const verified=all(data.payments,['verified_at','submitted_at','created_at']).filter(x=>low(x.status)==='verified');
    const cash=all(data.admin_cashbook,['entry_date','created_at']);
    const attempts=all(data.assessment_attempts,['submitted_at','created_at']);
    const certs=all(data.certificates,['issued_at']);
    const comms=all(data.communications,['published_at','created_at']).filter(x=>x.published===true);
    const income=cash.filter(x=>low(x.entry_type)==='income').reduce((a,x)=>a+Number(x.amount||0),0);
    const expenses=cash.filter(x=>low(x.entry_type)==='expense').reduce((a,x)=>a+Number(x.amount||0),0);
    const receipts=verified.reduce((a,x)=>a+Number(x.amount||0),0);
    const open=(data.support_tickets||[]).filter(x=>!['closed','solved','resolved'].includes(low(x.status))).length;
    summary=[
      ['Current students',students.length],['Staff',staff.length],['Active courses',courses.length],
      ['Approved enrolments',approved.length],['Verified payment receipts',money(receipts)],
      ['Cashbook income',money(income)],['Cashbook expenses',money(expenses)],['Cashbook net',money(income-expenses)],
      ['Current open support tickets',open],['Assessment attempts',attempts.length],
      ['Certificates issued',certs.length],['Published communications',comms.length]
    ];
    rows=summary.map(x=>({Metric:x[0],Value:x[1]}));
  }

  if(type==='management'){
    const objectives=all(data.governance_objectives,['created_at','updated_at','target_date']);
    const policies=all(data.governance_policies,['created_at','updated_at','approved_at','review_date']);
    const risks=all(data.governance_risks,['created_at','updated_at','review_date']);
    const actions=all(data.governance_actions,['created_at','updated_at','due_date','last_completed_at']);
    const decisions=all(data.governance_decisions,['created_at','updated_at','decision_date','target_date']);
    const history=all(data.governance_action_history,['completed_at','created_at','due_date_completed','next_due_date']);
    rows=[
      ...objectives.map(x=>({'Record Type':'Strategic Objective',Title:x.title,Owner:x.owner||'',Department:x.department||'',Status:x.status||'',Date:fmtDate(x.target_date),Details:[x.description,x.progress!=null?'Progress '+x.progress+'%':''].filter(Boolean).join(' · '),Created:fmtDate(x.created_at)})),
      ...policies.map(x=>({'Record Type':'Policy',Title:x.title,Owner:x.owner||'',Department:x.category||'',Status:x.status||'',Date:fmtDate(x.review_date),Details:[x.version?'Version '+x.version:'',x.document_url||'',x.notes||''].filter(Boolean).join(' · '),Created:fmtDate(x.created_at)})),
      ...risks.map(x=>({'Record Type':'Risk',Title:x.title,Owner:x.owner||'',Department:x.department||x.category||'',Status:x.risk_status||'',Date:fmtDate(x.review_date),Details:[x.likelihood?'Likelihood '+x.likelihood:'',x.impact?'Impact '+x.impact:'',x.mitigation||''].filter(Boolean).join(' · '),Created:fmtDate(x.created_at)})),
      ...actions.map(x=>({'Record Type':'Management Action',Title:x.title,Owner:x.owner||'',Department:x.department||x.category||'',Status:x.status||'',Date:fmtDate(x.due_date),Details:[x.recurrence?String(x.recurrence).replaceAll('_',' '):'',x.priority||'',x.source_reference||'',x.evidence_requirement||''].filter(Boolean).join(' · '),Created:fmtDate(x.created_at)})),
      ...decisions.map(x=>({'Record Type':'Governance Decision',Title:x.title,Owner:x.owner||x.approved_by||'',Department:x.department||'',Status:x.implementation_status||'',Date:fmtDate(x.decision_date),Details:[x.decision_text,x.target_date?'Target '+fmtDate(x.target_date):''].filter(Boolean).join(' · '),Created:fmtDate(x.created_at)})),
      ...history.map(x=>({'Record Type':'Action Completion',Title:(actions.find(a=>a.id===x.action_id)?.title)||'Executive action',Owner:'',Department:'',Status:'completed',Date:fmtDateTime(x.completed_at),Details:[x.completion_notes,x.evidence_notes,x.next_due_date?'Next due '+fmtDate(x.next_due_date):''].filter(Boolean).join(' · '),Created:fmtDateTime(x.created_at)}))
    ];
    const openActions=actions.filter(x=>!['completed','closed'].includes(low(x.status)));
    const activeRisks=risks.filter(x=>['open','monitoring'].includes(low(x.risk_status)));
    const duePolicies=policies.filter(x=>low(x.status)!=='retired'&&x.review_date&&new Date(x.review_date+'T23:59:59')<new Date());
    summary=[
      ['Strategic objectives',objectives.length],
      ['Policies',policies.length],
      ['Active / monitored risks',activeRisks.length],
      ['Open management actions',openActions.length],
      ['Governance decisions',decisions.length],
      ['Action completion history',history.length],
      ['Policies due for review',duePolicies.length]
    ];
  }

  if(type==='finance'){
    const enrol=all(data.enrollments,['created_at','submitted_at','enrolled_at','reviewed_at']).filter(x=>low(x.status||x.enrollment_status)==='approved');
    const pay=all(data.payments,['verified_at','submitted_at','created_at']);
    const cash=all(data.admin_cashbook,['entry_date','created_at']);
    const period=data.finance_period||{};
    const snapshot=data.finance_snapshot||{};
    const commitment=enrol.reduce((total,x)=>total+Number(x.amount??c[x.course_id]?.price??0),0);
    rows=[
      ...enrol.map(x=>({
        'Record Type':'Approved enrolment commitment',
        Date:fmtDate(x.reviewed_at||x.submitted_at||x.created_at),
        Student:p[x.student_id]?.full_name||p[x.student_id]?.email||x.student_id,
        Course:c[x.course_id]?.title||x.course_id,
        Description:'Contracted approved tuition · current catalogue price '+money(c[x.course_id]?.price??x.amount??0),
        Status:x.status||x.enrollment_status,
        Amount:Number(x.amount??c[x.course_id]?.price??0)
      })),
      ...pay.map(x=>({
        'Record Type':'Payment',
        Date:fmtDate(x.verified_at||x.submitted_at||x.created_at),
        Student:p[x.student_id]?.full_name||p[x.student_id]?.email||x.student_id,
        Course:c[x.course_id]?.title||'',
        Description:[x.payment_method||'Payment',x.payment_reference||''].filter(Boolean).join(' · '),
        Status:x.status||'',
        Amount:Number(x.amount||0)
      })),
      ...cash.map(x=>({
        'Record Type':'Cashbook '+String(x.entry_type||'entry'),
        Date:fmtDate(x.entry_date||x.created_at),
        Student:'',
        Course:'',
        Description:[x.category,x.description,x.counterparty].filter(Boolean).join(' · '),
        Status:[x.posting_status||'posted',x.reconciliation_status||'unreconciled'].join(' · '),
        Amount:Number(x.amount||0)
      }))
    ];
    summary=[
      ['Contracted approved tuition in report scope',money(commitment)],
      ['Confirmed payment income',money(period.verified_tuition)],
      ['Other confirmed income',money(period.other_income)],
      ['Total confirmed income',money(period.confirmed_income)],
      ['Submitted / unverified collections',money(period.pending_collections)],
      ['Operating expenses',money(period.expenses)],
      ['Net cash result',money(period.net_result)],
      ['Payment records in canonical period',Number(period.payment_records||0)],
      ['Cashbook entries in canonical period',Number(period.cashbook_entries||0)]
    ];
    if(scope==='all'){
      summary.push(
        ['Current contracted approved tuition',money(snapshot.contracted_tuition??snapshot.enrolment_snapshot_tuition)],
        ['Current outstanding approved receivables',money(snapshot.contracted_outstanding_tuition??snapshot.outstanding_tuition)],
        ['Current catalogue value of approved enrolments',money(snapshot.approved_tuition)],
        ['Current catalogue variance',money(snapshot.catalogue_variance)],
        ['Current confirmed cash income',money(snapshot.confirmed_cash_income)]
      );
    }
  }

  if(type==='enrolments'){
    rows=all(data.enrollments,['created_at','submitted_at','enrolled_at']).map(x=>({
      Student:p[x.student_id]?.full_name||p[x.student_id]?.email||x.student_id,
      'Learner Number':p[x.student_id]?.student_number||'',
      Course:c[x.course_id]?.title||x.course_id,Status:x.status||x.enrollment_status,
      Amount:Number(x.amount||c[x.course_id]?.price||0),
      Submitted:fmtDate(x.submitted_at||x.created_at),Reviewed:fmtDate(x.reviewed_at),
      'Approval Department':x.approval_department,'Review Notes':x.review_notes||x.rejection_reason||''
    }));
    summary=[['Enrolments',rows.length],['Approved',rows.filter(x=>low(x.Status)==='approved').length],['Pending',rows.filter(x=>low(x.Status)==='pending').length]];
  }

  if(type==='students'){
    const students=currentProfiles(data,'student').filter(x=>scope==='all'||between(x,from,to,['created_at']));
    rows=students.map(x=>({
      'Learner Number':x.student_number||'',Name:x.full_name,Email:x.email,Phone:x.phone||'',Gender:x.gender||'',Created:fmtDate(x.created_at)
    }));
    summary=[['Current students',rows.length]];
  }

  if(type==='courses'){
    rows=all(data.courses,['created_at','updated_at']).map(x=>({
      Course:x.title,Duration:x.duration,Price:Number(x.price||0),Active:x.active!==false?'Yes':'No',
      'Nominal Learning Hours':x.nominal_learning_hours??'','CPD Applicable':x.cpd_applicable===true?'Yes':'No','CPD Points':x.cpd_points??'',
      Created:fmtDate(x.created_at),Updated:fmtDate(x.updated_at)
    }));
    summary=[['Courses',rows.length],['Active',rows.filter(x=>x.Active==='Yes').length]];
  }

  if(type==='academic'){
    const attempts=all(data.assessment_attempts,['submitted_at','created_at']).map(x=>({
      'Record Type':'Assessment Attempt',Student:p[x.student_id]?.full_name||p[x.student_id]?.email||x.student_id,
      Reference:x.assessment_id,Score:x.score,Percentage:x.percentage,Status:x.passed?'Passed':'Not passed',Date:fmtDate(x.submitted_at||x.created_at)
    }));
    const certs=all(data.certificates,['issued_at']).map(x=>({
      'Record Type':'Certificate',Student:p[x.student_id]?.full_name||p[x.student_id]?.email||x.student_id,
      Reference:x.certificate_number,Score:'',Percentage:'',Status:x.certificate_status,Date:fmtDate(x.issued_at)
    }));
    rows=[...attempts,...certs];
    summary=[['Assessment attempts',attempts.length],['Passed attempts',attempts.filter(x=>x.Status==='Passed').length],['Certificates',certs.length]];
  }

  if(type==='payments'){
    rows=all(data.payments,['verified_at','submitted_at','created_at']).map(x=>({
      Student:p[x.student_id]?.full_name||p[x.student_id]?.email||x.student_id,
      Amount:Number(x.amount||0),Status:x.status,'Payment Method':x.payment_method||'',
      'Payment Reference':x.payment_reference||'',Submitted:fmtDate(x.submitted_at||x.created_at),Verified:fmtDate(x.verified_at)
    }));
    summary=[['Payment records',rows.length],['Verified receipts',money(rows.filter(x=>low(x.Status)==='verified').reduce((a,x)=>a+Number(x.Amount||0),0))]];
  }

  if(type==='support'){
    const ticketRows=all(data.support_tickets,['created_at','updated_at','resolved_at']).map(x=>{
      const created=x.created_at?new Date(x.created_at):null,first=x.first_response_at?new Date(x.first_response_at):null;
      const responseMinutes=created&&first&&!Number.isNaN(created)&&!Number.isNaN(first)?Math.max(0,Math.round((first-created)/60000)):'';
      return {
        'Record Type':'Support Ticket',
        Student:p[x.student_id]?.full_name||p[x.student_id]?.email||x.student_id,
        Subject:x.subject,
        Category:x.category,
        Priority:x.priority,
        Status:x.status,
        Owner:x.assigned_to?(p[x.assigned_to]?.full_name||p[x.assigned_to]?.email||x.assigned_to):'Unassigned',
        Created:fmtDateTime(x.created_at),
        'First Response':fmtDateTime(x.first_response_at),
        'Response Minutes':responseMinutes,
        Resolved:fmtDateTime(x.resolved_at),
        Notes:x.notes||''
      };
    });
    const consultationRows=all(data.student_consultations,['created_at','scheduled_start','completed_at','cancelled_at']).map(x=>({
      'Record Type':'Consultation',
      Student:p[x.student_id]?.full_name||p[x.student_id]?.email||x.student_id,
      Subject:x.reason||'Student consultation',
      Category:x.category,
      Priority:'',
      Status:x.status,
      Owner:x.assigned_staff_id?(p[x.assigned_staff_id]?.full_name||p[x.assigned_staff_id]?.email||x.assigned_staff_id):'Unassigned',
      Created:fmtDateTime(x.created_at),
      'First Response':fmtDateTime(x.confirmed_at),
      'Response Minutes':x.created_at&&x.confirmed_at?Math.max(0,Math.round((new Date(x.confirmed_at)-new Date(x.created_at))/60000)):'',
      Resolved:fmtDateTime(x.completed_at||x.cancelled_at),
      Notes:[x.department,x.mode,x.student_visible_notes].filter(Boolean).join(' · ')
    }));
    rows=[...ticketRows,...consultationRows];

    const tickets=ticketRows;
    const open=tickets.filter(x=>!['closed','solved','resolved'].includes(low(x.Status)));
    const urgent=open.filter(x=>['urgent','high'].includes(low(x.Priority)));
    const responded=tickets.filter(x=>x['First Response']&&x['First Response']!=='—');
    const responseValues=responded.map(x=>Number(x['Response Minutes'])).filter(Number.isFinite);
    const avgResponse=responseValues.length?Math.round(responseValues.reduce((a,x)=>a+x,0)/responseValues.length):0;
    const consultations=consultationRows;
    summary=[
      ['Support tickets',tickets.length],
      ['Open / active tickets',open.length],
      ['Urgent / high open tickets',urgent.length],
      ['Resolved / closed tickets',tickets.length-open.length],
      ['Tickets responded to',responded.length],
      ['Response coverage',tickets.length?Math.round(responded.length/tickets.length*100)+'%':'—'],
      ['Average first response',responseValues.length?avgResponse+' minutes':'—'],
      ['Support messages',(data.support_ticket_messages||[]).length],
      ['Support audit events',(data.support_ticket_events||[]).length],
      ['Consultation bookings',consultations.length],
      ['Consultations awaiting confirmation',consultations.filter(x=>low(x.Status)==='requested').length],
      ['Confirmed consultations',consultations.filter(x=>low(x.Status)==='confirmed').length],
      ['Completed consultations',consultations.filter(x=>low(x.Status)==='completed').length],
      ['No-shows',consultations.filter(x=>low(x.Status)==='no_show').length],
      ['Cancelled consultations',consultations.filter(x=>low(x.Status)==='cancelled').length],
      ['Consultation audit events',(data.consultation_events||[]).length]
    ];
  }

  if(type==='marketing'){
    rows=all(data.marketing_leads,['created_at','updated_at']).map(x=>({
      Name:x.full_name,Email:x.email,Phone:x.phone,Source:x.source,'Course Interest':x.course_interest,Status:x.status,Notes:x.notes||'',Created:fmtDate(x.created_at)
    }));
    summary=[['Leads',rows.length]];
  }

  if(type==='communication'){
    const receipts=data.communication_recipients||[];
    rows=all(data.communications,['published_at','created_at','scheduled_at']).map(x=>{
      const rr=receipts.filter(r=>String(r.communication_id)===String(x.id));
      const read=rr.filter(r=>r.read_at).length;
      const unread=rr.length-read;
      return {
        Title:x.title,Category:x.category,Audience:x.audience,Priority:x.priority||'',
        Published:x.published?'Yes':'No','Delivery Status':x.delivery_status||'',
        'Portal Recipients':rr.length,Read:read,Unread:unread,'Read Rate':rr.length?Math.round(read/rr.length*100)+'%':'—',
        'Email Requested':x.email_requested?'Yes':'No','Email Delivery':x.email_delivery_status||'',
        Scheduled:fmtDateTime(x.scheduled_at),PublishedAt:fmtDateTime(x.published_at),Created:fmtDateTime(x.created_at)
      };
    });
    const portal=rows.reduce((t,x)=>t+Number(x['Portal Recipients']||0),0);
    const reads=rows.reduce((t,x)=>t+Number(x.Read||0),0);
    const unread=rows.reduce((t,x)=>t+Number(x.Unread||0),0);
    summary=[
      ['Communications',rows.length],
      ['Published',rows.filter(x=>x.Published==='Yes').length],
      ['Drafts',rows.filter(x=>x.Published==='No'&&!x.Scheduled).length],
      ['Scheduled',rows.filter(x=>x.Published==='No'&&x.Scheduled).length],
      ['Portal delivery records',portal],
      ['Read portal deliveries',reads],
      ['Unread portal deliveries',unread],
      ['Overall portal read rate',portal?Math.round(reads/portal*100)+'%':'—'],
      ['Email requested',rows.filter(x=>x['Email Requested']==='Yes').length],
      ['Email sent',rows.filter(x=>low(x['Email Delivery'])==='sent').length],
      ['Email failed',rows.filter(x=>low(x['Email Delivery'])==='failed').length]
    ];
  }

  if(type==='cashbook'){
    rows=all(data.admin_cashbook,['entry_date','created_at']).map(x=>({
      Date:fmtDate(x.entry_date||x.created_at),Type:x.entry_type,Category:x.category,Description:x.description,
      Counterparty:x.counterparty||'',Reference:x.reference_number||'',Amount:Number(x.amount||0),
      'Payment Method':x.payment_method||'',Department:x.department||'','Reconciliation Status':x.reconciliation_status||''
    }));
    const income=rows.filter(x=>low(x.Type)==='income').reduce((a,x)=>a+Number(x.Amount||0),0);
    const expenses=rows.filter(x=>low(x.Type)==='expense').reduce((a,x)=>a+Number(x.Amount||0),0);
    summary=[['Income',money(income)],['Expenses',money(expenses)],['Net',money(income-expenses)],['Records',rows.length]];
  }

  if(type==='hr'){
    const sr=all(data.staff_records,['created_at','updated_at']).map(x=>({'Record Type':'Staff Record',Staff:p[x.profile_id]?.full_name||p[x.profile_id]?.email||x.profile_id,Reference:x.id,Status:x.employment_status,Date:fmtDate(x.created_at),Details:[x.job_title,x.department].filter(Boolean).join(' · ')}));
    const ct=all(data.hr_contracts,['created_at','issued_at','accepted_at']).map(x=>({'Record Type':'Contract',Staff:p[x.profile_id]?.full_name||p[x.profile_id]?.email||x.profile_id,Reference:x.contract_number,Status:x.status,Date:fmtDate(x.issued_at||x.created_at),Details:[x.contract_type,x.title].filter(Boolean).join(' · ')}));
    const lv=all(data.hr_leave_requests,['requested_at','reviewed_at','start_date']).map(x=>({'Record Type':'Leave',Staff:p[x.profile_id]?.full_name||p[x.profile_id]?.email||x.profile_id,Reference:x.id,Status:x.status,Date:fmtDate(x.requested_at),Details:[x.leave_type,x.start_date+' to '+x.end_date,x.review_notes||x.reason].filter(Boolean).join(' · ')}));
    const sf=all(data.hr_safety_incidents,['occurred_at','created_at','resolved_at']).map(x=>({'Record Type':'Safety / Wellbeing',Staff:p[x.profile_id]?.full_name||p[x.profile_id]?.email||'General workplace',Reference:x.id,Status:x.status,Date:fmtDate(x.occurred_at||x.created_at),Details:[x.severity,x.title,x.action_taken].filter(Boolean).join(' · ')}));
    const tr=all(data.hr_training_records,['created_at','scheduled_on','completed_on']).map(x=>({'Record Type':'Training',Staff:p[x.profile_id]?.full_name||p[x.profile_id]?.email||x.profile_id,Reference:x.id,Status:x.status,Date:fmtDate(x.completed_on||x.scheduled_on||x.created_at),Details:[x.training_name,x.provider,x.evidence_url].filter(Boolean).join(' · ')}));
    const pr=all(data.hr_performance_reviews,['created_at','reviewed_at','due_date']).map(x=>({'Record Type':'Performance Review',Staff:p[x.profile_id]?.full_name||p[x.profile_id]?.email||x.profile_id,Reference:x.review_period,Status:x.status,Date:fmtDate(x.reviewed_at||x.created_at),Details:['Rating '+(x.rating??'—'),x.employee_acknowledged_at?'Employee acknowledged':'Awaiting acknowledgement'].join(' · ')}));
    const hc=all(data.hr_compliance_reviews,['review_date','created_at','next_review_date']).map(x=>({'Record Type':'HR Compliance',Staff:x.owner||'Human Resources',Reference:x.law_code,Status:x.status,Date:fmtDate(x.review_date),Details:[x.control_name,x.evidence,'Next review '+(x.next_review_date||'—')].filter(Boolean).join(' · ')}));
    rows=[...sr,...ct,...lv,...sf,...tr,...pr,...hc];
    summary=[['Staff records',sr.length],['Contracts',ct.length],['Leave requests',lv.length],['Safety/wellbeing cases',sf.length],['Training records',tr.length],['Performance reviews',pr.length],['HR compliance reviews',hc.length]];
  }

  if(type==='ambassador'){
    const apps=all(data.ambassador_programme_applications,['created_at','updated_at']).map(x=>({'Record Type':'Application',Name:x.full_name,Reference:x.referral_code||x.id,Status:x.status,Date:fmtDate(x.created_at),Amount:'',Details:[x.account_status,x.agreement_status].filter(Boolean).join(' · ')}));
    const earn=all(data.ambassador_earnings_ledger,['created_at','earning_month']).map(x=>({'Record Type':'Earning',Name:x.application_id,Reference:x.earning_type,Status:x.earning_status,Date:fmtDate(x.earning_month||x.created_at),Amount:Number(x.commission_amount||0),Details:x.notes||''}));
    const pay=all(data.ambassador_payouts,['created_at','payment_date']).map(x=>({'Record Type':'Payout',Name:x.application_id,Reference:x.payment_reference||x.id,Status:x.status,Date:fmtDate(x.payment_date||x.created_at),Amount:Number(x.amount||0),Details:x.notes||''}));
    rows=[...apps,...earn,...pay];
    summary=[['Applications',apps.length],['Earnings ledger entries',earn.length],['Payout records',pay.length],['Paid payouts',money(pay.filter(x=>low(x.Status)==='paid').reduce((a,x)=>a+Number(x.Amount||0),0))]];
  }

  if(type==='employer'){
    const req=all(data.employer_partnership_requests,['created_at','reviewed_at','partner_since','review_due_at']).map(x=>({'Record Type':'Partnership Request',Organisation:x.organisation_name,Title:x.contact_name,Status:x.status,Date:fmtDate(x.created_at),Location:[x.city,x.province].filter(Boolean).join(', '),Details:[x.industry,x.agreement_status,(x.partnership_scope||[]).join?.(', ')].filter(Boolean).join(' · ')}));
    const opp=all(data.employer_opportunities,['created_at','closing_date']).map(x=>({'Record Type':'Opportunity',Organisation:x.organisation_name,Title:x.title,Status:x.status,Date:fmtDate(x.created_at),Location:[x.city,x.province].filter(Boolean).join(', '),Details:[x.opportunity_type,x.industry,x.skills_or_courses,'Closing '+(x.closing_date||'—')].filter(Boolean).join(' · ')}));
    rows=[...req,...opp];
    summary=[['Partnership requests',req.length],['Employer opportunities',opp.length]];
  }

  if(type==='library'){
    rows=all(data.library_resources,['created_at','updated_at','source_verified_at','reviewed_at']).map(x=>({
      Title:x.title,Course:x.course_id?c[x.course_id]?.title||x.course_id:'All students',Type:x.resource_type,Category:x.category,
      'Publication Status':x.publication_status,Active:x.is_active?'Yes':'No','Quality Status':x.quality_status||'',
      'Rights Status':x.rights_status||'','Source Verified':fmtDate(x.source_verified_at),Updated:fmtDate(x.updated_at)
    }));
    summary=[['Library records',rows.length],['Live resources',rows.filter(x=>x['Publication Status']==='published'&&x.Active==='Yes').length]];
  }

  if(type==='security'){
    const ar=all(data.security_access_reviews,['reviewed_at']).map(x=>({'Record Type':'Access Review',Area:x.department_snapshot||'Access Governance',Subject:p[x.subject_profile_id]?.full_name||p[x.subject_profile_id]?.email||x.subject_profile_id,Status:x.decision,Date:fmtDateTime(x.reviewed_at),Evidence:x.notes||''}));
    const pc=all(data.platform_security_checks,['checked_at']).map(x=>({'Record Type':'Platform Security Check',Area:x.check_area,Subject:x.check_name,Status:x.status,Date:fmtDateTime(x.checked_at),Evidence:x.evidence||''}));
    const si=all(data.security_incidents,['detected_at','created_at','resolved_at']).map(x=>({'Record Type':'Security Incident',Area:'Incident Management',Subject:x.title,Status:x.status,Date:fmtDateTime(x.detected_at||x.created_at),Evidence:[x.severity,x.description,x.resolution_notes].filter(Boolean).join(' · ')}));
    rows=[...ar,...pc,...si];
    summary=[['Access reviews',ar.length],['Platform security checks',pc.length],['Security incidents',si.length]];
  }

  if(type==='compliance'){
    const core=all(data.admin_compliance_register,['last_review_date','next_review_date','due_date','created_at']).map(x=>({
      'Control Area':x.control_area,'Control / Requirement':x.control_name,'Requirement Basis':x.requirement_basis||'',
      Department:x.owner_department,'Responsible Person':x.responsible_person||'',Status:x.status,
      Evidence:x.evidence||'','Corrective Action':x.corrective_action||'','Last Review':fmtDate(x.last_review_date),
      'Next Review':fmtDate(x.next_review_date),'Due Date':fmtDate(x.due_date)
    }));
    const hr=all(data.hr_compliance_reviews,['review_date','next_review_date','created_at']).map(x=>({
      'Control Area':'HR / Labour Compliance','Control / Requirement':x.control_name,'Requirement Basis':x.law_code,
      Department:'Human Resources','Responsible Person':x.owner||'',Status:x.status,Evidence:x.evidence||'',
      'Corrective Action':'','Last Review':fmtDate(x.review_date),'Next Review':fmtDate(x.next_review_date),'Due Date':'—'
    }));
    rows=[...core,...hr];
    summary=[['Compliance controls',rows.length],['Action required',rows.filter(x=>['action_required','review_due'].includes(low(x.Status))).length],['Compliant',rows.filter(x=>low(x.Status)==='compliant'||low(x.Status)==='good').length]];
  }

  if(type==='audit'){
    rows=(data.audit_register||[]).map(x=>({
      Date:fmtDateTime(x.event_time),Source:x.source,Department:x.department,Activity:x.action,
      Entity:x.entity_type,Reference:x.entity_id||'',Responsible:x.responsible_person||'',
      Status:x.status,Details:x.details||'', 'Recorded By':x.actor_name||'System'
    }));
    summary=[['Audit events',rows.length],['Manual entries',rows.filter(x=>x.Source==='Manual Audit').length],['Open / in progress',rows.filter(x=>['open','in_progress','action_required'].includes(low(x.Status))).length],['Sources',new Set(rows.map(x=>x.Source)).size]];
  }

  return {title,rows,summary};
}

async function generatedBy(){
  const {data:{user}}=await client.auth.getUser();
  if(!user)return {id:null,name:'System Administrator',email:''};
  const {data}=await client.from('profiles').select('full_name,email').eq('id',user.id).maybeSingle();
  return {id:user.id,name:data?.full_name||data?.email||user.email||'Administrator',email:data?.email||user.email||''};
}
function metaFor(report,from,to,scope,actor){
  const now=new Date();
  return {
    reportTitle:report.title,
    generatedAt:now,
    generatedBy:actor.email?actor.name+' ('+actor.email+')':actor.name,
    generatedByEmail:actor.email,
    period:scope==='all'?'All available records':(from||'Beginning')+' to '+(to||'Today'),
    reference:'FOA-RPT-'+now.toISOString().replace(/[-:TZ.]/g,'').slice(0,14)
  };
}
function downloadBlob(blob,fileName){
  const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
async function exportExcel(report,meta={}){
  await ensureExcel();
  const actor=meta.generatedBy?null:await generatedBy();
  const m={...meta,...(!meta.generatedBy?metaFor(report,meta.from,meta.to,meta.scope||'all',actor):{})};
  const ExcelJS=window.ExcelJS,wb=new ExcelJS.Workbook();
  wb.creator='Funda Online Academy';wb.company='Funda Online Academy (Pty) Ltd';wb.created=new Date();
  const ws=wb.addWorksheet('Report',{views:[{state:'frozen',ySplit:8}]});
  const rows=report.rows?.length?report.rows:[{Message:'No records found for the selected report and date range.'}];
  const cols=Object.keys(rows[0]);
  const lastCol=Math.max(1,cols.length);
  const endCol=ws.getColumn(lastCol).letter;

  ws.mergeCells(`A1:${endCol}1`);ws.getCell('A1').value='FUNDA ONLINE ACADEMY';
  ws.getCell('A1').font={bold:true,size:20,color:{argb:'FFFFFFFF'}};ws.getCell('A1').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF06172D'}};ws.getCell('A1').alignment={vertical:'middle'};ws.getRow(1).height=30;
  ws.mergeCells(`A2:${endCol}2`);ws.getCell('A2').value=report.title;
  ws.getCell('A2').font={bold:true,size:16,color:{argb:'FF10213F'}};ws.getCell('A2').fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF6F1E4'}};ws.getRow(2).height=24;

  const info=[
    ['Report Reference',m.reference||''],['Reporting Period',m.period||'All available records'],
    ['Generated',m.generatedAt?new Date(m.generatedAt).toLocaleString('en-ZA'):new Date().toLocaleString('en-ZA')],
    ['Generated By',m.generatedBy||'Administrator']
  ];
  info.forEach((x,i)=>{const row=4+i;ws.getCell(row,1).value=x[0];ws.getCell(row,1).font={bold:true,color:{argb:'FF536174'}};ws.getCell(row,2).value=x[1];});

  const headerRow=8;
  cols.forEach((col,i)=>{const cell=ws.getCell(headerRow,i+1);cell.value=col;cell.font={bold:true,color:{argb:'FFFFFFFF'}};cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF0B315C'}};cell.alignment={vertical:'middle',wrapText:true};cell.border={bottom:{style:'medium',color:{argb:'FFD4AF58'}}};});
  ws.getRow(headerRow).height=24;
  rows.forEach((row,ri)=>{cols.forEach((col,ci)=>{const cell=ws.getCell(headerRow+1+ri,ci+1);let v=row[col];if(v&&typeof v==='object')v=JSON.stringify(v);cell.value=v??'';cell.alignment={vertical:'top',wrapText:true};if(ri%2===1)cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FFF8FAFC'}};});});
  ws.autoFilter={from:{row:headerRow,column:1},to:{row:headerRow+rows.length,column:lastCol}};
  cols.forEach((col,i)=>{
    let width=Math.max(12,Math.min(42,col.length+2));
    for(const row of rows.slice(0,250)){const s=String(row[col]??'');width=Math.max(width,Math.min(42,Math.ceil(s.length*0.8)+2));}
    if(/details|description|notes|evidence|action/i.test(col))width=Math.max(width,30);
    ws.getColumn(i+1).width=width;
  });
  ws.pageSetup={orientation:lastCol>6?'landscape':'portrait',fitToPage:true,fitToWidth:1,fitToHeight:0,paperSize:9,margins:{left:.3,right:.3,top:.5,bottom:.5,header:.2,footer:.2}};
  ws.headerFooter.oddFooter='&LFunda Online Academy (Pty) Ltd&C'+report.title+'&RPage &P of &N';
  const buffer=await wb.xlsx.writeBuffer();
  const fileName=(m.fileName||`funda-${safeName(report.title)}-${new Date().toISOString().slice(0,10)}.xlsx`);
  downloadBlob(new Blob([buffer],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}),fileName);
  return fileName;
}
async function exportPdf(report,meta={}){
  await ensurePdf();
  const actor=meta.generatedBy?null:await generatedBy();
  const m={...meta,...(!meta.generatedBy?metaFor(report,meta.from,meta.to,meta.scope||'all',actor):{})};
  const {jsPDF}=window.jspdf;
  const rows=report.rows?.length?report.rows:[{Message:'No records found for the selected report and date range.'}];
  const cols=Object.keys(rows[0]);
  const large=cols.length>7;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:large?'a3':'a4'});
  const pageWidth=doc.internal.pageSize.getWidth();
  doc.setFillColor(6,23,45);doc.rect(0,0,pageWidth,30,'F');
  doc.setFillColor(212,175,88);doc.rect(0,30,pageWidth,2,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(18);doc.text('FUNDA ONLINE ACADEMY',14,13);
  doc.setFontSize(12);doc.text(report.title,14,22);
  doc.setTextColor(70,82,102);doc.setFont('helvetica','normal');doc.setFontSize(9);
  doc.text(`Reference: ${m.reference||''}`,14,39);doc.text(`Period: ${m.period||'All available records'}`,14,44);
  doc.text(`Generated: ${m.generatedAt?new Date(m.generatedAt).toLocaleString('en-ZA'):new Date().toLocaleString('en-ZA')}`,14,49);
  doc.text(`Generated by: ${m.generatedBy||'Administrator'}`,14,54);
  let startY=61;
  if(report.summary?.length){
    const text=report.summary.map(x=>x[0]+': '+x[1]).join('   |   ');
    doc.setFillColor(248,244,232);doc.roundedRect(14,startY,pageWidth-28,12,2,2,'F');
    doc.setTextColor(88,70,28);doc.setFont('helvetica','bold');doc.setFontSize(8.5);
    const lines=doc.splitTextToSize(text,pageWidth-36);doc.text(lines,18,startY+5);
    startY+=16+(lines.length>1?(lines.length-1)*4:0);
  }
  const body=rows.map(r=>cols.map(c=>{const v=r[c];return v&&typeof v==='object'?JSON.stringify(v):String(v??'')}));
  doc.autoTable({
    head:[cols],body,startY,theme:'grid',
    styles:{font:'helvetica',fontSize:large?8.5:9,cellPadding:2.2,valign:'top',overflow:'linebreak',textColor:[38,50,68]},
    headStyles:{fillColor:[11,49,92],textColor:[255,255,255],fontStyle:'bold',lineColor:[212,175,88],lineWidth:.3},
    alternateRowStyles:{fillColor:[248,250,252]},
    margin:{left:14,right:14,bottom:14},
    didDrawPage:()=>{
      const h=doc.internal.pageSize.getHeight();doc.setFontSize(8);doc.setTextColor(120,130,145);doc.setFont('helvetica','normal');
      doc.text('Funda Online Academy (Pty) Ltd | System-generated report',14,h-7);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`,pageWidth-30,h-7);
    }
  });
  const fileName=(m.fileName||`funda-${safeName(report.title)}-${new Date().toISOString().slice(0,10)}.pdf`);
  doc.save(fileName);
  return fileName;
}
async function logRun(type,from,to,scope,format,count,fileName){
  try{
    const {data:{session}}=await client.auth.getSession();if(!session?.user)return;
    await client.from('admin_report_runs').insert({
      report_type:defs[type]?.label||type,period_start:scope==='all'?null:(from||null),period_end:scope==='all'?null:(to||null),
      status:'Generated',generated_by:session.user.id,summary:{rows:count},output_format:format,row_count:count,file_name:fileName,report_scope:scope
    });
    await client.from('admin_audit_log').insert({
      actor_id:session.user.id,action:'Generated '+(defs[type]?.label||type)+' report',
      department:'Executive / Governance',entity_type:'report',entity_id:fileName,
      details:`${count} row(s) · ${format.toUpperCase()} · ${scope==='all'?'all records':(from||'Beginning')+' to '+(to||'Today')}`,
      source:'system',status:'recorded'
    });
  }catch(e){console.warn('Report run could not be logged',e)}
}
async function generate(){
  const type=document.getElementById('frc-type').value,format=document.getElementById('frc-format').value,scope=document.getElementById('frc-scope').value;
  const from=document.getElementById('frc-from').value,to=document.getElementById('frc-to').value,status=document.getElementById('frc-status'),btn=document.getElementById('frc-generate');
  if(from&&to&&from>to){status.textContent='From date cannot be later than To date.';return}
  status.textContent='Loading and validating report data…';btn.disabled=true;
  try{
    const data=await fetchFor(type,from,to,scope),report=build(type,data,from,to,scope),actor=await generatedBy(),meta=metaFor(report,from,to,scope,actor);
    let fileName;
    if(format==='xlsx')fileName=await exportExcel(report,meta);
    else fileName=await exportPdf(report,meta);
    await logRun(type,from,to,scope,format,report.rows.length,fileName);
    status.textContent=`Report ready: ${report.rows.length} row(s) · ${format.toUpperCase()}.`;
    setTimeout(close,850);
  }catch(e){
    console.error(e);status.textContent=e.message||'Could not generate the report. No incomplete report was downloaded.';
  }finally{btn.disabled=false}
}
function hookButtons(){
  const attach=()=>{
    document.querySelectorAll('.download2,.reportActions .btn').forEach(btn=>{
      const t=low(btn.textContent);
      if((t.includes('download')||t.includes('report'))&&!btn.classList.contains('frc-trigger')){
        btn.onclick=e=>{e.preventDefault();open()};btn.classList.add('frc-trigger');
      }
    });
  };
  attach();new MutationObserver(attach).observe(document.body,{subtree:true,childList:true});
}

window.FundaReportExports={exportExcel,exportPdf,build,fetchFor,generatedBy,metaFor,logRun};
window.openFundaReportCentre=open;
installStyle();hookButtons();
})();