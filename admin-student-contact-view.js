(()=>{
  if(window.__fundaAdminStudentContactView)return;
  window.__fundaAdminStudentContactView=true;

  const PANEL_ID='fundaStudentContactsPanel';
  const PAGE_SIZE=10;
  let timer=null;
  let loading=false;
  let applicationPage=1;
  let contactPage=1;

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));

  function formatDate(value){
    if(!value)return '—';
    const d=new Date(value);
    return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-ZA',{day:'2-digit',month:'short',year:'numeric'});
  }

  function client(){
    if(window.__fundaSharedSupabaseClient)return window.__fundaSharedSupabaseClient;
    if(window.db?.from)return window.db;
    if(window.supabase?.createClient&&window.SUPABASE_URL&&window.SUPABASE_ANON_KEY){
      return window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
    }
    return null;
  }

  function isCurrentEnrolmentsWorkspace(view){
    const text=String(view?.textContent||'').toLowerCase();
    return text.includes('enrolments & courses')||
      text.includes('enrollment pipeline')||
      text.includes('enrolment pipeline')||
      text.includes('applications')||
      text.includes('course portfolio')||
      text.includes('course catalog')||
      text.includes('course catalogue')||
      text.includes('course governance');
  }

  function legacyReportContainer(view){
    const heading=[...view.querySelectorAll('h1,h2,h3,h4,strong')]
      .find(node=>/legacy students report/i.test(node.textContent||''));
    return heading?.closest('.panel,.lgPanel,section,.card,[class*="panel"],[class*="Panel"]')||null;
  }

  function pagerMarkup(kind,page,total){
    if(!total)return '';
    const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    const safe=Math.min(Math.max(1,page),pages);
    const start=(safe-1)*PAGE_SIZE+1;
    const end=Math.min(safe*PAGE_SIZE,total);
    return `<div class="funda-record-pager" data-funda-pager="${kind}" data-funda-page-signature="${safe}:${total}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px solid #edf1f6">
      <span class="muted" style="font-size:12px">Showing ${start}–${end} of ${total} · Page ${safe} of ${pages}</span>
      <div class="actions">
        <button type="button" class="btn light" data-funda-page-kind="${kind}" data-funda-page="${safe-1}" ${safe<=1?'disabled':''}>Previous</button>
        <button type="button" class="btn light" data-funda-page-kind="${kind}" data-funda-page="${safe+1}" ${safe>=pages?'disabled':''}>Next</button>
      </div>
    </div>`;
  }

  function applyPage(rows,page){
    const total=rows.length;
    const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    const safe=Math.min(Math.max(1,page),pages);
    const start=(safe-1)*PAGE_SIZE;
    rows.forEach((row,index)=>{
      row.style.display=index>=start&&index<start+PAGE_SIZE?'':'none';
    });
    return {page:safe,total,pages};
  }

  function upsertPager(host,kind,page,total){
    if(!host)return;
    const signature=`${page}:${total}`;
    const existing=host.parentElement?.querySelector(`[data-funda-pager="${kind}"]`);
    if(existing?.dataset.fundaPageSignature===signature)return;
    existing?.remove();
    host.insertAdjacentHTML('afterend',pagerMarkup(kind,page,total));
  }

  function findApplicationsPanel(view){
    const heading=[...view.querySelectorAll('h1,h2,h3,h4,strong')]
      .find(node=>/(applications|enrollment pipeline|enrolment pipeline)/i.test(String(node.textContent||'').trim()));
    return heading?.closest('.panel,section,[class*="panel"],[class*="Panel"]')||null;
  }

  function paginateApplications(view){
    const panel=findApplicationsPanel(view);
    if(!panel)return;
    const list=panel.querySelector('.list');
    if(!list)return;
    const rows=[...list.children].filter(node=>node.classList?.contains('row'));
    if(!rows.length)return;

    const state=applyPage(rows,applicationPage);
    applicationPage=state.page;
    upsertPager(list,'applications',state.page,state.total);
  }

  function paginateContacts(){
    const panel=document.getElementById(PANEL_ID);
    if(!panel)return;
    const tbody=panel.querySelector('tbody');
    if(!tbody)return;
    const rows=[...tbody.querySelectorAll(':scope > tr')];
    if(!rows.length)return;

    const state=applyPage(rows,contactPage);
    contactPage=state.page;
    const tablewrap=panel.querySelector('.tablewrap');
    upsertPager(tablewrap,'contacts',state.page,state.total);
  }

  function applyPagination(){
    const view=document.getElementById('view');
    if(!view||!isCurrentEnrolmentsWorkspace(view))return;
    paginateApplications(view);
    paginateContacts();
  }

  function buildPanel(rows){
    const panel=document.createElement('section');
    panel.id=PANEL_ID;
    panel.className='panel funda-student-contacts-panel';
    panel.style.marginTop='12px';

    const body=rows.length
      ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Student</th><th>Email</th><th>Contact Number</th><th>Registered</th></tr></thead><tbody>${rows.map(row=>`<tr><td><strong>${esc(row.full_name||'Student')}</strong></td><td>${esc(row.email||'—')}</td><td><strong>${esc(row.contact||'—')}</strong></td><td>${esc(formatDate(row.created_at))}</td></tr>`).join('')}</tbody></table></div>`
      : '<div class="empty">No active Student-role accounts found.</div>';

    panel.innerHTML=`
      <div class="head">
        <div>
          <h2>Student Contacts</h2>
          <p>Only active Student-role accounts are shown here. Ambassador and Admin accounts stay separate.</p>
        </div>
        <span class="badge green">${rows.length} STUDENT${rows.length===1?'':'S'}</span>
      </div>
      ${body}`;
    return panel;
  }

  async function render(){
    const view=document.getElementById('view');
    if(!view||!isCurrentEnrolmentsWorkspace(view))return;

    paginateApplications(view);

    if(document.getElementById(PANEL_ID)||loading){
      paginateContacts();
      return;
    }

    const dbClient=client();
    if(!dbClient)return;
    loading=true;

    try{
      const [profilesResult,studentsResult]=await Promise.all([
        dbClient.from('profiles')
          .select('id,full_name,email,phone,role,created_at')
          .eq('role','student')
          .order('created_at',{ascending:false}),
        dbClient.from('students')
          .select('user_id,mobile_whatsapp')
      ]);

      if(profilesResult.error)throw profilesResult.error;

      const fallback=new Map(
        (studentsResult.error?[]:(studentsResult.data||[]))
          .map(row=>[String(row.user_id||''),String(row.mobile_whatsapp||'').trim()])
      );

      const rows=(profilesResult.data||[])
        .filter(row=>!String(row.email||'').toLowerCase().endsWith('@deleted.funda.invalid'))
        .map(row=>({
          ...row,
          contact:String(row.phone||fallback.get(String(row.id))||'').trim()
        }));

      if(!isCurrentEnrolmentsWorkspace(view)||document.getElementById(PANEL_ID))return;

      const panel=buildPanel(rows);
      const legacy=legacyReportContainer(view);
      if(legacy)legacy.before(panel);
      else view.appendChild(panel);
      paginateContacts();
    }catch(error){
      console.warn('Student contacts could not load:',error);
    }finally{
      loading=false;
    }
  }

  function schedule(){
    clearTimeout(timer);
    timer=setTimeout(render,120);
  }

  function handlePager(event){
    const button=event.target.closest?.('[data-funda-page-kind]');
    if(!button||button.disabled)return;
    const page=Number(button.dataset.fundaPage||1);
    if(button.dataset.fundaPageKind==='applications')applicationPage=page;
    if(button.dataset.fundaPageKind==='contacts')contactPage=page;
    applyPagination();
  }

  function start(){
    const view=document.getElementById('view');
    if(!view){setTimeout(start,250);return;}
    view.addEventListener('click',handlePager);
    new MutationObserver(schedule).observe(view,{childList:true,subtree:true});
    schedule();
  }

  window.FundaAdminStudentContactView={render:schedule,applyPagination};
  document.addEventListener('funda:admin-nav-ready',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
