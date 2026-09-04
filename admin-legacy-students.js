(()=>{
if(!/admin-v2\.html$/i.test(location.pathname)||window.__fundaLegacyAdmin)return;window.__fundaLegacyAdmin=true;
let db,claims=[],records=[],courses=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const money=v=>'R'+Number(v||0).toLocaleString('en-ZA',{maximumFractionDigits:2});
const fmt=v=>v?new Date(v).toLocaleString('en-ZA'):'—';
async function initDb(){db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);return db}
async function load(){
 await initDb();
 const [a,b,c]=await Promise.all([
  db.from('legacy_verification_claims').select('*').order('submitted_at',{ascending:false}),
  db.from('legacy_student_records').select('*').order('created_at',{ascending:false}),
  db.from('courses').select('id,title,price').order('title')
 ]);
 claims=a.data||[];records=b.data||[];courses=c.data||[];
}
const course=id=>courses.find(x=>x.id===id)||{};
function css(){
 if(document.getElementById('legacyAdminCss'))return;
 const s=document.createElement('style');s.id='legacyAdminCss';s.textContent=`
 .lgHero{padding:18px;border-radius:15px;background:linear-gradient(135deg,#03101f,#0b315c);color:#fff}.lgHero b{color:#d6b45c;font-size:10px;letter-spacing:.12em}.lgHero h2{margin:4px 0;font-size:20px}.lgHero p{margin:0;color:#dce8f4;font-size:10px}
 .lgK{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}.lgCard,.lgPanel{background:#fff;border:1px solid #e1dac9;border-radius:12px;padding:12px}.lgCard strong{display:block;font-size:18px;color:#071b31}.lgCard span,.lgMeta{font-size:9px;color:#718096}
 .lgBtn{border:0;border-radius:8px;padding:8px 11px;background:#071b31;color:#efd78e;font-size:9px;font-weight:900;cursor:pointer}.lgBtn.ok{background:#176b50;color:#fff}.lgBtn.bad{background:#9d2828;color:#fff}.lgBtn.alt{background:#fff;color:#071b31;border:1px solid #d9d1bf}
 .lgTable{width:100%;border-collapse:collapse;font-size:9.5px}.lgTable th,.lgTable td{padding:9px;border-bottom:1px solid #edf0f3;text-align:left;vertical-align:top}.lgPill{padding:4px 7px;border-radius:99px;background:#edf2f7;font-size:8px;font-weight:900}.lgPill.approved{background:#e5f6ef;color:#176b50}.lgPill.pending{background:#fff2d2;color:#8a5a05}.lgPill.declined{background:#ffe7e7;color:#9d2828}
 .lgGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.lgInput{width:100%;border:1px solid #d9d1bf;border-radius:8px;padding:9px;font-size:10px}.lgAct{display:flex;gap:5px;flex-wrap:wrap}
 @media(max-width:900px){.lgK{grid-template-columns:repeat(2,1fr)}.lgGrid{grid-template-columns:1fr}}`;document.head.appendChild(s);
}
function addEntryButton(){
 const tabs=document.querySelector('.enTabs');if(!tabs||document.getElementById('legacyAdminBtn'))return;
 const b=document.createElement('button');b.id='legacyAdminBtn';b.className='enBtn alt';b.textContent='Legacy Student Verification';b.onclick=open;tabs.appendChild(b);
}
async function evidence(path){
 if(!path)return alert('No evidence file was submitted.');
 await initDb();const r=await db.storage.from('legacy-verification').createSignedUrl(path,300);
 if(r.error)return alert(r.error.message);window.open(r.data.signedUrl,'_blank','noopener');
}
async function decide(id,status){
 const note=prompt(status==='approved'?'Approval note / historical record checked:':'Reason for declining this legacy claim:');
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
 v.innerHTML=`<div class="lgHero"><b>NO STUDENT LEFT BEHIND</b><h2>Legacy Student Verification</h2><p>Verify historical Funda study records before discounted enrolments receive course access.</p></div>
 <div class="lgK"><div class="lgCard"><strong>${records.length}</strong><span>Historical records loaded</span></div><div class="lgCard"><strong>${pending}</strong><span>Claims awaiting review</span></div><div class="lgCard"><strong>${approved}</strong><span>Claims approved</span></div><div class="lgCard"><strong>${declined}</strong><span>Claims declined</span></div></div>
 <div class="lgPanel"><div class="lgAct"><button class="lgBtn alt" id="lgBack">← Enrolments</button><button class="lgBtn" id="lgRefresh">Refresh</button></div><h3>Verification Claims</h3><div style="overflow:auto"><table class="lgTable"><thead><tr><th>Student / ID</th><th>Selected course</th><th>Claim</th><th>Benefit</th><th>Historical details</th><th>Status</th><th>Action</th></tr></thead><tbody>
 ${claims.map(x=>`<tr><td><b>${esc(x.id_number)}</b><div class="lgMeta">Submitted ${fmt(x.submitted_at)}</div></td><td>${esc(course(x.course_id).title||'Course')}</td><td>${esc(x.claim_type.replaceAll('_',' '))}<div class="lgMeta">${x.system_verification_method==='certificate_text_reading'?'Certificate read by system':x.auto_matched?'System matched record':'Manual verification'}${x.system_verification_score?'<br>System score: '+esc(x.system_verification_score)+'%':''}</div></td><td><b>${Number(x.discount_percent||0)}% off</b><div class="lgMeta">${money(x.original_amount)} → ${money(x.payable_amount)}</div></td><td>${x.old_payment_date?'Paid: '+esc(x.old_payment_date):''}${x.noncompletion_reason?'<div class="lgMeta">Reason: '+esc(x.noncompletion_reason)+'</div>':''}</td><td><span class="lgPill ${x.verification_status}">${esc(x.verification_status.toUpperCase())}</span></td><td><div class="lgAct"><button class="lgBtn alt" data-proof="${esc(x.evidence_path||'')}">View proof</button>${x.verification_status==='pending'?'<button class="lgBtn ok" data-approve="'+x.id+'">Approve</button><button class="lgBtn bad" data-decline="'+x.id+'">Decline</button>':''}</div></td></tr>`).join('')||'<tr><td colspan="7">No legacy claims yet.</td></tr>'}
 </tbody></table></div></div>
 <div class="lgPanel" style="margin-top:10px"><h3>Add Historical Student Record</h3><p class="lgMeta">Use this to preload former students from your old certificates/payment files. Student names are never exposed publicly; matching happens privately by ID and mapped course.</p><div class="lgGrid">
 <input id="lgFull" class="lgInput" placeholder="Former student's full name"><input id="lgId" class="lgInput" maxlength="13" placeholder="13-digit ID number"><input id="lgOldCourse" class="lgInput" placeholder="Old course name">
 <select id="lgCourse" class="lgInput"><option value="">Map to current course</option>${courses.map(c=>'<option value="'+c.id+'">'+esc(c.title)+'</option>').join('')}</select>
 <select id="lgType" class="lgInput"><option value="completed">Completed</option><option value="incomplete">Paid but incomplete</option></select><input id="lgCert" class="lgInput" placeholder="Old certificate number (if applicable)"><input id="lgDate" type="date" class="lgInput"></div><button id="lgAdd" class="lgBtn" style="margin-top:8px">Add Historical Record</button></div>`;
 document.getElementById('lgBack').onclick=()=>window.FundaEnrolmentsCourses?.open?.();
 document.getElementById('lgRefresh').onclick=open;document.getElementById('lgAdd').onclick=addRecord;
 v.onclick=e=>{const p=e.target.closest('[data-proof]');if(p)return evidence(p.dataset.proof);const a=e.target.closest('[data-approve]');if(a)return decide(a.dataset.approve,'approved');const d=e.target.closest('[data-decline]');if(d)return decide(d.dataset.decline,'declined')};
}
async function open(){css();await load();render()}
function install(){css();const o=new MutationObserver(addEntryButton);o.observe(document.body,{childList:true,subtree:true});addEntryButton();window.FundaLegacyAdmin={open}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();