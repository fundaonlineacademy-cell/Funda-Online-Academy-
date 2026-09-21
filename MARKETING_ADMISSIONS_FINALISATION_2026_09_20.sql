-- Funda Online Academy — Marketing & Admissions finalisation
-- Owner-approved 20 September 2026.
-- Adds automatic execution for scheduled consent-based email campaigns.
-- No Student Portal or unrelated Admin behaviour is changed.

begin;

create or replace function public.run_scheduled_marketing_cycle()
returns bigint
language plpgsql
security definer
set search_path to 'public','pg_temp','net'
as $function$
declare
  v_secret text;
  v_request bigint;
begin
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
$function$;

do $do$
begin
  if exists (select 1 from cron.job where jobname='funda_scheduled_marketing_cycle') then
    perform cron.unschedule('funda_scheduled_marketing_cycle');
  end if;
end
$do$;

select cron.schedule(
  'funda_scheduled_marketing_cycle',
  '* * * * *',
  'select public.run_scheduled_marketing_cycle();'
);

commit;


-- 21 September 2026 — final Marketing & Admissions audit
-- Adds governed Admissions ownership/follow-up history, Realtime sources,
-- removes anonymous direct subscriber-table writes, and keeps the scheduler
-- cron-only. Public subscribe/resubscribe is handled by the marketing-subscribe
-- Edge Function recorded under supabase/functions/marketing-subscribe/index.ts.

alter table public.marketing_leads
  add column if not exists assigned_to uuid null references public.profiles(id) on delete set null,
  add column if not exists next_follow_up_at timestamptz null,
  add column if not exists converted_at timestamptz null;

create index if not exists marketing_leads_assigned_to_idx
  on public.marketing_leads(assigned_to);

create index if not exists marketing_leads_follow_up_idx
  on public.marketing_leads(next_follow_up_at)
  where lower(coalesce(status,'')) not in ('converted','closed');

