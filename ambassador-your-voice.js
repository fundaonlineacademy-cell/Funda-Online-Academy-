(()=>{
'use strict';
if(window.__fundaAmbassadorVoice)return;
window.__fundaAmbassadorVoice=true;

const CSS=`
#ambassadorVoiceSection .avHero{background:linear-gradient(135deg,#0c2d4b,#244f6f);color:#fff;position:relative;overflow:hidden}#ambassadorVoiceSection .avHero:after{content:"";position:absolute;width:250px;height:250px;border-radius:50%;right:-90px;top:-150px;background:#e3bd6248}#ambassadorVoiceSection .avHero>*{position:relative;z-index:1}#ambassadorVoiceSection .avHero h2{color:#fff;font-size:28px;margin:7px 0 0}#ambassadorVoiceSection .avHero p{max-width:900px;color:#e5edf3;font-size:14px;line-height:1.7;margin:11px 0 0}
.avPurposeGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.avPurpose{min-height:155px}.avPurpose i{display:grid;place-items:center;width:35px;height:35px;border-radius:10px;background:linear-gradient(135deg,#ddb34c,#f1d68c);color:#17324a;font-style:normal;font-weight:900}.avPurpose b{display:block;color:#17324a;font-size:15px;margin-top:13px}.avPurpose span{display:block;color:#4c5d6b;font-size:13px;line-height:1.55;margin-top:6px}
.avLayout{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:12px}.avLead{font-size:14px!important;line-height:1.65!important}.avForm{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:17px}.avField{display:grid;gap:6px;color:#17324a;font-size:12px;font-weight:900}.avField small{font-weight:600;color:#6b7782}.avWide{grid-column:1/-1}fieldset.avField{border:0;padding:0;margin:0}.avField input,.avField select,.avField textarea{width:100%;border:1px solid #ccd7df;border-radius:11px;background:#fff;color:#17324a;padding:12px;font:600 14px/1.5 Arial,sans-serif;outline:none}.avField textarea{min-height:140px;resize:vertical}.avField textarea.avOutcome{min-height:88px}.avField input:focus,.avField select:focus,.avField textarea:focus{border-color:#c39a36;box-shadow:0 0 0 3px #d6ad4d24}
.avTypes{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.avTypes label{position:relative;cursor:pointer}.avTypes input{position:absolute;opacity:0}.avTypes span{display:block;padding:11px 7px;border:1px solid #d9e1e7;border-radius:10px;background:#f7f9fa;color:#425466;text-align:center;font-size:12px;font-weight:900}.avTypes input:checked+span{border-color:#c49a35;background:#fff2c7;color:#17324a;box-shadow:0 0 0 2px #c49a3520}.avConfidential{display:flex;align-items:flex-start;gap:9px;padding:12px;border:1px solid #e6d294;border-radius:11px;background:#fff9e8;color:#42515e;font-size:12px;line-height:1.55}.avConfidential input{width:18px;height:18px;margin-top:1px;flex:0 0 auto}.avConfidential b{color:#17324a}.avHidden{display:none!important}.avMessage{min-height:18px;margin:0;color:#425466;font-size:12px;font-weight:700}.avMessage.ok,.avMessage.bad{padding:11px;border-radius:10px}.avMessage.ok{background:#e8f6ee;color:#176346}.avMessage.bad{background:#fff0f0;color:#952b2b}#avSubmit{min-height:45px;font-size:13px}#avSubmit:disabled{opacity:.62;cursor:wait}
.avSteps{display:grid;gap:10px;margin-top:15px}.avSteps>div{display:flex;gap:10px;padding:12px;border:1px solid #e0e6ea;border-radius:11px;background:#fafcfd}.avSteps i{display:grid;place-items:center;width:29px;height:29px;flex:0 0 auto;border-radius:8px;background:#17324a;color:#fff;font-style:normal;font-weight:900}.avSteps b{display:block;color:#17324a;font-size:13px}.avSteps small{display:block;margin-top:3px;color:#53626f;font-size:12px;line-height:1.5}.avNotice{display:block!important;margin-top:14px;font-size:12px;line-height:1.6}.avHistory .sectionHead{align-items:flex-start}.avList{display:grid;gap:10px;margin-top:14px}.avCard{padding:16px;border:1px solid #dce4e9;border-radius:13px;background:#fbfcfd}.avCardTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.avCard h3{margin:5px 0 0;color:#17324a;font-size:15px}.avRef{color:#95701c;font-size:10px;letter-spacing:.08em;font-weight:900}.avMeta{margin-top:7px;color:#53626f;font-size:12px;line-height:1.5;font-weight:700}.avText{margin:10px 0 0!important;color:#334756!important;font-size:13px!important;line-height:1.6!important}.avResponse{margin-top:12px;padding:12px;border-left:4px solid #28785b;border-radius:0 10px 10px 0;background:#edf8f2}.avResponse b{display:block;color:#176044;font-size:12px}.avResponse p{margin:5px 0 0!important;color:#2e453b!important;font-size:13px!important;line-height:1.6!important}.avStatus{display:inline-flex;padding:6px 8px;border-radius:999px;background:#fff0cb;color:#835507;font-size:9px;font-weight:900;white-space:nowrap}.avStatus.done{background:#e6f5ed;color:#176044}.avStatus.alert{background:#eaf2fb;color:#28577f}
@media(min-width:901px){#ambassadorVoiceSection .card h2{font-size:21px}}
@media(max-width:800px){.avLayout{grid-template-columns:1fr}.avPurposeGrid{grid-template-columns:1fr 1fr}.avPurpose:last-child{grid-column:1/-1}}
@media(max-width:560px){#ambassadorVoiceSection .avHero h2{font-size:24px}.avPurposeGrid,.avForm{grid-template-columns:1fr}.avPurpose:last-child,.avWide{grid-column:auto}.avTypes{grid-template-columns:1fr}.avCardTop{display:block}.avStatus{margin-top:8px}.avHistory .sectionHead .btn{width:100%}}
`;

let voiceDb=null,busy=false;
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pretty=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmt=v=>v?new Intl.DateTimeFormat('en-ZA',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v)):'—';
const statusClass=s=>['responded','resolved','closed'].includes(String(s||'').toLowerCase())?'done':String(s||'').toLowerCase()==='referred'?'alert':'';
function client(){if(!voiceDb&&window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY)voiceDb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});return voiceDb}
function message(text,type=''){const el=$('#avMessage');if(!el)return;el.textContent=text||'';el.className='avMessage avWide'+(type?' '+type:'')}
function mount(){
 if(!$('#ambassadorVoiceStyle')){const s=document.createElement('style');s.id='ambassadorVoiceStyle';s.textContent=CSS;document.head.appendChild(s)}
 const form=$('#avForm');if(form&&!form.dataset.bound){form.dataset.bound='1';form.addEventListener('submit',submit)}
 document.querySelectorAll('input[name="avType"]').forEach(r=>{if(!r.dataset.bound){r.dataset.bound='1';r.addEventListener('change',toggleConfidential)}});
 const refresh=$('#avRefresh');if(refresh&&!refresh.dataset.bound){refresh.dataset.bound='1';refresh.addEventListener('click',load)}
 toggleConfidential();
}
function toggleConfidential(){const complaint=$('input[name="avType"]:checked')?.value==='complaint',wrap=$('#avConfidentialWrap'),box=$('#avConfidential');wrap?.classList.toggle('avHidden',!complaint);if(!complaint&&box)box.checked=false}
async function sessionReady(){const c=client();if(!c)return false;const s=await c.auth.getSession();return !!s.data?.session?.user}
async function submit(e){
 e.preventDefault();if(busy)return;message('');if(!await sessionReady()){message('Your secure session could not be confirmed. Refresh the page and try again.','bad');return}
 const button=$('#avSubmit'),type=$('input[name="avType"]:checked')?.value||'suggestion';button.disabled=true;button.textContent='Sending securely…';
 const q=await client().rpc('submit_academy_voice',{p_portal:'ambassador',p_submission_type:type,p_service_area:$('#avArea').value,p_subject:$('#avSubject').value.trim(),p_message:$('#avBody').value.trim(),p_preferred_outcome:$('#avOutcome').value.trim()||null,p_confidential:type==='complaint'&&$('#avConfidential').checked});
 if(q.error){message(q.error.message||'Your submission could not be sent. Please try again.','bad')}else{const row=q.data?.[0];message('Received successfully. Your reference is '+(row?.reference_number||'now recorded')+'.','ok');e.target.reset();toggleConfidential();await load()}
 button.disabled=false;button.textContent='Submit to Funda Online Academy';
}
async function load(){
 if(busy)return;mount();const list=$('#avList');if(!list)return;busy=true;list.innerHTML='<div class="empty">Loading your private submission history…</div>';
 try{
  if(!await sessionReady())throw new Error('Your secure session could not be confirmed. Refresh the page and try again.');
  const q=await client().rpc('get_own_academy_voice_submissions',{p_portal:'ambassador'});if(q.error)throw q.error;
  const rows=q.data||[];list.innerHTML=rows.length?rows.map(x=>`<article class="avCard"><div class="avCardTop"><div><span class="avRef">${esc(x.reference_number)}</span><h3>${esc(x.subject)}</h3></div><span class="avStatus ${statusClass(x.status)}">${esc(pretty(x.status))}</span></div><div class="avMeta">${esc(pretty(x.submission_type))} · ${esc(x.routed_department)} · ${fmt(x.created_at)}${x.confidential?' · Confidential management review':''}</div><p class="avText">${esc(x.message)}</p>${x.public_response?`<div class="avResponse"><b>Official Academy response</b><p>${esc(x.public_response)}</p></div>`:'<div class="avMeta">The Academy has not published a response yet.</div>'}</article>`).join(''):'<div class="empty"><b>No submissions yet.</b><br>Your suggestions, complaints and compliments will appear here after you send them.</div>';
 }catch(err){list.innerHTML='<div class="empty">'+esc(err.message||'Your submission history could not be loaded.')+'</div>'}finally{busy=false}
}
function show(){mount();load()}
window.FundaAmbassadorVoice={show,refresh:load};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
