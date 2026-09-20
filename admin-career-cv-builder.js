(()=>{
'use strict';
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaCareerCvBuilder)return;
window.__fundaCareerCvBuilder=true;

const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const text=v=>String(v??'').trim();
const titleCase=v=>text(v).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
const statusLabel=v=>text(v).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase())||'Enrolled';
let db=null,data=null,busy=false;

function active(){
  return [...document.querySelectorAll('#nav button,.nav button')].some(b=>(b.classList.contains('on')||b.classList.contains('active'))&&/management/i.test(b.textContent||''));
}

function css(){
  if($('fundaCareerCvBuilderStyle'))return;
  const s=document.createElement('style');
  s.id='fundaCareerCvBuilderStyle';
  s.textContent=`
    .cvbWrap{font-family:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}
    .cvbTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
    .cvbTop h3{margin:0;color:#17324a;font-size:18px;line-height:1.25}
    .cvbTop p{margin:5px 0 0;color:#5f6f84;font-size:12px;line-height:1.5;max-width:680px}
    .cvbBadge{display:inline-flex;align-items:center;border-radius:999px;background:#fff0c9;color:#7d5b0d;padding:5px 8px;font-size:10px;font-weight:900}
    .cvbControls{margin-top:14px;display:grid;grid-template-columns:1.1fr 1fr auto;gap:8px;align-items:end;padding:12px;border:1px solid #e5dcc8;border-radius:12px;background:#fffaf0}
    .cvbField label{display:block;margin:0 0 4px;color:#52657d;font-size:11px;font-weight:900}
    .cvbField input,.cvbField select,.cvbField textarea{width:100%;box-sizing:border-box;border:1px solid #d8dfe7;border-radius:9px;background:#fff;color:#17243a;padding:9px 10px;font:inherit;font-size:12px}
    .cvbField textarea{min-height:82px;resize:vertical;line-height:1.5}
    .cvbBtn{border:0;border-radius:9px;background:#17324a;color:#fff;padding:9px 12px;font:800 11px/1.25 "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif;cursor:pointer}
    .cvbBtn:hover{background:#0b2f70}.cvbBtn.alt{background:#fff;color:#17324a;border:1px solid #d8cba9}.cvbBtn.gold{background:#c99a2e;color:#07152b}
    .cvbBtn:disabled{opacity:.5;cursor:not-allowed}
    .cvbGrid{display:grid;grid-template-columns:minmax(330px,.9fr) minmax(420px,1.15fr);gap:14px;margin-top:14px;align-items:start}
    .cvbForm{display:grid;grid-template-columns:1fr 1fr;gap:9px;padding:13px;border:1px solid #e5e9ef;border-radius:12px;background:#fbfcfe}
    .cvbField.full{grid-column:1/-1}.cvbActions{grid-column:1/-1;display:flex;gap:7px;flex-wrap:wrap;padding-top:3px}
    .cvbHint{grid-column:1/-1;color:#6b7788;font-size:10px;line-height:1.5;background:#f4f7fa;border-radius:8px;padding:8px 9px}
    .cvbPreview{background:#fff;border:1px solid #dfe5ec;border-radius:12px;overflow:hidden;box-shadow:0 8px 20px rgba(7,27,49,.07)}
    .cvbCvHead{background:linear-gradient(135deg,#07172f,#0b2f70);color:#fff;padding:22px 24px}
    .cvbCvName{font-size:27px;font-weight:900;line-height:1.1;letter-spacing:-.02em}
    .cvbCvRole{margin-top:5px;color:#e8cc76;font-size:13px;font-weight:800}
    .cvbContact{margin-top:10px;color:#dbe7f7;font-size:11px;line-height:1.6;word-break:break-word}
    .cvbCvBody{padding:20px 24px 24px}
    .cvbSection{margin-top:16px}.cvbSection:first-child{margin-top:0}
    .cvbSection h4{margin:0 0 6px;color:#17324a;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;border-bottom:2px solid #d4af58;padding-bottom:5px}
    .cvbSection p{margin:0;color:#3f4f61;font-size:11px;line-height:1.65;white-space:pre-wrap}
    .cvbSkills{display:flex;flex-wrap:wrap;gap:6px}
    .cvbSkill{border-radius:999px;background:#eef3f8;color:#17324a;padding:5px 8px;font-size:10px;font-weight:800}
    .cvbFooter{border-top:1px solid #edf1f5;margin-top:18px;padding-top:8px;color:#8a94a3;font-size:9px}
    .cvbLoading{padding:20px;text-align:center;color:#66758a;font-size:11px}
    .cvbError{padding:12px;border:1px solid #f0caca;border-radius:9px;background:#fff2f2;color:#8a2d2d;font-size:11px}
    @media(max-width:980px){.cvbGrid{grid-template-columns:1fr}.cvbControls{grid-template-columns:1fr 1fr}.cvbControls .cvbBtn{grid-column:1/-1;width:max-content}.cvbPreview{max-width:760px}}
    @media(max-width:620px){.cvbControls,.cvbForm{grid-template-columns:1fr}.cvbField.full,.cvbActions,.cvbHint{grid-column:auto}.cvbCvHead{padding:18px}.cvbCvBody{padding:17px}.cvbCvName{font-size:23px}}
  `;
  document.head.appendChild(s);
}

