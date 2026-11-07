-- Fix the active-course check in the November 2026 combined checkout RPCs.
-- public.courses uses "active" (boolean), not "is_active".
-- This narrowly patches the two functions without changing payment amounts,
-- permissions, enrolments, existing checkouts or other course logic.
DO $fix$
DECLARE
  v_prepare oid := to_regprocedure('course_checkout_private.prepare(uuid[],jsonb,uuid)')::oid;
  v_submit oid := to_regprocedure('course_checkout_private.submit(uuid,numeric,text,text,text,text)')::oid;
  v_target oid;
  v_definition text;
  v_bad_references integer;
BEGIN
  IF v_prepare IS NULL OR v_submit IS NULL THEN
    RAISE EXCEPTION 'Expected combined-checkout functions are missing; aborting.';
  END IF;
  FOR v_target IN SELECT unnest(ARRAY[v_prepare,v_submit]) LOOP
    v_definition := pg_get_functiondef(v_target);
    v_bad_references := (length(v_definition) - length(replace(v_definition,'c.is_active',''))) / length('c.is_active');
    IF v_bad_references <> 1 THEN
      RAISE EXCEPTION 'Expected one invalid course-active reference in function %, found %; aborting.',v_target::regprocedure,v_bad_references;
    END IF;
    EXECUTE replace(v_definition,'c.is_active','c.active');
  END LOOP;
END
$fix$;
