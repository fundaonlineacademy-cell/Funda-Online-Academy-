(()=>{
if(!/dashboard\.html$/i.test(location.pathname)||window.__fundaStudentCommunicationCentre)return;
window.__fundaStudentCommunicationCentre=true;
let db,user,state={messages:[],receipts:[],faqs:[],departments:[],settings:null},busy=false,activeFilter='unread';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[m]));
const fmt=v=>v?new Date(v).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}):'';
const css=`.sccWrap{margin-bottom:24px}.sccGrid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.sccCard{background:#fff;border:1px solid #d9e4f2;border-radius:24px;padding:22px;box-shadow:0 10px 28px rgba(34,72,119,.07)}.sccK{font-size:12px;letter-spacing:.16em;font-weight:900;color:#8a5f09}.sccCard h2{margin:5px 0 0;color:#071d49;font-size:24px}.sccIntro{font-size:16px;color:#263746;line-height:1.65;margin-top:8px;font-weight:600}.sccStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.sccStat{width:100%;appearance:none;text-align:left;font-family:Inter,sans-serif;background:linear-gradient(135deg,#f8fbff,#fff9e9);border:1px solid #d2dde8;border-radius:15px;padding:14px;cursor:pointer}.sccStat:hover,.sccStat.active{border-color:#b58216;background:linear-gradient(135deg,#fff8e5,#fff);box-shadow:0 0 0 2px rgba(181,130,22,.12)}.sccStat:focus-visible,.sccBtn:focus-visible{outline:3px solid #d4aa42;outline-offset:3px}.sccStat b{display:block;color:#071d49;font-size:24px}.sccStat span{display:block;margin-top:3px;font-size:14px;color:#1f3040;font-weight:800}.sccInbox{margin-top:20px;padding-top:19px;border-top:1px solid #dbe3ea}.sccInboxHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.sccInboxHead h3{margin:0;color:#071d49;font-size:19px}.sccInboxHead p{margin:5px 0 0;color:#263746;font-size:14px;line-height:1.55;font-weight:600}.sccInboxCount{margin-top:12px;color:#33475a;font-size:13px;font-weight:800}.sccInboxList{margin-top:4px}.sccEmpty{margin-top:12px;padding:18px;border:1px dashed #b9c8d8;border-radius:15px;background:#f8fbff;color:#17324a;font-size:15px;font-weight:800}.sccSafety{margin-top:18px;background:linear-gradient(135deg,#fff5da,#fff);border:1px solid #e6cd84;border-radius:16px;padding:16px}.sccSafety b{font-size:14px;color:#694a08}.sccSafety p{font-size:15px;line-height:1.65;color:#202d39;margin:7px 0 0}.sccFaqs{display:grid;gap:9px;margin-top:16px}.sccFaq{border:1px solid #dfe7ef;border-radius:14px;background:#fbfdff;padding:14px}.sccFaq summary{cursor:pointer;color:#071d49;font-size:15px;font-weight:900}.sccFaq p{font-size:15px;color:#263746;line-height:1.65;margin:10px 0 0}.sccDept{border:1px solid #dfe7ef;border-radius:14px;padding:15px;background:#fff;margin-top:9px}.sccDept h3{font-size:16px;color:#071d49;margin:0}.sccDept p{font-size:14px;line-height:1.6;color:#263746;margin:6px 0}.sccContact{font-size:13px;color:#263746;word-break:break-word;font-weight:700}.sccActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.sccBtn{border:0;border-radius:10px;background:#071d49;color:#fff;padding:10px 13px;font-size:13px;font-weight:900;cursor:pointer;text-decoration:none}.sccBtn.alt{background:#fff;color:#071d49;border:1px solid #aebfd1}.sccBtn:disabled{opacity:.62;cursor:wait}.sccUnread,.sccRead,.sccNotice{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:900}.sccUnread{background:#fff0c9;color:#694a08}.sccRead{background:#e2f4eb;color:#155f3f}.sccNotice{background:#e8eef8;color:#17324a}.sccMessage{border:1px solid #cad8e7;border-radius:16px;padding:16px;background:linear-gradient(135deg,#f9fbff,#fff);margin-top:11px}.sccMessage.unread{border-left:5px solid #d4aa42}.sccMessage.pinned{border-color:#d6b45c;background:linear-gradient(135deg,#fff8e4,#fff)}.sccMessage h3{font-size:17px;color:#071d49;margin:0}.sccMessage p{font-size:16px;color:#202d39;line-height:1.7;margin:9px 0;white-space:pre-line}.sccMeta{font-size:12px;color:#455565;font-weight:700}.sccMsgTop{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}@media(max-width:760px){.sccGrid{grid-template-columns:1fr}.sccStats{grid-template-columns:repeat(3,1fr)}.sccCard{padding:18px}.sccMsgTop{display:block}.sccMsgTop>div:last-child{margin-top:7px}.sccInboxHead{display:block}.sccInboxHead .sccBtn{margin-top:10px}}@media(max-width:430px){.sccStats{gap:7px}.sccStat{padding:11px 9px}.sccStat b{font-size:21px}.sccStat span{font-size:12px}}`;
function style(){if(document.getElementById('sccStyle'))return;let s=document.createElement('style');s.id='sccStyle';s.textContent=css;document.head.appendChild(s)}
async function load(){
  db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);if(!db)return false;
  let ses=await db.auth.getSession();user=ses.data.session?.user;if(!user)return false;
  let [m,r,f,d,c]=await Promise.all([
    db.from('communications').select('*').eq('published',true).order('pinned',{ascending:false}).order('published_at',{ascending:false}).limit(30),
    db.from('communication_recipients').select('*').eq('student_id',user.id),
    db.from('faqs').select('*').eq('active',true).order('display_order'),
    db.from('student_support_departments').select('*').eq('active',true).order('display_order'),
    db.from('academy_contact_settings').select('*').limit(1)
  ]);
  if(m.error)throw new Error('Academy messages could not be loaded. Please refresh the page.');
  if(r.error)throw new Error('Your message read status could not be loaded. Please refresh the page.');
  if(f.error)console.warn('Student FAQs could not be loaded.',f.error);
  if(d.error)console.warn('Support departments could not be loaded.',d.error);
  if(c.error)console.warn('Academy contact settings could not be loaded.',c.error);
  state={messages:m.data||[],receipts:r.data||[],faqs:f.data||[],departments:d.data||[],settings:(c.data||[])[0]||null};
  return true;
}
function receiptMap(){return new Map(state.receipts.map(r=>[r.communication_id,r]))}
function receiptStats(){
  const visibleIds=new Set(state.messages.map(m=>m.id));
  const visibleReceipts=state.receipts.filter(r=>visibleIds.has(r.communication_id));
  return {receipts:visibleReceipts,unread:visibleReceipts.filter(r=>!r.read_at).length,read:visibleReceipts.filter(r=>r.read_at).length,total:state.messages.length};
}
function messageHtml(m,rm){
  const rec=rm.get(m.id),read=!!rec?.read_at,unread=!!rec&&!read;
  const badge=!rec?'<span class="sccNotice">ACADEMY NOTICE</span>':read?'<span class="sccRead">READ</span>':'<span class="sccUnread">NEW / UNREAD</span>';
  const readDate=read?` · Read ${fmt(rec.read_at)}`:'';
  return `<article class="sccMessage ${m.pinned?'pinned ':''}${unread?'unread':''}" aria-labelledby="scc-message-${esc(m.id)}"><div class="sccMsgTop"><div><h3 id="scc-message-${esc(m.id)}">${m.pinned?'📌 ':''}${esc(m.title)}</h3><div class="sccMeta">${esc(m.category||'General')} · Published ${fmt(m.published_at||m.created_at)}${m.priority&&m.priority!=='normal'?' · '+esc(String(m.priority).toUpperCase()):''}${readDate}</div></div><div>${badge}</div></div><p>${esc(m.body)}</p>${unread?`<div class="sccActions"><button type="button" class="sccBtn alt" data-mark-read="${esc(m.id)}">Mark as Read</button></div>`:''}</article>`;
}
function renderInbox(){
  const box=document.getElementById('sccCommunicationMessages');if(!box)return;
  const rm=receiptMap();
  const messages=state.messages.filter(m=>{
    const rec=rm.get(m.id),read=!!rec?.read_at;
    if(activeFilter==='unread')return !!rec&&!read;
    if(activeFilter==='read')return !!rec&&read;
    return true;
  });
  const empty=activeFilter==='unread'?'You have no unread messages.':activeFilter==='read'?'You have not marked any messages as read yet.':'No Academy messages have been published for you yet.';
  box.innerHTML=messages.length?messages.map(m=>messageHtml(m,rm)).join(''):`<div class="sccEmpty">${empty}</div>`;
  const count=document.getElementById('sccInboxCount');if(count)count.textContent=`Showing ${messages.length} of ${state.messages.length} message${state.messages.length===1?'':'s'}`;
  document.querySelectorAll('#studentCommunicationHelpCentre [data-scc-filter]').forEach(button=>{
    const selected=button.dataset.sccFilter===activeFilter;
    button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
  });
  box.querySelectorAll('[data-mark-read]').forEach(button=>button.onclick=()=>markRead(button.dataset.markRead));
}
function safetyFaq(){return state.faqs.find(f=>/security|scam|phish/i.test(`${f.category||''} ${f.question||''}`))}
function officialActions(){let s=state.settings||{},a=[];if(s.general_email)a.push(`<a class="sccBtn alt" href="mailto:${encodeURIComponent(s.general_email)}">Email Academy</a>`);if(s.whatsapp||s.general_phone){let n=String(s.whatsapp||s.general_phone).replace(/\D/g,'');if(n)a.push(`<a class="sccBtn" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(n)}">WhatsApp Support</a>`)}return a.join('')}
function mountHelp(){
  let anchor=document.getElementById('announcementsSection');if(!anchor)return;
  const counts=receiptStats(),safe=safetyFaq();

  document.getElementById('studentCommunicationHelpCentre')?.remove();
  document.getElementById('studentFaqSection')?.remove();
  document.getElementById('studentAcademicSupportSection')?.remove();

  const comm=document.createElement('section');
  comm.id='studentCommunicationHelpCentre';
  comm.className='sccWrap';
  comm.innerHTML=`<div class="sccCard"><div class="sccK">STUDENT COMMUNICATION</div><h2>Communication Centre</h2><div class="sccIntro">Official Academy messages, notices and updates for your learner account.</div><div class="sccStats" aria-label="Message filters"><button type="button" class="sccStat" data-scc-filter="unread"><b>${counts.unread}</b><span>Unread</span></button><button type="button" class="sccStat" data-scc-filter="read"><b>${counts.read}</b><span>Read</span></button><button type="button" class="sccStat" data-scc-filter="all"><b>${counts.total}</b><span>All messages</span></button></div><div class="sccInbox"><div class="sccInboxHead"><div><h3>Your Messages</h3><p>Review each message below. Mark it as read when you have finished.</p></div>${counts.unread?'<button type="button" class="sccBtn" id="sccMarkAllRead">Mark All as Read</button>':''}</div><div id="sccInboxCount" class="sccInboxCount" aria-live="polite"></div><div id="sccCommunicationMessages" class="sccInboxList"></div></div>${safe?`<div class="sccSafety"><b>🛡️ STAY SAFE</b><p><strong>${esc(safe.question)}</strong><br>${esc(safe.answer)}</p></div>`:''}</div>`;
  anchor.insertAdjacentElement('afterend',comm);
  comm.querySelectorAll('[data-scc-filter]').forEach(button=>button.onclick=()=>{activeFilter=button.dataset.sccFilter;renderInbox()});
  const markAll=document.getElementById('sccMarkAllRead');if(markAll)markAll.onclick=markAllRead;
  renderInbox();

  const faq=document.createElement('section');
  faq.id='studentFaqSection';
  faq.className='sccWrap';
  faq.innerHTML=`<div class="sccCard"><div class="sccK">FREQUENTLY ASKED QUESTIONS</div><h2>Student FAQs</h2><div class="sccIntro">Quick answers to common questions about enrolment, payments, learning, assessments, certificates and platform use.</div><div class="sccFaqs">${state.faqs.map(f=>`<details class="sccFaq"><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join('')||'<div class="sccIntro">No FAQs are currently published.</div>'}</div></div>`;
  comm.insertAdjacentElement('afterend',faq);

  const support=document.createElement('section');
  support.id='studentAcademicSupportSection';
  support.className='sccWrap';
  support.innerHTML=`<div class="sccCard"><div class="sccK">KNOW WHO TO CONTACT</div><h2>Academic & Student Support Directory</h2><div class="sccIntro">Choose the department that matches your query. Each department explains what it handles, when to contact it, what information to include and the official contact details.</div><div class="sccActions">${officialActions()}</div>${state.departments.map(d=>`<article class="sccDept"><h3>${esc(d.department_name)}</h3><p>${esc(d.description)}</p><p><b>Department tasks / contact this team for:</b> ${esc(d.when_to_contact)}</p><p><b>Suggested subject / information to include:</b> ${esc(d.what_to_include)}</p><div class="sccContact">${esc(d.contact_email||'')}${d.contact_phone?' · '+esc(d.contact_phone):''}</div></article>`).join('')||'<div class="sccIntro">Support department information is not available yet.</div>'}</div>`;
  faq.insertAdjacentElement('afterend',support);
}
async function markRead(id){
  const rec=state.receipts.find(r=>r.communication_id===id);if(!rec||rec.read_at)return;
  const button=[...document.querySelectorAll('[data-mark-read]')].find(item=>item.dataset.markRead===id);if(button){button.disabled=true;button.textContent='Updating…'}
  const q=await db.from('communication_recipients').update({read_at:new Date().toISOString()}).eq('communication_id',id).eq('student_id',user.id).is('read_at',null).select('communication_id,read_at');
  if(q.error){console.error('Message status update failed.',q.error);if(button){button.disabled=false;button.textContent='Mark as Read'}return alert('We could not mark this message as read. Please try again.')}
  await refresh();
}
async function markAllRead(){
  const visibleIds=new Set(state.messages.map(m=>m.id));
  const ids=state.receipts.filter(r=>visibleIds.has(r.communication_id)&&!r.read_at).map(r=>r.communication_id);if(!ids.length)return;
  const button=document.getElementById('sccMarkAllRead');if(button){button.disabled=true;button.textContent='Updating…'}
  const q=await db.from('communication_recipients').update({read_at:new Date().toISOString()}).eq('student_id',user.id).in('communication_id',ids).is('read_at',null).select('communication_id,read_at');
  if(q.error){console.error('Message status update failed.',q.error);if(button){button.disabled=false;button.textContent='Mark All as Read'}return alert('We could not mark your messages as read. Please try again.')}
  activeFilter='all';await refresh();
}
async function refresh(){
  if(busy)return;busy=true;
  try{if(!await load())return;mountHelp()}
  catch(err){
    console.error('Student Communication Centre failed:',err);
    const anchor=document.getElementById('announcementsSection');if(!anchor)return;
    let comm=document.getElementById('studentCommunicationHelpCentre');if(!comm){comm=document.createElement('section');comm.id='studentCommunicationHelpCentre';comm.className='sccWrap';anchor.insertAdjacentElement('afterend',comm)}
    comm.innerHTML=`<div class="sccCard"><div class="sccK">STUDENT COMMUNICATION</div><h2>Communication Centre</h2><div class="sccEmpty">${esc(err.message||'Your messages could not be loaded. Please refresh the page.')}</div></div>`;
  }finally{busy=false}
}
async function init(){style();for(let i=0;i<30;i++){if(document.getElementById('announcementsSection'))break;await new Promise(r=>setTimeout(r,300))}await refresh()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,800));else setTimeout(init,800);
})();