function getClient(){
  if(db)return db;
  if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
    db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
  }
  return db;
}

async function loadData(){
  const c=getClient();
  if(!c)throw new Error('Academy data connection is not ready.');
  const [pr,st,en,co]=await Promise.all([
    c.from('profiles').select('id,full_name,email,phone,role').eq('role','student').order('full_name'),
    c.from('students').select('id,user_id,full_name,email,mobile_whatsapp,address,city,province,highest_education'),
    c.from('enrollments').select('id,student_id,course_id,enrollment_status,status,enrolled_at').order('enrolled_at',{ascending:false}),
    c.from('courses').select('id,title,description,learning_outcomes,career_application,active').order('title')
  ]);
  const failed=[pr,st,en,co].find(x=>x.error);
  if(failed)throw failed.error;
  const profiles=(pr.data||[]).filter(x=>!String(x.email||'').toLowerCase().endsWith('@deleted.funda.invalid'));
  const students=st.data||[],enrollments=en.data||[],courses=co.data||[];
  const studentMap=new Map();
  students.forEach(x=>{if(x.user_id)studentMap.set(x.user_id,x);studentMap.set(x.id,x)});
  const courseMap=new Map(courses.map(x=>[x.id,x]));
  return {profiles,students,enrollments,courses,studentMap,courseMap};
}

function shortCourseTitle(v){
  return text(v).replace(/\s*[—-]\s*Professional Short Course\s*$/i,'').trim()||text(v);
}

function studentLocation(profile){
  const row=data?.studentMap.get(profile?.id)||{};
  return [row.city,row.province].filter(Boolean).join(', ')||text(row.address)||'';
}

function studentPhone(profile){
  const row=data?.studentMap.get(profile?.id)||{};
  return text(profile?.phone)||text(row.mobile_whatsapp)||'';
}

function learnerEnrollments(studentId){
  return (data?.enrollments||[]).filter(x=>x.student_id===studentId&&x.course_id);
}

function profileForCourse(course){
  if(!course)return 'Motivated entry-level candidate with a professional, dependable and learning-focused approach. Ready to apply developing workplace skills, communicate respectfully and contribute positively in an entry-level environment.';
  const name=shortCourseTitle(course.title);
  const outcomes=Array.isArray(course.learning_outcomes)?course.learning_outcomes.filter(Boolean).slice(0,3):[];
  const skills=outcomes.length?outcomes.map(x=>String(x).replace(/[.]$/,'').toLowerCase()).join('; '):text(course.career_application||course.description);
  return `Motivated entry-level candidate with training in ${name}. Developed foundational knowledge and practical awareness in ${skills || 'course-related workplace skills'}. Brings a professional, dependable and learning-focused approach, with readiness to apply these skills responsibly in an entry-level or workplace-exposure environment.`;
}

function skillsForCourse(course){
  if(!course)return 'Communication\nTeamwork\nTime management\nProfessional conduct\nWillingness to learn';
  const outcomes=Array.isArray(course.learning_outcomes)?course.learning_outcomes.filter(Boolean).slice(0,6):[];
  if(outcomes.length)return outcomes.map(x=>String(x).replace(/[.]$/,'')).join('\n');
  return 'Communication\nTeamwork\nTime management\nProfessional conduct\nWillingness to learn';
}

function educationFor(profile,course,enrolment){
  const row=data?.studentMap.get(profile?.id)||{};
  const lines=[];
  if(course){
    const status=statusLabel(enrolment?.enrollment_status||enrolment?.status||'enrolled');
    lines.push(`Funda Online Academy\n${course.title}\nStatus: ${status}`);
  }
  if(text(row.highest_education))lines.push(`Highest prior education: ${row.highest_education}`);
  return lines.join('\n\n');
}

