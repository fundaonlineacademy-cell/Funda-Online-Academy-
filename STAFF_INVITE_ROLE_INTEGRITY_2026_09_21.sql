-- Funda Online Academy — Staff invite role integrity and reconciliation
-- 2026-09-21
-- Fixes invited Staff accounts being initially classified as Students.
-- Preserves normal Student and Ambassador registration behaviour.

-- Correct the Staff Access Code pgcrypto schema references first.
-- The extension is installed in the "extensions" schema, not "public".
create or replace function public.sync_staff_access_credential()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(new.role,'')) in ('admin','staff')
     and nullif(pg_catalog.btrim(new.staff_code),'') is not null
     and (
       tg_op = 'INSERT'
       or new.staff_code is distinct from old.staff_code
       or new.role is distinct from old.role
     ) then
    insert into public.staff_access_credentials(
      profile_id,access_code_hash,failed_attempts,locked_until,rotated_at
    )
    values(
      new.id,
      extensions.crypt(new.staff_code, extensions.gen_salt('bf',12)),
      0,
      null,
      pg_catalog.now()
    )
    on conflict(profile_id) do update
      set access_code_hash=excluded.access_code_hash,
          failed_attempts=0,
          locked_until=null,
          rotated_at=excluded.rotated_at;
  elsif lower(coalesce(new.role,'')) not in ('admin','staff')
        or nullif(pg_catalog.btrim(new.staff_code),'') is null then
    delete from public.staff_access_credentials where profile_id=new.id;
  end if;
  return new;
end;
$$;

revoke all on function public.sync_staff_access_credential() from PUBLIC,anon,authenticated;

