(()=>{
'use strict';
if(window.__fundaStudentVoice)return;
window.__fundaStudentVoice=true;

const STYLE=`
#studentVoiceSection{color:#172a3c}
.svHero{position:relative;overflow:hidden;padding:28px;border-radius:26px;background:linear-gradient(135deg,#071d49,#0c377c 62%,#174b93);border:1px solid rgba(201,154,46,.58);box-shadow:0 12px 30px rgba(7,29,73,.18);color:#fff}
.svHero:after{content:"";position:absolute;width:280px;height:280px;border-radius:50%;right:-110px;top:-165px;background:rgba(255,255,255,.08)}.svHero>*{position:relative;z-index:1}
.svKicker{margin:0;color:#e7c96f;font-size:12px;letter-spacing:.16em;font-weight:900;text-transform:uppercase}.svHero h1{max-width:820px;margin:8px 0 0;color:#fff!important;font:900 29px/1.25 Montserrat,sans-serif}.svHero p:last-child{max-width:900px;margin:13px 0 0;color:#edf4ff;font-size:15px;line-height:1.7;font-weight:600}
.svPurposeGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:18px}.svPurpose{padding:17px;border:1px solid #dbe3ea;border-radius:16px;background:#fff}.svPurpose b{display:block;color:#17324a;font:900 14px Montserrat,sans-serif}.svPurpose span{display:block;margin-top:6px;color:#344658;font-size:13px;line-height:1.55;font-weight:600}.svPurpose i{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;margin-bottom:11px;background:#fff2c7;color:#7f5707;font-style:normal;font-weight:900}
.svGrid{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(320px,.88fr);gap:18px;margin-top:18px}.svPanel{padding:23px;border:1px solid #dbe3ea;border-radius:22px;background:#fff;box-shadow:0 5px 16px rgba(20,49,77,.05)}.svPanel h2{margin:5px 0 0;color:#17324a!important;font:900 22px/1.3 Montserrat,sans-serif}.svIntro{margin:8px 0 0;color:#344658;font-size:14px;line-height:1.65;font-weight:600}
.svForm{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:19px}.svField{display:grid;gap:6px;color:#17324a;font-size:12px;font-weight:900}.svField.wide{grid-column:1/-1}.svField input,.svField select,.svField textarea{width:100%;border:1px solid #cdd9e5;border-radius:12px;background:#fff;color:#142b40;padding:12px 13px;font:600 14px/1.5 Inter,sans-serif;outline:none}.svField textarea{min-height:145px;resize:vertical}.svField input:focus,.svField select:focus,.svField textarea:focus{border-color:#b88b22;box-shadow:0 0 0 3px rgba(201,154,46,.15)}
.svTypeChoices{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.svTypeChoices label{position:relative;cursor:pointer}.svTypeChoices input{position:absolute;opacity:0}.svTypeChoices span{display:block;padding:11px 7px;border:1px solid #d9e2eb;border-radius:11px;background:#f8fafc;color:#344658;text-align:center;font-size:12px;font-weight:900}.svTypeChoices input:checked+span{border-color:#c49a35;background:#fff2c7;color:#17324a;box-shadow:0 0 0 2px rgba(196,154,53,.12)}
.svCheck{display:flex;align-items:flex-start;gap:9px;padding:12px;border:1px solid #e7d69e;border-radius:12px;background:#fffaf0;color:#3b4651;font-size:12px;line-height:1.55;font-weight:700}.svCheck input{width:18px;height:18px;margin-top:1px;flex:0 0 auto}.svHidden{display:none!important}.svSubmit{grid-column:1/-1;min-height:47px;border:0;border-radius:12px;background:#071d49;color:#fff;font:900 14px Inter,sans-serif;cursor:pointer}.svSubmit:disabled{opacity:.62;cursor:wait}.svMessage{grid-column:1/-1;min-height:20px;margin:0;color:#33485b;font-size:13px;font-weight:700}.svMessage.ok{padding:12px;border-radius:11px;background:#e7f7ee;color:#176044}.svMessage.bad{padding:12px;border-radius:11px;background:#fff0f0;color:#982c2c}
.svRoute{margin-top:16px;padding:15px;border-left:4px solid #d4aa42;border-radius:0 12px 12px 0;background:#fff9e8;color:#354657;font-size:13px;line-height:1.6}.svRoute b{color:#17324a}.svGuideList{display:grid;gap:11px;margin-top:17px}.svGuideItem{display:flex;gap:11px;padding:13px;border:1px solid #e0e7ed;border-radius:13px;background:#fafcfd}.svGuideItem i{display:grid;place-items:center;width:30px;height:30px;flex:0 0 auto;border-radius:9px;background:#071d49;color:#fff;font-style:normal;font-size:12px;font-weight:900}.svGuideItem b{display:block;color:#17324a;font-size:13px}.svGuideItem span{display:block;margin-top:3px;color:#3d4d5c;font-size:12px;line-height:1.5;font-weight:600}
.svHistory{margin-top:18px}.svHistoryHead{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.svRefresh{border:1px solid #d4aa42;border-radius:10px;background:#fff;color:#17324a;padding:9px 12px;font-size:12px;font-weight:900;cursor:pointer}.svList{display:grid;gap:11px;margin-top:15px}.svCard{padding:17px;border:1px solid #dbe3ea;border-radius:15px;background:#fbfdff}.svCardTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.svCard h3{margin:5px 0 0;color:#17324a!important;font:900 15px/1.35 Montserrat,sans-serif}.svRef{color:#8a620e;font-size:10px;letter-spacing:.08em;font-weight:900}.svMeta{margin-top:7px;color:#455565;font-size:12px;line-height:1.5;font-weight:700}.svText{margin:11px 0 0;color:#263746;font-size:13px;line-height:1.6}.svResponse{margin-top:12px;padding:13px;border-left:4px solid #1e7a58;border-radius:0 11px 11px 0;background:#edf8f2}.svResponse b{display:block;color:#155f43;font-size:12px}.svResponse p{margin:5px 0 0;color:#263f36;font-size:13px;line-height:1.6}.svBadge{display:inline-flex;padding:6px 9px;border-radius:999px;background:#fff0cb;color:#845608;font-size:9px;letter-spacing:.04em;font-weight:900;white-space:nowrap}.svBadge.done{background:#e4f5ec;color:#176044}.svBadge.alert{background:#eaf2fb;color:#28577f}.svEmpty{padding:24px;border:1px dashed #cfdbe6;border-radius:14px;text-align:center;color:#435466;font-size:13px;line-height:1.6}
body.sdV2:not([data-sd-view="voice"]) #studentVoiceSection{display:none!important}body.sdV2[data-sd-view="voice"] #dashboardContent>:not(#studentVoiceSection){display:none!important}body.sdV2[data-sd-view="voice"] #studentVoiceSection{display:block!important}
@media(max-width:900px){.svGrid{grid-template-columns:1fr}.svPurposeGrid{grid-template-columns:1fr 1fr}.svPurpose:last-child{grid-column:1/-1}}
@media(max-width:620px){.svHero{padding:23px 19px;border-radius:22px}.svHero h1{font-size:24px}.svPurposeGrid,.svForm{grid-template-columns:1fr}.svPurpose:last-child,.svField.wide,.svSubmit,.svMessage{grid-column:auto}.svTypeChoices{grid-template-columns:1fr}.svPanel{padding:20px 17px}.svCardTop,.svHistoryHead{display:block}.svBadge,.svRefresh{margin-top:9px}.svRefresh{width:100%}}
`;

const areas=[
 ['general','General feedback / leadership'],
 ['learning_assessments','Learning, lessons or assessments'],
 ['enrolment_course_access','Enrolment or course access'],
 ['finance_payments','Payments, fees or balances'],
 ['technical_platform','Website, login or technical platform'],
 ['student_support','Student support or service experience'],
 ['career_workplace','Career or workplace support'],
 ['marketing_communication','Communication or Academy information'],
 ['privacy_conduct','Privacy, conduct or governance']
];
let voiceDb=null,loading=false;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pretty=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmt=v=>v?new Intl.DateTimeFormat('en-ZA',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—';
function statusClass(s){return ['responded','resolved','closed'].includes(String(s||'').toLowerCase())?'done':String(s||'').toLowerCase()==='referred'?'alert':''}
function db(){if(!voiceDb&&window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)voiceDb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});return voiceDb}
function setMessage(text,type=''){const el=$('#svMessage');if(!el)return;el.textContent=text||'';el.className='svMessage'+(type?' '+type:'')}
function sectionHtml(){return `<section id="studentVoiceSection" aria-labelledby="svHeading">
 <div class="svHero"><p class="svKicker">Student Voice · Leadership That Listens</p><h1 id="svHeading">Your experience matters to Funda.</h1><p>Use this private, traceable space to suggest an improvement, raise a complaint or recognise something the Academy has done well. Your submission is routed to the responsible department and remains connected to your own account.</p></div>
 <div class="svPurposeGrid">
  <article class="svPurpose"><i>01</i><b>Suggestion</b><span>Share a practical idea that could improve learning, service or the Academy experience.</span></article>
  <article class="svPurpose"><i>02</i><b>Complaint</b><span>Raise a concern clearly and fairly so it can be reviewed, answered and resolved.</span></article>
  <article class="svPurpose"><i>03</i><b>Compliment</b><span>Recognise excellent service, useful learning content or a positive staff contribution.</span></article>
 </div>
 <div class="svGrid">
  <section class="svPanel"><p class="svKicker">Send Your Message</p><h2>Speak to the Academy</h2><p class="svIntro">Give enough detail for the correct department to understand your experience. Your name and learner account are attached securely; this is not an anonymous form.</p>
   <form id="svForm" class="svForm">
    <fieldset class="svField wide" style="border:0;padding:0;margin:0"><legend style="margin-bottom:7px">Type of submission</legend><div class="svTypeChoices"><label><input type="radio" name="svType" value="suggestion" checked><span>Suggestion</span></label><label><input type="radio" name="svType" value="complaint"><span>Complaint</span></label><label><input type="radio" name="svType" value="compliment"><span>Compliment</span></label></div></fieldset>
    <label class="svField wide">Service area<select id="svArea" required><option value="">Choose the area this is about</option>${areas.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select></label>
    <label class="svField wide">Subject<input id="svSubject" required minlength="5" maxlength="160" placeholder="A short, clear summary"></label>
    <label class="svField wide">Your message<textarea id="svBody" required minlength="20" maxlength="5000" placeholder="Explain what happened, what worked well, or what you suggest."></textarea></label>
    <label class="svField wide">What outcome would be helpful? <span style="font-weight:600;color:#647486">(optional)</span><textarea id="svOutcome" maxlength="1500" style="min-height:90px" placeholder="For example: a response, a review, a correction or consideration of your idea."></textarea></label>
    <label id="svConfidentialWrap" class="svCheck wide svHidden"><input id="svConfidential" type="checkbox"><span><b>Confidential management review</b><br>Use this only for a sensitive complaint. It will be routed to Management & Governance instead of the selected department.</span></label>
    <button id="svSubmit" class="svSubmit" type="submit">Submit to Funda Online Academy</button><p id="svMessage" class="svMessage" role="status" aria-live="polite"></p>
   </form>
  </section>
  <aside class="svPanel"><p class="svKicker">What Happens Next</p><h2>A clear and fair process</h2><div class="svGuideList">
   <div class="svGuideItem"><i>1</i><div><b>Received securely</b><span>You receive a reference number and the record appears in your history.</span></div></div>
   <div class="svGuideItem"><i>2</i><div><b>Routed correctly</b><span>The service area sends it to the responsible Academy department.</span></div></div>
   <div class="svGuideItem"><i>3</i><div><b>Reviewed responsibly</b><span>Administration can prioritise, refer and investigate the matter without changing your original words.</span></div></div>
   <div class="svGuideItem"><i>4</i><div><b>Response recorded</b><span>Any official response and updated status appear here under your secure login.</span></div></div>
  </div><div class="svRoute"><b>Your Voice is not the Support System.</b><br>For an urgent login, course-access, assessment or technical problem that needs direct assistance, log a Support System ticket. Use Your Voice for feedback about your experience.</div></aside>
 </div>
 <section class="svPanel svHistory"><div class="svHistoryHead"><div><p class="svKicker">Your Private Record</p><h2>My submissions</h2><p class="svIntro">Only submissions sent from this Student Portal account are shown here.</p></div><button id="svRefresh" class="svRefresh" type="button">Refresh status</button></div><div id="svList" class="svList"><div class="svEmpty">Open this tab to load your submission history.</div></div></section>
</section>`}
function mount(){
 if(!$('#studentVoiceStyle')){const s=document.createElement('style');s.id='studentVoiceStyle';s.textContent=STYLE;document.head.appendChild(s)}
 const host=$('#dashboardContent');if(host&&!$('#studentVoiceSection'))host.insertAdjacentHTML('beforeend',sectionHtml());
 const form=$('#svForm');if(form&&!form.dataset.bound){form.dataset.bound='1';form.addEventListener('submit',submit)}
 document.querySelectorAll('input[name="svType"]').forEach(r=>{if(!r.dataset.bound){r.dataset.bound='1';r.addEventListener('change',toggleConfidential)}});
 const refresh=$('#svRefresh');if(refresh&&!refresh.dataset.bound){refresh.dataset.bound='1';refresh.addEventListener('click',load)}
 toggleConfidential();
}
function toggleConfidential(){const complaint=$('input[name="svType"]:checked')?.value==='complaint',wrap=$('#svConfidentialWrap'),box=$('#svConfidential');wrap?.classList.toggle('svHidden',!complaint);if(!complaint&&box)box.checked=false}
async function sessionReady(){const client=db();if(!client)return false;const s=await client.auth.getSession();return !!s.data?.session?.user}
async function submit(e){
 e.preventDefault();if(loading)return;setMessage('');
 if(!await sessionReady()){setMessage('Your secure session could not be confirmed. Refresh the page and try again.','bad');return}
 const button=$('#svSubmit'),type=$('input[name="svType"]:checked')?.value||'suggestion';button.disabled=true;button.textContent='Sending securely…';
 const q=await db().rpc('submit_academy_voice',{p_portal:'student',p_submission_type:type,p_service_area:$('#svArea').value,p_subject:$('#svSubject').value.trim(),p_message:$('#svBody').value.trim(),p_preferred_outcome:$('#svOutcome').value.trim()||null,p_confidential:type==='complaint'&&$('#svConfidential').checked});
 if(q.error){setMessage(q.error.message||'Your submission could not be sent. Please try again.','bad')}else{const row=q.data?.[0];setMessage('Received successfully. Your reference is '+(row?.reference_number||'now recorded')+'.','ok');e.target.reset();toggleConfidential();await load()}
 button.disabled=false;button.textContent='Submit to Funda Online Academy';
}
async function load(){
 if(loading)return;mount();const list=$('#svList');if(!list)return;loading=true;list.innerHTML='<div class="svEmpty">Loading your private submission history…</div>';
 try{
  if(!await sessionReady())throw new Error('Your secure session could not be confirmed. Refresh the page and try again.');
  const q=await db().rpc('get_own_academy_voice_submissions',{p_portal:'student'});if(q.error)throw q.error;
  const rows=q.data||[];list.innerHTML=rows.length?rows.map(x=>`<article class="svCard"><div class="svCardTop"><div><span class="svRef">${esc(x.reference_number)}</span><h3>${esc(x.subject)}</h3></div><span class="svBadge ${statusClass(x.status)}">${esc(pretty(x.status))}</span></div><div class="svMeta">${esc(pretty(x.submission_type))} · ${esc(x.routed_department)} · ${fmt(x.created_at)}${x.confidential?' · Confidential management review':''}</div><p class="svText">${esc(x.message)}</p>${x.public_response?`<div class="svResponse"><b>Official Academy response</b><p>${esc(x.public_response)}</p></div>`:'<div class="svMeta">The Academy has not published a response yet.</div>'}</article>`).join(''):'<div class="svEmpty"><b>No submissions yet.</b><br>Your suggestions, complaints and compliments will appear here after you send them.</div>';
 }catch(err){list.innerHTML='<div class="svEmpty">'+esc(err.message||'Your submission history could not be loaded.')+'</div>'}finally{loading=false}
}
function show(){mount();load()}
window.FundaStudentVoice={show,refresh:load};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