create table if not exists public.marketing_lead_history(
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.marketing_leads(id) on delete cascade,
  actor_id uuid null references public.profiles(id) on delete set null,
  from_status text null,
  to_status text null,
  from_assigned_to uuid null references public.profiles(id) on delete set null,
  to_assigned_to uuid null references public.profiles(id) on delete set null,
  from_follow_up_at timestamptz null,
  to_follow_up_at timestamptz null,
  notes_changed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists marketing_lead_history_lead_idx
  on public.marketing_lead_history(lead_id,created_at desc);
create index if not exists marketing_lead_history_actor_idx
  on public.marketing_lead_history(actor_id);
create index if not exists marketing_lead_history_from_owner_idx
  on public.marketing_lead_history(from_assigned_to);
create index if not exists marketing_lead_history_to_owner_idx
  on public.marketing_lead_history(to_assigned_to);

alter table public.marketing_lead_history enable row level security;
grant select,insert on public.marketing_lead_history to authenticated;

drop policy if exists "Admins manage marketing lead history"
  on public.marketing_lead_history;
create policy "Admins manage marketing lead history"
on public.marketing_lead_history
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create or replace function public.get_admin_marketing_owners()
returns table(
  id uuid,
  full_name text,
  email text,
  role text,
  department text,
  job_title text
)
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  return query
  select p.id,p.full_name,p.email,p.role,p.department,p.job_title
  from public.profiles p
  where lower(coalesce(p.role,'')) in ('admin','staff','manager')
    and lower(coalesce(p.email,'')) not like '%@deleted.funda.invalid'
  order by
    case when p.id=auth.uid() then 0 else 1 end,
    lower(coalesce(p.full_name,p.email,''));
end;
$function$;

create or replace function public.get_admin_marketing_lead_history()
returns table(
  id uuid,
  lead_id uuid,
  actor_id uuid,
  actor_name text,
  from_status text,
  to_status text,
  from_assigned_to uuid,
  to_assigned_to uuid,
  from_assigned_name text,
  to_assigned_name text,
  from_follow_up_at timestamptz,
  to_follow_up_at timestamptz,
  notes_changed boolean,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  return query
  select h.id,h.lead_id,h.actor_id,
         coalesce(actor.full_name,actor.email,'System') as actor_name,
         h.from_status,h.to_status,
         h.from_assigned_to,h.to_assigned_to,
         coalesce(f.full_name,f.job_title,f.email,'') as from_assigned_name,
         coalesce(t.full_name,t.job_title,t.email,'') as to_assigned_name,
         h.from_follow_up_at,h.to_follow_up_at,h.notes_changed,h.created_at
  from public.marketing_lead_history h
  left join public.profiles actor on actor.id=h.actor_id
  left join public.profiles f on f.id=h.from_assigned_to
  left join public.profiles t on t.id=h.to_assigned_to
  order by h.created_at desc;
end;
$function$;

create or replace function public.admin_save_marketing_lead(
  p_id uuid default null,
  p_full_name text default null,
  p_email text default null,
  p_phone text default null,
  p_source text default null,
  p_course_interest text default null,
  p_status text default 'New',
  p_notes text default null,
  p_assigned_to uuid default null,
  p_next_follow_up_at timestamptz default null
)
returns uuid
language plpgsql
security invoker
set search_path to 'public','pg_temp'
as $function$
declare
  v_actor uuid := auth.uid();
  v_id uuid := coalesce(p_id,gen_random_uuid());
  v_name text := trim(coalesce(p_full_name,''));
  v_email text := nullif(lower(trim(coalesce(p_email,''))),'');
  v_phone text := nullif(trim(coalesce(p_phone,'')),'');
  v_source text := nullif(trim(coalesce(p_source,'')),'');
  v_interest text := nullif(trim(coalesce(p_course_interest,'')),'');
  v_status text := case lower(trim(coalesce(p_status,'new')))
    when 'new' then 'New'
    when 'contacted' then 'Contacted'
    when 'follow-up' then 'Follow-Up'
    when 'follow_up' then 'Follow-Up'
    when 'follow up' then 'Follow-Up'
    when 'converted' then 'Converted'
    when 'closed' then 'Closed'
    else ''
  end;
  v_notes text := nullif(trim(coalesce(p_notes,'')),'');
  old_row public.marketing_leads%rowtype;
begin
  if v_actor is null or not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  if char_length(v_name)<2 or char_length(v_name)>160 then
    raise exception 'Lead name must be between 2 and 160 characters.';
  end if;

  if v_email is not null
     and (position('@' in v_email)<2 or char_length(v_email)>320) then
    raise exception 'Enter a valid lead email address.';
  end if;

  if v_phone is not null and char_length(v_phone)>50 then
    raise exception 'Lead phone number is too long.';
  end if;

  if v_status='' then
    raise exception 'Choose a valid Admissions lead status.';
  end if;

  if p_assigned_to is not null and not exists (
    select 1
    from public.profiles p
    where p.id=p_assigned_to
      and lower(coalesce(p.role,'')) in ('admin','staff','manager')
      and lower(coalesce(p.email,'')) not like '%@deleted.funda.invalid'
  ) then
    raise exception 'Choose a valid active lead owner.';
  end if;

  if v_status in ('Contacted','Follow-Up') and p_assigned_to is null then
    raise exception 'Assign a lead owner before moving the lead into follow-up.';
  end if;

  if v_status='Follow-Up' and p_next_follow_up_at is null then
    raise exception 'Set the next follow-up date and time.';
  end if;

  if p_next_follow_up_at is not null
     and p_next_follow_up_at<now()
     and v_status not in ('Converted','Closed') then
    raise exception 'Next follow-up must be in the future.';
  end if;

  if p_id is null then
    insert into public.marketing_leads(
      id,full_name,email,phone,source,course_interest,status,notes,
      assigned_to,next_follow_up_at,converted_at,created_at,updated_at
    )
    values(
      v_id,v_name,v_email,v_phone,v_source,v_interest,v_status,v_notes,
      p_assigned_to,
      case when v_status in ('Converted','Closed') then null else p_next_follow_up_at end,
      case when v_status='Converted' then now() else null end,
      now(),now()
    );

    insert into public.marketing_lead_history(
      lead_id,actor_id,to_status,to_assigned_to,to_follow_up_at,notes_changed
    )
    values(
      v_id,v_actor,v_status,p_assigned_to,
      case when v_status in ('Converted','Closed') then null else p_next_follow_up_at end,
      v_notes is not null
    );
  else
    select *
      into old_row
      from public.marketing_leads
     where id=p_id
     for update;

    if not found then
      raise exception 'Marketing lead not found.';
    end if;

    update public.marketing_leads
       set full_name=v_name,
           email=v_email,
           phone=v_phone,
           source=v_source,
           course_interest=v_interest,
           status=v_status,
           notes=v_notes,
           assigned_to=p_assigned_to,
           next_follow_up_at=case
             when v_status in ('Converted','Closed') then null
             else p_next_follow_up_at
           end,
           converted_at=case
             when v_status='Converted' then coalesce(old_row.converted_at,now())
             else null
           end,
           updated_at=now()
     where id=p_id;

    if old_row.status is distinct from v_status
       or old_row.assigned_to is distinct from p_assigned_to
       or old_row.next_follow_up_at is distinct from
          (case when v_status in ('Converted','Closed') then null else p_next_follow_up_at end)
       or old_row.notes is distinct from v_notes then
      insert into public.marketing_lead_history(
        lead_id,actor_id,from_status,to_status,
        from_assigned_to,to_assigned_to,
        from_follow_up_at,to_follow_up_at,notes_changed
      )
      values(
        p_id,v_actor,old_row.status,v_status,
        old_row.assigned_to,p_assigned_to,
        old_row.next_follow_up_at,
        case when v_status in ('Converted','Closed') then null else p_next_follow_up_at end,
        old_row.notes is distinct from v_notes
      );
    end if;
  end if;

  if to_regclass('public.admin_audit_log') is not null then
    insert into public.admin_audit_log(
      actor_id,action,department,entity_type,entity_id
    )
    values(
      v_actor,
      case when p_id is null
        then 'Created Marketing lead'
        else 'Updated Marketing lead'
      end,
      'Marketing & Admissions',
      'marketing_lead',
      v_id::text
    );
  end if;

  return v_id;
end;
$function$;

revoke execute on function public.get_admin_marketing_owners()
  from public,anon;
revoke execute on function public.get_admin_marketing_lead_history()
  from public,anon;
revoke execute on function public.admin_save_marketing_lead(
  uuid,text,text,text,text,text,text,text,uuid,timestamptz
) from public,anon;

grant execute on function public.get_admin_marketing_owners()
  to authenticated;
grant execute on function public.get_admin_marketing_lead_history()
  to authenticated;
grant execute on function public.admin_save_marketing_lead(
  uuid,text,text,text,text,text,text,text,uuid,timestamptz
) to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'marketing_leads',
    'marketing_lead_history',
    'marketing_subscribers',
    'marketing_campaigns',
    'marketing_campaign_events',
    'marketing_page_views'
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

-- The public website now invokes the marketing-subscribe Edge Function.
-- It therefore no longer needs anonymous direct writes to this table.
drop policy if exists "Anyone may subscribe to marketing"
  on public.marketing_subscribers;
revoke insert on public.marketing_subscribers from anon;

-- Scheduled Marketing is owned by pg_cron + the dispatch secret.
revoke execute on function public.run_scheduled_marketing_cycle()
  from public,anon,authenticated;


-- 21 September 2026 — Marketing final physical-review corrections
-- Owner review identified unnecessary Ambassador cross-functional duplication
-- and ambiguous cumulative traffic labelling in Marketing & Admissions.
--
-- Source-side corrections:
--   * Ambassador finance snapshot removed from Marketing.
--   * Ambassador Marketing Channel compacted/collapsed.
--   * Ambassador Marketing control restricted to marketing notices.
--   * Marketing traffic now uses explicit 24h/7d/30d view + session windows.
--   * Global timed Admin refresh removed from the Admin wrapper.
--   * Marketing live refresh is tab-scoped and edit-safe.
--
-- These Ambassador marketing sources are now authoritative Realtime inputs.

do $$
declare t text;
begin
  foreach t in array array[
    'ambassador_marketing_resources',
    'ambassador_notifications'
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
