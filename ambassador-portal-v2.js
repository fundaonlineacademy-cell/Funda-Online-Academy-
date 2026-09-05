(()=>{
'use strict';
const $=s=>document.querySelector(s), money=n=>'R'+Number(n||0).toLocaleString('en-ZA',{minimumFractionDigits:0,maximumFractionDigits:2}), low=v=>String(v||'').toLowerCase(), esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const ranks=[{n:'Ambassador',min:0,max:10000,pay:0},{n:'Bronze',min:10000,max:25000,pay:0},{n:'Silver',min:25000,max:50000,pay:0},{n:'Gold',min:50000,max:100000,pay:5000},{n:'Platinum',min:100000,max:250000,pay:8000},{n:'Diamond',min:250000,max:500000,pay:12000},{n:'Executive',min:500000,max:1000000,pay:18000},{n:'Elite',min:1000000,max:Infinity,pay:25000}];
const nav=[['dashboard','▦ Dashboard'],['referrals','◎ My Referrals'],['earnings','R Earnings'],['payouts','▤ Payouts'],['profile','♙ My Profile'],['programme','▧ Programme Rules'],['support','◉ Support & Marketing']];
let db,user,app,ledger=[],referrals=[],payouts=[],bank=null,resources=[],notifications=[],supportTickets=[],supportMessages=[];

function rank(rev){return [...ranks].reverse().find(r=>rev>=r.min)||ranks[0]}
function fmt(v){if(!v)return '—';try{return new Date(v).toLocaleDateString('en-ZA',{day:'2-digit',month:'short',year:'numeric'})}catch{return '—'}}
function badgeStatus(v){let s=low(v),cls=['active','approved','paid','verified','completed','introductory'].some(x=>s.includes(x))?'ok':['declined','rejected','failed','terminated','reversed','suspended'].some(x=>s.includes(x))?'bad':'warn';return '<span class="badge '+cls+'">'+esc(String(v||'pending').replaceAll('_',' ').toUpperCase())+'</span>'}
function showSection(name){document.querySelectorAll('.section').forEach(x=>x.classList.toggle('on',x.dataset.section===name));document.querySelectorAll('.navbtn').forEach(x=>x.classList.toggle('on',x.dataset.go===name));scrollTo(0,0)}
function installNav(){let html=nav.map(([k,t])=>'<button class="navbtn '+(k==='dashboard'?'on':'')+'" data-go="'+k+'">'+t+'</button>').join('');$('#sideNav').innerHTML=html;$('#mobileNav').innerHTML=html;document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>showSection(b.dataset.go));$('#profileTop').onclick=()=>showSection('profile')}
function fail(msg){$('#loading').classList.add('hide');$('#notFound').classList.remove('hide');if(msg)$('#notFound .muted').textContent=msg}
function sum(type,statuses){return ledger.filter(x=>(!type||x.earning_type===type)&&(!statuses||statuses.includes(x.earning_status))).reduce((s,x)=>s+Number(x.commission_amount||0),0)}
function referralLink(){if(!app?.referral_code)return '';return location.origin+'/auth.html?ref='+encodeURIComponent(app.referral_code)}
async function copy(text,btn){if(!text)return;try{await navigator.clipboard.writeText(text);let old=btn.textContent;btn.textContent='Copied ✓';setTimeout(()=>btn.textContent=old,1200)}catch{alert(text)}}

async function init(){
 installNav();
 db=window.supabase?.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true}});
 if(!db)return fail('The Ambassador Portal is temporarily unavailable.');
 let s=await db.auth.getSession();user=s.data.session?.user;
 if(!user)return location.replace('ambassador-login.html');
 let a=await db.from('ambassador_programme_applications').select('*').eq('email',user.email.toLowerCase()).maybeSingle();
 if(a.error||!a.data||a.data.status!=='approved'||a.data.agreement_status!=='accepted'||!['introductory','active'].includes(a.data.account_status)){await db.auth.signOut();return fail('This Ambassador account has not completed agreement acceptance and activation.')}
 app=a.data;
 const [l,r,p,b,m,n,t,sm]=await Promise.all([
   db.from('ambassador_earnings_ledger').select('*').eq('application_id',app.id).order('created_at',{ascending:false}),
   db.rpc('get_own_ambassador_referrals'),
   db.from('ambassador_payouts').select('*').eq('application_id',app.id).order('created_at',{ascending:false}),
   db.from('ambassador_payout_details').select('*').eq('application_id',app.id).maybeSingle(),
   db.from('ambassador_marketing_resources').select('*').eq('status','active').order('created_at',{ascending:false}),
   db.from('ambassador_notifications').select('*').eq('status','active').order('created_at',{ascending:false}),
   db.from('ambassador_support_tickets').select('*').eq('application_id',app.id).order('created_at',{ascending:false}),
   db.from('ambassador_support_messages').select('*').order('created_at',{ascending:true})
 ]);
 ledger=l.data||[];referrals=r.data||[];payouts=p.data||[];bank=b.data||null;resources=m.data||[];notifications=n.data||[];supportTickets=t.data||[];supportMessages=sm.data||[];
 $('#loading').classList.add('hide');$('#portal').classList.remove('hide');render();
}

