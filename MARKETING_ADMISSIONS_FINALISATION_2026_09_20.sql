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
