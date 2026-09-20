(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaWorkplaceExposureBuilder)return;
window.__fundaWorkplaceExposureBuilder=true;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const txt=v=>String(v??'').trim();
let db=null,data=null,busy=false;

function active(){
  return [...document.querySelectorAll('#nav button,.nav button')].some(b=>(b.classList.contains('on')||b.classList.contains('active'))&&/management/i.test(b.textContent||''));
}
function css(){
  if($('fundaWorkplaceExposureBuilderStyle'))return;
  const s=document.createElement('style');
  s.id='fundaWorkplaceExposureBuilderStyle';
  s.textContent=`
    .webWrap{font-family:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}
    .webTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
    .webTop h3{margin:0;color:#17324a;font-size:18px;line-height:1.25}
    .webTop p{margin:5px 0 0;color:#5f6f84;font-size:12px;line-height:1.55;max-width:760px}
    .webBadge{display:inline-flex;align-items:center;border-radius:999px;background:#fff0c9;color:#7d5b0d;padding:5px 8px;font-size:10px;font-weight:900}
    .webInstitution{margin-top:13px;display:grid;grid-template-columns:100px 1fr;gap:14px;align-items:center;padding:12px;border:1px solid #e5dcc8;border-radius:12px;background:#fffaf0}
    .webLogoBox{height:86px;display:grid;place-items:center}
    .webLogoBox img{max-width:94px;max-height:82px;object-fit:contain}
    .webInstName{font-size:16px;font-weight:900;color:#17324a}
    .webInstLine{margin-top:3px;color:#657286;font-size:10px;line-height:1.45}
    .webControls{margin-top:13px;display:grid;grid-template-columns:1.1fr 1fr auto;gap:8px;align-items:end}
    .webGrid{display:grid;grid-template-columns:minmax(330px,.9fr) minmax(480px,1.2fr);gap:14px;margin-top:14px;align-items:start}
    .webForm{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:13px;border:1px solid #e5e9ef;border-radius:12px;background:#fbfcfe}
    .webField label{display:block;margin:0 0 4px;color:#52657d;font-size:11px;font-weight:900}
    .webField input,.webField select,.webField textarea{width:100%;box-sizing:border-box;border:1px solid #d8dfe7;border-radius:9px;background:#fff;color:#17243a;padding:9px 10px;font:inherit;font-size:12px}
    .webField textarea{min-height:82px;resize:vertical;line-height:1.5}
    .webField.full,.webActions,.webHint{grid-column:1/-1}
    .webBtn{border:0;border-radius:9px;background:#17324a;color:#fff;padding:9px 12px;font:800 11px/1.25 "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif;cursor:pointer}
    .webBtn.alt{background:#fff;color:#17324a;border:1px solid #d8cba9}.webBtn.gold{background:#c99a2e;color:#07152b}
    .webBtn:disabled{opacity:.5;cursor:not-allowed}
    .webActions{display:flex;gap:7px;flex-wrap:wrap;padding-top:2px}
    .webHint{padding:9px;border-radius:9px;background:#f4f7fa;color:#66758a;font-size:10px;line-height:1.5}
    .webStatus{padding:9px;border-radius:9px;background:#eef5ff;color:#244d7d;font-size:10px;line-height:1.45}
    .webStatus.verified{background:#edf8ef;color:#2e6b3b}.webStatus.pending{background:#fff5d8;color:#75570f}
    .webPreview{background:#fff;border:1px solid #dfe5ec;border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(7,27,49,.07)}
    .webLetter{padding:28px 34px 32px;background:#fff;color:#26384a;min-height:790px}
    .webLetterHead{display:grid;grid-template-columns:88px 1fr;gap:14px;align-items:center;padding-bottom:12px;border-bottom:3px solid #c99a2e}
    .webLetterHead img{max-width:82px;max-height:78px;object-fit:contain}
    .webBrand{font-size:17px;font-weight:900;color:#17324a}.webMeta{margin-top:3px;font-size:9px;color:#66758a;line-height:1.45}
    .webLetterDate{margin-top:18px;font-size:10.5px;line-height:1.55}.webLetterSubject{margin:17px 0 13px;font-size:11px;font-weight:900;color:#17324a;text-transform:uppercase}
    .webLetter p{font-size:10.5px;line-height:1.7;margin:0 0 11px}
    .webSign{margin-top:22px;font-size:10.5px;line-height:1.55}.webSign strong{display:block;color:#17324a;font-size:12px}
    .webSigLine{width:150px;border-top:1px solid #8d99a8;margin:28px 0 6px}
    .webFoot{margin-top:20px;padding-top:8px;border-top:1px solid #e7ebef;color:#8793a1;font-size:8.5px}
    .webLoading{padding:22px;text-align:center;color:#66758a;font-size:11px}
    .webError{padding:12px;border:1px solid #f0caca;border-radius:9px;background:#fff2f2;color:#8a2d2d;font-size:11px}
    @media(max-width:1000px){.webGrid{grid-template-columns:1fr}.webControls{grid-template-columns:1fr 1fr}.webControls .webBtn{grid-column:1/-1;width:max-content}.webPreview{max-width:800px}}
    @media(max-width:650px){.webInstitution{grid-template-columns:76px 1fr}.webLogoBox{height:68px}.webLogoBox img{max-width:70px;max-height:64px}.webControls,.webForm{grid-template-columns:1fr}.webField.full,.webActions,.webHint{grid-column:auto}.webLetter{padding:20px}.webLetterHead{grid-template-columns:64px 1fr}.webLetterHead img{max-width:60px;max-height:58px}}
  `;
  document.head.appendChild(s);
}
function client(){
  if(db)return db;
  if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  return db;
}
async function ensureLogo(){
  if(window.FUNDA_TRANSPARENT_LOGO_MASTER)return window.FUNDA_TRANSPARENT_LOGO_MASTER;
  await new Promise((resolve,reject)=>{
    const found=document.querySelector('script[data-funda-master-logo]');
    if(found){found.addEventListener('load',resolve,{once:true});found.addEventListener('error',reject,{once:true});return}
    const s=document.createElement('script');s.dataset.fundaMasterLogo='1';s.src='funda-transparent-logo-master.js?v=20260920-workplace-letter-v1';s.onload=resolve;s.onerror=()=>reject(new Error('Official logo could not load.'));document.head.appendChild(s);
  });
  return window.FUNDA_TRANSPARENT_LOGO_MASTER||'';
}
async function loadData(){
  const c=client();if(!c)throw new Error('Academy data connection is not ready.');
  const [pr,st,en,co,res,cert,rq,contact]=await Promise.all([
    c.from('profiles').select('id,full_name,email,phone,role').eq('role','student').order('full_name'),
    c.from('students').select('id,user_id,full_name,email,mobile_whatsapp,address,city,province'),
    c.from('enrollments').select('id,student_id,course_id,enrollment_status,status,enrolled_at').order('enrolled_at',{ascending:false}),
    c.from('courses').select('id,title,description,learning_outcomes,career_application,active').order('title'),
    c.from('course_results').select('id,student_id,course_id,result_status,completed_at,final_percentage,certificate_issued'),
    c.from('certificates').select('id,student_id,course_id,certificate_status,issued_at,completion_date,certificate_number'),
    c.from('career_support_requests').select('id,student_id,request_type,course_id,status,notes,created_at').order('created_at',{ascending:false}),
    c.from('academy_contact_settings').select('*').limit(1).maybeSingle()
  ]);
  const failed=[pr,st,en,co,res,cert,rq,contact].find(x=>x.error);if(failed)throw failed.error;
  const profiles=(pr.data||[]).filter(x=>!String(x.email||'').toLowerCase().endsWith('@deleted.funda.invalid'));
  const studentMap=new Map();(st.data||[]).forEach(x=>{if(x.user_id)studentMap.set(x.user_id,x);studentMap.set(x.id,x)});
  return {profiles,studentMap,enrollments:en.data||[],courses:co.data||[],results:res.data||[],certificates:cert.data||[],requests:rq.data||[],contact:contact.data||{}};
}
function courseMap(){return new Map((data?.courses||[]).map(x=>[x.id,x]))}
function enrolments(studentId){return (data?.enrollments||[]).filter(x=>x.student_id===studentId&&x.course_id)}
function shortTitle(v){return txt(v).replace(/\s*[—-]\s*Professional Short Course\s*$/i,'').trim()||txt(v)}
function completion(studentId,courseId){
  const result=(data?.results||[]).find(x=>x.student_id===studentId&&x.course_id===courseId&&String(x.result_status||'').toLowerCase()==='passed');
  const cert=(data?.certificates||[]).find(x=>x.student_id===studentId&&x.course_id===courseId&&String(x.certificate_status||'').toLowerCase()==='issued');
  if(cert||result)return {verified:true,date:cert?.completion_date||result?.completed_at||cert?.issued_at||'',label:'Completion verified'};
  const en=enrolments(studentId).find(x=>x.course_id===courseId);
  return {verified:false,date:'',label:'Completion not yet verified',enrolment:en};
}
function requestFields(notes){
  const s=String(notes||'');const read=label=>{const m=s.match(new RegExp('^'+label+'\\s*:\\s*(.+)$','mi'));return m?m[1].trim():''};
  return {host:read('Host organisation'),contact:read('Attention / contact person'),branch:read('Host branch / location'),notes:read('Learner notes')||(!/^Host organisation:/mi.test(s)?s:'')};
}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function prettyDate(v){if(!v)return '';return new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',day:'2-digit',month:'long',year:'numeric'}).format(new Date(v+'T12:00:00+02:00'))}
function vals(){
  const get=id=>txt($(id)?.value);
  return {date:get('webDate'),learner:get('webLearnerName'),course:get('webCourseName'),host:get('webHost'),contact:get('webContact'),branch:get('webBranch'),focus:get('webFocus'),notes:get('webNotes')};
}
function company(){
  const c=data?.contact||{};
  return {
    name:txt(c.legal_name||c.academy_name)||'Funda Online Academy',
    reg:txt(c.registration_number)||'2023/830451/07',
    email:txt(c.general_email)||'info@fundaonlineacademy.co.za',
    phone:txt(c.general_phone)||'069 960 8590',
    whatsapp:txt(c.whatsapp)||'069 960 8590',
    address:txt(c.address)||'100% Online Academy — South Africa',
    website:txt(c.website)||'https://fundaonlineacademy.co.za',
    ceo:txt(c.ceo_name)||'Aziwe Futhe'
  };
}
function letterCopy(v,state){
  const statusSentence=state.verified
    ? `Funda Online Academy confirms that ${v.learner} has successfully completed the ${v.course} course.`
    : `Funda Online Academy confirms that ${v.learner} is associated with the ${v.course} course in our learner records. The learner's final completion status should be verified separately where required.`;
  const focus=v.focus? ` The learner's training has included emphasis on ${v.focus}.`:'';
  return {
    intro:`${statusSentence} As part of our commitment to learner career development and workplace readiness, we respectfully request that ${v.host||'your organisation'} consider providing supervised workplace exposure relevant to the learner's field of study.`,
    purpose:`The purpose of the requested exposure is to help the learner observe professional workplace practice, understand operational standards, strengthen workplace conduct and communication, and, where your organisation considers it appropriate, participate in suitable activities under responsible supervision.${focus}`,
    conditions:`This request is for workplace exposure only. It does not create an employment relationship, guarantee employment or placement, or require the host organisation to provide remuneration. The host organisation retains full discretion over the duration, scope, supervision, access requirements and activities permitted, subject to its internal policies, health and safety requirements, confidentiality rules and applicable law.`,
    learner:`The learner is expected to conduct themselves professionally, follow all lawful workplace instructions and safety requirements, respect confidentiality, and comply with the host organisation's rules throughout any approved exposure period.`,
    close:`We would sincerely appreciate any workplace-exposure opportunity that your organisation may be able to offer. Funda Online Academy remains available to verify this letter, the learner's identity and the recorded course status using the official contact details above.`
  };
}
function render(){
  const v=vals(),co=company(),state=completion($('webLearner')?.value,$('webCourse')?.dataset.courseId||'');
  const copy=letterCopy(v,state),logo=window.FUNDA_TRANSPARENT_LOGO_MASTER||'';
  const preview=$('webPreview');if(!preview)return;
  preview.innerHTML=`<div class="webLetter">
    <div class="webLetterHead"><div>${logo?`<img src="${logo}" alt="Funda Online Academy logo">`:''}</div><div><div class="webBrand">${esc(co.name)}</div><div class="webMeta">Registration No: ${esc(co.reg)}</div><div class="webMeta">${esc(co.address)}</div><div class="webMeta">Tel/WhatsApp: ${esc(co.phone)} · ${esc(co.email)} · ${esc(co.website.replace(/^https?:\/\//,''))}</div></div></div>
    <div class="webLetterDate"><b>Date:</b> ${esc(prettyDate(v.date)||'[date]')}<br><br><b>To:</b> ${esc(v.host||'[host organisation]')}${v.branch?` — ${esc(v.branch)}`:''}<br><b>Attention:</b> ${esc(v.contact||'The Manager / Human Resources')}</div>
    <div class="webLetterSubject">RE: REQUEST FOR WORKPLACE EXPOSURE — ${esc(v.learner||'[STUDENT NAME]')} | ${esc(v.course||'[COURSE NAME]')}</div>
    <p>Dear Sir / Madam,</p><p>${esc(copy.intro)}</p><p>${esc(copy.purpose)}</p><p>${esc(copy.conditions)}</p><p>${esc(copy.learner)}</p><p>${esc(copy.close)}</p>
    ${v.notes?`<p><b>Additional request information:</b> ${esc(v.notes)}</p>`:''}
    <div class="webSign">Yours sincerely,<div class="webSigLine"></div><strong>${esc(co.ceo)}</strong>Founder &amp; Chief Executive Officer<br>Funda Online Academy</div>
    <div class="webFoot">Official workplace-exposure request · Funda Online Academy · ${esc(co.reg)}</div>
  </div>`;
  const status=$('webVerification');
  if(status){status.className='webStatus '+(state.verified?'verified':'pending');status.textContent=state.verified?'✓ Course completion verified in Academy records.':'Course completion is not yet verified in current Academy records. The letter uses status-safe wording and does not falsely claim completion.'}
}
function fillLearner(){
  const id=$('webLearner')?.value||'',p=(data?.profiles||[]).find(x=>x.id===id);if(!p)return;
  $('webLearnerName').value=txt(p.full_name);populateCourses(id,true);
}
function populateCourses(studentId,auto=true){
  const map=courseMap(),rows=enrolments(studentId),sel=$('webCourse');if(!sel)return;
  sel.innerHTML='<option value="">Choose course</option>'+rows.map(e=>{const c=map.get(e.course_id);return c?`<option value="${esc(e.id)}" data-course-id="${esc(c.id)}">${esc(shortTitle(c.title))}</option>`:''}).join('');
  if(auto&&rows.length){const verified=rows.find(e=>completion(studentId,e.course_id).verified)||rows[0];sel.value=verified.id}
  chooseCourse();
}
function chooseCourse(){
  const id=$('webLearner')?.value||'',en=(data?.enrollments||[]).find(x=>x.id===$('webCourse')?.value),course=en?courseMap().get(en.course_id):null;
  const sel=$('webCourse');if(sel)sel.dataset.courseId=course?.id||'';
  $('webCourseName').value=course?shortTitle(course.title):'';
  const outcomes=Array.isArray(course?.learning_outcomes)?course.learning_outcomes.filter(Boolean).slice(0,4):[];
  $('webFocus').value=outcomes.length?outcomes.map(x=>String(x).replace(/[.]$/,'').toLowerCase()).join('; '):txt(course?.career_application||'');
  render();
}
function latestRequest(){
  return (data?.requests||[]).find(r=>String(r.request_type||'').toLowerCase()==='workplace_exposure_letter'&&!['completed','closed','cancelled'].includes(String(r.status||'').toLowerCase()));
}
function loadRequest(){
  const r=latestRequest();if(!r)return;
  const learner=$('webLearner');if(!learner||![...learner.options].some(o=>o.value===r.student_id))return;
  learner.value=r.student_id;fillLearner();
  if(r.course_id){const match=enrolments(r.student_id).find(e=>e.course_id===r.course_id);if(match){$('webCourse').value=match.id;chooseCourse()}}
  const f=requestFields(r.notes);$('webHost').value=f.host;$('webContact').value=f.contact;$('webBranch').value=f.branch;$('webNotes').value=f.notes;render();
}
async function ensurePdf(){
  if(window.jspdf?.jsPDF)return window.jspdf.jsPDF;
  await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';s.onload=resolve;s.onerror=()=>reject(new Error('PDF library could not load.'));document.head.appendChild(s)});
  return window.jspdf?.jsPDF;
}
async function logoPng(dataUrl){
  if(!dataUrl)return '';
  return await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;cv.getContext('2d').drawImage(im,0,0);resolve(cv.toDataURL('image/png'))};im.onerror=reject;im.src=dataUrl});
}
async function downloadPdf(){
  const v=vals(),co=company(),studentId=$('webLearner')?.value||'',courseId=$('webCourse')?.dataset.courseId||'',state=completion(studentId,courseId);
  if(!v.learner||!v.course)return alert('Select a learner and course before downloading the letter.');
  if(!v.host)return alert('Enter the host organisation before downloading the letter.');
  const b=$('webDownload');if(b){b.disabled=true;b.textContent='Preparing PDF…'}
  try{
    const jsPDF=await ensurePdf();if(!jsPDF)throw new Error('PDF library unavailable');
    const doc=new jsPDF({unit:'mm',format:'a4'}),margin=18,w=174;let y=15;
    const logo=await logoPng(window.FUNDA_TRANSPARENT_LOGO_MASTER||'').catch(()=> '');
    if(logo)doc.addImage(logo,'PNG',margin,y,25,25);
    doc.setTextColor(23,50,74);doc.setFont('helvetica','bold');doc.setFontSize(15);doc.text(co.name,50,21);
    doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(92,106,123);
    doc.text([`Registration No: ${co.reg}`,co.address,`Tel/WhatsApp: ${co.phone} · ${co.email}`,co.website.replace(/^https?:\/\//,'')],50,27);
    y=43;doc.setDrawColor(201,154,46);doc.setLineWidth(1);doc.line(margin,y,192,y);y+=9;
    doc.setTextColor(55,68,82);doc.setFontSize(9.5);
    doc.text(`Date: ${prettyDate(v.date)}`,margin,y);y+=7;doc.text(`To: ${v.host}${v.branch?' — '+v.branch:''}`,margin,y,{maxWidth:w});y+=6;
    doc.text(`Attention: ${v.contact||'The Manager / Human Resources'}`,margin,y,{maxWidth:w});y+=11;
    doc.setTextColor(23,50,74);doc.setFont('helvetica','bold');doc.setFontSize(10);
    const subject=`RE: REQUEST FOR WORKPLACE EXPOSURE — ${v.learner} | ${v.course}`;const sub=doc.splitTextToSize(subject,w);doc.text(sub,margin,y);y+=sub.length*5+5;
    const copy=letterCopy(v,state);doc.setTextColor(55,68,82);doc.setFont('helvetica','normal');doc.setFontSize(9.5);
    const para=t=>{const lines=doc.splitTextToSize(t,w);if(y+lines.length*4.7>276){doc.addPage();y=18}doc.text(lines,margin,y);y+=lines.length*4.7+5};
    para('Dear Sir / Madam,');para(copy.intro);para(copy.purpose);para(copy.conditions);para(copy.learner);para(copy.close);if(v.notes)para('Additional request information: '+v.notes);
    if(y>248){doc.addPage();y=22}doc.text('Yours sincerely,',margin,y);y+=18;doc.setDrawColor(110,120,130);doc.line(margin,y,margin+42,y);y+=5;
    doc.setFont('helvetica','bold');doc.setTextColor(23,50,74);doc.text(co.ceo,margin,y);y+=5;doc.setFont('helvetica','normal');doc.setTextColor(55,68,82);doc.text('Founder & Chief Executive Officer',margin,y);y+=5;doc.text('Funda Online Academy',margin,y);
    const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setDrawColor(225,230,236);doc.line(margin,286,192,286);doc.setFontSize(7.5);doc.setTextColor(130,140,150);doc.text(`Official workplace-exposure request · ${co.reg}`,margin,291);doc.text(`Page ${p} of ${pages}`,192,291,{align:'right'})}
    doc.save((v.learner||'Learner').replace(/[^a-z0-9 _-]/gi,'').trim().replace(/\s+/g,'-')+'-Workplace-Exposure-Letter.pdf');
  }catch(e){console.error(e);alert('The PDF could not be generated right now. Please try again.')}finally{if(b){b.disabled=false;b.textContent='Download PDF'}}
}
function html(){
  const options=(data?.profiles||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.email||'Student')}</option>`).join(''),co=company(),request=latestRequest(),logo=window.FUNDA_TRANSPARENT_LOGO_MASTER||'';
  return `<div class="webWrap"><div class="webTop"><div><span class="webBadge">OFFICIAL WORKPLACE EXPOSURE</span><h3>Workplace Exposure Letter Builder</h3><p>Select the learner and course, add the receiving organisation, review the Academy-generated wording and download a formal PDF request letter.</p></div>${request?'<button class="webBtn alt" type="button" id="webLoadRequest">Load Latest Learner Request</button>':''}</div>
  <div class="webInstitution"><div class="webLogoBox">${logo?`<img src="${logo}" alt="Funda Online Academy transparent logo">`:''}</div><div><div class="webInstName">${esc(co.name)}</div><div class="webInstLine">Registration No: ${esc(co.reg)} · ${esc(co.address)}</div><div class="webInstLine">Tel/WhatsApp: ${esc(co.phone)} · ${esc(co.email)} · ${esc(co.website.replace(/^https?:\/\//,''))}</div></div></div>
  <div class="webControls"><div class="webField"><label>Learner</label><select id="webLearner"><option value="">Choose learner</option>${options}</select></div><div class="webField"><label>Course</label><select id="webCourse"><option value="">Choose course</option></select></div><button class="webBtn gold" id="webGenerate" type="button">Generate Letter</button></div>
  <div class="webGrid"><div class="webForm" id="webForm"><div class="webField"><label>Letter date</label><input id="webDate" type="date" value="${today()}"></div><div class="webField"><label>Learner full name</label><input id="webLearnerName"></div><div class="webField full"><label>Course name</label><input id="webCourseName"></div><div class="webField full"><label>Host organisation</label><input id="webHost" placeholder="e.g. Shell, Engen, a retail store, employer or other host organisation"></div><div class="webField"><label>Attention / contact person</label><input id="webContact" placeholder="Manager, HR representative, supervisor or named contact"></div><div class="webField"><label>Host branch / location</label><input id="webBranch" placeholder="Optional branch or location"></div><div class="webField full"><label>Course-related exposure focus</label><textarea id="webFocus"></textarea></div><div class="webField full"><label>Additional request information</label><textarea id="webNotes" placeholder="Optional practical details, preferred exposure period or learner context."></textarea></div><div id="webVerification" class="webStatus full"></div><div class="webHint">The Academy logo and company identity are permanent letterhead details. Learner/course details come from Academy records; host organisation and contact details remain editable. Completion wording is generated from the recorded course result/certificate status so the letter does not make an unsupported completion claim.</div><div class="webActions"><button class="webBtn" type="button" id="webDownload">Download PDF</button></div></div><div class="webPreview" id="webPreview"></div></div></div>`;
}
function bind(card){
  card.innerHTML=html();
  $('webLearner').onchange=fillLearner;$('webCourse').onchange=chooseCourse;$('webGenerate').onclick=render;$('webDownload').onclick=downloadPdf;
  $('webForm').addEventListener('input',render);if($('webLoadRequest'))$('webLoadRequest').onclick=loadRequest;render();
}
async function enhance(){
  if(!active()||busy)return;const host=$('careerWorkplaceAdmin');if(!host||host.dataset.workplaceBuilderReady==='1')return;
  const cards=host.querySelectorAll('.cwsTemplates .cwsCard'),card=cards[1];if(!card)return;
  busy=true;card.innerHTML='<div class="webLoading">Loading workplace exposure letter builder…</div>';
  try{await ensureLogo();data=await loadData();if(!document.body.contains(card)||!active())return;host.dataset.workplaceBuilderReady='1';bind(card)}
  catch(e){console.error(e);card.innerHTML=`<div class="webError">The workplace exposure letter builder could not load: ${esc(e.message||e)}</div>`}
  finally{busy=false}
}
function start(){
  css();document.addEventListener('click',e=>{const b=e.target.closest?.('#nav button,.nav button');if(b&&/management/i.test(b.textContent||''))setTimeout(enhance,650)},true);
  const view=$('view');if(view)new MutationObserver(()=>{if(active())setTimeout(enhance,260)}).observe(view,{childList:true,subtree:true});
  [1200,2100,3200].forEach(ms=>setTimeout(enhance,ms));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();