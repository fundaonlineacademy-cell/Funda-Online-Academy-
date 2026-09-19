(()=>{
'use strict';
if(window.__fundaCeoAccountManagement)return;
window.__fundaCeoAccountManagement=true;

let client=null;
let accounts=[];
let actions=[];
let activeKind='student';
let searchTerm='';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const low=v=>String(v??'').trim().toLowerCase();
const fmt=v=>v?new Date(v).toLocaleString('en-ZA',{dateStyle:'medium',timeStyle:'short'}):'—';

function installStyles(){
  if(document.getElementById('ceoAccountControlCss'))return;
  const s=document.createElement('style');
  s.id='ceoAccountControlCss';
  s.textContent=`
    .ceoAcctHero{padding:20px;border-radius:16px;background:linear-gradient(135deg,#03101f,#0b315c);color:#fff}
    .ceoAcctHero small{display:block;color:#d6b45c;font-weight:900;letter-spacing:.15em}
    .ceoAcctHero h1{margin:5px 0 4px;font-size:22px}.ceoAcctHero p{margin:0;color:#dfe9f6;font-size:12px;line-height:1.6}
    .ceoAcctNotice{margin-top:12px;padding:12px 14px;border:1px solid #ead393;border-radius:12px;background:#fff8e4;color:#6f5315;font-size:11px;line-height:1.55}
    .ceoAcctToolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0}
    .ceoAcctTab,.ceoAcctBtn{border:0;border-radius:9px;padding:9px 12px;font:800 10px/1.2 "Source Sans 3","Segoe UI",Arial,sans-serif;cursor:pointer}
    .ceoAcctTab{background:#edf2f7;color:#17324a}.ceoAcctTab.on{background:#0b315c;color:#fff}
    .ceoAcctSearch{flex:1;min-width:220px;border:1px solid #d9e0e8;border-radius:9px;padding:9px 11px;font-size:11px;background:#fff}
    .ceoAcctPanel{border:1px solid #e2e8f0;border-radius:14px;background:#fff;overflow:hidden}
    .ceoAcctTableWrap{overflow:auto}.ceoAcctTable{width:100%;border-collapse:collapse;font-size:11px}
    .ceoAcctTable th,.ceoAcctTable td{padding:11px;border-bottom:1px solid #edf1f5;text-align:left;vertical-align:top;white-space:nowrap}
    .ceoAcctTable th{font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#68778b;background:#f8fafc}
    .ceoAcctName{font-weight:900;color:#0b2139}.ceoAcctMeta{font-size:9px;color:#77869a;margin-top:2px}
    .ceoAcctStatus{display:inline-block;padding:4px 7px;border-radius:99px;font-size:8px;font-weight:900;text-transform:uppercase}
    .ceoAcctStatus.active{background:#e5f6ef;color:#176b50}.ceoAcctStatus.deactivated{background:#fff2d2;color:#8a5a05}.ceoAcctStatus.deleted{background:#ffe7e7;color:#9d2828}
    .ceoAcctActions{display:flex;gap:5px;flex-wrap:wrap}.ceoAcctBtn{background:#e8eef6;color:#16334f}
    .ceoAcctBtn.warn{background:#fff1c7;color:#7a5600}.ceoAcctBtn.danger{background:#9d2828;color:#fff}.ceoAcctBtn.ok{background:#176b50;color:#fff}
    .ceoAcctEmpty{padding:24px;text-align:center;color:#718096;font-size:11px}
    .ceoAcctModal{position:fixed;inset:0;z-index:10050;background:#03101fbb;display:grid;place-items:center;padding:16px}
    .ceoAcctModalBox{width:min(560px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;padding:20px;box-shadow:0 24px 70px #0005}
    .ceoAcctModalBox h2{margin:0;color:#0b2139;font-size:19px}.ceoAcctModalBox p{font-size:11px;line-height:1.6;color:#5d6b7b}
    .ceoAcctField{display:grid;gap:5px;margin-top:12px}.ceoAcctField label{font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#66758a}
    .ceoAcctField textarea,.ceoAcctField input{width:100%;border:1px solid #d6dee8;border-radius:9px;padding:10px 11px;font:inherit}.ceoAcctField textarea{min-height:90px;resize:vertical}
    .ceoAcctModalActions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
    .ceoAcctAuditReason{max-width:340px;white-space:normal;line-height:1.45}
    @media(max-width:820px){.ceoAcctHero h1{font-size:19px}.ceoAcctToolbar{align-items:stretch}.ceoAcctSearch{min-width:100%;order:3}.ceoAcctTable th,.ceoAcctTable td{padding:9px}}
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
  if(!nav||document.getElementById('ceoAccountControlNav'))return;
  const b=document.createElement('button');
  b.id='ceoAccountControlNav';
  b.type='button';
  b.dataset.s='ceo-account-control';
  b.textContent='⚿ CEO Account Control';
  b.addEventListener('click',openControl);
  const hr=[...nav.querySelectorAll('button')].find(x=>low(x.textContent).includes('hr & team'));
  if(hr)hr.insertAdjacentElement('afterend',b);else nav.appendChild(b);
}

async function loadData(){
  const c=await getClient();
  const [a,l]=await Promise.all([
    c.rpc('ceo_list_manageable_accounts'),
    c.rpc('ceo_list_account_actions',{p_limit:100})
  ]);
  if(a.error)throw a.error;
  if(l.error)throw l.error;
  accounts=a.data||[];
  actions=l.data||[];
}

function filtered(){
  return accounts.filter(a=>{
    if(low(a.role)!==activeKind)return false;
    if(!searchTerm)return true;
    return low([a.full_name,a.email,a.job_title,a.department,a.staff_code,a.account_status].join(' ')).includes(searchTerm);
  });
}

function statusLabel(a){
  const s=low(a.account_status)||'active';
  return '<span class="ceoAcctStatus '+esc(s)+'">'+esc(s)+'</span>';
}

function actionButtons(a){
  const s=low(a.account_status)||'active';
  if(s==='deleted')return '<span class="ceoAcctMeta">No further action available</span>';
  if(s==='deactivated'){
    return '<div class="ceoAcctActions"><button class="ceoAcctBtn ok" data-ceo-action="reactivate" data-user="'+esc(a.user_id)+'">Reactivate</button><button class="ceoAcctBtn danger" data-ceo-action="delete" data-user="'+esc(a.user_id)+'">Delete Permanently</button></div>';
  }
  return '<div class="ceoAcctActions"><button class="ceoAcctBtn warn" data-ceo-action="deactivate" data-user="'+esc(a.user_id)+'">Deactivate</button><button class="ceoAcctBtn danger" data-ceo-action="delete" data-user="'+esc(a.user_id)+'">Delete Permanently</button></div>';
}

function accountRows(){
  const list=filtered();
  if(!list.length)return '<tr><td colspan="6"><div class="ceoAcctEmpty">No matching '+(activeKind==='staff'?'Staff':'Student')+' accounts.</div></td></tr>';
  return list.map(a=>`<tr>
    <td><div class="ceoAcctName">${esc(a.full_name||'Unnamed account')}</div><div class="ceoAcctMeta">${esc(a.email||'No email')}</div></td>
    <td>${activeKind==='staff'?esc(a.job_title||'Staff'):esc(a.staff_code||'Student')}</td>
    <td>${activeKind==='staff'?esc(a.department||'—'):'Student'}</td>
    <td>${statusLabel(a)}${a.status_reason?'<div class="ceoAcctMeta">Reason: '+esc(a.status_reason)+'</div>':''}</td>
    <td>${a.status_changed_at?fmt(a.status_changed_at):'—'}</td>
    <td>${actionButtons(a)}</td>
  </tr>`).join('');
}

function auditRows(){
  if(!actions.length)return '<tr><td colspan="6"><div class="ceoAcctEmpty">No CEO account-control actions recorded yet.</div></td></tr>';
  return actions.map(a=>`<tr>
    <td>${fmt(a.created_at)}</td>
    <td><div class="ceoAcctName">${esc(a.target_name||'Account')}</div><div class="ceoAcctMeta">${esc(a.target_email||'')}</div></td>
    <td>${esc(a.target_role)}</td>
    <td>${esc(a.action)}</td>
    <td class="ceoAcctAuditReason">${esc(a.reason)}</td>
    <td>${esc(a.outcome)}</td>
  </tr>`).join('');
}

function render(){
  const view=document.getElementById('view');if(!view)return;
  document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.id==='ceoAccountControlNav'));
  document.getElementById('side')?.classList.remove('open');
  view.innerHTML=`
    <section class="ceoAcctHero">
      <small>CEO-ONLY SECURITY CONTROL</small>
      <h1>Student & Staff Account Control</h1>
      <p>Deactivate, reactivate or permanently delete Student and Staff accounts. Every action requires a recorded reason and permanent deletion requires typed confirmation.</p>
    </section>
    <div class="ceoAcctNotice"><strong>Permanent deletion is irreversible.</strong> Sign-in access and personal account data are removed. Historical Academy records that must remain for finance, academic, HR, security or audit integrity are retained only in anonymised form.</div>
    <div class="ceoAcctToolbar">
      <button class="ceoAcctTab ${activeKind==='student'?'on':''}" data-ceo-kind="student">Student Accounts</button>
      <button class="ceoAcctTab ${activeKind==='staff'?'on':''}" data-ceo-kind="staff">Staff Accounts</button>
      <button class="ceoAcctTab ${activeKind==='audit'?'on':''}" data-ceo-kind="audit">Action History</button>
      ${activeKind!=='audit'?'<input id="ceoAcctSearch" class="ceoAcctSearch" type="search" placeholder="Search name, email, role or department…">':''}
      <button id="ceoAcctRefresh" class="ceoAcctBtn">Refresh</button>
    </div>
    <section class="ceoAcctPanel">
      <div class="ceoAcctTableWrap">
        ${activeKind==='audit'
          ?'<table class="ceoAcctTable"><thead><tr><th>Date</th><th>Account</th><th>Role</th><th>Action</th><th>Reason</th><th>Outcome</th></tr></thead><tbody>'+auditRows()+'</tbody></table>'
          :'<table class="ceoAcctTable"><thead><tr><th>Account</th><th>Role / Position</th><th>Department</th><th>Status</th><th>Last Changed</th><th>CEO Action</th></tr></thead><tbody>'+accountRows()+'</tbody></table>'
        }
      </div>
    </section>`;

  document.querySelectorAll('[data-ceo-kind]').forEach(b=>b.addEventListener('click',()=>{
    activeKind=b.dataset.ceoKind;searchTerm='';render();
  }));
  const search=document.getElementById('ceoAcctSearch');
  if(search){
    search.value=searchTerm;
    search.addEventListener('input',()=>{searchTerm=low(search.value);const tbody=view.querySelector('tbody');if(tbody)tbody.innerHTML=accountRows();bindActions()});
  }
  document.getElementById('ceoAcctRefresh')?.addEventListener('click',async()=>{
    try{await loadData();render()}catch(e){alert(e.message||'Could not refresh accounts.')}
  });
  bindActions();
}

function bindActions(){
  document.querySelectorAll('[data-ceo-action]').forEach(b=>b.addEventListener('click',()=>{
    const account=accounts.find(a=>a.user_id===b.dataset.user);if(account)openActionModal(account,b.dataset.ceoAction);
  }));
}

function openActionModal(account,action){
  document.getElementById('ceoAcctModal')?.remove();
  const deleting=action==='delete';
  const title=deleting?'Permanently Delete Account':action==='deactivate'?'Deactivate Account':'Reactivate Account';
  const confirmValue=account.email||account.full_name||'';
  const modal=document.createElement('div');
  modal.id='ceoAcctModal';modal.className='ceoAcctModal';
  modal.innerHTML=`<div class="ceoAcctModalBox" role="dialog" aria-modal="true" aria-labelledby="ceoAcctModalTitle">
    <h2 id="ceoAcctModalTitle">${esc(title)}</h2>
    <p><strong>${esc(account.full_name||'Account')}</strong><br>${esc(account.email||'')}</p>
    ${deleting?'<p style="color:#9d2828;font-weight:800">This action permanently removes sign-in access and personal account data and cannot be undone.</p>':''}
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
    const {data,error}=await c.rpc('ceo_manage_account',{
      p_target_user_id:account.user_id,
      p_action:action,
      p_reason:reason,
      p_confirmation:action==='delete'?confirmation:null
    });
    if(error)throw error;
    modal.remove();
    await loadData();
    render();
    alert(action==='delete'?'Account permanently deleted and audit reason recorded.':action==='deactivate'?'Account deactivated and audit reason recorded.':'Account reactivated and audit reason recorded.');
  }catch(e){
    alert(e.message||'The account action could not be completed.');
    if(btn){btn.disabled=false;btn.textContent=action==='delete'?'Permanently Delete Account':action==='deactivate'?'Deactivate Account':'Reactivate Account'}
  }
}

async function openControl(){
  try{
    await loadData();
    activeKind='student';searchTerm='';render();
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){alert(e.message||'CEO account controls could not be loaded.')}
}

async function boot(){
  installStyles();
  const ok=await isCeo();
  if(!ok)return;
  ensureNavButton();
  let tries=0;
  const timer=setInterval(()=>{
    ensureNavButton();
    if(document.getElementById('ceoAccountControlNav')||tries++>20)clearInterval(timer);
  },300);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,400),{once:true});
else setTimeout(boot,400);
})();