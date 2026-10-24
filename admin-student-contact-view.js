(()=>{
  if(window.__fundaAdminStudentContactView)return;
  window.__fundaAdminStudentContactView=true;

  const PANEL_ID='fundaStudentContactsPanel';
  let timer=null;
  let loading=false;

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
    return text.includes('enrollment pipeline')||
      text.includes('enrolment pipeline')||
      text.includes('course catalog')||
      text.includes('course catalogue')||
      text.includes('course governance');
  }

  function legacyReportContainer(view){
    const heading=[...view.querySelectorAll('h1,h2,h3,h4,strong')]
      .find(node=>/legacy students report/i.test(node.textContent||''));
    return heading?.closest('.panel,.lgPanel,section,.card,[class*="panel"],[class*="Panel"]')||null;
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
    if(!view||!isCurrentEnrolmentsWorkspace(view)||document.getElementById(PANEL_ID)||loading)return;

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

  function start(){
    const view=document.getElementById('view');
    if(!view){setTimeout(start,250);return;}
    new MutationObserver(schedule).observe(view,{childList:true,subtree:true});
    schedule();
  }

  window.FundaAdminStudentContactView={render:schedule};
  document.addEventListener('funda:admin-nav-ready',schedule);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
