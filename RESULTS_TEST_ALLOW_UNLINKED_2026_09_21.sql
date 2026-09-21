-- Test statements can be previewed before any genuine course_result exists.
-- Existing admin-only RLS remains in force. This migration does not change
-- course_results, assessment attempts, academic reviews, or certificates.
alter table public.result_statement_tests alter column result_id drop not null;
comment on column public.result_statement_tests.result_id is 'Optional source result. NULL is permitted only for controlled, non-official simulations prepared independently of learner academic records.';
