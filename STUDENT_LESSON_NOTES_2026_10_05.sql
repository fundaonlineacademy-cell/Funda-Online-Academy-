-- Funda Online Academy — private Student lesson notes
-- 2026-10-05
-- Additive only. Gives each authenticated Student one private note per lesson.

begin;

create table if not exists public.student_lesson_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  note_text text not null check (
    char_length(btrim(note_text)) between 1 and 20000
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_lesson_notes_one_per_lesson unique (student_id, lesson_id)
);

comment on table public.student_lesson_notes is
  'Private learner-authored lesson notes. Students can access only their own rows.';

create index if not exists student_lesson_notes_course_recent_idx
  on public.student_lesson_notes (student_id, course_id, updated_at desc);
create index if not exists student_lesson_notes_course_fk_idx
  on public.student_lesson_notes (course_id);
create index if not exists student_lesson_notes_lesson_fk_idx
  on public.student_lesson_notes (lesson_id);

alter table public.student_lesson_notes enable row level security;

drop policy if exists "Students can view own lesson notes" on public.student_lesson_notes;
create policy "Students can view own lesson notes"
  on public.student_lesson_notes
  for select
  to authenticated
  using (student_id = (select auth.uid()));

drop policy if exists "Enrolled students can create own lesson notes" on public.student_lesson_notes;
create policy "Enrolled students can create own lesson notes"
  on public.student_lesson_notes
  for insert
  to authenticated
  with check (
    student_id = (select auth.uid())
    and exists (
      select 1
      from public.lessons l
      join public.course_modules cm on cm.id = l.module_id
      where l.id = student_lesson_notes.lesson_id
        and cm.course_id = student_lesson_notes.course_id
        and exists (
          select 1
          from public.enrollments e
          left join public.students s on s.id = e.student_id
          where e.course_id = cm.course_id
            and (
              e.student_id = (select auth.uid())
              or s.user_id = (select auth.uid())
            )
            and (
              lower(coalesce(e.enrollment_status,'')) in ('approved','completed','active','enrolled')
              or lower(coalesce(e.status,'')) in ('approved','completed','active','enrolled')
            )
        )
    )
  );

drop policy if exists "Enrolled students can update own lesson notes" on public.student_lesson_notes;
create policy "Enrolled students can update own lesson notes"
  on public.student_lesson_notes
  for update
  to authenticated
  using (student_id = (select auth.uid()))
  with check (
    student_id = (select auth.uid())
    and exists (
      select 1
      from public.lessons l
      join public.course_modules cm on cm.id = l.module_id
      where l.id = student_lesson_notes.lesson_id
        and cm.course_id = student_lesson_notes.course_id
        and exists (
          select 1
          from public.enrollments e
          left join public.students s on s.id = e.student_id
          where e.course_id = cm.course_id
            and (
              e.student_id = (select auth.uid())
              or s.user_id = (select auth.uid())
            )
            and (
              lower(coalesce(e.enrollment_status,'')) in ('approved','completed','active','enrolled')
              or lower(coalesce(e.status,'')) in ('approved','completed','active','enrolled')
            )
        )
    )
  );

revoke all on table public.student_lesson_notes from public, anon, authenticated;
grant select, insert, update on table public.student_lesson_notes to authenticated;
grant all on table public.student_lesson_notes to service_role;

commit;
