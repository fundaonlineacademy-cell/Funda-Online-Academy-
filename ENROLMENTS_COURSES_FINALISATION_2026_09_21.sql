-- Funda Online Academy — Enrolments & Courses finalisation
-- Owner-approved 21 September 2026.
-- Scope: mandatory enrolment rejection reasons, server-side enrolment audit,
-- and server-enforced governed course changes with CEO-only emergency override.

begin;

create or replace function public.guard_enrolment_review_requirements()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_old_status text := lower(coalesce(old.enrollment_status,old.status,''));
  v_new_status text := lower(coalesce(new.enrollment_status,new.status,''));
  v_actor uuid := auth.uid();
begin
  if v_new_status in ('approved','rejected')
     and v_new_status is distinct from v_old_status then
    if new.reviewed_at is null then
      raise exception 'A final enrolment decision requires a review timestamp.';
    end if;

    if v_actor is not null and new.reviewed_by is distinct from v_actor then
      raise exception 'The signed-in reviewer must be recorded on the enrolment decision.';
    end if;

    if v_new_status = 'rejected'
       and char_length(trim(coalesce(new.rejection_reason,''))) < 8 then
      raise exception 'A clear rejection reason of at least 8 characters is required.';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_guard_enrolment_review_requirements on public.enrollments;
create trigger trg_guard_enrolment_review_requirements
before update on public.enrollments
for each row
execute function public.guard_enrolment_review_requirements();

create or replace function public.audit_enrolment_decision()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_old_status text := lower(coalesce(old.enrollment_status,old.status,''));
  v_new_status text := lower(coalesce(new.enrollment_status,new.status,''));
  v_name text;
begin
  if v_new_status in ('approved','rejected')
     and v_new_status is distinct from v_old_status then
    select coalesce(p.full_name,p.email)
      into v_name
      from public.profiles p
     where p.id = coalesce(new.reviewed_by,auth.uid());

    insert into public.admin_audit_log(
      actor_id,
      action,
      department,
      entity_type,
      entity_id,
      details,
      source,
      status,
      responsible_person,
      occurred_on
    )
    values(
      coalesce(new.reviewed_by,auth.uid()),
      case when v_new_status='approved' then 'Approved enrolment' else 'Rejected enrolment' end,
      coalesce(new.approval_department,'Admissions'),
      'enrollment',
      new.id::text,
      pg_catalog.jsonb_build_object(
        'previous_status',v_old_status,
        'new_status',v_new_status,
        'student_id',new.student_id,
        'course_id',new.course_id,
        'rejection_reason',new.rejection_reason,
        'review_notes',new.review_notes
      )::text,
      'enrolment_review_trigger',
      'recorded',
      v_name,
      current_date
    );
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_audit_enrolment_decision on public.enrollments;
create trigger trg_audit_enrolment_decision
after update on public.enrollments
for each row
execute function public.audit_enrolment_decision();

create or replace function public.guard_governed_course_update()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_context text := current_setting('funda.course_governance_rpc',true);
  v_role text := coalesce(auth.role(),'');
begin
  if new.title is not distinct from old.title
     and new.price is not distinct from old.price
     and new.duration is not distinct from old.duration
     and new.description is not distinct from old.description
     and new.active is not distinct from old.active then
    return new;
  end if;

  if v_context='on'
     or v_role='service_role'
     or current_user in ('postgres','supabase_admin') then
    return new;
  end if;

  raise exception 'Course title, price, duration, description and availability must be changed through Course Governance.';
end;
$function$;

drop trigger if exists trg_guard_governed_course_update on public.courses;
create trigger trg_guard_governed_course_update
before update on public.courses
for each row
execute function public.guard_governed_course_update();

create or replace function public.guard_course_change_request_mutation()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_context text := current_setting('funda.course_governance_rpc',true);
  v_role text := coalesce(auth.role(),'');
begin
  if v_context='on'
     or v_role='service_role'
     or current_user in ('postgres','supabase_admin') then
    return new;
  end if;

  raise exception 'Course change requests must be created and reviewed through the governed course-change workflow.';
end;
$function$;

drop trigger if exists trg_guard_course_change_request_mutation on public.course_change_requests;
create trigger trg_guard_course_change_request_mutation
before insert or update or delete on public.course_change_requests
for each row
execute function public.guard_course_change_request_mutation();