function values(){
  const get=id=>text($(id)?.value);
  return {
    name:get('cvbName'),headline:get('cvbHeadline'),phone:get('cvbPhone'),email:get('cvbEmail'),location:get('cvbLocation'),
    profile:get('cvbProfile'),skills:get('cvbSkills'),education:get('cvbEducation'),experience:get('cvbExperience'),
    additional:get('cvbAdditional'),references:get('cvbReferences')
  };
}

function renderPreview(){
  const v=values();
  const contact=[v.phone,v.email,v.location].filter(Boolean).map(esc).join(' &nbsp;•&nbsp; ');
  const skills=v.skills.split(/\n|,/).map(x=>text(x)).filter(Boolean);
  const preview=$('cvbPreview');
  if(!preview)return;
  preview.innerHTML=`
    <div class="cvbCvHead">
      <div class="cvbCvName">${esc(v.name||'LEARNER NAME')}</div>
      <div class="cvbCvRole">${esc(v.headline||'Entry-Level Candidate')}</div>
      <div class="cvbContact">${contact||'Phone • Email • Location'}</div>
    </div>
    <div class="cvbCvBody">
      <section class="cvbSection"><h4>Professional Profile</h4><p>${esc(v.profile||'Professional profile will appear here.')}</p></section>
      <section class="cvbSection"><h4>Core Skills</h4><div class="cvbSkills">${skills.length?skills.map(x=>`<span class="cvbSkill">${esc(x)}</span>`).join(''):'<span class="cvbSkill">Add skills</span>'}</div></section>
      <section class="cvbSection"><h4>Education & Training</h4><p>${esc(v.education||'Add education and training information.')}</p></section>
      <section class="cvbSection"><h4>Workplace Exposure / Experience</h4><p>${esc(v.experience||'Add relevant workplace exposure, projects, volunteering or previous employment.')}</p></section>
      ${v.additional?`<section class="cvbSection"><h4>Additional Information</h4><p>${esc(v.additional)}</p></section>`:''}
      <section class="cvbSection"><h4>References</h4><p>${esc(v.references||'Available on request.')}</p></section>
      <div class="cvbFooter">Prepared with career-support assistance from Funda Online Academy.</div>
    </div>`;
}

function fillFromLearner(){
  const id=$('cvbLearner')?.value||'';
  const profile=(data?.profiles||[]).find(x=>x.id===id);
  if(!profile)return;
  $('cvbName').value=text(profile.full_name);
  $('cvbPhone').value=studentPhone(profile);
  $('cvbEmail').value=text(profile.email);
  $('cvbLocation').value=studentLocation(profile);
  $('cvbHeadline').value='Entry-Level Candidate';
  repopulateCourses(id,true);
}

function repopulateCourses(studentId,autoFill=false){
  const sel=$('cvbCourse');
  if(!sel)return;
  const rows=learnerEnrollments(studentId);
  sel.innerHTML='<option value="">General / no course selected</option>'+rows.map(e=>{
    const course=data.courseMap.get(e.course_id);
    if(!course)return '';
    const st=statusLabel(e.enrollment_status||e.status);
    return `<option value="${esc(e.id)}">${esc(shortCourseTitle(course.title))} — ${esc(st)}</option>`;
  }).join('');
  if(autoFill&&rows.length){
    const preferred=rows.find(e=>['approved','active','completed'].includes(String(e.enrollment_status||e.status||'').toLowerCase()))||rows[0];
    sel.value=preferred.id;
  }
  generateFromCourse();
}

function generateFromCourse(){
  const learnerId=$('cvbLearner')?.value||'';
  const profile=(data?.profiles||[]).find(x=>x.id===learnerId)||null;
  const enrolment=(data?.enrollments||[]).find(x=>x.id===$('cvbCourse')?.value)||null;
  const course=enrolment?data.courseMap.get(enrolment.course_id):null;
  $('cvbProfile').value=profileForCourse(course);
  $('cvbSkills').value=skillsForCourse(course);
  $('cvbEducation').value=educationFor(profile,course,enrolment);
  if(course)$('cvbHeadline').value=`${shortCourseTitle(course.title)} · Entry-Level Candidate`;
  else if(!$('cvbHeadline').value)$('cvbHeadline').value='Entry-Level Candidate';
  renderPreview();
}

function resetEditable(){
  const learnerId=$('cvbLearner')?.value||'';
  if(learnerId)fillFromLearner();
  else{
    ['cvbName','cvbHeadline','cvbPhone','cvbEmail','cvbLocation','cvbProfile','cvbSkills','cvbEducation','cvbExperience','cvbAdditional'].forEach(id=>{if($(id))$(id).value=''});
    if($('cvbReferences'))$('cvbReferences').value='Available on request.';
    renderPreview();
  }
}

