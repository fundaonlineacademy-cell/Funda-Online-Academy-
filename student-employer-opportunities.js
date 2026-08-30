(()=>{
if(!/dashboard\.html$/i.test(location.pathname)||window.__fundaStudentEmployer)return;
window.__fundaStudentEmployer=true;
let db,user;
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const date=x=>x?new Date(x).toLocaleDateString('en-ZA'):'Open until filled';
const css=`.seo{margin:0 0 24px;background:linear-gradient(135deg,#eef1f0,#fff4dc,#f5dbe4);border:1px solid #dec98d;border-radius:24px;padding:20px;box-shadow:0 10px 28px rgba(34,72,119,.07)}.seo h2,.seo h3{color:#21384d}.seo h2{margin:5px 0}.seo p{color:#5e6c79;line-height:1.65}.seoK{font-size:10px;font-weight:900;letter-spacing:.15em;color:#a87918}.seoGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}.seoCard{background:#fffaf0;border:1px solid #e2d8c2;border-radius:16px;padding:15px}.seoCard h3{font-size:15px;margin:0 0 5px}.seoMeta{font-size:10px;color:#75818c;margin:5px 0}.seoChecks{display:grid;gap:8px;margin:12px 0}.seoCheck{display:flex;gap:9px;align-items:flex-start;background:#f4eee2;padding:10px;border-radius:10px;font-size:11px;color:#405164}.seoCheck input{margin-top:3px}.seo input[type=text],.seo textarea{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d7cebd;border-radius:10px;background:#fffdf8;font:inherit;font-size:12px}.seo textarea{min-height:90px;resize:vertical}.seoBtn{border:0;border-radius:10px;background:#21384d;color:#fff;padding:10px 12px;font-size:11px;font-weight:900;cursor:pointer}.seoBtn.alt{background:#fff;color:#21384d;border:1px solid #d8c894}.seoBtn:disabled{opacity:.55}.seoTag{display:inline-block;border-radius:999px;padding:4px 7px;background:#e4efe9;color:#28654e;font-size:9px;font-weight:900}.seoNotice{margin-top:10px;background:#f3ead8;border-radius:10px;padding:10px;font-size:10px;color:#665e50}.seoStatus{margin-top:8px;font-size:11px;font-weight:800;color:#2c6b51}@media(max-width:760px){.seoGrid{grid-template-columns:1fr}.seo{padding:16px}}`;
function addStyle(){if(document.getElementById('seoStyle'))return;let s=document.createElement('style');s.id='seoStyle';s.textContent=css;document.head.appendChild(s)}
async function init(){
  addStyle();
  db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  if(!db)return;
  let session=await db.auth.getSession();
  user=session.data.session?.user;
  if(!user)return;
  let en=await db.from('enrollments').select('course_id,enrollment_status,status').eq('student_id',user.id);
  let approved=(en.data||[]).filter(x=>String(x.enrollment_status||x.status||'').toLowerCase()==='approved');
  if(!approved.length)return;
  await mount();
}
async function mount(){
  document.getElementById('studentEmployerOpportunities')?.remove();
  let [pref,opp,int]=await Promise.all([
    db.from('learner_employer_preferences').select('*').eq('student_id',user.id).maybeSingle(),
    db.from('employer_opportunities').select('*').eq('status','open').order('created_at',{ascending:false}),
    db.from('student_opportunity_interests').select('id,opportunity_id,status').eq('student_id',user.id)
  ]);
  let p=pref.data||{},opps=opp.data||[],interest=new Map((int.data||[]).map(x=>[x.opportunity_id,x]));
  let x=document.createElement('section');x.id='studentEmployerOpportunities';x.className='seo';
  x.innerHTML=`<div class="seoK">EMPLOYER OPPORTUNITIES · OPT-IN</div><h2>Employer & Industry Opportunities</h2><p>You decide whether you want Funda Online Academy to consider your professional profile when relevant employer opportunities arise. Your private student account is never opened to employers.</p><div class="seoGrid"><article class="seoCard"><h3>Your Employer Opportunity Preference</h3><p style="font-size:11px">Opt in only if you want the Academy to include you in its internal talent pool. You can switch this off later.</p><div class="seoChecks"><label class="seoCheck"><input id="seoShare" type="checkbox" ${p.share_profile?'checked':''}> I give Funda Online Academy permission to use my professional profile internally to identify suitable employer opportunities and, where appropriate, share relevant professional information through an authorised Academy process.</label><label class="seoCheck"><input id="seoRecruit" type="checkbox" ${p.available_for_recruitment?'checked':''}> I would like to be considered for recruitment opportunities.</label><label class="seoCheck"><input id="seoExposure" type="checkbox" ${p.available_for_workplace_exposure?'checked':''}> I would like to be considered for workplace exposure opportunities.</label></div><label style="font-size:10px;font-weight:900;color:#405164">Preferred location / area</label><input id="seoLocation" type="text" maxlength="160" value="${esc(p.preferred_location||'')}" placeholder="e.g. East London, Gauteng, Remote"><label style="display:block;margin-top:9px;font-size:10px;font-weight:900;color:#405164">Short professional profile</label><textarea id="seoProfile" maxlength="1200" placeholder="Briefly describe your strengths, goals and the type of opportunity you are looking for.">${esc(p.short_profile||'')}</textarea><button id="seoSave" class="seoBtn" style="margin-top:10px">Save My Preference</button><div id="seoSaveStatus" class="seoStatus"></div><div class="seoNotice"><b>Privacy:</b> Opting in does not make your full student record public. Employers do not receive your login details, ID number, payment information, assessment records or other unrelated private information.</div></article><article class="seoCard"><h3>Current Opportunities</h3><p style="font-size:11px">These opportunities are published by the Academy after employer engagement. Expressing interest is not a job or placement guarantee.</p><div style="display:grid;gap:9px">${opps.length?opps.map(o=>{let i=interest.get(o.id);return `<div style="border:1px solid #e5dcc9;border-radius:12px;padding:11px;background:#fff"><div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start"><b style="color:#21384d;font-size:12px">${esc(o.title)}</b><span class="seoTag">${esc(String(o.opportunity_type||'opportunity').replaceAll('_',' ').toUpperCase())}</span></div><div class="seoMeta">${esc(o.organisation_name||'Employer partner')} · ${esc([o.city,o.province].filter(Boolean).join(', ')||'Location not stated')} · Closing: ${esc(date(o.closing_date))}</div><p style="font-size:11px;margin:7px 0">${esc(o.description||'Opportunity details will be confirmed by the Academy.')}</p><div style="font-size:10px;color:#687582"><b>Relevant skills / courses:</b> ${esc(o.skills_or_courses||'Not specified')}</div>${i?`<div class="seoStatus">Interest submitted · ${esc(String(i.status||'submitted').replaceAll('_',' '))}</div>`:`<button class="seoBtn alt" data-interest="${o.id}" style="margin-top:8px">Express Interest</button>`}</div>`}).join(''):'<div class="seoNotice">There are no open employer opportunities right now. You may still save your talent-pool preference for future opportunities.</div>'}</div></article></div><div class="seoNotice"><b>Important:</b> Funda Online Academy helps learners prepare for and connect with opportunities, but does not guarantee employment, interviews, workplace exposure, remuneration or acceptance by an employer.</div>`;
  let anchor=document.getElementById('studentCareerSupport')||document.getElementById('studentSupportSection')||document.querySelector('main');
  if(!anchor)return;
  if(anchor.id==='studentCareerSupport')anchor.insertAdjacentElement('afterend',x);else anchor.insertAdjacentElement('beforebegin',x);
  bind(x);
}
function bind(root){
  let save=root.querySelector('#seoSave');
  save.onclick=async()=>{
    let share=root.querySelector('#seoShare').checked,recruit=root.querySelector('#seoRecruit').checked,exposure=root.querySelector('#seoExposure').checked;
    if((recruit||exposure)&&!share){alert('Please enable the main talent-pool consent if you want the Academy to consider your profile for employer opportunities.');return}
    save.disabled=true;
    let payload={student_id:user.id,share_profile:share,available_for_recruitment:share&&recruit,available_for_workplace_exposure:share&&exposure,preferred_location:root.querySelector('#seoLocation').value.trim()||null,short_profile:root.querySelector('#seoProfile').value.trim()||null,consented_at:share?new Date().toISOString():null,updated_at:new Date().toISOString()};
    let q=await db.from('learner_employer_preferences').upsert(payload,{onConflict:'student_id'});
    save.disabled=false;
    root.querySelector('#seoSaveStatus').textContent=q.error?'Could not save preference: '+q.error.message:'Your employer opportunity preference has been saved.';
  };
  root.querySelectorAll('[data-interest]').forEach(btn=>btn.onclick=async()=>{
    let msg=prompt('Optional: add a short message about why you are interested in this opportunity.','');
    if(msg===null)return;
    btn.disabled=true;
    let q=await db.from('student_opportunity_interests').insert({opportunity_id:btn.dataset.interest,student_id:user.id,message:msg.trim()||null});
    if(q.error){btn.disabled=false;alert('Could not submit interest: '+q.error.message);return}
    alert('Your interest has been submitted to Funda Online Academy. The Academy will manage any next steps with the employer.');
    await mount();
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,1300));else setTimeout(init,1300);
})();