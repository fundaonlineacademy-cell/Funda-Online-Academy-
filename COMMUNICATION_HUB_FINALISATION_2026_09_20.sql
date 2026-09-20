-- Funda Online Academy — Communication Hub finalisation
-- Owner-approved 20 September 2026.
-- Scope: Communication Hub readability/management support, all-Funda recipient sync,
-- and automatic scheduled email dispatch. Preserve all unrelated Student/Admin behaviour.

begin;

alter table public.communications
  add column if not exists email_requested boolean not null default false,
  add column if not exists email_delivery_status text not null default 'not_requested',
  add column if not exists email_dispatched_at timestamptz,
  add column if not exists email_last_error text;

create index if not exists communications_scheduled_email_idx
  on public.communications (published, email_requested, email_delivery_status, scheduled_at)
  where email_requested = true;

create or replace function public.sync_communication_recipients()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_audience text := lower(replace(coalesce(new.audience,''),' ','_'));
begin
  if coalesce(new.published,false) is not true then
    return new;
  end if;

  delete from public.communication_recipients where communication_id = new.id;

  if v_audience = 'all_students' then
    insert into public.communication_recipients(communication_id,student_id,delivered_at)
    select new.id,p.id,coalesce(new.published_at,now())
      from public.profiles p
     where lower(coalesce(p.role,'')) = 'student'
    on conflict do nothing;

  elsif v_audience = 'active_students' then
    insert into public.communication_recipients(communication_id,student_id,delivered_at)
    select distinct new.id,e.student_id,coalesce(new.published_at,now())
      from public.enrollments e
     where lower(coalesce(e.enrollment_status,e.status,'')) in ('approved','active','completed')
    on conflict do nothing;

  elsif v_audience = 'course' and new.course_id is not null then
    insert into public.communication_recipients(communication_id,student_id,delivered_at)
    select distinct new.id,e.student_id,coalesce(new.published_at,now())
      from public.enrollments e
     where e.course_id = new.course_id
       and lower(coalesce(e.enrollment_status,e.status,'')) in ('approved','active','completed')
    on conflict do nothing;

  elsif v_audience in ('student','selected_students') and new.recipient_id is not null then
    insert into public.communication_recipients(communication_id,student_id,delivered_at)
    values(new.id,new.recipient_id,coalesce(new.published_at,now()))
    on conflict do nothing;

  elsif v_audience = 'staff' then
    insert into public.communication_recipients(communication_id,student_id,delivered_at)
    select new.id,p.id,coalesce(new.published_at,now())
      from public.profiles p
     where lower(coalesce(p.role,'')) in ('admin','staff','manager')
    on conflict do nothing;

  elsif v_audience = 'all_funda' then
    insert into public.communication_recipients(communication_id,student_id,delivered_at)
    select new.id,p.id,coalesce(new.published_at,now())
      from public.profiles p
     where lower(coalesce(p.role,'')) in ('student','admin','staff','manager')
    on conflict do nothing;
  end if;

  return new;
end;
$function$;

-- Backfill the currently published all-Funda notices through the same protected trigger.
update public.communications
   set published_at = published_at,
       updated_at = now()
 where published = true
   and lower(replace(coalesce(audience,''),' ','_')) = 'all_funda';

create or replace function public.run_scheduled_communication_cycle()
returns bigint
language plpgsql
security definer
set search_path to 'public','pg_temp','net'
as $function$
declare
  v_secret text;
  v_request bigint;
begin
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
$function$;

do $do$
begin
  if exists (select 1 from cron.job where jobname='funda_publish_due_communications') then
    perform cron.unschedule('funda_publish_due_communications');
  end if;
  if exists (select 1 from cron.job where jobname='funda_scheduled_communication_cycle') then
    perform cron.unschedule('funda_scheduled_communication_cycle');
  end if;
end
$do$;

select cron.schedule(
  'funda_scheduled_communication_cycle',
  '* * * * *',
  'select public.run_scheduled_communication_cycle();'
);

commit;