function safeFilename(v){
  return (text(v)||'Learner-CV').replace(/[^a-z0-9 _-]/gi,'').trim().replace(/\s+/g,'-').slice(0,80)||'Learner-CV';
}

async function ensureJsPdf(){
  if(window.jspdf?.jsPDF)return window.jspdf.jsPDF;
  await new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-funda-jspdf]');
    if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}
    const s=document.createElement('script');
    s.dataset.fundaJspdf='1';
    s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    s.onload=resolve;s.onerror=()=>reject(new Error('PDF library could not load.'));
    document.head.appendChild(s);
  });
  if(!window.jspdf?.jsPDF)throw new Error('PDF library is unavailable.');
  return window.jspdf.jsPDF;
}

async function downloadPdf(){
  const b=$('cvbDownload'),v=values();
  if(!v.name)return alert('Select a learner or enter the learner’s full name before downloading the CV.');
  if(b){b.disabled=true;b.textContent='Preparing PDF…'}
  try{
    const jsPDF=await ensureJsPdf();
    const doc=new jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
    const pageW=210,pageH=297,margin=16,contentW=pageW-margin*2;
    let y=0;

    doc.setFillColor(7,23,47);doc.rect(0,0,pageW,42,'F');
    doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(20);
    doc.text(v.name.toUpperCase(),margin,17,{maxWidth:contentW});
    doc.setTextColor(232,204,118);doc.setFontSize(10);doc.text(v.headline||'Entry-Level Candidate',margin,25,{maxWidth:contentW});
    doc.setTextColor(224,232,242);doc.setFont('helvetica','normal');doc.setFontSize(8.5);
    doc.text([v.phone,v.email,v.location].filter(Boolean).join('  •  '),margin,33,{maxWidth:contentW});
    y=50;

    const ensureSpace=needed=>{if(y+needed>pageH-18){doc.addPage();y=18}};
    const section=(title,body,bullets=false)=>{
      body=text(body);if(!body)return;
      ensureSpace(22);
      doc.setTextColor(23,50,74);doc.setFont('helvetica','bold');doc.setFontSize(9.5);doc.text(title.toUpperCase(),margin,y);
      y+=2;doc.setDrawColor(201,154,46);doc.setLineWidth(.6);doc.line(margin,y,margin+contentW,y);y+=5;
      doc.setTextColor(55,68,82);doc.setFont('helvetica','normal');doc.setFontSize(9);
      const lines=bullets?body.split(/\n|,/).map(x=>text(x)).filter(Boolean):[body];
      if(bullets){
        for(const item of lines){
          const wrapped=doc.splitTextToSize('• '+item,contentW-2);
          ensureSpace(wrapped.length*4.6+3);
          doc.text(wrapped,margin+1,y);y+=wrapped.length*4.6+1.5;
        }
      }else{
        const paras=body.split(/\n\s*\n/).filter(Boolean);
        for(const para of paras){
          const wrapped=doc.splitTextToSize(para.replace(/\n/g,' · '),contentW);
          ensureSpace(wrapped.length*4.6+3);
          doc.text(wrapped,margin,y);y+=wrapped.length*4.6+2.5;
        }
      }
      y+=3;
    };

    section('Professional Profile',v.profile);
    section('Core Skills',v.skills,true);
    section('Education & Training',v.education);
    section('Workplace Exposure / Experience',v.experience);
    section('Additional Information',v.additional);
    section('References',v.references||'Available on request.');

    const pages=doc.getNumberOfPages();
    for(let p=1;p<=pages;p++){
      doc.setPage(p);doc.setDrawColor(226,232,240);doc.line(margin,pageH-12,pageW-margin,pageH-12);
      doc.setTextColor(125,137,151);doc.setFontSize(7.5);doc.setFont('helvetica','normal');
      doc.text('Prepared with career-support assistance from Funda Online Academy.',margin,pageH-7);
      doc.text(`Page ${p} of ${pages}`,pageW-margin,pageH-7,{align:'right'});
    }
    doc.save(safeFilename(v.name)+'-CV.pdf');
  }catch(e){
    console.error('CV PDF download failed',e);
    alert('The PDF could not be generated right now. Please check the connection and try again.');
  }finally{
    if(b){b.disabled=false;b.textContent='Download PDF'}
  }
}

