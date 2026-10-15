-- Keep PCA and course-end SECURITY DEFINER entry points authenticated-only.

revoke execute on function public.save_pca_draft(uuid, jsonb, boolean) from public, anon;
grant execute on function public.save_pca_draft(uuid, jsonb, boolean) to authenticated, service_role;

revoke execute on function public.get_course_end_structure(uuid) from public, anon;
grant execute on function public.get_course_end_structure(uuid) to authenticated, service_role;

