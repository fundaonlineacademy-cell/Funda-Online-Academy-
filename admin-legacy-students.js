(()=>{
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaLegacyAdmin)return;window.__fundaLegacyAdmin=true;
let db,claims=[],records=[],courses=[],students=[],enrollments=[],payments=[],lastGood=null,lastError='',liveChannel=null,liveTimer=null,pendingLive=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>'R'+Number(v||0).toLocaleString('en-ZA',{maximumFractionDigits:2});
const fmt=v=>v?new Date(v).toLocaleString('en-ZA'):'—';
async function initDb(){db=db||window.__fundaSharedSupabaseClient||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);return db}
async function load(){
 await initDb();if(!db)throw new Error('Legacy verification data connection is unavailable.');
 const [a,b,c,st,e,p]=await Promise.all([
  db.from('legacy_verification_claims').select('*').order('submitted_at',{ascending:false}),
  db.from('legacy_student_records').select('*').order('created_at',{ascending:false}),
  db.from('courses').select('id,title,price').order('title'),
  db.from('students').select('id,user_id,full_name,email,mobile_whatsapp,gender,south_african_id,identity_document_type,passport_number,date_of_birth,nationality,city,province'),
  db.from('enrollments').select('id,student_id,course_id,enrollment_status,status,amount,original_amount,discount_percent,student_category,legacy_claim_id,proof_url,submitted_at,reviewed_at,review_notes,rejection_reason'),
  db.from('payments').select('id,student_id,enrolment_id,amount,payment_method,status,proof_url,notes,submitted_at,verified_at,rejection_reason,original_amount,discount_percent,student_category,legacy_claim_id').order('submitted_at',{ascending:false})
 ]);
 let bad=[a,b,c,st,e,p].find(x=>x.error);if(bad){lastError=bad.error.message||'Legacy verification records could not refresh.';if(lastGood){claims=[...lastGood.claims];records=[...lastGood.records];courses=[...lastGood.courses];students=[...lastGood.students];enrollments=[...lastGood.enrollments];payments=[...lastGood.payments];return true}throw bad.error}
 claims=a.data||[];records=b.data||[];courses=c.data||[];students=st.data||[];enrollments=e.data||[];payments=p.data||[];lastGood={claims:[...claims],records:[...records],courses:[...courses],students:[...students],enrollments:[...enrollments],payments:[...payments]};lastError='';return true;
}
const course=id=>courses.find(x=>x.id===id)||{};
const studentFor=x=>students.find(s=>s.id===x.student_id||s.user_id===x.user_id)||{};
const enrollmentFor=x=>enrollments.find(e=>e.id===x.enrollment_id||e.legacy_claim_id===x.id)||{};
const paymentFor=x=>{const e=enrollmentFor(x);return payments.find(p=>p.legacy_claim_id===x.id||(e.id&&p.enrolment_id===e.id))||{}};
const yesno=v=>v===true?'✓ Matched':v===false?'✗ Not matched':'—';
function css(){
 if(document.getElementById('legacyAdminCss'))return;
 const s=document.createElement('style');s.id='legacyAdminCss';s.textContent=`
 .lgHero{padding:18px;border-radius:15px;background:linear-gradient(135deg,#03101f,#0b315c);color:#fff}.lgHero b{color:#d6b45c;font-size:10px;letter-spacing:.12em}.lgHero h2{margin:4px 0;font-size:20px}.lgHero p{margin:0;color:#dce8f4;font-size:10px}
 .lgK{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.lgCard,.lgPanel{background:#fff;border:1px solid #e1dac9;border-radius:12px;padding:12px}.lgCard strong{display:block;font-size:18px;color:#071b31}.lgCard span,.lgMeta{font-size:9px;color:#718096}
 .lgBtn{border:0;border-radius:8px;padding:8px 11px;background:#071b31;color:#efd78e;font-size:9px;font-weight:900;cursor:pointer}.lgBtn.ok{background:#176b50;color:#fff}.lgBtn.bad{background:#9d2828;color:#fff}.lgBtn.alt{background:#fff;color:#071b31;border:1px solid #d9d1bf}
 .lgTable{width:100%;border-collapse:collapse;font-size:9.5px}.lgTable th,.lgTable td{padding:9px;border-bottom:1px solid #edf0f3;text-align:left;vertical-align:top}.lgPill{padding:4px 7px;border-radius:99px;background:#edf2f7;font-size:8px;font-weight:900}.lgPill.approved{background:#e5f6ef;color:#176b50}.lgPill.pending{background:#fff2d2;color:#8a5a05}.lgPill.declined{background:#ffe7e7;color:#9d2828}
 .lgGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.lgInput{width:100%;border:1px solid #d9d1bf;border-radius:8px;padding:9px;font-size:10px}.lgAct{display:flex;gap:5px;flex-wrap:wrap}
 .lgModal{position:fixed;inset:0;background:rgba(2,10,24,.72);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:20px;overflow:auto}.lgModalCard{width:min(1080px,100%);background:#f8fafc;border-radius:18px;margin:auto;box-shadow:0 28px 70px rgba(0,0,0,.35);overflow:hidden}.lgModalHead{background:#071b31;color:#fff;padding:18px;display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.lgModalBody{padding:14px}.lgSection{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:13px;margin-bottom:10px}.lgSection h4{margin:0 0 9px;color:#071b31;font-size:12px}.lgFacts{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.lgFact{background:#f8fafc;border-radius:9px;padding:9px}.lgFact span{display:block;font-size:8px;color:#718096;text-transform:uppercase;letter-spacing:.06em}.lgFact b{display:block;margin-top:3px;font-size:10px;color:#10243c;word-break:break-word}.lgVerify{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.lgVerify div{border-radius:9px;padding:9px;font-size:10px;font-weight:800}.lgVerify .yes{background:#e7f7ef;color:#176b50}.lgVerify .no{background:#ffe8e8;color:#9d2828}.lgVerify .na{background:#edf2f7;color:#556070}.lgWarn{background:#fff7dc;border:1px solid #f0d98c;border-radius:10px;padding:10px;font-size:9px;color:#72530b}.lgLive{display:none;margin:8px 0;padding:9px 10px;border-radius:9px;background:#fff4d6;color:#76580e;font-size:9px;font-weight:800}.lgNotes{white-space:pre-wrap;word-break:break-word;font-size:9px;color:#4a5568;line-height:1.5}
 @media(max-width:900px){.lgK{grid-template-columns:repeat(2,1fr)}.lgGrid,.lgFacts,.lgVerify{grid-template-columns:1fr}}`;document.head.appendChild(s);
}
async function openPrivateFile(bucket,path,label){
 if(!path)return alert('No '+label+' file was submitted.');
 await initDb();const r=await db.storage.from(bucket).createSignedUrl(path,300);
 if(r.error)return alert(r.error.message);window.open(r.data.signedUrl,'_blank','noopener');
}
async function evidence(path){return openPrivateFile('legacy-verification',path,'legacy evidence')}
async function paymentProof(path){return openPrivateFile('payment-proofs',path,'payment proof')}
function closeReview(){document.getElementById('lgReviewModal')?.remove()}
function reviewClaim(id){
 const x=claims.find(c=>c.id===id);if(!x)return;
 const s=studentFor(x),e=enrollmentFor(x),p=paymentFor(x),v=x.system_verification_summary||{},orphaned=!s.id;
 const identity=s.identity_document_type==='passport'?(s.passport_number||'—'):(s.south_african_id||x.id_number||'—');
 const identityType=s.identity_document_type==='passport'?'Passport / Foreign ID':'South African ID';
 const modal=document.createElement('div');modal.id='lgReviewModal';modal.className='lgModal';
 modal.innerHTML=`<div class="lgModalCard">
  <div class="lgModalHead"><div><div style="font-size:9px;color:#d6b45c;font-weight:900;letter-spacing:.1em">LEGACY INVESTIGATION</div><h3 style="margin:4px 0 2px">${esc(s.full_name||(orphaned?'Former / deleted Student account':'Student'))}</h3><div style="font-size:9px;color:#cbd5e1">${esc(course(x.course_id).title||'Course')} · Claim submitted ${fmt(x.submitted_at)}</div></div><button class="lgBtn alt" id="lgCloseReview">Close</button></div>
  <div class="lgModalBody">
   ${orphaned?'<div class="lgWarn" style="margin-bottom:10px"><b>Historical/orphaned claim:</b> the original Student account is no longer present in the current active Student register. The claim and its private evidence are retained for audit review and must not be treated as an active Student account.</div>':''}
   <div class="lgSection"><h4>Student identity</h4><div class="lgFacts">
    <div class="lgFact"><span>Full name</span><b>${esc(s.full_name||'—')}</b></div>
    <div class="lgFact"><span>Email</span><b>${esc(s.email||'—')}</b></div>
    <div class="lgFact"><span>Mobile</span><b>${esc(s.mobile_whatsapp||'—')}</b></div>
    <div class="lgFact"><span>Identification</span><b>${esc(identityType)}<br>${esc(identity)}</b></div>
    <div class="lgFact"><span>Date of birth</span><b>${esc(s.date_of_birth||'—')}</b></div>
    <div class="lgFact"><span>Nationality</span><b>${esc(s.nationality||'—')}</b></div>
   </div></div>
   <div class="lgSection"><h4>System certificate verification</h4><div class="lgVerify">
    <div class="${v.id_match===true?'yes':v.id_match===false?'no':'na'}">ID number<br>${yesno(v.id_match)}</div>
    <div class="${v.name_match===true?'yes':v.name_match===false?'no':'na'}">Student name<br>${yesno(v.name_match)}</div>
    <div class="${v.course_match===true?'yes':v.course_match===false?'no':'na'}">Course<br>${yesno(v.course_match)}</div>
   </div><div class="lgFacts" style="margin-top:8px">
    <div class="lgFact"><span>Verification method</span><b>${esc(x.system_verification_method||'Manual review')}</b></div>
    <div class="lgFact"><span>System score</span><b>${x.system_verification_score!=null?esc(x.system_verification_score)+'%':'—'}</b></div>
    <div class="lgFact"><span>Historical course key</span><b>${esc(v.course_key||x.old_course_title||'—')}</b></div>
   </div></div>
   <div class="lgSection"><h4>Legacy claim & pricing</h4><div class="lgFacts">
    <div class="lgFact"><span>Claim type</span><b>${esc((x.claim_type||'').replaceAll('_',' '))}</b></div>
    <div class="lgFact"><span>Original course fee</span><b>${money(x.original_amount)}</b></div>
    <div class="lgFact"><span>Provisional discount</span><b>${Number(x.discount_percent||0)}% off</b></div>
    <div class="lgFact"><span>Provisional amount</span><b>${money(x.payable_amount)}</b></div>
    <div class="lgFact"><span>Old payment date</span><b>${esc(x.old_payment_date||'—')}</b></div>
    <div class="lgFact"><span>Claim status</span><b>${esc((x.verification_status||'pending').toUpperCase())}</b></div>
   </div>${x.noncompletion_reason?'<div class="lgWarn" style="margin-top:8px"><b>Reason for not completing:</b><br>'+esc(x.noncompletion_reason)+'</div>':''}</div>
   <div class="lgSection"><h4>Evidence to investigate</h4><div class="lgAct">
    <button class="lgBtn" data-review-legacy-proof="${esc(x.evidence_path||'')}">Open old certificate / evidence</button>
    <button class="lgBtn alt" data-review-payment-proof="${esc(p.proof_url||e.proof_url||'')}">Open new proof of payment</button>
   </div><div class="lgWarn" style="margin-top:9px">Admin must compare the student's identity, old Funda evidence, selected course, system match and new payment proof before approving course access.</div></div>
   <div class="lgSection"><h4>Current enrolment & payment</h4><div class="lgFacts">
    <div class="lgFact"><span>Enrolment status</span><b>${esc(e.enrollment_status||e.status||'Not submitted')}</b></div>
    <div class="lgFact"><span>Enrolment amount</span><b>${e.amount!=null?money(e.amount):'—'}</b></div>
    <div class="lgFact"><span>Payment status</span><b>${esc(p.status||'Not submitted')}</b></div>
    <div class="lgFact"><span>Payment amount</span><b>${p.amount!=null?money(p.amount):'—'}</b></div>
    <div class="lgFact"><span>Payment method</span><b>${esc(p.payment_method||'—')}</b></div>
    <div class="lgFact"><span>Payment submitted</span><b>${fmt(p.submitted_at)}</b></div>
   </div>${p.notes?'<div class="lgNotes" style="margin-top:8px"><b>Payment notes:</b> '+esc(p.notes)+'</div>':''}</div>
   <div class="lgSection"><h4>Admin decision</h4>
    ${x.review_notes?'<div class="lgNotes"><b>Previous review note:</b> '+esc(x.review_notes)+'</div>':''}
    <div class="lgAct" style="margin-top:9px">${x.verification_status==='pending'?'<button class="lgBtn ok" data-review-approve="'+x.id+'">Approve legacy claim</button><button class="lgBtn bad" data-review-decline="'+x.id+'">Decline legacy claim</button>':'<span class="lgPill '+esc(x.verification_status)+'">'+esc(x.verification_status.toUpperCase())+'</span>'}</div>
   </div>
  </div></div>`;
 document.body.appendChild(modal);
 document.getElementById('lgCloseReview').onclick=closeReview;
 modal.onclick=ev=>{if(ev.target===modal)return closeReview();const a=ev.target.closest('[data-review-legacy-proof]');if(a)return evidence(a.dataset.reviewLegacyProof);const pbtn=ev.target.closest('[data-review-payment-proof]');if(pbtn)return paymentProof(pbtn.dataset.reviewPaymentProof);const ok=ev.target.closest('[data-review-approve]');if(ok){closeReview();return decide(ok.dataset.reviewApprove,'approved')}const no=ev.target.closest('[data-review-decline]');if(no){closeReview();return decide(no.dataset.reviewDecline,'declined')}};
}
async function decide(id,status){
 const note=prompt(status==='approved'?'Approval note — confirm the old certificate/evidence has been manually checked. This does not by itself approve course access; Finance must verify payment and Admissions must approve the enrolment.':'Reason for declining this legacy claim:');
 if(!note?.trim())return;
 const u=await db.auth.getUser();
 const r=await db.from('legacy_verification_claims').update({verification_status:status,review_notes:note.trim(),reviewed_by:u.data?.user?.id||null,reviewed_at:new Date().toISOString()}).eq('id',id);
 if(r.error)return alert(r.error.message);await open();
}
async function addRecord(){
 const full=document.getElementById('lgFull').value.trim(),id=document.getElementById('lgId').value.replace(/\D/g,''),old=document.getElementById('lgOldCourse').value.trim(),cid=document.getElementById('lgCourse').value,type=document.getElementById('lgType').value,cert=document.getElementById('lgCert').value.trim(),date=document.getElementById('lgDate').value||null;
 if(!full||id.length!==13||!old||!cid)return alert('Full name, 13-digit ID, old course and current mapped course are required.');
 const r=await db.from('legacy_student_records').insert({full_name:full,south_african_id:id,old_course_title:old,current_course_id:cid,record_type:type,certificate_number:cert||null,old_payment_date:date,legacy_source:'Admin historical register'});
 if(r.error)return alert(r.error.message);await open();
}
function render(){
 const v=document.getElementById('view');if(!v)return;
 const pending=claims.filter(x=>x.verification_status==='pending').length,approved=claims.filter(x=>x.verification_status==='approved').length,declined=claims.filter(x=>x.verification_status==='declined').length;
 v.innerHTML=`<div class="lgHero"><b>NO STUDENT LEFT BEHIND</b><h2>Legacy Student Verification</h2><p>Verify historical Funda study records before discounted enrolments receive course access.</p></div>${lastError?`<div class="lgWarn"><b>Live refresh warning:</b> ${esc(lastError)}. Showing the last successfully loaded legacy-verification records.</div>`:''}<div id="lgLiveNotice" class="lgLive"></div>
 <div class="lgK"><div class="lgCard"><strong>${records.length}</strong><span>Historical records loaded</span></div><div class="lgCard"><strong>${pending}</strong><span>Claims awaiting review</span></div><div class="lgCard"><strong>${approved}</strong><span>Claims approved</span></div><div class="lgCard"><strong>${declined}</strong><span>Claims declined</span></div></div>
 <div class="lgPanel"><div class="lgAct"><button class="lgBtn alt" id="lgBack">← Enrolments</button><button class="lgBtn" id="lgRefresh">Refresh</button></div><h3>Verification Claims</h3><div style="overflow:auto"><table class="lgTable"><thead><tr><th>Student / ID</th><th>Selected course</th><th>Claim</th><th>Benefit</th><th>Historical details</th><th>Status</th><th>Action</th></tr></thead><tbody>
 ${claims.map(x=>{const s=studentFor(x),orphaned=!s.id;return `<tr><td><b>${esc(s.full_name||(orphaned?'Former / deleted Student account':'Student'))}</b><div class="lgMeta">${esc(x.id_number||s.south_african_id||s.passport_number||'—')}<br>Submitted ${fmt(x.submitted_at)}${orphaned?'<br><span style="color:#9d2828;font-weight:800">Historical claim · Student account unavailable</span>':''}</div></td><td>${esc(course(x.course_id).title||'Course')}</td><td>${esc(x.claim_type.replaceAll('_',' '))}<div class="lgMeta">${x.system_verification_method==='certificate_text_reading'?'Certificate read by system':x.auto_matched?'System matched record':'Manual verification'}${x.system_verification_score?'<br>System score: '+esc(x.system_verification_score)+'%':''}</div></td><td><b>${Number(x.discount_percent||0)}% off</b><div class="lgMeta">${money(x.original_amount)} → ${money(x.payable_amount)}</div></td><td>${x.old_payment_date?'Paid: '+esc(x.old_payment_date):''}${x.noncompletion_reason?'<div class="lgMeta">Reason: '+esc(x.noncompletion_reason)+'</div>':''}</td><td><span class="lgPill ${x.verification_status}">${esc(x.verification_status.toUpperCase())}</span></td><td><div class="lgAct"><button class="lgBtn" data-review="${x.id}">Open investigation</button></div></td></tr>`}).join('')||'<tr><td colspan="7">No legacy claims yet.</td></tr>'}
 </tbody></table></div></div>
 <div class="lgPanel" style="margin-top:10px"><h3>Add Historical Student Record</h3><p class="lgMeta">Use this to preload former students from your old certificates/payment files. Student names are never exposed publicly; matching happens privately by ID and mapped course.</p><div class="lgGrid">
 <input id="lgFull" class="lgInput" placeholder="Former student's full name"><input id="lgId" class="lgInput" maxlength="13" placeholder="13-digit ID number"><input id="lgOldCourse" class="lgInput" placeholder="Old course name">
 <select id="lgCourse" class="lgInput"><option value="">Map to current course</option>${courses.map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>').join('')}</select>
 <select id="lgType" class="lgInput"><option value="completed">Completed</option><option value="incomplete">Paid but incomplete</option></select><input id="lgCert" class="lgInput" placeholder="Old certificate number (if applicable)"><input id="lgDate" type="date" class="lgInput"></div><button id="lgAdd" class="lgBtn" style="margin-top:8px">Add Historical Record</button></div>`;
 document.getElementById('lgBack').onclick=()=>window.FundaEnrolmentsCourses?.open?.();
 document.getElementById('lgRefresh').onclick=open;document.getElementById('lgAdd').onclick=addRecord;
 document.querySelectorAll('[data-review]').forEach(b=>b.onclick=()=>reviewClaim(b.dataset.review));
}
function legacyVisible(){return !!document.querySelector('#view .lgHero')}
function editingLegacy(){if(document.getElementById('lgReviewModal'))return true;let a=document.activeElement;return !!a&&!!a.closest?.('#view')&&['INPUT','TEXTAREA','SELECT'].includes(a.tagName)}
async function open(){css();try{await load();render()}catch(e){console.error('Legacy verification open failed',e);alert('Legacy Student Verification could not load: '+String(e?.message||e))}
}
function scheduleLegacyLive(){if(!legacyVisible())return;clearTimeout(liveTimer);liveTimer=setTimeout(async()=>{if(editingLegacy()){pendingLive=true;let n=document.getElementById('lgLiveNotice');if(n){n.style.display='block';n.textContent='A live Legacy verification update is available. Finish the current review before refreshing.'}return}pendingLive=false;let y=window.scrollY;try{await load();render();requestAnimationFrame(()=>window.scrollTo(0,y))}catch(e){console.error('Legacy live refresh failed',e)}},180)}
function legacyRealtime(){if(liveChannel||!db)return;let ch=db.channel('admin-legacy-verification-live-v2');['legacy_verification_claims','legacy_student_records','students','enrollments','payments','courses'].forEach(table=>{ch=ch.on('postgres_changes',{event:'*',schema:'public',table},scheduleLegacyLive)});liveChannel=ch.subscribe(status=>{window.__fundaLegacyRealtimeStatus=status})}
async function install(){css();window.FundaLegacyAdmin={open};try{await initDb();legacyRealtime()}catch(e){console.error('Legacy verification initialisation failed',e)}document.addEventListener('funda:admin-manual-refresh',()=>{if(legacyVisible()&&!editingLegacy())open()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();