(()=>{
'use strict';
if(window.__fundaCeoAccountManagement)return;
window.__fundaCeoAccountManagement=true;

let client=null;
let accounts=[];
let actions=[];
let activeKind='student';
let searchTerm='';
const PAGE_SIZE=10;
const pages={student:1,staff:1,deleted:1,audit:1};

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const low=v=>String(v??'').trim().toLowerCase();
const fmt=v=>v?new Date(v).toLocaleString('en-ZA',{dateStyle:'medium',timeStyle:'short'}):'—';
const cap=v=>String(v||'').replace(/^./,x=>x.toUpperCase());

function installStyles(){
  if(document.getElementById('ceoAccountControlCss'))return;
  const s=document.createElement('style');
  s.id='ceoAccountControlCss';
  s.textContent=`
    .ceoAcctRoot{font-family:"Source Sans 3","Segoe UI",Arial,sans-serif;color:#10213f}
    .ceoAcctHero{padding:20px;border-radius:16px;background:linear-gradient(135deg,#03101f,#0b315c);color:#fff}
    .ceoAcctHero small{display:block;color:#d6b45c;font-size:12px;font-weight:900;letter-spacing:.13em}
    .ceoAcctHero h1{margin:5px 0 4px;font-size:24px;line-height:1.2}
    .ceoAcctHero p{margin:0;color:#dfe9f6;font-size:14px;line-height:1.55}
    .ceoAcctNotice{margin-top:12px;padding:12px 14px;border:1px solid #ead393;border-radius:12px;background:#fff8e4;color:#6f5315;font-size:13px;line-height:1.55}
    .ceoAcctToolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0}
    .ceoAcctTab,.ceoAcctBtn{border:0;border-radius:9px;padding:9px 12px;font:800 13px/1.2 "Source Sans 3","Segoe UI",Arial,sans-serif;cursor:pointer}
    .ceoAcctTab{background:#edf2f7;color:#17324a}.ceoAcctTab.on{background:#0b315c;color:#fff}
    .ceoAcctSearch{flex:1;min-width:230px;border:1px solid #d9e0e8;border-radius:9px;padding:9px 11px;font:400 14px/1.4 "Source Sans 3","Segoe UI",Arial,sans-serif;background:#fff;color:#10213f}
    .ceoAcctPanel{border:1px solid #e2e8f0;border-radius:14px;background:#fff;overflow:hidden}
    .ceoAcctTableWrap{overflow:auto}.ceoAcctTable{width:100%;border-collapse:collapse;font-size:13px;line-height:1.45}
    .ceoAcctTable th,.ceoAcctTable td{padding:11px;border-bottom:1px solid #edf1f5;text-align:left;vertical-align:top;white-space:nowrap}
    .ceoAcctTable th{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#68778b;background:#f8fafc}
    .ceoAcctName{font-weight:900;color:#0b2139}.ceoAcctMeta{font-size:12px;line-height:1.45;color:#77869a;margin-top:2px}
    .ceoAcctStatus{display:inline-block;padding:4px 8px;border-radius:99px;font-size:11px;font-weight:900;text-transform:uppercase}
    .ceoAcctStatus.active{background:#e5f6ef;color:#176b50}.ceoAcctStatus.deactivated{background:#fff2d2;color:#8a5a05}.ceoAcctStatus.deleted{background:#ffe7e7;color:#9d2828}
    .ceoAcctActions{display:flex;gap:5px;flex-wrap:wrap}.ceoAcctBtn{background:#e8eef6;color:#16334f}
    .ceoAcctBtn.warn{background:#fff1c7;color:#7a5600}.ceoAcctBtn.danger{background:#9d2828;color:#fff}.ceoAcctBtn.ok{background:#176b50;color:#fff}
    .ceoAcctBtn:disabled{opacity:.5;cursor:not-allowed}
    .ceoAcctEmpty{padding:24px;text-align:center;color:#718096;font-size:13px}
    .ceoAcctPager{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:11px 13px;background:#fbfcfe;border-top:1px solid #edf1f5}
    .ceoAcctPagerInfo{font-size:12px;color:#68778b}
    .ceoAcctModal{position:fixed;inset:0;z-index:10050;background:#03101fbb;display:grid;place-items:center;padding:16px}
    .ceoAcctModalBox{width:min(580px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:20px;box-shadow:0 24px 70px #0005;font-family:"Source Sans 3","Segoe UI",Arial,sans-serif}
    .ceoAcctModalBox h2{margin:0;color:#0b2139;font-size:20px}.ceoAcctModalBox p{font-size:13px;line-height:1.55;color:#5d6b7b}
    .ceoAcctField{display:grid;gap:5px;margin-top:12px}.ceoAcctField label{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#66758a}
    .ceoAcctField textarea,.ceoAcctField input{width:100%;box-sizing:border-box;border:1px solid #d6dee8;border-radius:9px;padding:10px 11px;font:400 14px/1.4 "Source Sans 3","Segoe UI",Arial,sans-serif}.ceoAcctField textarea{min-height:95px;resize:vertical}
    .ceoAcctModalActions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
    .ceoAcctAuditReason{max-width:380px;white-space:normal;line-height:1.45}
    @media(max-width:820px){.ceoAcctHero h1{font-size:21px}.ceoAcctToolbar{align-items:stretch}.ceoAcctSearch{min-width:100%;order:5}.ceoAcctTable th,.ceoAcctTable td{padding:9px}}
  `;
  document.head.appendChild(s);
}

async function getClient(){
  if(client)return client;
  if(window.supabase&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
    client=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    return client;
  }
  try{if(typeof db!=='undefined'&&db){client=db;return client}}catch{}
  return null;
}

async function isCeo(){
  const c=await getClient();if(!c)return false;
  const {data,error}=await c.rpc('is_ceo');
  return !error&&data===true;
}

function ensureNavButton(){
  const nav=document.getElementById('nav');
  if(!nav)return false;
  if(document.getElementById('ceoAccountControlNav'))return true;
  const b=document.createElement('button');
  b.id='ceoAccountControlNav';
  b.type='button';
  b.dataset.s='ceo-account-control';
  b.textContent='⚿ CEO Account Control';
  b.addEventListener('click',openControl);
  const hr=[...nav.querySelectorAll('button')].find(x=>low(x.textContent).includes('hr & team'));
  if(hr)hr.insertAdjacentElement('afterend',b);else nav.appendChild(b);
  return true;
}

async function loadData(){
  const c=await getClient();
  const [a,l]=await Promise.all([
    c.rpc('ceo_list_manageable_accounts'),
    c.rpc('ceo_list_account_actions',{p_limit:500})
  ]);
  if(a.error)throw a.error;
  if(l.error)throw l.error;
  accounts=a.data||[];
  actions=l.data||[];
}

function filteredAccounts(){
  return accounts.filter(a=>{
    const status=low(a.account_status)||'active';
    if(activeKind==='deleted'){
      if(status!=='deleted')return false;
    }else{
      if(low(a.role)!==activeKind||status==='deleted')return false;
    }
    if(!searchTerm)return true;
    return low([
      a.full_name,a.email,a.role,a.job_title,a.department,a.staff_code,
      a.student_number,a.account_status,a.status_reason
    ].join(' ')).includes(searchTerm);
  });
}

function filteredActions(){
  if(!searchTerm)return actions;
  return actions.filter(a=>low([
    a.target_name,a.target_email,a.target_role,a.action,a.reason,a.outcome
  ].join(' ')).includes(searchTerm));
}

function pageState(total){
  const maxPage=Math.max(1,Math.ceil(total/PAGE_SIZE));
  pages[activeKind]=Math.min(Math.max(1,pages[activeKind]||1),maxPage);
  const page=pages[activeKind];
  const start=(page-1)*PAGE_SIZE;
  return {page,maxPage,start,end:Math.min(start+PAGE_SIZE,total),total};
}

function statusLabel(a){
  const s=low(a.account_status)||'active';
  return '<span class="ceoAcctStatus '+esc(s)+'">'+esc(s)+'</span>';
}

function actionButtons(a){
  const s=low(a.account_status)||'active';
  if(s==='deleted')return '<span class="ceoAcctMeta">Archived · no further account action</span>';
  if(s==='deactivated'){
    return '<div class="ceoAcctActions"><button class="ceoAcctBtn ok" data-ceo-action="reactivate" data-user="'+esc(a.user_id)+'">Reactivate</button><button class="ceoAcctBtn danger" data-ceo-action="delete" data-user="'+esc(a.user_id)+'">Delete Permanently</button></div>';
  }
  return '<div class="ceoAcctActions"><button class="ceoAcctBtn warn" data-ceo-action="deactivate" data-user="'+esc(a.user_id)+'">Deactivate</button><button class="ceoAcctBtn danger" data-ceo-action="delete" data-user="'+esc(a.user_id)+'">Delete Permanently</button></div>';
}

function accountRows(){
  const list=filteredAccounts();
  const st=pageState(list.length);
  const slice=list.slice(st.start,st.end);
  if(!slice.length){
    const label=activeKind==='deleted'?'deleted / archived':activeKind==='staff'?'Staff':'Student';
    return '<tr><td colspan="6"><div class="ceoAcctEmpty">No matching '+label+' accounts.</div></td></tr>';
  }
  return slice.map(a=>{
    const role=low(a.role);
    const identity=role==='staff'?(a.job_title||'Staff'):(a.student_number||'Student');
    const context=role==='staff'?(a.department||'—'):'Student';
    return `<tr>
      <td><div class="ceoAcctName">${esc(a.full_name||'Unnamed account')}</div><div class="ceoAcctMeta">${esc(a.email||'No email')}</div></td>
      <td>${esc(identity)}</td>
      <td>${esc(context)}</td>
      <td>${statusLabel(a)}${a.status_reason?'<div class="ceoAcctMeta">Reason: '+esc(a.status_reason)+'</div>':''}</td>
      <td>${a.status_changed_at?fmt(a.status_changed_at):'—'}</td>
      <td>${actionButtons(a)}</td>
    </tr>`;
  }).join('');
}

function auditRows(){
  const list=filteredActions();
  const st=pageState(list.length);
  const slice=list.slice(st.start,st.end);
  if(!slice.length)return '<tr><td colspan="6"><div class="ceoAcctEmpty">No matching CEO account-control actions.</div></td></tr>';
  return slice.map(a=>`<tr>
    <td>${fmt(a.created_at)}</td>
    <td><div class="ceoAcctName">${esc(a.target_name||'Account')}</div><div class="ceoAcctMeta">${esc(a.target_email||'')}</div></td>
    <td>${esc(cap(a.target_role))}</td>
    <td>${esc(cap(a.action))}</td>
    <td class="ceoAcctAuditReason">${esc(a.reason)}</td>
    <td>${esc(a.outcome)}</td>
  </tr>`).join('');
}

function pagerHtml(){
  const list=activeKind==='audit'?filteredActions():filteredAccounts();
  const st=pageState(list.length);
  const first=st.total?st.start+1:0;
  return `<div class="ceoAcctPagerInfo">Showing ${first}–${st.end} of ${st.total} · 10 per page</div>
    <div class="ceoAcctActions">
      <button class="ceoAcctBtn" data-ceo-page="prev" ${st.page<=1?'disabled':''}>Previous</button>
      <span class="ceoAcctPagerInfo">Page ${st.page} of ${st.maxPage}</span>
      <button class="ceoAcctBtn" data-ceo-page="next" ${st.page>=st.maxPage?'disabled':''}>Next</button>
    </div>`;
}

function drawTable(){
  const tbody=document.getElementById('ceoAcctRows');
  const pager=document.getElementById('ceoAcctPager');
  if(tbody)tbody.innerHTML=activeKind==='audit'?auditRows():accountRows();
  if(pager)pager.innerHTML=pagerHtml();
  bindActions();
  bindPager();
}

function bindPager(){
  document.querySelectorAll('[data-ceo-page]').forEach(b=>b.addEventListener('click',()=>{
    const list=activeKind==='audit'?filteredActions():filteredAccounts();
    const maxPage=Math.max(1,Math.ceil(list.length/PAGE_SIZE));
    pages[activeKind]=b.dataset.ceoPage==='prev'
      ?Math.max(1,(pages[activeKind]||1)-1)
      :Math.min(maxPage,(pages[activeKind]||1)+1);
    drawTable();
  }));
}

function render(){
  const view=document.getElementById('view');if(!view)return;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.id==='ceoAccountControlNav'));
  document.getElementById('side')?.classList.remove('open');

  const studentCount=accounts.filter(a=>low(a.role)==='student'&&low(a.account_status)!=='deleted').length;
  const staffCount=accounts.filter(a=>low(a.role)==='staff'&&low(a.account_status)!=='deleted').length;
  const deletedCount=accounts.filter(a=>low(a.account_status)==='deleted').length;
  const placeholder=activeKind==='audit'
    ?'Search action history by account, action, reason or outcome…'
    :'Search name, email, learner number, role or department…';

  view.innerHTML=`<div class="ceoAcctRoot">
    <section class="ceoAcctHero">
      <small>CEO-ONLY SECURITY CONTROL</small>
      <h1>Student & Staff Account Control</h1>
      <p>Deactivate, reactivate or permanently delete Student and Staff accounts. Every action requires a recorded reason and permanent deletion requires typed confirmation.</p>
    </section>
    <div class="ceoAcctNotice"><strong>Permanent deletion is irreversible.</strong> Sign-in access is removed and the primary account profile is anonymised. Historical Academy records and files may still be retained where required for finance, academic, HR, security, legal or audit integrity.</div>
    <div class="ceoAcctToolbar">
      <button class="ceoAcctTab ${activeKind==='student'?'on':''}" data-ceo-kind="student">Student Accounts (${studentCount})</button>
      <button class="ceoAcctTab ${activeKind==='staff'?'on':''}" data-ceo-kind="staff">Staff Accounts (${staffCount})</button>
      <button class="ceoAcctTab ${activeKind==='deleted'?'on':''}" data-ceo-kind="deleted">Deleted & Archived (${deletedCount})</button>
      <button class="ceoAcctTab ${activeKind==='audit'?'on':''}" data-ceo-kind="audit">Action History (${actions.length})</button>
      <input id="ceoAcctSearch" class="ceoAcctSearch" type="search" placeholder="${esc(placeholder)}">
      <button id="ceoAcctRefresh" class="ceoAcctBtn">Refresh</button>
    </div>
    <section class="ceoAcctPanel">
      <div class="ceoAcctTableWrap">
        ${activeKind==='audit'
          ?'<table class="ceoAcctTable"><thead><tr><th>Date</th><th>Account</th><th>Role</th><th>Action</th><th>Reason</th><th>Outcome</th></tr></thead><tbody id="ceoAcctRows">'+auditRows()+'</tbody></table>'
          :'<table class="ceoAcctTable"><thead><tr><th>Account</th><th>Role / Identifier</th><th>Department</th><th>Status</th><th>Last Changed</th><th>CEO Action</th></tr></thead><tbody id="ceoAcctRows">'+accountRows()+'</tbody></table>'
        }
      </div>
      <div class="ceoAcctPager" id="ceoAcctPager">${pagerHtml()}</div>
    </section>
  </div>`;

  document.querySelectorAll('[data-ceo-kind]').forEach(b=>b.addEventListener('click',()=>{
    activeKind=b.dataset.ceoKind;
    searchTerm='';
    pages[activeKind]=1;
    render();
  }));

  const search=document.getElementById('ceoAcctSearch');
  if(search){
    search.value=searchTerm;
    search.addEventListener('input',()=>{
      searchTerm=low(search.value);
      pages[activeKind]=1;
      drawTable();
    });
  }

  document.getElementById('ceoAcctRefresh')?.addEventListener('click',async()=>{
    try{
      await loadData();
      pages[activeKind]=1;
      render();
    }catch(e){
      alert(e.message||'Could not refresh accounts.');
    }
  });

  bindActions();
  bindPager();
}