create or replace function public.verify_staff_access_code(p_staff_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role text;
  v_hash text;
  v_failed integer;
  v_locked timestamptz;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  select lower(coalesce(p.role,'')),c.access_code_hash,c.failed_attempts,c.locked_until
    into v_role,v_hash,v_failed,v_locked
  from public.profiles p
  left join public.staff_access_credentials c on c.profile_id=p.id
  where p.id=v_uid;

  if v_role not in ('admin','staff') then
    raise exception 'Staff or administrator access required' using errcode='42501';
  end if;

  if v_hash is null then
    return pg_catalog.jsonb_build_object('ok',false,'reason','not_configured');
  end if;

  if v_locked is not null and v_locked > pg_catalog.now() then
    return pg_catalog.jsonb_build_object(
      'ok',false,
      'reason','temporarily_locked',
      'locked_until',v_locked
    );
  end if;

  if extensions.crypt(coalesce(p_staff_code,''),v_hash)=v_hash then
    update public.staff_access_credentials
       set failed_attempts=0,
           locked_until=null,
           last_verified_at=pg_catalog.now()
     where profile_id=v_uid;
    return pg_catalog.jsonb_build_object('ok',true,'role',v_role);
  end if;

  v_failed := coalesce(v_failed,0)+1;
  update public.staff_access_credentials
     set failed_attempts=v_failed,
         locked_until=case when v_failed>=5 then pg_catalog.now()+interval '15 minutes' else null end
   where profile_id=v_uid;

  return pg_catalog.jsonb_build_object(
    'ok',false,
    'reason',case when v_failed>=5 then 'temporarily_locked' else 'invalid_code' end,
    'attempts_remaining',greatest(0,5-v_failed)
  );
end;
$$;

revoke all on function public.verify_staff_access_code(text) from PUBLIC,anon;
grant execute on function public.verify_staff_access_code(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_full_name text:=coalesce(new.raw_user_meta_data->>'full_name','');
  v_account_type text:=lower(coalesce(new.raw_user_meta_data->>'account_type','student'));
  v_declared_role text:=lower(coalesce(new.raw_user_meta_data->>'role',''));
  v_staff_department text:=nullif(new.raw_user_meta_data->>'department','');
  v_staff_invite boolean:=new.invited_at is not null
    and (v_account_type='staff' or v_declared_role='staff');
begin
  if v_staff_invite then
    if v_staff_department is null or v_staff_department not in (
      'Human Resources',
      'Finance & Accounting',
      'Academic, Assessments & Content',
      'Enrolments & Courses',
      'Student Support & CRM',
      'Marketing & Admissions',
      'Communication Hub',
      'IT, Security & Platform'
    ) then
      raise exception 'Invalid Staff department';
    end if;

    insert into public.profiles(
      id,full_name,email,phone,gender,role,staff_code,job_title,department
    )
    values(
      new.id,
      v_full_name,
      lower(coalesce(new.email,'')),
      coalesce(new.raw_user_meta_data->>'phone',''),
      null,
      'staff',
      nullif(new.raw_user_meta_data->>'staff_code',''),
      nullif(new.raw_user_meta_data->>'job_title',''),
      nullif(new.raw_user_meta_data->>'department','')
    )
    on conflict(id) do update
      set full_name=excluded.full_name,
          email=excluded.email,
          phone=excluded.phone,
          role='staff',
          staff_code=coalesce(excluded.staff_code,profiles.staff_code),
          job_title=coalesce(excluded.job_title,profiles.job_title),
          department=coalesce(excluded.department,profiles.department),
          updated_at=now();

    delete from public.students where user_id=new.id;
    return new;
  end if;

  if v_account_type in ('ambassador','ambassador_applicant') then
    insert into public.profiles(id,full_name,email,phone,gender,role)
    values(
      new.id,v_full_name,lower(coalesce(new.email,'')),
      coalesce(new.raw_user_meta_data->>'phone',''),null,'ambassador'
    )
    on conflict(id) do update
      set full_name=excluded.full_name,
          email=excluded.email,
          phone=excluded.phone,
          role='ambassador',
          updated_at=now();
    return new;
  end if;

  insert into public.profiles(id,full_name,email,phone,gender,role)
  values(
    new.id,v_full_name,lower(coalesce(new.email,'')),
    coalesce(new.raw_user_meta_data->>'phone',''),
    nullif(new.raw_user_meta_data->>'gender',''),
    'student'
  )
  on conflict(id) do update
    set full_name=excluded.full_name,
        email=excluded.email,
        phone=excluded.phone,
        gender=coalesce(excluded.gender,profiles.gender),
        updated_at=now();

  insert into public.students(user_id,full_name,gender,email,mobile_whatsapp)
  values(
    new.id,v_full_name,
    nullif(new.raw_user_meta_data->>'gender',''),
    lower(coalesce(new.email,'')),
    coalesce(new.raw_user_meta_data->>'phone','')
  )
  on conflict(user_id) do update
    set full_name=excluded.full_name,
        gender=coalesce(excluded.gender,students.gender),
        email=excluded.email,
        mobile_whatsapp=excluded.mobile_whatsapp,
        updated_at=now();

  return new;
end;
$$;

revoke all on function public.handle_new_user() from PUBLIC, anon, authenticated;

create or replace function public.finalize_staff_invitation(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_staff_code text,
  p_job_title text,
  p_department text,
  p_access_level text,
  p_can_approve boolean,
  p_invited_by uuid,
  p_start_date date default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then
    raise exception 'Service role required' using errcode='42501';
  end if;

  if p_access_level not in ('read','edit','manager') then
    raise exception 'Invalid staff access level';
  end if;

  if p_department not in (
    'Human Resources',
    'Finance & Accounting',
    'Academic, Assessments & Content',
    'Enrolments & Courses',
    'Student Support & CRM',
    'Marketing & Admissions',
    'Communication Hub',
    'IT, Security & Platform'
  ) then
    raise exception 'Invalid Staff department';
  end if;

  insert into public.profiles(
    id,full_name,email,role,staff_code,job_title,department,updated_at
  )
  values(
    p_user_id,
    pg_catalog.btrim(p_full_name),
    pg_catalog.lower(pg_catalog.btrim(p_email)),
    'staff',
    p_staff_code,
    nullif(pg_catalog.btrim(coalesce(p_job_title,'')),''),
    pg_catalog.btrim(p_department),
    pg_catalog.now()
  )
  on conflict(id) do update
    set full_name=excluded.full_name,
        email=excluded.email,
        role='staff',
        staff_code=excluded.staff_code,
        job_title=excluded.job_title,
        department=excluded.department,
        updated_at=pg_catalog.now();

  delete from public.students where user_id=p_user_id;

  insert into public.staff_records(
    profile_id,job_title,department,employment_status,start_date,notes,updated_at
  )
  values(
    p_user_id,
    nullif(pg_catalog.btrim(coalesce(p_job_title,'')),''),
    pg_catalog.btrim(p_department),
    'Active',
    p_start_date,
    p_notes,
    pg_catalog.now()
  )
  on conflict(profile_id) do update
    set job_title=excluded.job_title,
        department=excluded.department,
        employment_status='Active',
        start_date=coalesce(excluded.start_date,public.staff_records.start_date),
        notes=coalesce(excluded.notes,public.staff_records.notes),
        updated_at=pg_catalog.now();

  insert into public.staff_access_assignments(
    profile_id,department,access_level,can_approve,active,granted_by,granted_at
  )
  values(
    p_user_id,
    pg_catalog.btrim(p_department),
    p_access_level,
    coalesce(p_can_approve,false),
    true,
    p_invited_by,
    pg_catalog.now()
  )
  on conflict(profile_id,department) do update
    set access_level=excluded.access_level,
        can_approve=excluded.can_approve,
        active=true,
        granted_by=excluded.granted_by,
        granted_at=excluded.granted_at,
        revoked_by=null,
        revoked_at=null;

  insert into public.staff_invitations(
    email,full_name,staff_code,job_title,department,invited_user_id,invited_by,
    invitation_status,invited_at,notes
  )
  values(
    pg_catalog.lower(pg_catalog.btrim(p_email)),
    pg_catalog.btrim(p_full_name),
    p_staff_code,
    nullif(pg_catalog.btrim(coalesce(p_job_title,'')),''),
    pg_catalog.btrim(p_department),
    p_user_id,
    p_invited_by,
    'invited',
    pg_catalog.now(),
    p_notes
  )
  on conflict(staff_code) do update
    set email=excluded.email,
        full_name=excluded.full_name,
        job_title=excluded.job_title,
        department=excluded.department,
        invited_user_id=excluded.invited_user_id,
        invited_by=excluded.invited_by,
        notes=coalesce(excluded.notes,public.staff_invitations.notes);

  insert into public.hr_audit_log(
    actor_id,action,entity_type,entity_id,subject_profile_id,details
  )
  values(
    p_invited_by,
    'staff_invited',
    'profile',
    p_user_id::text,
    p_user_id,
    pg_catalog.jsonb_build_object(
      'email',pg_catalog.lower(pg_catalog.btrim(p_email)),
      'staff_code',p_staff_code,
      'job_title',p_job_title,
      'department',p_department,
      'access_level',p_access_level,
      'can_approve',coalesce(p_can_approve,false)
    )
  );

  return pg_catalog.jsonb_build_object('ok',true,'user_id',p_user_id,'staff_code',p_staff_code);
end;
$$;

revoke all on function public.finalize_staff_invitation(uuid,text,text,text,text,text,text,boolean,uuid,date,text)
from PUBLIC,anon,authenticated;
grant execute on function public.finalize_staff_invitation(uuid,text,text,text,text,text,text,boolean,uuid,date,text)
to service_role;

-- Reconcile only unambiguous invited Staff accounts that were incorrectly
-- classified as Students by the legacy auth trigger and have no learner activity.
with candidates as (
  select
    u.id,
    u.email,
    u.created_at,
    u.invited_at,
    u.confirmed_at,
    u.raw_user_meta_data,
    p.role
  from auth.users u
  join public.profiles p on p.id=u.id
  where u.invited_at is not null
    and lower(coalesce(u.raw_user_meta_data->>'role',''))='staff'
    and lower(coalesce(p.role,''))='student'
    and not exists(select 1 from public.enrollments e where e.student_id=u.id)
    and not exists(select 1 from public.payments py where py.student_id=u.id)
    and not exists(select 1 from public.assessment_attempts aa where aa.student_id=u.id)
    and not exists(select 1 from public.course_results cr where cr.student_id=u.id)
    and not exists(select 1 from public.certificates ce where ce.student_id=u.id)
)
update public.profiles p
set role='staff',
    full_name=coalesce(nullif(c.raw_user_meta_data->>'full_name',''),p.full_name),
    email=lower(coalesce(c.email,p.email)),
    staff_code=coalesce(nullif(c.raw_user_meta_data->>'staff_code',''),p.staff_code),
    job_title=coalesce(nullif(c.raw_user_meta_data->>'job_title',''),p.job_title),
    department=coalesce(nullif(c.raw_user_meta_data->>'department',''),p.department),
    updated_at=now()
from candidates c
where p.id=c.id;

insert into public.staff_records(
  profile_id,job_title,department,employment_status,start_date,notes
)
select
  u.id,
  nullif(u.raw_user_meta_data->>'job_title',''),
  nullif(u.raw_user_meta_data->>'department',''),
  'Active',
  null,
  'Recovered from authenticated Staff invite metadata after legacy role-classification failure.'
from auth.users u
join public.profiles p on p.id=u.id
where u.invited_at is not null
  and lower(coalesce(u.raw_user_meta_data->>'role',''))='staff'
  and p.role='staff'
  and not exists(select 1 from public.staff_records sr where sr.profile_id=u.id)
on conflict(profile_id) do nothing;

insert into public.staff_invitations(
  email,full_name,staff_code,job_title,department,invited_user_id,invited_by,
  invitation_status,invited_at,accepted_at,notes
)
select
  lower(coalesce(u.email,'')),
  coalesce(nullif(u.raw_user_meta_data->>'full_name',''),p.full_name,'Staff member'),
  coalesce(nullif(u.raw_user_meta_data->>'staff_code',''),p.staff_code),
  coalesce(nullif(u.raw_user_meta_data->>'job_title',''),p.job_title),
  coalesce(nullif(u.raw_user_meta_data->>'department',''),p.department),
  u.id,
  null,
  case when u.confirmed_at is not null then 'accepted' else 'invited' end,
  coalesce(u.invited_at,u.created_at),
  u.confirmed_at,
  'Recovered from authenticated Staff invite metadata after legacy role-classification failure.'
from auth.users u
join public.profiles p on p.id=u.id
where u.invited_at is not null
  and lower(coalesce(u.raw_user_meta_data->>'role',''))='staff'
  and p.role='staff'
  and coalesce(nullif(u.raw_user_meta_data->>'staff_code',''),p.staff_code) is not null
  and not exists(select 1 from public.staff_invitations si where si.invited_user_id=u.id)
on conflict(staff_code) do nothing;

delete from public.students s
using auth.users u, public.profiles p
where s.user_id=u.id
  and p.id=u.id
  and p.role='staff'
  and u.invited_at is not null
  and lower(coalesce(u.raw_user_meta_data->>'role',''))='staff'
  and not exists(select 1 from public.enrollments e where e.student_id=u.id)
  and not exists(select 1 from public.payments py where py.student_id=u.id)
  and not exists(select 1 from public.assessment_attempts aa where aa.student_id=u.id)
  and not exists(select 1 from public.course_results cr where cr.student_id=u.id)
  and not exists(select 1 from public.certificates ce where ce.student_id=u.id);

insert into public.hr_audit_log(
  actor_id,action,entity_type,entity_id,subject_profile_id,details
)
select
  null,
  'staff_invite_reconciled',
  'profile',
  u.id::text,
  u.id,
  pg_catalog.jsonb_build_object(
    'reason','Legacy auth trigger classified an authenticated Staff invite as Student',
    'declared_role',u.raw_user_meta_data->>'role',
    'department',u.raw_user_meta_data->>'department',
    'staff_code',u.raw_user_meta_data->>'staff_code'
  )
from auth.users u
join public.profiles p on p.id=u.id
where u.invited_at is not null
  and lower(coalesce(u.raw_user_meta_data->>'role',''))='staff'
  and p.role='staff'
  and not exists(
    select 1 from public.hr_audit_log h
    where h.subject_profile_id=u.id and h.action='staff_invite_reconciled'
  );