function render(){
 const life=ledger.filter(x=>x.earning_type==='commission'&&x.earning_status!=='reversed').reduce((s,x)=>s+Number(x.qualifying_revenue||0),0);
 const approvedPaid=['approved','paid'], pendingHeld=['pending','held'];
 const total=sum(null,approvedPaid), pending=sum(null,pendingHeld), commission=sum('commission',approvedPaid), bonus=sum('achievement_bonus',approvedPaid), performance=sum('monthly_performance',approvedPaid);
 const r=rank(life),idx=ranks.indexOf(r),next=ranks[idx+1];
 $('#welcome').textContent='Welcome, '+(app.full_name||'Ambassador');
 $('#rankLabel').textContent=r.n.toUpperCase()+' AMBASSADOR';
 $('#accountLine').textContent='Ambassador ID: '+String(app.id).slice(0,8).toUpperCase()+' · Agreement: '+String(app.agreement_status||'not accepted').replaceAll('_',' ');
 $('#accountBadge').textContent=String(app.account_status||'application').replaceAll('_',' ').toUpperCase();
 $('#accountBadge').className='badge '+(['active','introductory'].includes(app.account_status)?'ok':'warn');
 $('#earningBadge').textContent=pending>0?'EARNINGS AWAITING ACTION':'EARNINGS UP TO DATE';
 $('#referralCount').textContent=referrals.length;$('#totalEarned').textContent=money(total);$('#pendingEarned').textContent=money(pending);
 $('#commissionTotal').textContent=money(commission);$('#bonusTotal').textContent=money(bonus);$('#performanceTotal').textContent=money(performance);
 $('#statusCommission').textContent=money(commission);$('#statusBonus').textContent=money(bonus);$('#statusPerformance').textContent=money(performance);
 $('#earnSummary').textContent=money(total)+' approved/paid · '+money(pending)+' pending/held · '+money(payouts.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.amount||0),0))+' paid out to date.';
 $('#codeText').textContent=app.referral_code||'Referral code pending activation';
 $('#referralLinkText').textContent=referralLink()||'Your referral link will appear once your code is issued.';
 $('#copyCode').disabled=!app.referral_code;$('#copyLink').disabled=!app.referral_code;
 $('#copyCode').onclick=()=>copy(app.referral_code,$('#copyCode'));$('#copyLink').onclick=()=>copy(referralLink(),$('#copyLink'));
 if(next){let remain=Math.max(0,next.min-life),pct=Math.max(0,Math.min(100,(life-r.min)/(next.min-r.min)*100));$('#nextRank').textContent='Current rank: '+r.n+'. '+money(remain)+' more lifetime qualifying revenue to reach '+next.n+'.';$('#progressBar').style.width=pct+'%'}else{$('#nextRank').textContent='Elite rank achieved.';$('#progressBar').style.width='100%'}
 $('#monthlyTarget').textContent=r.pay?'Monthly Performance Payment eligibility at this rank: up to '+money(r.pay)+', subject to monthly performance verification.':'Monthly Performance Payments begin at Gold / Level 4.';
 renderReferrals();renderLedger();renderPayouts();renderProfile();renderAgreement();renderSupportHub();
}

