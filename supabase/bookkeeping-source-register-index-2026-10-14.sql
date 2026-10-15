-- Cover the lesson foreign key used by the private Bookkeeping source register.

create index if not exists academic_source_verifications_lesson_idx
  on private.academic_source_verifications (lesson_id);
