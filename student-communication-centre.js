(()=>{
'use strict';
if(!/dashboard\.html$/i.test(location.pathname)||window.__fundaStudentCommunicationCentre)return;
window.__fundaStudentCommunicationCentre=true;

let db,user,state={messages:[],receipts:[],faqs:[],departments:[],settings:null},busy=false;
let activeFilter='unread',activeCategory='all',searchTerm='',visibleLimit=12,openMessageId=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=v=>v?new Date(v).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'}):'';
function timeLabel(v){
  if(!v)return '';
  const d=new Date(v),now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate()),yesterday=new Date(today);yesterday.setDate(yesterday.getDate()-1);
  const dateOnly=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const time=d.toLocaleTimeString('en-ZA',{hour:'2-digit',minute:'2-digit'});
  if(dateOnly.getTime()===today.getTime())return 'Today, '+time;
  if(dateOnly.getTime()===yesterday.getTime())return 'Yesterday, '+time;
  return d.toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'})+' · '+time;
}
const important=m=>!!m.pinned||(['high','urgent','important','critical'].includes(String(m.priority||'').toLowerCase()));
const preview=text=>{const s=String(text||'').replace(/\s+/g,' ').trim();return s.length>130?s.slice(0,127)+'…':s};

const css=`
.sccWrap{margin-bottom:24px}.sccCard{background:#fff;border:1px solid #d9e4f2;border-radius:24px;padding:22px;box-shadow:0 10px 28px rgba(34,72,119,.07)}
.sccHero{position:relative;overflow:hidden;background:linear-gradient(135deg,#071d49,#0c377c 62%,#174b93);border-color:rgba(201,154,46,.5);color:#fff}.sccHero:after{content:"";position:absolute;width:310px;height:310px;border-radius:50%;right:-135px;top:-185px;background:rgba(255,255,255,.07)}.sccHero>*{position:relative;z-index:1}
.sccK{font-size:11px;letter-spacing:.16em;font-weight:900;color:#b58216;text-transform:uppercase}.sccHero .sccK{color:#e4c777}.sccCard h2{margin:5px 0 0;color:#071d49;font-size:25px}.sccHero h2{color:#fff!important}.sccIntro{font-size:15px;color:#263746;line-height:1.65;margin-top:8px;font-weight:650}.sccHero .sccIntro{color:#e9f2ff;max-width:820px}
.sccStats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.sccStat{width:100%;appearance:none;text-align:left;font-family:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:15px;padding:14px;cursor:pointer}.sccStat:hover,.sccStat.active{border-color:#e4c777;background:rgba(255,255,255,.17);box-shadow:0 0 0 2px rgba(228,199,119,.12)}.sccStat:focus-visible,.sccBtn:focus-visible,.sccInboxRow:focus-visible,.sccSearch:focus-visible,.sccSelect:focus-visible{outline:3px solid #d4aa42;outline-offset:3px}.sccStat b{display:block;color:#fff;font-size:24px}.sccStat span{display:block;margin-top:3px;font-size:12px;color:#e8f1ff;font-weight:800}
.sccToolbar{display:grid;grid-template-columns:minmax(0,1fr) 210px;gap:10px;margin-top:18px}.sccSearch,.sccSelect{width:100%;border:1px solid #cbd8e5;border-radius:12px;background:#fff;color:#17324a;padding:11px 12px;font:700 13px "Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.sccSearch::placeholder{color:#7c8995;font-weight:600}
.sccImportant{margin-top:18px}.sccSectionHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.sccSectionHead h3{margin:0;color:#071d49;font-size:18px}.sccSectionHead p{margin:4px 0 0;color:#52657a;font-size:12px;line-height:1.5;font-weight:650}.sccImportantList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:11px}.sccImportantCard{appearance:none;width:100%;text-align:left;border:1px solid #e1c774;border-left:5px solid #c99a2e;border-radius:14px;background:linear-gradient(135deg,#fff8e5,#fff);padding:13px;cursor:pointer}.sccImportantCard strong{display:block;color:#071d49;font-size:13px}.sccImportantCard span{display:block;margin-top:5px;color:#566778;font-size:10px;font-weight:700}.sccImportantCard em{display:inline-flex;margin-top:7px;padding:4px 7px;border-radius:999px;background:#071d49;color:#fff;font-size:8px;font-style:normal;font-weight:900}
.sccInbox{margin-top:20px;padding-top:19px;border-top:1px solid #dbe3ea}.sccInboxHead{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.sccInboxHead h3{margin:0;color:#071d49;font-size:19px}.sccInboxHead p{margin:5px 0 0;color:#263746;font-size:13px;line-height:1.55;font-weight:600}.sccInboxCount{margin-top:12px;color:#33475a;font-size:12px;font-weight:800}
.sccInboxList{margin-top:8px;border:1px solid #dfe7ef;border-radius:16px;overflow:hidden}.sccInboxRow{appearance:none;width:100%;display:grid;grid-template-columns:12px minmax(0,1fr) 145px;gap:12px;align-items:center;text-align:left;padding:14px 15px;border:0;border-bottom:1px solid #e6ecf2;background:#fff;cursor:pointer;font-family:"Source Sans 3","Segoe UI",Roboto,Helvetica,Arial,sans-serif}.sccInboxRow:last-child{border-bottom:0}.sccInboxRow:hover{background:#fbfdff}.sccInboxRow.unread{background:#fffdf7}.sccInboxRow.unread .sccRowTitle{font-weight:900}.sccInboxRow.open{background:#f3f7fc}.sccRowDot{width:9px;height:9px;border-radius:50%;background:#c8d2dc}.sccInboxRow.unread .sccRowDot{background:#c99a2e;box-shadow:0 0 0 3px #fff3ca}.sccRowTitle{color:#071d49;font-size:14px;font-weight:800}.sccRowPreview{margin-top:3px;color:#52657a;font-size:11px;line-height:1.4;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sccRowMeta{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.sccTag{display:inline-flex;padding:4px 7px;border-radius:999px;background:#edf3fa;color:#31506e;font-size:8px;font-weight:900;text-transform:uppercase}.sccTag.important{background:#fff0c9;color:#694a08}.sccRowTime{text-align:right;color:#607080;font-size:10px;font-weight:800}.sccRowTime b{display:block;margin-top:6px;color:#8a5f09;font-size:8px}
.sccMessageDetail{margin-top:11px;border:1px solid #cbd8e5;border-radius:16px;background:#fff;overflow:hidden}.sccDetailHead{display:flex;justify-content:space-between;gap:14px;padding:17px 18px;background:linear-gradient(145deg,#f8fbff,#fff)}.sccDetailHead h3{margin:0;color:#071d49;font-size:18px}.sccMeta{margin-top:5px;font-size:11px;color:#52657a;font-weight:750}.sccDetailBody{padding:18px;color:#202d39;font-size:15px;line-height:1.72;white-space:pre-line}.sccDetailActions{display:flex;gap:8px;flex-wrap:wrap;padding:0 18px 18px}.sccUnread,.sccRead,.sccNotice{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:9px;font-weight:900}.sccUnread{background:#fff0c9;color:#694a08}.sccRead{background:#e2f4eb;color:#155f3f}.sccNotice{background:#e8eef8;color:#17324a}
.sccEmpty{margin-top:12px;padding:18px;border:1px dashed #b9c8d8;border-radius:15px;background:#f8fbff;color:#17324a;font-size:14px;font-weight:800}.sccMore{display:flex;justify-content:center;margin-top:12px}
.sccSafety{margin-top:20px;background:linear-gradient(135deg,#fff5da,#fff);border:1px solid #e6cd84;border-radius:16px;padding:16px}.sccSafety b{font-size:13px;color:#694a08}.sccSafety p{font-size:14px;line-height:1.6;color:#202d39;margin:7px 0 0}
.sccFaqs{display:grid;gap:9px;margin-top:16px}.sccFaq{border:1px solid #dfe7ef;border-radius:14px;background:#fbfdff;padding:14px}.sccFaq summary{cursor:pointer;color:#071d49;font-size:15px;font-weight:900}.sccFaq p{font-size:15px;color:#263746;line-height:1.65;margin:10px 0 0}.sccDept{border:1px solid #dfe7ef;border-radius:14px;padding:15px;background:#fff;margin-top:9px}.sccDept h3{font-size:16px;color:#071d49;margin:0}.sccDept p{font-size:14px;line-height:1.6;color:#263746;margin:6px 0}.sccContact{font-size:13px;color:#263746;word-break:break-word;font-weight:700}.sccActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.sccBtn{border:0;border-radius:10px;background:#071d49;color:#fff;padding:10px 13px;font-size:12px;font-weight:900;cursor:pointer;text-decoration:none}.sccBtn.alt{background:#fff;color:#071d49;border:1px solid #aebfd1}.sccBtn:disabled{opacity:.62;cursor:wait}
@media(max-width:800px){.sccImportantList{grid-template-columns:1fr}.sccToolbar{grid-template-columns:1fr}.sccInboxRow{grid-template-columns:12px minmax(0,1fr)}.sccRowTime{grid-column:2;text-align:left}.sccDetailHead{display:block}.sccDetailHead>div:last-child{margin-top:8px}}
@media(max-width:520px){.sccStats{gap:7px}.sccStat{padding:11px 9px}.sccStat b{font-size:21px}.sccStat span{font-size:10px}.sccCard{padding:17px}.sccInboxRow{padding:12px 10px}.sccRowPreview{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}}
`;

function style(){if(document.getElementById('sccStyle'))return;const s=document.createElement('style');s.id='sccStyle';s.textContent=css;document.head.appendChild(s)}

async function load(){
  db=db||window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);if(!db)return false;
  const ses=await db.auth.getSession();user=ses.data.session?.user;if(!user)return false;
  const [m,r,f,d,c]=await Promise.all([
    db.from('communications').select('*').eq('published',true).order('pinned',{ascending:false}).order('published_at',{ascending:false}).limit(60),
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
  return {
    unread:visibleReceipts.filter(r=>!r.read_at).length,
    read:visibleReceipts.filter(r=>r.read_at).length,
    important:state.messages.filter(important).length,
    total:state.messages.length
  };
}
function categories(){
  return [...new Set(state.messages.map(m=>String(m.category||'General').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function filteredMessages(){
  const rm=receiptMap(),q=searchTerm.trim().toLowerCase();
  return state.messages.filter(m=>{
    const rec=rm.get(m.id),read=!!rec?.read_at;
    if(activeFilter==='unread'&&(!rec||read))return false;
    if(activeFilter==='important'&&!important(m))return false;
    if(activeFilter==='read'&&(!rec||!read))return false;
    if(activeCategory!=='all'&&String(m.category||'General')!==activeCategory)return false;
    if(q&&!String((m.title||'')+' '+(m.body||'')+' '+(m.category||'')).toLowerCase().includes(q))return false;
    return true;
  });
}
function badgeFor(m,rec){
  if(!rec)return '<span class="sccNotice">ACADEMY NOTICE</span>';
  return rec.read_at?'<span class="sccRead">READ</span>':'<span class="sccUnread">NEW / UNREAD</span>';
}
function inboxRow(m,rm){
  const rec=rm.get(m.id),unread=!!rec&&!rec.read_at,open=String(openMessageId)===String(m.id);
  return `<button type="button" class="sccInboxRow ${unread?'unread ':''}${open?'open':''}" data-open-message="${esc(m.id)}" aria-expanded="${open?'true':'false'}"><span class="sccRowDot" aria-hidden="true"></span><span><span class="sccRowTitle">${m.pinned?'📌 ':''}${esc(m.title)}</span><span class="sccRowPreview">${esc(preview(m.body))}</span><span class="sccRowMeta"><span class="sccTag">${esc(m.category||'General')}</span>${important(m)?'<span class="sccTag important">Important</span>':''}</span></span><span class="sccRowTime">${esc(timeLabel(m.published_at||m.created_at))}${unread?'<b>UNREAD</b>':''}</span></button>`;
}
function detailHtml(m,rm){
  const rec=rm.get(m.id),read=!!rec?.read_at;
  return `<article class="sccMessageDetail" id="sccMessageDetail"><div class="sccDetailHead"><div><h3>${m.pinned?'📌 ':''}${esc(m.title)}</h3><div class="sccMeta">${esc(m.category||'General')} · Published ${esc(timeLabel(m.published_at||m.created_at))}${m.priority&&m.priority!=='normal'?' · '+esc(String(m.priority).toUpperCase()):''}${read?' · Read '+esc(fmt(rec.read_at)):''}</div></div><div>${badgeFor(m,rec)}</div></div><div class="sccDetailBody">${esc(m.body)}</div><div class="sccDetailActions">${rec&&!read?`<button type="button" class="sccBtn alt" data-mark-read="${esc(m.id)}">Mark as Read</button>`:''}<button type="button" class="sccBtn alt" id="sccCloseMessage">Close Message</button></div></article>`;
}

function renderImportant(){
  const box=document.getElementById('sccImportantList'),section=document.getElementById('sccImportantSection');if(!box||!section)return;
  const rows=state.messages.filter(important).slice(0,4);
  section.style.display=rows.length?'block':'none';
  box.innerHTML=rows.map(m=>`<button type="button" class="sccImportantCard" data-open-message="${esc(m.id)}"><strong>${m.pinned?'📌 ':''}${esc(m.title)}</strong><span>${esc(preview(m.body))}</span><em>${esc(m.category||'Important')}</em></button>`).join('');
  box.querySelectorAll('[data-open-message]').forEach(b=>b.onclick=()=>openMessage(b.dataset.openMessage));
}

function renderInbox(){
  const box=document.getElementById('sccCommunicationMessages');if(!box)return;
  const rm=receiptMap(),all=filteredMessages(),shown=all.slice(0,visibleLimit);
  const empty=searchTerm?'No messages match your search.':activeFilter==='unread'?'You have no unread messages.':activeFilter==='important'?'No important messages are currently published.':activeFilter==='read'?'You have not marked any messages as read yet.':'No Academy messages have been published for you yet.';
  let html=shown.length?shown.map(m=>inboxRow(m,rm)).join(''):`<div class="sccEmpty">${empty}</div>`;
  if(openMessageId){
    const selected=state.messages.find(m=>String(m.id)===String(openMessageId));
    if(selected&&all.some(m=>String(m.id)===String(selected.id)))html+=detailHtml(selected,rm);
  }
  box.innerHTML=html;
  const count=document.getElementById('sccInboxCount');if(count)count.textContent=`Showing ${Math.min(shown.length,all.length)} of ${all.length} matching message${all.length===1?'':'s'}`;
  const more=document.getElementById('sccViewOlder');if(more){more.style.display=all.length>visibleLimit?'inline-flex':'none';more.textContent='View older messages'}
  document.querySelectorAll('#studentCommunicationHelpCentre [data-scc-filter]').forEach(button=>{
    const selected=button.dataset.sccFilter===activeFilter;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
  });
  box.querySelectorAll('[data-open-message]').forEach(b=>b.onclick=()=>openMessage(b.dataset.openMessage));
  box.querySelectorAll('[data-mark-read]').forEach(b=>b.onclick=()=>markRead(b.dataset.markRead));
  const close=document.getElementById('sccCloseMessage');if(close)close.onclick=()=>{openMessageId=null;renderInbox()};
}
async function openMessage(id){
  openMessageId=id;
  const rec=state.receipts.find(r=>String(r.communication_id)===String(id));
  if(rec&&!rec.read_at){
    const q=await db.from('communication_recipients').update({read_at:new Date().toISOString()}).eq('communication_id',id).eq('student_id',user.id).is('read_at',null).select('communication_id,read_at');
    if(!q.error){
      const updated=q.data?.[0];if(updated)rec.read_at=updated.read_at;
      updateStats();
    }
  }
  renderInbox();
  setTimeout(()=>document.getElementById('sccMessageDetail')?.scrollIntoView({behavior:'smooth',block:'nearest'}),40);
}
function updateStats(){
  const counts=receiptStats();
  const unread=document.getElementById('sccUnreadCount'),imp=document.getElementById('sccImportantCount'),total=document.getElementById('sccAllCount');
  if(unread)unread.textContent=counts.unread;if(imp)imp.textContent=counts.important;if(total)total.textContent=counts.total;
  const markAll=document.getElementById('sccMarkAllRead');if(markAll)markAll.style.display=counts.unread?'inline-flex':'none';
}
function safetyFaq(){return state.faqs.find(f=>/security|scam|phish/i.test(`${f.category||''} ${f.question||''}`))}
function officialActions(){
  const s=state.settings||{},a=[];
  if(s.general_email)a.push(`<a class="sccBtn alt" href="mailto:${encodeURIComponent(s.general_email)}">Email Academy</a>`);
  if(s.whatsapp||s.general_phone){const n=String(s.whatsapp||s.general_phone).replace(/\D/g,'');if(n)a.push(`<a class="sccBtn" target="_blank" rel="noopener" href="https://wa.me/${encodeURIComponent(n)}">WhatsApp Support</a>`)}
  return a.join('');
}

function mountHelp(){
  const anchor=document.getElementById('announcementsSection');if(!anchor)return;
  const counts=receiptStats(),safe=safetyFaq(),cats=categories();

  document.getElementById('studentCommunicationHelpCentre')?.remove();
  document.getElementById('studentFaqSection')?.remove();
  document.getElementById('studentAcademicSupportSection')?.remove();

  const comm=document.createElement('section');
  comm.id='studentCommunicationHelpCentre';comm.className='sccWrap';
  comm.innerHTML=`
    <div class="sccCard sccHero">
      <div class="sccK">STUDENT COMMUNICATION</div>
      <h2>Communication Centre</h2>
      <div class="sccIntro">Your official Academy inbox. Review important notices, course updates and messages connected to your learner account.</div>
      <div class="sccStats" aria-label="Message filters">
        <button type="button" class="sccStat" data-scc-filter="unread"><b id="sccUnreadCount">${counts.unread}</b><span>Unread</span></button>
        <button type="button" class="sccStat" data-scc-filter="important"><b id="sccImportantCount">${counts.important}</b><span>Important</span></button>
        <button type="button" class="sccStat" data-scc-filter="all"><b id="sccAllCount">${counts.total}</b><span>All Messages</span></button>
      </div>
    </div>
    <div class="sccCard" style="margin-top:14px">
      <div class="sccToolbar">
        <input id="sccSearch" class="sccSearch" type="search" placeholder="Search messages by title, category or words…" aria-label="Search messages">
        <select id="sccCategory" class="sccSelect" aria-label="Filter messages by category"><option value="all">All categories</option>${cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
      </div>
      <section class="sccImportant" id="sccImportantSection">
        <div class="sccSectionHead"><div><h3>Important / Pinned Messages</h3><p>Priority Academy communications stay easy to find here.</p></div></div>
        <div id="sccImportantList" class="sccImportantList"></div>
      </section>
      <div class="sccInbox">
        <div class="sccInboxHead"><div><h3>Your Inbox</h3><p>Select a message to open it. Unread learner-specific messages are marked as read when opened.</p></div><button type="button" class="sccBtn" id="sccMarkAllRead" style="${counts.unread?'':'display:none'}">Mark All as Read</button></div>
        <div id="sccInboxCount" class="sccInboxCount" aria-live="polite"></div>
        <div id="sccCommunicationMessages" class="sccInboxList"></div>
        <div class="sccMore"><button type="button" class="sccBtn alt" id="sccViewOlder">View older messages</button></div>
      </div>
      ${safe?`<div class="sccSafety"><b>🛡️ STAY SAFE</b><p><strong>${esc(safe.question)}</strong><br>${esc(safe.answer)}</p></div>`:''}
    </div>`;
  anchor.insertAdjacentElement('afterend',comm);

  comm.querySelectorAll('[data-scc-filter]').forEach(button=>button.onclick=()=>{activeFilter=button.dataset.sccFilter;visibleLimit=12;openMessageId=null;renderInbox()});
  document.getElementById('sccMarkAllRead').onclick=markAllRead;
  document.getElementById('sccSearch').oninput=e=>{searchTerm=e.target.value||'';visibleLimit=12;openMessageId=null;renderInbox()};
  document.getElementById('sccCategory').onchange=e=>{activeCategory=e.target.value||'all';visibleLimit=12;openMessageId=null;renderInbox()};
  document.getElementById('sccViewOlder').onclick=()=>{visibleLimit+=12;renderInbox()};
  renderImportant();renderInbox();

  const faq=document.createElement('section');
  faq.id='studentFaqSection';faq.className='sccWrap';
  faq.innerHTML=`<div class="sccCard"><div class="sccK">FREQUENTLY ASKED QUESTIONS</div><h2>Student FAQs</h2><div class="sccIntro">Quick answers to common questions about enrolment, payments, learning, assessments, certificates and platform use.</div><div class="sccFaqs">${state.faqs.map(f=>`<details class="sccFaq"><summary>${esc(f.question)}</summary><p>${esc(f.answer)}</p></details>`).join('')||'<div class="sccIntro">No FAQs are currently published.</div>'}</div></div>`;
  comm.insertAdjacentElement('afterend',faq);

  const support=document.createElement('section');
  support.id='studentAcademicSupportSection';support.className='sccWrap';
  support.innerHTML=`<div class="sccCard"><div class="sccK">KNOW WHO TO CONTACT</div><h2>Academic & Student Support Directory</h2><div class="sccIntro">Choose the department that matches your query. Each department explains what it handles, when to contact it, what information to include and the official contact details.</div><div class="sccActions">${officialActions()}</div>${state.departments.map(d=>`<article class="sccDept"><h3>${esc(d.department_name)}</h3><p>${esc(d.description)}</p><p><b>Department tasks / contact this team for:</b> ${esc(d.when_to_contact)}</p><p><b>Suggested subject / information to include:</b> ${esc(d.what_to_include)}</p><div class="sccContact">${esc(d.contact_email||'')}${d.contact_phone?' · '+esc(d.contact_phone):''}</div></article>`).join('')||'<div class="sccIntro">Support department information is not available yet.</div>'}</div>`;
  faq.insertAdjacentElement('afterend',support);
}

async function markRead(id){
  const rec=state.receipts.find(r=>String(r.communication_id)===String(id));if(!rec||rec.read_at)return;
  const q=await db.from('communication_recipients').update({read_at:new Date().toISOString()}).eq('communication_id',id).eq('student_id',user.id).is('read_at',null).select('communication_id,read_at');
  if(q.error){console.error('Message status update failed.',q.error);return alert('We could not mark this message as read. Please try again.')}
  if(q.data?.[0])rec.read_at=q.data[0].read_at;updateStats();renderInbox();
}
async function markAllRead(){
  const visibleIds=new Set(state.messages.map(m=>m.id));
  const ids=state.receipts.filter(r=>visibleIds.has(r.communication_id)&&!r.read_at).map(r=>r.communication_id);if(!ids.length)return;
  const button=document.getElementById('sccMarkAllRead');if(button){button.disabled=true;button.textContent='Updating…'}
  const q=await db.from('communication_recipients').update({read_at:new Date().toISOString()}).eq('student_id',user.id).in('communication_id',ids).is('read_at',null).select('communication_id,read_at');
  if(q.error){console.error('Message status update failed.',q.error);if(button){button.disabled=false;button.textContent='Mark All as Read'}return alert('We could not mark your messages as read. Please try again.')}
  const stamp=new Date().toISOString();state.receipts.forEach(r=>{if(ids.includes(r.communication_id)&&!r.read_at)r.read_at=stamp});
  activeFilter='all';openMessageId=null;updateStats();renderInbox();
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