function renderReferrals(){
 $('#referralBody').innerHTML=referrals.length?referrals.map(x=>'<tr><td>'+esc(x.student_display)+'</td><td>'+esc(x.course_title)+'</td><td>'+fmt(x.referral_date)+'</td><td>'+badgeStatus(x.referral_status)+'</td><td>'+badgeStatus(x.earning_status)+'</td><td>'+money(x.earning_amount)+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">No referrals have been attributed to your code yet.</td></tr>';
}
function renderLedger(){
 $('#ledgerBody').innerHTML=ledger.length?ledger.map(x=>'<tr><td>'+fmt(x.earning_month)+'</td><td>'+esc(String(x.earning_type).replaceAll('_',' '))+'</td><td>'+money(x.qualifying_revenue)+'</td><td>'+(Number(x.commission_rate||0)*100).toFixed(x.earning_type==='commission'?0:0)+'%</td><td>'+money(x.commission_amount)+'</td><td>'+badgeStatus(x.earning_status)+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">No earnings have been recorded yet.</td></tr>';
}
function renderPayouts(){
 const paid=payouts.filter(x=>x.status==='paid').reduce((s,x)=>s+Number(x.amount||0),0),scheduled=payouts.filter(x=>['scheduled','processing'].includes(x.status)).reduce((s,x)=>s+Number(x.amount||0),0);
 $('#paidTotal').textContent=money(paid);$('#scheduledTotal').textContent=money(scheduled);
 $('#payoutBody').innerHTML=payouts.length?payouts.map(x=>'<tr><td>'+fmt(x.payment_date||x.created_at)+'</td><td>'+money(x.amount)+'</td><td>'+esc(x.payment_reference||'—')+'</td><td>'+badgeStatus(x.status)+'</td></tr>').join(''):'<tr><td colspan="4" class="empty">No payouts recorded yet.</td></tr>';
 if(bank){let tail=String(bank.account_number||'').slice(-4);$('#bankStatus').className='notice '+(bank.verification_status==='verified'?'ok':'gold');$('#bankStatus').textContent='Banking details '+String(bank.verification_status).replaceAll('_',' ')+' · '+bank.bank_name+' · Account ending •••• '+tail;$('#accountHolder').value=bank.account_holder||'';$('#bankName').value=bank.bank_name||'';$('#accountType').value=bank.account_type||'';$('#branchCode').value=bank.branch_code||'';$('#accountNumber').value=''}else{$('#bankStatus').className='notice gold';$('#bankStatus').textContent='No banking details on file. Add your payout account below.'}
 $('#bankForm').onsubmit=saveBank;
}
async function saveBank(e){
 e.preventDefault();let btn=$('#saveBank'),msg=$('#bankMsg'),num=$('#accountNumber').value.trim();
 if(bank&&!num){msg.textContent='For security, re-enter the full account number when updating banking details.';return}
 btn.disabled=true;btn.textContent='Saving securely…';msg.textContent='';
 let q=await db.rpc('submit_own_ambassador_payout_details',{p_account_holder:$('#accountHolder').value.trim(),p_bank_name:$('#bankName').value.trim(),p_account_number:num,p_account_type:$('#accountType').value,p_branch_code:$('#branchCode').value.trim()});
 if(q.error){msg.textContent=q.error.message}else{msg.textContent='Banking details saved. Finance verification is now pending.';let b=await db.from('ambassador_payout_details').select('*').eq('application_id',app.id).maybeSingle();bank=b.data||null;renderPayouts()}
 btn.disabled=false;btn.textContent='Save / Update Banking Details';
}
function renderProfile(){
 $('#profileName').value=app.full_name||'';$('#profileEmail').value=app.email||'';$('#profilePhone').value=app.phone||'';$('#profileProvince').value=app.province||'';$('#profileCountry').value=app.country||'South Africa';$('#profilePlatform').value=app.best_platform||'';
 $('#profileMeta').innerHTML='<b>Status:</b> '+esc(app.account_status||'application')+' · <b>Approved application:</b> '+fmt(app.updated_at)+' · <b>Referral code:</b> '+esc(app.referral_code||'pending');
 $('#profileForm').onsubmit=saveProfile;
}
async function saveProfile(e){
 e.preventDefault();let b=$('#saveProfile'),m=$('#profileMsg');b.disabled=true;b.textContent='Saving…';m.textContent='';
 let q=await db.rpc('update_own_ambassador_profile',{p_phone:$('#profilePhone').value.trim(),p_province:$('#profileProvince').value.trim(),p_country:$('#profileCountry').value.trim(),p_best_platform:$('#profilePlatform').value.trim()});
 if(q.error)m.textContent=q.error.message;else{m.textContent='Your Ambassador contact profile has been updated.';app.phone=$('#profilePhone').value.trim();app.province=$('#profileProvince').value.trim();app.country=$('#profileCountry').value.trim();app.best_platform=$('#profilePlatform').value.trim()}
 b.disabled=false;b.textContent='Update My Contact Profile';
}
function renderAgreement(){
 const a=$('#agreementAction');
 if(app.agreement_status==='accepted'){a.innerHTML='<div class="notice ok"><b>Agreement accepted ✓</b><br>Accepted on '+fmt(app.agreement_accepted_at)+'.</div>';return}
 a.innerHTML='<label class="row"><input id="acceptCheck" type="checkbox"> <span class="muted">I have read and accept the current Funda Brand Ambassador Programme rules.</span></label><button id="acceptAgreement" class="btn gold" style="margin-top:10px">Accept Agreement</button><div id="agreementMsg" class="muted"></div>';
 $('#acceptAgreement').onclick=acceptAgreement;
}
async function acceptAgreement(){
 let m=$('#agreementMsg');if(!$('#acceptCheck').checked){m.textContent='Please confirm that you have read and accept the agreement.';return}
 let b=$('#acceptAgreement');b.disabled=true;b.textContent='Recording acceptance…';let q=await db.rpc('accept_own_ambassador_agreement');
 if(q.error||q.data!==true){m.textContent=q.error?.message||'Agreement could not be accepted.';b.disabled=false;b.textContent='Accept Agreement';return}
 app.agreement_status='accepted';app.agreement_accepted_at=new Date().toISOString();renderAgreement();$('#accountLine').textContent='Ambassador ID: '+String(app.id).slice(0,8).toUpperCase()+' · Agreement: accepted';
}

function renderSupportHub(){
 const mr=$('#marketingResources'),nl=$('#notificationList'),tl=$('#supportTicketList');
 if(mr)mr.innerHTML=resources.length?resources.map(x=>'<div class="earning" style="margin-bottom:8px"><b style="font-size:14px">'+esc(x.title)+'</b><span>'+esc(String(x.resource_type||'resource').toUpperCase())+'</span><p class="muted">'+esc(x.description||'')+'</p>'+(x.action_url?'<a class="btn alt" href="'+esc(x.action_url)+'" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none">Open Resource</a>':'')+(x.file_url?'<a class="btn alt" href="'+esc(x.file_url)+'" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none;margin-left:6px">Open File</a>':'')+'</div>').join(''):'<div class="empty">No Ambassador marketing resources are published yet.</div>';
 if(nl)nl.innerHTML=notifications.length?notifications.map(x=>'<div class="earning" style="margin-bottom:8px"><b style="font-size:14px">'+esc(x.title)+'</b><span>'+esc(String(x.category||'programme').toUpperCase())+' · '+fmt(x.created_at)+'</span><p class="muted">'+esc(x.message)+'</p></div>').join(''):'<div class="empty">No new Ambassador notifications.</div>';
 if(tl)tl.innerHTML=supportTickets.length?supportTickets.map(t=>'<div class="earning" style="margin-bottom:8px"><b style="font-size:14px">'+esc(t.subject)+'</b><span>'+esc(t.category)+' · '+fmt(t.created_at)+' · '+esc(String(t.status).replaceAll('_',' ').toUpperCase())+'</span><p class="muted">'+esc(t.notes||'')+'</p><button class="btn alt" data-support-view="'+t.id+'">View / Reply</button></div>').join(''):'<div class="empty">No Ambassador support tickets yet.</div>';
 document.querySelectorAll('[data-support-view]').forEach(b=>b.onclick=()=>openSupportTicket(b.dataset.supportView));
 if($('#newSupportTicket'))$('#newSupportTicket').onclick=openNewSupportTicket;
}
function supportModal(html){document.getElementById('ambSupportModal')?.remove();document.body.insertAdjacentHTML('beforeend','<div id="ambSupportModal" style="position:fixed;inset:0;background:#07172fcc;z-index:9999;display:grid;place-items:center;padding:14px"><div class="card" style="width:min(680px,96vw);max-height:92vh;overflow:auto;margin:0">'+html+'</div></div>')}
function openNewSupportTicket(){
 supportModal('<div class="row" style="justify-content:space-between"><h2>Log Ambassador Support Ticket</h2><button class="btn alt" id="ambSupportClose">Close</button></div><form id="ambSupportForm" class="form"><select id="ambSupportCat" class="field"><option>Referral</option><option>Commission</option><option>Achievement Bonus</option><option>Monthly Performance Payment</option><option>Payout / Banking</option><option>Marketing</option><option>Account / Profile</option><option>General</option></select><select id="ambSupportPriority" class="field"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select><input id="ambSupportSubject" class="field wide" required placeholder="Subject"><textarea id="ambSupportNotes" class="field wide" required style="min-height:120px" placeholder="Explain your query"></textarea><button class="btn wide">Submit Ticket</button></form><div id="ambSupportMsg" class="muted"></div>');
 $('#ambSupportClose').onclick=()=>$('#ambSupportModal').remove();$('#ambSupportForm').onsubmit=submitSupportTicket;
}
async function submitSupportTicket(e){
 e.preventDefault();let q=await db.from('ambassador_support_tickets').insert({application_id:app.id,subject:$('#ambSupportSubject').value.trim(),category:$('#ambSupportCat').value,priority:$('#ambSupportPriority').value,notes:$('#ambSupportNotes').value.trim(),status:'open'}).select().single();
 if(q.error){$('#ambSupportMsg').textContent=q.error.message;return}
 $('#ambSupportModal').remove();let t=await db.from('ambassador_support_tickets').select('*').eq('application_id',app.id).order('created_at',{ascending:false});supportTickets=t.data||[];renderSupportHub();
}
function openSupportTicket(id){
 let t=supportTickets.find(x=>x.id===id);if(!t)return;let msgs=supportMessages.filter(x=>x.ticket_id===id),closed=['resolved','closed'].includes(t.status);
 supportModal('<div class="row" style="justify-content:space-between"><div><h2>'+esc(t.subject)+'</h2><p class="muted">'+esc(t.category)+' · '+fmt(t.created_at)+' · '+esc(t.status.replaceAll('_',' '))+'</p></div><button class="btn alt" id="ambSupportClose">Close</button></div><div class="notice">'+esc(t.notes)+'</div><div style="margin-top:12px">'+(msgs.length?msgs.map(m=>'<div class="earning" style="margin-bottom:8px"><span>'+(m.author_role==='ambassador'?'YOU':'FUNDA SUPPORT')+' · '+fmt(m.created_at)+'</span><p class="muted">'+esc(m.message)+'</p></div>').join(''):'<div class="empty">No replies yet.</div>')+'</div>'+(closed?'<div class="notice ok">This ticket is '+esc(t.status)+'.</div>':'<form id="ambSupportReplyForm" class="form"><textarea id="ambSupportReply" class="field wide" required style="min-height:90px" placeholder="Add a reply"></textarea><button class="btn wide">Send Reply</button></form>'));
 $('#ambSupportClose').onclick=()=>$('#ambSupportModal').remove();if(!closed)$('#ambSupportReplyForm').onsubmit=e=>replySupport(e,id);
}
async function replySupport(e,id){
 e.preventDefault();let text=$('#ambSupportReply').value.trim();if(!text)return;let q=await db.from('ambassador_support_messages').insert({ticket_id:id,author_id:user.id,author_role:'ambassador',message:text});if(q.error)return alert(q.error.message);let sm=await db.from('ambassador_support_messages').select('*').order('created_at',{ascending:true});supportMessages=sm.data||[];openSupportTicket(id);
}

$('#logout').onclick=async()=>{if(db)await db.auth.signOut();location.href='ambassador-login.html'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();