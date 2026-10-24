(()=>{
  if(window.__fundaAdminStudentContactView)return;
  window.__fundaAdminStudentContactView=true;

  const esc=value=>{
    try{return typeof e==='function'?e(value):String(value??'');}
    catch(_){return String(value??'');}
  };

  function activeStudentProfiles(){
    if(typeof PR==='undefined'||!Array.isArray(PR))return [];
    return PR.filter(profile=>
      String(profile?.role||'').toLowerCase()==='student'&&
      !String(profile?.email||'').toLowerCase().endsWith('@deleted.funda.invalid')
    );
  }

  function profileForEnrollment(item){
    if(typeof PR==='undefined'||!Array.isArray(PR))return null;
    const id=String(item?.student_id||item?.student?.id||'');
    return PR.find(profile=>String(profile?.id||'')===id)||null;
  }

  function studentOnlyEnrollments(){
    if(typeof EN==='undefined'||!Array.isArray(EN))return [];
    return EN.filter(item=>{
      const profile=profileForEnrollment(item);
      if(profile)return String(profile.role||'').toLowerCase()==='student';
      return String(item?.student_category||'').toLowerCase()==='student';
    });
  }

  function contactFor(profile,item){
    return String(profile?.phone||item?.student?.phone||'').trim()||'—';
  }

  function renderStudentRegister(){
    const students=activeStudentProfiles();
    if(!students.length)return '<div class="empty">No student accounts found.</div>';
    return `<div class="tablewrap"><table class="tbl"><tr><th>Student</th><th>Email</th><th>Contact number</th><th>Registered</th></tr>${students.map(profile=>`<tr><td>${esc(profile.full_name||'Student')}</td><td>${esc(profile.email||'—')}</td><td><strong>${esc(profile.phone||'—')}</strong></td><td>${typeof date==='function'?date(profile.created_at):esc(profile.created_at||'—')}</td></tr>`).join('')}</table></div>`;
  }

  function renderStudentEnrolments(){
    const applications=studentOnlyEnrollments();
    const pending=applications.filter(x=>typeof st==='function'?st(x)==='pending':String(x?.status||'').toLowerCase()==='pending').length;
    const approved=applications.filter(x=>typeof st==='function'?st(x)==='approved':String(x?.status||'').toLowerCase()==='approved').length;
    const rejected=applications.filter(x=>typeof st==='function'?st(x)==='rejected':String(x?.status||'').toLowerCase()==='rejected').length;
    const coursesCount=typeof CO!=='undefined'&&Array.isArray(CO)?CO.length:0;

    const applicationsHtml=applications.map(item=>{
      const profile=profileForEnrollment(item);
      const name=profile?.full_name||item?.student?.full_name||profile?.email||item?.student?.email||'Student';
      const email=profile?.email||item?.student?.email||'—';
      const phone=contactFor(profile,item);
      const courseTitle=item?.course?.title||'Course';
      const amount=typeof money==='function'?money(item?.amount||item?.course?.price):esc(item?.amount||item?.course?.price||'—');
      const created=typeof date==='function'?date(item?.created_at):esc(item?.created_at||'—');
      const state=typeof st==='function'?st(item):String(item?.status||item?.enrollment_status||'pending').toLowerCase();
      return `<div class="row"><div><h3>${esc(name)}</h3><p><strong>Email:</strong> ${esc(email)} · <strong>Contact:</strong> ${esc(phone)}</p><p>${esc(courseTitle)} · ${amount} · ${created}</p>${item?.rejection_reason?`<p>Reason: ${esc(item.rejection_reason)}</p>`:''}</div><div class="actions">${typeof statusBadge==='function'?statusBadge(state):esc(state)}${item?.proof_url?`<button class="btn blue" onclick="viewProof('${esc(item.id)}')">View Proof</button>`:''}${state==='pending'?`<button class="btn ok" onclick="approve('${esc(item.id)}')">Approve</button><button class="btn bad" onclick="rejectE('${esc(item.id)}')">Reject</button>`:''}</div></div>`;
    }).join('')||'<div class="empty">No student enrolment applications found.</div>';

    const courseCards=(typeof CO!=='undefined'&&Array.isArray(CO)?CO:[]).map(course=>`<div class="card"><h3>${esc(course.title)}</h3><p>${typeof money==='function'?money(course.price):esc(course.price)} · ${esc(course.duration||'Flexible')}</p>${typeof statusBadge==='function'?statusBadge(course.active===false?'Inactive':'Active'):''}<div class="actions" style="margin-top:8px"><button class="btn light" onclick="price('${esc(course.id)}',${Number(course.price||0)})">Edit Price</button><button class="btn ${course.active===false?'ok':'bad'}" onclick="toggle('${esc(course.id)}',${course.active!==false})">${course.active===false?'Activate':'Deactivate'}</button></div></div>`).join('');

    if(typeof $!=='function'||!$('view'))return;
    $('view').innerHTML=
      (typeof head==='function'?head('Enrolments & Courses','Student applications, contact details, payment approvals, pricing and course catalogue.'):'')+
      (typeof metrics==='function'?metrics([['Pending student applications',pending],['Approved students',approved],['Rejected student applications',rejected],['Courses',coursesCount]]):'')+
      `<div class="panel"><h2>Student Register</h2><p>Only accounts with the Student role are shown here. Ambassador and Admin accounts remain in their own workspaces.</p>${renderStudentRegister()}</div>`+
      `<div class="panel"><h2>Student Applications</h2><div class="list">${applicationsHtml}</div></div>`+
      `<div class="panel"><h2>Course Portfolio & Pricing</h2><div class="grid">${courseCards}</div></div>`;
  }

  function install(){
    try{
      if(typeof enrolments==='function')enrolments=renderStudentEnrolments;
      window.FundaAdminStudentContactView={render:renderStudentEnrolments,studentProfiles:activeStudentProfiles};
    }catch(error){console.warn('Student contact admin view unavailable:',error);}
  }

  install();
  document.addEventListener('funda:admin-nav-ready',install);
})();
