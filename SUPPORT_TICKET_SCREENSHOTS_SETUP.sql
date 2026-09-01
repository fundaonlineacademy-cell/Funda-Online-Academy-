-- Required, private screenshot evidence for all new student support tickets.
-- Existing tickets are retained as legacy records without screenshots.

alter table public.support_tickets
  add column if not exists screenshot_required boolean not null default false,
  add column if not exists screenshot_path text,
  add column if not exists screenshot_name text,
  add column if not exists screenshot_mime_type text,
  add column if not exists screenshot_size bigint;

alter table public.support_tickets
  alter column screenshot_required set default true;

alter table public.support_tickets
  drop constraint if exists support_tickets_screenshot_evidence_check;

alter table public.support_tickets
  add constraint support_tickets_screenshot_evidence_check
  check (
    screenshot_required = false
    or (
      student_id is not null
      and nullif(btrim(screenshot_path), '') is not null
      and screenshot_path like student_id::text || '/%'
      and nullif(btrim(screenshot_name), '') is not null
      and screenshot_mime_type in ('image/jpeg', 'image/png', 'image/webp')
      and screenshot_size between 1 and 5242880
    )
  );

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'support-ticket-screenshots',
  'support-ticket-screenshots',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Students can create own support tickets" on public.support_tickets;
create policy "Students can create own support tickets"
on public.support_tickets
for insert
to authenticated
with check (
  student_id = (select auth.uid())
  and screenshot_required = true
  and (storage.foldername(screenshot_path))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'student'
  )
);

drop policy if exists "Students upload own support screenshots" on storage.objects;
create policy "Students upload own support screenshots"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'support-ticket-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'student'
  )
);

drop policy if exists "Students view own support screenshots" on storage.objects;
create policy "Students view own support screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'support-ticket-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Students delete own support screenshots" on storage.objects;
create policy "Students delete own support screenshots"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'support-ticket-screenshots'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Admins view support screenshots" on storage.objects;
create policy "Admins view support screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'support-ticket-screenshots'
  and public.is_admin()
);
