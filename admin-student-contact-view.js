(()=>{
  if(window.__fundaAdminStudentContactView)return;
  window.__fundaAdminStudentContactView=true;

  const PANEL_ID='fundaStudentContactsPanel';
  const PAGE_SIZE=10;
  let timer=null;
  let loading=false;
  let applicationPage=1;
  let contactPage=1;
  let contactSort='name-asc';
  let pendingContactSearch='';
  let activeContactSearch='';

  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[ch]));
  const normal=value=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');

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

  function contactRows(){
    const tbody=document.querySelector(`#${PANEL_ID} tbody`);
    return tbody?[...tbody.querySelectorAll(':scope > tr')]:[];
  }

  function paginateContacts(){
    const panel=document.getElementById(PANEL_ID);
    if(!panel)return;
    const rows=contactRows();
    if(!rows.length)return;

    const state=applyPage(rows,contactPage);
    contactPage=state.page;
    const tablewrap=panel.querySelector('.tablewrap');
    upsertPager(tablewrap,'contacts',state.page,state.total);
  }

  function sortRows(rows,mode){
    return [...rows].sort((a,b)=>{
      if(mode==='name-desc')return String(b.dataset.name||'').localeCompare(String(a.dataset.name||''),'en',{sensitivity:'base'});
      if(mode==='newest')return Number(b.dataset.created||0)-Number(a.dataset.created||0);
      if(mode==='oldest')return Number(a.dataset.created||0)-Number(b.dataset.created||0);
      return String(a.dataset.name||'').localeCompare(String(b.dataset.name||''),'en',{sensitivity:'base'});
    });
  }

  function sortContactDom(resetPage=true){
    const panel=document.getElementById(PANEL_ID);
    const tbody=panel?.querySelector('tbody');
    if(!tbody)return;
    const rows=sortRows([...tbody.querySelectorAll(':scope > tr')],contactSort);
    rows.forEach(row=>tbody.appendChild(row));
    if(resetPage)contactPage=1;
    paginateContacts();
    if(activeContactSearch)focusContact(activeContactSearch,false);
  }

  function clearContactHighlight(){
    contactRows().forEach(row=>{
      row.style.background='';
      row.style.outline='';
      row.style.outlineOffset='';
      row.removeAttribute('tabindex');
    });
  }

  function setSearchStatus(message,isError=false){
    const status=document.getElementById('studentContactSearchStatus');
    if(!status)return;
    status.textContent=message||'';
    status.style.color=isError?'#9b2525':'#176b50';
  }

  function focusContact(term,scroll=true){
    const query=normal(term);
    if(!query)return false;
    const rows=contactRows();
    if(!rows.length)return false;

    let match=rows.find(row=>normal(row.dataset.name)===query||normal(row.dataset.email)===query||normal(row.dataset.contact)===query);
    if(!match)match=rows.find(row=>normal(row.dataset.search).includes(query));

    clearContactHighlight();
    if(!match){
      setSearchStatus(`No student contact matched “${term}”.`,true);
      return false;
    }

    const index=rows.indexOf(match);
    contactPage=Math.floor(index/PAGE_SIZE)+1;
    paginateContacts();
    match.style.background='#fff8dc';
    match.style.outline='2px solid #c7a13b';
    match.style.outlineOffset='-2px';
    match.setAttribute('tabindex','-1');
    const studentName=match.dataset.displayName||'Student';
    setSearchStatus(`Student found: ${studentName}`);
    activeContactSearch=term;

    if(scroll){
      requestAnimationFrame(()=>{
        match.scrollIntoView({behavior:'smooth',block:'center'});
        try{match.focus({preventScroll:true});}catch(_){match.focus();}
      });
    }
    return true;
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

    const ordered=[...rows].sort((a,b)=>normal(a.full_name||a.email).localeCompare(normal(b.full_name||b.email),'en',{sensitivity:'base'}));
    const body=ordered.length
      ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Student</th><th>Email</th><th>Contact Number</th><th>Registered</th></tr></thead><tbody>${ordered.map(row=>{
          const displayName=row.full_name||'Student';
          const created=Date.parse(row.created_at||'')||0;
          const search=normal(`${displayName} ${row.email||''} ${row.contact||''}`);
          return `<tr data-name="${esc(normal(displayName))}" data-display-name="${esc(displayName)}" data-email="${esc(normal(row.email))}" data-contact="${esc(normal(row.contact))}" data-search="${esc(search)}" data-created="${created}"><td><strong>${esc(displayName)}</strong></td><td>${esc(row.email||'—')}</td><td><strong>${esc(row.contact||'—')}</strong></td><td>${esc(formatDate(row.created_at))}</td></tr>`;
        }).join('')}</tbody></table></div>`
      : '<div class="empty">No active Student-role accounts found.</div>';

    panel.innerHTML=`
      <div class="head">
        <div>
          <h2>Student Contacts</h2>
          <p>Only active Student-role accounts are shown here. Ambassador and Admin accounts stay separate.</p>
        </div>
        <span class="badge green">${rows.length} STUDENT${rows.length===1?'':'S'}</span>
      </div>
      <div class="toolbar" style="justify-content:space-between;margin:8px 0 10px">
        <div class="toolbar" style="margin:0">
          <label for="studentContactSort" class="muted" style="font-weight:800">Sort students</label>
          <select id="studentContactSort" class="field" style="min-width:170px;padding:8px 10px">
            <option value="name-asc" selected>A–Z</option>
            <option value="name-desc">Z–A</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>
        <span id="studentContactSearchStatus" class="muted" style="font-size:12px"></span>
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
      if(pendingContactSearch&&document.getElementById(PANEL_ID)){
        const term=pendingContactSearch;
        pendingContactSearch='';
        focusContact(term,true);
      }
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
      contactSort='name-asc';
      contactPage=1;
      paginateContacts();

      if(pendingContactSearch){
        const term=pendingContactSearch;
        pendingContactSearch='';
        focusContact(term,true);
      }
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

  function handleSort(event){
    if(event.target?.id!=='studentContactSort')return;
    contactSort=event.target.value||'name-asc';
    sortContactDom(true);
  }

  function handleGlobalStudentSearch(event){
    const input=event.target;
    if(event.key!=='Enter'||input?.id!=='global')return;
    const term=String(input.value||'').trim();
    if(!term)return;

    event.preventDefault();
    event.stopImmediatePropagation();
    pendingContactSearch=term;
    activeContactSearch=term;

    const view=document.getElementById('view');
    if(!view||!isCurrentEnrolmentsWorkspace(view)){
      if(typeof window.show==='function')window.show('enrolments');
      else if(typeof show==='function')show('enrolments');
    }
    schedule();
    setTimeout(()=>{
      if(document.getElementById(PANEL_ID)){
        pendingContactSearch='';
        focusContact(term,true);
      }
    },180);
  }

  function start(){
    const view=document.getElementById('view');
    if(!view){setTimeout(start,250);return;}
    view.addEventListener('click',handlePager);
    view.addEventListener('change',handleSort);
    document.addEventListener('keydown',handleGlobalStudentSearch,true);
    new MutationObserver(schedule).observe(view,{childList:true,subtree:true});
    schedule();
  }

  window.FundaAdminStudentContactView={render:schedule,applyPagination,focusContact};
  document.addEventListener('funda:admin-nav-ready',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
