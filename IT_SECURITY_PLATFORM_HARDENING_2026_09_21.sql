-- Funda Online Academy — IT, Security & Platform hardening
-- 2026-09-21
-- Additive/idempotent security corrections only. No production records are fabricated.

create table if not exists public.staff_access_credentials (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  access_code_hash text not null,
  failed_attempts integer not null default 0,
  locked_until timestamptz null,
  last_verified_at timestamptz null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz not null default now()
);

alter table public.staff_access_credentials enable row level security;
revoke all on table public.staff_access_credentials from anon, authenticated;
grant all on table public.staff_access_credentials to service_role;

insert into public.staff_access_credentials(profile_id,access_code_hash)
select p.id, crypt(p.staff_code, gen_salt('bf',12))
from public.profiles p
where lower(coalesce(p.role,'')) in ('admin','staff')
  and nullif(btrim(p.staff_code),'') is not null
on conflict (profile_id) do nothing;

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
      public.crypt(new.staff_code, public.gen_salt('bf',12)),
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

drop trigger if exists trg_sync_staff_access_credential on public.profiles;
create trigger trg_sync_staff_access_credential
after insert or update of staff_code,role on public.profiles
for each row execute function public.sync_staff_access_credential();

revoke all on function public.sync_staff_access_credential() from PUBLIC, anon, authenticated;

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

  if public.crypt(coalesce(p_staff_code,''),v_hash)=v_hash then
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

revoke all on function public.verify_staff_access_code(text) from PUBLIC, anon;
grant execute on function public.verify_staff_access_code(text) to authenticated;

create or replace function public.guard_security_incident_resolution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if lower(coalesce(new.status,'')) in ('resolved','closed') then
    if char_length(pg_catalog.btrim(coalesce(new.resolution_notes,''))) < 5 then
      raise exception 'Resolution notes are required before a security incident can be resolved or closed.';
    end if;
    if lower(coalesce(new.severity,'')) in ('high','critical') and new.assigned_to is null then
      raise exception 'High and critical incidents must be assigned before resolution.';
    end if;
    if new.resolved_at is null then
      new.resolved_at := pg_catalog.now();
    end if;
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists trg_guard_security_incident_resolution on public.security_incidents;
create trigger trg_guard_security_incident_resolution
before insert or update of status,resolution_notes,assigned_to,severity
on public.security_incidents
for each row execute function public.guard_security_incident_resolution();

revoke all on function public.guard_security_incident_resolution() from PUBLIC, anon, authenticated;

create or replace function public.run_scheduled_communication_cycle()
returns bigint
language plpgsql
security definer
set search_path to 'public','pg_temp','net'
as $$
declare
  v_secret text;
  v_request bigint;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  perform public.publish_due_communications();

  select dispatch_secret
    into v_secret
    from public.academy_notification_config
   where singleton=true;

  if coalesce(v_secret,'') = '' then
    raise exception 'Communication dispatch secret is unavailable';
  end if;

  select net.http_post(
    url := 'https://nzwfowwoazmpnwfrednh.supabase.co/functions/v1/dispatch-scheduled-communications',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-funda-dispatch-secret',v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) into v_request;

  return v_request;
end;
$$;

create or replace function public.run_scheduled_marketing_cycle()
returns bigint
language plpgsql
security definer
set search_path to 'public','pg_temp','net'
as $$
declare
  v_secret text;
  v_request bigint;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select dispatch_secret
    into v_secret
    from public.academy_notification_config
   where singleton=true;

  if coalesce(v_secret,'') = '' then
    raise exception 'Marketing dispatch secret is unavailable';
  end if;

  select net.http_post(
    url := 'https://nzwfowwoazmpnwfrednh.supabase.co/functions/v1/dispatch-scheduled-marketing-campaigns',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'x-funda-dispatch-secret',v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) into v_request;

  return v_request;
end;
$$;

revoke execute on function public.run_scheduled_communication_cycle() from PUBLIC, anon;
revoke execute on function public.run_scheduled_marketing_cycle() from PUBLIC, anon;
grant execute on function public.run_scheduled_communication_cycle() to authenticated, service_role;
grant execute on function public.run_scheduled_marketing_cycle() to authenticated, service_role;

-- Trigger helpers are internal database controls and should not be directly callable.
revoke execute on function public.assign_funda_student_number() from PUBLIC, anon, authenticated;
revoke execute on function public.audit_enrolment_decision() from PUBLIC, anon, authenticated;
revoke execute on function public.guard_ambassador_application_approval() from PUBLIC, anon, authenticated;
revoke execute on function public.guard_ambassador_payout() from PUBLIC, anon, authenticated;
revoke execute on function public.guard_course_change_request_mutation() from PUBLIC, anon, authenticated;
revoke execute on function public.guard_enrollment_approval() from PUBLIC, anon, authenticated;
revoke execute on function public.guard_enrolment_review_requirements() from PUBLIC, anon, authenticated;
revoke execute on function public.guard_finance_cashbook_update() from PUBLIC, anon, authenticated;
revoke execute on function public.guard_governed_course_update() from PUBLIC, anon, authenticated;
revoke execute on function public.refresh_academic_result_after_attempt() from PUBLIC, anon, authenticated;
revoke execute on function public.sync_communication_recipients() from PUBLIC, anon, authenticated;
revoke execute on function public.sync_summative_pass_to_module_progress() from PUBLIC, anon, authenticated;

-- Authenticated/admin workflows remain available, but anonymous invocation is removed.
revoke execute on function public.admin_award_ambassador_monthly_performance(uuid,date,numeric,text) from PUBLIC, anon;
grant execute on function public.admin_award_ambassador_monthly_performance(uuid,date,numeric,text) to authenticated;
revoke execute on function public.compile_academic_result(uuid,uuid) from PUBLIC, anon;
grant execute on function public.compile_academic_result(uuid,uuid) to authenticated;
revoke execute on function public.finance_payment_queue() from PUBLIC, anon;
grant execute on function public.finance_payment_queue() to authenticated;
revoke execute on function public.finance_receivables() from PUBLIC, anon;
grant execute on function public.finance_receivables() to authenticated;
revoke execute on function public.get_admin_finance_period(date,date) from PUBLIC, anon;
grant execute on function public.get_admin_finance_period(date,date) to authenticated;
revoke execute on function public.get_admin_finance_snapshot() from PUBLIC, anon;
grant execute on function public.get_admin_finance_snapshot() to authenticated;
revoke execute on function public.get_learning_workspace_course(uuid) from PUBLIC, anon;
grant execute on function public.get_learning_workspace_course(uuid) to authenticated;
revoke execute on function public.prepare_result_statement_test(uuid) from PUBLIC, anon;
grant execute on function public.prepare_result_statement_test(uuid) to authenticated;
revoke execute on function public.prepare_statement_of_results(uuid) from PUBLIC, anon;
grant execute on function public.prepare_statement_of_results(uuid) to authenticated;
revoke execute on function public.has_department_approval(text) from PUBLIC, anon;
grant execute on function public.has_department_approval(text) to authenticated;

-- Calendar reminder generation existed but had no active schedule.
do $$
begin
  if not exists(select 1 from cron.job where jobname='funda_calendar_notification_cycle') then
    perform cron.schedule(
      'funda_calendar_notification_cycle',
      '* * * * *',
      'select public.run_calendar_notification_cycle();'
    );
  end if;
end;
$$;
