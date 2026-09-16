(()=>{
'use strict';
if(!/ambassador-portal-v2\.html$/i.test(location.pathname)||window.__fundaAmbassadorPortalAuditFixes)return;
window.__fundaAmbassadorPortalAuditFixes=true;

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const pretty=v=>String(v||'').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const fmt=v=>v?new Date(v).toLocaleString('en-ZA',{dateStyle:'medium',timeStyle:'short'}):'—';
let db=null,statusRow=null,tickets=[],messages=[];

const banks=[
 {name:'Absa Bank',code:'632005'},
 {name:'Access Bank South Africa',code:''},
 {name:'African Bank',code:'430000'},
 {name:'Albaraka Bank',code:''},
 {name:'Bidvest Bank',code:'462005'},
 {name:'Capitec Bank',code:'470010'},
 {name:'Capitec Business',code:'450105'},
 {name:'Discovery Bank',code:'679000'},
 {name:'First National Bank (FNB)',code:'250655'},
 {name:'Investec Bank',code:'580105'},
 {name:'Nedbank',code:'198765'},
 {name:'OM Bank',code:''},
 {name:'Rand Merchant Bank (RMB)',code:'250655'},
 {name:'Sasfin Bank',code:''},
 {name:'Standard Bank',code:'051001'},
 {name:'TymeBank / GoTyme Bank',code:'678910'},
 {name:'Bank Zero',code:'888000'},
 {name:'Finbond Mutual Bank',code:''},
 {name:'GBS Mutual Bank',code:''},
 {name:'KSK Co-operative Bank',code:''},
 {name:'OSK Co-operative Bank',code:''},
 {name:'Ziphakamise Co-operative Bank',code:''},
 {name:'GIG Co-operative Bank',code:''},
 {name:'Bank of China — Johannesburg Branch',code:''},
 {name:'Bank of Taiwan — South Africa Branch',code:''},
 {name:'BNP Paribas South Africa Branch',code:''},
 {name:'Bank of Communications South Africa Branch',code:''},
 {name:'China Construction Bank — Johannesburg Branch',code:''},
 {name:'Citibank N.A. South Africa',code:''},
 {name:'Deutsche Bank South Africa Branch',code:''},
 {name:'Goldman Sachs South Africa Branch',code:''},
 {name:'HSBC South Africa Branch',code:''},
 {name:'JPMorgan Chase Bank — Johannesburg Branch',code:''},
 {name:'Standard Chartered Bank South Africa Branch',code:''},
 {name:'State Bank of India South Africa Branch',code:''},
 {name:'South African Postbank',code:''},
 {name:'Land Bank',code:''},
 {name:'Other South African Bank',code:''}
];

function client(){
 if(!db&&window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
  db=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 }
 return db;
}

function installStyle(){
 if($('#ambAuditFixStyle'))return;
 const s=document.createElement('style');s.id='ambAuditFixStyle';s.textContent=`
 body.amb-status-only .side,body.amb-status-only #sideOverlay,body.amb-status-only #sideToggle,body.amb-status-only #profileTop{display:none!important}
 body.amb-status-only .shell{padding-left:18px!important;display:block!important;max-width:1100px!important;margin:0 auto!important}
 body.amb-status-only .content{max-width:100%!important;padding-top:22px!important}
 body.amb-status-only .portalFooter{margin-left:0!important}
 .aso{background:#fff;border:1px solid #dfe4e8;border-radius:18px;padding:22px;box-shadow:0 8px 24px #21384d0b}.aso+.aso{margin-top:14px}
 .asoKicker{font-size:10px;font-weight:900;letter-spacing:.14em;color:#9a721b}.aso h2{margin:6px 0;color:#17324a;font-size:24px}.asoLead{color:#526476;font-size:14px;line-height:1.65}.asoBadge{display:inline-flex;padding:6px 9px;border-radius:99px;font-size:10px;font-weight:900;background:#fff2d2;color:#80580a}.asoBadge.declined{background:#ffe7e7;color:#922727}.asoActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:15px}.asoBtn{border:0;border-radius:9px;padding:10px 13px;background:#173f62;color:#fff;font-weight:900;font-size:12px;cursor:pointer;text-decoration:none}.asoBtn.alt{background:#fff;color:#173f62;border:1px solid #cfd9e0}.asoGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.asoField{display:grid;gap:6px;font-size:12px;font-weight:900;color:#17324a}.asoField.wide{grid-column:1/-1}.asoField input,.asoField select,.asoField textarea{width:100%;border:1px solid #cfd9e0;border-radius:9px;padding:10px;font:inherit;font-weight:600;background:#fff}.asoField textarea{min-height:90px;resize:vertical}.asoMsg{font-size:12px;line-height:1.55;margin-top:9px}.asoMsg.ok{color:#176b50}.asoMsg.bad{color:#922727}.asoTickets{display:grid;gap:10px;margin-top:14px}.asoTicket{border:1px solid #dfe5e9;border-radius:12px;padding:13px;background:#fbfcfd}.asoTicketTop{display:flex;justify-content:space-between;gap:10px}.asoTicket h3{margin:0;color:#17324a;font-size:14px}.asoMeta{font-size:11px;color:#6a7885;margin-top:5px}.asoText{font-size:12px;color:#334756;line-height:1.6;margin-top:9px}.asoReply{margin-top:9px;padding:10px;border-left:3px solid #d1a73e;background:#fffaf0;border-radius:0 9px 9px 0;font-size:12px;line-height:1.55}.asoReply b{display:block;color:#17324a;font-size:10px;margin-bottom:3px}.asoReplyBox{display:flex;gap:7px;margin-top:10px}.asoReplyBox input{flex:1;border:1px solid #cfd9e0;border-radius:8px;padding:9px;font-size:12px}
 @media(max-width:700px){body.amb-status-only .shell{padding:12px!important}.asoGrid{grid-template-columns:1fr}.asoField.wide{grid-column:auto}.aso h2{font-size:21px}.asoReplyBox{display:grid}}
 `;document.head.appendChild(s);
}

function installBanks(){
 const s=$('#bankName'),branch=$('#branchCode'),help=$('#branchHelp'),otherName=$('#otherBankName');
 if(!s||!branch)return false;
 const current=s.value;
 const currentNames=new Set([...s.options].map(o=>o.value));
 if(s.options.length<bankCountExpected()||!currentNames.has('Access Bank South Africa')||!currentNames.has('OM Bank')){
  s.innerHTML='<option value="">Select bank</option>'+banks.map(x=>'<option value="'+esc(x.name)+'" data-code="'+esc(x.code)+'">'+esc(x.name)+'</option>').join('');
  if(current&&[...s.options].some(o=>o.value===current))s.value=current;
 }
 const apply=()=>{
  const o=s.selectedOptions?.[0],code=o?.dataset?.code||'',other=s.value==='Other South African Bank';
  if(otherName){otherName.classList.toggle('hide',!other);otherName.required=other;if(!other)otherName.value=''}
  if(code){branch.value=code;branch.readOnly=true;if(help)help.textContent='Universal branch code for '+s.value+': '+code;}
  else if(s.value){branch.readOnly=false;if(other){if(help)help.textContent='Enter the bank name and branch code exactly as shown on the bank statement or banking app.';}else if(help)help.textContent='Enter the branch code exactly as shown on the bank statement or banking app for '+s.value+'.';}
  else{branch.value='';branch.readOnly=true;if(help)help.textContent='Select a bank to continue.';}
 };
 if(!s.dataset.auditBanksBound){s.dataset.auditBanksBound='1';s.addEventListener('change',()=>setTimeout(apply,0));}
 setTimeout(apply,0);
 return true;
}
function bankCountExpected(){return banks.length+1}

function statusCopy(status){
 const s=String(status||'pending').toLowerCase();
 if(s==='declined')return {title:'Ambassador application declined',lead:'Your application was not approved. Your Ambassador operational tools and referral link remain locked. You can use the support area below if you need clarification about the decision.'};
 if(s==='waitlisted')return {title:'Ambassador application waitlisted',lead:'Your application remains on the Ambassador waitlist. You can return to this page at any time to refresh your status or contact Ambassador Support below.'};
 if(s==='under_review')return {title:'Ambassador application under review',lead:'Funda Online Academy is actively reviewing your application. Operational Ambassador tools and the referral link remain locked until approval and activation.'};
 return {title:'Ambassador application received',lead:'Your application has been received and is awaiting Academy review. Operational Ambassador tools and the referral link remain locked until approval and activation.'};
}

async function loadSupport(){
 if(!statusRow?.application_id)return;
 const c=client();
 const t=await c.from('ambassador_support_tickets').select('id,application_id,subject,category,priority,notes,status,created_at,updated_at').eq('application_id',statusRow.application_id).order('created_at',{ascending:false});
 if(t.error)throw t.error;tickets=t.data||[];
 const ids=tickets.map(x=>x.id);messages=[];
 if(ids.length){const m=await c.from('ambassador_support_messages').select('id,ticket_id,author_id,author_role,message,created_at').in('ticket_id',ids).order('created_at',{ascending:true});if(m.error)throw m.error;messages=m.data||[];}
}

function ticketMarkup(t){
 const ms=messages.filter(m=>m.ticket_id===t.id);
 const open=!['resolved','closed'].includes(String(t.status||'').toLowerCase());
 return '<article class="asoTicket"><div class="asoTicketTop"><h3>'+esc(t.subject)+'</h3><span class="asoBadge">'+esc(pretty(t.status))+'</span></div><div class="asoMeta">'+esc(t.category||'General')+' · '+fmt(t.created_at)+'</div><div class="asoText">'+esc(t.notes||'')+'</div>'+ms.map(m=>'<div class="asoReply"><b>'+esc(m.author_role==='ambassador'?'Your reply':'Funda Online Academy reply')+' · '+fmt(m.created_at)+'</b>'+esc(m.message)+'</div>').join('')+(open?'<div class="asoReplyBox"><input data-reply-input="'+t.id+'" placeholder="Reply to this support ticket"><button class="asoBtn alt" data-reply-ticket="'+t.id+'">Send Reply</button></div>':'')+'</article>';
}

function renderStatus(){
 installStyle();document.body.classList.add('amb-status-only');
 const nf=$('#notFound');if(!nf)return;
 $('#loading')?.classList.add('hide');$('#portal')?.classList.add('hide');nf.classList.remove('hide');
 const copy=statusCopy(statusRow.status);
 nf.innerHTML='<section class="aso"><div class="asoKicker">AMBASSADOR APPLICATION STATUS</div><h2>'+esc(copy.title)+'</h2><span class="asoBadge '+(statusRow.status==='declined'?'declined':'')+'">'+esc(pretty(statusRow.status))+'</span><p class="asoLead">'+esc(copy.lead)+'</p><div class="asoActions"><button class="asoBtn" id="asoRefreshStatus">Refresh Status</button><a class="asoBtn alt" href="ambassadors.html">View Ambassador Programme</a><a class="asoBtn alt" href="index.html">Academy Website</a></div></section><section class="aso"><div class="asoKicker">AMBASSADOR SUPPORT</div><h2>Need help with your application?</h2><p class="asoLead">Applicants can contact Funda Online Academy from this status-only account without receiving access to referrals, earnings, banking, marketing resources or other operational Ambassador tools.</p><form id="asoSupportForm" class="asoGrid"><label class="asoField"><span>Category</span><select id="asoCategory"><option>Application Status</option><option>Login / Account</option><option>Agreement</option><option>General</option></select></label><label class="asoField"><span>Subject</span><input id="asoSubject" required maxlength="160" placeholder="Short description"></label><label class="asoField wide"><span>Message</span><textarea id="asoNotes" required maxlength="3000" placeholder="Explain what you need help with"></textarea></label><button class="asoBtn" id="asoSubmit" type="submit">Log Support Ticket</button></form><div id="asoMessage" class="asoMsg"></div><div id="asoTickets" class="asoTickets">'+(tickets.length?tickets.map(ticketMarkup).join(''):'<div class="asoLead">No support tickets logged yet.</div>')+'</div></section>';
 $('#asoRefreshStatus')?.addEventListener('click',async e=>{const b=e.currentTarget;b.disabled=true;b.textContent='Checking…';const q=await client().rpc('get_own_ambassador_login_status');const row=Array.isArray(q.data)?q.data[0]:q.data;if(!q.error&&row?.status==='approved')return location.reload();if(!q.error&&row){statusRow=row;await loadSupport().catch(()=>{});renderStatus();return}b.disabled=false;b.textContent='Refresh Status';});
 $('#asoSupportForm')?.addEventListener('submit',submitTicket);
 nf.querySelectorAll('[data-reply-ticket]').forEach(b=>b.addEventListener('click',replyTicket));
}

async function submitTicket(e){
 e.preventDefault();const b=$('#asoSubmit'),msg=$('#asoMessage');b.disabled=true;b.textContent='Submitting…';msg.className='asoMsg';msg.textContent='';
 const subject=$('#asoSubject').value.trim(),notes=$('#asoNotes').value.trim(),category=$('#asoCategory').value;
 if(subject.length<3||notes.length<10){msg.className='asoMsg bad';msg.textContent='Please provide a clear subject and message.';b.disabled=false;b.textContent='Log Support Ticket';return}
 const q=await client().from('ambassador_support_tickets').insert({application_id:statusRow.application_id,subject,category,priority:'normal',notes,status:'open'});
 if(q.error){msg.className='asoMsg bad';msg.textContent=q.error.message;b.disabled=false;b.textContent='Log Support Ticket';return}
 msg.className='asoMsg ok';msg.textContent='Support ticket logged successfully.';e.target.reset();await loadSupport();renderStatus();
}

async function replyTicket(e){
 const b=e.currentTarget,id=b.dataset.replyTicket,input=$('[data-reply-input="'+id+'"]'),text=input?.value.trim()||'';if(!text)return;
 b.disabled=true;b.textContent='Sending…';
 const user=await client().auth.getUser();const uid=user.data?.user?.id;if(!uid){b.disabled=false;b.textContent='Send Reply';return}
 const q=await client().from('ambassador_support_messages').insert({ticket_id:id,author_id:uid,author_role:'ambassador',message:text});
 if(q.error){alert(q.error.message);b.disabled=false;b.textContent='Send Reply';return}
 await loadSupport();renderStatus();
}

async function checkStatus(){
 try{
  const c=client();if(!c)return;
  const session=await c.auth.getSession();if(!session.data?.session?.user)return;
  const q=await c.rpc('get_own_ambassador_login_status');if(q.error)return;
  const row=Array.isArray(q.data)?q.data[0]:q.data;if(!row)return;
  statusRow=row;
  if(row.status==='approved'){document.body.classList.remove('amb-status-only');return}
  await loadSupport().catch(err=>console.warn('Applicant support could not load',err));
  renderStatus();
 }catch(err){console.warn('Ambassador status-only check failed',err)}
}

function boot(){
 installStyle();
 let bankTries=0;const bankTimer=setInterval(()=>{bankTries++;if(installBanks()||bankTries>20)clearInterval(bankTimer)},500);
 setTimeout(checkStatus,350);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();