function bindActions(){
  document.querySelectorAll('[data-ceo-action]').forEach(b=>b.addEventListener('click',()=>{
    const account=accounts.find(a=>a.user_id===b.dataset.user);
    if(account)openActionModal(account,b.dataset.ceoAction);
  }));
}

function openActionModal(account,action){
  document.getElementById('ceoAcctModal')?.remove();
  const deleting=action==='delete';
  const title=deleting?'Permanently Delete Account':action==='deactivate'?'Deactivate Account':'Reactivate Account';
  const confirmValue=account.email||account.full_name||'';
  const staffDelete=deleting&&low(account.role)==='staff';
  const modal=document.createElement('div');
  modal.id='ceoAcctModal';modal.className='ceoAcctModal';
  modal.innerHTML=`<div class="ceoAcctModalBox" role="dialog" aria-modal="true" aria-labelledby="ceoAcctModalTitle">
    <h2 id="ceoAcctModalTitle">${esc(title)}</h2>
    <p><strong>${esc(account.full_name||'Account')}</strong><br>${esc(account.email||'')}${account.student_number?'<br>Learner No: '+esc(account.student_number):''}</p>
    ${deleting?'<p style="color:#9d2828;font-weight:800">This permanently removes sign-in access and anonymises the primary account profile. Historical Academy records/files may be retained where required for finance, academic, HR, security, legal or audit integrity.'+(staffDelete?' Active Staff department access will also be revoked.':'')+'</p>':''}
    <div class="ceoAcctField"><label for="ceoAcctReason">Reason *</label><textarea id="ceoAcctReason" maxlength="1000" placeholder="Record the reason for this action. This will be saved in the CEO audit trail." required></textarea></div>
    ${deleting?`<div class="ceoAcctField"><label for="ceoAcctConfirmation">Type this exactly to confirm: ${esc(confirmValue)}</label><input id="ceoAcctConfirmation" autocomplete="off" placeholder="${esc(confirmValue)}"></div>`:''}
    <div class="ceoAcctModalActions">
      <button class="ceoAcctBtn" id="ceoAcctCancel">Cancel</button>
      <button class="ceoAcctBtn ${deleting?'danger':action==='reactivate'?'ok':'warn'}" id="ceoAcctConfirm">${esc(title)}</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  document.getElementById('ceoAcctCancel').onclick=()=>modal.remove();
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
  document.getElementById('ceoAcctConfirm').onclick=()=>submitAction(account,action,modal);
  setTimeout(()=>document.getElementById('ceoAcctReason')?.focus(),30);
}

async function submitAction(account,action,modal){
  const reason=document.getElementById('ceoAcctReason')?.value.trim()||'';
  const confirmation=document.getElementById('ceoAcctConfirmation')?.value.trim()||'';
  if(reason.length<5)return alert('Please give a clear reason of at least 5 characters.');
  if(action==='delete'){
    const expected=(account.email||account.full_name||'').trim();
    if(low(confirmation)!==low(expected))return alert('The confirmation does not match the account email or name shown.');
  }

  const btn=document.getElementById('ceoAcctConfirm');
  if(btn){btn.disabled=true;btn.textContent='Processing…'}
  try{
    const c=await getClient();
    const {data,error}=await c.functions.invoke('ceo-account-control',{
      body:{
        target_user_id:account.user_id,
        action,
        reason,
        confirmation:action==='delete'?confirmation:null
      }
    });
    if(error)throw error;
    if(data?.error)throw new Error(data.error);

    modal.remove();
    await loadData();
    pages[activeKind]=1;
    render();

    let message=action==='delete'
      ?'Account permanently disabled, primary profile anonymised and audit reason recorded. Historical Academy records may remain where retention is required.'
      :action==='deactivate'
        ?'Account deactivated and audit reason recorded.'
        :'Account reactivated and audit reason recorded.';

    if(action==='delete'&&data?.avatar_cleanup==='failed'){
      message+=' Profile-avatar storage cleanup could not be confirmed and should be reviewed.';
    }
    alert(message);
  }catch(e){
    alert(e.message||'The account action could not be completed.');
    if(btn){
      btn.disabled=false;
      btn.textContent=action==='delete'?'Permanently Delete Account':action==='deactivate'?'Deactivate Account':'Reactivate Account';
    }
  }
}

async function openControl(){
  try{
    await loadData();
    activeKind='student';
    searchTerm='';
    Object.keys(pages).forEach(k=>pages[k]=1);
    render();
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){
    alert(e.message||'CEO account controls could not be loaded.');
  }
}

async function boot(){
  installStyles();
  const ok=await isCeo();
  if(!ok)return;
  if(ensureNavButton())return;
  const observer=new MutationObserver(()=>{
    if(ensureNavButton())observer.disconnect();
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,400),{once:true});
else setTimeout(boot,400);
})();