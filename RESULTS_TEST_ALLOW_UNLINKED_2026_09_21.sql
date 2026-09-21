-- Test statements can be previewed before any genuine course_result exists.
-- Test records stay admin-only, watermarked, and separate from the official result tables.
alter table public.result_statement_tests alter column result_id drop not null;
comment on column public.result_statement_tests.result_id is 'Optional source result. NULL is permitted only for controlled, non-official simulations prepared independently of learner academic records.';