create or replace function public.request_course_change_governed(
  p_course_id uuid,
  p_proposed_changes jsonb,
  p_reason text,
  p_override boolean default false,
  p_override_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_course public.courses%rowtype;
  v_request_id uuid;
  v_title text;
  v_duration text;
  v_description text;
  v_price numeric;
  v_active boolean;
  v_change_type text;
  v_reason text := trim(coalesce(p_reason,''));
  v_override_reason text := trim(coalesce(p_override_reason,''));
begin
  if v_actor is null then
    raise exception 'An authenticated Admin session is required.' using errcode='42501';
  end if;

  select * into v_profile from public.profiles where id=v_actor;
  if not found or lower(coalesce(v_profile.role,'')) <> 'admin' then
    raise exception 'Only an Admin may request a governed course change.' using errcode='42501';
  end if;

  select * into v_course from public.courses where id=p_course_id for update;
  if not found then
    raise exception 'Course not found.' using errcode='22023';
  end if;

  if char_length(v_reason) < 8 then
    raise exception 'A business reason or authorisation reference of at least 8 characters is required.' using errcode='22023';
  end if;

  if p_proposed_changes is null
     or exists (
       select 1 from jsonb_object_keys(p_proposed_changes) k
       where k not in ('title','price','duration','description','active')
     ) then
    raise exception 'Only title, price, duration, description and availability may be changed here.' using errcode='22023';
  end if;

  v_title := coalesce(p_proposed_changes->>'title',v_course.title);
  v_duration := coalesce(p_proposed_changes->>'duration',v_course.duration);
  v_description := coalesce(p_proposed_changes->>'description',v_course.description);
  begin
    v_price := coalesce((p_proposed_changes->>'price')::numeric,v_course.price);
    v_active := coalesce((p_proposed_changes->>'active')::boolean,v_course.active);
  exception when others then
    raise exception 'Price or availability value is invalid.' using errcode='22023';
  end;

  if char_length(trim(coalesce(v_title,'')))=0 then
    raise exception 'Course title cannot be empty.' using errcode='22023';
  end if;
  if char_length(trim(coalesce(v_duration,'')))=0 then
    raise exception 'Course duration cannot be empty.' using errcode='22023';
  end if;
  if v_price < 0 then
    raise exception 'Course price cannot be negative.' using errcode='22023';
  end if;

  v_change_type := case
    when v_active is distinct from v_course.active then case when v_active then 'activate' else 'deactivate' end
    else 'edit'
  end;

  if p_override then
    if lower(trim(coalesce(v_profile.job_title,''))) <> 'ceo' then
      raise exception 'Only the CEO account may use the emergency course-change override.' using errcode='42501';
    end if;
    if char_length(v_override_reason) < 8 then
      raise exception 'A clear CEO emergency-override reason of at least 8 characters is required.' using errcode='22023';
    end if;
  end if;

  perform pg_catalog.set_config('funda.course_governance_rpc','on',true);

  insert into public.course_change_requests(
    course_id,requested_by,change_type,proposed_changes,reason,status,
    approved_by,approved_at,approval_notes,override_used,override_reason
  )
  values(
    p_course_id,v_actor,v_change_type,
    pg_catalog.jsonb_build_object(
      'title',v_title,'price',v_price,'duration',v_duration,'description',v_description,'active',v_active
    ),
    v_reason,
    case when p_override then 'approved' else 'pending' end,
    case when p_override then v_actor else null end,
    case when p_override then now() else null end,
    case when p_override then 'CEO emergency override' else null end,
    p_override,
    case when p_override then v_override_reason else null end
  )
  returning id into v_request_id;

  insert into public.course_change_audit(
    course_id,request_id,actor_id,actor_email,actor_role,actor_job_title,actor_department,
    action,before_state,after_state,notes
  )
  values(
    p_course_id,v_request_id,v_actor,v_profile.email,v_profile.role,v_profile.job_title,v_profile.department,
    'COURSE CHANGE REQUESTED',to_jsonb(v_course),
    pg_catalog.jsonb_build_object(
      'title',v_title,'price',v_price,'duration',v_duration,'description',v_description,'active',v_active
    ),
    v_reason
  );

  if p_override then
    update public.courses
       set title=v_title,
           price=v_price,
           duration=v_duration,
           description=v_description,
           active=v_active,
           updated_at=now()
     where id=p_course_id;

    update public.course_change_requests
       set status='implemented',
           implemented_at=now(),
           implemented_by=v_actor
     where id=v_request_id;

    insert into public.course_change_audit(
      course_id,request_id,actor_id,actor_email,actor_role,actor_job_title,actor_department,
      action,before_state,after_state,notes
    )
    values(
      p_course_id,v_request_id,v_actor,v_profile.email,v_profile.role,v_profile.job_title,v_profile.department,
      'COURSE CHANGE IMPLEMENTED — CEO OVERRIDE',to_jsonb(v_course),
      pg_catalog.jsonb_build_object(
        'title',v_title,'price',v_price,'duration',v_duration,'description',v_description,'active',v_active
      ),
      v_override_reason
    );
  end if;

  return v_request_id;
end;
$function$;

create or replace function public.review_course_change_governed(
  p_request_id uuid,
  p_decision text,
  p_note text default null
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_request public.course_change_requests%rowtype;
  v_course public.courses%rowtype;
  v_decision text := lower(trim(coalesce(p_decision,'')));
  v_note text := trim(coalesce(p_note,''));
  v_title text;
  v_duration text;
  v_description text;
  v_price numeric;
  v_active boolean;
begin
  if v_actor is null then
    raise exception 'An authenticated Admin session is required.' using errcode='42501';
  end if;

  select * into v_profile from public.profiles where id=v_actor;
  if not found or lower(coalesce(v_profile.role,'')) <> 'admin' then
    raise exception 'Only an Admin may review a governed course change.' using errcode='42501';
  end if;

  select * into v_request
    from public.course_change_requests
   where id=p_request_id
   for update;

  if not found then
    raise exception 'Course change request not found.' using errcode='22023';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'Only a pending course change may be reviewed.' using errcode='22023';
  end if;

  if v_request.requested_by = v_actor then
    raise exception 'The requester cannot approve or reject their own governed course change.' using errcode='42501';
  end if;

  if v_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject.' using errcode='22023';
  end if;

  if v_decision='reject' and char_length(v_note) < 8 then
    raise exception 'A clear rejection reason of at least 8 characters is required.' using errcode='22023';
  end if;

  perform pg_catalog.set_config('funda.course_governance_rpc','on',true);

  if v_decision='reject' then
    update public.course_change_requests
       set status='rejected',
           approved_by=v_actor,
           approved_at=now(),
           approval_notes=v_note
     where id=p_request_id;

    insert into public.course_change_audit(
      course_id,request_id,actor_id,actor_email,actor_role,actor_job_title,actor_department,
      action,after_state,notes
    )
    values(
      v_request.course_id,p_request_id,v_actor,v_profile.email,v_profile.role,v_profile.job_title,v_profile.department,
      'COURSE CHANGE REJECTED',v_request.proposed_changes,v_note
    );

    return true;
  end if;

  select * into v_course from public.courses where id=v_request.course_id for update;
  if not found then
    raise exception 'Course not found.' using errcode='22023';
  end if;

  v_title := coalesce(v_request.proposed_changes->>'title',v_course.title);
  v_duration := coalesce(v_request.proposed_changes->>'duration',v_course.duration);
  v_description := coalesce(v_request.proposed_changes->>'description',v_course.description);
  begin
    v_price := coalesce((v_request.proposed_changes->>'price')::numeric,v_course.price);
    v_active := coalesce((v_request.proposed_changes->>'active')::boolean,v_course.active);
  exception when others then
    raise exception 'The stored course change contains an invalid price or availability value.' using errcode='22023';
  end;

  if char_length(trim(coalesce(v_title,'')))=0
     or char_length(trim(coalesce(v_duration,'')))=0
     or v_price < 0 then
    raise exception 'The stored course change does not pass course validation.' using errcode='22023';
  end if;

  update public.course_change_requests
     set status='approved',
         approved_by=v_actor,
         approved_at=now(),
         approval_notes=coalesce(nullif(v_note,''),'Approved in Course Governance')
   where id=p_request_id;

  update public.courses
     set title=v_title,
         price=v_price,
         duration=v_duration,
         description=v_description,
         active=v_active,
         updated_at=now()
   where id=v_request.course_id;

  update public.course_change_requests
     set status='implemented',
         implemented_at=now(),
         implemented_by=v_actor
   where id=p_request_id;

  insert into public.course_change_audit(
    course_id,request_id,actor_id,actor_email,actor_role,actor_job_title,actor_department,
    action,before_state,after_state,notes
  )
  values(
    v_request.course_id,p_request_id,v_actor,v_profile.email,v_profile.role,v_profile.job_title,v_profile.department,
    'COURSE CHANGE APPROVED & IMPLEMENTED',to_jsonb(v_course),
    pg_catalog.jsonb_build_object(
      'title',v_title,'price',v_price,'duration',v_duration,'description',v_description,'active',v_active
    ),
    coalesce(nullif(v_note,''),'Second-user approval')
  );

  return true;
end;
$function$;

revoke all on function public.request_course_change_governed(uuid,jsonb,text,boolean,text) from public;
revoke all on function public.request_course_change_governed(uuid,jsonb,text,boolean,text) from anon;
grant execute on function public.request_course_change_governed(uuid,jsonb,text,boolean,text) to authenticated;

revoke all on function public.review_course_change_governed(uuid,text,text) from public;
revoke all on function public.review_course_change_governed(uuid,text,text) from anon;
grant execute on function public.review_course_change_governed(uuid,text,text) to authenticated;

commit;


-- 21 September 2026 — final live Enrolments & Courses audit
-- Owner requested final operational verification of Student/course/status search,
-- Legacy Student Verification, live tracking, payment linkage and governed
-- course changes.
--
-- Front-end finalisation:
--   * admin-enrolments-safe.js uses the shared Admin Supabase client.
--   * Student / Course / Status filtering is explicit and live.
--   * payment badges use payments.enrolment_id, matching the server approval guard.
--   * unsubmitted enrolments do not expose an Approve action.
--   * Legacy Student Verification is called directly from Enrolments.
--   * admin-legacy-students.js is fail-safe, Realtime-driven and preserves
--     historical/orphaned claims whose original Student account was deleted.
--   * the Enrolments report covers payments, Legacy verification and governed
--     course-change audit evidence.
--
-- Realtime sources required by the approved Enrolments & Courses workflow.

do $$
declare
  t text;
begin
  foreach t in array array[
    'enrollments',
    'courses',
    'profiles',
    'payments',
    'students',
    'legacy_verification_claims',
    'legacy_student_records',
    'course_change_requests',
    'course_change_audit'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname='supabase_realtime'
        and schemaname='public'
        and tablename=t
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        t
      );
    end if;
  end loop;
end $$;


-- 21 September 2026 — owner physical review: reversible enrolment decisions
-- Final owner-requested corrections before lock:
--   * rejected enrolments may be re-approved once the original approval guards pass
--   * approved enrolments may be reversed/rejected with a mandatory reason
--   * protected Student learning access follows the final enrolment status
--   * Student progress is retained when access is temporarily removed
--   * rejected Students may resubmit corrected proof through Payments & Balance
--   * Admin may record externally received replacement proof (email/WhatsApp)
--     as a submitted payment for Finance review; this never bypasses Finance
--   * Course Catalogue descriptions are collapsed to avoid long scrolling
--   * Course Governance shows 5 recent events with full history in a modal
--
-- Audit trigger correction:
-- admin_audit_log.source only accepts 'system' or 'manual'.
-- The enrolment decision trigger previously used 'enrolment_review_trigger',
-- which caused a valid status reversal to fail at audit insertion time.

create or replace function public.audit_enrolment_decision()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_old_status text := lower(coalesce(old.enrollment_status,old.status,''));
  v_new_status text := lower(coalesce(new.enrollment_status,new.status,''));
  v_name text;
begin
  if v_new_status in ('approved','rejected')
     and v_new_status is distinct from v_old_status then
    select coalesce(p.full_name,p.email)
      into v_name
      from public.profiles p
     where p.id = coalesce(new.reviewed_by,auth.uid());

    insert into public.admin_audit_log(
      actor_id,
      action,
      department,
      entity_type,
      entity_id,
      details,
      source,
      status,
      responsible_person,
      occurred_on
    )
    values(
      coalesce(new.reviewed_by,auth.uid()),
      case
        when v_new_status='approved' then 'Approved enrolment'
        else 'Rejected enrolment'
      end,
      coalesce(new.approval_department,'Admissions'),
      'enrollment',
      new.id::text,
      pg_catalog.jsonb_build_object(
        'previous_status',v_old_status,
        'new_status',v_new_status,
        'student_id',new.student_id,
        'course_id',new.course_id,
        'rejection_reason',new.rejection_reason,
        'review_notes',new.review_notes
      )::text,
      'system',
      'recorded',
      v_name,
      current_date
    );
  end if;

  return new;
end;
$function$;