function builderHtml(){
  const options=(data?.profiles||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.email||'Student')}</option>`).join('');
  return `
    <div class="cvbWrap">
      <div class="cvbTop">
        <div><span class="cvbBadge">LEARNER CV BUILDER</span><h3>Professional Graduate CV</h3><p>Select a learner, use their existing Academy details, choose the relevant course, then edit any field before downloading a finished PDF.</p></div>
      </div>
      <div class="cvbControls">
        <div class="cvbField"><label>Learner</label><select id="cvbLearner"><option value="">Choose learner</option>${options}</select></div>
        <div class="cvbField"><label>Course / training focus</label><select id="cvbCourse"><option value="">General / no course selected</option></select></div>
        <button class="cvbBtn gold" type="button" id="cvbGenerate">Generate from Course</button>
      </div>
      <div class="cvbGrid">
        <div class="cvbForm" id="cvbForm">
          <div class="cvbField full"><label>Full name and surname</label><input id="cvbName" autocomplete="off" placeholder="Learner full name"></div>
          <div class="cvbField full"><label>Professional headline</label><input id="cvbHeadline" autocomplete="off" placeholder="Entry-Level Candidate"></div>
          <div class="cvbField"><label>Phone</label><input id="cvbPhone" autocomplete="off" placeholder="Phone number"></div>
          <div class="cvbField"><label>Email</label><input id="cvbEmail" type="email" autocomplete="off" placeholder="Email address"></div>
          <div class="cvbField full"><label>Location</label><input id="cvbLocation" autocomplete="off" placeholder="City, Province"></div>
          <div class="cvbField full"><label>Professional profile</label><textarea id="cvbProfile" placeholder="Professional profile"></textarea></div>
          <div class="cvbField full"><label>Core skills — one per line</label><textarea id="cvbSkills" placeholder="Communication&#10;Teamwork&#10;Time management"></textarea></div>
          <div class="cvbField full"><label>Education & training</label><textarea id="cvbEducation"></textarea></div>
          <div class="cvbField full"><label>Workplace exposure / experience</label><textarea id="cvbExperience" placeholder="Add workplace exposure, projects, volunteering or previous employment."></textarea></div>
          <div class="cvbField full"><label>Additional information</label><textarea id="cvbAdditional" placeholder="Optional licences, languages, achievements or availability."></textarea></div>
          <div class="cvbField full"><label>References</label><textarea id="cvbReferences">Available on request.</textarea></div>
          <div class="cvbHint">Course-based wording is generated only from the learner’s selected Academy course and its recorded learning outcomes. Everything remains editable before export, so staff can correct or personalise the CV without changing the learner’s account data.</div>
          <div class="cvbActions">
            <button type="button" class="cvbBtn alt" id="cvbReset">Reset from Learner</button>
            <button type="button" class="cvbBtn" id="cvbDownload">Download PDF</button>
          </div>
        </div>
        <div class="cvbPreview" id="cvbPreview"></div>
      </div>
    </div>`;
}

function bindBuilder(card){
  card.innerHTML=builderHtml();
  $('cvbLearner').onchange=()=>{fillFromLearner();renderPreview()};
  $('cvbCourse').onchange=generateFromCourse;
  $('cvbGenerate').onclick=generateFromCourse;
  $('cvbReset').onclick=resetEditable;
  $('cvbDownload').onclick=downloadPdf;
  $('cvbForm').addEventListener('input',renderPreview);
  renderPreview();
}

async function enhance(){
  if(!active()||busy)return;
  const host=$('careerWorkplaceAdmin');
  if(!host||host.dataset.cvBuilderReady==='1')return;
  const card=host.querySelector('.cwsTemplates .cwsCard');
  if(!card)return;
  busy=true;
  card.innerHTML='<div class="cvbLoading">Loading learner CV builder…</div>';
  try{
    data=await loadData();
    if(!document.body.contains(card)||!active())return;
    host.dataset.cvBuilderReady='1';
    bindBuilder(card);
  }catch(e){
    console.error('Learner CV builder could not load',e);
    card.innerHTML=`<div class="cvbError">The learner CV builder could not load: ${esc(e.message||e)}</div>`;
  }finally{busy=false}
}

function start(){
  css();
  document.addEventListener('click',e=>{
    const b=e.target.closest?.('#nav button,.nav button');
    if(b&&/management/i.test(b.textContent||''))setTimeout(enhance,500);
  },true);
  const view=$('view');
  if(view)new MutationObserver(()=>{if(active())setTimeout(enhance,220)}).observe(view,{childList:true,subtree:true});
  [900,1600,2600].forEach(ms=>setTimeout(enhance,ms));
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();
})();