-- Preserve the original UUID directory contract for enrolment tabs opened before rollout.
-- Updated clients explicitly request the directory that includes campaign promoters.
create or replace function public.get_onboarding_promotion_directory()
returns jsonb language sql stable security invoker set search_path='' as $$
 select onboarding_referral_private.directory();
$$;
revoke all on function public.get_onboarding_promotion_directory() from public,anon;
grant execute on function public.get_onboarding_promotion_directory() to authenticated;

create or replace function public.get_onboarding_ambassador_directory()
returns jsonb language sql stable security invoker set search_path='' as $$
 with directory as (select onboarding_referral_private.directory() as data),
 filtered as (
  select data,coalesce((select jsonb_agg(entry.item order by entry.ord)
   from jsonb_array_elements(coalesce(data->'ambassadors','[]'::jsonb)) with ordinality entry(item,ord)
   where coalesce(entry.item->>'kind','')<>'campaign'),'[]'::jsonb) as entries
  from directory
 )
 select data||jsonb_build_object('ambassadors',entries,'selected_id',case
  when exists(select 1 from jsonb_array_elements(entries) item where item->>'id'=data->>'selected_id')
    or data->'linked'->>'id'=data->>'selected_id' then data->'selected_id' else null end)
 from filtered;
$$;
revoke all on function public.get_onboarding_ambassador_directory() from public,anon;
grant execute on function public.get_onboarding_ambassador_directory() to authenticated;
notify pgrst,'reload schema';
